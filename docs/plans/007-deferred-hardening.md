---
plan: 007-deferred-hardening
format_version: 3
status: DRAFT
isolation: none
enforcement: required
attribution: manifest
lane: full
execution: fleet
created: 2026-09-21
approved_by: unapproved
---

# 007 - Deferred hardening from plan 006

**Plan location:** `docs/plans/`, committed with the repo.

> **Execution protocol.** Spawn each task in the current wave as its declared
> executor agent (`drydock:executor`, or `drydock:executor-isolated` when the
> header says `isolation: worktree`) with its declared model and thinking
> budget, passing ONLY the task's context brief. Before starting any wave, run
> the staleness check below. Wait for all tasks in the wave, then invoke the
> `drydock:wavecheck` skill with this plan path and the wave id. Do not begin
> the wave's quality-review task, or the next wave, until wavecheck reports
> PASS. On BLOCK, set status BLOCKED and stop, do not self-repair; the paths
> out are `/drydock:replan` or a human decision. Quality-review rejections
> follow the escalation policy (max 2 retries → tier up → human); wavecheck
> BLOCKs on ownership violations or unlogged deviations get NO retries. When
> the final wave and phase gate pass, invoke `drydock:reconcile`.
>
> **If you cannot spawn executors**, a standing instruction against unprompted
> agents, agents unavailable, that is a deviation to log **before the wave
> opens**, not after it closes, and it does not become permission to skip the
> wave gate. Two obligations survive intact: stage **only** the task's owned
> files in its checkpoint commit (a spawned executor gets this for free; by hand
> it is the first thing to slip), and tell wavecheck the diff is self-authored,
> because its forbidden audit is weakened when the auditor wrote the code and it
> must say so rather than imply independence it does not have.

**Ownership enforcement (arm before every wave):**

```bash
DD=$(ls -d ~/.claude/plugins/cache/drydock/drydock/*/ | sort -V | tail -1)
node "$DD/scripts/drydock-audit.mjs" wave-start docs/plans/007-deferred-hardening.md <wave>
# ... the wave's executors run ...
node "$DD/scripts/drydock-audit.mjs" audit-wave docs/plans/007-deferred-hardening.md <wave>
rm .drydock/wave-owns.json
```

**Orchestrator bookkeeping, from plan 006's applied lessons (CLAUDE.md):** set
`status: EXECUTING` and this plan's `docs/plans/README.md` row in the commit
before the first `wave-start`; write this plan file only while no wave is armed,
and commit it before the next `wave-start`; spawn a wave's executors **one at a
time** so a usage-limit cutoff costs at most one task (D7); a review rejection is
repaired in a new wave with new task ids.

**Staleness check (before every wave):**
`git diff <baseline SHA>..HEAD -- <wave's owned files>`. Non-empty → re-validate
the wave's tasks against current code and update the baseline SHA and Decision
Log before executing.

## Requirement

Every item plan 006 deferred is resolved, each reproduced first: the ownership
hook finds an armed wave when `CLAUDE_PROJECT_DIR` is unset and the working
directory is a subdirectory (F7); a write to a path outside the repository on
another Windows drive is treated as outside rather than denied (F10), without
opening an escape through resolver disagreement; a volume where
`realpathSync.native` fails no longer makes the hook deny every write; a deny
raised by a thrown check writes a receipt like any other deny; the Bash detector
reports the old path of a working-tree rename whole; a relative target with a
`..` segment after a symlink is resolved the way a POSIX kernel resolves it; and
the 0.15.0 CHANGELOG's superseded verification sentence is corrected in the next
release note. Ships as `0.15.1`.

## Spec reference

None. The requirement is complete: the items are plan 006's *Out of scope /
follow-ups* and its Wave 1.R re-review findings, each re-measured in this
session and recorded with evidence in *Findings & constraints*.

## Surgical-scope statement

One new module that the ancestor walk moves into so its fallback can be tested
(`drydock/lib/resolve-target.mjs`) with its test and one CI line; the ownership
hook rewired to it with an outside-the-repo rule, a walk-up for the config and a
receipt on thrown denies; a two-character widening of the detector's rename test
plus the same walk-up; and a patch release. No behaviour outside these items
changes.

## Baseline

Filled by T0 before any wave is armed.

| | |
|---|---|
| Commit SHA | *(T0)* |
| `node drydock/scripts/drydock-audit.test.mjs` | *(T0)* |
| `node drydock/hooks/enforce-owns.test.mjs` | *(T0)* |
| `node drydock/hooks/detect-bash-writes.test.mjs` | *(T0)* |
| `node site/scripts/assert-matrix.mjs` | *(T0)* |

## Practices in effect

| Practice | Value | Source |
|---|---|---|
| Test approach | Test-first per task: the regression case is written, watched failing, then fixed, in one task | planwright TDD rule; repo convention |
| Quality gates | `node <suite>` per area; `npm run verify` in `site/` for the release task | CLAUDE.md |
| CI | `.github/workflows/verify.yml`, Node 20, 22 and 24 × ubuntu and windows, no path filter; runs each suite by an explicit `run:` line | `verify.yml:45`, `:58-60` |
| Runtime floor | `engines.node: ">=20.17.0"`; no Node 21+ API | `drydock/.claude-plugin/plugin.json` |
| Criteria shell | `cmd.exe` via `spawnSync(cmd, {shell: true})`; no backslash escapes in criteria; suite runs wrapped in `try/catch` with stderr ignored | CLAUDE.md (plan 006 R1) |
| Links on Windows | Junctions need no privilege, even dangling; file symlinks need Developer Mode | CLAUDE.md (plan 006 R3) |
| POSIX verification | `docker run node:20-slim` is available on this machine and runs the floor Node on Linux | measured this session |
| Commit granularity | One checkpoint commit per task, owned files only, then `task-close` | plan-format contract; CLAUDE.md |
| Attribution | `manifest` | D8 |
| Human gate | Phase 2 release requires a named human approval | D9 |

## Findings & constraints

Every item was reproduced in this session against `01ef36e` (0.15.0), with the
hook or detector invoked directly on a scratch repo.

**F7, confirmed.** [enforce-owns.mjs:103](drydock/hooks/enforce-owns.mjs:103)
and [detect-bash-writes.mjs:81](drydock/hooks/detect-bash-writes.mjs:81) resolve
`process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd()` and look for
`.drydock/wave-owns.json` directly under it. Measured with the variable unset and
`owns: ["docs/**"]`: a write to the unowned `site/a.ts` with `cwd` set to the
repo root → exit 2; with `cwd` set to `docs/sub` → **exit 0**, the hook inert.

**F10, confirmed.** [enforce-owns.mjs:269](drydock/hooks/enforce-owns.mjs:269)
treats a path as outside the repo only when its repo-relative form starts with
`../`. On Windows `path.relative` across drives returns the absolute target, so
`Z:/nope/x.ts` is matched against `owns` and **denied** (exit 2). Fails closed.
`rel === ".."` (the repo's parent itself) is missed by the same test.

**Resolver disagreement, found this session, and it couples F10 to the
fallback.** With a `subst` drive `Q:` mapped to a scratch directory,
`realpathSync.native("Q:\\inner")` returns the `C:\...` target path while the JS
`realpathSync("Q:\\inner")` returns `Q:\inner`. Neither threw here; no volume on
this machine makes `native` fail (subst, `\\localhost\c$`, `\\127.0.0.1\c$`,
`\\?\C:` all resolve natively). The consequence: if the root were resolved one
way and a target the other, their relative path is cross-drive, and a naive F10
fix ("an absolute relative path is outside, allow") would turn that mismatch
into an **escape**. D2 closes it by construction.

**realpath.native over-deny, suspected, not reproducible here.** Since 0.15.0,
[`resolveAncestry`](drydock/hooks/enforce-owns.mjs:231) denies whenever
`realpathSync.native` fails and `lstatSync` succeeds. On a volume where `native`
fails for every entry but the JS `realpathSync` works (reported for some SMB
shares, RAM disks and virtual filesystems), every write in an armed wave would be
denied. D3 makes the fallback testable without such a volume.

**Receipt-less thrown denies, confirmed live.** The outer `catch` at
[enforce-owns.mjs:284](drydock/hooks/enforce-owns.mjs:284) calls `deny()` without
`record()`. Measured through the real Write tool on 2026-09-21: the F1 deny and a
control allow were logged, the dangling-link deny ("exists but does not resolve")
left **no entry**.

**Working-tree rename, confirmed.**
[detect-bash-writes.mjs:154](drydock/hooks/detect-bash-writes.mjs:154) consumes a
second NUL record only when `status[0]` is `R` or `C`. After `mv site/a.ts
docs/a.ts && git add -N docs/a.ts`, git 2.47 prints ` R docs/a.ts\0site/a.ts\0`
(rename in the worktree column), and the detector logged `detected e/a.ts`, a
path that does not exist.

**POSIX `..` after a symlink, confirmed on Linux, narrower than suspected.**
Measured in `node:20-slim` (v20.20.2) with `docs/esc -> ../site`: the relative
target `docs/esc/../site/x.ts` → **exit 0**, and a write to it landed in
`site/x.ts`; the absolute form `/tmp/r/docs/esc/../site/x.ts` → exit 2, correct.
The defect is only `path.resolve(root, target)` at
[enforce-owns.mjs:264](drydock/hooks/enforce-owns.mjs:264), which collapses `..`
textually before the kernel follows the link; the absolute branch already hands
the raw string to `realpath`. Windows collapses `..` textually itself, so the
same raw-string construction is correct there too. Claude Code's Write tool sends
absolute paths, so this mainly concerns other callers.

**Stale release sentence.** The 0.15.0 CHANGELOG entry says no host session had
loaded the repaired code. Plan 006's progress log records it verified live the
same day. Released entries are not rewritten; the 0.15.1 entry says so.

**Constraints.**

- **Hooks resolve from the installed plugin**, and on this machine the host
  picked up a plugin update without a restart (plan 006 progress log). The
  hooks enforcing this plan's waves are the installed 0.15.0 copy; the repaired
  ones are exercised by their suites, a direct reproduction per finding, and a
  live probe after the release.
- **A new test file runs in CI only if `verify.yml` has a `run:` line for it.**
- **`assert-copy.mjs` checks the version in `site/content/copy.ts` and the root
  `README.md`.**
- **Every criterion below was run through `spawnSync(cmd, {shell: true})` and
  fails at baseline** (`prove-failable`, recorded in the pressure-test verdict).

## Decision Log

| # | Question | Decision | Decided by | Rationale |
|---|---|---|---|---|
| D1 | Lane and execution mode? | `lane: full`, `execution: fleet`, with a Wave 1.R quality review | user | The core change is the ownership hook's path resolution, where plan 006's post-implementation review found a MAJOR that its pressure test missed. Consumed by every task. |
| D2 | What counts as outside the repository? | **Outside both textually and after resolution.** A target textually inside the project directory that resolves outside it (a link out of the repo, or resolver disagreement) is DENIED. `outside(r)` is `r === ".."`, or `r` starts with `../`, or `path.isAbsolute(r)`, on the POSIX-separator relative path. | user | Closes the resolver-mismatch escape by construction instead of trusting the fallback never to mix representations. Stricter than today: a junction from an owned directory to a path outside the repo becomes a deny. The existing "outside the repo" case, `ROOT/../elsewhere.txt`, is outside both ways and stays allowed. Consumed by T1.2.1, T2.1.1. |
| D3 | How is the realpath fallback verified without a volume that triggers it? | Move the ancestor walk into `drydock/lib/resolve-target.mjs` with an injectable filesystem, unit-test the fallback by injecting a `native` that throws, and add its test to `verify.yml` | user | Follows the `lib/owns-match.mjs` precedent. The hook is a script that runs on import, so it cannot be unit-tested in place. Consumed by T1.1.1, T1.2.1. |
| D4 | Release? | `0.15.1`, including the correction of 0.15.0's superseded verification sentence and the architecture table row for F10 | user | Unreleased fixes are not loaded by any host. Consumed by T2.1.1. |
| D5 | How does the root get resolved so it and the target never disagree? | Both go through the SAME `realpathWithFallback`: `native`, then JS `realpathSync`, then (for the root only) the lexical path. On a volume where `native` fails uniformly, root and target then both come back in the JS or lexical representation. D2 fails closed if they still disagree. | planner (assumed, flag if wrong) | The subst measurement shows the two resolvers disagree on representation. Using one resolver for both sides is what keeps the relative path meaningful. Consumed by T1.1.1, T1.2.1. |
| D6 | F7: shared walk-up helper, or duplicated? | Duplicated, about eight lines in each hook | planner (assumed, flag if wrong) | Same reasoning as plan 006 D4: a shared helper between the detector (Wave 1.1) and the hook (Wave 1.2) is a contract across tasks. The new `lib` module is the hook's alone. Consumed by T1.1.2, T1.2.1. |
| D7 | Spawn a wave's executors in parallel? | One at a time | planner (assumed, flag if wrong) | Plan 006 lost a full parallel round to one usage-limit cutoff (its Deviation 3, now CLAUDE.md). Sequential spawning keeps each finished task committed. The tasks remain parallel-safe; this is scheduling, not structure. |
| D8 | Attribution? | `manifest` | planner (assumed, flag if wrong) | Default from `format_version: 3`; the repo's subjects follow its own convention. |
| D9 | Who signs the Phase 2 gate? | Sandeep Takasi, by name and date, on the single gate line | planner (assumed, flag if wrong) | `drydock:reconcile` refuses an unsigned human gate. |
| D10 | POSIX `..`: ban `..` segments, or resolve correctly? | Resolve correctly: a relative target is joined to the root WITHOUT textual normalization, so the OS resolves `..` itself | planner (assumed, flag if wrong) | The absolute branch already does exactly this and was measured correct on Linux. Windows normalizes `..` textually in the OS, so the raw join matches its semantics too. A ban would deny legitimate paths for no gain. Consumed by T1.1.1. |
| D11 | Testing Gate? | `N/A` | planner (assumed, flag if wrong) | The only user-facing change is the version string, which `assert-copy.mjs` pins at build time. |
| D12 | How far may the F7 walk-up climb? | To the first ancestor holding `.drydock/wave-owns.json`, but never past the first ancestor holding `.git` | planner, on the pressure pass's finding | An unbounded walk-up adopts a stale armed wave in a parent directory or the home directory and denies every write in an unrelated repository beneath it. `.drydock/` always sits at a repository root, so the root is the natural bound. Consumed by T1.1.2, T1.2.1. |

## Open questions

None. No task is BLOCKED.

## Out of scope / follow-ups

- **CLAUDE.md's "restart needed" note for hooks.** Plan 006 observed the host
  pick up a plugin update's hooks without a restart; whether skills behave the
  same is unmeasured. A reconcile proposal for this plan, not a task.
- **Hard links** (`mklink /H`) resolve to the unowned file and are followed by
  the hook. No document claims coverage; unchanged.
- **Deletions and restores that leave `git status`** still record `observed`
  in the detector (plan 006 review finding 4). Unchanged.
- **The A3 figure** still covers five plans; measuring plans 006 and 007 into
  `docs/a3-gate-compliance.md` is separate, honesty-rule work.
- **`.drydock/bash-tree.json` is never reset between waves.** Unchanged.

## Execution policies

- **Per task:** the acceptance criterion must exit 0, verified by the executor
  and re-run by wavecheck.
- **Per wave:** `drydock:wavecheck` is the blocking gate.
- **Per phase:** Wave 1.R, a fresh-context Judgment-tier review of the Phase 1
  diff after wavecheck PASS on Wave 1.2. APPROVED required for the Phase 1 gate.
- **Escalation:** review rejections get max 2 retries, each as a new wave with
  new task ids, then one model tier up, then a human. Wavecheck BLOCKs on
  ownership or unlogged deviations get no retries.
- **Checkpointing:** one commit per task, owned files only, then `task-close`.
- **Human gate:** Phase 2, named and dated (D9).
- **Tracker mirroring:** none.

## Testing Gate

N/A, the only user-facing surface this plan touches is the version string on the
homepage, which `site/scripts/assert-copy.mjs` already asserts against
`drydock/.claude-plugin/plugin.json` at build time; no interactive behaviour
changes. See D11.

## Pressure-test verdict

**Self-performed, not independent, stated as such.** A fresh-context Opus
reviewer was dispatched twice: the first spawn died on a network error, and the
user interrupted the second. Per the skill's fallback, the pass was done by the
planning session itself, re-opening the files and measuring rather than
re-reading the plan. It therefore carries the author-blindness the independent
review exists to avoid, and Wave 1.R is the plan's independent check on the
design, as it was in plan 006.

**Measured and holding:** under D2's `outside()` test, `path.win32.relative`
gives `Z:/nope/x.ts`, `//server/share/x` and `..` as outside and `docs/x` as
inside, including for a `projectDir` differing in case (`c:\REPO`) or carrying a
trailing slash. A `\\?\C:\repo\docs\x` target reads outside textually but
`realpathSync.native` strips the prefix, so it resolves inside and is matched
against `owns` rather than waved through, which is D2 working as intended. T1.2.1's
regex matches the suite's padded report line. Counts are consistent: enforce-owns
33 today, plus 6 named cases, is 39; the detector's 18, plus 3, is 21. Every
criterion fails at baseline under `prove-failable` (6 of 6).

**Found and fixed:**

1. **Design defect:** the F7 walk-up as first written ("nearest ancestor
   containing `.drydock/wave-owns.json`") could climb out of the repository and
   adopt a parent directory's stale armed wave. Bounded at the repository root
   (D12), with a `walkup-stops-at-git` case required in both hooks' criteria.
2. **Executor-guess gaps**, now filled in the briefs: the hook suite's `run()`
   hard-codes `cwd` and `CLAUDE_PROJECT_DIR`, so the F7 cases need an override; a
   fake `fsImpl` needs `native` as a property of a function; how to create a link
   to outside the temp repo; how to find an unused drive letter.
3. **Format defect caught by `validate-plan --strict`:** T1.R.1's `Files owned`
   sentence parsed as an empty boundary; rewritten as `none (...)`, the form the
   validator accepts. Plan 006's review task passed the same check only because
   its sentence happened to contain a backticked path.

**Verdict: APPROVED for presentation, with the independence caveat above.**

## Phase 0: Pre-flight

#### T0 - Baseline verification and plan index row

- **Description:** Record the commit SHA and the verbatim result of the four
  gate commands into *Baseline*, and add this plan's row to
  `docs/plans/README.md` so `assert-matrix.mjs` passes.
- **Files owned:** `docs/plans/README.md` (the *Baseline* section of this plan
  is also written here, before any wave is armed)
- **Depends on:** none
- **Model / thinking:** Mechanical / off   **Executor:** orchestrator, inline
- **Context brief:** this plan's *Baseline*; `docs/plans/README.md`;
  `site/scripts/assert-matrix.mjs` (the row's status column must equal this
  plan's frontmatter `status:` and moves with it).
- **Acceptance criterion:** `node -e "const fs=require('fs');const p=fs.readFileSync('docs/plans/007-deferred-hardening.md','utf8'),i=fs.readFileSync('docs/plans/README.md','utf8');const m=p.match(/Commit SHA [|] .?([0-9a-f]{7,40})/);process.exit(m&&i.includes('007-deferred-hardening')?0:1)"`

## Phase 1: Repair

**Phase gate:** all four suites (`drydock-audit`, `enforce-owns`, `detect-bash-writes`, `resolve-target`) exit 0 + `node site/scripts/assert-matrix.mjs` exits 0 + Wave 1.R APPROVED. OPEN.

### Wave 1.1 - The resolver module, and the detector

> The two tasks share no file and no interface: the new module is consumed only
> by T1.2.1, in the next wave, against the contract stated in both briefs.

#### T1.1.1 - Move the ancestor walk into a testable module with a realpath fallback

- **Description:** Create `drydock/lib/resolve-target.mjs` holding the path
  resolution the ownership hook performs, with an injectable filesystem, a JS
  `realpathSync` fallback when `realpathSync.native` throws, and a relative
  target joined to the root without textual normalization. Add its own test
  file and a `verify.yml` line so CI runs it. The hook is NOT changed here.
- **Files owned:** `drydock/lib/resolve-target.mjs`,
  `drydock/lib/resolve-target.test.mjs`, `.github/workflows/verify.yml`
- **Depends on:** none
- **Model / thinking:** Complex / extended (Sonnet)   **Executor:** drydock:executor
- **Context brief:** D3, D5 and D10 in this plan, and the findings "Resolver
  disagreement", "realpath.native over-deny" and "POSIX `..`"; the current
  `resolveAncestry` and `realOr` in `drydock/hooks/enforce-owns.mjs` (lines
  ~195-257), whose behaviour this module must reproduce exactly plus the three
  changes below; `drydock/lib/owns-match.mjs` for house style;
  `.github/workflows/verify.yml` lines 58-60. Runtime floor Node 20.17.
- **Contract (complete, and restated verbatim in T1.2.1's brief):**
  - `export function realpathWithFallback(p, fsImpl = fs)`: returns
    `fsImpl.realpathSync.native(p)`; if that throws, returns
    `fsImpl.realpathSync(p)`; if that also throws, rethrows the JS error.
  - `export function resolveTarget(root, target, fsImpl = fs)`: builds
    `absolute` as `target` when `path.isAbsolute(target)`, otherwise as
    `root + path.sep + target` with NO normalization (never `path.resolve` or
    `path.join` on the raw target). Then walks from `absolute` itself upward:
    at each `current`, try `realpathWithFallback(current, fsImpl)`; on success
    return it with the skipped trailing segments re-joined (`path.join`); on
    failure call `fsImpl.lstatSync(current)`: if it succeeds, throw
    `new Error("exists but does not resolve: " + current)`; if it fails with
    `ENOENT` or `ENOTDIR`, climb (`path.dirname`), prepending the basename to
    the skipped list; any other `lstat` error is rethrown. Stop when
    `path.dirname(current) === current` and return `current` joined with the
    skipped segments. Returns an absolute string; never returns a relative path.
  - Nothing else is exported. No `process.exit`, no stdin, no logging.
- **Forbidden:** editing `drydock/hooks/enforce-owns.mjs` or any other hook;
  editing `lib/owns-match.mjs`; any dependency; any Node 21+ API; changing any
  other `verify.yml` line.
- **Implementation sketch:** the test file is a plain script like the other
  suites (no framework), printing `resolve-target: PASS, <n> cases` or
  `resolve-target: FAIL, <k> of <n> case(s)` and exiting non-zero on failure.
  Inject a fake `fsImpl` object to cover: `fallback-native-throws` (native
  throws, JS returns a path, result is the JS path); `both-throw-lstat-ok` named
  `dangling-denied` (throws "exists but does not resolve"); `absent-climbs`
  (ENOENT at the leaf, resolved ancestor plus skipped segments);
  `relative-dotdot-unnormalised` (the fake records the first string passed to
  realpath and asserts it still contains the `..` segment); `root-fixed-point`
  (nothing exists, terminates and returns the joined path); `other-lstat-error`
  (rethrown). Also one real-filesystem case in the OS temp directory proving
  the default `fs` path works. A fake `fsImpl` needs `native` as a property of a
  function, because the real API is `fs.realpathSync.native`:
  `{ realpathSync: Object.assign((p) => ..., { native: (p) => ... }), lstatSync: (p) => ... }`,
  with thrown errors carrying a `code` property (`Object.assign(new Error("x"), { code: "ENOENT" })`).
  Add `      - run: node drydock/lib/resolve-target.test.mjs`
  after the `detect-bash-writes` line in `verify.yml`.
- **Acceptance criterion:** `node -e "const{execFileSync:e}=require('child_process');const fs=require('fs');let o='';try{o=e(process.execPath,['drydock/lib/resolve-target.test.mjs'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch(x){process.exit(1)}const m=o.match(/resolve-target: PASS, ([0-9]+) cases/);const s=fs.readFileSync('drydock/lib/resolve-target.test.mjs','utf8');const w=fs.readFileSync('.github/workflows/verify.yml','utf8');process.exit(m&&+m[1]>=7&&['fallback-native-throws','dangling-denied','absent-climbs','relative-dotdot-unnormalised','root-fixed-point','other-lstat-error'].every(t=>s.includes(t))&&w.includes('node drydock/lib/resolve-target.test.mjs')?0:1)"`

#### T1.1.2 - Report a working-tree rename whole, and find the wave from a subdirectory

- **Description:** Widen the detector's rename test to either status column, so
  a working-tree rename (` R`) consumes its old path as a bare record instead of
  slicing it. When `CLAUDE_PROJECT_DIR` is unset, find the project directory by
  walking up from the working directory, never past the repository root, to the
  nearest ancestor containing `.drydock/wave-owns.json`.
- **Files owned:** `drydock/hooks/detect-bash-writes.mjs`,
  `drydock/hooks/detect-bash-writes.test.mjs`
- **Depends on:** none
- **Model / thinking:** Standard / default   **Executor:** drydock:executor
- **Context brief:** D6 and the findings "F7" and "Working-tree rename" in this
  plan; `drydock/hooks/detect-bash-writes.mjs` lines ~81 (`projectDir`) and
  ~150-160 (the rename branch); the existing `f2-rename-path` case in the test
  file. Measured: after `mv site/a.ts docs/a.ts && git add -N docs/a.ts`,
  `git status --porcelain -z` prints ` R docs/a.ts\0site/a.ts\0`. Runtime floor
  Node 20.17; the suite must not shell out to `/bin/sh`.
- **Forbidden:** any non-zero exit; removing the `observed` receipt; scanning
  gitignored files; reading `tool_input.command` to decide what changed; any
  dependency; changing the snapshot format.
- **Implementation sketch:** the rename condition becomes "`status[0]` or
  `status[1]` is `R` or `C`". **The walk-up (D12, identical in T1.2.1):** start
  at `input.cwd ?? process.cwd()`; at each directory, if it contains
  `.drydock/wave-owns.json`, that is the project directory; otherwise, if it
  contains `.git` (a directory or a file, since worktrees use a file), stop
  there without adopting anything above it; otherwise ascend with
  `path.dirname`, stopping at the filesystem root (`parent === current`). If no
  armed config is found, keep the starting directory, so behaviour with no armed
  wave is unchanged. `CLAUDE_PROJECT_DIR`, when set, still wins. New cases named
  exactly `worktree-rename`, `f7-cwd-subdir`, and `walkup-stops-at-git` (a temp
  parent directory holding an armed `.drydock/wave-owns.json` with a git repo
  inside it that has none: a Bash write inside the child repo must NOT be judged
  against the parent's config).
- **Acceptance criterion:** `node -e "const{execFileSync:e}=require('child_process');const fs=require('fs');let o='';try{o=e(process.execPath,['drydock/hooks/detect-bash-writes.test.mjs'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch(x){process.exit(1)}const m=o.match(/detect-bash-writes: PASS, ([0-9]+) cases/);const s=fs.readFileSync('drydock/hooks/detect-bash-writes.test.mjs','utf8');process.exit(m&&+m[1]>=21&&['worktree-rename','f7-cwd-subdir','walkup-stops-at-git'].every(t=>s.includes(t))?0:1)"`

### Wave 1.2 - Rewire the ownership hook

#### T1.2.1 - Use the resolver, decide "outside" both ways, receipt every deny, find the wave from a subdirectory

- **Description:** Replace the hook's inline resolution with
  `resolveTarget`/`realpathWithFallback` from `drydock/lib/resolve-target.mjs`,
  and allow a write as outside the repository only when it is outside both
  textually and after resolution. Record a `deny` receipt before every deny,
  including those raised by a thrown check. When `CLAUDE_PROJECT_DIR` is unset,
  find the project directory by walking up from the working directory.
- **Files owned:** `drydock/hooks/enforce-owns.mjs`,
  `drydock/hooks/enforce-owns.test.mjs`
- **Depends on:** T1.1.1
- **Model / thinking:** Complex / extended (Sonnet)   **Executor:** drydock:executor
- **Context brief:** D2, D5, D6 and the findings "F7", "F10", "Resolver
  disagreement" and "Receipt-less thrown denies" in this plan;
  `drydock/hooks/enforce-owns.mjs` in full; `drydock/lib/resolve-target.mjs`
  (read-only, from T1.1.1); `drydock/hooks/enforce-owns.test.mjs`. **The
  module's contract, verbatim:** `realpathWithFallback(p, fsImpl = fs)` returns
  `fsImpl.realpathSync.native(p)`, else `fsImpl.realpathSync(p)`, else rethrows
  the JS error. `resolveTarget(root, target, fsImpl = fs)` builds `absolute` as
  `target` when absolute, otherwise `root + path.sep + target` unnormalized;
  walks upward from `absolute`, returning the first resolvable ancestor with the
  skipped segments re-joined; throws `exists but does not resolve: <path>` when
  `realpath` fails but `lstat` succeeds; climbs only on `lstat` `ENOENT` or
  `ENOTDIR`; rethrows any other `lstat` error; terminates at the filesystem root.
  Runtime floor Node 20.17.
- **Forbidden:** editing `lib/resolve-target.mjs` or `lib/owns-match.mjs` (a
  defect found in the module is a deviation to report, not to patch here);
  changing exit codes (ALLOW 0, DENY 2) or the receipt JSON fields; failing
  closed on a MISSING config (the documented escape hatch); any dependency;
  weakening or deleting any existing case; recording a receipt for an ALLOW of a
  path outside the repo (today's behaviour, unchanged).
- **Implementation sketch:** `projectDir` = `CLAUDE_PROJECT_DIR`, else **the
  walk-up (D12, identical in T1.1.2):** start at `input.cwd ?? process.cwd()`;
  at each directory, if it contains `.drydock/wave-owns.json`, that is the
  project directory; otherwise, if it contains `.git` (a directory or a file),
  stop there without adopting anything above it; otherwise ascend with
  `path.dirname`, stopping at the filesystem root (`parent === current`); if no
  armed config is found, keep the starting directory. `root` = `realpathWithFallback(projectDir)`, or
  `projectDir` if it throws. `resolved` = `resolveTarget(root, target)`.
  `rel` = `path.relative(root, resolved)` with `/` separators; `lexRel` =
  `path.relative(projectDir, path.resolve(projectDir, target))` with `/`
  separators. `outside(r)` = `r === ".."` or `r.startsWith("../")` or
  `path.isAbsolute(r)`. If `outside(lexRel) && outside(rel)`: allow, as today.
  If `outside(rel)` but not `outside(lexRel)`: record and deny with a message
  saying the path is inside the repository but resolves outside it. Otherwise
  match `owns` exactly as today. In the outer `catch`, call `record("deny",
  <lexRel if computed, else the raw target>)` before `deny()`; `record` already
  swallows its own errors. Update the file's docblock CEILINGS to match. New
  cases named exactly `f10-cross-drive` (Windows: `Z:/nope/x.ts` and a
  non-existent drive letter must exit 0; on other platforms report a skip line),
  `link-out-of-repo-denied` (a junction or symlink inside `docs/` pointing to a
  directory outside the repo; a write beneath it exits 2),
  `throw-deny-receipt` (a dangling-link deny appends a `deny` entry to
  `enforcement.log`), `f7-cwd-subdir` (`CLAUDE_PROJECT_DIR` unset, `cwd` a
  subdirectory, an unowned write exits 2), and `posix-relative-dotdot`
  (non-Windows: `docs/esc/../site/x.ts` with `docs/esc -> ../site` exits 2; on
  Windows report a skip line), and `walkup-stops-at-git` (as in T1.1.2: an armed
  config in a parent directory must not be adopted by a git repo beneath it).
  Verify the POSIX case locally with `docker run node:20-slim` as well as
  reading it. **Harness notes, measured in the current suite:** the `run()`
  helper at `enforce-owns.test.mjs:84-91` hard-codes `cwd: ROOT` in the input and
  `CLAUDE_PROJECT_DIR: ROOT` in the env, so the F7 and walk-up cases need an
  option to override `cwd` and to delete the variable from a copy of
  `process.env`. For a link to OUTSIDE the repo, create a sibling directory with
  `mkdtempSync(join(tmpdir(), "drydock-outside-"))` and point a junction (Windows,
  `cmd /c mklink /J`) or symlink (elsewhere) inside `docs/` at it. For a
  non-existent drive letter, scan `Z` down to `D` for the first letter whose
  `existsSync(letter + ":\\")` is false.
- **Acceptance criterion:** `node -e "const{execFileSync:e}=require('child_process');const fs=require('fs');let o='';try{o=e(process.execPath,['drydock/hooks/enforce-owns.test.mjs'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch(x){process.exit(1)}const m=o.match(/enforce-owns: PASS, ([0-9]+) cases/);const s=fs.readFileSync('drydock/hooks/enforce-owns.test.mjs','utf8');const h=fs.readFileSync('drydock/hooks/enforce-owns.mjs','utf8');process.exit(m&&+m[1]>=39&&/ok +f10-cross-drive +exit=0 want=0/.test(o)&&['link-out-of-repo-denied','throw-deny-receipt','f7-cwd-subdir','posix-relative-dotdot','walkup-stops-at-git'].every(t=>s.includes(t))&&h.includes('resolve-target.mjs')?0:1)"`

  > On this Windows box the criterion requires the F10 case to have actually run
  > and allowed (`exit=0 want=0`); the POSIX case runs in CI's ubuntu jobs and in
  > the executor's Docker check.

### Wave 1.R - Quality review

#### T1.R.1 - Fresh-context quality review of Phase 1

- **Description:** Review the Phase 1 diff for correctness and edge cases after
  wavecheck. In particular: whether the new outside-the-repo rule opens or
  closes anything (subst drives, junctions to outside, UNC, `..`), whether the
  fallback can reintroduce the dangling-link hole, whether any ordinary write is
  now denied, and whether the walk-up can pick the wrong `.drydock/`.
- **Files owned:** none (review only; the verdict is appended by the
  orchestrator after the wave is disarmed)
- **Depends on:** T1.1.2, T1.2.1
- **Model / thinking:** Judgment / extended (Opus)   **Executor:** drydock:executor
- **Context brief:** the Phase 1 diff; this plan's *Findings & constraints* and
  Decision Log; plan 006's two Wave 1.R verdicts as prior art. Docker
  `node:20-slim` is available for POSIX measurement.
- **Acceptance criterion:** `node -e "const s=require('fs').readFileSync('docs/plans/007-deferred-hardening.md','utf8');process.exit(/Wave 1.R verdict, APPROVED, 20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]/.test(s)?0:1)"`

## Phase 2: Release

**Phase gate:** `npm run verify` in `site/` exits 0 + human approval (D9). OPEN.

### Wave 2.1 - Cut 0.15.1

#### T2.1.1 - Bump to 0.15.1, write the release note, correct the gate table

- **Description:** Set the version to `0.15.1` in the four hand-copied places
  and write the CHANGELOG entry for each item this plan closed, including that
  the 0.15.0 entry's "no host session has loaded the repaired code" sentence was
  superseded by the live verification recorded in plan 006. Update the
  ownership hook's row in the architecture gate table for D2 and F10.
- **Files owned:** `drydock/.claude-plugin/plugin.json`,
  `drydock/CHANGELOG.md`, `README.md`, `site/content/copy.ts`,
  `docs/architecture.md`
- **Depends on:** T1.R.1
- **Model / thinking:** Standard / default   **Executor:** drydock:executor
- **Context brief:** D2, D4 and every finding in this plan; the Phase 1 diff;
  plan 006's progress-log row "D6 follow-up"; the 0.15.0 CHANGELOG entry as
  house style; `site/scripts/assert-copy.mjs` (~211-250); the `enforce-owns.mjs`
  row of the gate table in `docs/architecture.md`. `README.md` is the
  REPOSITORY ROOT readme. **Pinned wording for the gate-table row:** it must no
  longer say a path on a different drive is denied; it must say that a path
  outside the project directory is not enforced only when it is outside both
  textually and after resolution, and that a path inside the repository that
  resolves outside it is denied. Keep the Bash and hard-link blind spots.
- **Forbidden:** editing any file under `drydock/hooks/`, `drydock/lib/`,
  `drydock/scripts/` or `drydock/skills/`; rewriting any older CHANGELOG entry,
  including 0.15.0; claiming a live host verification of the 0.15.1 hooks,
  which happens after install; adding an em dash or a spaced double hyphen.
- **Acceptance criterion:** `node -e "const fs=require('fs'),v='0.15.1';const p=JSON.parse(fs.readFileSync('drydock/.claude-plugin/plugin.json','utf8')).version,c=fs.readFileSync('site/content/copy.ts','utf8'),g=fs.readFileSync('drydock/CHANGELOG.md','utf8'),r=fs.readFileSync('README.md','utf8'),a=fs.readFileSync('docs/architecture.md','utf8');const i=g.indexOf('## '+v),j=g.indexOf('## 0.15.0');const s=g.slice(i,j);process.exit(p===v&&c.includes(JSON.stringify(v))&&r.includes('v'+v)&&i>=0&&j>i&&s.includes('superseded')&&!a.includes('denied, not ignored')?0:1)"`

## Deviation Log

| # | Task | What deviated | Why | Impact | Recorded |
|---|---|---|---|---|---|

## Wavecheck reports

## Progress log

| Date | Task | Result | Notes |
|---|---|---|---|

## Reconcile report
