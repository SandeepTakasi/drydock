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
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
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
// Manifest attribution (issue #2). These need a real repository: the whole
// point is that a commit whose SUBJECT carries no task id is still attributable,
// so there has to be a commit to attribute. Each case gets a throwaway repo —
// `git init` is cheaper than reasoning about shared state between cases.

const GIT = ["-c", "user.email=t@t", "-c", "user.name=t", "-c", "commit.gpgsign=false"];
const git = (cwd, args) =>
  execFileSync("git", [...GIT, ...args], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

const cli = (cwd, args) => {
  const r = spawnSync("node", [CLI, ...args], { cwd, encoding: "utf8" });
  return `${r.stdout}${r.stderr}`;
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
