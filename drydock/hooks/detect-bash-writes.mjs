/**
 * Bash-mediated write detection for Drydock waves. Node built-ins only.
 *
 * PostToolUse hook on Bash. Records, per command, every file that changed
 * outside the active wave's `owns` set. It does NOT prevent anything, and that
 * is the design, not a limitation of the implementation.
 *
 * WHY THIS IS DETECTION AND NOT PREVENTION. Issue #3 proposed "stop selling
 * prevention" and was closed by documenting the ceiling. This keeps that
 * decision. The set of commands that write is not decidable from the command
 * string, so a deny-regex over `tool_input.command` is not a gate with a few
 * edge cases, it is an unbounded set of holes:
 *
 *     cd site && printf x > a.txt      target relative to a dir we never compute
 *     OUT=site/a.txt; printf x > $OUT  value unknown until the shell expands it
 *     python - <<'EOF' ... open(p,'w')  the write lives in another language
 *     xargs sed -i / find -exec         targets arrive on stdin at runtime
 *     npm run build                     the write is in a file we never open
 *     git checkout other-branch         rewrites arbitrary paths, no path argument
 *
 * One token (`cd`) defeats it, and the false positives are worse than the false
 * negatives: `npm ci`, `pytest`, any build writes paths no task owns, and the
 * escape hatch for a wrongly-denied build is `rm .drydock/wave-owns.json` --
 * disarming the real hook. A control that reads as protection and is not one is
 * the thing this plugin's own docblocks spend the most words arguing against.
 *
 * So: the file-tool hook PREVENTS at the boundary and is blind to Bash. This
 * DETECTS from the working tree, immediately after the command, and names it.
 *
 * WHAT THIS FIXES THAT THE COMMIT AUDIT DOES NOT. `audit-wave` reads commits
 * and the working tree at wave close. This sees a write that was made and then
 * reverted inside the wave, and it attributes a change to the command that
 * caused it rather than to the wave as a whole. More importantly it ends an
 * ambiguity: an empty enforcement log used to have four possible causes (never
 * armed, never registered, no writes, or all writes through Bash) and the audit
 * had to guess between them. An `observed` entry is positive evidence that the
 * Bash layer was alive and saw nothing unowned.
 *
 * CEILINGS, stated because the point of this file is to stop overclaiming:
 *   - `.gitignore`d paths are invisible to `git status`. A Bash write to an
 *     unowned-but-ignored file leaves no receipt. Mostly a feature (build
 *     output, node_modules, .drydock/ itself) but it means "detects everything"
 *     is false.
 *   - A write-then-restore inside ONE command shows nothing.
 *   - A content-identical rewrite of an ALREADY-DIRTY path (a `touch`, or a
 *     `git add` normalising line endings) now yields a `detected` receipt with
 *     no content change. That is a false positive, traded on purpose for the
 *     false negative it replaces: a SECOND write to a path that was already
 *     dirty before the wave's first Bash command used to be invisible, because
 *     a plain path-set diff can't see a path that was already in both sets.
 *     Identity is `size:mtimeNs` from `statSync`, not a content hash -- cheap,
 *     and a spurious `detected` on an unchanged file is far cheaper to live
 *     with than silently missing a real edit.
 *   - Paths outside the repo are invisible, same as the file-tool hook.
 *   - A backgrounded command (`run_in_background: true`) finishes after this
 *     hook fires; its writes land in a later command's diff or nowhere.
 *   - Attribution is "changed around this command", not "caused by it". Two
 *     executors running Bash concurrently can be credited with each other's
 *     changes. Measure before trusting the attribution of a parallel wave.
 *
 * NEVER EXITS NON-ZERO. PostToolUse cannot block -- the tool has already run --
 * so a non-zero exit is pure noise in the transcript. Every failure path here
 * exits 0, and a failure that prevented detection writes an `unavailable`
 * receipt so the gap is visible rather than silent.
 */

import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { matchesOwns } from "../lib/owns-match.mjs";

const done = () => process.exit(0);

let input;
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  done(); // unreadable hook input is not our business to complain about
}

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input?.cwd ?? process.cwd();
const dir = path.join(projectDir, ".drydock");
const configPath = path.join(dir, "wave-owns.json");

// COST CONTROL, and it is the first thing on purpose. No wave armed is the
// normal state of every repo that installs this plugin, and that case must cost
// one stat() rather than two git invocations. Everything below this line only
// runs mid-wave.
if (!existsSync(configPath)) done();

let config;
try {
  config = JSON.parse(readFileSync(configPath, "utf8"));
  if (!Array.isArray(config.owns)) throw new Error("`owns` must be an array");
} catch {
  // Unlike the file-tool hook, an unusable config here cannot "fail closed" --
  // there is nothing left to close, the command already ran. Say so and stop.
  record("unavailable", null, "wave-owns.json is present but unusable");
  done();
}

const snapshotPath = path.join(dir, "bash-tree.json");

function record(decision, file, detail) {
  try {
    mkdirSync(dir, { recursive: true });
    appendFileSync(
      path.join(dir, "enforcement.log"),
      JSON.stringify({
        ts: new Date().toISOString(),
        plan: config?.plan ?? null,
        wave: config?.wave ?? null,
        decision,
        path: file,
        owns: config?.owns ?? [],
        task: null,
        // Splits this layer from the file-tool hook in the audit. Absent in
        // every receipt written before this file existed, which is exactly how
        // `audit-wave` tells old logs apart: no mechanism means file-tool.
        mechanism: "bash-tree",
        command: typeof input?.tool_input?.command === "string"
          ? input.tool_input.command.slice(0, 200)
          : null,
        detail: detail ?? null,
      }) + "\n"
    );
  } catch {
    // Bookkeeping never changes anything here; there is no verdict to change.
  }
}

// `git status`, not mtime. It is index-accelerated, it is already what
// `audit-wave` uses, and it yields repo-relative POSIX paths that feed
// matchesOwns directly. An mtime walk would be slower, would fire on every
// node_modules file, and would still need a tree walk to name the paths.
const gitStatus = () => {
  const out = execFileSync("git", ["-C", projectDir, "status", "--porcelain", "-z", "--untracked-files=all"], {
    encoding: "utf8",
    maxBuffer: 16 << 20,
    timeout: 10000,
  });
  // NUL-delimited so paths with spaces or newlines survive. A rename/copy
  // record (status starts R or C) is TWO NUL-terminated fields: `XY <new>`
  // followed by a BARE `<old>` with no "XY " prefix at all. Walking by index
  // and consuming the following record whole for those two statuses is the
  // only way to get the old path right -- slice(3) on it eats three real
  // characters off a field that never had a prefix to slice.
  const records = out.split("\0").filter(Boolean);
  const paths = new Set();
  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const status = rec.slice(0, 2);
    paths.add(rec.slice(3));
    if (status[0] === "R" || status[0] === "C") {
      i += 1;
      if (i < records.length) paths.add(records[i]);
    }
  }
  return paths;
};

// Content identity for one repo-relative path: cheap and sufficient to answer
// "did this path change", not a hash. A path git status reports but that is
// no longer on disk (deleted, or the old half of a rename) gets the literal
// "absent" -- itself an identity, so a path going absent->present or
// present->absent still counts as changed.
const identityOf = (rel) => {
  try {
    const st = statSync(path.join(projectDir, rel), { bigint: true });
    return `${st.size}:${st.mtimeNs}`;
  } catch {
    return "absent";
  }
};

const snapshotOf = (paths) => {
  const snap = {};
  for (const p of paths) snap[p] = identityOf(p);
  return snap;
};

let afterPaths;
try {
  afterPaths = gitStatus();
} catch (err) {
  // Not a git repo, git absent, or a timeout. Detection did not happen and the
  // receipt says so rather than leaving a silent gap.
  record("unavailable", null, `git status failed: ${err.code ?? err.message}`.slice(0, 120));
  done();
}

let before = null;
try {
  if (existsSync(snapshotPath)) {
    const raw = JSON.parse(readFileSync(snapshotPath, "utf8"));
    // Compat: the snapshot used to be a JSON array of bare paths (no identity).
    // An old-shaped snapshot is unusable for identity comparison -- treat it
    // as missing, same as a corrupt file, rather than crash on it.
    before = raw && !Array.isArray(raw) && typeof raw === "object" ? raw : null;
  }
} catch {
  before = null; // a corrupt snapshot is a missing snapshot
}

const afterSnap = snapshotOf(afterPaths);

// Roll the snapshot forward before doing anything else with it, so a throw
// below cannot wedge the next command into re-reporting the same paths. This
// REPLACES the snapshot rather than merging it, so a path that stops showing
// up in git status (committed, reverted) naturally drops out.
try {
  mkdirSync(dir, { recursive: true });
  writeFileSync(snapshotPath, JSON.stringify(afterSnap));
} catch {}

// No snapshot yet means this is the first Bash command of the wave and there is
// nothing to diff against. Seeding silently would hide writes made by that very
// command, so say what happened instead of guessing.
if (before === null) {
  record("observed", null, "first Bash command of the wave, snapshot seeded, nothing to diff against");
  done();
}

const changed = Object.keys(afterSnap).filter((p) => !(p in before) || before[p] !== afterSnap[p]);
const unowned = changed.filter((f) => !matchesOwns(f, config.owns));

if (unowned.length === 0) {
  // The load-bearing entry. Positive evidence that this layer was alive and saw
  // nothing outside the boundary, which is what makes an empty prevention log
  // diagnosable instead of ambiguous.
  record("observed", null, `${changed.length} path(s) changed, all inside the wave's owns`);
  done();
}

for (const file of unowned) record("detected", file, "changed by a Bash command, outside the wave's owns");
done();
