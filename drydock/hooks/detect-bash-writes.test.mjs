/**
 * Self-check for the Bash write detector.
 *
 *   node drydock/hooks/detect-bash-writes.test.mjs
 *
 * Runs against a THROWAWAY git repo under the OS temp directory. Never touches
 * the repo it ships in.
 *
 * The cases that matter most are the ones a command-string parser would have
 * missed: `cd` plus a relative redirect, and a write performed from inside
 * another language. They are why this layer diffs the working tree instead of
 * reading `tool_input.command`.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

// The runtime running this file, never the string "node" -- see the note in
// enforce-owns.test.mjs for the measured failure that motivates this.
const NODE = process.execPath;
const HOOK = fileURLToPath(new URL("./detect-bash-writes.mjs", import.meta.url));
const GIT = ["-c", "user.email=t@t", "-c", "user.name=t", "-c", "commit.gpgsign=false"];

let total = 0;
let failed = 0;
const report = (name, ok, detail) => {
  total++;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name.padEnd(42)} ${detail}`);
};

const mkrepo = (name, { armed = true, owns = ["docs/**"] } = {}) => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), `drydock-bash-${name}-`)));
  execFileSync("git", [...GIT, "init", "-q", "-b", "main"], { cwd: dir });
  mkdirSync(join(dir, "docs"), { recursive: true });
  mkdirSync(join(dir, "site"), { recursive: true });
  writeFileSync(join(dir, ".gitignore"), ".drydock/\nbuild/\n");
  writeFileSync(join(dir, "docs", "kept.md"), "x\n");
  execFileSync("git", [...GIT, "add", "-A"], { cwd: dir });
  execFileSync("git", [...GIT, "commit", "-q", "-m", "baseline"], { cwd: dir });
  if (armed) {
    mkdirSync(join(dir, ".drydock"), { recursive: true });
    writeFileSync(join(dir, ".drydock", "wave-owns.json"), JSON.stringify({ plan: "p", wave: "1.0", owns }));
  }
  return dir;
};

// Fire the hook as the host would, after a command has already run.
const fire = (dir, command) => {
  const r = execFileSync(NODE, [HOOK], {
    input: JSON.stringify({ hook_event_name: "PostToolUse", tool_name: "Bash", cwd: dir, tool_input: { command } }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  return r;
};

const receipts = (dir) => {
  const LOG = join(dir, ".drydock", "enforcement.log");
  if (!existsSync(LOG)) return [];
  return readFileSync(LOG, "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
};

// Every case seeds the snapshot first, because the first Bash command of a wave
// has nothing to diff against and says so.
const seed = (dir) => fire(dir, "true");

// THE FIXTURE DOES NOT SHELL OUT, and that is not a compromise. This file first
// used `/bin/sh -c`, which does not exist on Windows, so every case died with
// `spawnSync /bin/sh ENOENT` on three runners -- the same POSIX assumption this
// release fixed in the other two suites, made again here.
//
// What the detector actually asserts is that the working tree changed by some
// means a file-tool hook never saw. It does not read the command, so ANY
// non-file-tool mutation exercises it identically, and Node is the one runtime
// guaranteed present wherever these tests run. `cwd` varies where a case is
// about a path resolved relative to somewhere other than the repo root.
const mutate = (dir, script, sub) =>
  execFileSync(NODE, ["-e", script], { cwd: sub ? join(dir, sub) : dir, encoding: "utf8" });

// --- the motivating cases -------------------------------------------------
{
  const dir = mkrepo("redirect");
  seed(dir);
  mutate(dir, "require('fs').writeFileSync('site/probe.txt','x')");
  fire(dir, "printf x > site/probe.txt");
  const det = receipts(dir).filter((e) => e.decision === "detected");
  report("a > redirect outside owns is detected", det.length === 1 && det[0].path === "site/probe.txt",
    `paths=${JSON.stringify(det.map((e) => e.path))}`);
  report("the receipt names the command", det[0]?.command?.includes("printf"), `command=${JSON.stringify(det[0]?.command)}`);
  report("the receipt is tagged bash-tree", det[0]?.mechanism === "bash-tree", `mechanism=${det[0]?.mechanism}`);
  rmSync(dir, { recursive: true, force: true });
}

// `cd` plus a relative path is the single token that defeats any command-string
// parser. Diffing the tree does not care.
{
  const dir = mkrepo("cd-relative");
  seed(dir);
  // Written from INSIDE site/, by a relative name. A command-string parser
  // would have to model the shell's cwd to see this; git status is repo-rooted
  // and does not care.
  mutate(dir, "require('fs').writeFileSync('nested.txt','x')", "site");
  fire(dir, "cd site && printf x > nested.txt");
  const det = receipts(dir).filter((e) => e.decision === "detected");
  report("cd then a relative redirect is detected", det.some((e) => e.path === "site/nested.txt"),
    `paths=${JSON.stringify(det.map((e) => e.path))}`);
  rmSync(dir, { recursive: true, force: true });
}

// Plan 005 deviation 1, verbatim in shape: a write performed inside another
// language, which no shell parser can see.
{
  const dir = mkrepo("heredoc");
  seed(dir);
  mutate(dir, "require('fs').writeFileSync('site/from-node.txt','x')");
  fire(dir, `${NODE} -e "require('fs').writeFileSync('site/from-node.txt','x')"`);
  const det = receipts(dir).filter((e) => e.decision === "detected");
  report("a write from inside another language is detected", det.some((e) => e.path === "site/from-node.txt"),
    `paths=${JSON.stringify(det.map((e) => e.path))}`);
  rmSync(dir, { recursive: true, force: true });
}

// --- the quiet paths ------------------------------------------------------
{
  const dir = mkrepo("owned");
  seed(dir);
  mutate(dir, "require('fs').writeFileSync('docs/new.md','y')");
  fire(dir, "printf y > docs/new.md");
  const r = receipts(dir);
  report("a write inside owns yields observed, not detected",
    r.filter((e) => e.decision === "detected").length === 0 && r.some((e) => e.decision === "observed"),
    `decisions=${JSON.stringify(r.map((e) => e.decision))}`);
  rmSync(dir, { recursive: true, force: true });
}

{
  const dir = mkrepo("readonly");
  seed(dir);
  fire(dir, "ls -la");
  const r = receipts(dir);
  report("a read-only command yields observed only",
    r.filter((e) => e.decision === "detected").length === 0 && r.filter((e) => e.decision === "observed").length === 2,
    `decisions=${JSON.stringify(r.map((e) => e.decision))}`);
  rmSync(dir, { recursive: true, force: true });
}

// Deleting a tracked file is a write.
{
  const dir = mkrepo("delete", { owns: ["site/**"] });
  seed(dir);
  mutate(dir, "require('fs').unlinkSync('docs/kept.md')");
  fire(dir, "rm docs/kept.md");
  const det = receipts(dir).filter((e) => e.decision === "detected");
  report("deleting an unowned tracked file is detected", det.some((e) => e.path === "docs/kept.md"),
    `paths=${JSON.stringify(det.map((e) => e.path))}`);
  rmSync(dir, { recursive: true, force: true });
}

// F2: under `-z` a rename is `R  <new>\0<old>\0` -- the old field has NO status
// prefix, so slicing 3 chars off it (as if it were a normal record) fabricates
// a path. Neither end of this rename is owned, so BOTH must show up detected,
// and the old one must be the real path, not a mangled one.
{
  const dir = mkrepo("f2-rename-path", { owns: ["other/**"] });
  seed(dir);
  execFileSync("git", [...GIT, "mv", "docs/kept.md", "site/moved.md"], { cwd: dir });
  fire(dir, "git mv docs/kept.md site/moved.md");
  const det = receipts(dir).filter((e) => e.decision === "detected");
  const paths = det.map((e) => e.path);
  report("a rename's old path is reported whole, not mangled",
    paths.includes("docs/kept.md") && !paths.some((p) => p === "s/kept.md"),
    `paths=${JSON.stringify(paths)}`);
  report("a rename's new path is also reported", paths.includes("site/moved.md"), `paths=${JSON.stringify(paths)}`);
  rmSync(dir, { recursive: true, force: true });
}

// F3: a path-set diff only sees a path go from clean to dirty once. A SECOND
// write to a path that was already dirty (outside owns) before the wave's
// first Bash command must still be detected, not silently folded into
// "observed" because the path was already in the "after" set last time.
{
  const dir = mkrepo("f3-redirty", { owns: ["docs/**"] });
  seed(dir);
  mutate(dir, "require('fs').writeFileSync('site/dirty.ts','A')");
  fire(dir, "echo A >> site/dirty.ts"); // first dirtying: must be detected
  const afterFirst = receipts(dir);
  report("the first write to an unowned file is detected",
    afterFirst.some((e) => e.decision === "detected" && e.path === "site/dirty.ts"),
    `paths=${JSON.stringify(afterFirst.filter((e) => e.decision === "detected").map((e) => e.path))}`);
  const countBeforeSecond = afterFirst.length;
  mutate(dir, "require('fs').writeFileSync('site/dirty.ts','AB')");
  fire(dir, "echo B >> site/dirty.ts"); // second dirtying of the SAME path
  // Isolate what THIS command produced -- the cumulative log already contains
  // a `detected` entry for this path from the first write, so checking the
  // whole log again would pass even if the second write left no new receipt.
  const newEntries = receipts(dir).slice(countBeforeSecond);
  report("a repeat write to an already-dirty unowned file is detected too",
    newEntries.some((e) => e.decision === "detected" && e.path === "site/dirty.ts"),
    `new entries=${JSON.stringify(newEntries)}`);
  rmSync(dir, { recursive: true, force: true });
}

// --- inertness and failure paths ------------------------------------------
{
  const dir = mkrepo("unarmed", { armed: false });
  fire(dir, "printf x > site/probe.txt");
  report("no wave armed writes nothing at all", receipts(dir).length === 0 && !existsSync(join(dir, ".drydock", "bash-tree.json")),
    `receipts=${receipts(dir).length}`);
  rmSync(dir, { recursive: true, force: true });
}

{
  const dir = mkrepo("firstcmd");
  fire(dir, "printf x > site/probe.txt");
  const r = receipts(dir);
  report("the first command of a wave says it seeded",
    r.length === 1 && r[0].decision === "observed" && /seeded/.test(r[0].detail ?? ""),
    `detail=${JSON.stringify(r[0]?.detail)}`);
  rmSync(dir, { recursive: true, force: true });
}

// A gitignored write is invisible to git status. Asserted as a CEILING so it
// fails loudly if someone "fixes" it by scanning ignored files, which would
// make every build tank the hook.
{
  const dir = mkrepo("ignored");
  seed(dir);
  mkdirSync(join(dir, "build"), { recursive: true });
  mutate(dir, "require('fs').writeFileSync('build/out.js','x')");
  fire(dir, "printf x > build/out.js");
  report("a gitignored write leaves no receipt (stated ceiling)",
    receipts(dir).filter((e) => e.decision === "detected").length === 0,
    `detected=${receipts(dir).filter((e) => e.decision === "detected").length}`);
  rmSync(dir, { recursive: true, force: true });
}

{
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "drydock-bash-nogit-")));
  mkdirSync(join(dir, ".drydock"), { recursive: true });
  writeFileSync(join(dir, ".drydock", "wave-owns.json"), '{"plan":"p","wave":"1.0","owns":["docs/**"]}');
  fire(dir, "true");
  const r = receipts(dir);
  report("not a git repo records unavailable, does not throw",
    r.length === 1 && r[0].decision === "unavailable", `decisions=${JSON.stringify(r.map((e) => e.decision))}`);
  rmSync(dir, { recursive: true, force: true });
}

{
  const dir = mkrepo("badconfig");
  writeFileSync(join(dir, ".drydock", "wave-owns.json"), "{ broken");
  fire(dir, "true");
  const r = receipts(dir);
  report("an unusable config records unavailable", r.length === 1 && r[0].decision === "unavailable",
    `decisions=${JSON.stringify(r.map((e) => e.decision))}`);
  rmSync(dir, { recursive: true, force: true });
}

// PostToolUse cannot block, so a non-zero exit is noise in the transcript and
// nothing else. Assert it across every shape above.
{
  let allZero = true;
  for (const [name, setup] of [
    ["armed", () => mkrepo("exit-a")],
    ["unarmed", () => mkrepo("exit-b", { armed: false })],
  ]) {
    const dir = setup();
    for (const cmd of ["true", "printf x > site/z.txt", "rm -rf docs"]) {
      try { fire(dir, cmd); } catch { allZero = false; }
    }
    rmSync(dir, { recursive: true, force: true });
    void name;
  }
  report("never exits non-zero", allZero, "PostToolUse cannot block, so a non-zero exit is pure noise");
}

console.log(failed === 0 ? `\ndetect-bash-writes: PASS, ${total} cases` : `\ndetect-bash-writes: FAIL, ${failed} of ${total} case(s)`);
process.exit(failed ? 1 : 0);
