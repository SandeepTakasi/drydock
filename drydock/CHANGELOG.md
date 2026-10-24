# Changelog

Older entries: [CHANGELOG-archive.md](CHANGELOG-archive.md).

## 0.20.3: 2026-10-24

**Docs only: where a host-spawned session fits.** The desktop app can start sibling sessions from a session. `plan-format.md` now states that such a session is a fleet member, not a third `execution:` mode: in the same checkout it sits under the orchestrator's wave boundary and still owes one commit per task, which the host's own same-folder brief ("commit nothing") forbids, so that shape cannot execute a Drydock task; in its own worktree it is `isolation: worktree` by another name. The README's guard limits now say the hook is inert in any git worktree, executor or session, because `.drydock/` exists only in the main checkout. wavecheck logs an undeclared sibling session as a deviation.

**Unexercised, stated plainly.** No session-spawned execution has been measured (S7 opened beside S6 in the verification log). No code change.

## 0.20.2: 2026-10-24

**`claude plugin validate --strict` passes again.** Host 2.1.310 reports `engines` as an unknown `plugin.json` field, and `--strict` treats that warning as a failure (A4). The host never read `engines`, so it is removed; the Node 20.17 floor is stated in the README and still tested in CI on 20, 22 and 24. No runtime change.

## 0.20.1: 2026-10-19

**The first wave no longer BLOCKs on Drydock's own `.gitignore` edit.** `wave-start` and `arm` appended `.drydock/` to `.gitignore` and left it uncommitted, so in any repo that did not already ignore `.drydock/`, the first `audit-wave` FAILed with `M .gitignore`, a file no task owns (A15; present since plan 010). They now write the line to `.git/info/exclude`, which is never tracked, and only when `git check-ignore` reports that nothing ignores `.drydock/` already.

**One signed gate-line form.** wavecheck asked for `CLOSED, approved by <name>, <date>` while `plan-format.md` specified `CLOSED, approved by <name> - <YYYY-MM-DD>`. wavecheck now asks for the plan-format form. `plan-status` and `validate-plan` are unchanged: they accept any separator before the date, because signed gates in existing plans use several.

**Unexercised, stated plainly.** Proven by the audit suite, not yet in a live session.

Tests: audit 156, unchanged in count; the `.gitignore` case is replaced by one that arms a wave, commits both tasks and requires `audit-wave` to PASS on a clean tree.

## 0.20.0: 2026-10-19

**Fewer pieces: seven skills become four.** The guard (`check`, `arm`, the two hooks) is unchanged and is now what the README leads with.

- **`seatrial` is removed.** A plan's Testing Gate keeps its shape, but its cases now become Playwright specs, written by a final-wave task under `<e2e_dir>/<plan-id>/`, and the closing wavecheck runs them and applies the same gate rule. The Playwright MCP driver is no longer involved, and the verdict goes in the plan's Reconcile report instead of `.drydock/testing/<plan-id>/verdict.md`.
- **`reconcile` is folded into `wavecheck`.** After the final wave PASSes, wavecheck runs a closing step with the same refusals (unsigned human gate, failing Testing Gate) and the same output: deviation clusters, assumption postmortem, proposed doc diffs, token usage, status `RECONCILED`.
- **`init` is folded into `planwright`.** On its first run in a repo with no `drydock.config.yaml`, planwright scans, asks only what scanning cannot answer, and writes the profile. `validate-config` and the schema are unchanged; the schema moved to `skills/planwright/reference/`.
- **`drydock-audit.mjs learnings` is removed.** Planwright greps `CLAUDE.md` and past Deviation Logs itself.
- **`example-small-plan.md` is removed.** `template.md` and `plan-format.md` cover it.
- Entries for 0.1.0 to 0.14.0 moved to `CHANGELOG-archive.md`.

**Unexercised, stated plainly.** Sessions load the installed copy, so the folded steps have not been run by any session yet.

Tests: audit 161 to 156 (the five `learnings` cases), others unchanged.

## 0.19.0: 2026-10-09

**`scope-gate`: a GitHub Action that checks a pull request against the scope its issue declared.** Write `- **Files owned:**` globs, and optionally `- **Forbidden:**` globs and `- **Acceptance criterion:**` commands, in an issue, then close it from the pull request. The Action runs `drydock-audit.mjs check` on the diff from the PR's base and fails with a file annotation on every file outside the scope. It fails closed on a PR that links no issue or more than one, on an issue whose author is not OWNER, MEMBER or COLLABORATOR, and on an issue created after the PR. Use it as `SandeepTakasi/drydock/scope-gate@v0.19.0` on `pull_request` with read-only permissions, never `pull_request_target`. See `scope-gate/README.md`.

**Observed live (A13).** On this repo, a PR inside its issue's scope passed and a PR adding an unowned file failed, naming it. The refusal paths are proven by `scope-gate/gate.test.mjs` (18 cases, in CI on Linux and Windows), not yet live.

**The homepage is rebuilt for a first-time visitor.** It says what Drydock does in plain words, shows what you type and what you get at each step, adds a "Three ways in" section (planwright, check, scope-gate) and a three-step start, and quotes the PR gate's real output.

**The plugin itself is unchanged from 0.18.0.** This version exists so the Action has a tag to pin.

Tests: audit 161, scope-gate 18 (new), others unchanged.

## 0.18.0: 2026-10-07

**`wave-start` no longer silently replaces a guard armed with `arm`.** With a `"check"` boundary in `.drydock/wave-owns.json` it refuses (exit 1, the file untouched): `wave-start: refused, a check boundary is armed (arm, base <base>); close it with rm .drydock/wave-owns.json, then re-run wave-start`. Until now it overwrote the file and the guard's prevention vanished without a message. A leftover plan-wave boundary is still replaced, as before.

**The `/drydock:check` skill reads another planner's task.** When the work comes from another planning tool, the skill copies the paths that task says it will create, modify or test into the intent file, shows the list, and waits for confirmation before arming. A Superpowers `writing-plans` task lists them under `**Files:**`. Nothing parses the other tool's format, so a change to it needs no Drydock release, and the audit afterwards still flags a path the model missed. The plugin README and QUICKSTART carry the recipe.

**`arm` is now observed in a live session (A12).** A Write outside an armed check boundary was denied by the live hook and the file left absent; a Bash write landed and `check` flagged it, the ceiling observed rather than assumed. The homepage now says what the armed guard prevents, beside that ceiling.

**Unexercised, stated plainly.** The skill's new step has not been run by any session, because sessions load the installed plugin copy. It is gated only on mechanical criteria until a session on an installed 0.18.0 runs it.

Tests: audit 159 to 161, others unchanged.

## 0.17.1: 2026-10-07

**The Bash write detector diffed against a snapshot from an earlier wave.** `detect-bash-writes.mjs` compares the working tree after each Bash command with `.drydock/bash-tree.json`, the snapshot the previous command left. Closing a wave removes `.drydock/wave-owns.json` but leaves that snapshot behind, so the next armed wave's first command was diffed against the previous wave's tree, and everything that changed in between was reported as that command's writes outside `owns`. Measured: plan 010's first Bash command logged five `detected` receipts and no `seeded` one, all for plan 009 seatrial specs written after plan 009's last wave closed.

**The snapshot is now bound to the arming that wrote it.** It is stored as `{ "armed": "<key>", "paths": { ... } }`, where the key is `<plan>|<wave>|<mtimeNs of .drydock/wave-owns.json>`; the mtime makes re-arming the same wave a new arming too. A snapshot with another key is discarded and re-seeded with the receipt `snapshot from an earlier arming discarded, snapshot seeded, nothing to diff against`. One in any other shape, the old flat object included, is treated as missing (`first Bash command of the wave, snapshot seeded, nothing to diff against`). Neither case diffs anything. The cost is the existing ceiling: the first Bash command after any arming goes undiffed.

**Plan 010 named the wrong cause.** It blamed a missing snapshot on a wave's first command, and after 0.17.0 CLAUDE.md gained a workaround note ("start a wave from a tree with no untracked files") on that basis. The detector already handled a missing snapshot; the defect was a stale one. The note is deleted.

**Unexercised, stated plainly.** Hooks load from the installed plugin, so no live session has run this fix. Three new suite cases spawn the real hook process against a stale, a re-armed and an old-shaped snapshot; a session on an installed 0.17.1 is the first live run.

Tests: detect-bash-writes 21 to 24, others unchanged.

## 0.17.0: 2026-10-07

**`drydock-audit.mjs arm <intent.md>` arms the ownership hook without a plan.** It reads the same intent file `/drydock:check` writes (one source for the armed boundary and the audited scope) and writes `.drydock/wave-owns.json` as `{"plan": null, "wave": "check", "source": "arm", "base": ..., "owns": [...]}`. The wave id is the literal `"check"` because `audit-wave` counts a receipt with no plan toward every plan with the same wave id, and a plan's wave ids are numeric. Usage: `node "$DD/scripts/drydock-audit.mjs" arm .drydock/check.md`, then work, then `check .drydock/check.md`, then `rm .drydock/wave-owns.json` (there is no disarm subcommand).

**Refusals (exit 1, nothing written):** `arm: refused, a boundary is already armed (plan <plan>, wave <wave>); close it with rm .drydock/wave-owns.json` (it never overwrites a plan wave), and `arm: refused, <glob> reaches every directory; name the directories instead` for any glob starting with `**` (root-only `*.md` is allowed).

**`check` reports whether its scope was armed.** With a `"check"` boundary present it prints `check: hook armed for this scope` when the boundary matches the intent, and `FLAG armed boundary differs from intent` when it does not. With no such boundary its output is unchanged. It does not count hook receipts.

**The `/drydock:check` skill offers arming as an opt-in step**, run only when the user asks for prevention; the default stays audit-only. The plugin README and QUICKSTART now open with this "just the guard" path.

**Ceilings, stated plainly:** Bash writes are detected, not prevented, exactly as in a plan wave. `wave-start` does not yet refuse to overwrite a `"check"` boundary (a follow-up).

**Unexercised, stated plainly.** The skill's new step has not been run by any session, because sessions load the installed plugin copy. It is gated only on mechanical criteria until a session on an installed 0.17.0 runs it. The `arm` subcommand itself is exercised by the suite, including a case where the real hook denies a write outside an `arm`-written boundary.

Tests: audit 154 to 159, others unchanged.

## 0.16.0: 2026-10-07

**`drydock-stats.mjs <plan.md> [--projects <dir>]` reports where a plan's tokens went.** It reads the host's session transcripts under `~/.claude/projects/<encoded repo>/` and splits one plan's tokens into three buckets: orchestration (main sessions whose text names the plan's slug), execution (`drydock:executor*` subagents whose own transcript names it), and other subagents. Usage lines repeat per API request with streaming partials that disagree, so it deduplicates globally on `requestId` and keeps the max of each field; first-line-wins was measured to undercount output by about 18%. Every session row names the other plans it mentions, and the output ends with the caveat that a session is counted whole: tokens, not cost. It reads only and writes nothing. `reconcile` now pastes its output under `### Token usage`.

**`wave-start` refuses to arm a wave while an earlier implementation wave of the same plan lacks a PASS wavecheck report.** The last heading per wave wins; review waves and superseded tasks are exempt; after a BLOCK, a re-audit heading whose PASS supersedes it is the way through. Exercised live during plan 008: arming wave 1.3 before 1.2 had a report was refused with exit 1 and nothing written.

**CI re-audits every sealed wave of every `format_version: 3` plan** through the new `drydock/scripts/audit-corpus.mjs`, the same command locally and in CI. The `docs` job now checks out full history (`fetch-depth: 0`) and the `plugin` job runs the stats suite. v2 plans (001-004) are excluded because they predate the attribution manifest and 14 of their 29 waves cannot re-audit. Measured from a clean clone with an empty `CLAUDE_CONFIG_DIR`: `audit-corpus: PASS, 18 wave(s) in 4 plan(s)`. Ceiling: a commit made after a sealed wave that no task claims is not seen.

**`drydock-audit.mjs check <intent.md>` and the new `/drydock:check` skill cover small work with no plan.** State a scope in a short intent file (owned globs, optional forbidden globs, optional criterion commands), do the work, and the audit flags files changed outside scope or inside a forbidden glob (a rename counts as a delete plus an add) and criteria that fail. It detects after the fact and prevents nothing; it never arms the hook. Criteria run through the platform shell, cmd.exe on Windows and /bin/sh elsewhere.

**`drydock-audit.mjs learnings [--plans-dir <dir>] <path>...` recalls past learnings for the files you are about to touch.** It prints the `CLAUDE.md` lines and past Deviation Log rows that name each path, full-path hits before basename-only hits. `planwright` now runs it once the files a plan will own are known.

**Two defects found by plan 008's own quality review before release, fixed:** the `validate-config` usage line had lost its space, and two `check` test fixtures used `node -e process.exit(7)`, a syntax error under /bin/sh that would have failed every ubuntu CI leg (now `exit 7` and `exit 0`).

**Unexercised, stated plainly.** The three skill changes (`check`, planwright's learnings step, reconcile's token step) have not been run by any session, because sessions load the installed plugin copy. They are gated only on mechanical criteria until a session on an installed 0.16.0 runs them.

Tests: audit 139 to 154, enforce-owns unchanged at 42, detector unchanged at 21, resolver unchanged at 8, stats new at 8.

## 0.15.2: 2026-10-06

**The resolver suite failed on every `windows-latest` runner, and the product code was fine.** 0.15.1's CI went red on `resolve-target.test.mjs` across Node 20, 22 and 24 on Windows, while passing on ubuntu and on the development machine. The two real-filesystem cases normalised their fixture with the JS `realpathSync`, while the module under test resolves through `realpathWithFallback`, which tries `realpathSync.native` first. Those two disagree about Windows 8.3 short names: JS keeps `REPRO8~2`, native expands it to the long directory name. A GitHub runner's temp path is `C:\Users\RUNNER~1\AppData\Local\Temp`, so the expectation and the result described the same directory by different names and could never match. Neither this machine's temp path nor ubuntu's has a short component, which is why three reviews and a green local suite missed it.

**This is plan 007's own decision D5 applied to the wrong side of the test.** D5 says resolve the root and the target through the same function or their relative path is meaningless; the fixture used a different ruler than the code it measured. Both fixtures now use `realpathSync.native`, with the reason recorded where the next reader will hit it.

**Verified by simulating the runner rather than by waiting for CI:** with `TMP` pointed at a path carrying an 8.3 component, the fixed suite reports `PASS, 8 cases` and the pre-fix file reports `FAIL, 2 of 8`, naming exactly the two cases CI named. No product file changed; the hooks, the resolver module and the audit are untouched.

Tests: unchanged at audit 139, enforce-owns 42, detector 21, resolver 8.

## 0.15.1: 2026-10-06

**The seven items plan 006 deferred ship as 0.15.1, produced by plan `docs/plans/007-deferred-hardening.md`, and the plan's own reviews rejected its first two passes.**

**F7, both hooks went inert from a subdirectory.** With `CLAUDE_PROJECT_DIR` unset and the working directory a subdirectory, both hooks failed to find `.drydock/wave-owns.json`; measured, an unowned write returned exit 0 instead of 2. They now walk up to the nearest ancestor holding that file, stopping at the repository root (`.git`, directory or file), so a stale armed wave in a parent directory is never adopted.

**F10, a write to another Windows drive was denied.** `path.relative` across drives returns an absolute path, which the hook read as an escape. "Outside" now means outside BOTH textually and after resolution.

**The resolver split.** The ancestor walk moved into `drydock/lib/resolve-target.mjs` with an injectable filesystem, so the JS `realpathSync` fallback (for volumes where `realpathSync.native` fails, which would otherwise deny every write in an armed wave) is testable by injection. Its suite runs in CI.

**A relative target containing `..`.** `path.resolve` collapsed it textually before the kernel followed the link, so on POSIX `docs/esc/../site/x.ts` with `docs/esc -> ../site` was allowed and the write landed outside `owns` (measured on Linux under the floor runtime). Relative targets are now joined unnormalized.

**The detector.** A working-tree rename (` R`, after `git add -N`) had its old path sliced by three characters, naming a file that does not exist (measured `e/a.ts` for `site/a.ts`).

**Receipts.** A deny raised by a thrown check wrote none; it now does, with a string-coerced path. Still leaving nothing: the unusable-config deny, the outside-the-repo allow, and the pre-config allows. The hook's docblock now lists them.

**What this plan's own reviews caught.** The first quality review REJECTED Phase 1: the new "outside" rule allowed a write addressed through a UNC form of the repo's own path (`\\localhost\c$\...`), unowned and unlogged, where the previous hook denied it, because `realpathSync.native` collapses `\\?\C:` and `subst` onto `C:` but leaves UNC unchanged, so both votes read "outside". Fixed by corroborating an absolute relative path with filesystem identity (`dev` and `ino`). The re-review REJECTED again: the new UNC cases never checked the admin share was reachable, so a box without it went red while the case gating the fix passed for the wrong reason. The third review APPROVED.

**Ceilings, stated.** A junction escape addressed through a UNC form of the repo is still allowed silently. A project root on a filesystem **without file ids** (`ino === 0`, some FAT/exFAT and some network filesystems) disables identity corroboration entirely, so a UNC form is allowed there too; the guard exists because the alternative false-denies ordinary owned writes on such a volume. Hard links are still followed.

**Verification.** Exercised by the suites (audit 139, enforce-owns 42, detector 21, resolver 8), by a direct reproduction per finding, and on Linux under the floor runtime via Docker. The installed plugin must be updated before a host session loads them; no live host session has verified 0.15.1.

Tests: enforce-owns 33 to 42, detector 18 to 21, resolver new at 8, audit unchanged at 139.

## 0.15.0: 2026-09-21

**Nine findings, eight from a 2026-09-20 external review plus one found by this
plan's own approval gate, ship as 0.15.0, produced by plan `docs/plans/006-external-review-repairs.md`.** Every review finding was reproduced
first-hand against the working tree before any fix was written, and a
fresh-context adversarial review rejected the first repair pass on two further
findings before approving a second pass.

**F1, the ownership hook's junction escape (HIGH).** `enforce-owns.mjs`
resolved only the write target's immediate parent directory, so a junction or
symlink placed above a not-yet-existing target directory was never resolved,
and a write through it landed outside `owns` while the hook allowed it. It now
resolves the deepest existing ancestor and re-appends the unresolved
remainder, which also closes a symlinked final path component that was never
resolved before. The first quality review then found the first fix incomplete: a link
that exists but cannot itself be resolved (a dangling symlink or junction, a
loop) was still treated as "does not exist" and climbed past. That case is now
denied outright.

**F2 and F3, the Bash write detector (MEDIUM).** A rename record under
`git status -z` had its old path mangled by an off-by-three slice, reporting a
fabricated path for a rename entirely inside the boundary. Separately, a
second write to a path already marked dirty produced no new detection at all,
and the receipt for that command read `observed`, asserting the boundary was
clean when an out-of-boundary write had in fact occurred. The detector now
snapshots per-path content identity (size and nanosecond mtime) instead of a
path set, so a repeat write to a dirty path is now reported as `detected`. The
traded cost, stated rather than left for a reader to find: a content-identical
rewrite of an already-dirty path (a touch, a normalizing `git add`) now also
reports as `detected`, a documented false positive taken on to close the false
negative.

**F4, non-ASCII filenames falsely blocked, plus a rename out of an unowned
path invisible to the audit (MEDIUM, MAJOR).** `git show --name-only` without
`-z` quotes and octal-escapes any non-ASCII path, so a conforming task
committing an accented filename was blocked for owning a file it owned. The
three parsing call sites in `drydock-audit.mjs` now pass `-z` and split on
NUL. The first quality review that found the F1 gap also found that `git show` without
`--no-renames` lists only the destination of a rename, so a task could `git
mv` a file out of a path it does not own and the audit would never see the
source side. All three call sites now pass `--no-renames` too.

**F5, both test suites unrunnable on stock Windows (MEDIUM).**
`enforce-owns.test.mjs` called `symlinkSync` at module scope, which throws
`EPERM` without Developer Mode or elevation, so none of its 30 declared cases
ran. `drydock-audit.test.mjs` failed two cases because `process.execPath`, a
path containing a space on this machine, was interpolated unquoted into a
`cmd.exe` command line. Both are fixed: link creation now uses a Windows
junction with a POSIX symlink fallback, and the path is quoted. This is why F5
mattered beyond itself: F1 is exactly the class of bug a suite that cannot run
will not catch, and F1 shipped anyway.

**F9, `prove-failable` misreporting a failing criterion as unrunnable
(MEDIUM, found while gating this plan, not by the review).** A criterion that
legitimately failed was reported unable to run at all whenever its own nested
test output happened to contain the words "not found" anywhere in stderr,
because the heuristic scanned the whole stream. It failed two of this plan's
own correct criteria during Phase 1 gating. The scan is now narrowed to the
first line of stderr, where a shell's own diagnostic appears; the exit codes
the heuristic exists to catch were already handled separately and are
unaffected.

**F6 and F8, documentation the code contradicted (LOW).** The plugin README
now states plainly that a plan document is executed, not merely read:
`prove-failable` and wavecheck run backticked strings lifted from a plan
through the shell. Four separate statements that `audit-wave` "never consults
the hook" are corrected: it reads the hook's own enforcement log. The
wavecheck ordering contradiction between "stop early only on check 1 failure"
and an empty-log BLOCK raised under check 2 is resolved.

**Deferred, named rather than dropped.** F7, the hooks going inert when
`CLAUDE_PROJECT_DIR` is unset and the working directory is a subdirectory, is
documented robustness rather than a live hole under Claude Code, which always
sets that variable; not fixed here. F10, found during this plan and
pre-existing: a write to a path on a different drive is DENIED rather than
allowed as "outside the repo", because `path.relative` across Windows drives
never returns a path prefixed with the parent marker; fails closed, not a
regression, but contradicts the documented ceiling, and is not fixed here.
Carried forward from the re-review, unmeasured and worth stating loudly: on a
volume where `realpathSync.native` fails while `lstat` succeeds (some SMB
shares, RAM disks, virtual filesystems), the new "exists but does not resolve"
branch would deny every write in an armed wave where the old code climbed past
and allowed it. That is an availability risk rather than an escape, since it
fails closed; the unwedge is removing `.drydock/wave-owns.json`. Several MINOR
and NIT items (a working-tree rename's old path still sliced wrong, a
deny-by-throw writing no receipt, a hard link still followed with no
documentation saying so, a POSIX parent-directory-after-symlink suspicion) are
recorded rather than fixed.

**Verification honesty.** Every wave of the plan that produced this release
was enforced by the INSTALLED, unrepaired 0.14.0 hook, because hooks load from
the installed plugin, never the working tree. The repaired hooks passed their
suites and direct reproductions against the pre-fix code, but no host session
has loaded the repaired code itself: that needs this release installed
(`claude plugin marketplace update drydock` then `claude plugin update
drydock@drydock`) and a fresh session. One positive is on the record from this
same execution: the installed hook was observed live, denying a deliberate
probe mid-wave, the first recorded answer to this repo's open A9 question.

Tests: audit 136 to 139, hook (enforce-owns) 30 to 33 (previously ran 0 of its
cases on stock Windows), detector (detect-bash-writes) 14 to 18.

