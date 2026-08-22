/**
 * Self-check for the ownership hook. No framework, no fixtures directory.
 *
 *   node drydock/hooks/enforce-owns.test.mjs
 *
 * Exits 0 when every case behaves, 1 naming the ones that did not.
 *
 * Inputs are built with JSON.stringify rather than written as shell heredocs:
 * a heredoc silently ate the backslash escapes while this hook was being
 * developed, producing invalid JSON, which the hook's parse-error path treats
 * as allow — so three cases looked like they passed enforcement when nothing
 * had been enforced at all. A test whose fixture cannot fail is worse than no
 * test, and generating the JSON is the fix.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HOOK = fileURLToPath(new URL("./enforce-owns.mjs", import.meta.url));
const ROOT = dirname(dirname(dirname(HOOK))); // hooks/ -> drydock/ -> repo root
const CONFIG_DIR = join(ROOT, ".drydock");
const CONFIG = join(CONFIG_DIR, "wave-owns.json");

if (existsSync(CONFIG)) {
  console.error(`refusing to run: ${CONFIG} exists — a wave may be live. Not clobbering it.`);
  process.exit(1);
}

const ALLOW = 0;
const DENY = 2;

const run = (toolInput, { config = '{"plan":"005-x","wave":"2.1","owns":["docs/**","e2e/**"]}' } = {}) => {
  mkdirSync(CONFIG_DIR, { recursive: true });
  if (config !== null) writeFileSync(CONFIG, config);
  else rmSync(CONFIG, { force: true });
  try {
    execFileSync("node", [HOOK], {
      input: JSON.stringify({ tool_name: "Write", cwd: ROOT, tool_input: toolInput }),
      env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT },
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { code: 0, message: "" };
  } catch (e) {
    return { code: e.status, message: JSON.parse(String(e.stderr)).systemMessage };
  }
};

const abs = (...parts) => join(ROOT, ...parts);

const cases = [
  ["relative owned", { file_path: "docs/compatibility.md" }, ALLOW],
  ["relative unowned", { file_path: "site/content/copy.ts" }, DENY],
  // Both separator styles: the tool hands back native paths on Windows while
  // plan `owns` globs are always written with forward slashes.
  ["absolute native unowned", { file_path: abs("site", "x.ts") }, DENY],
  ["absolute posix unowned", { file_path: abs("site", "y.ts").split(sep).join("/") }, DENY],
  ["absolute native owned", { file_path: abs("docs", "architecture.md") }, ALLOW],
  ["glob subtree owned", { file_path: "e2e/tg1-h1-pass-and-evidence.spec.ts" }, ALLOW],
  ["outside the repo", { file_path: join(ROOT, "..", "elsewhere.txt") }, ALLOW],
  ["notebook_path honoured", { notebook_path: "site/nb.ipynb" }, DENY],
];

let failed = 0;

for (const [name, toolInput, want] of cases) {
  const { code, message } = run(toolInput);
  const ok = code === want;
  if (!ok) failed++;
  console.log(
    `${ok ? "ok  " : "FAIL"} ${name.padEnd(24)} exit=${code} want=${want}` +
      (message ? ` :: ${message.split("\n")[0]}` : "")
  );
}

// No config at all: the normal state of a repo not mid-wave. Must be inert, or
// the plugin breaks every unrelated edit in every repo that installs it.
{
  const { code } = run({ file_path: "site/content/copy.ts" }, { config: null });
  const ok = code === ALLOW;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${"absent config is inert".padEnd(24)} exit=${code} want=${ALLOW}`);
}

// Present but unparseable: fails CLOSED. A broken enforcement control must not
// quietly degrade into no enforcement.
{
  const { code, message } = run({ file_path: "docs/compatibility.md" }, { config: "{ broken" });
  const ok = code === DENY;
  if (!ok) failed++;
  console.log(
    `${ok ? "ok  " : "FAIL"} ${"malformed fails closed".padEnd(24)} exit=${code} want=${DENY}` +
      (message ? ` :: ${message.split("\n")[0].slice(0, 60)}` : "")
  );
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
  const ok = decisions === "allow,deny" && entries.every((e) => e.wave === "2.1");
  if (!ok) failed++;
  console.log(
    `${ok ? "ok  " : "FAIL"} ${"receipt on both paths".padEnd(24)} entries=[${decisions}] want=[allow,deny]`
  );
}

// A Node without `path.matchesGlob` must fail OPEN, loudly, once. Wedging every
// edit in someone's repo over a runtime version is worse than not enforcing —
// and the missing receipt is what keeps that non-enforcement visible to the
// audit. Exercised by blanking the export through a CJS preload, since the Node
// running this test has it.
{
  const SHIM = join(ROOT, "_enforce-owns-shim.cjs");
  writeFileSync(SHIM, 'require("node:path").matchesGlob = undefined;\n');
  writeFileSync(CONFIG, '{"plan":"005-x","wave":"2.1","owns":["docs/**"]}');
  // spawnSync, not execFileSync: this case is expected to SUCCEED (fail open),
  // and execFileSync only hands back stderr when the process fails — so the
  // message being asserted would be invisible exactly when the behaviour is
  // correct. The assertion would then fail on a working hook.
  const proc = spawnSync("node", ["--require", SHIM, HOOK], {
    input: JSON.stringify({ tool_name: "Write", cwd: ROOT, tool_input: { file_path: "site/x.ts" } }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT },
    encoding: "utf8",
  });
  const code = proc.status;
  const stderr = proc.stderr ?? "";
  rmSync(SHIM, { force: true });
  const ok = code === ALLOW && /enforcement is INACTIVE/.test(stderr);
  if (!ok) failed++;
  console.log(
    `${ok ? "ok  " : "FAIL"} ${"old Node fails open".padEnd(24)} exit=${code} want=${ALLOW}` +
      (stderr ? ` :: ${stderr.split("\n")[0].slice(0, 58)}` : " :: (no message)")
  );
}

rmSync(CONFIG_DIR, { recursive: true, force: true });

console.log(failed === 0 ? "\nenforce-owns: PASS — 12 cases" : `\nenforce-owns: FAIL — ${failed} case(s)`);
process.exit(failed ? 1 : 0);
