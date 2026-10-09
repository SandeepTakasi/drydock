/**
 * Self-check for scope-gate/gate.mjs. No framework: pure functions are called
 * directly, and the end-to-end cases run the real gate against a local
 * node:http server (GITHUB_API_URL) and a throwaway git repo (GITHUB_WORKSPACE).
 *
 *   node scope-gate/gate.test.mjs
 *
 * Last line is `PASS, <n> cases` (exit 0) or `FAIL, <k> of <n> cases` (exit 1).
 */

import { spawn, execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const NODE = process.execPath;
const GATE = fileURLToPath(new URL("./gate.mjs", import.meta.url));
const TOKEN = "tok-secret-9f3a";
const DIR = mkdtempSync(join(tmpdir(), "scope-gate-"));

const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : detail ? `\n       ${detail}` : ""}`);
};

let mod;
try { mod = await import("./gate.mjs"); } catch (e) { mod = {}; console.log(`import failed: ${e.message}`); }
const { linkedIssue, trusted } = mod;

// --- pure ---------------------------------------------------------------
const li = (body) => { try { return linkedIssue(body); } catch (e) { return e.message; } };
check("linkedIssue: Closes #12", li("Closes #12") === 12, String(li("Closes #12")));
check("linkedIssue: fixes #3", li("x\nfixes #3") === 3);
check("linkedIssue: RESOLVED #4", li("RESOLVED #4") === 4);
check("linkedIssue: same number twice", li("Closes #5 and fixes #5") === 5);
check("linkedIssue: none throws", /no linked issue/.test(li("see #5")), li("see #5"));
check("linkedIssue: two numbers throws", /links 2 issues/.test(li("Closes #1, fixes #2")), li("Closes #1, fixes #2"));

for (const r of ["OWNER", "MEMBER", "COLLABORATOR"]) check(`trusted: ${r}`, trusted?.(r) === true);
for (const r of ["CONTRIBUTOR", "NONE"]) check(`trusted: ${r} is false`, trusted?.(r) === false);

// --- end to end ---------------------------------------------------------
const git = (cwd, ...a) => execFileSync("git", a, { cwd, encoding: "utf8" }).trim();

const T0 = "2026-01-01T00:00:00Z", T1 = "2026-01-02T00:00:00Z";
const intent = (crit) =>
  "Scope.\n\n- **Files owned:** `src/**`\n- **Acceptance criterion:** `" + crit + "`\n";

const server = createServer((req, res) => {
  const m = /^\/repos\/o\/r\/issues\/(\d+)$/.exec(req.url);
  const issue = m && server.issues[m[1]];
  if (!issue || req.headers.authorization !== `Bearer ${TOKEN}`) { res.statusCode = 404; return res.end("{}"); }
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(issue));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const API = `http://127.0.0.1:${server.address().port}`;

let n = 0;
async function run({ name, prBody = "Closes #7", issue = {}, prCreated = T1, touch = ["src/a.txt"], crit = 'node -e "process.exit(0)"', expect, match }) {
  const root = join(DIR, `c${n++}`);
  const ws = join(root, "ws"), tmp = join(root, "tmp");
  mkdirSync(join(ws, "src"), { recursive: true });
  mkdirSync(tmp);
  git(ws, "init", "-q");
  git(ws, "config", "user.email", "t@t");
  git(ws, "config", "user.name", "t");
  git(ws, "config", "commit.gpgsign", "false");
  writeFileSync(join(ws, "src", "a.txt"), "a\n");
  git(ws, "add", "-A");
  git(ws, "commit", "-qm", "base");
  const sha = git(ws, "rev-parse", "HEAD");
  for (const f of touch) writeFileSync(join(ws, f), "changed\n");

  server.issues = {
    7: { number: 7, body: intent(crit), created_at: T0, author_association: "OWNER", ...issue },
  };
  const event = join(root, "event.json");
  writeFileSync(event, JSON.stringify({ pull_request: { body: prBody, created_at: prCreated, base: { sha } } }));

  const env = {
    ...process.env,
    GITHUB_EVENT_PATH: event, GITHUB_API_URL: API, GITHUB_REPOSITORY: "o/r",
    GITHUB_TOKEN: TOKEN, RUNNER_TEMP: tmp, GITHUB_WORKSPACE: ws,
  };
  const p = spawn(NODE, [GATE], { cwd: ws, env, stdio: ["ignore", "pipe", "pipe"] });
  let out = "";
  p.stdout.on("data", (d) => (out += d));
  p.stderr.on("data", (d) => (out += d));
  const code = await new Promise((r) => p.on("close", r));
  const ok = code === expect && (!match || match.test(out)) && !out.includes(TOKEN);
  check(`e2e: ${name}`, ok, `exit ${code} (want ${expect}); output:\n${out}`);
}

await run({ name: "in-scope change passes", expect: 0 });
await run({ name: "unowned file is annotated", touch: ["src/a.txt", "other.txt"], expect: 1, match: /::error file=other\.txt::outside the scope declared in #7/ });
await run({ name: "failing criterion fails", crit: 'node -e "process.exit(1)"', expect: 1, match: /FLAG criterion exited 1/ });
await run({ name: "untrusted author refused", issue: { author_association: "NONE" }, expect: 1, match: /::error::scope-gate: .*NONE/ });
await run({ name: "issue newer than the PR refused", issue: { created_at: T1 }, prCreated: T0, expect: 1, match: /::error::scope-gate: .*after/ });
await run({ name: "linked number is a PR refused", issue: { pull_request: {} }, expect: 1, match: /::error::scope-gate: .*pull request/ });
await run({ name: "no linked issue refused", prBody: "no keyword here #7", expect: 1, match: /::error::scope-gate: .*no linked issue/ });

server.close();
rmSync(DIR, { recursive: true, force: true });

const bad = results.filter((r) => !r).length;
console.log(bad ? `FAIL, ${bad} of ${results.length} cases` : `PASS, ${results.length} cases`);
process.exit(bad ? 1 : 0);
