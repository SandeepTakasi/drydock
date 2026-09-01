/**
 * Structural validation and ownership auditing for Drydock plans.
 * Node built-ins only (Node >= 22 for `path.matchesGlob`).
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

import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, join, matchesGlob } from "node:path";

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

const TESTING_GATE_FIELDS = ["preconditions", "steps", "expected", "evidence", "severity"];

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

  for (const line of lines) {
    const head = line.match(/^#### (~~)?\s*(T[0-9][\w.]*)\b/);
    if (head) {
      flush();
      current = { id: head[2], superseded: Boolean(head[1]), owns: [], ownsSpan: [], dependsOn: [], fields: new Set(), body: [] };
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
    } else if (label === "depends on") {
      // May also name decisions and open questions — only task refs matter here.
      current.dependsOn = [...bullet[2].matchAll(/\bT[0-9][\w.]*/g)].map((m) => m[0]);
    }
  }
  flush();

  return { path, text, lines, frontmatter, hasFrontmatter, sections, tasks };
}

// `T2.1.3` -> wave `2.1`. `T0` is the pre-flight baseline and sits in no wave.
const waveOf = (id) => {
  const m = id.match(/^T(\d+)\.(\d+|R)\./);
  return m ? `${m[1]}.${m[2]}` : null;
};

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
    console.log(`validate-plan: SKIP — ${path} (no frontmatter; not a plan file)`);
    return;
  }

  const fv = Number(plan.frontmatter.format_version);
  if (!plan.frontmatter.plan) errors.push("frontmatter: no `plan:` key — is this a Drydock plan?");
  if (!SUPPORTED_FORMAT_VERSIONS.includes(fv)) {
    errors.push(`frontmatter: format_version ${plan.frontmatter.format_version ?? "(absent)"} unsupported (supported: ${SUPPORTED_FORMAT_VERSIONS.join(", ")})`);
  }

  // --- frontmatter status vs what the gates actually recorded ---------------
  // Not style: a plan that says EXECUTING after every wave passed is why closure
  // never happens, and a plan that says DONE over a BLOCK is worse than one with
  // no status at all. Issue #5.
  const contradiction = statusContradiction(plan);
  if (contradiction) errors.push(contradiction);

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
      errors.push(`frontmatter: attribution: manifest needs format_version 3 or later — the key did not exist at v${fv}, so an older reader ignores it and silently audits by commit subject instead`);
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
      errors.push(`frontmatter: lane: small needs format_version 3 or later — the key did not exist at v${fv}`);
    }
  }
  const execution = plan.frontmatter.execution;
  if (execution !== undefined) {
    if (!EXECUTION_MODES.includes(execution)) {
      errors.push(`frontmatter: execution ${JSON.stringify(execution)} unknown (expected: ${EXECUTION_MODES.join(" | ")})`);
    } else if (execution === "solo" && fv < 3) {
      errors.push(`frontmatter: execution: solo needs format_version 3 or later — the key did not exist at v${fv}`);
    }
  }

  // A small-lane plan has to actually stay small, or the key records an
  // intention nobody kept. One implementation wave, and no `Wave x.R` review —
  // those are the two things the lane drops.
  if (lane === "small") {
    const state = derivePlanState(plan);
    if (state.waves.length > 1) {
      errors.push(`lane: small declares ${state.waves.length} implementation waves (${state.waves.join(", ")}) — the small lane is one wave and one gate. Use lane: full, or merge the waves.`);
    }
    const reviewWaves = plan.lines.filter((l) => /^### Wave \d+\.R\b/.test(l)).length;
    if (reviewWaves > 0) errors.push(`lane: small declares ${reviewWaves} \`Wave x.R\` quality-review wave(s) — the small lane has no separate quality review. Use lane: full.`);
  }

  // --- task ids are never reused, superseded ones included ------------------
  const seen = new Map();
  for (const t of plan.tasks) {
    if (seen.has(t.id)) errors.push(`task ${t.id}: id declared twice — ids are never reused, a replacement takes a suffix (e.g. ${t.id}r1)`);
    seen.set(t.id, t);
  }

  // --- required fields ------------------------------------------------------
  for (const t of plan.tasks) {
    if (t.superseded) continue;
    if (!t.fields.has("files owned")) errors.push(`task ${t.id}: no **Files owned:** — ownership is not optional`);
    if (!t.fields.has("acceptance criterion")) errors.push(`task ${t.id}: no **Acceptance criterion:** — a task without a runnable criterion gates nothing`);
    if (strict && !t.fields.has("context brief")) errors.push(`task ${t.id}: no **Context brief:** (strict)`);
    // The loose read of the same block found paths the strict read did not, so a
    // wrapped or nested shape is being dropped and the enforced boundary is
    // narrower than the plan says. Issue #8 shipped exactly this, silently.
    if (strict && t.fields.has("files owned")) {
      const seen = backticked(t.ownsSpan.join(" ")).length;
      if (seen !== t.owns.length) errors.push(`task ${t.id}: **Files owned:** block holds ${seen} backticked path(s) but ${t.owns.length} parsed — the ownership boundary would be ${seen - t.owns.length} file(s) too narrow (strict)`);
    }
  }

  // --- ownership disjoint within a wave -------------------------------------
  const byWave = new Map();
  for (const t of plan.tasks) {
    if (t.superseded) continue;
    const wave = waveOf(t.id);
    if (!wave) continue;
    if (!byWave.has(wave)) byWave.set(wave, []);
    byWave.get(wave).push(t);
  }
  for (const [wave, tasks] of byWave) {
    const owner = new Map();
    for (const t of tasks) {
      for (const glob of t.owns) {
        if (owner.has(glob)) {
          errors.push(`wave ${wave}: \`${glob}\` is owned by both ${owner.get(glob)} and ${t.id} — same-wave ownership must be disjoint`);
        } else {
          owner.set(glob, t.id);
        }
      }
    }
  }

  // --- dependencies point backwards ----------------------------------------
  // Two shapes look like forward dependencies and are not, both sanctioned by
  // the format contract. Flagging them would fail three of the four plans in
  // this repo on patterns they were told to use.
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
      if (waveOf(dep)?.endsWith(".R")) continue; // repair after review
      if (seen.get(dep).superseded) continue; // supersession pointer
      if (waveRank(waveOf(dep)) >= waveRank(waveOf(t.id))) {
        const same = waveOf(dep) === waveOf(t.id);
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
            ? `task ${t.id}: depends on ${dep} in the SAME wave ${waveOf(t.id)} — same-wave tasks run in parallel, so this dependency cannot hold. Split the wave.`
            : `task ${t.id}: depends on ${dep} in wave ${waveOf(dep) ?? "—"}, which is not earlier than its own wave ${waveOf(t.id) ?? "—"}`
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
      if (!/^\s*N\/A\s*[—-]\s*\S/i.test(gate)) errors.push("Testing Gate: `N/A` with no reason — the reason is required");
    } else {
      const caseIds = [...new Set([...gate.matchAll(/\bTG\d+\b/g)].map((m) => m[0]))];
      if (caseIds.length === 0) errors.push("Testing Gate: not N/A but declares no `TG<n>` cases");
      for (const field of TESTING_GATE_FIELDS) {
        const count = [...gate.matchAll(new RegExp(`\\b${field}\\b`, "gi"))].length;
        if (count < caseIds.length) {
          errors.push(`Testing Gate: \`${field}\` appears ${count}x for ${caseIds.length} case(s) — every case needs all seven fields`);
        }
      }
      if (!/\bvideo\b/i.test(gate)) notes.push("Testing Gate: no `video` evidence declared — good; the Playwright MCP driver cannot capture it (A5)");
      else errors.push("Testing Gate: declares `video` evidence, which the supported driver cannot capture at all — that case fails its evidence clause on every possible run (plan 004's only NO-GO)");

      // Same shape as the `video` rule, one field over: a gate naming a driver
      // seatrial will not use produces evidence of a different kind than the
      // plan promised, and the case ends up substituting an artifact nobody can
      // compare. Caught here because plan time is cheaper than gate time.
      // Guarded on the gate NOT naming Playwright, so "Playwright MCP (not
      // Puppeteer)" — the way this repo habitually writes what a thing is not —
      // does not trip it. Issue #7.
      const rival = gate.match(/\b(selenium|cypress|puppeteer|webdriver|testcafe|nightwatch)\b/i);
      if (rival && !/\bplaywright\b/i.test(gate)) {
        errors.push(`Testing Gate: names \`${rival[1]}\` as the driver, but seatrial drives Playwright MCP and refuses to fall back — the run would produce a different kind of evidence than the gate promises`);
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
// `### Wavecheck 2.1 (re-audit after Decision 12) — PASS — 2026-08-20`.
// The parenthetical is free text and re-audits are ordinary headings, so the
// LAST verdict for a wave is the one that stands.
const WAVECHECK_RE = /^### Wavecheck (\d+)\.(\d+)\b[^—]*—\s*([A-Z]+)/;

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

function derivePlanState(plan) {
  const waves = [];
  const verdicts = new Map();

  for (const line of plan.lines) {
    const w = line.match(WAVE_RE);
    // Review waves take no wavecheck by design and are excluded, exactly as the
    // A3 ledger excludes them.
    if (w && w[2] !== "R") {
      const id = `${w[1]}.${w[2]}`;
      if (!waves.includes(id)) waves.push(id);
      continue;
    }
    const c = line.match(WAVECHECK_RE);
    if (c) verdicts.set(`${c[1]}.${c[2]}`, c[3]);
  }

  const reported = waves.filter((w) => verdicts.has(w));
  const blocked = reported.filter((w) => verdicts.get(w) !== "PASS");
  const started = reported.length > 0;
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
    reason = `${reported.length} of ${waves.length} wave(s) reported`;
  } else {
    expected = ["DRAFT", "APPROVED", "EXECUTING", "BLOCKED", "DONE", "RECONCILED"];
    writable = null;
    reason = "no wavecheck reports — the plan has not been gated, so its status is unconstrained";
  }

  return { waves, verdicts, reported, blocked, started, complete, expected, writable, reason };
}

// The contradiction, phrased once and reused by validate-plan, audit-wave and
// plan-status. Returns null when the stored status is consistent with what the
// gates recorded.
function statusContradiction(plan) {
  const state = derivePlanState(plan);
  const status = plan.frontmatter.status;
  if (!status || state.expected.includes(status)) return null;
  return (
    `frontmatter says \`status: ${status}\`, but ${state.reason} — ` +
    `the wavecheck reports are the only state a gate writes, so they win. Expected ${state.expected.join(" or ")}.`
  );
}

function planStatus(path, write) {
  const plan = parsePlan(path);
  const state = derivePlanState(plan);
  const status = plan.frontmatter.status ?? "(absent)";

  console.log(`\n### plan-status — ${path}\n`);
  console.log("| Wave | Last verdict |");
  console.log("|------|--------------|");
  for (const w of state.waves) console.log(`| ${w} | ${state.verdicts.get(w) ?? "— none —"} |`);
  console.log(`\nfrontmatter: ${status}`);
  console.log(`derived:     ${state.expected.join(" or ")}  (${state.reason})`);

  const bad = statusContradiction(plan);
  if (!bad) {
    console.log(`\nplan-status: PASS — ${path} (status agrees with ${state.reported.length} wavecheck report(s))`);
    return;
  }
  if (!write) {
    console.error(`\nplan-status: FAIL — ${path}`);
    console.error(`  - ${bad}`);
    process.exit(1);
  }

  // Write only what the reports prove. Where two statuses are both consistent
  // the tool has no opinion and says so rather than picking one — an automatic
  // DONE would quietly overwrite a RECONCILED that reconcile earned.
  if (!state.writable) {
    console.error(`\nplan-status: FAIL — ${path}`);
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
    console.error(`\nplan-status: FAIL — ${path}\n  - no \`status:\` line to update`);
    process.exit(1);
  }
  writeFileSync(path, updated);
  console.log(`\nplan-status: WROTE — ${path} (${status} -> ${next})`);
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
  const tasks = plan.tasks.filter((t) => !t.superseded && waveOf(t.id) === wave);

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
  const configPath = join(root, ".drydock", "wave-owns.json");
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(
    configPath,
    JSON.stringify({ plan: plan.frontmatter.plan ?? null, wave, owns }, null, 2) + "\n"
  );

  console.log(`wave-start: armed ${plan.frontmatter.plan ?? planPath} wave ${wave}`);
  console.log(`  tasks: ${tasks.map((t) => t.id).join(", ")}`);
  for (const o of owns) console.log(`  owns:  ${o}`);
  console.log(`\nwrote ${configPath}`);
  // Forward slashes, always: this line is meant to be copy-pasted into a shell,
  // and join() would hand a Windows user a backslash path for a POSIX command.
  console.log(`close the wave with:  rm .drydock/wave-owns.json`);
}

const repoRoot = () => git(["rev-parse", "--show-toplevel"]);

// ------------------------------------------------------------ audit-wave ----

const git = (args) => execFileSync("git", args, { encoding: "utf8" }).trim();

function auditWave(path, wave) {
  const plan = parsePlan(path);
  const errors = [];
  const notes = [];

  if (plan.frontmatter.isolation === "worktree") {
    notes.push("plan declares `isolation: worktree` — attribution there comes from per-worktree `git diff --name-only`; this subcommand audits default-mode per-task commits only");
  }

  const tasks = plan.tasks.filter((t) => !t.superseded && waveOf(t.id) === wave);
  if (tasks.length === 0) {
    console.error(`audit-wave: no tasks found for wave ${wave} in ${path}`);
    process.exit(1);
  }

  // How a task's commits are FOUND. The mode decides only that; how they are
  // JUDGED is identical below, which is the whole point of issue #2 — the commit
  // subject was never part of the ownership check, only its lookup key, and it
  // was the one part of the contract a host repo's commit policy could reject.
  const mode = plan.frontmatter.attribution ?? "commit-prefix";
  const planId = plan.frontmatter.plan ?? null;
  let commitsFor;

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
    if (entries.length === 0) {
      notes.push(`plan declares \`attribution: manifest\` and ${manifestPath} holds no entries for this plan — every task below will read as unattributed`);
    }
    commitsFor = (id) => entries.filter((e) => e.task === id).map((e) => e.sha);
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
      notes.push("plan records no `**Baseline SHA:**` — searching the whole history, so a task id reused by another plan can match here");
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
          ? `task ${task.id}: no entry in \`.drydock/attribution.jsonl\` — attribution is impossible, which BLOCKs the wave rather than being a judgment call. The executor runs \`drydock-audit.mjs task-close <plan> ${task.id}\` immediately after its checkpoint commit.`
          : `task ${task.id}: no \`drydock(${task.id}): …\` checkpoint commit — attribution is impossible, which BLOCKs the wave rather than being a judgment call`
      );
      rows.push({ id: task.id, sha: "—", files: [], owns: task.owns, strays: [] });
      continue;
    }
    if (shas.length > 1) {
      errors.push(
        mode === "manifest"
          ? `task ${task.id}: ${shas.length} manifest entries claim it (${shas.map((s) => s.slice(0, 7)).join(", ")}) — ambiguous attribution is what per-task attribution exists to prevent`
          : `task ${task.id}: ${shas.length} commits share its subject (${shas.map((s) => s.slice(0, 7)).join(", ")}) — ambiguous attribution is what per-task commits exist to prevent`
      );
    }

    for (const sha of shas) {
      if (!reachable(sha)) {
        errors.push(`task ${task.id}: manifest names \`${sha}\`, which is not a commit in this repository — history moved under the manifest (amend, rebase or drop) and the recorded attribution no longer describes anything`);
        rows.push({ id: task.id, sha: `${sha.slice(0, 7)} (gone)`, files: [], owns: task.owns, strays: [] });
        continue;
      }
      const files = git(["show", "--name-only", "--format=", sha]).split("\n").map((s) => s.trim()).filter(Boolean);
      const strays = files.filter((f) => !task.owns.some((glob) => matchesGlob(f, glob) || f === glob));
      for (const f of files) {
        if (claimed.has(f) && claimed.get(f) !== task.id) {
          errors.push(`file \`${f}\` is touched by both ${claimed.get(f)} and ${task.id} in wave ${wave} — that is a plan defect, not just a conflict`);
        }
        claimed.set(f, task.id);
      }
      for (const f of strays) {
        errors.push(`task ${task.id}: commit ${sha.slice(0, 7)} changes \`${f}\`, which is outside its \`owns\` (${task.owns.map((o) => `\`${o}\``).join(", ") || "none declared"})`);
      }
      rows.push({ id: task.id, sha: sha.slice(0, 7), files, owns: task.owns, strays });
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
    const entries = existsSync(logPath)
      ? readFileSync(logPath, "utf8")
          .split(/\r?\n/)
          .filter(Boolean)
          .map((l) => { try { return JSON.parse(l); } catch { return null; } })
          .filter((e) => e && e.wave === wave)
      : [];

    if (entries.length === 0) {
      // Which of the three sub-cases this is, decided from evidence the tool
      // already holds rather than handed to a model as "one innocent cause
      // exists, consider it". That instruction was prose-compliance of exactly
      // the kind `wave-start` and `task-close` were built to delete. Issue #3.
      const logExists = existsSync(logPath);
      const otherWaves = logExists
        ? readFileSync(logPath, "utf8")
            .split(/\r?\n/)
            .filter(Boolean)
            .map((l) => { try { return JSON.parse(l); } catch { return null; } })
            .filter((e) => e && e.wave !== wave).length
        : 0;
      const cause = !logExists
        ? `no \`${logPath}\` exists at all, so the hook never ran here: \`wave-start\` was never invoked, the host does not register PreToolUse hooks, or Node is older than 22 (the hook exits 0 with a message rather than wedging every edit)`
        : otherWaves > 0
          ? `the log holds ${otherWaves} decision(s) for OTHER waves, so the hook is alive and registered — this wave's writes simply never reached it, which is what happens when they go through Bash (\`sed -i\`, a heredoc, \`>\`), since a PreToolUse file-tool hook cannot see those`
          : `the log exists but is empty — armed at some point, invoked never`;
      errors.push(
        `plan declares \`enforcement: required\` but ${logPath} holds no entries for wave ${wave}: ${cause}. ` +
          `Prevention did not run for this wave. Detection did — check 2 above audited every task commit against its \`owns\` regardless — so read this as an unmet claim, not as an unaudited wave.`
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
      notes.push(
        `enforcement active: ${entries.length} hook decision(s) recorded for wave ${wave} ` +
          `(${entries.filter((e) => e.decision === "deny").length} denied)`
      );
    }
  }

  // Surfaced at the gate rather than only in validate-plan, because the wave
  // boundary is where the status is supposed to move and where somebody is
  // already reading. A note, not an error: this subcommand audits a wave, and
  // failing it over a frontmatter word would conflate two different verdicts.
  const staleStatus = statusContradiction(plan);
  if (staleStatus) notes.push(`plan status is stale — ${staleStatus} Fix with \`plan-status --write\`, or by hand.`);

  // What a PASS from this subcommand does and does not mean. Two layers exist
  // and they answer different questions: the hook PREVENTS a write at the tool
  // boundary and is blind to Bash; this audit DETECTS one after it lands in a
  // commit or the working tree, and sees everything either of those carries.
  // Issue #3 read the pair as "enforcement can only BLOCK on its own absence" —
  // it cannot, because this check never consults the hook at all.
  const attributed = new Set(rows.filter((r) => r.sha !== "—").map((r) => r.sha)).size;
  notes.push(
    `ownership verified by this audit from ${attributed} commit(s), independently of the hook — detection, not prevention: a Bash-mediated write to an unowned file is caught when it lands, not when it happens`
  );

  const dirty = git(["status", "--porcelain"]);
  const head = git(["rev-parse", "HEAD"]);
  const live = rows.some((r) => r.sha !== "—" && head.startsWith(r.sha));
  if (dirty) {
    const detail = `${dirty.split(/\r?\n/).length} uncommitted change(s): ${dirty.split(/\r?\n/).map((l) => l.replace(/^..\s+/, "")).join(", ")}`;
    if (live) errors.push(`working tree is not clean after the wave's task commits — ${detail}`);
    else notes.push(`working tree is dirty, but HEAD has moved past this wave — not attributed to it (${detail})`);
  }

  // Evidence, always, verdict or not. Never a bare PASS.
  console.log(`\n### audit-wave ${wave} — ${path}\n`);
  console.log("| Task | Commit | Files changed | Owns | Outside owns |");
  console.log("|------|--------|---------------|------|--------------|");
  for (const r of rows) {
    console.log(
      `| ${r.id} | \`${r.sha}\` | ${r.files.map((f) => `\`${f}\``).join("<br>") || "—"} | ` +
        `${r.owns.map((o) => `\`${o}\``).join("<br>") || "—"} | ${r.strays.map((f) => `\`${f}\``).join("<br>") || "none"} |`
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
function taskClose(planPath, taskId) {
  const plan = parsePlan(planPath);
  const task = plan.tasks.find((t) => t.id === taskId);

  if (!task) {
    console.error(`task-close: ${planPath} declares no task ${taskId}`);
    process.exit(1);
  }
  if (task.superseded) {
    console.error(`task-close: ${taskId} is superseded — its files belong to its replacement, and recording it would attribute work twice`);
    process.exit(1);
  }

  const sha = git(["rev-parse", "HEAD"]);
  const files = git(["show", "--name-only", "--format=", sha]).split("\n").map((s) => s.trim()).filter(Boolean);

  // The audit re-derives this from the sha and will catch a mismatch anyway, so
  // this is a fast local signal at the moment it is still cheap to fix — not the
  // enforcement boundary.
  const strays = files.filter((f) => !task.owns.some((glob) => matchesGlob(f, glob) || f === glob));

  const root = repoRoot();
  const manifestPath = join(root, ".drydock", "attribution.jsonl");
  mkdirSync(dirname(manifestPath), { recursive: true });
  appendFileSync(
    manifestPath,
    JSON.stringify({
      plan: plan.frontmatter.plan ?? null,
      task: task.id,
      wave: waveOf(task.id),
      sha,
      files,
      at: new Date().toISOString(),
    }) + "\n"
  );

  console.log(`task-close: ${task.id} -> ${sha.slice(0, 7)} (${files.length} file(s))`);
  for (const f of files) console.log(`  ${f}`);
  if (strays.length > 0) {
    console.error(`\ntask-close: WARNING — ${strays.length} file(s) outside this task's \`owns\`:`);
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
    ? `**Plan location:** \`${dir}/\` — \`${want}/\` is gitignored in this repo, so this plan is NOT committed. It lives with the other execution artifacts under \`.drydock/\`, and \`git clean -xdf\` will remove it.`
    : `**Plan location:** \`${dir}/\` — committed with the repo.`;

  console.log(`resolve-plans-dir: ${dir}`);
  console.log(`  preferred:   ${want}`);
  console.log(`  gitignored:  ${ignored ? "yes — falling back" : "no"}`);
  console.log(`  committable: ${ignored ? "no" : "yes"}`);
  console.log(`\n${sentence}`);
}

// ---------------------------------------------------------------- report ----

function report(what, path, errors, notes, summary) {
  for (const n of notes) console.log(`  note: ${n}`);
  if (errors.length > 0) {
    console.error(`\n${what}: FAIL (${errors.length}) — ${path}`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`\n${what}: PASS — ${path} (${summary()})`);
}

// ------------------------------------------------------------------ main ----

const argv = process.argv.slice(2);
const strict = argv.includes("--strict");
const [command, ...rest] = argv.filter((a) => a !== "--strict" && a !== "--write");

if (command === "validate-plan" && rest[0]) validatePlan(rest[0], strict);
else if (command === "audit-wave" && rest[0] && rest[1]) auditWave(rest[0], rest[1]);
else if (command === "wave-start" && rest[0] && rest[1]) waveStart(rest[0], rest[1]);
else if (command === "task-close" && rest[0] && rest[1]) taskClose(rest[0], rest[1]);
else if (command === "plan-status" && rest[0]) planStatus(rest[0], argv.includes("--write"));
else if (command === "resolve-plans-dir") resolvePlansDir(rest[0]);
else {
  console.error("usage: drydock-audit.mjs wave-start   <plan.md> <wave>      # arm the ownership hook");
  console.error("       drydock-audit.mjs task-close   <plan.md> <task-id>  # record HEAD as this task's work");
  console.error("       drydock-audit.mjs audit-wave   <plan.md> <wave>      # audit it afterwards");
  console.error("       drydock-audit.mjs plan-status   [--write] <plan.md>  # derive status from the wavecheck reports");
  console.error("       drydock-audit.mjs resolve-plans-dir [<preferred>]   # where plans go, and whether they can be committed");
  console.error("       drydock-audit.mjs validate-plan [--strict] <plan.md>");
  process.exit(2);
}
