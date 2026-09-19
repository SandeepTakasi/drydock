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

// THE RUNTIME RUNNING THIS FILE, never the string "node". A bare "node" is a
// PATH lookup, and PATH can resolve to a different binary than the one running
// the suite -- measured 2026-09-19, where the first node on PATH was an x86_64
// build that stopped executing after a macOS major upgrade, so every case failed
// with `spawnSync node Unknown system error -86` (EBADARCH) while the suite's
// own runtime was fine. `process.execPath` also guarantees the hook is exercised
// on the same Node version as the assertions about it.
const NODE = process.execPath;

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
  const r = spawnSync(NODE, [CLI, ...args], { encoding: "utf8" });
  return `${r.stdout}${r.stderr}`;
};

const validate = (name, body, strict = false) => {
  const file = join(DIR, `${name}.md`);
  writeFileSync(file, head + body);
  const args = strict ? ["validate-plan", "--strict", file] : ["validate-plan", file];
  const r = spawnSync(NODE, [CLI, ...args], { encoding: "utf8" });
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
  const r = spawnSync(NODE, [CLI, ...args], { cwd, encoding: "utf8", env: { ...process.env, ...env } });
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

// EVERY COMMIT IN THE SAME SECOND. A commit timestamp has one-second
// granularity, so commits made inside one second have no defined date order,
// and `audit-wave` has to derive "earliest" and "latest" from ancestry instead.
// Pinning the date makes that condition deterministic: it is the normal case in
// CI, where a whole fixture commits in well under a second, and it is why an
// ordering bug here passed on a developer machine and failed on every runner.
const SAME_SECOND = "2026-01-01T00:00:00Z";
const commitAtSameSecond = (dir, files, subject) => {
  for (const f of files) writeFileSync(join(dir, f), `${f}\n`);
  const env = { ...process.env, GIT_AUTHOR_DATE: SAME_SECOND, GIT_COMMITTER_DATE: SAME_SECOND };
  execFileSync("git", [...GIT, "add", ...files], { cwd: dir, encoding: "utf8", env, stdio: ["ignore", "pipe", "pipe"] });
  execFileSync("git", [...GIT, "commit", "-q", "-m", subject], { cwd: dir, encoding: "utf8", env, stdio: ["ignore", "pipe", "pipe"] });
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
  const r = spawnSync(NODE, [CLI, "plan-status", ...args, file], { encoding: "utf8" });
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

    // Same scoping, second contract. The HOST PROFILE is its own schema, owned
    // by `skills/init`, and its vocabulary is legitimate there and nowhere else.
    // Adding it globally would let any skill say `provenance` and mean whatever
    // it liked -- the drift this check exists to catch.
    const initOnly = new Set(
      [...read("skills/init/reference/config-schema.md").matchAll(/`?([a-z][a-z_]{2,24})`?:/g)].map((m) => m[1])
    );
    for (const t of ["discovered", "stated"]) initOnly.add(t);

    const consumers = [
      ...readdirSync(join(root, "agents")).map((f) => `agents/${f}`),
      ...readdirSync(join(root, "skills")).map((d) => `skills/${d}/SKILL.md`),
    ];
    const unknown = [];
    for (const rel of consumers) {
      const allowed = (tok) =>
        vocabulary.has(tok) ||
        (rel.startsWith("agents/") && agentOnly.has(tok)) ||
        (rel.startsWith("skills/init/") && initOnly.has(tok));
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

// --------------------------------------------------------------------------
// COMMITS NO TASK CLAIMS. `audit-wave` only ever inspected commits it could
// already attribute, so a commit belonging to no task was invisible: two clean
// task commits plus one `chore:` adding an unowned file returned PASS.

const strayRepo = (name, subject = "chore: unrelated refactor", files = ["evil.ts"]) => {
  const dir = closedWave(name);
  commitAs(dir, files, subject);
  return dir;
};

cases.push(
  ["a commit no task claims fails the wave", () => cli(strayRepo("unattributed"), ["audit-wave", "plan.md", "1.0"]),
    (out) => out.includes("audit-wave 1.0: FAIL") && out.includes("claimed by no task") && out.includes("`evil.ts`")],

  // The plan document is owned by no task BY DESIGN: the orchestrator writes the
  // Deviation Log into it after the wave closes. Failing that would make correct
  // bookkeeping indistinguishable from a breach.
  ["a commit touching only the plan document is a note, not a failure", () => {
    const dir = closedWave("stray-plan");
    // APPEND, never rewrite: the plan document is the fixture, and overwriting
    // it leaves the wave with no tasks and the audit reporting that instead.
    writeFileSync(join(dir, "plan.md"), `${readFileSync(join(dir, "plan.md"), "utf8")}\n<!-- deviation log -->\n`);
    git(dir, ["add", "plan.md"]);
    git(dir, ["commit", "-q", "-m", "plan: deviation log"]);
    return cli(dir, ["audit-wave", "plan.md", "1.0"]);
  }, (out) => out.includes("audit-wave 1.0: PASS") && out.includes("recorded rather than failed")],

  // A commit touching only files the wave owns is a bookkeeping shape too: the
  // files were authorised, only the attribution is missing.
  ["a commit touching only owned files is a note, not a failure", () => {
    const dir = closedWave("stray-owned");
    // Append: commitAs writes `${f}\n`, which for a file the wave already
    // committed is a no-op, and git refuses an empty commit.
    writeFileSync(join(dir, "a.txt"), `${readFileSync(join(dir, "a.txt"), "utf8")}fixup\n`);
    git(dir, ["add", "a.txt"]);
    git(dir, ["commit", "-q", "-m", "fixup: whitespace"]);
    return cli(dir, ["audit-wave", "plan.md", "1.0"]);
  }, (out) => out.includes("audit-wave 1.0: PASS") && out.includes("recorded rather than failed")],

  // Re-auditing a CLOSED record must not fail it on a check that did not exist
  // when it ran. Plan 005 wave 1.0 produced 20 such errors, naming release
  // commits from days after the wave sealed.
  ["a stray in an already-sealed wave is recorded, not failed", () => {
    // The stray goes BETWEEN the two task commits on purpose. A sealed wave is
    // bounded by its own span, so a commit after its last task commit is out of
    // range by design; only one inside the span exercises the downgrade.
    const dir = mkrepo("stray-sealed");
    commitAtSameSecond(dir, ["a.txt"], "fix(parser): tighten the thing");
    cli(dir, ["task-close", "plan.md", "T1.0.1"]);
    commitAtSameSecond(dir, ["evil.ts"], "chore: unrelated refactor");
    commitAtSameSecond(dir, ["b.txt"], "feat(core): add the other thing");
    cli(dir, ["task-close", "plan.md", "T1.0.2"]);
    const plan = readFileSync(join(dir, "plan.md"), "utf8");
    writeFileSync(join(dir, "plan.md"), `${plan}\n### Wave 1.0 - w\n\n### Wavecheck 1.0, PASS, 2026-01-01\n`);
    git(dir, ["add", "plan.md"]);
    git(dir, ["commit", "-q", "-m", "plan: seal wave 1.0"]);
    return cli(dir, ["audit-wave", "plan.md", "1.0"]);
  }, (out) => out.includes("audit-wave 1.0: PASS") && out.includes("already sealed")],
);

cases.push(
  // The live counterpart, also at one timestamp: the wave must still FAIL on a
  // stray it cannot date-order.
  ["a stray is caught even when every commit shares one timestamp", () => {
    const dir = mkrepo("stray-same-second");
    commitAtSameSecond(dir, ["a.txt"], "fix(parser): tighten the thing");
    cli(dir, ["task-close", "plan.md", "T1.0.1"]);
    commitAtSameSecond(dir, ["b.txt"], "feat(core): add the other thing");
    cli(dir, ["task-close", "plan.md", "T1.0.2"]);
    commitAtSameSecond(dir, ["evil.ts"], "chore: unrelated refactor");
    return cli(dir, ["audit-wave", "plan.md", "1.0"]);
  }, (out) => out.includes("audit-wave 1.0: FAIL") && out.includes("`evil.ts`")],
);

cases.push(
  // PATH FORM, not separators. The repo lives under an UNRESOLVED temp path
  // (`/var/...`, which git reports as `/private/var/...`; on Windows CI a
  // `RUNNER~1` 8.3 short path whose toplevel is long-form). Passing the plan by
  // that absolute path is what Windows CI does implicitly, and subtracting the
  // root by length then produced a path pointing nowhere: the plan document was
  // no longer recognised as itself and its own commit was reported as a breach.
  ["the plan document is recognised through an unresolved absolute path", () => {
    const dir = closedWave("path-form");
    writeFileSync(join(dir, "plan.md"), `${readFileSync(join(dir, "plan.md"), "utf8")}\n<!-- deviation log -->\n`);
    git(dir, ["add", "plan.md"]);
    git(dir, ["commit", "-q", "-m", "plan: deviation log"]);
    // join(DIR, ...) is the mkdtemp form, deliberately NOT realpath'd here.
    return cli(dir, ["audit-wave", join(dir, "plan.md"), "1.0"]);
  }, (out) => out.includes("audit-wave 1.0: PASS") && out.includes("recorded rather than failed")],
);

// --------------------------------------------------------------------------
// SUBJECT COLLISION. `8410e54`, a release bump made a day after plan 003 sealed,
// reused the subject `drydock(T1.2.1)`. The audit then reported an ownership
// violation against a wave that never touched the file in that commit.

cases.push(
  ["a reused commit subject is unverifiable, not a breach", () => {
    const dir = join(DIR, "repo-collide");
    mkdirSync(dir, { recursive: true });
    git(dir, ["init", "-q", "-b", "main"]);
    writeFileSync(join(dir, ".gitignore"), ".drydock/\n");
    writeFileSync(join(dir, "plan.md"), planText(2, "commit-prefix"));
    git(dir, ["add", "-A"]);
    git(dir, ["commit", "-q", "-m", "chore: baseline"]);
    commitAs(dir, ["a.txt"], "drydock(T1.0.1): first");
    commitAs(dir, ["b.txt"], "drydock(T1.0.2): second");
    // A later, unrelated commit reusing the id, touching a file T1.0.1 does not own.
    commitAs(dir, ["unrelated.txt"], "drydock(T1.0.1): release bump");
    return cli(dir, ["audit-wave", "plan.md", "1.0"]);
  }, (out) => out.includes("CANNOT be judged") && !out.includes("outside its `owns`")],
);

// --------------------------------------------------------------------------
// ATTRIBUTION DEFAULT BY FORMAT VERSION. Keeping the `commit-prefix` reader is
// what lets plans 001-004 (all v2, none declaring the key) audit exactly as they
// always did; defaulting v3 to `manifest` retires the collision class above for
// every new plan without a format bump.

const noAttrRepo = (name, fv) => {
  const dir = join(DIR, `repo-${name}`);
  mkdirSync(dir, { recursive: true });
  git(dir, ["init", "-q", "-b", "main"]);
  writeFileSync(join(dir, ".gitignore"), ".drydock/\n");
  writeFileSync(join(dir, "plan.md"), planText(fv, "manifest").replace(/^attribution:.*$/m, "").replace(/\n\n\n/, "\n\n"));
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "-m", "chore: baseline"]);
  commitAs(dir, ["a.txt"], "drydock(T1.0.1): first");
  commitAs(dir, ["b.txt"], "drydock(T1.0.2): second");
  return dir;
};

cases.push(
  ["format_version 3 with no attribution key defaults to manifest",
    () => cli(noAttrRepo("fv3-default", 3), ["audit-wave", "plan.md", "1.0"]),
    (out) => out.includes("attribution: manifest") || out.includes("attribution.jsonl")],

  ["format_version 2 with no attribution key still audits by commit subject",
    () => cli(noAttrRepo("fv2-default", 2), ["audit-wave", "plan.md", "1.0"]),
    (out) => out.includes("attribution: commit-prefix")],
);

// --------------------------------------------------------------------------
// ONE GRAMMAR. `plan-format.md` instructs `N/A, <reason>` and the validator
// accepted only the two dashes, so a plan written to the contract failed the
// contract's own validator. And `WAVECHECK_RE` required a dash, so the
// contract's own `### Wavecheck <p>.<w>, PASS|BLOCK, <date>` template did not
// parse at all: a plan read as having zero gates, with its status unconstrained.

const naGatePlan = (gate) => `${head}
## 11. Testing Gate

${gate}

#### T1.0.1 — only
- **Files owned:** \`a.txt\`
- **Acceptance criterion:** \`true\` exits 0.
`;

cases.push(
  // `--strict`, because the Testing Gate check is strict-only: run without it
  // these three assert the absence of a message no code path can emit, which is
  // a test that passes on a deleted check.
  ["the contract's own `N/A, <reason>` form is accepted",
    () => validateRaw("na-comma", naGatePlan("N/A, this plan has no user-facing surface."), true),
    (out) => !out.includes("`N/A` with no reason")],
  ["`N/A - <reason>` still parses, for the five plans already written that way",
    () => validateRaw("na-hyphen", naGatePlan("N/A - no user-facing surface."), true),
    (out) => !out.includes("`N/A` with no reason")],
  ["`N/A` with no reason at all is still rejected",
    () => validateRaw("na-bare", naGatePlan("N/A"), true),
    (out) => out.includes("`N/A` with no reason")],

  // A verdict counts only for a wave the plan actually declares, so the fixture
  // needs the `### Wave` heading as well as the report.
  ["the contract's comma-form wavecheck heading is parsed as a gate",
    () => status("wc-comma", `${head}\n### Wave 1.0 - w\n\n#### T1.0.1 - a\n- **Files owned:** \`a.txt\`\n\n### Wavecheck 1.0, PASS, 2026-01-01\n`).out,
    (out) => /\|\s*1\.0\s*\|\s*PASS\s*\|/.test(out) && !out.includes("no wavecheck reports")],

  ["the em-dash form the five existing plans use still parses",
    () => status("wc-emdash", `${head}\n### Wave 1.0 - w\n\n#### T1.0.1 - a\n- **Files owned:** \`a.txt\`\n\n### Wavecheck 1.0 — PASS — 2026-01-01\n`).out,
    (out) => /\|\s*1\.0\s*\|\s*PASS\s*\|/.test(out)],

  // `([A-Z]+)` accepted any uppercase word, so `- NOTE: see above` yielded the
  // verdict NOTE and the plan derived as BLOCKED off a heading nobody meant.
  ["an uppercase word that is not a verdict is not read as one",
    () => status("wc-note", `${head}\n### Wave 1.0 - w\n\n#### T1.0.1 - a\n- **Files owned:** \`a.txt\`\n\n### Wavecheck 1.0 - NOTE: see the thread above\n`).out,
    (out) => out.includes("0 wavecheck report")],
);

// --------------------------------------------------------------------------
// A FENCED BLOCK IS DOCUMENTATION. A markdown sample showing `#### T1.0.9` with
// `Files owned: **` parsed as a real task, and `wave-start` then armed the hook
// with `owns: ["**"]` — a boundary permitting every write in the repo, derived
// from a code sample.

cases.push(
  ["an example task inside a fence is not a task", () => {
    const body = [
      "## 6. Findings & constraints",
      "",
      "Write tasks like this:",
      "",
      "```markdown",
      "#### T9.9.9 — example",
      "- **Files owned:** `**`",
      "```",
      "",
      "#### T1.0.1 — only",
      "- **Files owned:** `a.txt`",
      "- **Acceptance criterion:** `true` exits 0.",
    ].join("\n");
    return validateRaw("fenced", `${head}\n${body}\n`);
  }, (out) => out.includes("(1 task(s)") && !out.includes("T9.9.9")],

  // Zero tasks is a parse failure wearing a PASS: every other check then passes
  // vacuously, having nothing to disagree with.
  ["a plan the parser reads as having no tasks fails",
    () => validateRaw("no-tasks", `${head}\n## 1. Requirement\n\n##### T1.0.1 — five hashes\n- **Files owned:** \`a.txt\`\n`),
    (out) => out.includes("no tasks found")],
);

// --------------------------------------------------------------------------
// A DECLARED BOUNDARY THAT YIELDS NOTHING. The strict ownership check compared a
// loose read of the `Files owned:` block against a strict one, so a line of real
// paths with no backticks agreed with itself at zero and passed: the task
// declares two files, the parser sees none, and `wave-start` arms a boundary
// owning nothing. Issue #8's silent narrowing, taken to its limit.

const ownsPlan = (declared) => `${head}
### Wave 1.0 - w

#### T1.0.1 - a
- **Files owned:** ${declared}
- **Context brief:** none
- **Acceptance criterion:** \`true\` exits 0.
`;

cases.push(
  ["real paths without backticks fail rather than yielding an empty boundary",
    () => validateRaw("owns-bare", ownsPlan("src/a.ts, src/b.ts"), true),
    (out) => out.includes("yields no paths")],
  ["backticked paths are unaffected",
    () => validateRaw("owns-ticked", ownsPlan("`src/a.ts`, `src/b.ts`"), true),
    (out) => !out.includes("yields no paths")],
  // A task that legitimately owns nothing must stay legal: T0 and the review
  // waves are read-only by design.
  ["a task that owns nothing on purpose still passes",
    () => validateRaw("owns-none", ownsPlan("none (read-only)"), true),
    (out) => !out.includes("yields no paths")],
);

// --------------------------------------------------------------------------
// THE CONTRACT'S OWN TEMPLATES MUST PARSE. The doc instructed a grammar the
// validator rejected, and nothing tied the two together: `plan-format.md` wrote
// `N/A, <reason>` while the check required a dash, and its wavecheck heading
// template did not register as a gate at all. These read the literal template
// lines out of the contract and run them through the validator, so the two
// cannot drift apart again silently.

cases.push(
  ["the contract's N/A template is accepted by the validator", () => {
    const root = fileURLToPath(new URL("..", import.meta.url));
    const contract = readFileSync(join(root, "skills/planwright/reference/plan-format.md"), "utf8");
    const tpl = contract.match(/`(N\/A, <reason>)`/)?.[1];
    if (!tpl) return "CONTRACT NO LONGER TEMPLATES AN N/A FORM";
    return validateRaw("contract-na", naGatePlan(tpl.replace("<reason>", "no user-facing surface")), true);
  }, (out) => !out.includes("`N/A` with no reason") && !out.includes("CONTRACT NO LONGER")],

  ["the contract's wavecheck heading template is read as a gate", () => {
    const root = fileURLToPath(new URL("..", import.meta.url));
    const contract = readFileSync(join(root, "skills/planwright/reference/plan-format.md"), "utf8");
    const tpl = contract.match(/`(### Wavecheck <phase>\.<wave>, PASS\|BLOCK, <date>)`/)?.[1];
    if (!tpl) return "CONTRACT NO LONGER TEMPLATES A WAVECHECK HEADING";
    const heading = tpl.replace("<phase>.<wave>", "1.0").replace("PASS|BLOCK", "PASS").replace("<date>", "2026-01-01");
    return status("contract-wc", `${head}\n### Wave 1.0 - w\n\n#### T1.0.1 - a\n- **Files owned:** \`a.txt\`\n\n${heading}\n`).out;
  }, (out) => /\|\s*1\.0\s*\|\s*PASS\s*\|/.test(out)],
);

// --------------------------------------------------------------------------
// DECLARED QUALITY REVIEWS. `Wave x.R` has been in the format contract since it
// was written and nothing ever checked it happened -- it was prose the
// orchestrator was trusted to honour, in a repo whose A3 ledger records gates
// being skipped 1 time in 29.

const reviewPlan = (body) => `${head}
### Wave 1.0 - w

#### T1.0.1 - a
- **Files owned:** \`a.txt\`
- **Acceptance criterion:** \`true\` exits 0.

### Wavecheck reports

### Wavecheck 1.0, PASS, 2026-01-01
${body}`;

cases.push(
  ["a declared review with no verdict is reported",
    () => status("rev-missing", reviewPlan("\n### Wave 1.R - Quality review\n")).out,
    (out) => /note: phase 1 declare\(s\)/.test(out) && out.includes("no\nAPPROVED verdict recorded") === false && out.includes("APPROVED verdict recorded")],

  ["a declared review WITH an approved verdict is reported as satisfied",
    () => status("rev-ok", reviewPlan("\n### Wave 1.R - Quality review\n\n## Wave 1.R verdict, APPROVED, 2026-01-02\n")).out,
    (out) => out.includes("all with an APPROVED verdict recorded")],

  // A re-review supersedes the verdict it repeats, exactly like a re-audit.
  ["a REJECTED verdict later approved reads as approved",
    () => status("rev-rerun", reviewPlan("\n### Wave 1.R - Quality review\n\n## Wave 1.R verdict, REJECTED, 2026-01-02\n\n## Wave 1.R verdict, re-review, APPROVED, 2026-01-03\n")).out,
    (out) => out.includes("all with an APPROVED verdict recorded")],

  ["a REJECTED verdict alone is not satisfied",
    () => status("rev-rejected", reviewPlan("\n### Wave 1.R - Quality review\n\n## Wave 1.R verdict, REJECTED, 2026-01-02\n")).out,
    (out) => /note: phase 1 declare\(s\)/.test(out)],

  // The load-bearing constraint: this REPORTS, it does not fail. Failing would
  // retroactively fail plans already closed in this repo -- plan 001 is
  // RECONCILED with both its review verdicts REJECTED.
  // The load-bearing case. `status: DONE` so the ONLY thing left to object to is
  // the missing review -- and it must not object, because failing here would
  // retroactively fail plan 001, which is RECONCILED with both its review
  // verdicts REJECTED.
  ["a missing review does not fail an otherwise closed plan",
    () => status("rev-nofail", reviewPlan("\n### Wave 1.R - Quality review\n").replace("status: EXECUTING", "status: DONE")).out,
    (out) => out.includes("plan-status: PASS") && /note: phase 1 declare\(s\)/.test(out)],

  ["a plan declaring no review says nothing about reviews",
    () => status("rev-none", reviewPlan("")).out,
    (out) => !out.includes("quality review")],
);

// --------------------------------------------------------------------------
// validate-config. The host profile `drydock:init` writes. Without a check it is
// one more document asserting things nobody verified, which is the failure mode
// this repo keeps finding in its own prose.

const GOOD_CFG = [
  "config_version: 1",
  "execution:", "  mode: solo", "  max_concurrent: 1", "  provenance: stated 2026-09-20",
  "gates:", "  test: npm test", "  provenance: discovered package.json",
  "testing:", "  approach: test-with", "  provenance: stated 2026-09-20",
  "vcs:", "  attribution: manifest", "  provenance: discovered git log",
  "gates_human:", "  signer: priya", "  provenance: stated 2026-09-20",
  "paths:", "  drydock_ignored: true", "  provenance: discovered resolve-plans-dir",
  "browser:", "  present: false", "  provenance: stated 2026-09-20",
].join("\n") + "\n";

const cfg = (name, body) => {
  const file = join(DIR, `${name}.yaml`);
  writeFileSync(file, body);
  const r = spawnSync(NODE, [CLI, "validate-config", file], { encoding: "utf8" });
  return `${r.stdout}${r.stderr}`;
};

cases.push(
  ["a complete profile validates", () => cfg("cfg-good", GOOD_CFG),
    (out) => out.includes("validate-config: PASS")],

  // A typo must not fall through to a default. That is how `attribution:
  // manfiest` would have looked armed while behaving as the old mode.
  ["a misspelled execution mode is rejected, not defaulted",
    () => cfg("cfg-mode", GOOD_CFG.replace("mode: solo", "mode: fleeet")),
    (out) => out.includes("execution.mode") && out.includes("unknown")],

  ["a misspelled attribution is rejected",
    () => cfg("cfg-attr", GOOD_CFG.replace("attribution: manifest", "attribution: manfiest")),
    (out) => out.includes("vcs.attribution") && out.includes("unknown")],

  ["testing: none demands a reason on the record",
    () => cfg("cfg-none", GOOD_CFG.replace("approach: test-with", "approach: none")),
    (out) => out.includes("testing.note")],

  ["an unsigned human gate fails",
    () => cfg("cfg-signer", GOOD_CFG.replace("  signer: priya\n", "")),
    (out) => out.includes("gates_human.signer")],

  // A value with no source is an assertion wearing a measurement's clothes.
  ["a section without provenance fails",
    () => cfg("cfg-prov", GOOD_CFG.replace("  provenance: discovered git log\n", "")),
    (out) => out.includes("vcs.provenance")],

  ["a browser target with no URL fails",
    () => cfg("cfg-browser", GOOD_CFG.replace("  present: false", "  present: true")),
    (out) => out.includes("browser.base_url")],

  ["an unsupported config_version is refused",
    () => cfg("cfg-ver", GOOD_CFG.replace("config_version: 1", "config_version: 9")),
    (out) => out.includes("config_version 9 unsupported")],

  // The parser is a documented YAML SUBSET. A file using features it does not
  // support must fail with that message rather than being half-read.
  ["tab indentation fails with a clear message",
    () => cfg("cfg-tab", GOOD_CFG.replace("  mode: solo", "\tmode: solo")),
    (out) => out.includes("tab indentation")],

  ["a missing gates command is a note, not an error",
    () => cfg("cfg-nogates", GOOD_CFG.replace("  test: npm test\n", "")),
    (out) => out.includes("validate-config: PASS") && out.includes("has nothing to run")],
);

// --------------------------------------------------------------------------
// prove-failable. A criterion that already exits 0 before its task has run gates
// nothing: the task could do nothing and still be marked done, and wavecheck's
// check 4 then passes vacuously. Measured in the field -- planwright/SKILL.md
// records three criteria that failed this way, one of them silently.

const pfRepo = (name, body) => {
  const dir = join(DIR, `repo-${name}`);
  mkdirSync(join(dir, "src"), { recursive: true });
  git(dir, ["init", "-q", "-b", "main"]);
  writeFileSync(join(dir, "src", "existing.ts"), "here\n");
  writeFileSync(join(dir, "plan.md"), `${head}\n### Wave 1.0 - w\n\n${body}`);
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "-m", "baseline"]);
  return dir;
};
const pfTask = (id, crit) => `#### ${id} - t\n- **Files owned:** \`src/${id}.ts\`\n- **Acceptance criterion:** ${crit}\n\n`;

cases.push(
  // `node -e` rather than `test -f`: the fixture asserts exit-code
  // classification, and a POSIX-only command asserts the shell instead. That is
  // what broke every Windows runner while every POSIX one stayed green.
  ["a criterion that already passes is reported as inert",
    () => cli(pfRepo("pf-inert", pfTask("T1.0.1", `\`${NODE} -e "process.exit(0)"\``)), ["prove-failable", "plan.md"]),
    (out) => out.includes("INERT") && out.includes("already exits 0") && out.includes("prove-failable: FAIL")],

  ["a criterion that fails at baseline passes the check",
    () => cli(pfRepo("pf-good", pfTask("T1.0.1", `\`${NODE} -e "process.exit(1)"\``)), ["prove-failable", "plan.md"]),
    (out) => out.includes("failable") && out.includes("prove-failable: PASS")],

  // Exiting non-zero because the command does not exist is NOT a healthy gate:
  // it can no more pass after the task than before it.
  ["a criterion whose command does not exist is unrunnable, not failable",
    () => cli(pfRepo("pf-missing", pfTask("T1.0.1", "`drydock-no-such-command-xyz`")), ["prove-failable", "plan.md"]),
    (out) => out.includes("unrunnable") && out.includes("could not be run at all") && out.includes("prove-failable: FAIL")],

  // Prose criteria are real and legitimate; wavecheck verifies them by reading.
  // Counting them as passing OR failing would both be lies.
  ["a prose criterion is reported as unrunnable, not as passing",
    () => cli(pfRepo("pf-prose", pfTask("T1.0.1", "the helper is exported from the barrel")), ["prove-failable", "plan.md"]),
    (out) => out.includes("prose") && out.includes("cannot be run here") && out.includes("prove-failable: PASS")],

  // The opt-out must be written in the plan, where a reader sees it.
  ["a criterion declaring itself side-effecting is skipped with its reason",
    () => cli(pfRepo("pf-optout", pfTask("T1.0.1", "`npm run build` - side-effecting, cannot be proven at baseline")), ["prove-failable", "plan.md"]),
    (out) => out.includes("opt-out") && out.includes("on the record") && out.includes("prove-failable: PASS")],

  ["a task with no criterion at all fails",
    () => cli(pfRepo("pf-none", "#### T1.0.1 - t\n- **Files owned:** `src/a.ts`\n\n"), ["prove-failable", "plan.md"]),
    (out) => out.includes("nothing to prove failable") && out.includes("prove-failable: FAIL")],
);

// --------------------------------------------------------------------------
// task-close --undo. `task-close` appends, so amending a commit and re-running
// it leaves two entries claiming one task, which BLOCKs the wave on ambiguous
// attribution. Recovery used to mean hand-editing the manifest.

cases.push(
  ["--undo clears a double task-close so the wave passes again", () => {
    const dir = mkrepo("undo");
    commitAs(dir, ["a.txt"], "feat: a");
    cli(dir, ["task-close", "plan.md", "T1.0.1"]);
    commitAs(dir, ["b.txt"], "feat: b");
    cli(dir, ["task-close", "plan.md", "T1.0.2"]);
    // The mistake: amend, then close the same task again.
    writeFileSync(join(dir, "b.txt"), "b2\n");
    git(dir, ["add", "b.txt"]);
    git(dir, ["commit", "-q", "--amend", "--no-edit"]);
    cli(dir, ["task-close", "plan.md", "T1.0.2"]);
    const before = cli(dir, ["audit-wave", "plan.md", "1.0"]);
    cli(dir, ["task-close", "--undo", "plan.md", "T1.0.2"]);
    cli(dir, ["task-close", "plan.md", "T1.0.2"]);
    const after = cli(dir, ["audit-wave", "plan.md", "1.0"]);
    return `BEFORE:${before}\nAFTER:${after}`;
  }, (out) => /BEFORE:[\s\S]*ambiguous attribution/.test(out) && /AFTER:[\s\S]*audit-wave 1\.0: PASS/.test(out)],

  // Only the named task, and only this plan's entries: the manifest is shared by
  // every plan in the repo and a task id is unique only within a plan.
  ["--undo leaves the other task's entry alone", () => {
    const dir = closedWave("undo-scope");
    cli(dir, ["task-close", "--undo", "plan.md", "T1.0.2"]);
    return readFileSync(join(dir, ".drydock", "attribution.jsonl"), "utf8");
  }, (out) => out.includes('"task":"T1.0.1"') && !out.includes('"task":"T1.0.2"')],

  ["--undo on a task with no entry says so and fails", () => {
    const dir = closedWave("undo-missing");
    return cli(dir, ["task-close", "--undo", "plan.md", "T1.0.9"]);
  }, (out) => out.includes("nothing to undo")],
);

// --------------------------------------------------------------------------
// WAVE-START PREFLIGHT. It armed from any file at all, including a plan the
// validator rejects, and a first `audit-wave` in a fresh repo then failed on the
// tool's own `.drydock/` and the uncommitted plan — a wave that had done nothing
// wrong. The docs' claim that `.drydock/` is gitignored was true of this repo only.

const bareRepo = (name, fv = 3) => {
  const dir = join(DIR, `repo-${name}`);
  mkdirSync(dir, { recursive: true });
  git(dir, ["init", "-q", "-b", "main"]);
  writeFileSync(join(dir, "plan.md"), planText(fv, "manifest"));
  return dir;
};

cases.push(
  ["wave-start refuses a plan the validator rejects", () => {
    const dir = bareRepo("ws-invalid", 9);
    git(dir, ["add", "-A"]); git(dir, ["commit", "-q", "-m", "plan"]);
    return cli(dir, ["wave-start", "plan.md", "1.0"]);
  }, (out) => out.includes("does not pass validate-plan") && !out.includes("armed")],

  ["wave-start refuses an uncommitted plan", () => {
    const dir = bareRepo("ws-dirty");
    return cli(dir, ["wave-start", "plan.md", "1.0"]);
  }, (out) => out.includes("uncommitted changes") && !out.includes("armed")],

  ["wave-start gitignores .drydock/ so the first audit is not dirty", () => {
    const dir = bareRepo("ws-ignore");
    git(dir, ["add", "-A"]); git(dir, ["commit", "-q", "-m", "plan"]);
    const out = cli(dir, ["wave-start", "plan.md", "1.0"]);
    return `${out}\nGITIGNORE:${readFileSync(join(dir, ".gitignore"), "utf8")}\nSTATUS:${git(dir, ["status", "--porcelain"])}`;
  }, (out) => out.includes("armed") && /GITIGNORE:[\s\S]*\.drydock\//.test(out) && !out.includes("?? .drydock")],

  // Same path-form hazard as the audit case: wave-start compares the plan against
  // `git status --porcelain -- <planRel>`, and a planRel computed by subtracting
  // the root's length matched nothing on Windows CI, so the refusal never fired
  // and an uncommitted plan armed the wave anyway.
  ["wave-start sees an uncommitted plan through an unresolved absolute path", () => {
    const dir = bareRepo("ws-dirty-abs");
    return cli(dir, ["wave-start", join(dir, "plan.md"), "1.0"]);
  }, (out) => out.includes("uncommitted changes") && !out.includes("armed")],

  ["wave-start prints a path that actually runs", () => {
    const dir = bareRepo("ws-path");
    git(dir, ["add", "-A"]); git(dir, ["commit", "-q", "-m", "plan"]);
    return cli(dir, ["wave-start", "plan.md", "1.0"]);
  }, (out) => out.includes("audit it with:") && out.includes(CLI)],
);

// --------------------------------------------------------------------------
// EXIT CODES. A missing file printed an eleven-line `node:fs` stack trace and
// exited 1 — the same code as a legitimate FAIL — so nothing could tell "this
// plan is bad" from "this tool is broken".

cases.push(
  ["a missing plan is a clean error, not a stack trace", () => {
    const r = spawnSync(NODE, [CLI, "validate-plan", join(DIR, "nope-does-not-exist.md")], { encoding: "utf8" });
    return `EXIT:${r.status}\n${r.stdout}${r.stderr}`;
  }, (out) => out.includes("EXIT:3") && out.includes("no such file") && !out.includes("at ModuleJob")],
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
