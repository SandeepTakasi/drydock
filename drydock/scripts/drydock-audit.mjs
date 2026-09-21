/**
 * Structural validation and ownership auditing for Drydock plans.
 * Node built-ins only. No dependencies, and no stdlib call newer than Node 20.
 *
 *   node drydock-audit.mjs validate-plan [--strict] <plan.md>
 *   node drydock-audit.mjs audit-wave <plan.md> <wave>
 *
 * WHY THIS EXISTS. planwright requires every task it writes to carry "one
 * command that exits 0", and planwright's own output carried none — the plan
 * was checked by a model reading its own work. `validate-plan` is that command.
 * Separately, wavecheck's ownership audit was a model eyeballing diffs; the
 * checks it performs (changed-set vs `owns`, per-task attribution, tree clean)
 * are mechanical, so `audit-wave` computes them and wavecheck spends its
 * judgment on the checks that need judgment.
 *
 * SHOWS ITS WORK, ALWAYS. A wrong script is more dangerous than a wrong model
 * here, because it looks authoritative. Every run prints the commit SHAs and
 * the per-task file lists it derived, so a human reading a wavecheck report can
 * see what the audit saw and disagree with it. There is no bare verdict mode.
 *
 * LENIENT BY DEFAULT. The existing corpus predates this script: plans number
 * their headings (`## 1. Requirement`) where the contract writes them bare, and
 * plans written before the Testing Gate was inserted at position 11 have a
 * different section set entirely. A validator that fails every plan in the repo
 * on the day it ships is a validator somebody disables in a week, so section
 * order and Testing Gate completeness are `--strict` only. Structural defects —
 * duplicate task ids, two tasks in one wave owning the same file, a dependency
 * pointing forwards — are always errors, because those are wrong in any version.
 */

import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync, realpathSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, join, resolve, relative, basename } from "node:path";
// LOCAL matcher, not `path.matchesGlob`. A named import of matchesGlob is a
// parse-time SyntaxError below Node 20.17 -- the process dies before any version
// guard can run -- and matchesGlob does not match dotfiles, so `src/**` did not
// cover `src/.env` and `audit-wave` reported owned dotfiles as strays.
import { matchesOwns, globToRegExp } from "../lib/owns-match.mjs";

const matchesGlob = (f, glob) => globToRegExp(glob).test(f);
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

// ------------------------------------------------------- provenance --------
//
// WHICH COPY OF DRYDOCK PRODUCED THIS VERDICT. Not vanity: the skills that
// invoke this script are loaded by the HOST from the installed plugin, while
// the script itself is whatever path the command names — and in a checkout of
// this repo those are two different copies that can be many releases apart.
// Measured 2026-09-01: the install sat at 0.7.0 while the repo was at 0.8.4, and
// the two disagreed about a real plan. 0.7.0 does not know `execution: solo`, so
// it FAILED plan 005 with four same-wave-dependency errors that 0.8.4 correctly
// PASSES. Nothing anywhere said the versions differed; the verdicts simply
// contradicted each other and both looked authoritative.
//
// So every verdict now carries the version and path that produced it, and a
// mismatch against the installed copy is stated outright. A normal install runs
// this script FROM the cache, so its own path is the install path, the versions
// match and this prints one quiet line. It only speaks up where the hazard is
// real: someone running a checkout against a differently-versioned install.
//
// Bookkeeping must never change a verdict — same posture as the hook's receipt
// writer. Every lookup here is best-effort and silent on failure.
const SELF = fileURLToPath(new URL("./drydock-audit.mjs", import.meta.url));

const readJSON = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };

const selfVersion = () =>
  readJSON(join(dirname(SELF), "..", ".claude-plugin", "plugin.json"))?.version ?? "unknown";

// The host's own install record is authoritative about what the skills loaded —
// far better than globbing the cache and guessing which copy is live.
const installedVersion = () => {
  const cfg = process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), ".claude");
  const rec = readJSON(join(cfg, "plugins", "installed_plugins.json"));
  const entries = rec?.plugins?.["drydock@drydock"];
  return Array.isArray(entries) && entries.length > 0 ? entries[0] : null;
};

// One line, always printed with the verdict. Returns a second line only when the
// running copy is not the installed one AND the versions differ — a checkout at
// the same version as the install is not drift, it is a developer up to date.
function provenance() {
  const mine = selfVersion();
  const lines = [`drydock-audit.mjs v${mine} at ${SELF}`];
  const inst = installedVersion();
  if (inst && inst.version !== mine && !SELF.startsWith(inst.installPath)) {
    lines.push(
      `VERSION DRIFT: this script is v${mine}, but the installed plugin the skills load is ` +
        `v${inst.version} (${inst.installPath}). The gate you ran and the gate your skills ` +
        `describe are different programs. Reconcile with \`claude plugin update drydock@drydock\` ` +
        `(restart to apply), or run the audit from the installed copy.`
    );
  }
  return lines;
}


// 3 adds the optional `enforcement:` frontmatter key. 2 stays supported: plans
// written before it default to `none` and audit exactly as they always did, so
// the version bump retires nothing.
const SUPPORTED_FORMAT_VERSIONS = [2, 3];
const ATTRIBUTION_MODES = ["commit-prefix", "manifest"];
const LANES = ["small", "full"];
const EXECUTION_MODES = ["solo", "fleet"];

const REQUIRED_SECTIONS = [
  "Requirement",
  "Spec reference",
  "Surgical-scope statement",
  "Baseline",
  "Practices in effect",
  "Findings & constraints",
  "Decision Log",
  "Open questions",
  "Out of scope / follow-ups",
  "Execution policies",
  "Testing Gate",
  "Pressure-test verdict",
  // Phases sit here; they are matched separately since their headings carry a name.
  "Deviation Log",
  "Wavecheck reports",
  "Progress log",
  "Reconcile report",
];

// Five of the contract's SEVEN per-case fields. The other two — `id` and
// `title` — are carried by the case heading (`#### TG1 — what it establishes`),
// so a block that exists has them; these are what its body must still declare.
const TESTING_GATE_FIELDS = ["preconditions", "steps", "expected", "evidence", "severity"];

// A case block starts at its own heading and runs to the next one. Both shapes
// the corpus writes count: plan 004's `#### TG4 — …` and the bolded
// `**TG1 — …**` form. A summary-table row (`| TG4 | … | major | video |`)
// deliberately does NOT open a block — it is an index, not a declaration, and
// treating it as a case would fail every plan that writes both.
const CASE_HEAD = /^(?:#{1,6}\s*|\*\*)\s*(TG\d+)\b/;

function caseBlocks(gate) {
  const blocks = [];
  for (const line of gate.split(/\r?\n/)) {
    const m = line.match(CASE_HEAD);
    if (m) blocks.push({ id: m[1], body: line });
    else if (blocks.length > 0) blocks[blocks.length - 1].body += `\n${line}`;
  }
  return blocks;
}

// "no video", "not video", "without video" — and the trailing form this repo
// actually writes, where the word is followed by why it cannot be used. Bounded
// to the same line so a negation in one case cannot excuse a declaration in the
// next.
const NEGATED_VIDEO =
  /\b(?:no|not|never|without|excluding|omitting)\s+(?:\w+\s+){0,2}video\b|\bvideo\b[^\n]{0,80}?\b(?:cannot|can't|uncapturable|unsupported|unavailable|not captur\w*)\b/i;

// ---------------------------------------------------------------- parsing ---

// Paths in a plan are backticked; anything else on the line is prose.
const backticked = (s) => [...s.matchAll(/`([^`]+)`/g)].map((m) => m[1]);

function parsePlan(path) {
  const text = readFileSync(path, "utf8");
  // Split on CRLF as well as LF. Not defensive padding: this repo's plans are
  // written on Windows and carry `\r`, and in JavaScript `.` does not match a
  // carriage return — so `/^- \*\*(...)\*\* (.*)$/` fails on every bullet that
  // ends a CRLF line. Splitting on "\n" alone parsed ZERO fields out of every
  // task and reported "no Files owned" for all of them, which in audit-wave
  // reads as "every file this task touched is outside its ownership". A parser
  // that silently sees nothing is the worst failure mode available here.
  const lines = text.split(/\r?\n/);

  const frontmatter = {};
  const hasFrontmatter = lines[0]?.trim() === "---";
  if (hasFrontmatter) {
    for (let i = 1; i < lines.length && lines[i].trim() !== "---"; i++) {
      const m = lines[i].match(/^([a-z_]+):\s*(.*?)\s*$/);
      if (m) frontmatter[m[1]] = m[2].replace(/\s*#.*$/, "");
    }
  }

  // Section headings, with the optional `N.` prefix the corpus actually uses.
  const sections = [];
  for (const line of lines) {
    const m = line.match(/^## (?:\d+\.\s*)?(.+?)\s*$/);
    if (m) sections.push(m[1]);
  }

  // Tasks. A superseded task is `#### ~~T1.1.5 — …~~ — SUPERSEDED by T1.1.5r1`;
  // the format contract mandates that shape (ids are never reused, the original
  // is struck through with a pointer). It still holds its id, so it counts for
  // uniqueness, and it must NOT count for ownership — its files belong to the
  // replacement.
  const tasks = [];
  let current = null;
  // A `Files owned:` list wraps across indented continuation lines, and reading
  // only the bullet's first line silently NARROWED the enforced boundary: this
  // repo's own T1.0.1 parsed 2 of its 14 owned files, so `wave-start` would have
  // denied writes to the other 12. Nothing errored — a short list looks exactly
  // like a short list. Issue #8.
  // `ownsSpan` is the same block read LOOSELY — every line up to the next labelled
  // bullet, indentation ignored. `--strict` compares the two counts, so a shape
  // this parser refuses to consume is reported instead of silently dropped.
  let ownsOpen = false;
  let spanOpen = false;
  const flush = () => { if (current) tasks.push(current); current = null; ownsOpen = spanOpen = false; };

  // The `### Wave x.y` heading a task sits under. A task id encodes a wave, and
  // usually the two agree — but the format contract says ids NEVER change once
  // assigned, while a wave assignment may move, so they are allowed to diverge
  // and the heading is the one that says where the task actually runs.
  //
  // Plan 001 is exactly this: deviation 44 moved integration into a new
  // `### Wave 2.4 — Integration` and kept its id `T2.3.1`, citing the contract.
  // Reading the wave off the id put T2.3.1 back in wave 2.3 beside the repair
  // task T2.3.2 it depends on, and `--strict` reported a same-wave dependency
  // the document does not contain. The plan followed the contract; the parser
  // did not implement it.
  let heading = null;

  // A fenced block holding an example task is DOCUMENTATION, not a task. Without
  // this, a `\u0060\u0060\u0060markdown` sample showing `#### T1.0.9` with
  // `Files owned: **` parsed as a real task, and `wave-start` armed the hook with
  // `owns: ["**"]` -- an ownership boundary that permits every write in the repo,
  // derived from a code sample.
  let fenced = false;

  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; continue; }
    if (fenced) { if (current) current.body.push(line); continue; }
    const w = line.match(/^### Wave (\d+\.(?:\d+|R))\b/);
    if (w) heading = w[1];
    const head = line.match(/^#### (~~)?\s*(T[0-9][\w.]*)\b/);
    if (head) {
      flush();
      current = { id: head[2], superseded: Boolean(head[1]), wave: heading, owns: [], ownsSpan: [], dependsOn: [], criterion: null, fields: new Set(), body: [] };
      continue;
    }
    if (/^#{1,4} /.test(line)) { flush(); continue; }
    if (!current) continue;

    current.body.push(line);
    const bullet = line.match(/^-\s+\*\*([^:*]+):?\*\*\s*(.*)$/);
    if (!bullet) {
      // Indented and non-empty = still inside the bullet. Covers both shapes the
      // corpus uses — a wrapped comma list and a nested sub-list. Anything else
      // (a blank line, a new unlabelled bullet, unindented prose) closes it.
      if (spanOpen) current.ownsSpan.push(line);
      if (ownsOpen && /^\s+\S/.test(line)) current.owns.push(...backticked(line));
      else ownsOpen = false;
      continue;
    }
    const label = bullet[1].trim().toLowerCase();
    current.fields.add(label);
    ownsOpen = spanOpen = label === "files owned";

    if (label === "files owned") {
      current.owns = backticked(bullet[2]);
      current.ownsSpan = [bullet[2]];
    } else if (label === "acceptance criterion") {
      // Kept as text so `prove-failable` can run it. The first backticked span
      // is the command; prose criteria ("X is exported from Z") have none and
      // are reported as unrunnable rather than silently skipped.
      current.criterion = bullet[2];
    } else if (label === "depends on") {
      // May also name decisions and open questions — only task refs matter here.
      current.dependsOn = [...bullet[2].matchAll(/\bT[0-9][\w.]*/g)].map((m) => m[0]);
    }
  }
  flush();

  return { path, text, lines, frontmatter, hasFrontmatter, sections, tasks };
}

// Do two `owns` globs describe file sets that can intersect?
//
// Full glob-vs-glob intersection is a real algorithm; this is not it, and does
// not need to be. Two cases cover every shape the corpus writes:
//
//   1. One side is a LITERAL path (no wildcard). Then the question is just "does
//      the other glob match it", which `matchesGlob` answers exactly. This is
//      the case that shipped broken — `site/**` vs `site/content/copy.ts`.
//   2. Both sides are globs. Compare the fixed directory prefix each one sits
//      under: `site/**` and `site/content/**` overlap because one prefix
//      contains the other. Coarse, and deliberately biased toward reporting —
//      a false overlap is one line in a plan review, a missed one is two agents
//      writing the same file.
//
// ponytail: prefix comparison for glob-vs-glob, not set intersection. Exact
// intersection only matters for shapes like `src/*.ts` vs `src/a*` that no plan
// in this corpus has written; revisit if one ever does. Second known ceiling,
// below: two root-anchored globs (`*.md` vs `*.ts`) are reported as overlapping
// though they cannot be. That direction is the safe one and stays.
const literal = (g) => !/[*?[\]{}]/.test(g);
const fixedPrefix = (g) => g.slice(0, g.search(/[*?[\]{}]/) === -1 ? g.length : g.search(/[*?[\]{}]/)).replace(/[^/]*$/, "");

// `**` crosses `/`, a single `*` does not — measured against `path.matchesGlob`,
// not assumed: `*.md` does NOT match `docs/readme.md`, `**/*.test.ts` DOES match
// `src/a.test.ts`. That distinction is the whole of the fix below.
const unbounded = (g) => g.startsWith("**");

function globsOverlap(a, b) {
  if (a === b) return true;
  if (literal(a) && literal(b)) return false; // two different exact paths
  if (literal(a)) return matchesGlob(a, b);
  if (literal(b)) return matchesGlob(b, a);
  const [pa, pb] = [fixedPrefix(a), fixedPrefix(b)];
  // An empty prefix used to mean "matches everywhere", because `"".startsWith(x)`
  // is false but `x.startsWith("")` is true — so any glob whose first wildcard
  // sits at position 0 collided with every other glob, and `*.md` vs `docs/**`
  // failed `--strict` on two file sets that cannot intersect. Only a `**` glob
  // genuinely reaches out of its own directory; a leading single `*` is confined
  // to the root segment and overlaps another rootless glob at most.
  if (pa === "" || pb === "") return unbounded(a) || unbounded(b) || (pa === "" && pb === "");
  return pa.startsWith(pb) || pb.startsWith(pa);
}

// `T2.1.3` -> wave `2.1`. `T0` is the pre-flight baseline and sits in no wave.
// Fallback only: the `### Wave` heading a task sits under wins where it exists,
// because an id outlives its wave assignment by contract. See `parsePlan`.
const waveOfId = (id) => {
  const m = id.match(/^T(\d+)\.(\d+|R)\./);
  return m ? `${m[1]}.${m[2]}` : null;
};

// The wave a task actually runs in. Every caller wants this, never the id form.
const waveOf = (task) =>
  typeof task === "string" ? waveOfId(task) : task.wave ?? waveOfId(task.id);

// Wave ordering for the "dependencies point backwards" check. Review waves
// (`p.R`) close a phase, so they sort after every numbered wave in it.
const waveRank = (wave) => {
  if (!wave) return -1; // T0 precedes everything
  const [p, w] = wave.split(".");
  return Number(p) * 1000 + (w === "R" ? 999 : Number(w));
};

// ------------------------------------------------------------ validate ------

function validatePlan(path, strict) {
  const plan = parsePlan(path);
  const errors = [];
  const notes = [];

  // A markdown file with no YAML frontmatter at all is not a plan — an index, a
  // README, a stray note in the plans directory. Skip it cleanly so
  // `for p in docs/plans/*.md` stays the obvious way to check a corpus; adding
  // docs/plans/README.md broke exactly that loop, including in this repo's own
  // documented verification steps. A file that HAS frontmatter but no `plan:`
  // key is a different thing — a malformed plan — and stays an error.
  if (!plan.hasFrontmatter) {
    console.log(`validate-plan: SKIP, ${path} (no frontmatter; not a plan file)`);
    return;
  }

  const fv = Number(plan.frontmatter.format_version);
  if (!plan.frontmatter.plan) errors.push("frontmatter: no `plan:` key, is this a Drydock plan?");
  if (!SUPPORTED_FORMAT_VERSIONS.includes(fv)) {
    errors.push(`frontmatter: format_version ${plan.frontmatter.format_version ?? "(absent)"} unsupported (supported: ${SUPPORTED_FORMAT_VERSIONS.join(", ")})`);
  }

  // --- frontmatter status vs what the gates actually recorded ---------------
  // Not style: a plan that says EXECUTING after every wave passed is why closure
  // never happens, and a plan that says DONE over a BLOCK is worse than one with
  // no status at all. Issue #5.
  const contradiction = statusContradiction(plan);
  if (contradiction) errors.push(contradiction);

  // Zero tasks is a parse failure wearing a PASS. `##### T1.0.1` (five hashes),
  // a task block the fence rule now skips, or a heading shape this parser does
  // not know all produce an empty task list, and every downstream check then has
  // nothing to disagree with: duplicate ids, ownership overlap and dependency
  // order all pass vacuously.
  if (plan.tasks.length === 0) {
    errors.push("no tasks found: task headings must be `#### T<phase>.<wave>.<n> - <title>`. A plan the parser reads as empty passes every other check vacuously");
  }

  // --- attribution mode ------------------------------------------------------
  // Absent means `commit-prefix`, which is every plan written before 0.7.1 and
  // is why plans 001-004 audit exactly as they always did. A typo must not fall
  // through to that default silently: `attribution: manfiest` would look armed
  // and behave as the old mode, which is the failure shape issue #8 just cost us.
  const attribution = plan.frontmatter.attribution;
  if (attribution !== undefined) {
    if (!ATTRIBUTION_MODES.includes(attribution)) {
      errors.push(`frontmatter: attribution ${JSON.stringify(attribution)} unknown (expected: ${ATTRIBUTION_MODES.join(" | ")})`);
    } else if (attribution === "manifest" && fv < 3) {
      errors.push(`frontmatter: attribution: manifest needs format_version 3 or later, the key did not exist at v${fv}, so an older reader ignores it and silently audits by commit subject instead`);
    }
  }

  // --- lane and execution mode ------------------------------------------------
  // Both follow the `enforcement:`/`attribution:` shape: optional, closed
  // enumeration, back-compatible default, and an unknown value is an error
  // rather than a silent fall-through to the default.
  const lane = plan.frontmatter.lane;
  if (lane !== undefined) {
    if (!LANES.includes(lane)) {
      errors.push(`frontmatter: lane ${JSON.stringify(lane)} unknown (expected: ${LANES.join(" | ")})`);
    } else if (lane === "small" && fv < 3) {
      errors.push(`frontmatter: lane: small needs format_version 3 or later, the key did not exist at v${fv}`);
    }
  }
  const execution = plan.frontmatter.execution;
  if (execution !== undefined) {
    if (!EXECUTION_MODES.includes(execution)) {
      errors.push(`frontmatter: execution ${JSON.stringify(execution)} unknown (expected: ${EXECUTION_MODES.join(" | ")})`);
    } else if (execution === "solo" && fv < 3) {
      errors.push(`frontmatter: execution: solo needs format_version 3 or later, the key did not exist at v${fv}`);
    }
  }

  // A small-lane plan has to actually stay small, or the key records an
  // intention nobody kept. One implementation wave, and no `Wave x.R` review —
  // those are the two things the lane drops.
  if (lane === "small") {
    const state = derivePlanState(plan);
    if (state.waves.length > 1) {
      errors.push(`lane: small declares ${state.waves.length} implementation waves (${state.waves.join(", ")}), the small lane is one wave and one gate. Use lane: full, or merge the waves.`);
    }
    const reviewWaves = plan.lines.filter((l) => /^### Wave \d+\.R\b/.test(l)).length;
    if (reviewWaves > 0) errors.push(`lane: small declares ${reviewWaves} \`Wave x.R\` quality-review wave(s), the small lane has no separate quality review. Use lane: full.`);
  }

  // --- task ids are never reused, superseded ones included ------------------
  const seen = new Map();
  for (const t of plan.tasks) {
    if (seen.has(t.id)) errors.push(`task ${t.id}: id declared twice, ids are never reused, a replacement takes a suffix (e.g. ${t.id}r1)`);
    seen.set(t.id, t);
  }

  // --- required fields ------------------------------------------------------
  for (const t of plan.tasks) {
    if (t.superseded) continue;
    if (!t.fields.has("files owned")) errors.push(`task ${t.id}: no **Files owned:**, ownership is not optional`);
    if (!t.fields.has("acceptance criterion")) errors.push(`task ${t.id}: no **Acceptance criterion:**, a task without a runnable criterion gates nothing`);
    if (strict && !t.fields.has("context brief")) errors.push(`task ${t.id}: no **Context brief:** (strict)`);
    // The loose read of the same block found paths the strict read did not, so a
    // wrapped or nested shape is being dropped and the enforced boundary is
    // narrower than the plan says. Issue #8 shipped exactly this, silently.
    if (strict && t.fields.has("files owned")) {
      const seen = backticked(t.ownsSpan.join(" ")).length;
      if (seen !== t.owns.length) errors.push(`task ${t.id}: **Files owned:** block holds ${seen} backticked path(s) but ${t.owns.length} parsed, the ownership boundary would be ${seen - t.owns.length} file(s) too narrow (strict)`);

      // BOTH counts can be zero and still be wrong. The check above compares a
      // loose read against a strict one, so `Files owned: src/a.ts, src/b.ts`
      // -- real paths, no backticks -- agrees with itself at zero and passed.
      // That is the same silent narrowing as issue #8 taken to its limit: the
      // task declares two files, the parser sees none, and `wave-start` arms a
      // boundary owning nothing. A planner writing prose instead of code spans
      // produces exactly this, so the text has to be looked at, not just counted.
      const declared = t.ownsSpan.join(" ").trim();
      const saysNothing = /^(none|n\/a|read-only|none \(read-only\)|-)?\s*(\(.*\))?\s*$/i.test(declared);
      if (t.owns.length === 0 && declared !== "" && !saysNothing) {
        errors.push(
          `task ${t.id}: **Files owned:** reads ${JSON.stringify(declared.slice(0, 60))} but yields no paths, ` +
            `every path must be in backticks or the boundary is empty and the task owns nothing (strict)`
        );
      }
    }
  }

  // --- ownership disjoint within a wave -------------------------------------
  const byWave = new Map();
  for (const t of plan.tasks) {
    if (t.superseded) continue;
    const wave = waveOf(t);
    if (!wave) continue;
    if (!byWave.has(wave)) byWave.set(wave, []);
    byWave.get(wave).push(t);
  }
  // Disjointness is about the FILE SETS two globs describe, not the strings.
  // Comparing strings caught only a byte-identical duplicate, so the natural way
  // to write an overlap — `site/**` in one task and `site/content/copy.ts` in a
  // sibling — passed `--strict` clean while both tasks could write the same
  // file. That is the exact defect class the plugin exists to prevent, and it
  // slipped through the check whose message asserts it cannot happen. Worse
  // downstream: `wave-start` UNIONS a wave's globs into one boundary, so the
  // hook allows both writes, leaving only the post-hoc audit — and that catches
  // it solely if the two tasks happen to touch the same file.
  for (const [wave, tasks] of byWave) {
    const claims = tasks.flatMap((t) => t.owns.map((glob) => ({ glob, id: t.id })));
    for (let i = 0; i < claims.length; i++) {
      for (let j = i + 1; j < claims.length; j++) {
        const [a, b] = [claims[i], claims[j]];
        if (a.id === b.id) continue; // one task may describe its own files twice
        if (!globsOverlap(a.glob, b.glob)) continue;
        errors.push(
          a.glob === b.glob
            ? `wave ${wave}: \`${a.glob}\` is owned by both ${a.id} and ${b.id}, same-wave ownership must be disjoint`
            : `wave ${wave}: \`${a.glob}\` (${a.id}) and \`${b.glob}\` (${b.id}) describe overlapping file sets, same-wave ownership must be disjoint, and the wave's armed boundary is their union, so the hook would permit both`
        );
      }
    }
  }

  // --- dependencies point backwards ----------------------------------------
  // Two shapes look like forward dependencies and are not, both sanctioned by
  // the format contract. Flagging them would fail most of the plans in this
  // repo on patterns they were told to use.
  //
  //   1. Depending on a review wave (`x.R`). A review rejects, and the repair
  //      wave is appended AFTER it — so wave 1.4 depending on 1.R is the normal
  //      shape of a repair, not a cycle.
  //   2. Depending on a superseded task from its replacement (`T1.1.5r1` ->
  //      `T1.1.5`). That is the supersession pointer the contract mandates, and
  //      it necessarily sits in the same wave.
  //
  // What remains — two LIVE tasks in one wave with a dependency between them —
  // is a real defect: the wave claims they run in parallel and they cannot.
  for (const t of plan.tasks) {
    if (t.superseded) continue;
    for (const dep of t.dependsOn) {
      if (!seen.has(dep)) {
        notes.push(`task ${t.id}: depends on ${dep}, which is not a task in this plan`);
        continue;
      }
      if (waveOf(seen.get(dep) ?? dep)?.endsWith(".R")) continue; // repair after review
      if (seen.get(dep).superseded) continue; // supersession pointer
      if (waveRank(waveOf(seen.get(dep) ?? dep)) >= waveRank(waveOf(t))) {
        const same = waveOf(seen.get(dep) ?? dep) === waveOf(t);
        // The prohibition exists because SIMULTANEOUS tasks cannot depend on
        // each other. Under `execution: solo` there is no simultaneity — the
        // orchestrator runs the wave in sequence — so a same-wave dependency is
        // execution order, not a contradiction. Absent key means fleet, so every
        // plan written before v0.8.0 is judged exactly as it was.
        // A dependency on a LATER wave stays an error in both modes: that one is
        // impossible however the tasks are run.
        if (same && execution === "solo") continue;
        errors.push(
          same
            ? `task ${t.id}: depends on ${dep} in the SAME wave ${waveOf(t)}, same-wave tasks run in parallel, so this dependency cannot hold. Split the wave.`
            : `task ${t.id}: depends on ${dep} in wave ${waveOf(seen.get(dep) ?? dep) ?? ", "}, which is not earlier than its own wave ${waveOf(t) ?? ", "}`
        );
      }
    }
  }

  // --- strict-only: section set and order, Testing Gate completeness --------
  if (strict) {
    const present = plan.sections;
    let cursor = -1;
    for (const name of REQUIRED_SECTIONS) {
      const at = present.findIndex((s, i) => i > cursor && s.toLowerCase() === name.toLowerCase());
      if (at === -1) errors.push(`section: \`## ${name}\` missing or out of order (strict)`);
      else cursor = at;
    }

    const gate = sectionBody(plan, "Testing Gate");
    if (gate === null) {
      // The section-order loop above already reported it; saying it twice makes
      // a two-defect plan look like a four-defect one.
    } else if (/^\s*N\/A/i.test(gate)) {
      // Comma, hyphen or em dash. `plan-format.md` instructs `N/A, <reason>` and
      // this accepted only the two dashes, so a plan written to the contract
      // failed the contract's own validator. The em dash is kept because the
      // five plans already in this repo carry it.
      if (!NA_RE.test(gate)) errors.push("Testing Gate: `N/A` with no reason, the reason is required (write `N/A, <reason>`)");
    } else {
      const caseIds = [...new Set([...gate.matchAll(/\bTG\d+\b/g)].map((m) => m[0]))];
      if (caseIds.length === 0) errors.push("Testing Gate: not N/A but declares no `TG<n>` cases");

      // PER CASE, not across the section. Counting `field` occurrences in the
      // whole gate and comparing to the case count let one well-formed case pay
      // for an empty one: a TG1 that writes each field twice satisfies the count
      // for a TG2 declaring nothing at all, and `--strict` passed it. Verified
      // against a synthetic plan before this changed.
      //
      // The blocks also settle the "seven fields" the message always claimed
      // while the list held five. `id` and `title` are the missing two, and both
      // are carried by the case heading itself — so a case with a heading has
      // them by construction, and the five below are what remains to check.
      const blocks = caseBlocks(gate);
      if (caseIds.length > 0 && blocks.length === 0) {
        errors.push(
          `Testing Gate: names ${caseIds.length} \`TG<n>\` id(s) but carries no per-case block, a case listed only in the summary table declares none of its seven fields`
        );
      }
      for (const { id, body } of blocks) {
        const missing = TESTING_GATE_FIELDS.filter((f) => !new RegExp(`\\b${f}\\b`, "i").test(body));
        if (missing.length > 0) {
          errors.push(
            `Testing Gate: case ${id} declares no ${missing.map((f) => `\`${f}\``).join(", ")}, all seven fields are required (\`id\` and \`title\` come from the case heading; these are the other five)`
          );
        }
      }

      // `video` is uncapturable through the supported driver (A5), so a case
      // DECLARING it fails its evidence clause on every possible run — plan
      // 004's only NO-GO, and still correctly caught.
      //
      // But the old test was a bare word scan over the whole section, which
      // rejected `evidence: screenshot only (no video — the driver cannot
      // capture it)` as if it had declared video. Its sibling `rival` check
      // below already carries a guard for exactly this, because writing what a
      // thing is NOT is how this corpus habitually documents a constraint; the
      // `video` check simply never got one. Scoped to evidence declarations, and
      // negation-aware within them.
      const videoDeclared = gate
        .split(/\r?\n/)
        .filter((l) => /evidence/i.test(l) && /\bvideo\b/i.test(l))
        .filter((l) => !NEGATED_VIDEO.test(l));
      if (videoDeclared.length === 0) notes.push("Testing Gate: no `video` evidence declared. Good: the Playwright MCP driver cannot capture it (A5)");
      else errors.push(`Testing Gate: declares \`video\` evidence, which the supported driver cannot capture at all, that case fails its evidence clause on every possible run (plan 004's only NO-GO). Line: ${videoDeclared[0].trim()}`);

      // Same shape as the `video` rule, one field over: a gate naming a driver
      // seatrial will not use produces evidence of a different kind than the
      // plan promised, and the case ends up substituting an artifact nobody can
      // compare. Caught here because plan time is cheaper than gate time.
      // Guarded on the gate NOT naming Playwright, so "Playwright MCP (not
      // Puppeteer)" — the way this repo habitually writes what a thing is not —
      // does not trip it. Issue #7.
      const rival = gate.match(/\b(selenium|cypress|puppeteer|webdriver|testcafe|nightwatch)\b/i);
      if (rival && !/\bplaywright\b/i.test(gate)) {
        errors.push(`Testing Gate: names \`${rival[1]}\` as the driver, but seatrial drives Playwright MCP and refuses to fall back, the run would produce a different kind of evidence than the gate promises`);
      }
    }
  }

  report(`validate-plan${strict ? " --strict" : ""}`, path, errors, notes, () =>
    `${plan.tasks.length} task(s), ${byWave.size} wave(s), format_version ${fv}`
  );
}

function sectionBody(plan, name) {
  const start = plan.lines.findIndex((l) => new RegExp(`^## (?:\\d+\\.\\s*)?${name}\\s*$`, "i").test(l));
  if (start === -1) return null;
  const rest = plan.lines.slice(start + 1);
  const end = rest.findIndex((l) => /^## /.test(l));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n");
}

// --------------------------------------------------------- plan state ------

// Five surfaces claim to hold a plan's state — frontmatter `status:`, per-task
// `Status:`, the Progress log, the wavecheck reports, the Deviation Log — and in
// the field only the last two are maintained. A reader who trusts the first
// three is misled, and closure never happens because nothing forces it
// (issue #5).
//
// Only ONE of the five is written by a gate rather than by whoever remembered:
// the wavecheck reports. So they are the ground truth, and every other surface
// is either derived from them or deleted. This function derives.
//
// It reads the plan's own text, which is also what
// `docs/a3-gate-compliance.md` proposes as its falsification check — and it
// inherits that check's stated limit: a retroactively written report is a
// heading like any other, so this can tell you a wave has no report and never
// that a gate was skipped at its boundary. Status is what it answers; gate
// compliance is not.
const WAVE_RE = /^### Wave (\d+)\.(\d+|R)\b/;
// `### Wavecheck 2.1 (re-audit after Decision 12) - PASS - 2026-08-20`.
// Comma, hyphen or em dash: wavecheck wrote an em dash before 0.8.15, a hyphen
// after, and `plan-format.md` templates the comma form, which this refused to
// parse at all -- so a report written to the contract left the plan reading
// "no wavecheck reports, status unconstrained" and `plan-status` passed a DONE
// plan with zero recognised gates.
// The verdict alternation is closed: this was `([A-Z]+)`, so
// `### Wavecheck 1.0 - NOTE: see above` yielded the verdict `NOTE` and the plan
// derived as BLOCKED off a heading nobody meant as a gate.
// The parenthetical is free text and re-audits are ordinary headings, so the
// LAST verdict for a wave is the one that stands.
// ONE definition of the separator, referenced everywhere it is honoured.
// `plan-format.md` quotes this set verbatim ("a comma, a hyphen or an em dash"),
// and it was four separate inline literals that had already drifted apart once:
// the N/A check accepted two of them while the contract instructed the third.
const SEP = "[—,-]";
const VERDICT = "(PASS|BLOCK)";
const NA_RE = new RegExp(`^\\s*N/A\\s*${SEP}\\s*\\S`, "i");
const WAVECHECK_RE = new RegExp(`^### Wavecheck (\\d+)\\.(\\d+)\\b.*?${SEP}\\s*${VERDICT}\\b`);
const VERDICT_RE = new RegExp(`${SEP}\\s*${VERDICT}\\b`);

// A phase gate spans its `**Phase gate:` line AND the wrapped lines under it.
// This is not fussiness: plan 005 declared "plus human sign-off" three lines
// below the marker, and plan 001's "human approval" sits on the second line, so
// a single-line test misses the very thing it is looking for.
function phaseGateBlocks(plan) {
  const blocks = [];
  let cur = null;
  const flush = () => { if (cur) blocks.push(cur.join(" ")); cur = null; };
  for (const line of plan.lines) {
    if (/^\*\*Phase gate:/.test(line)) { flush(); cur = [line]; continue; }
    if (!cur) continue;
    if (line.trim() === "" || /^#{1,4} /.test(line)) { flush(); continue; }
    cur.push(line);
  }
  flush();
  return blocks;
}

// The frozen closed form from the format contract:
// `**Phase gate: CLOSED, approved by <name> — <date>.**`
const GATE_CLOSED = /Phase gate:\s*CLOSED,\s*approved by\s+\S+[\s\S]*?\d{4}-\d{2}-\d{2}/;
const GATE_HUMAN = /\bhuman\b|sign-?off/i;

// Gates that ask for a person and do not record one.
const unsignedHumanGates = (plan) =>
  phaseGateBlocks(plan).filter((g) => !GATE_CLOSED.test(g) && GATE_HUMAN.test(g));

// `## Wave <p>.R verdict, APPROVED|REJECTED, <date>` -- the shape plans 001 and
// 004 already use, at heading level 2 because it is appended beside the
// wavecheck reports rather than declared with the waves. Last one wins, so a
// re-review supersedes the verdict it repeats, exactly like a re-audit.
const REVIEW_VERDICT_RE = /^#{2,3} Wave (\d+)\.R verdict\b.*?[—,-]\s*(APPROVED|REJECTED)\b/;

function derivePlanState(plan) {
  const waves = [];
  const verdicts = new Map();
  // Phases that DECLARE a quality review, and the verdicts actually recorded
  // for them. `Wave x.R` has been specified since the format contract was
  // written and nothing ever checked it happened: it was prose the orchestrator
  // was trusted to honour, in a repo whose own A3 data shows gates get skipped.
  const reviewsDeclared = new Set();
  const reviewsApproved = new Map();

  for (const line of plan.lines) {
    const w = line.match(WAVE_RE);
    // Review waves take no wavecheck by design and are excluded from the
    // implementation-wave count, exactly as the A3 ledger excludes them. They
    // are tracked separately below rather than ignored.
    if (w && w[2] === "R") reviewsDeclared.add(w[1]);
    if (w && w[2] !== "R") {
      const id = `${w[1]}.${w[2]}`;
      if (!waves.includes(id)) waves.push(id);
      continue;
    }
    const r = line.match(REVIEW_VERDICT_RE);
    if (r) reviewsApproved.set(r[1], r[2]);
    const c = line.match(WAVECHECK_RE);
    if (c) verdicts.set(`${c[1]}.${c[2]}`, c[3]);
  }

  const reported = waves.filter((w) => verdicts.has(w));
  const blocked = reported.filter((w) => verdicts.get(w) !== "PASS");
  const started = reported.length > 0;
  // A declared review with no APPROVED verdict is REPORTED, not failed, and the
  // distinction is deliberate. `Wave x.R` has been specified since the contract
  // was written with nothing checking it happened, so making it visible is the
  // gap worth closing. Making it a FAILURE would retroactively fail plans
  // already closed in this repo -- measured: plan 001 is RECONCILED and its last
  // recorded review verdicts are REJECTED for both phases, because neither was
  // re-run after its repairs (its own deviations 36 and 49 say so). Rewriting a
  // closed record's verdict afterwards is not this tool's job, and the comment
  // below already refuses exactly that move for unsigned human gates.
  //
  // Ceiling, the same one `a3-gate-compliance.md` records for wave gates: a
  // retroactively written verdict is a heading like any other, so this bounds
  // bookkeeping, not honesty.
  const reviewsMissing = [...reviewsDeclared].filter((p) => reviewsApproved.get(p) !== "APPROVED").sort();
  const complete = waves.length > 0 && reported.length === waves.length && blocked.length === 0;

  // Two different questions, deliberately not one set. `expected` is what a
  // stored status may legitimately say — permissive, because a plan can sit at
  // BLOCKED for a reason no wavecheck reports (plan 004 was BLOCKED on an open
  // question with every wave green). `writable` is the single status --write may
  // set, and is null wherever the reports genuinely cannot choose: DONE vs
  // RECONCILED is `reconcile`'s call, and writing DONE over a RECONCILED it
  // earned would be this tool inventing a verdict.
  let expected, writable, reason;
  if (blocked.length > 0) {
    expected = ["BLOCKED"];
    writable = "BLOCKED";
    reason = `wave ${blocked[0]} last reported ${verdicts.get(blocked[0])}`;
  } else if (complete) {
    // Every wave passing is not the same as the plan being finished. An unsigned
    // human phase gate is a legitimate reason to still read EXECUTING, and
    // `reconcile` refuses to close a plan on exactly this ground — so without
    // it the two tools disagreed about what a closed plan is. Issue #9.
    //
    // This only ever WIDENS what a status may legitimately say; it never adds a
    // failure. That is deliberate: plans 001-003 declare human approval in prose
    // that predates the frozen CLOSED form, and 004's phase 1 uses an older one,
    // so a narrowing rule would retroactively fail all four.
    const unsigned = unsignedHumanGates(plan);
    expected = unsigned.length > 0 ? ["EXECUTING", "DONE", "RECONCILED"] : ["DONE", "RECONCILED"];
    writable = null;
    reason =
      unsigned.length > 0
        ? `all ${waves.length} implementation wave(s) have a PASS report, but ${unsigned.length} phase gate(s) ask for human approval and record none`
        : `all ${waves.length} implementation wave(s) have a PASS report`;
  } else if (started) {
    expected = ["EXECUTING", "BLOCKED"];
    writable = "EXECUTING";
    // Name the review explicitly when it is the only thing left. "3 of 3 wave(s)
    // reported" while the plan refuses to close reads as a bug in the tool, and
    // a check whose refusal cannot be explained is one people work around.
    reason = `${reported.length} of ${waves.length} wave(s) reported`;
  } else {
    expected = ["DRAFT", "APPROVED", "EXECUTING", "BLOCKED", "DONE", "RECONCILED"];
    writable = null;
    reason = "no wavecheck reports, the plan has not been gated, so its status is unconstrained";
  }

  return { waves, verdicts, reported, blocked, started, complete, expected, writable, reason, reviewsDeclared: [...reviewsDeclared].sort(), reviewsMissing };
}

// The contradiction, phrased once and reused by validate-plan, audit-wave and
// plan-status. Returns null when the stored status is consistent with what the
// gates recorded.
function statusContradiction(plan) {
  const state = derivePlanState(plan);
  const status = plan.frontmatter.status;
  if (!status || state.expected.includes(status)) return null;
  return (
    `frontmatter says \`status: ${status}\`, but ${state.reason}, ` +
    `the wavecheck reports are the only state a gate writes, so they win. Expected ${state.expected.join(" or ")}.`
  );
}

function planStatus(path, write) {
  const plan = parsePlan(path);
  const state = derivePlanState(plan);
  const status = plan.frontmatter.status ?? "(absent)";

  console.log(`\n### plan-status, ${path}\n`);
  console.log("| Wave | Last verdict |");
  console.log("|------|--------------|");
  for (const w of state.waves) console.log(`| ${w} | ${state.verdicts.get(w) ?? ", none, "} |`);
  console.log(`\nfrontmatter: ${status}`);
  console.log(`derived:     ${state.expected.join(" or ")}  (${state.reason})`);

  // THE REVIEW THAT WAS DECLARED BUT NOT RECORDED. Reported on every run,
  // including a passing one, because the point is visibility: `Wave x.R` was
  // prose nobody checked, in a repo whose own A3 ledger shows gates get skipped
  // 1 time in 29.
  if (state.reviewsMissing.length > 0) {
    console.log(
      `\nnote: phase ${state.reviewsMissing.join(", ")} declare(s) a \`Wave x.R\` quality review with no ` +
        `APPROVED verdict recorded. Record one as \`## Wave <p>.R verdict, APPROVED, <date>\`, or drop the review ` +
        `wave if it is not going to run. Reported, not failed: a closed plan's verdict is not this tool's to rewrite.`
    );
  } else if (state.reviewsDeclared.length > 0) {
    console.log(`\nnote: ${state.reviewsDeclared.length} declared quality review(s), all with an APPROVED verdict recorded`);
  }

  const bad = statusContradiction(plan);
  if (!bad) {
    console.log(`\nplan-status: PASS, ${path} (status agrees with ${state.reported.length} wavecheck report(s))`);
    return;
  }
  if (!write) {
    console.error(`\nplan-status: FAIL, ${path}`);
    console.error(`  - ${bad}`);
    process.exit(1);
  }

  // Write only what the reports prove. Where two statuses are both consistent
  // the tool has no opinion and says so rather than picking one — an automatic
  // DONE would quietly overwrite a RECONCILED that reconcile earned.
  if (!state.writable) {
    console.error(`\nplan-status: FAIL, ${path}`);
    console.error(`  - ${bad}`);
    console.error(`  --write cannot resolve this: ${state.expected.join(" or ")} are both consistent with the reports. Set it by hand.`);
    process.exit(1);
  }

  const next = state.writable;
  // Targeted, on the raw text: the plans in this repo are CRLF, and splitting on
  // /\r?\n/ then joining with "\n" would rewrite every line ending in the file to
  // change one word. Non-global, so it hits the frontmatter's `status:` — the
  // first one in the file — and nothing further down.
  const updated = plan.text.replace(/^status:[^\r\n]*/m, `status: ${next}`);
  if (updated === plan.text) {
    console.error(`\nplan-status: FAIL, ${path}\n  - no \`status:\` line to update`);
    process.exit(1);
  }
  writeFileSync(path, updated);
  console.log(`\nplan-status: WROTE, ${path} (${status} -> ${next})`);
}

// ------------------------------------------------------------ wave-start ---

// The ownership boundary is DERIVED from the plan, never hand-authored. Until
// 0.7.0 the orchestrator was told, in prose, to write `.drydock/wave-owns.json`
// itself — which meant the enforcement hook was armed only if a model remembered
// to arm it, and a hand-written `{"owns":["**"]}` would have enforced nothing
// while looking exactly like enforcement. Generating the file from the plan
// deletes both problems instead of adding checks for them: a config derived from
// the plan cannot be broader than the plan.
//
// Closing a wave is `rm .drydock/wave-owns.json`. There is no wave-end
// subcommand because `rm` is already one correct command, and the audit reads
// the enforcement log rather than the config, so nothing depends on the file
// surviving.
function waveStart(planPath, wave) {
  const plan = parsePlan(planPath);
  const tasks = plan.tasks.filter((t) => !t.superseded && waveOf(t) === wave);

  if (tasks.length === 0) {
    console.error(`wave-start: no tasks found for wave ${wave} in ${planPath}`);
    process.exit(1);
  }

  const owns = [...new Set(tasks.flatMap((t) => t.owns))];
  if (owns.length === 0) {
    console.error(
      `wave-start: wave ${wave} declares no owned files across ${tasks.length} task(s). ` +
        `Arming an empty boundary would deny every write in the repo; fix the plan.`
    );
    process.exit(1);
  }

  const root = repoRoot(planPath);

  // PREFLIGHT. `wave-start` used to arm from any file at all, including a plan
  // with `format_version: 9`, and the boundary it writes is what the hook then
  // enforces for the whole wave. A plan the validator rejects is not a boundary
  // anyone should be held to.
  const check = spawnSync(process.execPath, [SELF, "validate-plan", planPath], { encoding: "utf8" });
  if (check.status !== 0) {
    console.error(`wave-start: ${planPath} does not pass validate-plan, so its ownership boundary is not trustworthy.`);
    for (const line of String(check.stdout ?? "").split("\n").concat(String(check.stderr ?? "").split("\n"))) {
      if (/^\s*-\s/.test(line) || /^validate-plan/.test(line)) console.error(`  ${line.trim()}`);
    }
    console.error(`  Fix the plan, then arm the wave.`);
    process.exit(1);
  }

  // An uncommitted plan is a boundary that can change under the wave, and after
  // the wave `audit-wave` reports the plan file as an uncommitted change on a
  // clean run. Committing it first is one command; discovering this at the gate
  // costs a wave.
  const planRel = relFromRoot(planPath, root);
  const planDirty = git(["-C", root, "status", "--porcelain", "--", planRel]);
  if (planDirty) {
    console.error(`wave-start: ${planRel} has uncommitted changes (${planDirty.trim().split("\n")[0]}).`);
    console.error(`  Commit the plan before arming the wave, or the boundary can move under the executors`);
    console.error(`  and the wave's own audit reports the plan file as an unattributed change.`);
    process.exit(1);
  }

  // `.drydock/` holds the armed boundary, the enforcement receipts and the
  // attribution manifest. The docs said it "is gitignored", which was true of
  // THIS repo only: in a fresh host repo the first `audit-wave` failed on the
  // tool's own state files, on a wave that had done nothing wrong.
  const ignorePath = join(root, ".gitignore");
  const ignored = existsSync(ignorePath) ? readFileSync(ignorePath, "utf8") : "";
  if (!/^\.drydock\/?\s*$/m.test(ignored)) {
    writeFileSync(ignorePath, (ignored && !ignored.endsWith("\n") ? ignored + "\n" : ignored) + "# Drydock wave state, receipts and attribution\n.drydock/\n");
    console.log(`wave-start: added \`.drydock/\` to ${ignorePath}, its state files are not part of your history`);
  }

  // PER-TASK MAP, alongside the flattened union. `validate-plan` rejects a plan
  // whose same-wave tasks own overlapping paths, and this function preflights
  // it, so inside an armed wave a path maps to at most ONE task. That makes
  // per-task ATTRIBUTION free: no subagent identity, no protocol, no race, just
  // a lookup. (Per-task ENFORCEMENT -- denying because the WRITER is the wrong
  // task -- is a separate thing and needs identity the hook does not yet read.)
  //
  // `owns` stays exactly what it was, the flattened union checked first, so an
  // old hook reading this file behaves identically and a new hook reading an old
  // file finds no `tasks` and falls back to wave-level. The plugin cache and the
  // repo are routinely different versions, so both directions matter.
  const taskOwns = Object.fromEntries(tasks.map((t) => [t.id, t.owns]));

  // The two representations must not be able to drift. A `tasks` map that does
  // not flatten back to `owns` would make the receipt attribute writes to the
  // wrong task while the boundary itself stayed correct -- a silent wrong answer,
  // which is worse than a loud failure.
  const flattened = [...new Set(Object.values(taskOwns).flat())].sort();
  if (JSON.stringify(flattened) !== JSON.stringify([...owns].sort())) {
    console.error(`wave-start: internal error, the per-task map does not flatten back to the wave's owns set.`);
    console.error(`  union(tasks): ${flattened.join(", ")}`);
    console.error(`  owns:         ${[...owns].sort().join(", ")}`);
    process.exit(3);
  }

  const configPath = join(root, ".drydock", "wave-owns.json");
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(
    configPath,
    JSON.stringify({ plan: plan.frontmatter.plan ?? null, wave, owns, tasks: taskOwns }, null, 2) + "\n"
  );

  console.log(`wave-start: armed ${plan.frontmatter.plan ?? planPath} wave ${wave}`);
  for (const t of tasks) console.log(`  ${t.id.padEnd(10)} ${t.owns.join(", ")}`);
  console.log(`\nwrote ${configPath}`);
  // Forward slashes, always: this line is meant to be copy-pasted into a shell,
  // and join() would hand a Windows user a backslash path for a POSIX command.
  console.log(`close the wave with:  rm .drydock/wave-owns.json`);
  // The absolute path, because `$DD` and `${CLAUDE_PLUGIN_ROOT}` are both empty
  // in a shell and a command copied out of the docs with either one still in it
  // runs `node /scripts/...` and dies MODULE_NOT_FOUND.
  console.log(`audit it with:        node ${SELF} audit-wave ${planPath} ${wave}`);
}

// Resolve from the PLAN's directory when one is given. This took an argument at
// every call site and ignored it, using process.cwd(): running
// `wave-start ../other-repo/docs/plans/p.md 1.0` from elsewhere armed the hook
// in the WRONG repository, writing .drydock/wave-owns.json next to the shell
// rather than next to the plan.
const repoRoot = (from) =>
  git(from ? ["-C", dirname(resolve(from)), "rev-parse", "--show-toplevel"] : ["rev-parse", "--show-toplevel"]);

// A path as git names it: repo-relative, POSIX separators. `owns` globs and
// `git show --name-only` both speak that dialect; an absolute path or a `./`
// prefix matches nothing and reads as a stray.
//
// BOTH SIDES NORMALISED THROUGH realpath, then `relative()`, never a slice.
// The two paths arrive in different FORMS, not just with different separators.
// `git rev-parse --show-toplevel` returns a fully resolved path with forward
// slashes; `resolve()` returns whatever the OS handed over. Measured: a repo at
// `/var/folders/.../T/x` has toplevel `/private/var/folders/.../T/x`, and on
// Windows CI a `C:\Users\RUNNER~1\...` 8.3 short path has a long-form
// toplevel. Subtracting one from the other by length produced a path pointing
// nowhere, so the plan document stopped being recognised as itself: a commit
// touching only the plan was reported as a breach, and `wave-start` could not
// see that the plan was uncommitted. macOS hid it because `process.cwd()`
// already returns the resolved form; an absolute path passed on the command
// line does not.
//
// The parent is resolved rather than the target, so a path that does not exist
// yet still normalises.
const realish = (p) => {
  const abs = resolve(p);
  try { return join(realpathSync.native(dirname(abs)), basename(abs)); } catch { return abs; }
};
const relFromRoot = (p, root = repoRoot()) =>
  relative(realish(root), realish(p)).split("\\").join("/");

// ------------------------------------------------------------ audit-wave ----

const git = (args) => execFileSync("git", args, { encoding: "utf8" }).trim();

// ------------------------------------------------------ sealed record ------
//
// `.drydock/` is gitignored — deliberately, since Testing Gate evidence is
// binary and committing it to history is permanent. The cost only shows up
// later: once that directory is cleaned, a CLOSED wave's verdict cannot be
// re-derived. Plan 005 reads `status: RECONCILED` with a PASS report, and
// re-running its own gate afterwards produced FAIL (7) — six tasks
// "unattributed" and an `enforcement: required` breach — purely because the
// artifacts behind the original PASS were gone.
//
// Nothing needed building. Wavecheck already pastes the audit's evidence table
// into the plan, and the plan is committed, so the task -> sha lookup that
// `attribution.jsonl` supplied is sitting in git alongside the code it
// describes. This reads it back.
//
// WHAT THAT IS AND IS NOT WORTH. The table supplies only the lookup; every file
// set is still re-derived with `git show` and re-compared against the plan's
// `owns`, so a recovered ownership verdict is exactly as strong as the original
// — a doctored table naming the wrong commits produces wrong file sets and
// FAILs. The enforcement receipt is the opposite: a count in a document is a
// RECORD of what the hook did, never a receipt, because the hook did not write
// it. The two are labelled differently below for that reason, and a sealed
// record is never allowed to read as a live one.
const SEALED_ROW = /^\|\s*(T[0-9][\w.]*)\s*\|\s*`([0-9a-f]{7,40})`\s*\|/;

// Is there a wavecheck report for this wave at all? Distinct from
// `sealedRecord`, which returns null whenever the report's evidence table does
// not parse -- so "no recoverable table" read as "wave still open", and a closed
// record was re-audited under live-wave rules.
function sealedVerdict(plan, wave) {
  const re = new RegExp(`^### Wavecheck ${wave.replace(/\./g, "\\.")}\\b`);
  let start = -1;
  plan.lines.forEach((l, i) => { if (re.test(l)) start = i; });
  if (start === -1) return null;
  return plan.lines[start].match(VERDICT_RE)?.[1] ?? "?";
}

function sealedRecord(plan, wave) {
  // The LAST report for the wave, matching `derivePlanState`, which takes the
  // last verdict because a re-audit is an ordinary heading and supersedes what
  // came before. This read the FIRST until 0.8.11, so on a re-audited wave it
  // recovered the superseded table: measured against a BLOCK followed by a
  // re-audit PASS, it took the BLOCK's placeholder sha and then failed the wave
  // with "history moved under the manifest (amend, rebase or drop)" — a
  // confident false cause for a history that had not moved at all. Two readers
  // of the same headings must not disagree about which one counts.
  const re = new RegExp(`^### Wavecheck ${wave.replace(/\./g, "\\.")}\\b`);
  let start = -1;
  plan.lines.forEach((l, i) => { if (re.test(l)) start = i; });
  if (start === -1) return null;
  const rest = plan.lines.slice(start + 1);
  const end = rest.findIndex((l) => /^#{1,3} /.test(l));
  const body = end === -1 ? rest : rest.slice(0, end);

  const commits = new Map();
  for (const line of body) {
    const m = line.match(SEALED_ROW);
    if (m && !commits.has(m[1])) commits.set(m[1], m[2]);
  }
  // `note: enforcement active: 13 hook decision(s) recorded for wave 1.0 (1 denied)`
  const enforcement = body
    .join("\n")
    .match(/enforcement active:\s*(\d+)\s*hook decision\(s\) recorded for wave [\d.]+\s*\((\d+) denied\)/);

  if (commits.size === 0 && !enforcement) return null;
  const verdict = plan.lines[start].match(VERDICT_RE)?.[1] ?? "?";
  return {
    commits,
    verdict,
    decisions: enforcement ? Number(enforcement[1]) : null,
    denied: enforcement ? Number(enforcement[2]) : null,
  };
}

function auditWave(path, wave) {
  const plan = parsePlan(path);
  const errors = [];
  const notes = [];
  const sealed = sealedRecord(plan, wave);
  const sealedAs = sealedVerdict(plan, wave);

  if (plan.frontmatter.isolation === "worktree") {
    notes.push("plan declares `isolation: worktree`, attribution there comes from per-worktree `git diff --name-only`; this subcommand audits default-mode per-task commits only");
  }

  const tasks = plan.tasks.filter((t) => !t.superseded && waveOf(t) === wave);
  if (tasks.length === 0) {
    console.error(`audit-wave: no tasks found for wave ${wave} in ${path}`);
    process.exit(1);
  }

  // How a task's commits are FOUND. The mode decides only that; how they are
  // JUDGED is identical below, which is the whole point of issue #2 — the commit
  // subject was never part of the ownership check, only its lookup key, and it
  // was the one part of the contract a host repo's commit policy could reject.
  // DEFAULT BY FORMAT VERSION. `commit-prefix` finds a task's commit by grepping
  // subjects, and a subject is not unique: `8410e54`, a release bump made a day
  // after plan 003 sealed, reused the subject `drydock(T1.2.1)` and turned that
  // plan's sealed PASS into a FAIL naming an ownership violation plan 003 never
  // committed. Keeping the reader is what lets plans 001-004 (all v2, none
  // declaring the key) audit exactly as they always did; defaulting v3 and later
  // to `manifest` retires the collision class for every new plan without a
  // format bump.
  const fv = Number(plan.frontmatter.format_version);
  const mode = plan.frontmatter.attribution ?? (fv >= 3 ? "manifest" : "commit-prefix");
  const planId = plan.frontmatter.plan ?? null;
  let commitsFor;
  // Where the task->commit lookup came from, so an error can name its real
  // source. It said "manifest names <sha>" even when the sealed report supplied
  // the sha, sending a reader to a file that was not consulted.
  let lookupSource = mode === "manifest" ? "`.drydock/attribution.jsonl`" : "the commit log";

  if (mode === "manifest") {
    // Written by `task-close`, never by hand: a manifest the executor types is
    // the same prose-compliance that `wave-start` deleted in 0.7.0, where the
    // hook was armed only if a model remembered to arm it.
    const manifestPath = join(repoRoot(), ".drydock", "attribution.jsonl");
    const entries = existsSync(manifestPath)
      ? readFileSync(manifestPath, "utf8")
          .split(/\r?\n/)
          .filter(Boolean)
          .map((l) => { try { return JSON.parse(l); } catch { return null; } })
          .filter((e) => e && (e.plan == null || planId == null || e.plan === planId))
      : [];
    if (entries.length === 0 && sealed?.commits.size > 0) {
      // The live manifest is gone and the wave is already sealed. Recover the
      // lookup from the committed report rather than reporting six tasks as
      // unattributed when git still holds every commit they name.
      notes.push(
        `\`${manifestPath}\` holds no entries, but wavecheck ${wave} is sealed in this plan (${sealed.verdict}) ` +
          `with ${sealed.commits.size} task->commit row(s), ATTRIBUTION RECOVERED FROM THE SEALED REPORT. ` +
          `Every file set below is still re-derived with \`git show\` and re-compared against the plan's \`owns\`, ` +
          `so this verdict is as strong as the original; the report supplied the lookup, not the evidence. ` +
          `Ceiling: the report is hand-editable where the manifest is tool-written, and a table naming the wrong ` +
          `commits shows the wrong file sets and FAILs rather than passing quietly.`
      );
      lookupSource = `the sealed wavecheck ${wave} report in this plan`;
      commitsFor = (id) => (sealed.commits.has(id) ? [sealed.commits.get(id)] : []);
    } else {
      if (entries.length === 0) {
        notes.push(`plan declares \`attribution: manifest\` and ${manifestPath} holds no entries for this plan, every task below will read as unattributed`);
      }
      commitsFor = (id) => entries.filter((e) => e.task === id).map((e) => e.sha);
    }
  } else {
    // Task ids are unique WITHIN a plan, and the checkpoint-commit subject
    // `drydock(<task-id>): …` carries no plan id — so `drydock(T2.0.1)` matches a
    // commit in every plan that ever had a T2.0.1. Scope the search to commits
    // after this plan's baseline SHA, which T0 records for exactly this kind of
    // "what belongs to this run" question. Without a baseline the search is
    // repo-wide and says so, because a silently over-broad match invents
    // violations against commits from an unrelated plan.
    const baseline = plan.text.match(/\*\*Baseline SHA:\*\*\s*`([0-9a-f]{7,40})`/)?.[1];
    const range = baseline ? [`${baseline}..HEAD`] : ["-n", "2000"];
    if (!baseline) {
      notes.push("plan records no `**Baseline SHA:**`, searching the whole history, so a task id reused by another plan can match here");
    }

    const log = git(["log", "--format=%H%x1f%s", ...range]).split(/\r?\n/).filter(Boolean);
    commitsFor = (id) =>
      log
        .map((l) => l.split("\x1f"))
        .filter(([, subject]) => subject.startsWith(`drydock(${id}):`))
        .map(([sha]) => sha);
  }

  // A manifest names a sha; history can move under it (amend, rebase, drop) and
  // the commit-prefix path cannot have this failure because it reads the log it
  // is matching against. An unreachable sha must be said out loud, not skipped.
  const reachable = (sha) => {
    try { git(["cat-file", "-e", `${sha}^{commit}`]); return true; } catch { return false; }
  };

  const rows = [];
  const claimed = new Map();

  for (const task of tasks) {
    const shas = commitsFor(task.id);
    if (shas.length === 0) {
      errors.push(
        mode === "manifest"
          ? `task ${task.id}: no entry in \`.drydock/attribution.jsonl\`, attribution is impossible, which BLOCKs the wave rather than being a judgment call. The executor runs \`drydock-audit.mjs task-close <plan> ${task.id}\` immediately after its checkpoint commit.`
          : `task ${task.id}: no \`drydock(${task.id}): …\` checkpoint commit, attribution is impossible, which BLOCKs the wave rather than being a judgment call`
      );
      rows.push({ id: task.id, sha: ", ", files: [], owns: task.owns, strays: [] });
      continue;
    }
    if (shas.length > 1) {
      if (mode === "manifest") {
        // Two `task-close` calls for one task. A real bookkeeping fault, and both
        // commits are genuinely the task's, so keep judging every one of them.
        errors.push(
          `task ${task.id}: ${shas.length} manifest entries claim it (${shas.map((s) => s.slice(0, 7)).join(", ")}), ambiguous attribution is what per-task attribution exists to prevent`
        );
      } else {
        // Subject collision. The auditor CANNOT tell which of these commits is
        // the task's, so it must not derive ownership verdicts from any of them.
        // It used to: plan 003's sealed wave 1.2 re-audits as two errors, the
        // collision plus "commit 8410e54 changes plugin.json, which is outside
        // its owns" -- a breach report against a wave that never touched that
        // file, caused entirely by a later commit reusing the id.
        errors.push(
          `task ${task.id}: ${shas.length} commits share the subject \`drydock(${task.id}):\` ` +
            `(${shas.map((s) => s.slice(0, 7)).join(", ")}), so this task's ownership CANNOT be judged and is ` +
            `reported as unverifiable rather than as a breach. A commit subject is not unique -- any later ` +
            `commit can reuse a task id -- which is what \`attribution: manifest\` (default from ` +
            `format_version 3) fixes.`
        );
        rows.push({ id: task.id, sha: `${shas.length} colliding`, files: [], owns: task.owns, strays: [] });
        continue;
      }
    }

    for (const sha of shas) {
      if (!reachable(sha)) {
        errors.push(`task ${task.id}: ${lookupSource} names \`${sha}\`, which is not a commit in this repository, history moved under the recorded attribution (amend, rebase or drop) and it no longer describes anything`);
        rows.push({ id: task.id, sha: `${sha.slice(0, 7)} (gone)`, files: [], owns: task.owns, strays: [] });
        continue;
      }
      // `-z` NUL-delimits the name list instead of newline-separating it. Without
      // it, `git show --name-only` quotes AND octal-escapes any path holding a
      // non-ASCII byte -- `docs/café.md` prints as `"docs/caf\303\251.md"`,
      // quotes included -- and that mangled string never matches the glob that
      // owns the real path, falsely BLOCKing a conforming task. `-z` never
      // escapes. The trailing element after the last NUL is empty; `filter
      // (Boolean)` below drops it, same as it already drops a merge commit's
      // empty output.
      // `--no-renames` (finding 3, Wave 1.R): without it, a rename is collapsed
      // to its destination alone -- `git mv site/s.ts docs/s.ts` prints only
      // `docs/s.ts` -- so a task owning `docs/**` could delete an unowned
      // `site/s.ts` by renaming it into its own tree and the source would never
      // reach the `owns` check. `--no-renames` prints both sides and overrides
      // any local `diff.renames` config.
      const files = git(["show", "-z", "--no-renames", "--name-only", "--format=", sha]).split("\0").map((s) => s.trim()).filter(Boolean);
      const strays = files.filter((f) => !task.owns.some((glob) => matchesGlob(f, glob) || f === glob));
      for (const f of files) {
        if (claimed.has(f) && claimed.get(f) !== task.id) {
          errors.push(`file \`${f}\` is touched by both ${claimed.get(f)} and ${task.id} in wave ${wave}, that is a plan defect, not just a conflict`);
        }
        claimed.set(f, task.id);
      }
      for (const f of strays) {
        errors.push(`task ${task.id}: commit ${sha.slice(0, 7)} changes \`${f}\`, which is outside its \`owns\` (${task.owns.map((o) => `\`${o}\``).join(", ") || "none declared"})`);
      }
      rows.push({ id: task.id, sha: sha.slice(0, 7), files, owns: task.owns, strays });
    }
  }

  // ---------------------------------------------------------------------------
  // COMMITS NO TASK CLAIMS. The wave contract is "these tasks, these files, and
  // nothing else", and until now `audit-wave` only ever inspected commits it
  // could already attribute -- so a commit belonging to no task was invisible.
  // Measured in a throwaway repo: two clean `drydock(<id>)` commits plus one
  // `chore: unrelated` adding `src/evil.ts`, owned by nobody, returned
  // `PASS, 2 task(s), 2 commit(s)`. `wavecheck/SKILL.md` has asserted this check
  // exists since it was written. It did not.
  //
  // SCOPED TO THE WAVE'S OWN SPAN, `<earliest>^..<latest>`, where both ends are
  // the wave's attributed commits. Both bounds are load-bearing.
  //
  // The lower bound is the PARENT of the earliest, so that commit sits inside
  // the range (then filtered out as attributed) while earlier waves stay out.
  // Anchoring on the plan-level baseline instead would make every wave inherit
  // every earlier wave's commits, and a plan's own release bookkeeping would
  // BLOCK each of its later waves.
  //
  // The upper bound depends on whether the wave is still open. A LIVE wave (no
  // sealed wavecheck report for it in the plan) is being audited at its close,
  // so the bound is HEAD: a stray commit landing after the last task commit is
  // exactly the F1 case, and stopping at the last task commit would miss it. A
  // SEALED wave is being re-audited later, so the bound is its own last commit;
  // running to HEAD there reported every commit made since it closed, which on
  // plan 005 wave 1.0 was 20 errors naming release commits from days afterwards.
  // A closed wave is responsible for its own span and nothing after it.
  // FULL shas, always. The sealed-record path supplies 7-character shas while
  // `git log --format=%H` yields 40, so a raw comparison matched nothing and
  // every one of the wave's own task commits was reported as claimed by no task.
  const fullShas = new Set();
  for (const task of tasks) {
    for (const sha of commitsFor(task.id)) {
      if (!reachable(sha)) continue;
      try { fullShas.add(git(["rev-parse", `${sha}^{commit}`])); } catch { fullShas.add(sha); }
    }
  }

  if (fullShas.size === 0) {
    notes.push("no attributed commits in this wave, so the unattributed-commit scan cannot run; every task is already reported as unattributed above");
  } else {
    // ORDER BY ANCESTRY, not by date. This used `--no-walk --date-order`, and a
    // commit timestamp has one-second granularity: two task commits made inside
    // the same second have no defined order, so "earliest" and "latest" came
    // back arbitrarily. It passed on a slow machine and failed in CI, where the
    // whole fixture commits within one second, silently scanning an empty range.
    // `--topo-order` walks the graph, so the answer comes from what descends
    // from what. Bounded by the plan baseline when there is one, to keep the
    // traversal off the whole history.
    const ordered = (() => {
      const base = plan.text.match(/\*\*Baseline SHA:\*\*\s*`([0-9a-f]{7,40})`/)?.[1];
      const args = ["rev-list", "--topo-order", ...fullShas];
      if (base && reachable(base)) args.push("--not", base);
      try {
        const walked = git(args).split(/\r?\n/).filter(Boolean).filter((sha) => fullShas.has(sha));
        return walked.length > 0 ? walked : [...fullShas];
      } catch { return [...fullShas]; }
    })();
    const earliest = ordered[ordered.length - 1];

    const upper = sealedAs ? ordered[0] : "HEAD";
    let range = null;
    try { git(["rev-parse", "--verify", `${earliest}^`]); range = `${earliest}^..${upper}`; }
    catch { range = null; } // root commit: no parent to anchor on

    if (!range) {
      notes.push(`wave's earliest commit ${earliest.slice(0, 7)} is a root commit, so there is no range to scan for unattributed commits`);
    } else {
      const planRel = relFromRoot(plan.path);
      const allOwns = [...new Set(tasks.flatMap((t) => t.owns))];

      // Commits belonging to ANOTHER wave of the SAME plan. Waves interleave in
      // practice -- plan 001 wave 1.1's span contains `drydock(T1.2.1)` -- and a
      // commit the plan does claim is not an unattributed commit. It is worth
      // saying that the waves overlapped, and it is not a breach.
      const otherWaveShas = new Map();
      for (const t of plan.tasks) {
        if (t.superseded || waveOf(t) === wave) continue;
        for (const sha of commitsFor(t.id)) {
          try { otherWaveShas.set(git(["rev-parse", `${sha}^{commit}`]), t); } catch { otherWaveShas.set(sha, t); }
        }
      }
      const scanned = git(["log", "--format=%H%x1f%s", range]).split(/\r?\n/).filter(Boolean);

      for (const line of scanned) {
        const [sha, subject] = line.split("\x1f");
        if (fullShas.has(sha)) continue;

        // `-z` and `--no-renames`, see the F4 and finding-3 comments on the
        // sibling call above: newline-separated output quotes and
        // octal-escapes non-ASCII paths, and without `--no-renames` a rename
        // out of an unowned path shows only its destination.
        const files = git(["show", "-z", "--no-renames", "--name-only", "--format=", sha]).split("\0").map((x) => x.trim()).filter(Boolean);
        if (files.length === 0) continue; // merge or empty commit

        // The plan document is owned by no task BY DESIGN -- the orchestrator
        // writes the Deviation Log and the wavecheck report into it after the
        // wave closes -- so a commit touching only the plan is bookkeeping, not
        // a breach. Anything else is a file this wave was never authorised to
        // change.
        const owner = otherWaveShas.get(sha);
        if (owner) {
          notes.push(
            `commit ${sha.slice(0, 7)} (\`${subject}\`) lands inside wave ${wave}'s span but belongs to ` +
              `${owner.id} in wave ${waveOf(owner)}, so the waves overlapped. Claimed by the plan, not a stray.`
          );
          continue;
        }

        const unowned = files.filter((f) => f !== planRel && !matchesOwns(f, allOwns));
        if (unowned.length === 0) {
          notes.push(`commit ${sha.slice(0, 7)} (\`${subject}\`) claims no task and touches only files this wave owns or the plan document, recorded rather than failed`);
          continue;
        }

        const what =
          `commit ${sha.slice(0, 7)} (\`${subject}\`) is claimed by no task in wave ${wave} and changes ` +
          `${unowned.map((f) => `\`${f}\``).join(", ")}, which no task in this wave owns`;

        // A SEALED wave already had its verdict rendered, and the artifacts
        // behind it are gone. Turning a closed record into a FAIL years later on
        // a check that did not exist when it ran would rewrite history rather
        // than describe it, so on a re-audit this is reported and not failed.
        // On a LIVE wave it is the breach the check exists to catch.
        if (sealedAs) {
          notes.push(`${what}. This wave is already sealed (${sealedAs}), so this is recorded as a re-audit finding rather than failing a closed record.`);
        } else {
          errors.push(`${what}. "Nothing outside the plan changed" is the wave contract; an unattributed commit is how it breaks.`);
        }
      }
    }
  }

  // "Uncommitted changes after all task commits = unattributed change" is only
  // meaningful while the wave is closing. Re-auditing a wave from six months of
  // history ago against today's working tree would report every unrelated edit
  // in the repo as that wave's violation, so the check downgrades to a note the
  // moment HEAD has moved past the wave.
  // --- was enforcement actually running for this wave? ----------------------
  // The question deliberately is NOT "was a config file present" — that is
  // satisfied by a file nobody's hook ever read. The enforcement log is written
  // by the hook itself, on allow as well as deny, so entries are proof the hook
  // was alive at the tool boundary while this wave ran. A hook that was never
  // armed, never registered by the host, or that bailed on Node < 22 all leave
  // the same trace: nothing.
  //
  // Gated on the plan declaring `enforcement: required`, so plans written before
  // 0.7.0 keep auditing unchanged rather than retroactively failing.
  if (plan.frontmatter.enforcement === "required") {
    const logPath = join(repoRoot(), ".drydock", "enforcement.log");
    // One log per REPO, not per plan: `.drydock/enforcement.log` is append-only
    // and every plan in the repo writes into it. Selecting on the wave id alone
    // unions this plan's `owns` with every other plan that shares the id, and
    // since `1.0` is the first wave of every plan, the boundary comparison below
    // could only fail from the repo's second plan onwards. Issue #10. Same
    // null-tolerant shape as the attribution manifest above: an entry or a plan
    // with no id is unattributable, not foreign, and dropping it would turn a
    // clean wave into the much louder "the hook never ran here" error.
    const samePlan = (e) => e.plan == null || planId == null || e.plan === planId;
    const entries = existsSync(logPath)
      ? readFileSync(logPath, "utf8")
          .split(/\r?\n/)
          .filter(Boolean)
          .map((l) => { try { return JSON.parse(l); } catch { return null; } })
          .filter((e) => e && e.wave === wave && samePlan(e))
      : [];

    // TWO LAYERS, COUNTED SEPARATELY. `enforcement: required` is a claim about
    // PREVENTION, and prevention is the file-tool hook; the Bash layer detects
    // after the fact and cannot deny. Counting them together would let a wave
    // whose every write went through Bash satisfy a claim it did not meet.
    //
    // A receipt written before the Bash layer existed carries no `mechanism`,
    // which is exactly how old logs are recognised: absent means file-tool.
    const bashEntries = entries.filter((e) => e.mechanism === "bash-tree");
    const fileEntries = entries.filter((e) => e.mechanism !== "bash-tree");
    const detected = bashEntries.filter((e) => e.decision === "detected");

    // A DETECTED WRITE IS A BREACH, and one the commit audit can miss entirely:
    // a Bash write that was made and then reverted, or made and never committed,
    // leaves nothing for `git show` or the dirty-tree check to find. This is the
    // only place it is visible at all.
    //
    // Reported per path, deduplicated: one command touching twelve unowned files
    // is twelve receipts and should be one error naming twelve paths, not twelve
    // errors that bury the rest of the report.
    if (detected.length > 0) {
      const byCommand = new Map();
      for (const e of detected) {
        const key = e.command ?? "(command not recorded)";
        if (!byCommand.has(key)) byCommand.set(key, new Set());
        byCommand.get(key).add(e.path);
      }
      for (const [command, paths] of byCommand) {
        errors.push(
          `a Bash command wrote outside this wave's \`owns\`: ${[...paths].sort().map((f) => `\`${f}\``).join(", ")}. ` +
            `Command: \`${command}\`. The file-tool hook cannot see Bash, so this was detected after it landed ` +
            `rather than prevented at the boundary, and it may not appear in any commit.`
        );
      }
    }

    if (fileEntries.length === 0 && sealed?.decisions !== null && sealed?.decisions !== undefined) {
      // A FOURTH cause, and the one the three below could not distinguish: the
      // wave closed with receipts and the gitignored log was cleaned afterwards.
      // Diagnosing that as "the hook never ran here" is a confident false
      // statement about a wave whose own sealed report records the hook denying
      // a write — which is exactly what this tool said about plan 005 on
      // 2026-09-01, and the reason a diagnosis has to be able to say it does not
      // know. Not an error: the claim was met when it was checkable, and there
      // is no version of this the repo can re-run, so failing the wave forever
      // over a deleted temp file would make `enforcement: required` mean
      // "audited within one session only".
      notes.push(
        `\`${logPath}\` holds no entries for wave ${wave}, but this plan's sealed wavecheck ${wave} report ` +
          `records ${sealed.decisions} hook decision(s), ${sealed.denied} denied. The live receipt is gone, ` +
          `\`.drydock/\` is gitignored, so it does not survive a clean, and it CANNOT be reconstructed. ` +
          `What stands is a RECORD that enforcement ran, not a RECEIPT of it: the hook wrote the log, a human ` +
          `wrote the report. Treat this wave as enforced-on-record, and re-run the gate before the artifacts ` +
          `are cleaned if you need the stronger claim.`
      );
    } else if (fileEntries.length === 0) {
      // Which of the three sub-cases this is, decided from evidence the tool
      // already holds rather than handed to a model as "one innocent cause
      // exists, consider it". That instruction was prose-compliance of exactly
      // the kind `wave-start` and `task-close` were built to delete. Issue #3.
      const logExists = existsSync(logPath);
      // Everything that is not THIS plan's THIS wave, which is what the "the
      // hook is alive, this wave's writes just never reached it" reading needs:
      // a foreign plan's entry proves the hook registered exactly as another
      // wave of this one does. Counting only `wave !== wave` here would leave a
      // same-id foreign entry in neither bucket and report "the log exists but
      // is empty" about a log with lines in it. Issue #10.
      const elsewhere = logExists
        ? readFileSync(logPath, "utf8")
            .split(/\r?\n/)
            .filter(Boolean)
            .map((l) => { try { return JSON.parse(l); } catch { return null; } })
            .filter((e) => e && !(e.wave === wave && samePlan(e))).length
        : 0;
      const cause = !logExists
        ? `no \`${logPath}\` exists at all, so the hook never ran here: \`wave-start\` was never invoked, the host does not register PreToolUse hooks, or Node is older than 22 (the hook exits 0 with a message rather than wedging every edit)`
        : bashEntries.length > 0
          // No longer a hypothesis. The Bash layer ran, which proves hooks are
          // registered and the wave was armed, and it saw the writes the
          // file-tool hook could not. This is the ambiguity the detector was
          // built to end: an empty prevention log used to have four possible
          // causes and this tool had to guess between them.
          ? `the Bash layer recorded ${bashEntries.length} decision(s) for this wave, so the hook is registered and the wave WAS armed: this wave's writes went through Bash, which a PreToolUse file-tool hook cannot see. Measured here, not inferred`
          : elsewhere > 0
            ? `the log holds ${elsewhere} decision(s) for OTHER waves or plans, so the hook is alive and registered, this wave's writes simply never reached it, which is what happens when they go through Bash (\`sed -i\`, a heredoc, \`>\`), since a PreToolUse file-tool hook cannot see those`
            : `the log exists but is empty, armed at some point, invoked never`;
      errors.push(
        `plan declares \`enforcement: required\` but ${logPath} holds no entries for wave ${wave}: ${cause}. ` +
          `Prevention did not run for this wave. Detection did, check 2 above audited every task commit against its \`owns\` regardless, so read this as an unmet claim, not as an unaudited wave.`
      );
    } else {
      // The armed boundary must be the plan's boundary. Catches a config left
      // over from another wave, or one widened by hand after wave-start.
      const planOwns = [...new Set(tasks.flatMap((t) => t.owns))].sort();
      const armedOwns = [...new Set(entries.flatMap((e) => e.owns ?? []))].sort();
      if (JSON.stringify(planOwns) !== JSON.stringify(armedOwns)) {
        errors.push(
          `the armed ownership boundary does not match the plan for wave ${wave}. ` +
            `Plan: [${planOwns.join(", ")}]. Enforced: [${armedOwns.join(", ")}]. ` +
            `Re-arm with \`wave-start\` rather than editing the config by hand.`
        );
      }
      // DO NOT CHANGE THIS SENTENCE. `sealedRecord` regex-parses it out of
      // wavecheck reports committed into plans, so rewording it breaks re-audit
      // of every sealed wave in the repo. Bash coverage goes in its own note
      // below rather than being folded in here.
      notes.push(
        `enforcement active: ${fileEntries.length} hook decision(s) recorded for wave ${wave} ` +
          `(${fileEntries.filter((e) => e.decision === "deny").length} denied)`
      );

      if (bashEntries.length > 0) {
        const observed = bashEntries.filter((e) => e.decision === "observed").length;
        const unavailable = bashEntries.filter((e) => e.decision === "unavailable").length;
        notes.push(
          `bash layer: ${bashEntries.length} command(s) seen for wave ${wave}, ${observed} with nothing outside ` +
            `\`owns\`, ${detected.length} write(s) detected outside it` +
            (unavailable > 0 ? `, ${unavailable} where detection could not run` : "")
        );
      }

      // PER-TASK BREAKDOWN. Free, because `validate-plan` guarantees same-wave
      // `owns` are disjoint, so the path a decision names has at most one owner
      // and `wave-start` records the map. This says which task's files the wave's
      // writes landed in -- NOT which task did the writing, which needs subagent
      // identity the hook does not read.
      //
      // Read through `?? null`: receipts written before this field existed are
      // ordinary, not an error. Same null-tolerance as `e.plan` above.
      const attributed = entries.filter((e) => e.task != null);
      if (attributed.length === 0 && entries.length > 0) {
        notes.push(
          `receipts carry no per-task attribution, so this wave was armed by a wave-start older than the ` +
            `per-task map (or by a hand-written config). Wave-level enforcement is unaffected.`
        );
      } else if (attributed.length > 0) {
        const byTask = new Map();
        for (const e of attributed) {
          const row = byTask.get(e.task) ?? { allow: 0, deny: 0 };
          row[e.decision === "deny" ? "deny" : "allow"] += 1;
          byTask.set(e.task, row);
        }
        const summary = [...byTask.keys()].sort()
          .map((id) => `${id}: ${byTask.get(id).allow} allow, ${byTask.get(id).deny} deny`)
          .join("; ");
        notes.push(`writes landed in these tasks' files: ${summary}`);

        const unowned = entries.length - attributed.length;
        if (unowned > 0) {
          notes.push(
            `${unowned} decision(s) named a path no task in this wave owns, which is the wave boundary ` +
              `doing its job rather than an attribution gap`
          );
        }
      }
    }
  }

  // Surfaced at the gate rather than only in validate-plan, because the wave
  // boundary is where the status is supposed to move and where somebody is
  // already reading. A note, not an error: this subcommand audits a wave, and
  // failing it over a frontmatter word would conflate two different verdicts.
  const staleStatus = statusContradiction(plan);
  if (staleStatus) notes.push(`plan status is stale, ${staleStatus} Fix with \`plan-status --write\`, or by hand.`);

  // What a PASS from this subcommand does and does not mean. Two layers exist
  // and they answer different questions: the hook PREVENTS a write at the tool
  // boundary and is blind to Bash; this audit DETECTS one after it lands in a
  // commit or the working tree, and sees everything either of those carries.
  // Issue #3 read the pair as "enforcement can only BLOCK on its own absence" —
  // it cannot, because the ownership verdict above is derived purely from
  // commits and the working tree. The enforcement receipt is a separate signal:
  // when the plan declares `enforcement: required`, this same subcommand reads
  // it earlier, from `.drydock/enforcement.log`, the hook's own output, and
  // judges it on its own terms.
  const attributed = new Set(rows.filter((r) => r.sha !== ", ").map((r) => r.sha)).size;
  notes.push(
    `ownership verified by this audit from ${attributed} commit(s), independently of the hook. Detection, not prevention: a Bash-mediated write to an unowned file is caught when it lands, not when it happens`
  );

  const dirty = git(["status", "--porcelain"]);
  const head = git(["rev-parse", "HEAD"]);
  const live = rows.some((r) => r.sha !== ", " && head.startsWith(r.sha));
  if (dirty) {
    const detail = `${dirty.split(/\r?\n/).length} uncommitted change(s): ${dirty.split(/\r?\n/).map((l) => l.replace(/^..\s+/, "")).join(", ")}`;
    if (live) errors.push(`working tree is not clean after the wave's task commits, ${detail}`);
    else notes.push(`working tree is dirty, but HEAD has moved past this wave, not attributed to it (${detail})`);
  }

  // Evidence, always, verdict or not. Never a bare PASS.
  console.log(`\n### audit-wave ${wave}, ${path}\n`);
  console.log("| Task | Commit | Files changed | Owns | Outside owns |");
  console.log("|------|--------|---------------|------|--------------|");
  for (const r of rows) {
    console.log(
      `| ${r.id} | \`${r.sha}\` | ${r.files.map((f) => `\`${f}\``).join("<br>") || ", "} | ` +
        `${r.owns.map((o) => `\`${o}\``).join("<br>") || ", "} | ${r.strays.map((f) => `\`${f}\``).join("<br>") || "none"} |`
    );
  }
  console.log(`\nWorking tree: ${dirty ? "DIRTY" : "clean"}`);

  report(`audit-wave ${wave}`, path, errors, notes, () => `${tasks.length} task(s), ${rows.length} commit(s), attribution: ${mode}`);
}

// ----------------------------------------------------------- task-close ----

// Records which commit belongs to which task, so attribution stops depending on
// the commit SUBJECT — the one part of the contract a host repo's commit policy
// can reject outright (issue #2). The entry is DERIVED from HEAD, never typed:
// a manifest a model writes by hand is the same prose-compliance that 0.7.0's
// `wave-start` deleted, where the ownership hook was armed only if somebody
// remembered to arm it. Because the files come from the commit itself, the
// manifest cannot disagree with what it names.
//
// Appending rather than rewriting is deliberate: a second entry for one task is
// evidence of ambiguity, and audit-wave reports it. Silently replacing the first
// would erase the thing worth seeing.
// UNDO. `task-close` appends, and a second call for one task is an ordinary
// mistake -- amend a commit, re-run it, and the wave now has two entries claiming
// the task, which `audit-wave` correctly reports as ambiguous attribution. The
// only recovery was hand-editing a JSONL file, which is both error-prone and the
// exact "never write this by hand" the manifest exists to avoid.
//
// Removes THIS PLAN's entries for the task and nothing else: the manifest is
// shared by every plan in the repo, and a task id is unique only within a plan.
function taskUndo(planPath, taskId) {
  const plan = parsePlan(planPath);
  const planId = plan.frontmatter.plan ?? null;
  const manifestPath = join(repoRoot(planPath), ".drydock", "attribution.jsonl");

  if (!existsSync(manifestPath)) {
    console.error(`task-close --undo: no manifest at ${manifestPath}, nothing to undo`);
    process.exit(1);
  }

  const lines = readFileSync(manifestPath, "utf8").split(/\r?\n/).filter(Boolean);
  const kept = [];
  const dropped = [];
  for (const line of lines) {
    let entry;
    try { entry = JSON.parse(line); } catch { kept.push(line); continue; } // never discard what we cannot read
    const samePlan = entry.plan == null || planId == null || entry.plan === planId;
    if (samePlan && entry.task === taskId) dropped.push(entry);
    else kept.push(line);
  }

  if (dropped.length === 0) {
    console.error(`task-close --undo: no entry for ${taskId}${planId ? ` in plan ${planId}` : ""}, nothing to undo`);
    process.exit(1);
  }

  writeFileSync(manifestPath, kept.length > 0 ? kept.join("\n") + "\n" : "");
  console.log(`task-close --undo: removed ${dropped.length} entry(s) for ${taskId}`);
  for (const e of dropped) console.log(`  ${String(e.sha ?? "?").slice(0, 7)}  ${(e.files ?? []).length} file(s)  ${e.at ?? ""}`);
  console.log(`\n${kept.length} entry(s) remain in ${manifestPath}`);
  console.log(`re-record with:  drydock-audit.mjs task-close ${planPath} ${taskId}`);
}

function taskClose(planPath, taskId) {
  const plan = parsePlan(planPath);
  const task = plan.tasks.find((t) => t.id === taskId);

  if (!task) {
    console.error(`task-close: ${planPath} declares no task ${taskId}`);
    process.exit(1);
  }
  if (task.superseded) {
    console.error(`task-close: ${taskId} is superseded, its files belong to its replacement, and recording it would attribute work twice`);
    process.exit(1);
  }

  const sha = git(["rev-parse", "HEAD"]);
  // `-z` and `--no-renames`, same reason as the two call sites in `auditWave`:
  // newline-separated `git show --name-only` quotes and octal-escapes a
  // non-ASCII path, and without `--no-renames` a rename out of an unowned
  // path shows only its destination -- either way the manifest would then
  // record a string (or miss a path) the plan's `owns` globs never match.
  const files = git(["show", "-z", "--no-renames", "--name-only", "--format=", sha]).split("\0").map((s) => s.trim()).filter(Boolean);

  // The audit re-derives this from the sha and will catch a mismatch anyway, so
  // this is a fast local signal at the moment it is still cheap to fix — not the
  // enforcement boundary.
  const strays = files.filter((f) => !task.owns.some((glob) => matchesGlob(f, glob) || f === glob));

  const root = repoRoot(planPath);
  const manifestPath = join(root, ".drydock", "attribution.jsonl");
  mkdirSync(dirname(manifestPath), { recursive: true });
  appendFileSync(
    manifestPath,
    JSON.stringify({
      plan: plan.frontmatter.plan ?? null,
      task: task.id,
      wave: waveOf(task),
      sha,
      files,
      at: new Date().toISOString(),
    }) + "\n"
  );

  console.log(`task-close: ${task.id} -> ${sha.slice(0, 7)} (${files.length} file(s))`);
  for (const f of files) console.log(`  ${f}`);
  if (strays.length > 0) {
    console.error(`\ntask-close: WARNING, ${strays.length} file(s) outside this task's \`owns\`:`);
    for (const f of strays) console.error(`  ${f}`);
    console.error(`audit-wave will BLOCK the wave on these. Fix the commit now, before the wave closes.`);
  }
  console.log(`\nwrote ${manifestPath}`);
}

// ---------------------------------------------------- resolve-plans-dir ----

// `plans_dir` defaults to `docs/plans`, which some repos forbid outright: house
// rules against committing tool or planning artifacts make that path
// uncommittable, plans end up somewhere else, and every plan then carries a
// hand-written paragraph justifying its own location. The rationale was being
// improvised per plan by whichever session authored it, so it varied, and a
// reader had to reconstruct why the plan sat where it sat. Issue #6.
//
// The fix is not a cleverer default — it is removing the improvisation. This
// resolves the directory mechanically and hands back ONE fixed sentence for the
// plan to quote, so the answer is the same every time and is never argued for.
const PLANS_FALLBACK = ".drydock/plans";

// Ignored means "this repo will not carry the file", which is the whole
// question. Probe a FILE PATH INSIDE the directory, not the directory: a
// `docs/plans/` pattern is directory-only, and `git check-ignore docs/plans`
// on a directory that does not exist yet reports NOT ignored — the check would
// have passed happily in exactly the repos it exists for. A plan file path is
// also the real question: can a plan be committed here?
function isIgnored(root, rel) {
  const probe = rel.replace(/[\/]+$/, "") + "/000-probe.md";
  const r = spawnSync("git", ["check-ignore", "-q", "--", probe], { cwd: root, encoding: "utf8" });
  return r.status === 0;
}

function resolvePlansDir(preferred) {
  const root = repoRoot();
  const want = preferred || "docs/plans";

  // The fallback lives INSIDE the repo but gitignored, rather than outside it.
  // A repo that forbids committing an artifact has not forbidden having one, and
  // `.drydock/` is already where every other execution artifact lives
  // (`wave-owns.json`, `enforcement.log`, `attribution.jsonl`), so this keeps one
  // convention instead of inventing a second home. It also keeps plan paths
  // relative, which every other subcommand takes as an argument.
  const ignored = isIgnored(root, want);
  const dir = ignored ? PLANS_FALLBACK : want;

  // The fixed sentence. Planwright quotes this verbatim into the plan instead of
  // writing its own justification — that improvisation is the actual defect.
  const sentence = ignored
    ? `**Plan location:** \`${dir}/\`, \`${want}/\` is gitignored in this repo, so this plan is NOT committed. It lives with the other execution artifacts under \`.drydock/\`, and \`git clean -xdf\` will remove it.`
    : `**Plan location:** \`${dir}/\`, committed with the repo.`;

  console.log(`resolve-plans-dir: ${dir}`);
  console.log(`  preferred:   ${want}`);
  console.log(`  gitignored:  ${ignored ? "yes, falling back" : "no"}`);
  console.log(`  committable: ${ignored ? "no" : "yes"}`);
  console.log(`\n${sentence}`);
}

// ---------------------------------------------------------------- report ----

function report(what, path, errors, notes, summary) {
  for (const n of notes) console.log(`  note: ${n}`);
  // Stamped on FAIL as well as PASS, and above the verdict rather than below it:
  // a wavecheck report pastes this output verbatim, so the record of which
  // program judged the wave travels with the judgment instead of being
  // reconstructable only from whoever remembers what they had installed.
  for (const line of provenance()) console.log(`  ${line}`);
  if (errors.length > 0) {
    console.error(`\n${what}: FAIL (${errors.length}), ${path}`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`\n${what}: PASS, ${path} (${summary()})`);
}

// ---------------------------------------------------------- prove-failable ----
//
// AN ACCEPTANCE CRITERION THAT ALREADY PASSES GATES NOTHING. The task could do
// nothing at all and still be marked done, and `wavecheck` check 4 -- which runs
// every criterion rather than trusting the executor -- then passes vacuously,
// which makes the wave's PASS partly vacuous too.
//
// Measured, not hypothetical: three criteria in one plan failed this way
// (planwright/SKILL.md). Two failed LOUDLY at the gate -- an unpassable
// `grep -qx 1` against left-padded BSD `wc` output, and a `####` grep at a file
// using `##`. Only the third was silent: already satisfied before its task
// began. That one is what this catches.
//
// RUN IT BEFORE THE WAVE EXECUTES, in the current tree. The tree at that moment
// IS the baseline, which is why this does not check anything out: a subcommand
// that moves someone's HEAD to run assertions would be a far worse trade than
// the narrower guarantee.
//
// Ceilings, stated rather than discovered:
//   - a criterion with side effects (a build, a migration) runs for real here.
//   - a criterion that is prose, not a command, cannot be run and is reported
//     as such rather than counted as passing or failing.
//   - passing here means "fails at this moment". A criterion that starts failing
//     for an unrelated reason still looks fine.
function proveFailable(planPath) {
  const plan = parsePlan(planPath);
  const tasks = plan.tasks.filter((t) => !t.superseded);
  const root = repoRoot(planPath);
  const rows = [];
  const errors = [];
  const notes = [];

  for (const task of tasks) {
    const raw = task.criterion;
    if (!raw) {
      rows.push({ id: task.id, kind: "none", detail: "no **Acceptance criterion:**" });
      errors.push(`task ${task.id}: no acceptance criterion, so there is nothing to prove failable`);
      continue;
    }
    // An explicit, written opt-out. A criterion that cannot be proven failable
    // here must say why, in the plan, where a reader sees it.
    if (/\bunprovable\b|\bside[- ]effecting\b/i.test(raw)) {
      rows.push({ id: task.id, kind: "opt-out", detail: raw.trim().slice(0, 60) });
      notes.push(`task ${task.id}: criterion declares itself unprovable-at-baseline, skipped with its reason on the record`);
      continue;
    }
    const cmd = backticked(raw)[0];
    if (!cmd) {
      rows.push({ id: task.id, kind: "prose", detail: raw.trim().slice(0, 60) });
      notes.push(`task ${task.id}: criterion is prose, not a command, so it cannot be run here; wavecheck verifies it by reading`);
      continue;
    }

    // `shell: true` uses the PLATFORM's shell -- `/bin/sh` on POSIX, `cmd.exe`
    // on Windows. This hardcoded `/bin/sh`, which does not exist on Windows, so
    // every criterion there failed to spawn and was scored "failable": the check
    // reported success precisely where it was blind.
    const run = spawnSync(cmd, { cwd: root, shell: true, encoding: "utf8", timeout: 120000, maxBuffer: 16 << 20 });

    // COULD NOT RUN is not the same as FAILED, and conflating them is how this
    // check would lie. A criterion whose command does not exist exits non-zero
    // at baseline and would score "failable" -- while being equally incapable of
    // ever passing, which is the OTHER half of "can it fail, and can it pass?".
    // Report it rather than counting it as a healthy gate.
    // DETECTING "not found" IS SHELL-SPECIFIC, and there is no portable answer.
    // `sh` exits 127; `cmd.exe` exits 9009 and says "is not recognized"; others
    // differ again. So corroborate the code with what the shell said, and state
    // the ceiling rather than pretend the detection is complete: on a shell that
    // reports neither, an unrunnable criterion scores "failable", which is the
    // behaviour that existed before this check and is no worse than it.
    // A criterion that HUNG is not a criterion that was missing, and reading a
    // timeout as "not found" would be a confident wrong diagnosis. Same for a
    // criterion that simply printed too much.
    if (run.error?.code === "ETIMEDOUT") {
      rows.push({ id: task.id, kind: "timeout", detail: `120s  ${cmd.slice(0, 60)}` });
      errors.push(
        `task ${task.id}: acceptance criterion did not finish within 120s, so it proves nothing here and will ` +
          `stall the wave gate that re-runs it. Criterion: \`${cmd}\``
      );
      continue;
    }

    const spawnFailed = run.error != null;
    // SCOPED TO THE FIRST LINE of stderr, not all of it. A criterion that ran and
    // legitimately failed can print "not found" anywhere in its own nested
    // output -- a test runner reporting a missing fixture, a linter naming an
    // unresolved import -- and scanning the whole stream misread two correct,
    // failing criteria in plan 006 as unrunnable. Invariant: a criterion that ran
    // and exited non-zero is `failable`, never `unrunnable`, however deep its
    // output goes. The shell's own "not found" is always the first thing it
    // prints, so the first line is where this heuristic belongs.
    // Residual ceiling: a compound command (`a && b`) whose second half is the
    // one missing can still put the diagnostic on line one, since the shell
    // itself reports the failure before any of the command's own output.
    const stderrFirstLine = `${run.stderr ?? ""}`.split(/\r?\n/, 1)[0];
    const saidNotFound = /not recognized|not found|No such file|cannot find/i.test(stderrFirstLine);
    // 127 not found, 126 found but not executable (wrong architecture, missing
    // +x), 9009 cmd.exe's "is not recognized". All three mean the criterion did
    // not run, which is not the same as failing.
    const notFoundCode = run.status === 127 || run.status === 126 || run.status === 9009;
    if (spawnFailed || notFoundCode || (saidNotFound && run.status !== 0)) {
      const why = run.error?.code ?? (notFoundCode ? `exit ${run.status}` : "shell reported the command was not found");
      rows.push({ id: task.id, kind: "unrunnable", detail: `${why}  ${cmd.slice(0, 55)}` });
      errors.push(
        `task ${task.id}: acceptance criterion could not be run at all (${why}), so it is ` +
          `not evidence of anything. It fails at baseline and would fail after the task too. Criterion: \`${cmd}\``
      );
      continue;
    }

    const code = run.status;
    rows.push({ id: task.id, kind: code === 0 ? "INERT" : "failable", detail: `exit ${code}  ${cmd.slice(0, 70)}` });
    if (code === 0) {
      errors.push(
        `task ${task.id}: acceptance criterion already exits 0 before the task has run, so it gates nothing. ` +
          `Criterion: \`${cmd}\``
      );
    }
  }

  console.log(`\n### prove-failable, ${planPath}\n`);
  console.log("| Task | Result | Detail |");
  console.log("|------|--------|--------|");
  for (const r of rows) console.log(`| ${r.id} | ${r.kind} | ${r.detail} |`);
  console.log("");
  report("prove-failable", planPath, errors, notes, () => `${rows.filter((r) => r.kind === "failable").length} of ${rows.length} criteria fail at baseline`);
}

// ---------------------------------------------------------- validate-config ---
//
// THE HOST PROFILE. `drydock:init` writes it, `planwright` reads it, and without
// a check it is one more document asserting things nobody verified -- which is
// the failure mode this repo keeps finding in its own prose.
//
// A YAML SUBSET, NOT YAML, and the ceiling is stated rather than discovered. It
// reads exactly the shape `config-schema.md` specifies: top-level keys, one
// level of nesting, scalars, inline `[a, b]` arrays, `#` comments, optional
// quotes. Anchors, multi-line strings, nested lists of maps and every other YAML
// feature are unsupported, and a file using them fails with that message rather
// than being half-read. Adding a YAML dependency to parse one small file we also
// generate is a worse trade than a 40-line reader with a named limit.
const CONFIG_VERSIONS = [1];
const EXECUTION_MODES_CFG = ["solo", "fleet"];
const ATTRIBUTION_CFG = ["manifest", "commit-prefix"];
const TESTING_APPROACHES = ["test-first", "test-with", "none"];

function parseConfigSubset(text) {
  const root = {};
  let section = null;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.replace(/\s+#.*$/, "").replace(/^#.*$/, "");
    if (!line.trim()) continue;
    if (/^\t/.test(raw)) throw new Error(`line ${i + 1}: tab indentation, use spaces`);
    const m = line.match(/^(\s*)([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) throw new Error(`line ${i + 1}: not a supported key: value line (${line.trim().slice(0, 40)})`);
    const [, indent, key, rawVal] = m;
    const val = rawVal.trim();
    const scalar = (v) => {
      if (v === "") return null;
      if (/^\[.*\]$/.test(v)) return v.slice(1, -1).split(",").map((x) => x.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      if (/^(true|false)$/i.test(v)) return v.toLowerCase() === "true";
      if (/^-?\d+$/.test(v)) return Number(v);
      return v.replace(/^["']|["']$/g, "");
    };
    if (indent.length === 0) {
      if (val === "") { section = {}; root[key] = section; }
      else { root[key] = scalar(val); section = null; }
    } else {
      if (!section) throw new Error(`line ${i + 1}: indented key with no parent section`);
      section[key] = scalar(val);
    }
  }
  return root;
}

function validateConfig(path) {
  const errors = [];
  const notes = [];
  let cfg;
  try {
    cfg = parseConfigSubset(readFileSync(path, "utf8"));
  } catch (err) {
    console.error(`validate-config: FAIL (1), ${path}`);
    console.error(`  - ${err.message}`);
    process.exit(1);
  }

  const ver = cfg.config_version;
  if (!CONFIG_VERSIONS.includes(Number(ver))) {
    errors.push(`config_version ${ver ?? "(absent)"} unsupported (supported: ${CONFIG_VERSIONS.join(", ")})`);
  }

  const sec = (name) => (cfg[name] && typeof cfg[name] === "object" && !Array.isArray(cfg[name]) ? cfg[name] : null);
  const oneOf = (v, allowed, where) => {
    if (v === undefined || v === null) errors.push(`${where}: missing`);
    else if (!allowed.includes(v)) errors.push(`${where}: ${JSON.stringify(v)} unknown (expected: ${allowed.join(" | ")})`);
  };

  const execution = sec("execution");
  if (!execution) errors.push("execution: section missing, and it carries the one key most often discovered too late");
  else oneOf(execution.mode, EXECUTION_MODES_CFG, "execution.mode");

  const vcs = sec("vcs");
  if (!vcs) errors.push("vcs: section missing");
  else oneOf(vcs.attribution, ATTRIBUTION_CFG, "vcs.attribution");

  const testing = sec("testing");
  if (!testing) errors.push("testing: section missing");
  else {
    oneOf(testing.approach, TESTING_APPROACHES, "testing.approach");
    if (testing.approach === "none" && !String(testing.note ?? "").trim()) {
      errors.push("testing.note: required when approach is `none`, because \"no tests\" is a decision that needs a reason on the record");
    }
  }

  const human = sec("gates_human");
  if (!human || !String(human.signer ?? "").trim()) {
    errors.push("gates_human.signer: missing, and an unsigned phase gate is why plans never close");
  }

  const browser = sec("browser");
  if (browser && browser.present === true) {
    for (const k of ["base_url", "start_command"]) {
      if (!String(browser[k] ?? "").trim()) {
        errors.push(`browser.${k}: required when browser.present is true, a Testing Gate cannot be driven against a target nobody named`);
      }
    }
  }

  // PROVENANCE IS NOT OPTIONAL. A value with no source is an assertion wearing a
  // measurement's clothes, which is the exact shape of every claim this repo has
  // had to retract.
  for (const name of ["execution", "gates", "testing", "vcs", "gates_human", "paths", "browser", "tracker"]) {
    const block = sec(name);
    if (block && !String(block.provenance ?? "").trim()) {
      errors.push(`${name}.provenance: missing, say \`discovered <source>\` or \`stated <date>\``);
    }
  }

  const gates = sec("gates");
  if (!gates || !["test", "lint", "build", "typecheck"].some((k) => String(gates[k] ?? "").trim())) {
    notes.push("no runnable command in `gates`, so acceptance criteria will fall back to prose and `prove-failable` has nothing to run");
  }
  const paths = sec("paths");
  if (paths && paths.drydock_ignored === false) {
    notes.push("`.drydock/` is not gitignored, so the first `audit-wave` fails on the tool's own state files; `wave-start` fixes this itself");
  }
  if (execution && execution.mode === "fleet" && Number(execution.max_concurrent) === 1) {
    notes.push("execution.mode is `fleet` but max_concurrent is 1, which is solo with extra steps");
  }

  report("validate-config", path, errors, notes, () => `config_version ${ver}, execution: ${execution?.mode ?? "?"}`);
}

// ------------------------------------------------------------------ main ----

const argv = process.argv.slice(2);
const strict = argv.includes("--strict");
const undo = argv.includes("--undo");
const [command, ...rest] = argv.filter((a) => a !== "--strict" && a !== "--write" && a !== "--undo");

// EXIT CODES: 0 pass, 1 the plan failed the check, 2 bad usage, 3 the check
// could not run. A missing file used to print an eleven-line `node:fs` stack
// trace and exit 1 -- the same code as a legitimate FAIL -- so no wrapper could
// tell "this plan is bad" from "this tool is broken", and a first-time user's
// typo looked like a plan defect.
const fail = (err) => {
  const msg = err?.code === "ENOENT" && err.path
    ? `${err.path}: no such file`
    : err?.message?.split("\n")[0] ?? String(err);
  console.error(`drydock-audit: ${command ?? "(no command)"} could not run: ${msg}`);
  if (process.env.DRYDOCK_DEBUG) console.error(err?.stack ?? "");
  else console.error(`  set DRYDOCK_DEBUG=1 for the stack trace`);
  process.exit(3);
};

try {
if (command === "validate-plan" && rest[0]) validatePlan(rest[0], strict);
else if (command === "audit-wave" && rest[0] && rest[1]) auditWave(rest[0], rest[1]);
else if (command === "wave-start" && rest[0] && rest[1]) waveStart(rest[0], rest[1]);
else if (command === "task-close" && rest[0] && rest[1]) (undo ? taskUndo : taskClose)(rest[0], rest[1]);
else if (command === "plan-status" && rest[0]) planStatus(rest[0], argv.includes("--write"));
else if (command === "prove-failable" && rest[0]) proveFailable(rest[0]);
else if (command === "validate-config" && rest[0]) validateConfig(rest[0]);
else if (command === "resolve-plans-dir") resolvePlansDir(rest[0]);
else {
  console.error("usage: drydock-audit.mjs wave-start   <plan.md> <wave>      # arm the ownership hook");
  console.error("       drydock-audit.mjs task-close   <plan.md> <task-id>  # record HEAD as this task's work");
  console.error("       drydock-audit.mjs task-close --undo <plan.md> <task-id>  # drop that record and re-run it");
  console.error("       drydock-audit.mjs audit-wave   <plan.md> <wave>      # audit it afterwards");
  console.error("       drydock-audit.mjs plan-status   [--write] <plan.md>  # derive status from the wavecheck reports");
  console.error("       drydock-audit.mjs resolve-plans-dir [<preferred>]   # where plans go, and whether they can be committed");
  console.error("       drydock-audit.mjs prove-failable <plan.md>            # every criterion must FAIL before its task runs");
  console.error("       drydock-audit.mjs validate-config <drydock.config.yaml>  # the host profile drydock:init writes");
  console.error("       drydock-audit.mjs validate-plan [--strict] <plan.md>");
  process.exit(2);
}
} catch (err) {
  fail(err);
}
