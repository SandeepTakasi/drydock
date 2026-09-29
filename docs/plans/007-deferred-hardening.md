---
plan: 007-deferred-hardening
format_version: 3
status: EXECUTING
isolation: none
enforcement: required
attribution: manifest
lane: full
execution: fleet
created: 2026-09-21
approved_by: Sandeep Takasi
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

Recorded by T0 on 2026-09-29, before any wave was armed.

| | |
|---|---|
| Commit SHA | `157e70a7b86fb671bf646e6707c9ebb1f31d187a` |
| `node drydock/scripts/drydock-audit.test.mjs` | **GREEN.** `139/139 passed` |
| `node drydock/hooks/enforce-owns.test.mjs` | **GREEN.** `enforce-owns: PASS, 33 cases` |
| `node drydock/hooks/detect-bash-writes.test.mjs` | **GREEN.** `detect-bash-writes: PASS, 18 cases` |
| `node site/scripts/assert-matrix.mjs` | **RED until T0's own row landed:** no index row for this plan. Green after T0. |

No pre-existing failure is excluded from any acceptance criterion: the three
suites are green at baseline, so every criterion below gates only this plan's
work.

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
| D13 | How is the Wave 1.R rejection repaired? | A new **Wave 1.3** with new task ids, then a re-review. The two-vote rule keeps its shape; an absolute `rel` is corroborated by filesystem identity (`dev`+`ino`) before it may allow. | planner, on the review's verdict | Retry 1 of the escalation policy's 2, in a new wave because waves 1.1 and 1.2 are sealed and a second `task-close` under a sealed id makes attribution ambiguous (CLAUDE.md). Identity is the discriminator the reviewer measured: the repo root has the same `dev`+`ino` through every namespace, and a genuinely different directory does not. Consumed by T1.3.1, T1.3.2. |
| D14 | How is the second Wave 1.R rejection repaired? | A **Wave 1.4** with one task, following the same pattern. This is **retry 2 of the escalation policy's 2**: a third rejection escalates a tier or goes to the human, it does not open a Wave 1.5. | planner, on the re-review's verdict | The finding is in the fix wave's test file, not the product code, and its fix is the capability-probe convention the suite already uses for links (`tryDirLink`). Consumed by T1.4.1. |
| D15 | The approving review still raised a MINOR that reopens the Wave 1.3 hole on a file-id-less filesystem. Fold it in, or leave it as a follow-up? | Fold it in, as a one-task **Wave 1.5**. Not a retry: the review APPROVED, and this is a documentation ceiling plus a test assertion, not a behaviour change. | planner (assumed, flag if wrong) | The guard is correct (removing it false-denies a legitimate owned UNC write, which the reviewer measured), so the defect is that the docblock does not say the vote stands silently when the root has no file id. A hook whose docblock omits a silent-allow route is exactly the F6/F8 class this plan exists to close, and leaving it to reconcile would ship 0.15.1 with the omission. Consumed by T1.5.1. |

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

### Wave 1.3 - Fixes for the Wave 1.R rejection

> Added after approval (Deviation 1, D13). Retry 1 of the escalation policy's 2.
> The two tasks own disjoint files.

#### T1.3.1 - Corroborate an absolute relative path with filesystem identity

- **Description:** Before the hook allows a write as outside the repository, require more than "the relative path came back absolute". Walk the resolved target's existing ancestors comparing `dev` and `ino` against the project root; if any ancestor IS the root, the target is inside the repository under a different namespace and must be matched against `owns` instead of allowed. Tighten two claims the same diff made: the docblock says every deny records a receipt, and the thrown-deny receipt can carry a non-string path.
- **Files owned:** `drydock/hooks/enforce-owns.mjs`, `drydock/hooks/enforce-owns.test.mjs`
- **Depends on:** T1.2.1
- **Model / thinking:** Complex / extended (Sonnet)   **Executor:** drydock:executor
- **Context brief:** D2, D13 and the Wave 1.R verdict below (finding 1, and MINOR 1, MINOR 2, NIT 4); the `outside`/`lexRel`/`rel` block in `drydock/hooks/enforce-owns.mjs`; `drydock/hooks/enforce-owns.test.mjs`. `drydock/lib/resolve-target.mjs` is READ-ONLY. **Measured by the reviewer and re-measured by the orchestrator:** with `CLAUDE_PROJECT_DIR` set to a plain `C:\...` repo, a target addressed as `\\localhost\c$\...\repo\site\x.ts` (unowned) exits 0 under the current hook and exits 2 under the pre-phase hook, the write lands in the repo, and no receipt is written. `\\?\C:\`, `\\.\C:\` and `subst` drives are NOT affected, because `realpathSync.native` collapses them onto `C:`; a UNC path it returns unchanged. The reviewer measured `dev`+`ino` identical for the repo root across plain, UNC, extended-length and subst forms, and different for any other directory.
- **Forbidden:** editing `lib/resolve-target.mjs` or `lib/owns-match.mjs`; changing exit codes or receipt field names; failing closed on a MISSING config; any dependency; weakening or deleting any existing case; making an ordinary outside-the-repo write (a genuinely different directory, or a nonexistent drive) deny.
- **Implementation sketch:** keep `outside(lexRel) && outside(rel)` as the gate, but when `path.isAbsolute(rel)`, corroborate before allowing: take `identity(p)` as `statSync(p, { bigint: true })` rendered `dev + ":" + ino`, or `null` when it throws. With `rootId = identity(root)`, walk from `resolved` upward, collecting skipped basenames; if an ancestor's identity equals `rootId` (both non-null), the target is INSIDE: set `rel` to the skipped segments joined with `/` and continue to the `owns` match. Stop at the filesystem root. If no ancestor matches, the path is genuinely outside and allows as today, so `Z:/nope/x.ts` (whose `stat` throws) still allows. Then: record a `{decision:"deny", path:null}` receipt for the unusable-config deny, or soften the docblock sentence to say which deny paths record (state which you chose and why); and coerce the thrown-deny receipt's path with `String(target)`. New cases named exactly `unc-repo-denied` (a UNC form of the repo's own path, unowned, exits 2, and a receipt is written) and `unc-repo-owned-allowed` (the same form, owned path, exits 0). Also make the existing `link-out-of-repo-denied` case assert the DENY MESSAGE, not only the exit code: the reviewer mutated its branch to `if (false)` and the suite still passed, because the fall-through denies for a different reason.
- **Acceptance criterion:** `node -e "const{execFileSync:e}=require('child_process');const fs=require('fs');let o='';try{o=e(process.execPath,['drydock/hooks/enforce-owns.test.mjs'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch(x){process.exit(1)}const m=o.match(/enforce-owns: PASS, ([0-9]+) cases/);const s=fs.readFileSync('drydock/hooks/enforce-owns.test.mjs','utf8');process.exit(m&&+m[1]>=41&&/ok +unc-repo-denied +exit=2 want=2/.test(o)&&s.includes('unc-repo-owned-allowed')&&s.includes('resolves outside it')?0:1)"`

#### T1.3.2 - Stop the resolver suite passing a case it never ran

- **Description:** In `resolve-target.test.mjs`, the real-filesystem symlink case wraps both fixture creation and the assertion in one `try`, so a resolver regression is reported as a skip. Narrow the `try` to link creation only, so a broken resolver fails rather than skips.
- **Files owned:** `drydock/lib/resolve-target.test.mjs`
- **Depends on:** T1.1.1
- **Model / thinking:** Standard / default   **Executor:** drydock:executor
- **Context brief:** the Wave 1.R verdict below (MINOR 3) and its evidence: with a mutant making `resolveTarget` throw on the real filesystem, the case printed `ok ... skipped: MUTANT: real-fs path broken` instead of failing. `drydock/lib/resolve-target.mjs` is READ-ONLY.
- **Forbidden:** editing `drydock/lib/resolve-target.mjs` or any hook; removing any case; making the suite fail on a box that cannot create symlinks (it must still SKIP for that reason alone).
- **Implementation sketch:** create the symlink inside its own `try/catch`; on failure report the skip and return. Outside that `try`, call `resolveTarget` and assert, so any throw from the resolver is a FAIL. Prove it by temporarily making the resolver throw and watching the case FAIL rather than skip, then revert. Add a comment naming the token `skip-only-on-link-failure` so the criterion can see the intent.
- **Acceptance criterion:** `node -e "const{execFileSync:e}=require('child_process');const fs=require('fs');let o='';try{o=e(process.execPath,['drydock/lib/resolve-target.test.mjs'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch(x){process.exit(1)}const m=o.match(/resolve-target: PASS, ([0-9]+) cases/);const s=fs.readFileSync('drydock/lib/resolve-target.test.mjs','utf8');process.exit(m&&+m[1]>=8&&s.includes('skip-only-on-link-failure')?0:1)"`

### Wave 1.4 - Fixes for the second Wave 1.R rejection

> Added after approval (Deviation 3, D14). Retry 2 of the escalation policy's 2.

#### T1.4.1 - Skip the UNC cases when the admin share is unreachable, and finish two claims

- **Description:** Probe once whether `\\localhost\c$` is actually reachable, and route the UNC cases to a recorded skip when it is not, exactly as `tryDirLink` already does for links. Then close the two loose claims the re-review measured: the docblock still says every ALLOW records a receipt, which is false for the outside-the-repo allow, and the `String(target)` coercion on the thrown-deny receipt is untested.
- **Files owned:** `drydock/hooks/enforce-owns.mjs`, `drydock/hooks/enforce-owns.test.mjs`
- **Depends on:** T1.3.1
- **Model / thinking:** Standard / default   **Executor:** drydock:executor
- **Context brief:** D14 and the second `## Wave 1.R verdict` below (finding 1, MINOR 2, MINOR 3, NIT 4); the UNC guard in `drydock/hooks/enforce-owns.test.mjs` (around the `unc-repo-denied` and `unc-repo-owned-allowed` cases), which today tests only `process.platform` and the drive letter; `tryDirLink` in the same file, which is the convention to copy; the docblock at the top of `drydock/hooks/enforce-owns.mjs`. `drydock/lib/` is READ-ONLY.
- **Forbidden:** editing anything under `drydock/lib/`; changing exit codes or receipt field names; weakening or deleting any existing case; making the UNC cases skip on a box where the share IS reachable (they must still run here, and the wave gate greps for them running); any dependency.
- **Implementation sketch:** add a one-time capability probe beside the platform test, e.g. `const UNC_OK = process.platform === "win32" && /^[Cc]:/.test(ROOT) && (() => { try { statSync("\\\\localhost\\c$" + ROOT.slice(2)); return true; } catch { return false; } })();` and send the `else` branch to `report(..., true, "SKIPPED: \\\\localhost\\c$ not reachable on this box")`, one skip line per case so a skip never stands in for two. Verify BOTH directions: the cases still run here, and pointing the probe at an unreachable share (e.g. `\\localhost\zz$`) in a scratch copy yields skips rather than `FAIL`. Then: correct the docblock's ALLOW clause to name the allows that record nothing (the outside-the-repo allow, and the pre-config allows), so the sentence matches the measured matrix; add to CEILINGS that a junction escape addressed through a UNC form of the repo is allowed silently, because both votes come back absolute and the escape branch cannot fire (measured: plain `docs/out/x.ts` denies, `\\localhost\c$\...\docs\out\x.ts` allows with no receipt); and add a case named exactly `throw-deny-receipt-string-path` that feeds a non-string `file_path` (e.g. `42`) and asserts the resulting receipt's `path` is a string. Also guard `identity` against a filesystem with no file ids: treat `ino === 0n` as `null`, so a `{0,0}` root cannot match an unrelated `{0,0}` ancestor.
- **Acceptance criterion:** `node -e "const{execFileSync:e}=require('child_process');const fs=require('fs');let o='';try{o=e(process.execPath,['drydock/hooks/enforce-owns.test.mjs'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch(x){process.exit(1)}const m=o.match(/enforce-owns: PASS, ([0-9]+) cases/);const s=fs.readFileSync('drydock/hooks/enforce-owns.test.mjs','utf8');const h=fs.readFileSync('drydock/hooks/enforce-owns.mjs','utf8');process.exit(m&&+m[1]>=42&&/ok +unc-repo-denied +exit=2 want=2/.test(o)&&s.includes('throw-deny-receipt-string-path')&&s.includes('not reachable on this box')&&h.includes('leave nothing')?0:1)"`

  > Still requires `unc-repo-denied` to RUN and deny on this box, so the skip
  > path cannot be used to dodge the case here.

### Wave 1.5 - The ceiling the approving review asked for

> Added after an APPROVED Wave 1.R verdict (D15), not as a retry. One task.

#### T1.5.1 - State the file-id ceiling, and assert the UNC deny is the ownership branch

- **Description:** Document, in the hook's CEILINGS, that identity corroboration is switched off wholesale when the project root reports no file id, so on such a filesystem a write addressed through a UNC form of the repo is allowed silently, exactly as before Wave 1.3. Then tighten `unc-repo-denied` to assert the deny came from the ownership branch rather than from any thrown deny.
- **Files owned:** `drydock/hooks/enforce-owns.mjs`, `drydock/hooks/enforce-owns.test.mjs`
- **Depends on:** T1.4.1
- **Model / thinking:** Mechanical / off   **Executor:** drydock:executor
- **Context brief:** D15 and the third `## Wave 1.R verdict` below (MINOR 1, NIT 2, NIT 3); the `identity` function and its `ino === 0n` guard in `drydock/hooks/enforce-owns.mjs`, the FILESYSTEM IDENTITY paragraph and the CEILINGS list in its docblock; the `unc-repo-denied` case in the test file. **Measured by the reviewer, by injecting a zero inode:** with the guard, an unowned UNC write returns exit 0 with no receipt; with the guard removed, the same filesystem false-DENIES a legitimate owned UNC write. The guard stays; only the documentation and the assertion change.
- **Forbidden:** changing any behaviour, including removing or altering the `ino === 0n` guard; editing anything under `drydock/lib/`; changing exit codes or receipt field names; weakening or deleting any case; adding a dependency.
- **Implementation sketch:** add one CEILINGS bullet, beside the existing UNC-addressed-junction one, saying that a project root whose `stat` reports no file id (`ino === 0`, e.g. some FAT or exFAT and some network filesystems) disables corroboration, so a UNC form of the repo is allowed silently there, and that the guard exists because the alternative false-denies ordinary owned writes on such a volume. The bullet must contain the literal `without file ids`. In the test, make `unc-repo-denied` also assert the deny message names the ownership branch (the `does not own` wording), so a thrown deny cannot satisfy it; mark that assertion with the literal token `unc-deny-message`.
- **Acceptance criterion:** `node -e "const{execFileSync:e}=require('child_process');const fs=require('fs');let o='';try{o=e(process.execPath,['drydock/hooks/enforce-owns.test.mjs'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch(x){process.exit(1)}const m=o.match(/enforce-owns: PASS, ([0-9]+) cases/);const s=fs.readFileSync('drydock/hooks/enforce-owns.test.mjs','utf8');const h=fs.readFileSync('drydock/hooks/enforce-owns.mjs','utf8');process.exit(m&&+m[1]>=42&&/ok +unc-repo-denied +exit=2 want=2/.test(o)&&s.includes('unc-deny-message')&&h.includes('without file ids')?0:1)"`

### Wave 1.R - Quality review

#### T1.R.1 - Fresh-context quality review of Phase 1

- **Description:** Review the Phase 1 diff for correctness and edge cases after
  wavecheck. In particular: whether the new outside-the-repo rule opens or
  closes anything (subst drives, junctions to outside, UNC, `..`), whether the
  fallback can reintroduce the dangling-link hole, whether any ordinary write is
  now denied, and whether the walk-up can pick the wrong `.drydock/`.
- **Files owned:** none (review only; the verdict is appended by the
  orchestrator after the wave is disarmed)
- **Depends on:** T1.1.2, T1.2.1, T1.3.1, T1.3.2, T1.4.1, T1.5.1
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
| 1 | Phase 1 structure | Wave 1.3 (T1.3.1, T1.3.2) added after approval, and T1.R.1 now also depends on it. | The Wave 1.R quality review REJECTED Phase 1 on a confirmed MAJOR regression: a write addressed through a UNC form of the repo's own path is allowed and unlogged, where the pre-phase hook denied it. | Scope grows by two tasks; no sealed wave, task id or report changes. The contract's "targeted fix task appended" remedy needs no `/drydock:replan`; plans 004 and 006 did the same. | orchestrator, 2026-09-29 |
| 2 | T1.2.1 | The executor reported the six new cases as failing pre-fix "by construction" rather than by running them. | Its own summary said so plainly. | None on the verdict: the auditor ran the new suite against the pre-change hook and measured `FAIL, 4 of 39`, with the other two explained (a regression guard, and a POSIX-only case). Recorded because a claim of evidence is not evidence. | wavecheck 1.2, 2026-09-29 |
| 3 | Phase 1 structure | Wave 1.4 (T1.4.1) added, and T1.R.1 now also depends on it. | The Wave 1.R re-review REJECTED again, on a MAJOR in Wave 1.3's own test file: the UNC cases assume `\\localhost\c$` is reachable, so on a box where it is not the suite hard-FAILS, and `unc-repo-denied` passes for the wrong reason while the fix it gates is unexercised. | Retry 2 of 2. A third rejection escalates rather than adding a wave (D14). | orchestrator, 2026-09-29 |

## Wavecheck reports

### Wavecheck 1.1, PASS, 2026-09-29

Execution is `fleet`: both tasks ran as spawned `drydock:executor` subagents, one at a time (D7), and this audit was performed by the orchestrating session, which wrote neither diff.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `format_version: 3`, `status: EXECUTING` before the wave was armed, wave 1.1 exists, no prior wave (T0 is Phase 0, unwaved). |
| 2. Ownership | PASS | `audit-wave 1.1: PASS (2 task(s), 2 commit(s), attribution: manifest)`, table below. Working tree clean. |
| 2b. Enforcement ran | PASS | `enforcement active: 9 hook decision(s) recorded for wave 1.1 (0 denied)`. Bash layer: 23 commands, 0 writes outside `owns`. The enforcing hook is the installed 0.15.0 copy, which is the code this plan is changing; the repaired copies are exercised by their suites and by the auditor's own reproductions below. |
| 3. Forbidden | PASS | T1.1.1 added exactly one line to `verify.yml` and touched no hook: `git diff` over `enforce-owns.mjs` and `lib/owns-match.mjs` for this range is empty. The module imports only `node:fs` and `node:path`, exports only the two contracted functions, and contains no `process.exit`. T1.1.2 added no non-zero exit, no `tool_input.command` read, no ignored-file scan and no snapshot-format change. |
| 4. Acceptance | PASS | Both criteria re-run by the auditor: T1.1.1 exit 0 (`resolve-target: PASS, 8 cases`, and the executor also ran it under `docker run node:20-slim`), T1.1.2 exit 0 (`detect-bash-writes: PASS, 21 cases`). Independently, the auditor re-ran its own exploration reproductions against the new detector: a ` R` worktree rename now records `"path":"site/a.ts"` where it recorded `"path":"e/a.ts"` at baseline, and with `CLAUDE_PROJECT_DIR` removed from the environment and `cwd` set to `docs/sub`, the walk-up found the armed config and wrote a receipt. |
| 5. Deviations | PASS | Executors reported none; none discovered. |

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.1.1 | `a79c285` | `.github/workflows/verify.yml`<br>`drydock/lib/resolve-target.mjs`<br>`drydock/lib/resolve-target.test.mjs` | `drydock/lib/resolve-target.mjs`<br>`drydock/lib/resolve-target.test.mjs`<br>`.github/workflows/verify.yml` | none |
| T1.1.2 | `2c37b36` | `drydock/hooks/detect-bash-writes.mjs`<br>`drydock/hooks/detect-bash-writes.test.mjs` | `drydock/hooks/detect-bash-writes.mjs`<br>`drydock/hooks/detect-bash-writes.test.mjs` | none |

**Stated rather than implied:** T1.1.2's `walkup-stops-at-git` case passes both before and after its fix, because the pre-fix code had no walk-up at all and so could not adopt a parent's config either. Its executor said so unprompted. It is a guard against regression, not a reproduction of a defect, and the wave's other two new cases were watched failing first.

Deviations logged: 0 (0 discovered by wavecheck)


### Wavecheck 1.2, PASS, 2026-09-29

Execution is `fleet`; audited by the orchestrating session, which wrote none of this diff.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `status: EXECUTING`; wave 1.2 exists; wave 1.1 has a PASS report. Staleness: the two owned files were unchanged between the baseline `157e70a` and this wave. |
| 2. Ownership | PASS | `audit-wave 1.2: PASS (1 task(s), 1 commit(s), attribution: manifest)`, table below. Working tree clean. |
| 2b. Enforcement ran | PASS | `enforcement active: 5 hook decision(s) recorded for wave 1.2 (0 denied)`. Bash layer: 15 commands, 0 writes outside `owns`. The enforcing hook is the installed 0.15.0 copy, not the file this task edited, so the task could not affect its own boundary. |
| 3. Forbidden | PASS | The inline `realOr` and `resolveAncestry` are removed rather than duplicated, and the hook imports `resolve-target.mjs`; no `process.exit` line and no receipt field name changed; `lib/resolve-target.mjs` and `lib/owns-match.mjs` are untouched by this commit; no dependency added; no existing case deleted. |
| 4. Acceptance | PASS | Criterion re-run by the auditor: exit 0 (`enforce-owns: PASS, 39 cases`, with `ok   f10-cross-drive   exit=0 want=0`, so that case ran rather than skipped). The executor additionally ran the suite under `docker run node:20-slim`: 40 cases there, with `posix-relative-dotdot` and `f1-leaf-file-symlink-escape` executing rather than skipping. |
| 4b. Watched failing first | PASS, with one stated exception | The auditor ran the NEW suite against the PRE-CHANGE hook (`git show 2c37b36:...`) in a copy: `FAIL, 4 of 39`, namely `f10-cross-drive` (exit 2, want 0), `link-out-of-repo-denied` (exit 0, want 2), `throw-deny-receipt` (entries `[]`) and `f7-cwd-subdir` (exit 0, want 2). `walkup-stops-at-git` passes before and after, because the pre-change code had no walk-up to misdirect; it is a regression guard. `posix-relative-dotdot` skips on Windows and was verified in Docker. |
| 5. Deviations | PASS | Executor reported none; none discovered. |

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.2.1 | `45fac55` | `drydock/hooks/enforce-owns.mjs`<br>`drydock/hooks/enforce-owns.test.mjs` | `drydock/hooks/enforce-owns.mjs`<br>`drydock/hooks/enforce-owns.test.mjs` | none |

**Auditor's own probes against the new hook**, in a scratch repo with `owns: ["docs/**"]`, three junctions (to `site`, to a non-existent target, and to a directory outside the repo):

| Probe | Result |
|---|---|
| `Z:/nope/x.ts`, `Q:/gone/y.ts` (other drives) | exit 0, F10 fixed, and no receipt, which is correct for a path outside the repo |
| `docs/jn/new/deep.ts`, `docs/dj/x.ts` (plan 006's F1 and dangling cases) | exit 2 each, no regression |
| `docs/out/x.ts` (junction to outside the repo) | exit 2, the D2 rule working |
| `docs/ok.ts`, `docs/newdir/ok.ts` (owned, one in a new directory) | exit 0 each, no over-deny |
| `site/a.ts` (unowned) | exit 2 |
| Receipts | 4 denies and 2 allows logged, **including the thrown dangling-link deny** that left no entry before this wave |

Deviations logged: 0 (0 discovered by wavecheck)

### Wavecheck 1.3, PASS, 2026-09-29

Execution is `fleet`; audited by the orchestrating session, which wrote neither diff.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `status: EXECUTING`; wave 1.3 exists (Deviation 1); waves 1.1 and 1.2 have PASS reports. Both tasks re-own files first owned in earlier waves, which the contract permits as a sequential handoff. |
| 2. Ownership | PASS | `audit-wave 1.3: PASS (2 task(s), 2 commit(s), attribution: manifest)`, table below. Working tree clean. |
| 2b. Enforcement ran | PASS | `enforcement active: 10 hook decision(s) recorded for wave 1.3 (0 denied)`. Bash layer: 21 commands, 0 writes outside `owns`. |
| 3. Forbidden | PASS | T1.3.1 touched no `lib/` file and left exit codes and receipt field names alone; T1.3.2 touched only the resolver's test file, renamed and removed nothing, and still skips when a link cannot be created. No dependency added by either. |
| 4. Acceptance | PASS | Both criteria re-run by the auditor: T1.3.1 exit 0 (`enforce-owns: PASS, 41 cases`, with `ok   unc-repo-denied   exit=2 want=2`, so the case ran rather than skipped), T1.3.2 exit 0 (`resolve-target: PASS, 8 cases`). All four suites green together: 139/139, 41, 21, 8. T1.3.1's executor watched `unc-repo-denied` fail against the pre-fix hook (`FAIL ... exit=0 want=2`, 1 of 41). |
| 5. Deviations | PASS | Neither executor reported a deviation. T1.3.1 chose, as the task invited, to soften the docblock's receipt claim rather than invent a second receipt shape for the unusable-config deny, which happens before a parsed config exists; its reasoning is recorded in its report and the docblock now names the one deny path that records nothing. |

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.3.1 | `d01c33a` | `drydock/hooks/enforce-owns.mjs`<br>`drydock/hooks/enforce-owns.test.mjs` | `drydock/hooks/enforce-owns.mjs`<br>`drydock/hooks/enforce-owns.test.mjs` | none |
| T1.3.2 | `918dd45` | `drydock/lib/resolve-target.test.mjs` | `drydock/lib/resolve-target.test.mjs` | none |

**Auditor's own measurement of the rejected regression**, same fixture as the Wave 1.R finding:

| Probe | Pre-phase `157e70a` | Rejected `c75f8d1` | Now |
|---|---|---|---|
| plain unowned `site/x.ts` | DENY | DENY | DENY |
| UNC unowned `site/x.ts` | DENY | **ALLOW** | **DENY** |
| UNC owned `docs/x.md` | DENY | ALLOW | ALLOW, correctly |
| receipts | 3 | 1 | 3 |

The end state is better than the pre-phase hook, which denied the OWNED UNC path too, because it could not resolve that form at all.

**No over-denial found.** Re-running the auditor's probe set against the fixed hook: `Z:/nope/x.ts` allows; plan 006's junction and dangling-link cases deny; a junction out of the repo denies; owned writes, including into a three-level new directory, allow; an unowned write denies; a plain write to a directory outside the repo allows. 8.3 short names behave correctly (unowned denies, owned allows), checked after a first PowerShell harness produced a false "allow" for the control case and was discarded as broken.

**Noted, not a defect:** T1.3.2's executor reports that a resolver regression now crashes the suite with an uncaught exception (exit 1, no summary line) rather than printing a per-case `FAIL` row. The suite still fails, which is what the fix required, but the output is less legible than the other cases.

Deviations logged: 0 (0 discovered by wavecheck)

### Wavecheck 1.4, PASS, 2026-09-29

Execution is `fleet`; audited by the orchestrating session, which wrote none of this diff.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `status: EXECUTING`; wave 1.4 exists (Deviation 3); waves 1.1, 1.2 and 1.3 have PASS reports. |
| 2. Ownership | PASS | `audit-wave 1.4: PASS (1 task(s), 1 commit(s), attribution: manifest)`, table below. Working tree clean. |
| 2b. Enforcement ran | PASS | `enforcement active: 8 hook decision(s) recorded for wave 1.4 (0 denied)`. Bash layer: 13 commands, 0 writes outside `owns`. |
| 3. Forbidden | PASS | Nothing under `drydock/lib/` touched; no exit code or receipt field name changed; no case weakened or removed; no dependency added; the UNC cases still RUN on this box rather than skipping. |
| 4. Acceptance | PASS | Criterion re-run by the auditor: exit 0 (`enforce-owns: PASS, 42 cases`). Both UNC cases and both receipt cases ran for real here: `ok unc-repo-denied exit=2 want=2`, `ok unc-repo-owned-allowed exit=0 want=0`, `ok throw-deny-receipt-string-path exit=2 path="42" typeof=string`. |
| 4b. The skip path, verified by the auditor | PASS | The reviewer's scenario was reproduced independently: a scratch copy of the suite with the share repointed to an unreachable `\\localhost\zz$` (4 occurrences replaced) prints `ok unc-repo-denied SKIPPED: ... not reachable on this box` and the same for the owned case, with the suite still `PASS, 42 cases` rather than RED. Two earlier attempts at this simulation silently replaced nothing and were discarded rather than reported as a pass. |
| 5. Deviations | PASS | Executor reported none, and disclosed unprompted that the `ino === 0n` guard is asserted by code reading only, since no filesystem here reports a zero inode. Recorded rather than counted as verified. |

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.4.1 | `a36b0a1` | `drydock/hooks/enforce-owns.mjs`<br>`drydock/hooks/enforce-owns.test.mjs` | `drydock/hooks/enforce-owns.mjs`<br>`drydock/hooks/enforce-owns.test.mjs` | none |

Deviations logged: 0 (0 discovered by wavecheck)

## Wave 1.R verdict, APPROVED, 2026-09-29 (second re-review, after Wave 1.4)

A third fresh-context Opus reviewer, warned about both harness traps this plan has hit. It hit the second one itself: its first two fixture patches silently replaced the wrong occurrences while reporting success, so every later fixture edit was made from a script file and verified by re-reading the bytes. **No CONFIRMED BLOCKER or MAJOR in the Phase 1 diff.**

**Wave 1.4 verified as claimed.** The UNC cases RUN here (`exit=2 want=2` from the ownership branch, and `exit=0 want=0` owned); with the share repointed to an unreachable one they SKIP, one line each, suite green at 42. The probe cannot hang: it names only `localhost`, measured at 9ms, where a non-resolving host costs 1.3s and a blackhole IP 21s, neither reachable. The new cases gate their logic: mutating `if (path.isAbsolute(rel))` to `if (false)` fails `unc-repo-denied`; dropping `String()` fails `throw-deny-receipt-string-path`; the escape branch mutation still fails `link-out-of-repo-denied`.

**The docblock now matches reality exactly**, across a twelve-row decision matrix: owned allow, unowned deny, escape deny, thrown deny, thrown deny on a non-string target, two unusable-config shapes, outside-the-repo allow, no config, no target, `notebook_path`, and target-is-the-repo-root all record, or leave nothing, precisely as the text says.

**No regression.** Ten UNC and device forms deny unowned and allow owned with correct receipts; the symmetric UNC project directory, `subst` both ways, a repo root reached through a junction, and a real 8.3 alias taken from `dir /x` all behave; twelve ordinary-write shapes show no over-denial; `Z:` still allows with no receipt. Thirteen POSIX probes in `node:20-slim` are clean, D10's relative `..` escape denies, and `corroborateInside` is confirmed unreachable there.

**MINOR 1, folded into Wave 1.5 (D15).** The `ino === 0n` guard short-circuits corroboration for the whole repo, so on a filesystem reporting no file ids a UNC-addressed write is allowed, unowned and unlogged, exactly as before Wave 1.3. Measured by injecting a zero inode. Latent here (NTFS only, no FAT or exFAT volume, no VHD without admin, and both Docker overlayfs and a Windows-to-Linux bind mount report nonzero inodes). The guard is nonetheless right: removing it false-denies a legitimate owned UNC write on such a volume. What is missing is the ceiling. **NIT 3, also folded in:** `unc-repo-denied` asserts only the exit code, so a box where the probe succeeds but `realpathSync.native` fails on the share would pass it via a thrown deny.

**Left as follow-ups:** the guard has no test and would need an injectable `stat` to get one (NIT 2); `/^[A-Za-z]:/` is subsumed by the `C` check beside it (NIT 4); unreadable stdin is a fourth receipt-less allow that the docblock folds into a neighbouring condition (NIT 5); plus the earlier rounds' NIT 5, 6, 7 and the audit-divergence NIT 8, unchanged.

## Wave 1.R verdict, REJECTED, 2026-09-29 (re-review after Wave 1.3)

A second fresh-context Opus reviewer, driving the hook from `spawnSync` with control probes after being warned that a PowerShell harness had produced false results. **The rejected regression is genuinely fixed**, and not merely in the spelling it was reported in: unowned denies and owned allows, each with a correct repo-relative receipt, through `\\localhost\c$`, `\\127.0.0.1\c$`, `\\?\UNC\`, `\\.\UNC\`, `\\?\C:\`, `\\.\C:\`, a case-variant UNC, volume-GUID and `GLOBALROOT` device forms, a `subst` drive, an 8.3 short name, and the symmetric case with the project directory itself given as UNC. Against the pre-fix hook the same probe exits 0. Thirteen source mutations each kill a specific case, including the one MINOR 2 fixed, so the new cases gate their logic. The identity walk costs nothing measurable, terminates on every root form tried, and produced no over-denial across roughly thirty ordinary-write shapes, on Windows and on Linux under the floor runtime.

**MAJOR, confirmed, in Wave 1.3's test file rather than the product.** The UNC cases guard on platform and drive letter but never on whether the admin share is REACHABLE. On a standard-user, `AutoShareWks=0` or hardened box, `lstat` throws, the hook fails closed, and the reviewer measured `FAIL unc-repo-owned-allowed exit=2 want=0` with the suite RED, while `unc-repo-denied` passes for the wrong reason (a thrown deny, not corroboration), satisfying the wave's own criterion with the fix unexercised. `drydock/README.md` tells a new user to run this suite, and CI runs it on `windows-latest`. This repo already paid for exactly this class once: plan 006 records the suite going red because `symlinkSync` threw EPERM, which is why `tryDirLink` degrades a missing capability into a recorded skip. **T1.4.1.**

**Also folded into Wave 1.4:** the docblock still claims every ALLOW records a receipt, which the measured matrix contradicts for the outside-the-repo allow (MINOR 3); a junction escape addressed through a UNC form is allowed silently, because both votes are absolute, so the two-votes story is not symmetric and CEILINGS should say so (MINOR 2); the `String(target)` coercion survives mutation, untested (NIT 4); and `identity` should treat `ino === 0n` as unknown so a file-id-less filesystem cannot match unrelated directories (SUSPECTED).

**Left as follow-ups:** the outer-catch receipt's path is not repo-relative (NIT 5); a target that IS the repo root renders `does not own .` with an empty receipt path (NIT 6); a resolver regression crashes the suite instead of printing a `FAIL` row and leaks a temp fixture (NIT 7); no case exercises the `dev` half of the identity comparison, which needs a second volume (SUSPECTED, not fixable on this runner).

## Wave 1.R verdict, REJECTED, 2026-09-29

Fresh-context Opus review of `157e70a..c75f8d1`. One CONFIRMED MAJOR, introduced by this phase. Everything else it probed measured clean, including the regression class the plan flagged as highest risk.

**MAJOR, confirmed, and re-measured by the orchestrator.** `outside()` treats "the relative path came back absolute" as proof the target is elsewhere. `realpathSync.native` collapses `\\?\C:\`, `\\.\C:\` and `subst` drives back onto `C:`, but returns a UNC path unchanged, so a target addressed as `\\localhost\c$\...\repo\site\x.ts` votes "outside" twice and is allowed, unowned and unlogged. Orchestrator's reproduction: pre-phase hook `157e70a` DENY / DENY / DENY with 3 receipts; current hook `c75f8d1` DENY (plain) / **ALLOW** (UNC unowned) / **ALLOW** (UNC owned) with 1 receipt, and the UNC write lands in the repo. Windows-only: on POSIX `path.isAbsolute(rel)` is unreachable there. **T1.3.1.**

**Also raised, folded into Wave 1.3:** the docblock's new claim that every deny records a receipt is false for the unusable-config deny (MINOR 1, **T1.3.1**); `link-out-of-repo-denied` passes even with its branch mutated to `if (false)`, because the fall-through denies for another reason, so it must assert the message (MINOR 2, **T1.3.1**); the resolver suite's real-filesystem case turns a resolver regression into a skip (MINOR 3, **T1.3.2**); the thrown-deny receipt can carry a non-string path (NIT 4, **T1.3.1**).

**Left as follow-ups:** an escape or thrown deny attributes `task` from the lexical path (NIT 5); D12's bound only helps when a `.git` intervenes (NIT 6); a nonexistent UNC server costs a 2.7s timeout, pre-existing (NIT 7); `drydock-audit.mjs` still resolves ownership its own weaker way, one level and no two-vote rule, so hook and audit can disagree (NIT 8, pre-existing).

**Measured clean:** no over-denial across new files in new directories, existing files, absolute/relative/mixed-separator forms, `notebook_path`, a repo reached through a junction, a subst drive or UNC, and case or trailing-slash variants of `projectDir`. No other escape: junctions and symlinks out of the repo at depth, dangling links, leaf symlinks, ADS, trailing dots and spaces, case variants, parent-is-a-file all deny; hard links are followed, as *Out of scope* says. Termination holds on a symlink loop (26ms) and a 2000-segment path (3.8s), with no stack growth. The injected-fake tests are not tautological: four separate mutations each fail a specific case. The detector's widened rename condition mis-parses no porcelain status tried (` R`, `R `, `RM`, `A `, `AM`, ` M`, ` D`, `??`, `UU`). The walk-up stops at a `.git` directory and at a `.git` FILE (worktree shape), finds the config from a deep subdirectory, and cannot pick a wrong nested repo. D10 verified on Linux: the relative `..` escape now denies.

## Progress log

| Date | Task | Result | Notes |
|---|---|---|---|
| 2026-09-29 | T0 | done | baseline at `157e70a`, all three suites green, index row added |
| 2026-09-29 | T1.1.1 | done | `a79c285`, resolver module with injectable fs, 8 cases, CI line added |
| 2026-09-29 | T1.1.2 | done | `2c37b36`, worktree rename + walk-up bounded at .git (21 cases) |
| 2026-09-29 | Wave 1.1 | PASS | wavecheck |
| 2026-09-29 | T1.2.1 | done | `45fac55`, hook on the new resolver, outside-both-ways, receipts on thrown denies (39 cases) |
| 2026-09-29 | Wave 1.2 | PASS | wavecheck |
| 2026-09-29 | T1.R.1 | REJECTED | MAJOR: a UNC form of the repo path is allowed unowned; Wave 1.3 added |
| 2026-09-29 | T1.3.1 | done | `d01c33a`, identity corroboration closes the UNC regression (41 cases) |
| 2026-09-29 | T1.3.2 | done | `918dd45`, resolver suite skips only on link failure |
| 2026-09-29 | Wave 1.3 | PASS | wavecheck |
| 2026-09-29 | T1.R.1 | REJECTED | re-review: UNC cases assume the admin share is reachable; Wave 1.4 added |
| 2026-09-29 | T1.4.1 | done | `a36b0a1`, UNC cases skip when the share is unreachable (42 cases) |
| 2026-09-29 | Wave 1.4 | PASS | wavecheck |
| 2026-09-29 | T1.R.1 | APPROVED | second re-review; one MINOR folded into Wave 1.5 |

## Reconcile report
