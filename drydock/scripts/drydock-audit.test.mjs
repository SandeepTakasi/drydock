/**
 * Self-check for `validate-plan`'s ownership parsing. No framework, no fixtures
 * directory — plans are written to a temp dir and the real CLI is run on them.
 *
 *   node drydock/scripts/drydock-audit.test.mjs
 *
 * Exits 0 when every case behaves, 1 naming the ones that did not.
 *
 * Every case here fails against the pre-issue-#8 parser, which read only the
 * first line of a `Files owned:` bullet. That is the point: a truncated
 * ownership list raises no error anywhere — it just looks like a shorter list —
 * so the only way to catch a regression is to assert on a path that lives on a
 * continuation line and would otherwise vanish.
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const CLI = fileURLToPath(new URL("./drydock-audit.mjs", import.meta.url));
const DIR = mkdtempSync(join(tmpdir(), "drydock-audit-"));

const head = `---
plan: 900-fixture
format_version: 3
status: EXECUTING
---
`;

const validateRaw = (name, full, strict = false) => {
  const file = join(DIR, `${name}.md`);
  writeFileSync(file, full);
  const args = strict ? ["validate-plan", "--strict", file] : ["validate-plan", file];
  const r = spawnSync("node", [CLI, ...args], { encoding: "utf8" });
  return `${r.stdout}${r.stderr}`;
};

const validate = (name, body, strict = false) => {
  const file = join(DIR, `${name}.md`);
  writeFileSync(file, head + body);
  const args = strict ? ["validate-plan", "--strict", file] : ["validate-plan", file];
  const r = spawnSync("node", [CLI, ...args], { encoding: "utf8" });
  return `${r.stdout}${r.stderr}`;
};

// A wrapped list: `site/app/page.tsx` sits on the SECOND line, and a sibling in
// the same wave claims it. The collision is only visible if the continuation
// line was read.
const wrapped = (siblingOwns) => `
#### T1.0.1 — wrapped owner
- **Files owned:** \`site/lib/a.ts\`, \`site/lib/b.ts\`,
  \`site/app/page.tsx\`, \`site/lib/c.ts\`
- **Acceptance criterion:** \`true\` exits 0.

#### T1.0.2 — sibling
- **Files owned:** ${siblingOwns}
- **Acceptance criterion:** \`true\` exits 0.
`;

// A shape the parser deliberately does not consume: a blank line closes the
// bullet, so the sub-list below it is out of reach. `--strict` must say so
// rather than quietly enforcing 1 file out of 3.
const unreadable = `
#### T1.0.1 — blank line before the list
- **Files owned:** \`site/lib/a.ts\`

  - \`site/lib/b.ts\`
  - \`site/lib/c.ts\`
- **Acceptance criterion:** \`true\` exits 0.
`;

// The legitimate empty case — read-only tasks declare no files at all. It must
// not trip the count check.
const readOnly = `
#### T0 — baseline
- **Files owned:** — (read-only; writes §4 of this plan only)
- **Acceptance criterion:** \`true\` exits 0.
`;

const cases = [
  ["continuation-line path is parsed",
    () => validate("collide", wrapped("`site/app/page.tsx`")),
    (out) => out.includes("`site/app/page.tsx` is owned by both T1.0.1 and T1.0.2")],

  ["a clean wrapped list still passes",
    () => validate("clean", wrapped("`site/lib/d.ts`")),
    (out) => out.includes("validate-plan: PASS")],

  ["an unconsumable shape is reported, not dropped",
    () => validate("unreadable", unreadable, true),
    (out) => out.includes("block holds 3 backticked path(s) but 1 parsed")],

  ["a read-only task does not trip the count check",
    () => validate("readonly", readOnly, true),
    (out) => !out.includes("block holds")],
];

// --------------------------------------------------------------------------
// Same-wave ownership is about FILE SETS, not strings. Comparing glob strings
// caught only a byte-identical duplicate, so the natural way to write an
// overlap passed `--strict` clean while both tasks could write the same file —
// the exact defect class the plugin exists to prevent, missed by the check
// whose message asserts it cannot happen.

const twoOwners = (a, b) => `
#### T1.0.1 — one
- **Files owned:** ${a}
- **Acceptance criterion:** \`true\` exits 0.

#### T1.0.2 — two
- **Files owned:** ${b}
- **Acceptance criterion:** \`true\` exits 0.
`;

cases.push(
  ["a glob swallowing a sibling's literal path is an overlap",
    () => validate("ov-lit", twoOwners("`site/**`", "`site/content/copy.ts`")),
    (out) => out.includes("describe overlapping file sets") && out.includes("validate-plan: FAIL")],

  ["nested globs overlap too",
    () => validate("ov-glob", twoOwners("`site/**`", "`site/content/**`")),
    (out) => out.includes("describe overlapping file sets")],

  // The original string-equality case still has to report, and still with the
  // wording that names one path rather than two.
  ["an identical glob in two tasks still reports as one path",
    () => validate("ov-same", twoOwners("`site/a.ts`", "`site/a.ts`")),
    (out) => out.includes("`site/a.ts` is owned by both T1.0.1 and T1.0.2")],

  // Both halves of "must not over-report": sibling subtrees are the ordinary
  // way a wave is split, and two different exact files never collide.
  ["sibling subtrees are not an overlap",
    () => validate("ov-clean", twoOwners("`site/**`", "`docs/**`")),
    (out) => out.includes("validate-plan: PASS")],

  ["two different literal paths are not an overlap",
    () => validate("ov-lits", twoOwners("`a.txt`", "`b.txt`")),
    (out) => out.includes("validate-plan: PASS")],

  // A glob whose first wildcard sits at position 0 has an empty fixed prefix,
  // and `x.startsWith("")` is true — so until 0.8.11 it collided with every
  // other glob. `*` does not cross `/` (measured against `path.matchesGlob`),
  // so these two file sets cannot intersect and must not be reported.
  ["a root-anchored `*` glob does not reach into a subtree",
    () => validate("ov-star", twoOwners("`*.md`", "`docs/**`")),
    (out) => out.includes("validate-plan: PASS")],

  // The same shape with `**`, which DOES cross `/`. `**/*.test.ts` really does
  // match `src/a.test.ts`, so this one has to keep reporting — the fix must
  // distinguish the two wildcards, not silence everything with an empty prefix.
  ["a `**` glob does reach into a subtree, and still reports",
    () => validate("ov-globstar", twoOwners("`**/*.test.ts`", "`src/**`")),
    (out) => out.includes("describe overlapping file sets")],

  // One task may describe its own files with a glob AND a path inside it. That
  // is redundant, not a collision — there is no second writer.
  ["a task overlapping only itself is fine", () => validate("ov-self", `
#### T1.0.1 — one
- **Files owned:** \`site/**\`, \`site/content/copy.ts\`
- **Acceptance criterion:** \`true\` exits 0.
`), (out) => out.includes("validate-plan: PASS")],
);

// --------------------------------------------------------------------------
// A task id encodes a wave, but the format contract says ids NEVER change once
// assigned while a wave assignment may move — so the `### Wave` heading a task
// sits under is where it actually runs, and the id is only a fallback.
//
// Plan 001 is the live case: deviation 44 moved integration into a new
// `### Wave 2.4 — Integration` and kept the id `T2.3.1`, citing that contract
// rule. Reading the wave off the id put T2.3.1 back beside the repair task
// `T2.3.2` it depends on, and --strict reported a same-wave dependency the
// document does not contain. The plan followed the contract; the parser did not.

const movedTask = `
### Wave 2.3 — Repair
#### T2.3.2 — the repair
- **Files owned:** \`a.txt\`
- **Acceptance criterion:** \`true\` exits 0.

### Wave 2.4 — Integration
#### T2.3.1 — verify the repaired tree
- **Depends on:** T2.3.2
- **Files owned:** \`b.txt\`
- **Acceptance criterion:** \`true\` exits 0.
`;

// Same ids, same dependency, both left under ONE heading. This is plan 004's
// shape and must still report — the fix must not blanket-excuse the defect.
const notMoved = `
### Wave 2.3 — Repair and integration together
#### T2.3.2 — the repair
- **Files owned:** \`a.txt\`
- **Acceptance criterion:** \`true\` exits 0.

#### T2.3.1 — verify the repaired tree
- **Depends on:** T2.3.2
- **Files owned:** \`b.txt\`
- **Acceptance criterion:** \`true\` exits 0.
`;

cases.push(
  ["a task moved to a later wave keeps its id and depends backwards",
    () => validate("moved", movedTask),
    (out) => out.includes("validate-plan: PASS")],

  ["two tasks left under one heading still report the dependency",
    () => validate("notmoved", notMoved),
    (out) => out.includes("depends on T2.3.2 in the SAME wave 2.3")],

  // Ownership disjointness is per wave, so it has to follow the heading too —
  // otherwise a moved task collides with the wave it used to be in.
  ["ownership collision follows the heading, not the id", () => validate("movedowns", `
### Wave 2.3 — Repair
#### T2.3.2 — the repair
- **Files owned:** \`shared.txt\`
- **Acceptance criterion:** \`true\` exits 0.

### Wave 2.4 — Integration
#### T2.3.1 — verify
- **Files owned:** \`shared.txt\`
- **Acceptance criterion:** \`true\` exits 0.
`), (out) => out.includes("validate-plan: PASS")],
);

// --------------------------------------------------------------------------
// Testing Gate: fields are required PER CASE, and `video` is only a defect when
// a case actually declares it as evidence.

const tgPlan = (gateBody) => `---
plan: 900-fixture
format_version: 3
status: DRAFT
---

## Requirement
## Spec reference
## Surgical-scope statement
## Baseline
## Practices in effect
## Findings & constraints
## Decision Log
## Open questions
## Out of scope / follow-ups
## Execution policies
## Testing Gate

${gateBody}

## Pressure-test verdict
### Wave 1.0 — do it
#### T1.0.1 — thing
- **Files owned:** \`a.txt\`
- **Acceptance criterion:** \`true\` exits 0.
- **Context brief:** x
## Deviation Log
## Wavecheck reports
## Progress log
## Reconcile report
`;

// TG1 writes every field TWICE. Under the old section-wide count that paid for
// TG2's total silence and the plan passed --strict.
const paddedThenEmpty = `
#### TG1 — login works
- **Preconditions:** app running
- **Preconditions:** app seeded
- **Steps:** open /login
- **Steps:** submit
- **Expected result:** dashboard
- **Expected result:** no error
- **Severity:** blocker · **Evidence:** screenshot
- **Severity:** blocker · **Evidence:** screenshot

#### TG2 — logout works
- (this case declares nothing at all)
`;

const oneGoodCase = (evidence) => `
#### TG1 — login works
- **Preconditions:** app running
- **Steps:** open /login
- **Expected result:** dashboard
- **Severity:** blocker · **Evidence:** ${evidence}
`;

cases.push(
  ["a padded case cannot pay for an empty one",
    () => validateRaw("tg-empty", tgPlan(paddedThenEmpty), true),
    (out) => out.includes("case TG2 declares no") && out.includes("validate-plan --strict: FAIL")],

  ["ids listed only in a summary table declare nothing", () => validateRaw("tg-table", tgPlan(`
| ID | Title | Severity | Evidence |
|---|---|---|---|
| TG1 | login works | blocker | screenshot |
`), true), (out) => out.includes("carries no per-case block")],

  // The regression this fixes: writing what a thing is NOT is how this corpus
  // documents a constraint, and the old bare word scan read the disclaimer as
  // a declaration.
  ["an evidence line refusing video is not a video declaration",
    () => validateRaw("tg-novideo", tgPlan(oneGoodCase("screenshot only (no video — the driver cannot capture it)")), true),
    (out) => out.includes("no `video` evidence declared. Good:") && out.includes("validate-plan --strict: PASS")],

  // ...while a real declaration is still plan 004's NO-GO.
  ["a case actually declaring video is still rejected",
    () => validateRaw("tg-video", tgPlan(oneGoodCase("video")), true),
    (out) => out.includes("declares `video` evidence") && out.includes("validate-plan --strict: FAIL")],

  // Prose about the driver's limits is not an evidence declaration either.
  ["prose mentioning video outside an evidence line is ignored",
    () => validateRaw("tg-prose", tgPlan(`**Browser:** Playwright MCP. Video capture is impossible here.\n${oneGoodCase("screenshot")}`), true),
    (out) => out.includes("no `video` evidence declared. Good:")],
);

// --------------------------------------------------------------------------
// Manifest attribution (issue #2). These need a real repository: the whole
// point is that a commit whose SUBJECT carries no task id is still attributable,
// so there has to be a commit to attribute. Each case gets a throwaway repo —
// `git init` is cheaper than reasoning about shared state between cases.

const GIT = ["-c", "user.email=t@t", "-c", "user.name=t", "-c", "commit.gpgsign=false"];
const git = (cwd, args) =>
  execFileSync("git", [...GIT, ...args], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

const cli = (cwd, args, env) => {
  const r = spawnSync("node", [CLI, ...args], { cwd, encoding: "utf8", env: { ...process.env, ...env } });
  return `${r.stdout}${r.stderr}`;
};

// A throwaway `installed_plugins.json`, pointed at by CLAUDE_CONFIG_DIR. Written
// with JSON.stringify rather than a heredoc: the Windows `installPath` is full
// of backslashes and a shell heredoc eats them, which is how the first attempt
// at this test silently produced unparseable JSON and a passing run.
const fakeConfig = (name, version, installPath) => {
  const cfg = join(DIR, `cfg-${name}`);
  mkdirSync(join(cfg, "plugins"), { recursive: true });
  writeFileSync(
    join(cfg, "plugins", "installed_plugins.json"),
    JSON.stringify({ version: 2, plugins: { "drydock@drydock": [{ scope: "user", installPath, version }] } })
  );
  return cfg;
};

const planText = (fv, attribution) => `---
plan: 900-fixture
format_version: ${fv}
status: EXECUTING
attribution: ${attribution}
---

#### T1.0.1 — first
- **Files owned:** \`a.txt\`
- **Acceptance criterion:** \`true\` exits 0.

#### T1.0.2 — second
- **Files owned:** \`b.txt\`
- **Acceptance criterion:** \`true\` exits 0.
`;

// A repo with the plan committed and `.drydock/` ignored, as a host repo has it.
const mkrepo = (name) => {
  const dir = join(DIR, `repo-${name}`);
  mkdirSync(dir, { recursive: true });
  git(dir, ["init", "-q", "-b", "main"]);
  writeFileSync(join(dir, ".gitignore"), ".drydock/\n");
  writeFileSync(join(dir, "plan.md"), planText(3, "manifest"));
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "-m", "chore: baseline"]);
  return dir;
};

// Commit under a subject a host repo's policy would allow — no tool name, no
// task id. Under `commit-prefix` this commit is invisible to the audit.
const commitAs = (dir, files, subject) => {
  for (const f of files) writeFileSync(join(dir, f), `${f}\n`);
  git(dir, ["add", ...files]);
  git(dir, ["commit", "-q", "-m", subject]);
};

const MANIFEST = (dir) => join(dir, ".drydock", "attribution.jsonl");

// A closed wave: both tasks committed under policy-shaped subjects and recorded.
const closedWave = (name, firstFiles = ["a.txt"]) => {
  const dir = mkrepo(name);
  commitAs(dir, firstFiles, "fix(parser): tighten the thing");
  cli(dir, ["task-close", "plan.md", "T1.0.1"]);
  commitAs(dir, ["b.txt"], "feat(core): add the other thing");
  cli(dir, ["task-close", "plan.md", "T1.0.2"]);
  return dir;
};

cases.push(
  ["a policy-shaped subject attributes via the manifest",
    () => cli(closedWave("pass"), ["audit-wave", "plan.md", "1.0"]),
    (out) => out.includes("audit-wave 1.0: PASS") && out.includes("attribution: manifest")],

  ["a task with no manifest entry BLOCKs", () => {
    const dir = mkrepo("missing");
    commitAs(dir, ["a.txt"], "fix(parser): tighten the thing");
    cli(dir, ["task-close", "plan.md", "T1.0.1"]);
    commitAs(dir, ["b.txt"], "feat(core): add the other thing");
    return cli(dir, ["audit-wave", "plan.md", "1.0"]);
  }, (out) => out.includes("task T1.0.2: no entry in `.drydock/attribution.jsonl`")],

  ["two entries for one task are ambiguous, not last-wins", () => {
    const dir = mkrepo("ambiguous");
    commitAs(dir, ["a.txt"], "fix(parser): tighten the thing");
    cli(dir, ["task-close", "plan.md", "T1.0.1"]);
    cli(dir, ["task-close", "plan.md", "T1.0.1"]);
    commitAs(dir, ["b.txt"], "feat(core): add the other thing");
    cli(dir, ["task-close", "plan.md", "T1.0.2"]);
    return cli(dir, ["audit-wave", "plan.md", "1.0"]);
  }, (out) => out.includes("2 manifest entries claim it")],

  ["a sha the manifest names but history lost is reported", () => {
    const dir = mkrepo("gone");
    commitAs(dir, ["a.txt"], "fix(parser): tighten the thing");
    cli(dir, ["task-close", "plan.md", "T1.0.1"]);
    commitAs(dir, ["b.txt"], "feat(core): add the other thing");
    writeFileSync(
      MANIFEST(dir),
      readFileSync(MANIFEST(dir), "utf8") +
        JSON.stringify({ plan: "900-fixture", task: "T1.0.2", wave: "1.0", sha: "0".repeat(40), files: ["b.txt"] }) + "\n"
    );
    return cli(dir, ["audit-wave", "plan.md", "1.0"]);
  }, (out) => out.includes("is not a commit in this repository")],

  ["the ownership check does not weaken under manifest",
    () => cli(closedWave("stray", ["a.txt", "stray.txt"]), ["audit-wave", "plan.md", "1.0"]),
    (out) => out.includes("changes `stray.txt`, which is outside its `owns`")],

  ["task-close warns about an unowned file while it is still cheap to fix", () => {
    const dir = mkrepo("warn");
    commitAs(dir, ["a.txt", "stray.txt"], "fix(parser): tighten the thing");
    return cli(dir, ["task-close", "plan.md", "T1.0.1"]);
  }, (out) => out.includes("WARNING") && out.includes("stray.txt")],

  ["task-close refuses a superseded task", () => {
    const dir = mkrepo("superseded");
    writeFileSync(join(dir, "plan.md"), planText(3, "manifest").replace("#### T1.0.2 — second", "#### ~~T1.0.2 — second~~ — SUPERSEDED by T1.0.2r1"));
    commitAs(dir, ["a.txt"], "fix(parser): tighten the thing");
    return cli(dir, ["task-close", "plan.md", "T1.0.2"]);
  }, (out) => out.includes("superseded")],

  ["manifest on format_version 2 is rejected",
    () => validateRaw("fv2", planText(2, "manifest"), true),
    (out) => out.includes("needs format_version 3 or later")],

  ["an unknown attribution mode is rejected, not defaulted",
    () => validateRaw("typo", planText(3, "manfiest"), true),
    (out) => out.includes(`attribution "manfiest" unknown`)]
);

// --------------------------------------------------------------------------
// Plan status derived from the wavecheck reports (issue #5). The reports are
// the only state a gate writes; frontmatter `status:` is a thing somebody has
// to remember, which in the field it was not.

const statusPlan = (status, body) => `---
plan: 900-fixture
format_version: 3
status: ${status}
---

#### T1.0.1 — first
- **Files owned:** \`a.txt\`
- **Acceptance criterion:** \`true\` exits 0.

#### T2.0.1 — second
- **Files owned:** \`b.txt\`
- **Acceptance criterion:** \`true\` exits 0.

### Wave 1.0 — one
### Wave 1.R — review
### Wave 2.0 — two

## Wavecheck reports
${body}
`;

const BOTH_PASS = `### Wavecheck 1.0 — PASS — 2026-09-01
### Wavecheck 2.0 — PASS — 2026-09-01`;
const ONE_PASS = `### Wavecheck 1.0 — PASS — 2026-09-01`;
// A BLOCK later re-audited to PASS: the last verdict for the wave stands, and
// the parenthetical is free text a heading regex must not choke on.
const REAUDIT = `### Wavecheck 1.0 — PASS — 2026-09-01
### Wavecheck 2.0 — BLOCK — 2026-09-01
### Wavecheck 2.0 (re-audit after Decision 4) — PASS — 2026-09-01`;

const status = (name, full, args = []) => {
  const file = join(DIR, `${name}.md`);
  writeFileSync(file, full);
  const r = spawnSync("node", [CLI, "plan-status", ...args, file], { encoding: "utf8" });
  return { out: `${r.stdout}${r.stderr}`, file };
};

cases.push(
  ["EXECUTING after every wave passed is a contradiction",
    () => status("stale", statusPlan("EXECUTING", BOTH_PASS)).out,
    (out) => out.includes("plan-status: FAIL") && out.includes("all 2 implementation wave(s) have a PASS report")],

  ["DONE over a BLOCK is a contradiction",
    () => status("overclaim", statusPlan("DONE", `### Wavecheck 1.0 — BLOCK — 2026-09-01`)).out,
    (out) => out.includes("plan-status: FAIL") && out.includes("last reported BLOCK")],

  ["DONE with only half the waves reported is a contradiction",
    () => status("half", statusPlan("DONE", ONE_PASS)).out,
    (out) => out.includes("plan-status: FAIL") && out.includes("1 of 2 wave(s) reported")],

  ["the last verdict for a wave wins, so a re-audited BLOCK is closed",
    () => status("reaudit", statusPlan("DONE", REAUDIT)).out,
    (out) => out.includes("plan-status: PASS")],

  ["review waves are excluded from the wave count",
    () => status("reviewwave", statusPlan("DONE", BOTH_PASS)).out,
    (out) => out.includes("plan-status: PASS") && out.includes("all 2 implementation wave(s)")],

  ["RECONCILED is accepted where DONE is, and never guessed at",
    () => status("reconciled", statusPlan("RECONCILED", BOTH_PASS)).out,
    (out) => out.includes("plan-status: PASS")],

  ["an ungated plan's status is unconstrained",
    () => status("ungated", statusPlan("DRAFT", "")).out,
    (out) => out.includes("plan-status: PASS") && out.includes("has not been gated")],

  ["--write sets the status the reports prove", () => {
    const { file } = status("writeme", statusPlan("DONE", ONE_PASS), ["--write"]);
    return readFileSync(file, "utf8");
  }, (out) => /^status: EXECUTING$/m.test(out)],

  ["--write refuses where two statuses are both consistent",
    () => status("writeambig", statusPlan("EXECUTING", BOTH_PASS), ["--write"]).out,
    (out) => out.includes("cannot resolve this") && out.includes("DONE or RECONCILED")],

  ["--write leaves CRLF line endings alone", () => {
    const { file } = status("crlf", statusPlan("DONE", ONE_PASS).replace(/\n/g, "\r\n"), ["--write"]);
    const after = readFileSync(file, "utf8");
    return `lf-only=${(after.match(/(?<!\r)\n/g) || []).length} crlf=${(after.match(/\r\n/g) || []).length}`;
  }, (out) => out.startsWith("lf-only=0 ") && !out.endsWith("crlf=0")],

  ["validate-plan fails on a status the reports contradict",
    () => validateRaw("statusvalidate", statusPlan("DONE", ONE_PASS)),
    (out) => out.includes("validate-plan: FAIL") && out.includes("the wavecheck reports are the only state a gate writes")]
);

// --------------------------------------------------------------------------
// The small lane and solo execution (issues #4 and #1). The prohibition on
// same-wave dependencies exists for SIMULTANEITY; solo has none, so the rule is
// fleet-only. Everything written before v0.8.0 omits the key, defaults to
// fleet, and is judged exactly as it was.

const lanePlan = ({ fv = 3, lane, execution, waves = "", tasks }) => `---
plan: 900-fixture
format_version: ${fv}
status: EXECUTING
${lane ? `lane: ${lane}\n` : ""}${execution ? `execution: ${execution}\n` : ""}---

${tasks}
${waves}
`;

const twoTasks = (dep) => `#### T1.0.1 — first
- **Files owned:** \`a.txt\`
- **Acceptance criterion:** \`true\` exits 0.

#### T1.0.2 — second
- **Files owned:** \`b.txt\`
- **Depends on:** ${dep}
- **Acceptance criterion:** \`true\` exits 0.`;

// T1.0.1 depending on T2.0.1 is a LATER wave: impossible however tasks are run.
const forward = `#### T1.0.1 — first
- **Files owned:** \`a.txt\`
- **Depends on:** T2.0.1
- **Acceptance criterion:** \`true\` exits 0.

#### T2.0.1 — later
- **Files owned:** \`b.txt\`
- **Acceptance criterion:** \`true\` exits 0.`;

cases.push(
  ["a same-wave dependency is legal under execution: solo",
    () => validateRaw("solo-dep", lanePlan({ execution: "solo", tasks: twoTasks("T1.0.1") })),
    (out) => out.includes("validate-plan: PASS")],

  ["the same dependency still FAILs when the key is absent (fleet is the default)",
    () => validateRaw("fleet-dep", lanePlan({ tasks: twoTasks("T1.0.1") })),
    (out) => out.includes("SAME wave 1.0")],

  ["a dependency on a LATER wave FAILs even under solo",
    () => validateRaw("solo-forward", lanePlan({ execution: "solo", tasks: forward })),
    (out) => out.includes("which is not earlier than its own wave")],

  ["lane: small refuses more than one implementation wave",
    () => validateRaw("small-2waves", lanePlan({ lane: "small", execution: "solo", tasks: twoTasks("—"), waves: "### Wave 1.0 — one\n### Wave 2.0 — two" })),
    (out) => out.includes("declares 2 implementation waves")],

  ["lane: small refuses a Wave x.R quality review",
    () => validateRaw("small-review", lanePlan({ lane: "small", execution: "solo", tasks: twoTasks("—"), waves: "### Wave 1.0 — one\n### Wave 1.R — review" })),
    (out) => out.includes("quality-review wave(s)")],

  ["lane: small with one wave and no review passes",
    () => validateRaw("small-ok", lanePlan({ lane: "small", execution: "solo", tasks: twoTasks("T1.0.1"), waves: "### Wave 1.0 — one" })),
    (out) => out.includes("validate-plan: PASS")],

  ["an unknown lane is rejected, not defaulted",
    () => validateRaw("lane-typo", lanePlan({ lane: "smal", tasks: twoTasks("—") })),
    (out) => out.includes(`lane "smal" unknown`)],

  ["an unknown execution mode is rejected, not defaulted",
    () => validateRaw("exec-typo", lanePlan({ execution: "sole", tasks: twoTasks("—") })),
    (out) => out.includes(`execution "sole" unknown`)],

  ["execution: solo on format_version 2 is rejected",
    () => validateRaw("solo-fv2", lanePlan({ fv: 2, execution: "solo", tasks: twoTasks("—") })),
    (out) => out.includes("needs format_version 3 or later")]
);

// --------------------------------------------------------------------------
// An unsigned human phase gate is a legitimate reason to stay EXECUTING
// (issue #9). Every wave passing is not the same as the plan being finished,
// and `reconcile` refuses to close on exactly this ground.

// The human declaration sits on the THIRD line on purpose: plan 005 wrote
// "plus human sign-off" three lines below the marker, and a single-line test
// misses it.
const WRAPPED_OPEN_GATE = `**Phase gate:** \`npm test\` exits 0,
\`npm run build\` exits 0, the full sweep,
and \`npm run verify\` — plus human sign-off.`;
const SIGNED_GATE = `**Phase gate: CLOSED, approved by sandeep — 2026-09-01.**
Conditions met: everything the unmet form asked for.`;
const NO_HUMAN_GATE = `**Phase gate:** \`npm test\` exits 0 and \`npm run build\` exits 0.`;

const gatePlan = (status, gate) => `---
plan: 900-fixture
format_version: 3
status: ${status}
---

## Phase 1: the only phase
${gate}

#### T1.0.1 — first
- **Files owned:** \`a.txt\`
- **Acceptance criterion:** \`true\` exits 0.

### Wave 1.0 — one

## Wavecheck reports
### Wavecheck 1.0 — PASS — 2026-09-01
`;

cases.push(
  ["EXECUTING is legitimate while a human phase gate is unsigned",
    () => status("gate-open", gatePlan("EXECUTING", WRAPPED_OPEN_GATE)).out,
    (out) => out.includes("plan-status: PASS") && out.includes("ask for human approval and record none")],

  ["the human declaration is found on a wrapped continuation line",
    () => status("gate-wrapped", gatePlan("EXECUTING", WRAPPED_OPEN_GATE)).out,
    (out) => out.includes("1 phase gate(s) ask for human approval")],

  ["once the gate is signed, EXECUTING is a contradiction again",
    () => status("gate-signed", gatePlan("EXECUTING", SIGNED_GATE)).out,
    (out) => out.includes("plan-status: FAIL") && out.includes("Expected DONE or RECONCILED")],

  ["a gate that asks for no human does not excuse EXECUTING",
    () => status("gate-nohuman", gatePlan("EXECUTING", NO_HUMAN_GATE)).out,
    (out) => out.includes("plan-status: FAIL") && out.includes("Expected DONE or RECONCILED")],

  ["DONE stays legitimate with an unsigned gate — the rule widens, never narrows",
    () => status("gate-done", gatePlan("DONE", WRAPPED_OPEN_GATE)).out,
    (out) => out.includes("plan-status: PASS")],

  ["--write still refuses to close a plan whose human gate is unsigned",
    () => status("gate-write", gatePlan("EXECUTING", WRAPPED_OPEN_GATE), ["--write"]).out,
    (out) => out.includes("plan-status: PASS") && !out.includes("WROTE")]
);

// --------------------------------------------------------------------------
// A Testing Gate naming a driver seatrial will not use (issue #7). Same shape
// as the `video` rule one field over: the run would produce a different kind of
// evidence than the gate promises, and the case substitutes an artifact nobody
// can compare. Caught at plan time because it is cheaper there.

const gateSection = (browser) => `---
plan: 900-fixture
format_version: 3
status: EXECUTING
---

#### T1.0.1 — first
- **Files owned:** \`a.txt\`
- **Acceptance criterion:** \`true\` exits 0.

## Testing Gate

| Field | Value |
|---|---|
| Target | http://localhost:3000 |
| Browser | ${browser} |

### TG1 — a case
- preconditions: the app is up
- steps: Given / When / Then
- expected: it works
- evidence: screenshot
- severity: blocker

## Deviation Log
`;

cases.push(
  ["a Testing Gate naming a rival driver is rejected",
    () => validateRaw("gate-cypress", gateSection("Cypress 13, Electron runner"), true),
    (out) => out.includes("names `Cypress` as the driver")],

  ["naming another driver only to exclude it does not trip the check",
    () => validateRaw("gate-guarded", gateSection("Playwright MCP, Chromium (not Puppeteer)"), true),
    (out) => !out.includes("as the driver, but seatrial drives")],

  ["the supported driver alone is fine",
    () => validateRaw("gate-ok", gateSection("Chromium via Playwright MCP"), true),
    (out) => !out.includes("as the driver, but seatrial drives")]
);

// --------------------------------------------------------------------------
// Where a plan goes is resolved, not argued for (issue #6). A repo whose house
// rules forbid committing tool artifacts gitignores the plans directory, and
// every plan then carried its own hand-written justification for living
// somewhere else — different reasoning each time.

// A repo that forbids committed planning artifacts, which is the whole case.
const ignoringRepo = (name, ignore) => {
  const dir = join(DIR, `plansdir-${name}`);
  mkdirSync(dir, { recursive: true });
  git(dir, ["init", "-q", "-b", "main"]);
  writeFileSync(join(dir, ".gitignore"), ignore);
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "-m", "chore: house rules"]);
  return dir;
};

cases.push(
  ["a committable plans dir is used as-is", () => {
    const dir = ignoringRepo("open", "node_modules/\n");
    return cli(dir, ["resolve-plans-dir"]);
  }, (out) => out.includes("resolve-plans-dir: docs/plans") && out.includes("committable: yes")],

  ["a gitignored plans dir falls back instead of being written where it cannot be committed", () => {
    const dir = ignoringRepo("closed", "docs/plans/\n");
    return cli(dir, ["resolve-plans-dir"]);
  }, (out) => out.includes("resolve-plans-dir: .drydock/plans") && out.includes("gitignored:  yes")],

  ["the fallback states plainly that the plan is not committed", () => {
    const dir = ignoringRepo("wording", "docs/plans/\n");
    return cli(dir, ["resolve-plans-dir"]);
  }, (out) => out.includes("**Plan location:**") && out.includes("NOT committed") && out.includes("git clean -xdf")],

  ["the committable case gets the same sentence, different clause", () => {
    const dir = ignoringRepo("wording2", "node_modules/\n");
    return cli(dir, ["resolve-plans-dir"]);
  }, (out) => out.includes("**Plan location:**") && out.includes("committed with the repo")],

  ["a repo-specific plans dir can be passed and is checked too", () => {
    const dir = ignoringRepo("custom", "planning/\n");
    return cli(dir, ["resolve-plans-dir", "planning"]);
  }, (out) => out.includes("preferred:   planning") && out.includes("resolve-plans-dir: .drydock/plans")]
);

// --------------------------------------------------------------------------
// An empty enforcement log has three different causes and they are not the same
// finding (issue #3). The old message listed them and asked the reader to pick;
// the tool holds the evidence, so it decides. Same reasoning as `wave-start`
// and `task-close`: a rule a model has to remember to apply is not a rule.

const enforcedPlan = `---
plan: 900-fixture
format_version: 3
status: EXECUTING
enforcement: required
attribution: manifest
execution: solo
---

#### T1.0.1 — first
- **Files owned:** \`a.txt\`
- **Acceptance criterion:** \`true\` exits 0.

### Wave 1.0 — one
`;

// A wave whose task committed and was recorded, so attribution is clean and the
// only thing missing is the hook's receipt.
const enforcedRepo = (name, log) => {
  const dir = join(DIR, `enf-${name}`);
  mkdirSync(dir, { recursive: true });
  git(dir, ["init", "-q", "-b", "main"]);
  writeFileSync(join(dir, ".gitignore"), ".drydock/\n");
  writeFileSync(join(dir, "plan.md"), enforcedPlan);
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "-m", "chore: baseline"]);
  commitAs(dir, ["a.txt"], "fix(a): do the thing");
  cli(dir, ["task-close", "plan.md", "T1.0.1"]);
  if (log !== null) writeFileSync(join(dir, ".drydock", "enforcement.log"), log);
  return dir;
};

const OTHER_WAVE = JSON.stringify({ ts: "x", plan: "900-fixture", wave: "9.9", decision: "allow", path: "z.txt", owns: ["z.txt"] }) + "\n";

// There is ONE enforcement.log per repo and every plan appends to it, so an
// entry has to be matched on (plan, wave) and not on the wave alone. `1.0` is
// the first wave of every plan, so wave-only selection unions a foreign plan's
// `owns` into this plan's armed boundary and the comparison can only fail, from
// the repo's second plan onwards. Issue #10.
const OWN_RECEIPT = JSON.stringify({ ts: "x", plan: "900-fixture", wave: "1.0", decision: "allow", path: "a.txt", owns: ["a.txt"] }) + "\n";
const OTHER_PLAN = JSON.stringify({ ts: "x", plan: "001-elsewhere", wave: "1.0", decision: "allow", path: "src/other.js", owns: ["src/other.js"] }) + "\n";
// A receipt with no plan id: a hand-written `wave-owns.json`, or a plan with no
// `plan:` key. Unattributable is not foreign; dropping it would flip a clean
// wave into the far louder "the hook never ran here" error.
const UNIDENTIFIED = JSON.stringify({ ts: "x", plan: null, wave: "1.0", decision: "allow", path: "a.txt", owns: ["a.txt"] }) + "\n";

// A CLOSED wave as it looks months later: the task's commit is in history, the
// plan carries the wavecheck report wavecheck wrote, and `.drydock/` has been
// cleaned away. `rm`-ing the directory after `task-close` is the whole point —
// it reproduces the state that made plan 005's own gate fail.
const sealedRepo = (name, files = ["a.txt"], reaudited = false) => {
  const dir = join(DIR, `sealed-${name}`);
  mkdirSync(dir, { recursive: true });
  git(dir, ["init", "-q", "-b", "main"]);
  writeFileSync(join(dir, ".gitignore"), ".drydock/\n");
  writeFileSync(join(dir, "plan.md"), enforcedPlan);
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "-m", "chore: baseline"]);
  commitAs(dir, files, "fix(a): do the thing");
  const sha = git(dir, ["rev-parse", "--short=7", "HEAD"]);

  // A SUPERSEDED report ahead of the live one, when asked for. A re-audit is an
  // ordinary heading, so a wave can carry two reports for the same id and only
  // the last one stands — `derivePlanState` has always taken the last, and
  // `sealedRecord` took the first until 0.8.11. Its placeholder sha is not a
  // commit in this repo, so reading it produces a false "history moved under
  // the recorded attribution" on a history that never moved.
  const superseded = reaudited
    ? `
### Wavecheck 1.0 — BLOCK — 2026-08-20

\`\`\`
| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.0.1 | \`0000000\` | \`a.txt\` | \`a.txt\` | none |
\`\`\`
`
    : "";

  // The report exactly as wavecheck appends it, evidence table and all.
  writeFileSync(
    join(dir, "plan.md"),
    `${enforcedPlan}
## Wavecheck reports
${superseded}
### Wavecheck 1.0 — PASS — 2026-09-01

\`\`\`
| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.0.1 | \`${sha}\` | \`${files.join("`<br>`")}\` | \`a.txt\` | none |

Working tree: clean
  note: enforcement active: 13 hook decision(s) recorded for wave 1.0 (1 denied)
\`\`\`
`
  );
  git(dir, ["add", "plan.md"]);
  git(dir, ["commit", "-q", "-m", "docs: wavecheck report"]);
  rmSync(join(dir, ".drydock"), { recursive: true, force: true }); // the clean
  return dir;
};

cases.push(
  ["no log at all is diagnosed as the hook never having run",
    () => cli(enforcedRepo("nolog", null), ["audit-wave", "plan.md", "1.0"]),
    (out) => out.includes("exists at all, so the hook never ran here")],

  ["a log carrying other waves is diagnosed as this wave bypassing it",
    () => cli(enforcedRepo("otherwave", OTHER_WAVE), ["audit-wave", "plan.md", "1.0"]),
    (out) => out.includes("decision(s) for OTHER waves") && out.includes("go through Bash")],

  ["an empty log is diagnosed as armed but never invoked",
    () => cli(enforcedRepo("emptylog", ""), ["audit-wave", "plan.md", "1.0"]),
    (out) => out.includes("armed at some point, invoked never")],

  ["a foreign plan sharing the wave id neither widens the boundary nor inflates the count",
    () => cli(enforcedRepo("foreignplan", OWN_RECEIPT + OTHER_PLAN), ["audit-wave", "plan.md", "1.0"]),
    (out) => out.includes("audit-wave 1.0: PASS") && !out.includes("src/other.js") &&
             out.includes("1 hook decision(s) recorded for wave 1.0")],

  ["a receipt with no plan id still counts as this plan's",
    () => cli(enforcedRepo("nullplan", UNIDENTIFIED), ["audit-wave", "plan.md", "1.0"]),
    (out) => out.includes("audit-wave 1.0: PASS") && !out.includes("the hook never ran here")],

  ["a log holding only a foreign plan's entries reads as bypass, not as never invoked",
    () => cli(enforcedRepo("foreignonly", OTHER_PLAN), ["audit-wave", "plan.md", "1.0"]),
    (out) => out.includes("decision(s) for OTHER waves or plans") && !out.includes("armed at some point")],

  ["a missing receipt is reported as an unmet claim, not an unaudited wave",
    () => cli(enforcedRepo("claim", null), ["audit-wave", "plan.md", "1.0"]),
    (out) => out.includes("Prevention did not run") && out.includes("Detection did")],

  ["every audit states which layer verified ownership",
    () => cli(enforcedRepo("layer", null), ["audit-wave", "plan.md", "1.0"]),
    (out) => out.includes("independently of the hook. Detection, not prevention")],

  // --- a sealed wave, re-audited after `.drydock/` was cleaned --------------
  //
  // `.drydock/` is gitignored, so a closed wave's receipts do not survive a
  // clean. Measured 2026-09-01: plan 005 read `status: RECONCILED` behind a PASS
  // report, and re-running its own gate gave FAIL (7) — six tasks
  // "unattributed" plus an `enforcement: required` breach — entirely because the
  // artifacts were gone. Nothing had to be built to fix it: wavecheck already
  // pastes the audit's evidence table into the plan, and the plan is committed.
  //
  // The two halves are worth different amounts and the tests say so separately.
  ["a sealed report recovers attribution once the manifest is gone", () => {
    const dir = sealedRepo("recover");
    return cli(dir, ["audit-wave", "plan.md", "1.0"]);
  }, (out) => out.includes("ATTRIBUTION RECOVERED FROM THE SEALED REPORT") && out.includes("audit-wave 1.0: PASS")],

  // The recovery must not be a rubber stamp. The report supplies the LOOKUP; the
  // file sets are still re-derived from git and re-compared to `owns`, so a
  // sealed row pointing at a commit that broke its boundary still FAILs. If this
  // case ever passes, the fallback has become a way to launder a bad wave.
  ["a sealed row naming a boundary-breaking commit still FAILs", () => {
    const dir = sealedRepo("dirty", ["a.txt", "unowned.txt"]);
    return cli(dir, ["audit-wave", "plan.md", "1.0"]);
  }, (out) => out.includes("`unowned.txt`, which is outside its `owns`") && out.includes("audit-wave 1.0: FAIL")],

  // The false diagnosis this whole case exists for: the tool told plan 005 "the
  // hook never ran here" about a wave whose own report records the hook denying
  // a write. A record is not a receipt, and the note says which it is.
  ["a cleaned log with a sealed receipt count is not 'the hook never ran'", () => {
    const dir = sealedRepo("receipt");
    return cli(dir, ["audit-wave", "plan.md", "1.0"]);
  }, (out) =>
    out.includes("records 13 hook decision(s), 1 denied") &&
    out.includes("RECORD that enforcement ran, not a RECEIPT") &&
    !out.includes("the hook never ran here")],

  // A re-audited wave carries TWO reports for one id and only the last stands.
  // Reading the first took the superseded BLOCK's placeholder sha and failed the
  // wave with "history moved under the recorded attribution" — on a history that
  // had not moved. `derivePlanState` had always taken the last; two readers of
  // the same headings must not disagree about which one counts.
  ["a re-audited wave recovers the LAST report, not the superseded one", () => {
    const dir = sealedRepo("reaudit", ["a.txt"], true);
    return cli(dir, ["audit-wave", "plan.md", "1.0"]);
  }, (out) =>
    out.includes("sealed in this plan (PASS)") &&
    out.includes("audit-wave 1.0: PASS") &&
    !out.includes("0000000")],

  // ...and when a sha really is unreachable, the error names the source that
  // supplied it. It said "manifest names <sha>" even where the sealed report
  // did, sending the reader to a file that was never consulted.
  ["an unreachable sha blames the source that actually named it", () => {
    const dir = sealedRepo("blame", ["a.txt"]);
    // Break the sealed table's sha; the manifest is already gone.
    const p = join(dir, "plan.md");
    writeFileSync(p, readFileSync(p, "utf8").replace(/`[0-9a-f]{7}`/, "`0000000`"));
    return cli(dir, ["audit-wave", "plan.md", "1.0"]);
  }, (out) => out.includes("the sealed wavecheck 1.0 report in this plan names") && !out.includes("manifest names")],

  // ...and with no sealed report to lean on, the original three-way diagnosis is
  // untouched. Recovery must not become a way for an unsealed wave to escape.
  ["an unsealed wave with no log still gets the old diagnosis",
    () => cli(enforcedRepo("unsealed", null), ["audit-wave", "plan.md", "1.0"]),
    (out) => out.includes("exists at all, so the hook never ran here") && out.includes("audit-wave 1.0: FAIL")],

  // --- version drift between the running script and the installed plugin ----
  //
  // The skills are loaded by the HOST from the installed plugin; this script is
  // whatever path the command named. In a checkout those are two copies, and on
  // 2026-09-01 they were four releases apart: the install sat at 0.7.0 while the
  // repo was at 0.8.4, and 0.7.0 — which does not know `execution: solo` —
  // FAILED plan 005 with four same-wave-dependency errors that 0.8.4 PASSES.
  // Two authoritative-looking verdicts, opposite conclusions, nothing naming the
  // cause.
  ["a verdict states which copy of the audit produced it",
    () => cli(closedWave("stamp"), ["audit-wave", "plan.md", "1.0"]),
    (out) => /drydock-audit\.mjs v\d+\.\d+\.\d+ at .*drydock-audit\.mjs/.test(out)],

  ["a differently-versioned install is reported as drift", () => {
    const cfg = fakeConfig("drift", "0.7.0", "C:\\nowhere\\drydock\\0.7.0");
    return cli(closedWave("drift"), ["audit-wave", "plan.md", "1.0"], { CLAUDE_CONFIG_DIR: cfg });
  }, (out) => out.includes("VERSION DRIFT") && out.includes("v0.7.0")],

  // The check must not cry drift at a developer who is simply up to date, or it
  // becomes noise everyone learns to scroll past. Same version = silent.
  ["a checkout matching the installed version is not drift", () => {
    const mine = JSON.parse(
      readFileSync(fileURLToPath(new URL("../.claude-plugin/plugin.json", import.meta.url)), "utf8")
    ).version;
    const cfg = fakeConfig("same", mine, "C:\\nowhere\\drydock\\current");
    return cli(closedWave("same"), ["audit-wave", "plan.md", "1.0"], { CLAUDE_CONFIG_DIR: cfg });
  }, (out) => !out.includes("VERSION DRIFT")],

  // No install record at all — the plugin run straight from a clone, or a host
  // that keeps its config elsewhere. Best-effort bookkeeping must never turn
  // into a failure, so this stays quiet rather than guessing.
  ["a missing install record is silent, not a warning", () => {
    const cfg = join(DIR, "cfg-none");
    mkdirSync(cfg, { recursive: true });
    return cli(closedWave("none"), ["audit-wave", "plan.md", "1.0"], { CLAUDE_CONFIG_DIR: cfg });
  }, (out) => !out.includes("VERSION DRIFT") && out.includes("audit-wave 1.0: PASS")],

  // --- consumers may only name vocabulary the contract defines --------------
  //
  // The README's central architectural claim is that everything interoperates
  // through ONE contract: "Change it → bump `format_version` → update every
  // consumer." Nothing enforced the consumers' half, and four instances of
  // drift were found by hand across three review passes, every one invisible to
  // every gate:
  //
  //   - `Assumptions Register` — the input to `replan`'s blast-radius step and
  //     `reconcile`'s postmortem. Defined nowhere; no plan ever had one.
  //   - `reads` — both executor agents told the executor its `reads` files were
  //     read-only context. No such field; the real one is `Context brief:`.
  //   - `instructions` — `replan` computed blast radius over it. Not a field.
  //   - `acceptance` / `depends_on` — real fields under invented names.
  //
  // So the contract's vocabulary is extracted and the consumers are held to it.
  // The allowlists below are derived where they can be — plugin config keys
  // from `plugin.json`, skill names from the skills directory — so they cannot
  // themselves go stale; only the genuinely unclassifiable handful is hand-held,
  // and each entry is named rather than lumped into a bag.
  ["consumers name only vocabulary the format contract defines", () => {
    const root = fileURLToPath(new URL("..", import.meta.url));
    const read = (p) => readFileSync(join(root, p), "utf8");
    const contract = read("skills/planwright/reference/plan-format.md");

    const vocabulary = new Set();
    // Task-block bullets: `- **Files owned:** …`
    for (const m of contract.matchAll(/^- \*\*([^:*]+):?\*\*/gm)) {
      const t = m[1].trim().toLowerCase();
      if (/^[a-z][a-z /]*$/.test(t)) vocabulary.add(t);
    }
    // Backticked table keys (the Testing Gate per-case fields), frontmatter
    // keys, and every lowercase token the contract itself backticks — if the
    // spine says it, a consumer may say it.
    for (const m of contract.matchAll(/^\|\s*`([a-z_]+)`\s*\|/gm)) vocabulary.add(m[1]);
    for (const m of contract.matchAll(/^([a-z_]+):\s/gm)) vocabulary.add(m[1]);
    for (const m of contract.matchAll(/`([a-z][a-z_ -]{1,24})`/g)) vocabulary.add(m[1].toLowerCase());

    // Derived allowlists. These are not plan vocabulary and never were.
    for (const k of Object.keys(JSON.parse(read(".claude-plugin/plugin.json")).userConfig ?? {})) {
      vocabulary.add(k);
    }
    for (const d of readdirSync(join(root, "skills"))) vocabulary.add(d);
    // Shell commands and bare prose adjectives. The only hand-held entries.
    for (const t of ["curl", "fetch", "git log", "git status", "low", "addition"]) vocabulary.add(t);

    // SCOPED, not global. The executor's completion-report schema is the
    // executor's own contract rather than the plan format's, so its field names
    // are legitimate in `agents/` and nowhere else. Adding them globally — the
    // first version of this check did — quietly legitimised `acceptance` in
    // `replan`, which is one of the exact drifts this check exists to catch:
    // the report's `acceptance:` and a plan's `Acceptance criterion:` are
    // different things wearing the same word.
    const agentOnly = new Set(
      [...read("agents/executor.md").matchAll(/^([a-z_]+):/gm)].map((m) => m[1])
    );

    const consumers = [
      ...readdirSync(join(root, "agents")).map((f) => `agents/${f}`),
      ...readdirSync(join(root, "skills")).map((d) => `skills/${d}/SKILL.md`),
    ];
    const unknown = [];
    for (const rel of consumers) {
      const allowed = (tok) =>
        vocabulary.has(tok) || (rel.startsWith("agents/") && agentOnly.has(tok));
      for (const m of read(rel).matchAll(/`([a-z][a-z_ ]{2,24})`/g)) {
        const tok = m[1].toLowerCase();
        if (!allowed(tok) && !unknown.some((u) => u.tok === tok && u.rel === rel)) {
          unknown.push({ tok, rel });
        }
      }
    }
    return unknown.length === 0
      ? "clean"
      : `unknown vocabulary: ${unknown.map((u) => `\`${u.tok}\` (${u.rel})`).join(", ")}`;
  }, (out) => out === "clean"],

  // Not a plan check — a packaging one, and it lives here because this is the
  // file that already runs on every change to the plugin.
  //
  // `${CLAUDE_PLUGIN_ROOT}` is substituted by the HOST, and only where the host
  // loads the text itself: a skill body, an agent definition, `hooks.json`.
  // Measured 2026-09-01: invoking `drydock:wavecheck` returned its audit-wave
  // line with a real absolute path already in it, while `echo
  // "$CLAUDE_PLUGIN_ROOT"` in the Bash tool printed empty and
  // `node ${CLAUDE_PLUGIN_ROOT}/scripts/drydock-audit.mjs` died MODULE_NOT_FOUND.
  //
  // So the placeholder is correct in those three places and a live defect
  // anywhere else — a reference file or a README is read as DATA, byte for byte,
  // and whoever copies the command out of it gets `node /scripts/…`. That is
  // exactly what `plan-format.md` shipped until this test existed. The failure
  // is silent in the worst way: the command looks like every other command in
  // the corpus, and only the runner finds out.
  ["the plugin-root placeholder appears only where the host substitutes it",
    () => {
      const root = fileURLToPath(new URL("..", import.meta.url));
      const substituted = (rel) =>
        rel.endsWith("SKILL.md") || rel.startsWith("agents/") || rel === "hooks/hooks.json";
      const offenders = readdirSync(root, { recursive: true, withFileTypes: true })
        .filter((e) => e.isFile())
        .map((e) => `${e.parentPath ?? e.path}/${e.name}`.slice(root.length).split("\\").join("/").replace(/^\/+/, ""))
        .filter((rel) => !substituted(rel))
        .filter((rel) => /\.(md|json|mjs)$/.test(rel))
        .filter((rel) => {
          // Inside a fenced block ONLY. A placeholder in prose is describing the
          // mechanism — including the paragraph in `plan-format.md` that warns
          // about this exact failure, and this comment. A placeholder inside a
          // ``` fence is a command someone will copy and run, which is the bug.
          // Keyword-excluding the prose instead was tried first and was wrong on
          // its first run: the warning paragraph wraps, so the offending token
          // and the word "substitutes" landed on different lines.
          const text = readFileSync(join(root, rel), "utf8");
          let fenced = false;
          return text.split(/\r?\n/).some((l) => {
            if (/^\s*```/.test(l)) { fenced = !fenced; return false; }
            return fenced && l.includes("${CLAUDE_PLUGIN_ROOT}");
          });
        });
      return offenders.length === 0 ? "clean" : `unsubstituted placeholder in: ${offenders.join(", ")}`;
    },
    (out) => out === "clean"]
);

let failed = 0;
for (const [name, run, ok] of cases) {
  const out = run();
  if (ok(out)) {
    console.log(`ok   — ${name}`);
  } else {
    failed++;
    console.log(`FAIL — ${name}\n${out.split("\n").map((l) => `       ${l}`).join("\n")}`);
  }
}

console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed ? 1 : 0);
