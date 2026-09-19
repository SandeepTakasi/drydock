/**
 * Self-check for the ownership hook. No framework, no fixtures directory.
 *
 *   node drydock/hooks/enforce-owns.test.mjs
 *
 * Exits 0 when every case behaves, 1 naming the ones that did not.
 *
 * Runs against a THROWAWAY repo under the OS temp directory. It used to build
 * its fixture in the real repo root and finish with
 * `rmSync(join(ROOT, ".drydock"), { recursive: true })`, so running the plugin's
 * own confidence check inside a host repo deleted that repo's `.drydock/`:
 * attribution records, the enforcement log, Testing Gate evidence, and, where
 * `plans_dir` falls back, the plans themselves. The QUICKSTART tells a new user
 * to run this file.
 *
 * Inputs are built with JSON.stringify rather than written as shell heredocs:
 * a heredoc silently ate the backslash escapes while this hook was being
 * developed, producing invalid JSON, which the hook's parse-error path treats
 * as allow — so three cases looked like they passed enforcement when nothing
 * had been enforced at all. A test whose fixture cannot fail is worse than no
 * test, and generating the JSON is the fix.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync, existsSync, readFileSync, symlinkSync, realpathSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

// THE RUNTIME RUNNING THIS FILE, never the string "node". A bare "node" is a
// PATH lookup, and PATH can resolve to a different binary than the one running
// the suite -- measured 2026-09-19, where the first node on PATH was an x86_64
// build that stopped executing after a macOS major upgrade, so every case failed
// with `spawnSync node Unknown system error -86` (EBADARCH) while the suite's
// own runtime was fine. `process.execPath` also guarantees the hook is exercised
// on the same Node version as the assertions about it.
const NODE = process.execPath;

const HOOK = fileURLToPath(new URL("./enforce-owns.mjs", import.meta.url));

// realpathSync because macOS hands back /var/... for a /private/var/... temp dir,
// and the hook resolves symlinks now: an unresolved root would make every
// repo-relative path compute as "../..." and read as outside the repo.
const ROOT = realpathSync(mkdtempSync(join(tmpdir(), "drydock-hook-")));
for (const d of ["docs", "e2e", "site", "src"]) mkdirSync(join(ROOT, d), { recursive: true });
// An owned directory containing a symlink that escapes the owned subtree.
symlinkSync(join(ROOT, "site"), join(ROOT, "docs", "link"), "dir");

const CONFIG_DIR = join(ROOT, ".drydock");
const CONFIG = join(CONFIG_DIR, "wave-owns.json");
const DEFAULT_CONFIG = '{"plan":"005-x","wave":"2.1","owns":["docs/**","e2e/**"]}';

const ALLOW = 0;
const DENY = 2;

const run = (toolInput, { config = DEFAULT_CONFIG, tool = "Write" } = {}) => {
  mkdirSync(CONFIG_DIR, { recursive: true });
  if (config !== null) writeFileSync(CONFIG, config);
  else rmSync(CONFIG, { force: true });
  try {
    execFileSync(NODE, [HOOK], {
      input: JSON.stringify({ tool_name: tool, cwd: ROOT, tool_input: toolInput }),
      env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT },
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { code: 0, message: "" };
  } catch (e) {
    let message = "";
    try { message = JSON.parse(String(e.stderr)).systemMessage; } catch { message = String(e.stderr).trim(); }
    return { code: e.status, message };
  }
};

const abs = (...parts) => join(ROOT, ...parts);

// The last receipt line, parsed. Attribution is recorded, not returned, so the
// only way to assert it is to read the log the hook just appended to.
const lastReceipt = () => {
  const LOG = join(CONFIG_DIR, "enforcement.log");
  if (!existsSync(LOG)) return null;
  const lines = readFileSync(LOG, "utf8").split(/\r?\n/).filter(Boolean);
  try { return JSON.parse(lines[lines.length - 1]); } catch { return null; }
};
const TASKS_CONFIG = JSON.stringify({
  plan: "005-x", wave: "2.1",
  owns: ["docs/**", "e2e/**"],
  tasks: { "T2.1.1": ["docs/**"], "T2.1.2": ["e2e/**"] },
});

let total = 0;
let failed = 0;
const report = (name, ok, detail) => {
  total++;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name.padEnd(26)} ${detail}`);
};
const expectExit = (name, toolInput, want, opts) => {
  const { code, message } = run(toolInput, opts);
  report(name, code === want, `exit=${code} want=${want}` + (message ? ` :: ${message.split("\n")[0].slice(0, 60)}` : ""));
};

const cases = [
  ["relative owned", { file_path: "docs/compatibility.md" }, ALLOW],
  ["relative unowned", { file_path: "site/content/copy.ts" }, DENY],
  // Both separator styles: the tool hands back native paths on Windows while
  // plan `owns` globs are always written with forward slashes.
  ["absolute native unowned", { file_path: abs("site", "x.ts") }, DENY],
  ["absolute posix unowned", { file_path: abs("site", "y.ts").split(sep).join("/") }, DENY],
  ["absolute native owned", { file_path: abs("docs", "architecture.md") }, ALLOW],
  ["glob subtree owned", { file_path: "e2e/tg1.spec.ts" }, ALLOW],
  ["outside the repo", { file_path: join(ROOT, "..", "elsewhere.txt") }, ALLOW],
  ["notebook_path honoured", { notebook_path: "site/nb.ipynb" }, DENY],
  // `path.matchesGlob("docs/.env", "docs/**")` is false, so before the local
  // matcher a task could not write the dotfiles inside a directory it owned.
  ["owned dotfile", { file_path: "docs/.env" }, ALLOW],
  ["owned nested dotdir", { file_path: "docs/.cache/x.json" }, ALLOW],
  ["unowned dotfile", { file_path: "site/.env" }, DENY],
  // Lexical normalisation kept this inside `docs/`; it lands in `site/`.
  ["symlink escape denied", { file_path: "docs/link/x.ts" }, DENY],
  // A file_path of the wrong type threw a TypeError and exited 1, which the
  // host reads as a hook error, not a denial: the write went through.
  ["malformed file_path number", { file_path: 123 }, DENY],
  ["malformed file_path array", { file_path: ["site/a.ts"] }, DENY],
];

for (const [name, toolInput, want] of cases) expectExit(name, toolInput, want);

// MultiEdit was missing from the hooks.json matcher, so the hook was never
// invoked for it even though it handles the payload correctly.
expectExit("MultiEdit unowned", { file_path: "site/x.ts" }, DENY, { tool: "MultiEdit" });
expectExit("Edit owned", { file_path: "docs/x.md" }, ALLOW, { tool: "Edit" });

// No config at all: the normal state of a repo not mid-wave. Must be inert, or
// the plugin breaks every unrelated edit in every repo that installs it.
expectExit("absent config is inert", { file_path: "site/content/copy.ts" }, ALLOW, { config: null });

// Present but unparseable: fails CLOSED. A broken enforcement control must not
// quietly degrade into no enforcement.
expectExit("malformed fails closed", { file_path: "docs/compatibility.md" }, DENY, { config: "{ broken" });

// Parses, but unusable. This threw inside the matcher and exited 1.
expectExit("non-string owns entry", { file_path: "docs/x.md" }, DENY, {
  config: '{"plan":"p","wave":"1.0","owns":[null,5]}',
});
expectExit("owns not an array", { file_path: "docs/x.md" }, DENY, {
  config: '{"plan":"p","wave":"1.0","owns":"docs/**"}',
});

// --------------------------------------------------------------------------
// PER-TASK ATTRIBUTION. `validate-plan` rejects a plan whose same-wave tasks own
// overlapping paths, so inside an armed wave a path has at most ONE owner. That
// makes attribution a lookup -- no subagent identity, no protocol, no race.
// It records which task's FILES a write landed in, never who did the writing.

{
  const cases = [
    ["attributes a write to the owning task", "docs/x.md", ALLOW, "T2.1.1"],
    ["attributes the sibling task's path", "e2e/x.spec.ts", ALLOW, "T2.1.2"],
    ["a denied path is owned by nobody", "site/x.ts", DENY, null],
  ];
  for (const [name, file, want, task] of cases) {
    const { code } = run({ file_path: file }, { config: TASKS_CONFIG });
    const got = lastReceipt();
    report(name, code === want && got?.task === task, `exit=${code} want=${want} task=${JSON.stringify(got?.task)} want=${JSON.stringify(task)}`);
  }
}

// The `owns` field in the receipt must stay the WAVE union. `audit-wave` unions
// it across entries and compares against the plan's wave union, so narrowing it
// to the owning task's globs would fail every clean wave.
{
  run({ file_path: "docs/x.md" }, { config: TASKS_CONFIG });
  const got = lastReceipt();
  report(
    "receipt owns stays the wave union",
    JSON.stringify(got?.owns) === JSON.stringify(["docs/**", "e2e/**"]),
    `owns=${JSON.stringify(got?.owns)}`
  );
}

// BACKWARD COMPATIBILITY, both directions. A config without `tasks` is what an
// older wave-start wrote; the hook must behave exactly as before and record
// task: null rather than failing.
{
  const { code } = run({ file_path: "docs/x.md" });
  const got = lastReceipt();
  report("config without tasks still allows, task null", code === ALLOW && got?.task === null, `exit=${code} task=${JSON.stringify(got?.task)}`);
}

// A malformed `tasks` map is OUR control being unusable, so it denies -- the
// same posture as a malformed `owns`, not a silent downgrade to wave-level.
for (const [name, tasks] of [
  ["tasks not an object", '"docs/**"'],
  ["tasks value not an array", '{"T1":"docs/**"}'],
  ["tasks value holds a non-string", '{"T1":["docs/**",5]}'],
]) {
  const { code } = run({ file_path: "docs/x.md" }, {
    config: `{"plan":"p","wave":"1.0","owns":["docs/**"],"tasks":${tasks}}`,
  });
  report(`malformed ${name} fails closed`, code === DENY, `exit=${code} want=${DENY}`);
}

// Per-task attribution must never widen the boundary: a path in `tasks` but not
// in `owns` is still denied, because the wave check runs first.
{
  const { code } = run({ file_path: "src/x.ts" }, {
    config: '{"plan":"p","wave":"1.0","owns":["docs/**"],"tasks":{"T1":["docs/**"],"T2":["src/**"]}}',
  });
  report("tasks cannot widen past the wave union", code === DENY, `exit=${code} want=${DENY}`);
}

// The receipt is what `audit-wave` reads to answer "did enforcement actually run
// for this wave?", so it has to be written on ALLOW as well as DENY — an allow is
// the evidence the hook was alive for that write. Without this the audit could
// only prove a config file existed, which a hook that never ran also satisfies.
{
  const LOG = join(CONFIG_DIR, "enforcement.log");
  rmSync(LOG, { force: true });
  run({ file_path: "docs/allowed.md" });
  run({ file_path: "site/denied.ts" });

  const entries = existsSync(LOG)
    ? readFileSync(LOG, "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l))
    : [];
  const decisions = entries.map((e) => e.decision).join(",");
  report(
    "receipt on both paths",
    decisions === "allow,deny" && entries.every((e) => e.wave === "2.1"),
    `entries=[${decisions}] want=[allow,deny]`
  );
}

rmSync(ROOT, { recursive: true, force: true });

// Derived, never a literal. This line read `"PASS, 12 cases"` with the 12 typed
// in, so any acceptance criterion greping the count was satisfied by editing
// this string rather than by adding a case.
console.log(failed === 0 ? `\nenforce-owns: PASS, ${total} cases` : `\nenforce-owns: FAIL, ${failed} of ${total} case(s)`);
process.exit(failed ? 1 : 0);
