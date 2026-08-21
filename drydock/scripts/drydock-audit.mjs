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

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { matchesGlob } from "node:path";

const SUPPORTED_FORMAT_VERSIONS = [2];

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
  if (lines[0]?.trim() === "---") {
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
  const flush = () => { if (current) tasks.push(current); current = null; };

  for (const line of lines) {
    const head = line.match(/^#### (~~)?\s*(T[0-9][\w.]*)\b/);
    if (head) {
      flush();
      current = { id: head[2], superseded: Boolean(head[1]), owns: [], dependsOn: [], fields: new Set(), body: [] };
      continue;
    }
    if (/^#{1,4} /.test(line)) { flush(); continue; }
    if (!current) continue;

    current.body.push(line);
    const bullet = line.match(/^-\s+\*\*([^:*]+):?\*\*\s*(.*)$/);
    if (!bullet) continue;
    const label = bullet[1].trim().toLowerCase();
    current.fields.add(label);

    if (label === "files owned") {
      // Paths are backticked; a trailing parenthetical qualifier is prose.
      current.owns = [...bullet[2].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    } else if (label === "depends on") {
      // May also name decisions and open questions — only task refs matter here.
      current.dependsOn = [...bullet[2].matchAll(/\bT[0-9][\w.]*/g)].map((m) => m[0]);
    }
  }
  flush();

  return { path, text, lines, frontmatter, sections, tasks };
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

  const fv = Number(plan.frontmatter.format_version);
  if (!plan.frontmatter.plan) errors.push("frontmatter: no `plan:` key — is this a Drydock plan?");
  if (!SUPPORTED_FORMAT_VERSIONS.includes(fv)) {
    errors.push(`frontmatter: format_version ${plan.frontmatter.format_version ?? "(absent)"} unsupported (supported: ${SUPPORTED_FORMAT_VERSIONS.join(", ")})`);
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
  const commitsFor = (id) =>
    log
      .map((l) => l.split("\x1f"))
      .filter(([, subject]) => subject.startsWith(`drydock(${id}):`))
      .map(([sha]) => sha);

  const rows = [];
  const claimed = new Map();

  for (const task of tasks) {
    const shas = commitsFor(task.id);
    if (shas.length === 0) {
      errors.push(`task ${task.id}: no \`drydock(${task.id}): …\` checkpoint commit — attribution is impossible, which BLOCKs the wave rather than being a judgment call`);
      rows.push({ id: task.id, sha: "—", files: [], owns: task.owns, strays: [] });
      continue;
    }
    if (shas.length > 1) {
      errors.push(`task ${task.id}: ${shas.length} commits share its subject (${shas.map((s) => s.slice(0, 7)).join(", ")}) — ambiguous attribution is what per-task commits exist to prevent`);
    }

    for (const sha of shas) {
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

  report(`audit-wave ${wave}`, path, errors, notes, () => `${tasks.length} task(s), ${rows.length} commit(s)`);
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
const [command, ...rest] = argv.filter((a) => a !== "--strict");

if (command === "validate-plan" && rest[0]) validatePlan(rest[0], strict);
else if (command === "audit-wave" && rest[0] && rest[1]) auditWave(rest[0], rest[1]);
else {
  console.error("usage: drydock-audit.mjs validate-plan [--strict] <plan.md>");
  console.error("       drydock-audit.mjs audit-wave <plan.md> <wave>");
  process.exit(2);
}
