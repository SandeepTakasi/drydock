---
plan: 006-external-review-repairs
format_version: 3
status: EXECUTING
isolation: none
enforcement: required
attribution: manifest
lane: full
execution: fleet
created: 2026-09-20
approved_by: Sandeep Takasi
---

# 006 - External review repairs

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
node "$DD/scripts/drydock-audit.mjs" wave-start docs/plans/006-external-review-repairs.md <wave>
# ... the wave's executors run ...
node "$DD/scripts/drydock-audit.mjs" audit-wave docs/plans/006-external-review-repairs.md <wave>
rm .drydock/wave-owns.json
```

**This plan document is owned by no task.** While `.drydock/wave-owns.json` is
armed the hook denies every write to it, including the orchestrator's own
bookkeeping. Anything written into this file, the Baseline table, the Wave 1.R
verdict, the Deviation Log, the wavecheck report, is written either before a
wave is armed or after `rm .drydock/wave-owns.json`. Widening `owns` to include
the plan file is the wrong fix and is what the denial message says not to do.

**Staleness check (before every wave):**
`git diff <baseline SHA>..HEAD -- <wave's owned files>`. Non-empty → re-validate
the wave's tasks against current code and update the baseline SHA and Decision
Log before executing.

## Requirement

The eight findings raised by the 2026-09-20 external review of drydock 0.14.0
are resolved or consciously deferred: the ownership hook no longer allows a
write to escape `owns` through a directory junction (F1), the Bash detector
reports renames correctly and stops issuing a clean receipt over an undetected
write (F2, F3), `audit-wave` stops falsely blocking commits containing non-ASCII
filenames (F4), both test suites run to completion on stock Windows (F5), the
documentation stops making four claims the code does not support (F6, F8),
`prove-failable` stops refusing correct plans whose criteria happen to print the
words "not found" (F9), and F7 is recorded as a deferral rather than silently
dropped. The result ships as `0.15.0`, because a fix that is not released is a
fix no host session can load.

## Spec reference

None. The requirement is complete: the review's findings, each reproduced
first-hand and recorded with its evidence in *Findings & constraints*, are the
specification. Where this plan and the review disagree, this plan is right and
says why (F3 in particular is worse than reported).

## Surgical-scope statement

Three source files and their three suites, three documentation files, one index
row, and four release files. Each change is the narrowest one that closes its
finding: a resolve-the-deepest-existing-ancestor walk, a `-z` rename parse, a
content-aware snapshot, `-z` on three `git show` calls, a narrowed stderr scan,
two test-harness repairs, and deleting four sentences. No refactor, no new
dependency, no new module.

## Baseline

Filled by T0 before any wave is armed.

Recorded by T0 on 2026-09-21, before any wave was armed.

| | |
|---|---|
| Commit SHA | `fdb862d6fe12cf45aaa997aecbfc2c0d5698f26c` |
| `node drydock/scripts/drydock-audit.test.mjs` | **RED.** `134/136 passed`. The two failures are the F5 `process.execPath` quoting defect. |
| `node drydock/hooks/enforce-owns.test.mjs` | **RED.** Aborts at module scope with `EPERM: operation not permitted, symlink`. 30 cases declared, 0 executed. |
| `node drydock/hooks/detect-bash-writes.test.mjs` | **GREEN.** `detect-bash-writes: PASS, 14 cases`. |
| `node site/scripts/assert-matrix.mjs` | **RED until T0's own row landed.** `FAIL (1)`, no index row for this plan. Green after T0. |

**Known-red at baseline, and excluded from every acceptance criterion except
the task that repairs it:** the audit suite reports 134/136 on Windows, the
`enforce-owns` suite aborts before its first case, and `assert-matrix` fails
until T0 adds this plan's index row. All three are work items (F5, and defect 1
of the pressure test), not pre-existing conditions to route around.

## Practices in effect

| Practice | Value | Source |
|---|---|---|
| Test approach | Test-first per task: the regression case is written, watched failing, then fixed. One task, not two. | planwright TDD rule; repo convention (every hook and script carries a sibling suite) |
| Quality gates | `node <suite>` per area; `npm run verify` in `site/` for the release task | CLAUDE.md |
| CI | `.github/workflows/verify.yml`, Node **20, 22 and 24** × ubuntu and windows, no path filter | `verify.yml:45` |
| Runtime floor | `engines.node: ">=20.17.0"`. **No Node 21+ API may be used in a hook or script.** | `drydock/.claude-plugin/plugin.json:11` |
| Commit granularity | One checkpoint commit per task, owned files only | plan-format contract |
| Attribution | `manifest` via `drydock-audit.mjs task-close` | D8 |
| Branching | Work on `main`, as the repo does | git history |
| Human gate | Phase 2 release requires a named human approval before the tag | D9 |
| Tracker mirroring | None | no tracker in repo |

## Findings & constraints

Every finding below was reproduced in this session against the working tree at
`fdb862d`, in a scratch git repo, with the hook or script invoked directly, and
independently re-measured by the adversarial reviewer. The review's claim is
recorded only where it could be made to happen.

**F1 (HIGH, confirmed). The ownership hook can be escaped through a directory
junction when the intermediate directory does not yet exist.**
[enforce-owns.mjs:213](drydock/hooks/enforce-owns.mjs:213) resolves only
`path.dirname(absolute)`. `realOr` falls back to the lexical path when the
target's parent does not exist, so a junction higher up is never resolved.
Measured, with `owns: ["docs/**"]` and `docs/jn` a junction to `site/`:

```
docs/jn/a.ts          -> exit 2 (denied, parent exists and resolves)
docs/jn/new/deep.ts   -> exit 0 (ALLOWED, parent absent; Write creates it, file lands in site/)
```

This defeats the plugin's headline claim. A junction needs no administrator
rights on Windows. The existing suite covers only the one-level case. Note also
that the final path component is never resolved today, so an owned path that is
itself a symlink to an unowned file escapes by the same route.

**F2 (MEDIUM, confirmed). The Bash detector mangles the old path of a rename.**
[detect-bash-writes.mjs:136](drydock/hooks/detect-bash-writes.mjs:136) applies
`e.slice(3)` to every NUL-separated record. Under `-z`, a rename emits
`R  <new>\0<old>`, and the second field carries no status prefix, so three
characters are cut off the front of a real path. Measured: `git mv docs/b.md
docs/c.md` under `owns: ["docs/**"]` produced `"path":"s/b.md"` — a fabricated
path, reported as a violation, for a rename entirely inside the boundary.

**F3 (MEDIUM, confirmed, and worse than reported). A write to an
already-dirty unowned file is invisible, and the receipt asserts the opposite.**
[detect-bash-writes.mjs:171](drydock/hooks/detect-bash-writes.mjs:171) diffs two
*sets of paths*. Once a path is in the snapshot, further writes to it produce no
new entry. Measured, `owns: ["docs/**"]`:

```
1. seed snapshot (clean tree)          -> observed
2. echo A >> site/dirty.ts             -> detected  site/dirty.ts
3. echo B >> site/dirty.ts             -> observed          <-- second write invisible
4. echo C > site/other.ts              -> detected  site/other.ts
```

And in the worst case, where the file is already dirty before the wave's first
Bash command, it is **never** detected at all — both commands recorded
`observed`. That entry is documented as "positive evidence that this layer was
alive and saw nothing outside the boundary", so the hook does not merely miss
the write, it files a receipt stating the boundary was clean. A false negative
that reports as a positive is the one shape this repo's own docblocks argue
hardest against.

**F4 (MEDIUM, confirmed). Non-ASCII filenames produce a false ownership
violation.** `git show --name-only` quotes and octal-escapes any path outside
ASCII unless told otherwise, and
[drydock-audit.mjs:1243](drydock/scripts/drydock-audit.mjs:1243),
[:1345](drydock/scripts/drydock-audit.mjs:1345) and
[:1687](drydock/scripts/drydock-audit.mjs:1687) parse the raw output. Measured:
committing `docs/café.md` prints `"docs/caf\303\251.md"`, quotes included, and
`matchesOwns('"docs/caf\303\251.md"', ["docs/**"])` is `false`. A conforming task
is BLOCKed for owning a file it owns. `-c core.quotepath=false` fixes the
accented case but still backslash-escapes a path containing `"`, `\` or a
newline; those are illegal in NTFS filenames but legal on the Linux runners CI
uses, so `-z` is the complete fix and the same size.

**F5 (MEDIUM, confirmed). Neither suite can pass on stock Windows.**
`enforce-owns.test.mjs:47` calls `symlinkSync`, which throws `EPERM` without
Developer Mode or elevation; the throw is at module scope, so **no case in that
file runs** (30 cases, 0 executed). `drydock-audit.test.mjs` reports 134/136
because its two `prove-failable` cases interpolate `process.execPath` unquoted
into a `cmd.exe` command line, and `C:\Program Files\nodejs\node.exe` splits at
the space. Both are defects in the tests, not the product — but F1 is exactly the
class of bug a suite that cannot run will not catch, and F1 shipped.

**F6 (MEDIUM, confirmed by reading). A plan document is executable code, and
nothing says so.** `proveFailable`
([drydock-audit.mjs:1845](drydock/scripts/drydock-audit.mjs:1845)) and
wavecheck's check 4 run backticked strings lifted from a plan through
`spawnSync(..., { shell: true })`. Running `prove-failable` on a plan from a
cloned repository executes whatever that document contains. This is inherent to
the design, is not being changed here (D7), and must be stated.

**F7 (LOW, confirmed by reading, DEFERRED). The hooks go inert when
`CLAUDE_PROJECT_DIR` is unset and the working directory is a subdirectory.**
Both hooks resolve `process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd()`
and then look for `.drydock/wave-owns.json` directly beneath it. Claude Code
sets the variable, so this is robustness rather than a live hole. Moved to *Out
of scope* (D11).

**F9 (MEDIUM, confirmed, found while gating this plan, not by the review).
`prove-failable` misclassifies a legitimately failing criterion as unrunnable
when its output happens to contain the words "not found".**
[drydock-audit.mjs:1876](drydock/scripts/drydock-audit.mjs:1876) treats
`saidNotFound && run.status !== 0` as "the criterion could not be run at all",
where `saidNotFound` scans the whole of stderr. Measured: T1.1.3's and T1.2.1's
criteria run `drydock-audit.test.mjs`, whose own baseline failure text contains
`the command was not found` four times; both criteria exited 1, a clean and
correct failure, and both were reported `unrunnable`, which is a FAIL of the
plan's own approval gate. The exit codes this heuristic exists to catch (127,
126, 9009) are already handled one line above, so the stderr scan only ever adds
value on a shell reporting neither, and scanning arbitrarily deep nested output
is what makes it wrong. This defect fails plans; it does not pass bad ones.

**F8 (LOW, confirmed). Four documentation statements the code contradicts.**
`drydock/README.md:49`, `plan-format.md:85` **and
[drydock-audit.mjs:1589](drydock/scripts/drydock-audit.mjs:1589)** all say
`audit-wave` "never consults the hook", while
[drydock-audit.mjs:1402](drydock/scripts/drydock-audit.mjs:1402) reads
`.drydock/enforcement.log`, which is the hook's own output.
`wavecheck/SKILL.md:24` says "stop early only on check 1 failure" and `:60` then
classifies an empty enforcement log, discovered under check 2, as "a BLOCK on
check-1 grounds".

**Constraints the plan must respect.**

- **Hooks and skills run from the INSTALLED plugin**, not this working tree.
  `hooks.json` resolves `${CLAUDE_PLUGIN_ROOT}` to
  `~/.claude/plugins/cache/drydock/drydock/0.14.0/`. Every wave of this plan is
  therefore enforced by the **unfixed** 0.14.0 hook, and the repaired hooks are
  unexercised by any host session until 0.15.0 is released and installed (D6).
  The acceptance criteria are unaffected: they run the suites from the working
  tree, so they exercise the repaired code directly.
- **`assert-matrix.mjs` requires an index row for every plan on disk**, and
  requires its status column to equal the plan's frontmatter `status:`. It runs
  in the `docs` CI job with no path filter, so committing this plan without the
  row turns `main` red immediately. T0 owns that row, and it is updated on every
  status transition.
- **`assert-copy.mjs` fails the site build on version drift**, checking both
  `site/content/copy.ts` and the repository-root `README.md` for the literal
  `v<version>`.
- **Acceptance criteria are executed by `cmd.exe` on this machine.**
  `prove-failable` uses `shell: true`, which is `cmd.exe` on Windows. Every
  criterion below was run through `spawnSync(cmd, { shell: true })` before being
  frozen, in both directions. **No criterion uses a backslash escape**: `\d`
  does not survive the shell layers and silently degrades to a regex that never
  matches, which made the first draft's criteria unpassable. Character classes
  (`[0-9]`) are used throughout.

## Decision Log

| # | Question | Decision | Decided by | Rationale |
|---|---|---|---|---|
| D1 | Solo or fleet execution? | `fleet` | user | The three code areas are genuinely disjoint, and the repo has no evidence its own fleet path works end to end. Consumed by every task in Wave 1.1. |
| D2 | Cut the release in this plan? | Yes, Phase 2 bumps to 0.15.0 | user | CLAUDE.md: editing the plugin without bumping is drift the audit cannot detect. Consumed by T2.1.1. |
| D3 | How does the F1 regression test create a link? | Directory junction on Windows, `symlinkSync` elsewhere, both guarded | user | A junction needs no elevation, and is how F1 was reproduced. A test that skips on the author's own platform is how F1 survived. Consumed by T1.1.1. |
| D4 | Share a project-root helper between the two hooks? | Moot, F7 deferred (D11) | planner | No shared surface remains, so Wave 1.1 needs no contract wave. |
| D5 | Testing Gate for this plan? | `N/A`, with the reason recorded in §11 | planner (assumed, flag if wrong) | The only user-facing artifact touched is a version string on the homepage, and `assert-copy.mjs` already asserts it mechanically against `plugin.json` at build time. Driving a browser to read a badge that a build gate already pins is ceremony. |
| D6 | Can this plan prove its own fixes work in a host session? | No, and it says so rather than implying otherwise | planner (assumed, flag if wrong) | Hooks load from the installed 0.14.0 copy, so every wave here is enforced by the unfixed hook. The suites are the evidence; live host verification is a follow-up after `claude plugin update`. Consumed by T1.1.1, T1.1.2, T2.1.1 and the wavecheck report. |
| D7 | Fix F6 (plans are executable) in code? | No, document it | planner (assumed, flag if wrong) | Executing criteria is the mechanism by which `prove-failable` and wavecheck work at all. A confirmation prompt would break non-interactive use; the honest fix is that the README stops omitting it. Consumed by T1.2.1. |
| D8 | Attribution mode? | `manifest` | planner (assumed, flag if wrong) | Default from `format_version: 3`, and this repo's commit subjects follow its own convention rather than `drydock(<id>):`. Consumed by every implementation task. |
| D9 | Who signs the Phase 2 human gate? | Sandeep Takasi, recorded by name and date in the phase gate line | planner (assumed, flag if wrong) | `drydock:reconcile` refuses to close a plan on an unsigned human gate, and nothing infers approval from surrounding text. |
| D10 | Docs task parallel with the code fixes it describes? | **No.** Docs moved to Wave 1.2, after the code wave | planner, on the pressure test's finding | `drydock-audit.test.mjs` (T1.1.3) reads `plan-format.md` and scans every `SKILL.md` for backticked vocabulary and for `${CLAUDE_PLUGIN_ROOT}` inside fences. A parallel docs task could therefore break a sibling's acceptance criterion from a file it does not own. Sequencing removes the coupling; T1.2.1's criterion re-runs that suite as a backstop. |
| D11 | Fix F7 in this plan? | No, deferred to *Out of scope* | planner, on the pressure test's finding | It is absent from the Requirement, has no test and no criterion, is graded robustness rather than a live hole, and its fix would be duplicated across the two highest-risk tasks. Invisible to every gate while widening their blast radius. |
| D12 | `-c core.quotepath=false` or `-z` for F4? | `-z` on the three path-parsing call sites | planner, on the pressure test's finding | `quotepath=false` still backslash-escapes paths containing `"`, `\` or a newline. Those cannot occur on NTFS but can on the Linux CI runners. Same effort, complete instead of partial. Consumed by T1.1.3. |
| D13 | How do acceptance criteria resist a token-in-a-comment cheat? | Each asserts the suite's reported case count rose **and** the named case exists **and** the suite passes | planner, on the pressure test's finding | A substring check over a test file is satisfied by writing the token in a comment; the pressure test built that cheat and passed the first draft's criterion with no fix written. A case count cannot be raised without a case. Consumed by T1.1.1, T1.1.2, T1.1.3. |
| D14 | Fix F9, found while gating this plan rather than by the review? | Yes, folded into T1.1.3 | planner (assumed, flag if wrong) | It is a two-line change in a file that task already owns, and it is a **false FAIL in this plan's own approval gate**: two correct criteria were reported unrunnable. Leaving it means every future plan whose criteria produce that text is refused for a defect in the checker. It fails good plans rather than passing bad ones, so it is a correctness fix, not a loosening. Consumed by T1.1.3. |
| D15 | How is the Wave 1.R rejection repaired? | A new **Wave 1.3** of fix tasks, then a re-review, following plan 004's precedent (its Wave 1.R was REJECTED, repaired in a Wave 1.3, then re-reviewed APPROVED). Not a second commit under T1.1.1. | planner, on the review's verdict | The escalation policy allows retries, but a second commit and `task-close` entry under T1.1.1 would make sealed wave 1.1's attribution ambiguous, which is exactly what per-task commits exist to prevent. A later wave may re-own a file (sequential handoff), so a new task id keeps both waves auditable. This is retry 1 of the policy's 2. Consumed by T1.3.1, T1.3.2, T1.R.1. |
| D16 | Fold the review's finding 3 (`audit-wave` cannot see a rename out of an unowned path) into this plan? | Yes, as T1.3.2 | planner, on the review's finding | It is MAJOR, it is the audit-side twin of F2, and it makes a documentation sentence false: `plan-format.md` says the audit "sees everything a commit or a dirty tree carries". Stopping documentation from claiming what the code does not do is in this plan's Requirement. The fix is one flag on three lines T1.1.3 already edited, and `git log --diff-filter=R` over the whole history is empty, so no sealed audit of plans 001 to 005 can change. Consumed by T1.3.2. |
| D17 | Fix the provenance error wavecheck 2.1 found in the 0.15.0 CHANGELOG entry, or ship it? | Fix it, in a Wave 2.2 task | planner, on wavecheck 2.1's finding | The entry twice credits "the re-review" with the dangling-link and `--no-renames` findings; they came from the first Wave 1.R review, which rejected, and the re-review approved. This repo's history is full of commits correcting prose that told a reader something untrue, and a release note misattributing its own evidence is that defect. The auditor may not edit what it audits, and the CHANGELOG cannot be owned twice in one wave, so the remedy is the contract's "targeted fix task" in a new wave. Consumed by T2.2.1. |

## Open questions

None. No task is BLOCKED.

## Out of scope / follow-ups

- **F7, the `CLAUDE_PROJECT_DIR` fallback.** Both hooks go inert rather than
  walking up to find `.drydock/`. Deferred per D11; the fix is a shared helper
  and a wave-0 contract, which is a plan of its own if it is ever worth it.
- **Live host verification of the repaired hooks.** Requires releasing 0.15.0,
  `claude plugin update drydock@drydock`, and a restarted session. The natural
  successor to this plan; cannot be done inside it (D6).
- **F10, cross-drive writes are denied rather than allowed** (Deviation 6). On Windows `path.relative` between drives returns the absolute target, so the hook's `rel.startsWith("../")` outside-the-repo test misses it and the path is matched against `owns` and denied. Pre-existing, fails closed. Fix is `path.isAbsolute(rel)` alongside the `../` test, with a case.
- **Review findings 4 to 6, and two suspicions, from the Wave 1.R review** (MINOR or NIT, pre-existing): deleting an untracked unowned file, or restoring a tracked one with `git checkout --`, records `observed`, because the detector compares only paths present after the command; a snapshot written by the pre-0.15.0 detector is read after a mid-wave upgrade as "first command of the wave", mislabelling one real write; `git()` in the audit trims leading and trailing spaces off paths; an exact-nanosecond mtime restore (`touch -r`) would evade the F3 identity, which adding `ctimeNs` would close; and `.drydock/bash-tree.json` is never reset between waves.
- **The re-review's findings** (see the APPROVED Wave 1.R verdict): the working-tree rename (`" R"`) old-path slice in the detector; the overstated F9 comment; receipt-less throw denials; hard links; and two suspicions worth measuring before they are dismissed, **`realpathSync.native` failing on SMB or RAM-disk volumes, which would make the new lstat branch deny every write in an armed wave** (candidate fix: fall back to the JS `realpathSync` before denying, or deny only on `isSymbolicLink()` or `ELOOP`), and POSIX `..`-after-symlink.
- **Per-task ownership enforcement.** The hook records which task's files a
  write landed in, never who wrote it. Unchanged here.
- **Reducing `drydock-audit.mjs`** (2,077 lines) and the process surface a new
  adopter meets. A real finding of the review, and a redesign, not a repair.
- **Retiring the `planwright` / `wavecheck` / `seatrial` coinages.** Decided
  against in 0.13.1; not reopened here.

## Execution policies

- **Per task:** the acceptance criterion must exit 0, verified by the executor
  before it reports, and re-run independently by wavecheck.
- **Per wave:** `drydock:wavecheck` is the blocking gate. PASS is required
  before the next wave opens.
- **Per phase:** Wave 1.R is a fresh-context quality review of the Phase 1 diff,
  Judgment tier, run after wavecheck PASS on Wave 1.2. APPROVED is required for
  the Phase 1 gate; a REJECTED verdict does not satisfy it.
- **Escalation:** quality-review rejections get max 2 retries with the feedback
  injected, then one model tier up, then a human. Wavecheck BLOCKs on ownership
  violations or unlogged deviations get **no** retries: `/drydock:replan` or a
  human decision.
- **Checkpointing:** one commit per task, staging only that task's owned files,
  followed immediately by `drydock-audit.mjs task-close`. The rollback unit is
  one task.
- **Human gates:** the Phase 2 gate requires a named signature and date (D9).
- **Tracker mirroring:** none.

## Testing Gate

N/A, the only user-facing surface this plan touches is the version string
rendered on the homepage, and `site/scripts/assert-copy.mjs` already asserts it
against `drydock/.claude-plugin/plugin.json` at build time, so a browser run
would re-verify mechanically-gated text and nothing else. No interactive
behaviour changes. See D5.

## Pressure-test verdict

**REJECTED on the first draft, 2026-09-20, by a fresh-context adversarial
reviewer; all twelve confirmed defects fixed and re-verified, verdict now
APPROVED.** The reviewer independently re-measured all eight findings against
the repo and confirmed every file:line citation except one, then broke the plan
on twelve points. The material ones, each fixed above:

1. **`assert-matrix.mjs` requires an index row for every plan**, so committing
   this plan would have turned CI red at T0, with no task owning the file. T0
   now owns `docs/plans/README.md`.
2. **Wave 1.1 was not parallel.** `drydock-audit.test.mjs`, owned by T1.1.3,
   reads `plan-format.md` and scans every `SKILL.md`, both owned by the docs
   task, so the docs task could break a sibling's criterion from a file it did
   not own. Docs moved to Wave 1.2 (D10).
3. **Every criterion was passable by writing the token in a comment.** The
   reviewer built the cheat and passed T1.1.1 with no fix written. All criteria
   now assert the suite's case count (D13).
4. **T1.R.1 could not write its own verdict** while its wave was armed, and
   `REJECTED` satisfied its criterion. Both fixed.
5. **`:812` was a stale line number** carried from before the last `git pull`;
   the `git` helper is at `:1022`, and pointing the executor at three call sites
   instead of the one helper was the more expensive error.
6. **The CI matrix was wrong** (20/22/24, not 22/24), and the missing entry is
   the runtime floor, so an F3 fix written against a Node 22+ API would ship
   green locally and red on the floor CI deliberately tests.
7. **The F1 walk had no termination clause** (`path.dirname("C:\\")` is a fixed
   point, so a naive loop hangs a `PreToolUse` hook on every write), and its
   stated invariant was false.
8. **The F3 sketch left three things to invention**: what identity a deleted or
   renamed-away path gets, an unnumbered "hash if small" threshold, and a new
   false positive the pinned docs were told not to mention.
9. **A fourth copy of the retracted claim** sits at `drydock-audit.mjs:1589`, in
   a file the docs task was forbidden to touch.
10. **F7 was invisible to every gate** while widening the two highest-risk
    tasks; deferred (D11).
11. **`core.quotepath=false` is an incomplete fix** for F4 (D12).
12. **T2.1.1's criterion omitted the root `README.md`**, which is exactly what
    `assert-copy.mjs` fails on.

**Defect 13, found by the gate rather than by either reviewer.** Running
`prove-failable` on the corrected draft reported T1.1.3's and T1.2.1's criteria
as `unrunnable`. Both were correct and exited 1; the checker was fooled because
the suite they invoke prints "the command was not found" four times at baseline,
and the heuristic scans all of stderr. That is F9, now fixed by T1.1.3 (D14),
and the two criteria additionally suppress the nested output so they do not
depend on the fix they gate. Worth recording as evidence for the practice: the
adversarial review read the plan and found twelve real defects, and the
mechanical gate then found a thirteenth that no reader would have, in the
checker rather than in the plan.

Not defects, recorded so they are not re-litigated: `sort -V` correctly selects
`0.14.0` over `0.8.16`; D6 does not undermine the criteria, which run the
working tree's suites; UNC and extended-length paths hit the documented
"outside the repo" branch and are existing stated behaviour.

## Phase 0: Pre-flight

#### T0 - Baseline verification and plan index row

- **Description:** Record the current commit SHA and the verbatim result of each
  of the four gate commands into the *Baseline* section, then add this plan's
  row to `docs/plans/README.md` so `assert-matrix.mjs` passes. Confirm the audit
  suite is 134/136 and the `enforce-owns` suite aborts before its first case, so
  the F5 defects are on the record as the starting state.
- **Files owned:** `docs/plans/README.md` (the *Baseline* section of this plan
  is also written here, before any wave is armed)
- **Depends on:** none
- **Model / thinking:** Mechanical / off   **Executor:** orchestrator, inline
- **Context brief:** this plan's *Baseline* section; `docs/plans/README.md` and
  its existing rows as the format; `site/scripts/assert-matrix.mjs` for what the
  row must contain. The status column must track this plan's frontmatter
  `status:` and be updated on every transition.
- **Forbidden:** editing any other plan's row; running any implementation work.
- **Acceptance criterion:** `node -e "const fs=require('fs');const p=fs.readFileSync('docs/plans/006-external-review-repairs.md','utf8'),i=fs.readFileSync('docs/plans/README.md','utf8');const m=p.match(/Commit SHA [|] .?([0-9a-f]{7,40})/);process.exit(m&&i.includes('006-external-review-repairs')?0:1)"`

## Phase 1: Repair

**Exit state:** All seven addressed findings are closed in the working tree,
every suite passes on this machine, and no documentation statement contradicts
the code.
**Phase gate:** all three suites exit 0 + `node site/scripts/assert-matrix.mjs`
exits 0 + Wave 1.R APPROVED.
**Phase gate: CLOSED, approved by the Wave 1.R re-review - 2026-09-21.** Conditions met: `enforce-owns` 33/33, `detect-bash-writes` 18/18, `drydock-audit` 139/139, `assert-matrix` PASS, Wave 1.R APPROVED on re-review (retry 1 of 2).

### Wave 1.1 - The three code repairs

> Genuinely parallel: the three tasks own disjoint source files and no task
> reads a file another writes. The documentation that describes their behaviour
> is deliberately NOT in this wave (D10).

#### T1.1.1 - Close the junction escape in the ownership hook

- **Description:** Resolve the deepest *existing* ancestor of the write target
  instead of only its immediate parent, then re-append the unresolved remainder,
  so a junction or symlink anywhere above or at the target is followed before the
  path is matched against `owns`. Add a regression case that creates a real
  directory junction and asserts a write through it to a not-yet-existing
  subdirectory is denied. Repair the `EPERM` crash in the same file by creating
  the link with a junction on Windows and `symlinkSync` elsewhere (D3), so the
  suite runs to completion here.
- **Files owned:** `drydock/hooks/enforce-owns.mjs`,
  `drydock/hooks/enforce-owns.test.mjs`
- **Depends on:** none
- **Model / thinking:** Complex / extended   **Executor:** drydock:executor
- **Context brief:** F1, F5 and D3, D6, D13 in this plan;
  `drydock/hooks/enforce-owns.mjs` in full, with attention to `realOr` and the
  `resolved`/`rel` computation at line 213; `drydock/lib/owns-match.mjs`;
  `drydock/hooks/enforce-owns.test.mjs`. **Runtime floor is Node 20.17**, and CI
  runs Node 20, 22 and 24 on ubuntu and windows: no Node 21+ API.
- **Forbidden:** changing `lib/owns-match.mjs`; changing the deny/allow exit
  codes or the receipt JSON shape (`audit-wave` and `sealedRecord` parse it);
  widening or narrowing what `owns` means; adding a dependency; making the hook
  fail closed on a missing config, which is the documented escape hatch;
  introducing an unbounded loop into a `PreToolUse` hook.
- **Implementation sketch:** replace
  `path.join(realOr(path.dirname(absolute)), path.basename(absolute))` with an
  ascent that **starts at `absolute` itself**, so the final component is resolved
  too, closing the symlinked-leaf hole in the same change. Collect skipped
  segments while ascending, `realpath` the first ancestor that exists, then
  rejoin. **Termination is load-bearing:** `path.dirname` reaches a fixed point
  at the filesystem root (`path.dirname("C:\\") === "C:\\"`), so the loop must
  stop when the parent equals the current path, not merely when a path exists.
  Invariants: a target outside the repo still short-circuits to `allow()`; a
  throw anywhere still reaches the `catch` and denies; a fully-existing chain
  resolves at least as strictly as today, and may now resolve a final-component
  symlink it previously missed, which is an intended improvement and should be
  asserted. The new case must be named `f1-junction-escape` and must assert
  `exit === 2` for a path **two levels** below the junction. Create the link with
  `execFileSync('cmd', ['/c','mklink','/J',link,target])` on Windows and
  `symlinkSync(target, link, 'dir')` elsewhere, wrapped so a box permitting
  neither degrades to a recorded skip rather than aborting the file.
- **Acceptance criterion:** `node -e "const{execFileSync:e}=require('child_process');const o=e(process.execPath,['drydock/hooks/enforce-owns.test.mjs'],{encoding:'utf8'});const m=o.match(/enforce-owns: PASS, ([0-9]+) cases/);const s=require('fs').readFileSync('drydock/hooks/enforce-owns.test.mjs','utf8');process.exit(m&&+m[1]>=31&&s.includes('f1-junction-escape')?0:1)"`

#### T1.1.2 - Make the Bash detector report renames and repeat writes honestly

- **Description:** Parse `git status --porcelain -z` correctly, consuming the
  second NUL-separated field of a rename or copy record as a bare path rather
  than slicing three characters off it. Replace the path-set snapshot with one
  that also carries per-path content identity, so a second write to an
  already-dirty file is detected instead of silently producing an `observed`
  receipt that asserts the boundary was clean. Update the docblock's CEILINGS
  list to match the new behaviour.
- **Files owned:** `drydock/hooks/detect-bash-writes.mjs`,
  `drydock/hooks/detect-bash-writes.test.mjs`
- **Depends on:** none
- **Model / thinking:** Complex / extended   **Executor:** drydock:executor
- **Context brief:** F2, F3 and D6, D10, D13 in this plan;
  `drydock/hooks/detect-bash-writes.mjs` in full, especially `gitStatus` at line
  128, the snapshot round-trip and the `changed`/`unowned` computation at line
  171; `drydock/hooks/detect-bash-writes.test.mjs`. **Runtime floor is Node
  20.17**, CI runs 20, 22 and 24: no Node 21+ API. The docblock's CEILINGS list
  is owned by this task; the README's copy of it is T1.2.1's, and T1.2.1's brief
  pins the same wording, so the two must agree.
- **Forbidden:** exiting non-zero on any path (`PostToolUse` cannot block, and a
  non-zero exit is transcript noise); removing the `observed` receipt, which is
  what makes an empty log diagnosable; scanning gitignored files, which would
  make every build tank the hook; reading `tool_input.command` to decide what
  changed, which is the parser design this file exists to reject; adding a
  dependency.
- **Implementation sketch:** in `gitStatus`, walk the NUL-separated records with
  an index rather than mapping: a record whose status field starts `R` or `C`
  consumes the **following** record whole, as the old path. Snapshot becomes an
  object mapping path to a content identity, not an array of paths. Identity is
  `statSync(p, { bigint: true })` rendered as `${size}:${mtimeNs}`; **use the
  nanosecond field**, because a sub-millisecond rewrite is exactly what the
  reviewer is told to hunt for. **A path that does not exist on disk** (a
  deletion, or the old side of a rename) gets the literal identity `absent`,
  which is a value like any other, so its appearance and disappearance both
  register as changes. `changed` is any path absent from `before` **or** whose
  identity differs. Invariants: the first command of a wave still records
  `observed` with the seeded-snapshot reason; a corrupt snapshot is still
  treated as missing; every failure path still exits 0. **New ceiling to
  document in the docblock:** size-and-mtime identity means a content-identical
  rewrite of an already-dirty path (a `touch`, or a `git add` that normalises
  line endings) now yields a `detected` receipt with no content change. That is
  a false positive traded for the false negative in F3, and it must be stated
  rather than discovered. New cases must be named `f2-rename-path` and
  `f3-redirty`.
- **Acceptance criterion:** `node -e "const{execFileSync:e}=require('child_process');const o=e(process.execPath,['drydock/hooks/detect-bash-writes.test.mjs'],{encoding:'utf8'});const m=o.match(/detect-bash-writes: PASS, ([0-9]+) cases/);const s=require('fs').readFileSync('drydock/hooks/detect-bash-writes.test.mjs','utf8');process.exit(m&&+m[1]>=16&&s.includes('f2-rename-path')&&s.includes('f3-redirty')?0:1)"`

#### T1.1.3 - Stop non-ASCII filenames failing the ownership audit, and make the suite runnable

- **Description:** Pass `-z` to the three `git show --name-only` calls whose
  output is parsed as paths, and split on NUL, so a committed non-ASCII filename
  is compared in the form `owns` globs are written in rather than as a quoted
  octal escape. Stop `prove-failable` reporting a genuinely failing criterion as
  unrunnable because its nested output contains "not found" (F9). Repair the two
  `prove-failable` cases that interpolate `process.execPath` unquoted into a
  shell command line. Correct the comment at line 1589 that claims this check
  never consults the hook.
- **Files owned:** `drydock/scripts/drydock-audit.mjs`,
  `drydock/scripts/drydock-audit.test.mjs`
- **Depends on:** none
- **Model / thinking:** Standard / default   **Executor:** drydock:executor
- **Context brief:** F4, F5, F8, F9 and D12, D13, D14 in this plan; the
  `saidNotFound` heuristic at
  [drydock-audit.mjs:1871](drydock/scripts/drydock-audit.mjs:1871) and the
  branch that consumes it at line 1876; the `git` helper at
  **`drydock/scripts/drydock-audit.mjs:1022`** and the three
  `show --name-only` call sites at lines 1243, 1345 and 1687, which are the only
  three whose output reaches `matchesOwns`; the enforcement-log read at line
  1402 and the comment at line 1589; the two failing cases in
  `drydock/scripts/drydock-audit.test.mjs`, which are the ones spawning
  `process.execPath`. Node here lives at `C:\Program Files\nodejs\node.exe`.
  **Pinned replacement for line 1589:** the comment must stop saying the check
  never consults the hook, and must instead say that the ownership *derivation*
  comes from commits and the working tree, while the enforcement receipt is read
  separately; deleting the sentence outright loses a real distinction.
- **Forbidden:** changing the receipt or manifest JSON shapes; changing
  `SUPPORTED_FORMAT_VERSIONS`, the required-section list, or any user-visible
  verdict string that `sealedRecord` re-parses out of committed wavecheck
  reports; altering how `owns` globs are matched; adding a dependency; editing
  any `.md` file.
- **Implementation sketch:** `-z` changes the record separator, so each of the
  three sites splits on `\0` instead of a newline and drops the trailing empty
  field. `core.quotepath=false` is **not** the fix chosen here and must not be
  substituted for it (D12). For F9, the exit codes the heuristic exists to catch
  are already handled by `notFoundCode` on the preceding line, so narrow the
  stderr scan to the **first line** of stderr, where a shell emits its own
  diagnostic, rather than the whole stream. Invariant: a criterion that ran and
  exited non-zero must be reported `failable`, never `unrunnable`, however deep
  its nested output. State the residual ceiling in the comment: a compound
  command whose *second* half is missing can still put the diagnostic off line
  one. The new cases must be named `f4-non-ascii`, which commits a path outside
  ASCII and asserts it matches its owning glob, and `f9-notfound-heuristic`,
  which asserts a failing criterion whose output contains the words is reported
  failable.
- **Acceptance criterion:** `node -e "const{execFileSync:e}=require('child_process');const fs=require('fs');let o='';try{o=e(process.execPath,['drydock/scripts/drydock-audit.test.mjs'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch(x){process.exit(1)}const m=o.match(/([0-9]+)[/]([0-9]+) passed/);const s=fs.readFileSync('drydock/scripts/drydock-audit.test.mjs','utf8');process.exit(m&&m[1]===m[2]&&+m[2]>=138&&s.includes('f4-non-ascii')&&s.includes('f9-notfound-heuristic')?0:1)"`

  > The `try/catch` and `stdio` are not decoration. Without them the child's
  > failure text reaches this process's stderr, and F9 then reports this very
  > criterion as unrunnable. Do not simplify them away.

### Wave 1.2 - The documentation that describes them

#### T1.2.1 - Delete the claims the code does not support

- **Description:** Remove the statement that `audit-wave` "never consults the
  hook" from the two documentation files carrying it, since the audit reads
  `.drydock/enforcement.log`, which the hook writes. Resolve the wavecheck
  ordering contradiction between "stop early only on check 1 failure" and an
  empty-log BLOCK raised under check 2. Add one paragraph to the plugin README
  stating that a plan document is executed, not merely read.
- **Files owned:** `drydock/README.md`,
  `drydock/skills/wavecheck/SKILL.md`,
  `drydock/skills/planwright/reference/plan-format.md`
- **Depends on:** T1.1.1, T1.1.2, T1.1.3
- **Model / thinking:** Standard / default   **Executor:** drydock:executor
- **Context brief:** F3, F6, F8 and D7, D10 in this plan; the Wave 1.1 diff,
  which is what these files must now describe; `drydock/README.md` around line
  49; `plan-format.md` around line 85; `wavecheck/SKILL.md` lines 24 and 58 to
  64. **Pinned wording:** the README's statement of the Bash layer's ceilings
  must list that a gitignored write leaves no receipt, that a write-then-restore
  inside one command shows nothing, that attribution is "changed around this
  command" rather than "caused by it", that a backgrounded command finishes
  after the hook fires, **and the new one T1.1.2 introduces**, that a
  content-identical rewrite of an already-dirty path now reports as detected. It
  must **not** claim that a repeat write to an already-dirty file is missed,
  which T1.1.2 closed. The new README paragraph must contain the exact phrase
  `runs commands from the plan`.
- **Forbidden:** editing any `.mjs` file; renaming any skill; changing the
  wavecheck report heading format or the `enforcement active:` sentence, both
  regex-parsed out of committed plans; weakening the description of what the
  hook does prevent; adding an em dash (repo convention since 0.8.15);
  **introducing a new backticked lowercase token into any `SKILL.md`, or a
  fenced `${CLAUDE_PLUGIN_ROOT}` into `drydock/README.md`** — both are scanned
  by `drydock-audit.test.mjs` and either will fail the criterion below.
- **Acceptance criterion:** `node -e "const{execFileSync:e}=require('child_process');const fs=require('fs');try{e(process.execPath,['drydock/scripts/drydock-audit.test.mjs'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch(x){process.exit(1)}const r=fs.readFileSync('drydock/README.md','utf8'),p=fs.readFileSync('drydock/skills/planwright/reference/plan-format.md','utf8'),w=fs.readFileSync('drydock/skills/wavecheck/SKILL.md','utf8');process.exit(!r.includes('never consults the hook')&&!p.includes('never consults the hook')&&r.includes('runs commands from the plan')&&!w.includes('check-1 grounds')?0:1)"`

  > Runs T1.1.3's suite as the backstop for D10: these three files are scanned
  > by it, so a documentation edit can break a sibling's work from a file it
  > does not own. The `try/catch` and `stdio` are required for the reason given
  > under T1.1.3.

### Wave 1.3 - Fixes for the Wave 1.R rejection

> Added after approval (Deviation 7, D15, D16). Retry 1 of the escalation
> policy's 2. The two tasks own disjoint files and neither reads the other's.

#### T1.3.1 - Deny a write through a link that exists but does not resolve

- **Description:** In `resolveAncestry`, stop treating every `realpath` failure as "this path does not exist". When `realpath` throws but `lstat` succeeds, the entry exists and cannot be resolved (a dangling symlink or junction, a loop, an unreadable entry), so the hook must deny rather than climb past it and match the link's own lexical path. Add a regression case with a dangling link, and make each link-dependent case record its own skip when a box cannot create links.
- **Files owned:** `drydock/hooks/enforce-owns.mjs`, `drydock/hooks/enforce-owns.test.mjs`
- **Depends on:** T1.1.1
- **Model / thinking:** Complex / extended   **Executor:** drydock:executor
- **Context brief:** F1 and D15 in this plan, and the Wave 1.R verdict below (findings 1 and 2); `resolveAncestry` in `drydock/hooks/enforce-owns.mjs`; `drydock/hooks/enforce-owns.test.mjs`, especially the `f1-junction-escape` and `f1-leaf-symlink-escape` cases and their skip branches. **Measured by the orchestrator on this Windows box, unprivileged:** `mklink /J docs\dj site\nope` (target absent) succeeds, and the current hook ALLOWS both `docs/dj/x.ts` and `docs/dj` (exit 0) under `owns: ["docs/**"]`. The reviewer measured the POSIX twin: `docs/dangle.ts -> ../site/brandnew.ts` is allowed, and a write through it creates `site/brandnew.ts`. Runtime floor Node 20.17; CI runs 20, 22 and 24 on ubuntu and windows.
- **Forbidden:** everything forbidden to T1.1.1 still applies (no `lib/owns-match.mjs` edit, no exit-code or receipt-shape change, no dependency, no fail-closed on a MISSING config, no unbounded loop); weakening any existing case.
- **Implementation sketch:** in the `catch` around `realpathSync.native(current)`, call `lstatSync(current)`. If it succeeds, throw, so the outer `try` denies. Only when `lstat` itself fails with `ENOENT` (or `ENOTDIR`) does the walk climb. A false deny on an unreadable directory is acceptable and fails closed. Termination at the filesystem root is unchanged. New case named exactly `f1-dangling-link`: create a link whose target does not exist, a junction via `mklink /J` on Windows and `symlinkSync` elsewhere, and assert exit 2 for a path beneath it. Every link-dependent case reports its OWN skip line when links cannot be created, so a skip never stands in for two cases.
- **Acceptance criterion:** `node -e "const{execFileSync:e}=require('child_process');const o=e(process.execPath,['drydock/hooks/enforce-owns.test.mjs'],{encoding:'utf8'});const m=o.match(/enforce-owns: PASS, ([0-9]+) cases/);process.exit(m&&+m[1]>=33&&/ok +f1-dangling-link +exit=2 want=2/.test(o)?0:1)"`

  > Requires the dangling-link case to have actually RUN and been denied, not
  > skipped: a skip line does not carry `exit=2 want=2`.

#### T1.3.2 - Make the audit see a rename out of an unowned path

- **Description:** Add `--no-renames` to the three `git show -z --name-only` calls whose output is compared against `owns`, so a commit that renames a file out of an unowned path lists both sides instead of only the destination. Today a task owning `docs/**` can delete an unowned `site/s.ts` by `git mv`-ing it into `docs/` and pass the audit.
- **Files owned:** `drydock/scripts/drydock-audit.mjs`, `drydock/scripts/drydock-audit.test.mjs`
- **Depends on:** T1.1.3
- **Model / thinking:** Standard / default   **Executor:** drydock:executor
- **Context brief:** D16 in this plan and the Wave 1.R verdict below (finding 3); the three `show` call sites in `drydock/scripts/drydock-audit.mjs` that T1.1.3 changed to `-z` (search for `"-z"`). **Measured by the reviewer:** for a `git mv site/s.ts docs/s.ts` commit, `git show -z --name-only --format=` prints only `docs/s.ts`, and with `--no-renames` prints `docs/s.ts` and `site/s.ts`. `git log --diff-filter=R` over this repository's whole history is empty, so no sealed audit changes.
- **Forbidden:** everything forbidden to T1.1.3 still applies; changing any other git invocation; editing any `.md` file.
- **Implementation sketch:** one flag per call site. New case named exactly `r3-rename-out`: in a temp repo, commit a `git mv` of a file from an unowned path into an owned one, and assert the audit reports the unowned source path as outside `owns`.
- **Acceptance criterion:** `node -e "const{execFileSync:e}=require('child_process');const fs=require('fs');let o='';try{o=e(process.execPath,['drydock/scripts/drydock-audit.test.mjs'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch(x){process.exit(1)}const m=o.match(/([0-9]+)[/]([0-9]+) passed/);const s=fs.readFileSync('drydock/scripts/drydock-audit.test.mjs','utf8');process.exit(m&&m[1]===m[2]&&+m[2]>=139&&s.includes('r3-rename-out')?0:1)"`

### Wave 1.R - Quality review

#### T1.R.1 - Fresh-context quality review of Phase 1

- **Description:** Review the Phase 1 diff for correctness, conventions and edge
  cases, after wavecheck has already audited conformance. Pay particular
  attention to whether the F1 ancestor walk terminates on every path shape and
  can be defeated a second way, and whether the F3 content identity misses a
  same-size rewrite inside one mtime tick or mishandles a deleted path.
- **Files owned:** none. **The verdict is appended to this plan by the
  orchestrator after `rm .drydock/wave-owns.json`**, because the plan file is
  owned by no task and the armed hook denies writes to it.
- **Depends on:** T1.2.1, T1.3.1, T1.3.2
- **Model / thinking:** Judgment / extended   **Executor:** drydock:executor
- **Context brief:** the Phase 1 diff; this plan's *Findings & constraints* and
  Decision Log; `drydock/lib/owns-match.mjs` as read-only context. A junction
  created mid-wave is out of scope: resolution happens at write time, so it is
  covered by construction.
- **Acceptance criterion:** `node -e "const s=require('fs').readFileSync('docs/plans/006-external-review-repairs.md','utf8');process.exit(/Wave 1.R verdict, APPROVED, 20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]/.test(s)?0:1)"`

## Phase 2: Release

**Exit state:** 0.15.0 is published with the findings described, the site badge
and root README match `plugin.json`, and the installed plugin can be updated to
load the repaired hooks.
**Phase gate:** `npm run verify` in `site/` exits 0 + human approval.
**Phase gate: OPEN.**

### Wave 2.1 - Cut 0.15.0

#### T2.1.1 - Bump to 0.15.0 and write the release notes

- **Description:** Set the plugin version to `0.15.0`, write the CHANGELOG entry
  describing each finding and what was done about it, and update the two
  hand-copied version references so the site's drift gate stays green. The entry
  states plainly that the repaired hooks are unexercised by any host session
  until the plugin is reinstalled (D6), and that F7 was deferred.
- **Files owned:** `drydock/.claude-plugin/plugin.json`,
  `drydock/CHANGELOG.md`, `README.md`, `site/content/copy.ts`
- **Depends on:** T1.R.1
- **Model / thinking:** Standard / default   **Executor:** drydock:executor
- **Context brief:** D2, D6, D11 and every finding in *Findings & constraints*;
  the Phase 1 diff; the existing CHANGELOG entries for 0.13.0 and 0.14.0 as the
  house style; `site/scripts/assert-copy.mjs` lines 211 to 248 for what the
  drift check requires, **including that the repository-root `README.md` must
  contain the literal `v0.15.0`** (its status line at line 11 currently reads
  `v0.14.0`). Note that `README.md` here is the **repository root** readme, not
  `drydock/README.md`, which belongs to T1.2.1.
- **Forbidden:** editing any file under `drydock/hooks/`, `drydock/scripts/` or
  `drydock/skills/`; claiming any fix was verified in a live host session;
  rewriting an older CHANGELOG entry; adding an em dash or a double hyphen to
  page copy.
- **Acceptance criterion:** `node -e "const fs=require('fs'),v='0.15.0';const p=JSON.parse(fs.readFileSync('drydock/.claude-plugin/plugin.json','utf8')).version,c=fs.readFileSync('site/content/copy.ts','utf8'),g=fs.readFileSync('drydock/CHANGELOG.md','utf8'),r=fs.readFileSync('README.md','utf8');process.exit(p===v&&c.includes(JSON.stringify(v))&&g.includes('## '+v)&&r.includes('v'+v)?0:1)"`

### Wave 2.2 - Correct the release note's provenance

> Added after wavecheck 2.1 (Deviation 8, D17). One task; the wave exists only
> because the CHANGELOG cannot be owned twice in Wave 2.1.

#### T2.2.1 - Credit each Phase 1 finding to the review that found it

- **Description:** In the `## 0.15.0` CHANGELOG entry only, correct the two sentences that credit "the re-review" with the dangling-link and `--no-renames` findings: both came from the first Wave 1.R quality review, which rejected Phase 1; the re-review approved it and raised only the findings the entry already lists as "carried forward from the re-review". Replace "released as" the plan path with wording that says the repairs shipped as 0.15.0 via plan 006, and do not break an inline code span across a line.
- **Files owned:** `drydock/CHANGELOG.md`
- **Depends on:** T2.1.1
- **Model / thinking:** Mechanical / off   **Executor:** drydock:executor
- **Context brief:** D17 and Deviation 8 in this plan; both `## Wave 1.R verdict` sections of this plan, which are the record of which review found what; the `## 0.15.0` entry of `drydock/CHANGELOG.md`.
- **Forbidden:** editing any other CHANGELOG entry; changing any claim in the entry other than the provenance wording and the "released as" phrase; adding an em dash or a spaced double hyphen.
- **Acceptance criterion:** `node -e "const g=require('fs').readFileSync('drydock/CHANGELOG.md','utf8');const a=g.indexOf('## 0.15.0'),b=g.indexOf('## 0.14.0');const s=g.slice(a,b);process.exit(a>=0&&b>a&&!s.includes('re-review then found')&&!s.includes('re-review that found')&&!s.includes('released as')&&s.includes('first quality review')?0:1)"`

## Deviation Log

| # | Task | What deviated | Why | Impact | Recorded |
|---|---|---|---|---|---|
| 1 | T0 | T0's checkpoint commit `54b1c0c` contains `docs/plans/006-external-review-repairs.md`, which is outside its `owns`, and `task-close` warned about it. | T0's deliverable is the Baseline table, which lives in the plan file, and the plan file is owned by no task by design. The warning is correct in general and unavoidable here. | None on any gate: T0 sits under `## Phase 0` with no `### Wave` heading, so no `audit-wave` run covers it. Recorded rather than suppressed because the warning is real and a future reader will see it in the manifest. | orchestrator, 2026-09-21 |
| 2 | Wave 1.1 | The wave was armed and executed with frontmatter `status: APPROVED`; the contract requires `EXECUTING` before a wave runs. | Orchestrator omission: T0 set APPROVED and the transition was never made when `wave-start` ran. `wave-start` does not check it. | None on the work; the status is now derived by `plan-status --write` from this wave's report. `discovered-by-wavecheck`. | wavecheck 1.1, 2026-09-21 |
| 3 | T1.1.1, T1.1.2, T1.1.3 | Took three spawn rounds. Round 1 (Opus) was killed by an account rate limit after four tool calls each; T1.1.1's partial edit was reverted by the orchestrator. Round 2 was interrupted by the user and left T1.1.1's work uncommitted again. Round 3's T1.1.1 executor inherited that work, audited it against the task block, re-proved the regression guard against the original line 213, and committed it as the sole T1.1.1 commit. | External interruptions, not task failures. | None on attribution: exactly one commit per task, each within `owns`. T1.1.1's authorship is split across two executor contexts, stated here rather than implied away. | wavecheck 1.1, 2026-09-21 |
| 4 | T1.1.1, T1.1.2 | Complex-tier tasks ran on Sonnet, not Opus. | Chosen after the Opus round exhausted the usage window. The rubric permits it: Complex is "Sonnet + extended thinking, or Opus". | None on the plan's contract. Recorded so the model actually used is on the record. | wavecheck 1.1, 2026-09-21 |
| 5 | T1.1.3 | T1.1.3 ran after T1.1.1 and T1.1.2 rather than concurrently. | The orchestrator's spawn message was cut off mid-stream and the third spawn was lost; it was issued separately. | None: the three tasks share no files, and the audit's per-commit attribution is order-independent. The wave is still "genuinely parallel" in structure, not in this run's timing. | wavecheck 1.1, 2026-09-21 |
| 6 | Wave 1.1 | Found **F10**, pre-existing and out of this wave's scope: the ownership hook DENIES a write to a path on a different drive (`Z:/nope/x.ts`, `D:/x.ts`) rather than allowing it as "outside the repo", because `path.relative` across Windows drives returns the absolute target, which does not start with `../`. Measured identical in the pre-plan hook (`a439b08`) and the repaired one. | Discovered while re-running the F1 reproduction against the repaired hook. | Not a regression and not a security hole: it fails closed. It does contradict the documented "outside the repo is not enforced" ceiling. Added to *Out of scope*; T1.R.1 is told about it. `discovered-by-wavecheck`. | wavecheck 1.1, 2026-09-21 |
| 7 | Phase 1 structure | Wave 1.3 (T1.3.1, T1.3.2) added after the plan was approved, and T1.R.1 now depends on it. | The Wave 1.R quality review REJECTED Phase 1 on a confirmed MAJOR finding (a dangling link still escapes the ownership hook) and raised a second MAJOR finding in the audit (D15, D16). | Scope grows by two tasks. No completed wave, task id or report changes. Recorded because it changes an approved plan without `/drydock:replan`: the contract offers "a targeted fix task appended" as a remediation that does not require replan, and plan 004 did the same. | orchestrator, 2026-09-21 |
| 8 | Phase 2 structure | Wave 2.2 (T2.2.1) added after wavecheck 2.1: the 0.15.0 CHANGELOG entry attributes two Wave 1.R findings to "the re-review" instead of the first review, and says the repairs were "released as" the plan path. | Found by the auditor reading the entry for accuracy; no mechanical criterion covered provenance wording. | One more small task and gate. No completed task or report changes. `discovered-by-wavecheck`. | wavecheck 2.1, 2026-09-21 |

## Wavecheck reports

### Wavecheck 1.1, PASS, 2026-09-21

Execution is `fleet`: each task ran as a spawned `drydock:executor`, and this audit was performed by the orchestrating session, which wrote none of the Wave 1.1 diff.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS, with a logged lapse | `format_version: 3` supported; wave 1.1 exists; no prior wave (T0 is Phase 0, unwaved). Frontmatter read `APPROVED`, not `EXECUTING`, during the wave: Deviation 2, `discovered-by-wavecheck`, corrected below by `plan-status --write`. |
| 2. Ownership | PASS | `audit-wave 1.1: PASS (3 task(s), 3 commit(s), attribution: manifest)`, table below. Working tree clean. |
| 2b. Enforcement ran | PASS | `enforcement active: 20 hook decision(s) recorded for wave 1.1 (1 denied)`. The one denial is the orchestrator's deliberate liveness probe (`docs/hook-liveness-probe.txt`), which answers the repo's open A9 question in the affirmative for this session: the installed hook is registered and denies. Bash layer: 61 commands observed, 0 writes detected outside `owns`. Caveat, D6: the hook that enforced this wave is the installed, UNREPAIRED 0.14.0 copy. |
| 3. Forbidden | PASS | `lib/owns-match.mjs` and every package manifest untouched; no `process.exit` or receipt-field line changed in `enforce-owns.mjs`; detector adds no non-zero exit, no `tool_input.command` read, no ignored-file scan; audit script leaves `enforcement active:`, `SUPPORTED_FORMAT_VERSIONS` and `REQUIRED_SECTIONS` alone and does not use `core.quotepath`. The new ancestor walk (`resolveAncestry`, enforce-owns.mjs:218) terminates on `parent === current`. No `.md` edited by T1.1.3. |
| 4. Acceptance | PASS | Each criterion re-run by the auditor from the plan text: T1.1.1 exit 0 (`enforce-owns: PASS, 32 cases`), T1.1.2 exit 0 (`detect-bash-writes: PASS, 18 cases`), T1.1.3 exit 0 (`138/138 passed`). Independently, the original F1 reproduction against the repaired hook: `docs/jn/a.ts`, `docs/jn/new/deep.ts` and `docs/jn/a/b/c/d.ts` all exit 2 (the middle one was exit 0 at baseline); `docs/real/ok.ts` exit 0. All three executors report watching their new cases fail against the pre-fix code. |
| 5. Deviations | PASS | Executor-reported deviations logged (3, the inherited T1.1.1 work). Discovered by wavecheck: Deviations 2 and 6. Process deviations 4 and 5 logged. |

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.1.1 | `6143bac` | `drydock/hooks/enforce-owns.mjs`<br>`drydock/hooks/enforce-owns.test.mjs` | `drydock/hooks/enforce-owns.mjs`<br>`drydock/hooks/enforce-owns.test.mjs` | none |
| T1.1.2 | `72a9d39` | `drydock/hooks/detect-bash-writes.mjs`<br>`drydock/hooks/detect-bash-writes.test.mjs` | `drydock/hooks/detect-bash-writes.mjs`<br>`drydock/hooks/detect-bash-writes.test.mjs` | none |
| T1.1.3 | `3438442` | `drydock/scripts/drydock-audit.mjs`<br>`drydock/scripts/drydock-audit.test.mjs` | `drydock/scripts/drydock-audit.mjs`<br>`drydock/scripts/drydock-audit.test.mjs` | none |

**Unproven, stated so a PASS does not imply it:** the repaired hooks passed their suites and a direct reproduction, but no host session has loaded them (D6). That needs the 0.15.0 release and a reinstall.

Deviations logged: 6 (2 discovered by wavecheck)

### Wavecheck 1.2, PASS, 2026-09-21

Execution is `fleet`; audited by the orchestrating session, which wrote none of this diff.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `status: EXECUTING`; wave 1.2 exists; prior wave 1.1 has a PASS report. Staleness: `git diff fdb862d..HEAD` over the three owned files was empty before arming. |
| 2. Ownership | PASS | `audit-wave 1.2: PASS (1 task(s), 1 commit(s), attribution: manifest)`, table below. Working tree clean. |
| 2b. Enforcement ran | PASS | `enforcement active: 6 hook decision(s) recorded for wave 1.2 (0 denied)`. Bash layer: 25 commands observed, 0 writes detected outside `owns`. As in 1.1, the enforcing hook is the installed 0.14.0 copy (D6). |
| 3. Forbidden | PASS | No `.mjs` in the commit; no skill renamed; no line touching `### Wavecheck` or `enforcement active:` changed; 0 em dashes and 0 prose double hyphens added; the audit suite's vocabulary and plugin-root scans pass (138/138), so no undefined backticked token and no fenced placeholder was introduced. The hook's prevention is described no more weakly than before. The one new factual claim, that the receipt is read "when the plan declares `enforcement: required`", was checked against the code: `drydock-audit.mjs:1412` gates the read on exactly that. |
| 4. Acceptance | PASS | Criterion re-run by the auditor: exit 0. |
| 5. Deviations | PASS | Executor reported none; none discovered. |

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.2.1 | `53349e1` | `drydock/README.md`<br>`drydock/skills/planwright/reference/plan-format.md`<br>`drydock/skills/wavecheck/SKILL.md` | `drydock/README.md`<br>`drydock/skills/wavecheck/SKILL.md`<br>`drydock/skills/planwright/reference/plan-format.md` | none |

**Unproven, stated so a PASS does not imply it:** `wavecheck/SKILL.md` was edited, and this very gate ran from the installed 0.14.0 copy of that skill, which cannot contain the edit. Per CLAUDE.md, the edit is shipped and mechanically gated but unexercised until a release is installed and a later session runs it.

Deviations logged: 0 (0 discovered by wavecheck)

## Wave 1.R verdict, REJECTED, 2026-09-21

Fresh-context review, Opus, of `a439b08..53349e1`. Rejected on one confirmed MAJOR finding in the Phase 1 diff. Every new regression case was confirmed to fail against the pre-fix code; none passes vacuously. F2, F3, F4 and F9 behave as intended under measurement, the F1 walk terminates on every path shape tried (drive root, nonexistent drive, UNC, extended-length and device paths, alternate data streams, trailing dot and space), and Phase 1 did not make F10 worse.

1. **MAJOR, confirmed.** A dangling link as a path component still escapes the ownership hook: `resolveAncestry` treats any `realpath` throw as "does not exist" and climbs past it. POSIX: `docs/dangle.ts -> ../site/brandnew.ts` allowed, and a write through it created `site/brandnew.ts`. Windows, unprivileged: a dangling junction `docs/dj -> site/nope` allowed. Not a regression, but it is the case F1 names and the new code comment claims closed. **T1.3.1.**
2. **MINOR, confirmed.** `f1-leaf-symlink-escape` targets a junction to a directory rather than a file symlink, and when links cannot be created one skip stands in for two cases. **T1.3.1.**
3. **MAJOR, confirmed, pre-existing.** `audit-wave` and `task-close` cannot see a rename out of an unowned path, because `git show` without `--no-renames` lists only the destination; this falsifies `plan-format.md`'s "sees everything a commit carries". **T1.3.2** (D16).
4. to 6. **MINOR or NIT, pre-existing:** moved to *Out of scope / follow-ups*.

### Wavecheck 1.3, PASS, 2026-09-21

Execution is `fleet`; audited by the orchestrating session, which wrote none of this diff.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `status: EXECUTING`; wave 1.3 exists (added under Deviation 7); prior waves 1.1 and 1.2 have PASS reports. |
| 2. Ownership | PASS | `audit-wave 1.3: PASS (2 task(s), 2 commit(s), attribution: manifest)`, table below. Working tree clean. T1.3.1 and T1.3.2 re-own files first owned in Wave 1.1, which the contract permits as a sequential handoff. |
| 2b. Enforcement ran | PASS | `enforcement active: 10 hook decision(s) recorded for wave 1.3 (0 denied)`. Bash layer: 34 commands observed, 0 writes detected outside `owns`. Enforcing hook is still the installed 0.14.0 copy (D6). |
| 3. Forbidden | PASS | No `process.exit` or receipt-field line changed in `enforce-owns.mjs`; `lib/owns-match.mjs` untouched. In the audit script exactly three lines of code changed, each adding `--no-renames` to a `show -z --name-only` call, plus comments; no other git invocation touched, no verdict string or format constant changed, no `.md` edited. |
| 4. Acceptance | PASS | Re-run by the auditor: T1.3.1 exit 0 (`enforce-owns: PASS, 33 cases`, with `ok   f1-dangling-link   exit=2 want=2`, so the case ran rather than skipped); T1.3.2 exit 0 (`139/139 passed`). Wave 1.1 and 1.2 criteria re-run as a regression check: all four still exit 0. Independently, the reviewer's reproduction against the repaired hook: a dangling junction `docs/dj -> site/nope` now denies `docs/dj`, `docs/dj/x.ts` and `docs/dj/a/b.ts` (all exit 0 before), while a write into a not-yet-created owned directory, `docs/fine/new.ts`, is still allowed, so the fix does not over-deny ordinary new files. The original F1 path `docs/jn/new/deep.ts` still exits 2. Both executors report watching their new case fail against the pre-change code. |
| 5. Deviations | PASS | Executors reported none; none discovered. The wave's own existence is Deviation 7. |

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.3.1 | `adf1d27` | `drydock/hooks/enforce-owns.mjs`<br>`drydock/hooks/enforce-owns.test.mjs` | `drydock/hooks/enforce-owns.mjs`<br>`drydock/hooks/enforce-owns.test.mjs` | none |
| T1.3.2 | `097a24f` | `drydock/scripts/drydock-audit.mjs`<br>`drydock/scripts/drydock-audit.test.mjs` | `drydock/scripts/drydock-audit.mjs`<br>`drydock/scripts/drydock-audit.test.mjs` | none |

**Not exercised here, stated so a PASS does not imply it:** the non-Windows leaf-file-symlink case T1.3.1 added is guarded to POSIX and runs only on CI's ubuntu runners; the "box permits no links" skip branches were verified by reading, not by execution, since this box can create junctions.

Deviations logged: 0 (0 discovered by wavecheck)

## Wave 1.R verdict, APPROVED, 2026-09-21 (re-review after Wave 1.3)

A second fresh-context reviewer (Opus, not the one that rejected) reviewed `a439b08..097a24f`. No confirmed BLOCKER or MAJOR. Retry 1 of the escalation policy's 2 was sufficient.

**Prior findings, verified fixed by measurement.** A dangling junction `docs/dj -> site/nope` is now denied for `docs/dj`, `docs/dj/x.ts` and deeper paths, and a junction loop is denied too (both allowed at `a439b08`). The current enforce-owns suite fails 3 of 33 against the `a439b08` hook and 1 of 33 against the pre-`adf1d27` hook, so the new cases are real guards. `--no-renames` surfaces `site/s.ts` for a committed `git mv site/s.ts docs/s.ts` even with `diff.renames=copies` configured. **No over-denial found:** new files in new owned directories, existing files, an exclusively-locked file, a parent that is a regular file, a ~600-character path, `..` segments, case variants, junctions resolving to owned locations, stream and reserved names all behave exactly as before `adf1d27`. Suites: enforce-owns 33, detector 18, audit 139/139.

**Raised, none rejection-grade, all carried to *Out of scope / follow-ups*:**
1. MINOR, confirmed, in Phase 1 code: the detector's rename parse keys on the FIRST status character, so a working-tree rename (`" R"`, after `mv` plus `git add -N`) still has its old path sliced: measured `e/abcdef.ts`. Still detected, and the audit's dirty-tree check still catches it, but the receipt names a nonexistent path.
2. NIT: the F9 comment claims a criterion that ran and failed is "never" unrunnable; `grep -q X missing.md` still scores unrunnable because "No such file" is its first stderr line. Behaviour pre-dates Phase 1; only the comment overstates.
3. NIT, pre-existing shape: a deny raised by a throw (including the new "exists but does not resolve") writes no receipt.
4. Noted: a hard link (`mklink /H`, unprivileged) is followed; no document claims links of that kind are covered.
5. **SUSPECTED, possibly MAJOR, not measurable here:** on a volume where `realpathSync.native` fails while `lstat` succeeds (some SMB shares, RAM disks, virtual filesystems), the new branch would deny every write in an armed wave, where before it climbed and allowed. Fails closed, so an availability risk rather than an escape; the documented unwedge (`rm .drydock/wave-owns.json`) applies.
6. SUSPECTED, pre-existing, POSIX only: `..` after a symlink is collapsed textually by `path.resolve` but through the link by the kernel, so `docs/esc/../site/x.ts` could match as owned and land in `site/` if the host passes the path unnormalised. Cannot escape on Windows.

### Wavecheck 2.1, PASS, 2026-09-21

Execution is `fleet`; audited by the orchestrating session, which wrote none of this diff.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `status: EXECUTING`; wave 2.1 exists; every Phase 1 wave has a PASS report and the Phase 1 gate is CLOSED. Staleness: the four owned files were unchanged since `fdb862d`. |
| 2. Ownership | PASS | `audit-wave 2.1: PASS (1 task(s), 1 commit(s), attribution: manifest)`, table below. Working tree clean. |
| 2b. Enforcement ran | PASS | `enforcement active: 4 hook decision(s) recorded for wave 2.1 (0 denied)`. Bash layer: 10 commands, 0 writes detected outside `owns`. |
| 3. Forbidden | PASS, one finding | No file under `drydock/hooks/`, `drydock/scripts/` or `drydock/skills/` in the commit; no older CHANGELOG entry touched; `copy.ts`, root `README.md` and `plugin.json` each changed one line, the version only; no em dash in the new entry, and its three `--` occurrences are CLI flag names in code spans, not spaced punctuation. No claim of live host verification: the entry states the opposite. **Finding, not a forbidden item:** the entry twice credits "the re-review" with findings the first Wave 1.R review made, and says the repairs were "released as" the plan path. Remediation (a), a targeted fix task: Wave 2.2, D17, Deviation 8. |
| 4. Acceptance | PASS | Criterion re-run by the auditor: exit 0. Executor reports `npm run verify` green, ending `assert-copy: PASS ... version matches plugin.json` and `assert-matrix: PASS`; re-run independently at the Phase 2 gate. |
| 5. Deviations | PASS | Executor reported none; one discovered (Deviation 8). |

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T2.1.1 | `b26dc1a` | `README.md`<br>`drydock/.claude-plugin/plugin.json`<br>`drydock/CHANGELOG.md`<br>`site/content/copy.ts` | `drydock/.claude-plugin/plugin.json`<br>`drydock/CHANGELOG.md`<br>`README.md`<br>`site/content/copy.ts` | none |

Deviations logged: 1 (1 discovered by wavecheck)

## Progress log

| Date | Task | Result | Notes |
|---|---|---|---|
| 2026-09-21 | T0 | done | `54b1c0c`, baseline recorded, index row added |
| 2026-09-21 | T1.1.1 | done | `6143bac`, junction escape closed, suite runnable on Windows (32 cases) |
| 2026-09-21 | T1.1.2 | done | `72a9d39`, rename parse and repeat-write detection (18 cases) |
| 2026-09-21 | T1.1.3 | done | `3438442`, NUL-delimited paths, not-found heuristic, execPath quoting (138/138) |
| 2026-09-21 | Wave 1.1 | PASS | wavecheck |
| 2026-09-21 | T1.2.1 | done | `53349e1`, four false claims corrected, F6 paragraph, Bash ceilings listed |
| 2026-09-21 | Wave 1.2 | PASS | wavecheck |
| 2026-09-21 | T1.R.1 | REJECTED | one MAJOR in the diff, one MAJOR pre-existing; Wave 1.3 added |
| 2026-09-21 | T1.3.1 | done | `adf1d27`, dangling links denied, per-case skips (33 cases) |
| 2026-09-21 | T1.3.2 | done | `097a24f`, `--no-renames` on the three audit call sites (139/139) |
| 2026-09-21 | Wave 1.3 | PASS | wavecheck |
| 2026-09-21 | T1.R.1 | APPROVED | re-review after Wave 1.3; Phase 1 gate closed |
| 2026-09-21 | T2.1.1 | done | `b26dc1a`, 0.15.0 bumped in four files, CHANGELOG entry, `npm run verify` green |
| 2026-09-21 | Wave 2.1 | PASS | wavecheck; provenance finding, Wave 2.2 added |

## Reconcile report
