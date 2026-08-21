/**
 * Ownership boundary enforcement for Drydock waves. Node built-ins only.
 *
 * PreToolUse hook on Write / Edit / NotebookEdit. Denies a write to a path no
 * task in the active wave owns.
 *
 * Drydock's ownership contract was prose-only until 0.6.0, and prose did not
 * hold: plan 004 deviation 13 recorded a checkpoint commit staging a file
 * outside its `owns`, with the root cause stated as "the task ran inline rather
 * than via a spawned executor, so the checkpoint-commit discipline was not
 * mechanically enforced". A hook binds every writer in the session — spawned
 * executors, an inline orchestrator, and the human at the keyboard — because it
 * sits at the tool boundary rather than in an instruction someone has to obey.
 *
 * CONFIG — `.drydock/wave-owns.json`, written by the orchestrator before the
 * wave opens, deleted when it closes:
 *
 *   { "plan": "005-x", "wave": "2.1", "owns": ["docs/verification-log.md", "e2e/**"] }
 *
 * WAVE-LEVEL, NOT PER-TASK, and deliberately so. PreToolUse input carries no
 * subagent identity (only session_id, transcript_path, cwd, permission_mode,
 * hook_event_name, tool_name, tool_input), and a wave runs N executors at once,
 * so a per-task config would be a race. This catches "wrote a file no task in
 * this wave owns" — deviation 13's exact shape. Task-vs-task attribution stays
 * with per-task commits and `drydock-audit.mjs audit-wave`, which is already
 * sound.
 *
 * CEILINGS, stated because a guarantee with a hidden hole is worse than none:
 *   - Bash writes (`sed -i`, `>` redirect, `git checkout`) do not pass through
 *     file-tool hooks and are NOT caught here. The post-hoc audit is the backstop.
 *   - Paths outside the project directory are not enforced — the ownership model
 *     describes repo files, and denying scratchpad writes would break unrelated work.
 *   - Requires Node >=22 for `path.matchesGlob`.
 *
 * FAILURE POSTURE: absent config means inert (exit 0) — that is the normal state
 * of a repo not mid-wave, and it is the escape hatch that makes `deny` safe to
 * ship. A config that exists but cannot be parsed fails CLOSED: a malformed
 * enforcement control must not quietly become no enforcement. Every denial names
 * the remedy, because a hook that can wedge a repo has to say how to unwedge it.
 */

import { readFileSync } from "node:fs";
import { join, resolve, relative, isAbsolute, matchesGlob } from "node:path";

const allow = () => process.exit(0);

const deny = (message) => {
  process.stderr.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny" },
      systemMessage: message,
    })
  );
  process.exit(2);
};

let input;
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  allow(); // not our business to break the session on unreadable hook input
}

const target = input?.tool_input?.file_path ?? input?.tool_input?.notebook_path;
if (!target) allow();

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const configPath = join(projectDir, ".drydock", "wave-owns.json");

let raw;
try {
  raw = readFileSync(configPath, "utf8");
} catch {
  allow(); // no active wave — the normal state of this repo
}

let config;
try {
  config = JSON.parse(raw);
  if (!Array.isArray(config.owns)) throw new Error("`owns` must be an array of globs");
} catch (err) {
  deny(
    `Drydock: .drydock/wave-owns.json is present but unusable (${err.message}). ` +
      `Enforcement fails closed rather than silently switching itself off. ` +
      `Fix the file or, if no wave is running, delete .drydock/wave-owns.json.`
  );
}

// Normalise to a repo-relative POSIX path: plan `owns` globs are written with
// forward slashes, and on Windows the tool hands us backslashes.
const absolute = isAbsolute(target) ? target : resolve(projectDir, target);
const rel = relative(projectDir, absolute).split("\\").join("/");

// Outside the repo entirely — not what the ownership model describes.
if (rel.startsWith("../")) allow();

if (config.owns.some((glob) => matchesGlob(rel, glob))) allow();

const where = config.plan ? `${config.plan} wave ${config.wave}` : `wave ${config.wave}`;
deny(
  `Drydock ownership violation: ${where} does not own ${rel}.\n` +
    `Owned by this wave: ${config.owns.join(", ")}\n` +
    `If correct implementation needs this file, that is a deviation — report it ` +
    `rather than widening your own boundary. Stale? delete .drydock/wave-owns.json`
);
