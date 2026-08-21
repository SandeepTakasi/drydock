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

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
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

rmSync(CONFIG_DIR, { recursive: true, force: true });

console.log(failed === 0 ? "\nenforce-owns: PASS — 10 cases" : `\nenforce-owns: FAIL — ${failed} case(s)`);
process.exit(failed ? 1 : 0);
