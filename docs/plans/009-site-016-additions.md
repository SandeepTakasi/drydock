---
plan: 009-site-016-additions
format_version: 3
status: EXECUTING
isolation: none
enforcement: required
attribution: manifest
lane: full
execution: fleet
created: 2026-10-07
approved_by: Sandeep Takasi
---

# 009 - The homepage learns 0.16.0, claiming only what ran

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

**Before T0, a human step (D6).** Install 0.16.0 and start a NEW session to
execute this plan; the executing session must not be one that was open before
the install, or every skill it runs is the 0.15.1 copy:

```bash
claude plugin marketplace update drydock && claude plugin update drydock@drydock
```

**Ownership enforcement (arm before every wave):**

```bash
node drydock/scripts/drydock-audit.mjs wave-start docs/plans/009-site-016-additions.md <wave>
# ... the wave's executors run ...
node drydock/scripts/drydock-audit.mjs audit-wave docs/plans/009-site-016-additions.md <wave>
rm .drydock/wave-owns.json
```

With 0.16.0 installed, the repo copy and the installed copy are the same
version, so no VERSION DRIFT banner is expected; one is a T0 failure.

**Orchestrator bookkeeping (CLAUDE.md, plans 005-008):** set `status: EXECUTING`
and this plan's `docs/plans/README.md` row in the commit before the first
`wave-start`; write this plan file only while no wave is armed and commit it
before the next `wave-start`; spawn executors **one at a time** (D2); a review
rejection is repaired in a new wave with new task ids; edit owned files with
Write/Edit, never Bash. Paste the audit's `enforcement active: ...` sentence into
every wavecheck report **verbatim** (plan 008 deviation 5), and write closed
gates exactly as `**Phase gate: CLOSED, approved by <name> - <date>.**`.

**Staleness check (before every wave):**
`git diff <baseline SHA>..HEAD -- <wave's owned files>`. Non-empty only from
this plan's own earlier task commits is a handoff, not drift: re-locate anchors
and keep the baseline (plan 008 reconcile R6). Anything else → re-validate and
update the baseline and Decision Log before executing.

## Requirement

The homepage at `site/` describes the plugin as of 0.15.x. Make it describe
0.16.0's additions, claiming as verified only what a live session has run:
`/drydock:check` and planwright's learnings step are exercised in this plan and
recorded in `docs/compatibility.md` before any copy names them; the wave-order
lock and the CI corpus re-audit are described as mechanics; the lifecycle lists
the two shipped skills it omits (`check`, `init`). The page publishes no token
or cost figure, and reconcile's token step stays off it until a reconcile has
run it.

## Spec reference

none, requirement is complete. Background: plan 008's Reconcile report
(§ Token usage, R5) and CLAUDE.md "Honesty rule for site copy".

## Surgical-scope statement

Two live exercises recorded as two new rows in `compatibility.md` with their
`verification-log.md` entries; then one copy edit in `site/content/copy.ts` with
its `assert-copy.mjs` pins, and a one-class layout fix in `Lifecycle.tsx`. No
plugin code, no release, no new dependency, no flow-strip change.

## Baseline

_Filled by T0, 2026-10-07._

| Item | Value |
|---|---|
| Commit SHA | `9276d74` (`9276d74feb3b3c1c4e15686ef57262626fb78400`) |
| Installed plugin version (and no VERSION DRIFT) | 0.16.0 (`installed_plugins.json` gitCommitSha `9276d74`, lastUpdated 2026-10-07T02:04Z); `validate-plan` banner `drydock-audit.mjs v0.16.0`, no VERSION DRIFT |
| `drydock:check` in this executing session's own skill list (the session started after the install) | Yes, `drydock:check` and `drydock:init` are both listed (orchestrator's statement; no command can see it). Both are listed with no description text |
| Untracked files outside `docs/plans/` | none (`git ls-files --others --exclude-standard` lists only this plan) |
| `verify.yml` conclusion on `9276d74` (plan 008's push) | success, run 37559496362 (read from the public GitHub API without auth, since `gh` returns 401); `deploy.yml` success, run 37559496367 |
| `node drydock/scripts/drydock-audit.test.mjs` | 154/154 passed |
| `node site/scripts/assert-matrix.mjs` | FAIL (1) before T0, only "no row for 009-site-016-additions.md"; after T0's README row: PASS, 10 matrix rows |
| `cd site && npm run verify` | build, tsc, eslint and assert-copy PASS (22 literals); assert-matrix failed only on the same missing row |

## Practices in effect

| Practice | Value | Source |
|---|---|---|
| Honesty | `compatibility.md` is the source of truth for every verification claim on the page; no PENDING row promoted; no benchmark without evidence | CLAUDE.md "Honesty rule" |
| Quality gates | `npm run verify` in `site/` (build, tsc, eslint, assert-copy, assert-matrix); the plugin suites | CLAUDE.md, `verify.yml` |
| Evidence | one `## <id> — <title>` entry per run in `verification-log.md`, raw output verbatim, cited from the row as `verification-log.md#<anchor>` | `verification-log.md` header, `assert-matrix.mjs` check 2 |
| Commits | one per task, owned files only, then `task-close` (`attribution: manifest`) | CLAUDE.md |
| Execution | fleet, executors one at a time | user, D2 |
| Human gate | the rendered page, approved by name and date, before any push (a push to `main` touching `site/**` deploys) | user, D17; ADR 0003 |
| Acceptance criteria | run through `cmd.exe` here and `/bin/sh` in CI: no backslashes, character classes, quote parentheses, suite stderr suppressed | CLAUDE.md, plan 008 G1 |
| Copy style | no em-dash inside any new on-page string | plan 001 deviation 16 (convention, not machine-checked) |
| Tracker | none | plans 005-008 |

## Findings & constraints

- **Skills load from the installed plugin at session start** (CLAUDE.md). 0.16.0
  is already installed (cache `0.16.0/`, `installed_plugins.json` lastUpdated
  2026-10-07T02:04Z, verified by the pressure test), but the session that
  drafted this plan predates it and has no `drydock:check`. What remains is a
  NEW session (D6); T0 records that the executing session lists `drydock:check`.
- **`check` counts every untracked, non-ignored file as changed.** One stray file
  turns T1.1.1's exact `check: FLAG (1)` / `check: PASS` outputs into an
  unpassable criterion, so T0 requires no untracked file outside `docs/plans/`.
- **The ownership hook exempts nothing under `.drydock/`** except reading its own
  config: a task that writes `.drydock/check.md` must own it.
- **`check` excludes `.drydock/` from its changed set**, so the intent file is
  never itself flagged; an untracked file outside the owned globs is.
- **`assert-matrix.mjs` check 2** treats a row whose notes contain
  `verification-log.md#` as citing an entry, and fails unless a top-level
  `## <id>` heading exists in `verification-log.md`. Entries are `## <id> — <title>`
  with `###` subsections (plan 004 deviation 9: grep `## A10`, never `####`).
  The order is NOT simply newest first: A1-A5 run ascending from the header,
  then A9, A8, A7, A6 form a newest-first block. A10 goes immediately above
  `## A9`, A11 immediately above `## A10`.
- **The evidence status pill is CSS-uppercased** (`Evidence.tsx` line 28), and
  page statuses are normalised from compat cells: A7's `OBSERVED — two full runs`
  renders as `OBSERVED, TWO FULL RUNS`.
- **The page's evidence matrix is a curated subset** of `compatibility.md` rows
  (`evidence.rows` in `copy.ts`; A8 and A9 are not on it). Each row mirrors its
  compat row's status words.
- **Lifecycle layout is tuned to seven cards.** `Lifecycle.tsx` gives every
  last card `last:col-span-full`. Seven cards leave an orphan on 2 and 3 columns,
  so spanning is right; nine cards fill three columns exactly, and the same
  class would push card 9 onto a full-width row of its own at `lg`. On 2 columns
  nine still leaves an orphan, so the span stays below `lg`. Its header comment
  says "seven pieces" twice and must stay true (plan 001 deviation 47).
- **The flow strip highlights by index** (`i === 3` is `wavecheck`), so
  inserting `init` at its head would move the highlight (D7).
- **`assert-copy.mjs` pins the seven piece names** as required literals; a
  literal like `check` or `init` is satisfied by unrelated prose, so the pins
  must be `/drydock:check` and `/drydock:init`.
- **`learnings` run on this plan's owned files** (repo copy, by hand: the
  installed 0.15.1 planwright has no such step) returned the constraints above
  from plan 001 deviations 16, 39 and 47 and plan 004 deviation 9; none other
  applied.
- **The CI result for plan 008's push is unknown here** (`gh` unauthenticated,
  HTTP 401). `deploy.yml` evidently ran (the live page reads `v0.16.0`,
  last-modified 01:57 UTC). T0 records `verify.yml`'s conclusion; the
  wavecheck sentence in T2.1.1's copy claims CI behaviour and needs it green.
- **`drydock-stats` output tokens are a lower bound** (plan 008 reconcile):
  any token figure on the page would publish a known-wrong number (D3).

## Decision Log

| # | Question | Decision | Decided by | Rationale |
|---|---|---|---|---|
| D1 | Lane? | `full` | user | Exercises must precede copy, so two phases; small lane allows one wave. |
| D2 | Execution? | fleet, executors spawned one at a time | user | As plans 006-008. |
| D3 | Token or cost numbers on the page? | None; fixing `drydock-stats`'s output column is a later plan | user | The output column is a known undercount (plan 008 R5), and one plan is one data point (plan 008 D4). Consumed by T2.1.1, T2.R.1. |
| D4 | Lifecycle pieces? | Add `check` and `init`; heading "Nine pieces, one contract"; pins `/drydock:check`, `/drydock:init`, `Nine pieces` | user | `init` shipped in 0.14.0 and never reached the page; the literal list is what keeps a piece from going quiet. Consumed by T2.1.1, T2.1.2. |
| D5 | Which 0.16.0 skill changes may the page claim? | `check` and planwright's learnings step, each after its live run is recorded; reconcile's token step stays off the page until a reconcile has run it | user | Only exercised behaviour is claimed. Consumed by T1.1.1, T1.2.1, T2.1.1. |
| D6 | How do skills get exercised at all? | A human installs 0.16.0 and starts a new session before T0; T0 fails on VERSION DRIFT or a missing installed `check` skill | planner, from CLAUDE.md | A same-session exercise of a skill not loaded at session start proves nothing. Consumed by T0. |
| D7 | Change the flow strip? | No | planner (assumed, flag if wrong) | `init` runs once per repo and `check` is the no-plan path; neither is a step of the plan lifecycle the strip draws, and the strip highlights by index. |
| D8 | How is `check` exercised? | Through `/drydock:check` on this task's own real work (writing the A10 record), with a designed-to-fail run first: an untracked probe file outside the owned globs must produce `FLAG outside scope`, then the probe is removed and a second run must PASS | planner (assumed, flag if wrong) | Real work, both verdicts observed, nothing invented. The probe is owned by the task so the hook allows it. Consumed by T1.1.1. |
| D9 | How is planwright's learnings step exercised? | Invoke the installed `drydock:planwright` on a real deferred item (plan 008 Q1, `plan-status` reading the latest review verdict), with interview answers supplied in the brief, and STOP after Step 2; no plan file is written. Record the learnings command it ran and the Findings it produced | planner (assumed, flag if wrong) | The step under test is inside Step 2; running the whole skill would write a plan nobody asked for. A partial run is recorded as partial. Assumes a subagent can invoke a skill; if it cannot, T1.2.1 is BLOCKED, not improvised. Consumed by T1.2.1. |
| D10 | What status words do the new rows carry? | Whatever was observed, written by the executor that observed it; the criterion requires the evidence lines, not the word PASSED. On the page, the status is the compat cell normalised: markdown stripped, em dash replaced by a comma, uppercased | planner; normalisation after pressure test P6 | A criterion that demanded PASSED would reward overstating a partial run. The pill is CSS-uppercased and the page convention already rewrites cells (A7). Consumed by T1.1.1, T1.2.1, T2.1.1, TG4. |
| D11 | Lifecycle layout for nine? | Keep the last-card span below `lg`, cancel it at `lg` (`lg:last:col-span-1`) | planner | Nine fills 3 columns exactly and leaves one orphan on 2. Consumed by T2.1.2. |
| D12 | Evidence rows on the page? | Add A10 and A11, status copied verbatim from their compat rows | planner (assumed, flag if wrong) | The matrix is where the page makes verification claims; a lifecycle description is not one. Consumed by T2.1.1. |
| D13 | Quality review? | Wave 2.R only (Opus, fresh context): copy against `compatibility.md`, layout, pins. Phase 1's records are checked by **reproduction** at wavecheck: 1.1 re-runs `drydock-audit.mjs check .drydock/check.md` and compares with the recorded PASS line; 1.2 re-runs the recorded `learnings` command and diffs its output against the entry; each also reads the executor's subagent transcript for the skill invocation | planner, after pressure test P3 | Wavecheck audits diffs, criteria and deviations, never transcripts, and the T1.x criteria only check that strings are present, so fabricated output would pass. Reproduction makes it checkable. |
| D14 | Testing Gate staleness | seatrial WILL halt on the expected Wave 2.1 diff (its Step 2 halts on any non-empty diff, and a plan cannot overrule it). The orchestrator relays the halt to the human; the recommended answer is "re-validate" when the diff is only T2.1.1/T2.1.2 commits | planner, after pressure test P7 | The cases are written against the planned change; the halt is a question, and its answer is known in advance. |
| D15 | Which copy arms waves? | The repo copy, which equals the installed 0.16.0 | planner | Same program either way once installed; T0 proves it. |
| D16 | Phase 2 gate wording | Gate closes only after seatrial GO and the human's approval of the rendered page; the push that deploys comes after | user (D17) | A push to `main` touching `site/**` publishes. |
| D17 | Human sign-off before deploy? | Yes, by name and date | user | |
| D18 | Why do Phase 2 criteria run `next build` + `assert-copy`, not `npm run verify`? | Criteria build and assert; `tsc` and `eslint` run once, in the Phase 2 gate's full `npm run verify` | planner, measured | `npm run verify` exceeded `prove-failable`'s 120 s limit here (a criterion that cannot finish stalls every gate that re-runs it); `next build` measured 21 s. Consumed by T2.1.1, T2.1.2. |
| D19 | `init` has never been run; may the page describe it? | Described, not claimed: its lifecycle detail says what it does, and it gets no evidence row (out of scope) | planner, after pressure test P12 | A lifecycle detail describes a shipped piece, as seatrial's and replan's do; the evidence matrix is where verification is claimed. `check` and learnings additionally get rows because this plan runs them (D5). |

## Open questions

| # | Question | Blocks | Recommended answer |
|---|---|---|---|
| none | | | |

## Out of scope / follow-ups

- Fixing `drydock-stats`'s output column (plan 008 R5) and any public token or cost figure.
- Reconcile's `### Token usage` step on the page; it becomes A12 after a reconcile runs it.
- Applying plan 008's reconcile proposals R1-R7 and answering Q1.
- Extending the A3 gate-compliance ledger to plans 006-009.
- Changing the flow strip; an evidence row for `init`.
- The `init` row missing from `drydock/README.md`'s component table.

## Execution policies

- **Per task:** the acceptance criterion must exit 0, verified by the executor
  and re-run by wavecheck.
- **Per wave:** `drydock:wavecheck` is the blocking gate; the repo-copy
  `wave-start` also refuses a wave whose predecessors lack PASS.
- **Phase 1 records are reproduced, not just grepped (D13):** wavecheck 1.1
  re-runs `node drydock/scripts/drydock-audit.mjs check .drydock/check.md` and
  confirms the PASS line matches the recorded one; wavecheck 1.2 re-runs the
  `learnings` command the A11 entry records and diffs its output against the
  entry. Each also reads the executor's subagent transcript
  (`~/.claude/projects/<encoded repo>/<session>/subagents/agent-<id>.jsonl`) to
  confirm the skill was invoked, and says so in its report.
- **Per phase:** Phase 1 has no review wave (D13). Wave 2.R, a fresh-context
  Judgment-tier review after wavecheck 2.1 PASS; APPROVED required.
- **Escalation:** review rejections get max 2 retries, each as a new wave with
  new task ids, then one tier up, then a human. Wavecheck BLOCKs on ownership or
  unlogged deviations get no retries.
- **Checkpointing:** one commit per task, owned files only, then `task-close`.
- **Testing Gate:** `drydock:seatrial` after Wave 2.R APPROVED.
- **Human gate:** Phase 2, after seatrial GO, named and dated (D17). **Do not push
  before it closes.**
- **Tracker mirroring:** none.

## Testing Gate

| Field | Value |
|---|---|
| Target | `http://localhost:5173/drydock/`: `cd site && npm run build`, then serve a directory whose `drydock` entry points at `site/out` (CLAUDE.md; on Windows a junction, `mklink /J`), with `python -m http.server 5173` from that directory |
| Auth | none: a static public page |
| Browser | Chromium through Playwright MCP |
| Commit SHA | recorded by seatrial at run time |
| Evidence root | `.drydock/testing/009-site-016-additions/<case-id>/` |

**TG1 - The lifecycle grid shows nine pieces in three full rows at desktop width**

- **preconditions:** Target served; Wave 2.1 committed.
- **steps:** Given a 1280x900 viewport, When the page is opened and scrolled to `#lifecycle`, Then nine piece cards are rendered, `init` and `check` among them, and the ninth card is in the same row as the seventh and eighth.
- **expected:** Nine cards in a 3x3 arrangement, no card spanning the full width; screenshot of the grid saved.
- **evidence:** screenshot
- **severity:** blocker

**TG2 - At 768px the last card spans both columns, as before**

- **preconditions:** As TG1.
- **steps:** Given a 768x1024 viewport, When the page is opened and scrolled to `#lifecycle`, Then the ninth card spans both grid columns.
- **expected:** Rows of two, the ninth card full width; screenshot saved.
- **evidence:** screenshot
- **severity:** minor

**TG3 - At phone width the page does not scroll sideways**

- **preconditions:** As TG1.
- **steps:** Given a 375x812 viewport, When the page is opened and scrolled to `#lifecycle`, Then `document.documentElement.scrollWidth` is not greater than `window.innerWidth`, and the nine cards stack in one column.
- **expected:** No horizontal overflow, one column; screenshot saved.
- **evidence:** screenshot
- **severity:** major

**TG4 - The evidence matrix shows A10 and A11 with their compat status words**

- **preconditions:** As TG1; `docs/compatibility.md` A10 and A11 rows committed.
- **steps:** Given a 1280x900 viewport, When the page is scrolled to `#evidence`, Then rows A10 and A11 are visible and each status pill reads the status cell of the same row in `docs/compatibility.md` normalised as D10 states (markdown stripped, em dash as a comma, uppercased).
- **expected:** Both rows present, each pill equal to its normalised compat cell; screenshot saved.
- **evidence:** screenshot
- **severity:** blocker

**TG5 - Designed to fail: the page publishes a token or cost figure for a plan**

- **preconditions:** As TG1.
- **steps:** Given a 1280x900 viewport, When the page is opened, Then the visible text contains the string `overhead:` or the word `tokens` next to a number.
- **expected:** **This case is designed to FAIL** (D3: the page publishes no token figure). Its correct verdict is FAIL; a PASS verdict on TG5 is a failure of the gate and of D3. Screenshot of the page top saved.
- **evidence:** screenshot
- **severity:** minor

## Pressure-test verdict

**Independent, fresh-context Opus reviewer, 2026-10-07.** Read-only; verified
cited paths, output literals, anchors and criteria against the repo. Verdict
**REJECTED** on two blockers; all twelve findings applied, each a plan-text
change. Material ones:

1. **P1, BLOCKER, a stray untracked file breaks T1.1.1's exact outputs.** The
   reviewer saw an untracked `.DS_Store`; the planner could not reproduce it
   (none exists, and the root `.gitignore` ignores it), but the mechanism is
   real: `check` counts every untracked, non-ignored file. T0 now requires no
   untracked file outside `docs/plans/`, in its criterion.
2. **P2, BLOCKER, the A10 note would have said the hook was not armed.** It is
   armed: T1.1.1 runs inside Wave 1.1, and the probe passes only because the
   task owns it. Note text and the A10 entry's "does not claim" corrected.
3. **P3, wavecheck never reads transcripts**, so D13's audit was imaginary and
   fabricated output would pass string checks. D13 and Execution policies now
   require reproduction at wavecheck 1.1 and 1.2.
4. **P4, the CI sentence read as a plugin feature.** Reworded to name
   `audit-corpus.mjs` and "this repository runs it in CI".
5. **P5, "runs end to end" claimed more than the run shows.** Labels now name
   the conditions (model-invoked, inside a plan wave; stopped after Step 2), and
   the A10 entry lists the four departures from the skill as shipped.
6. **P6, the pill is CSS-uppercased**, so "copied verbatim" and TG4's "reads
   exactly" would false-FAIL a blocker case. Normalisation rule in D10, T2.1.1
   and TG4.
7. **P7-P12:** seatrial will halt on staleness, D14 now says so and what to
   answer; verification-log order corrected and placements made explicit;
   0.16.0 is already installed, so T0 checks the session's skill list; the
   executors are told to stop BLOCKED if the Skill tool cannot invoke a skill;
   `learnings` output goes in fences; `init` is described, not claimed (D19);
   the check detail says "tracked or untracked".

The reviewer confirmed: exact `check` and `learnings` output literals, both
anchor slugs, `assert-matrix`'s `^## <id>\b` matching, the stripped-HTML checks,
no backslashes in criteria, `python` on PATH, TG5 sound, and the breakpoints.

**Verdict: APPROVED for presentation** after the fixes; `validate-plan --strict`
and `prove-failable` re-run after the edits (below).

## Phase 0: Pre-flight

#### T0 - Baseline, installed-version check, plan index row

- **Description:** Confirm the human step ran (installed 0.16.0, no VERSION
  DRIFT), record the commit SHA, `verify.yml`'s conclusion on `9276d74`, and the
  gate results in *Baseline*, and add this plan's row to `docs/plans/README.md`.
  Also confirm, and record, that `drydock:check` appears in this session's own
  skill list (no command can see that; the orchestrator states it), and that no
  untracked file exists outside `docs/plans/`. If `verify.yml` is red on
  `9276d74`, stop: the copy's CI sentence would be false. If `drydock:check` is
  not in the skill list, stop: the session predates the install (D6).
- **Files owned:** `docs/plans/README.md` (the *Baseline* section of this plan
  is also written here, before any wave is armed)
- **Depends on:** none
- **Model / thinking:** Mechanical / off   **Executor:** orchestrator, inline
- **Context brief:** D6, D15; this plan's *Baseline*; `docs/plans/README.md`;
  `site/scripts/assert-matrix.mjs` (row status equals frontmatter status).
  `verify.yml`'s conclusion comes from `gh run list` if authenticated, otherwise
  from the human, recorded as such.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs'),os=require('os'),p=require('path');const r=c.spawnSync('node',['drydock/scripts/drydock-audit.mjs','validate-plan','docs/plans/009-site-016-additions.md'],{encoding:'utf8'});const o=(r.stdout||'')+(r.stderr||'');const sk=p.join(os.homedir(),'.claude','plugins','cache','drydock','drydock','0.16.0','skills','check','SKILL.md');const t=fs.readFileSync('docs/plans/009-site-016-additions.md','utf8');const i=fs.readFileSync('docs/plans/README.md','utf8');process.exit(r.status===0&&!o.includes('VERSION DRIFT')&&fs.existsSync(sk)&&/Commit SHA [|] .?[0-9a-f]{7,40}/.test(t)&&!/[|] _pending_ [|]/.test(t)&&i.includes('009-site-016-additions')&&c.spawnSync('git',['ls-files','--others','--exclude-standard'],{encoding:'utf8'}).stdout.split(String.fromCharCode(10)).filter(l=>l.trim()&&!l.startsWith('docs/plans/')).length===0?0:1)"`

## Phase 1: Exercise and record

**Phase gate: CLOSED, approved by wavechecks 1.1 and 1.2 - 2026-10-07.** Conditions met: `node site/scripts/assert-matrix.mjs` exits 0 (`12 matrix rows`) with A10 and A11 each citing an existing `## A10` / `## A11` entry, and both waves PASS wavecheck with their records reproduced (D13). No review wave (D13).

### Wave 1.1 - Exercise /drydock:check

#### T1.1.1 - Run /drydock:check live, both verdicts, and record A10

- **Description:** In this session (which loaded 0.16.0), invoke the installed
  `drydock:check` skill for the task's own work: write the A10 record. Before the
  record is finished, create an untracked `check-probe.txt` at the repo root and
  run the audit as the skill directs: it must FLAG it. Delete the probe, finish
  the record, run the audit again: it must PASS. Write both outputs verbatim
  (fenced) into a new `## A10 — check skill in a live session` entry placed
  immediately above `## A9`, and add the A10 row to `compatibility.md` citing it.
  The entry's "does not claim" section must list the four ways this run departs
  from the skill as shipped: it was model-invoked through the Skill tool, not the
  slash command; it ran inside a subagent and an ARMED plan wave, although the
  skill says no plan, no waves, no subagents; the ownership hook was armed and
  the probe was allowed only because this task owns it, so the run does not show
  `check` on unplanned, unarmed work; and the brief overrode Step 5's
  "ask the user" and its "do not delete to make a FLAG go away" by deleting the
  probe.
- **Files owned:** `docs/verification-log.md`, `docs/compatibility.md`,
  `.drydock/check.md`, `check-probe.txt` (created and deleted; never committed)
- **Depends on:** T0
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D5, D8, D10. The installed skill (invoke it; do not read the
  repo copy as a substitute). Intent for the skill, given as the user's
  statement: Goal "record the live run of /drydock:check as A10"; Files owned
  `docs/verification-log.md`, `docs/compatibility.md`; Forbidden `site/**`;
  Acceptance criterion `git diff --quiet HEAD -- site`. The first FLAG is
  expected and is this brief's instruction, not a problem to ask about: the
  skill's Step 5 says to report a FLAG and ask, and the answer is given here in
  advance: delete `check-probe.txt`, finish the record, re-run. `docs/verification-log.md`
  header and its A9 entry for the entry shape (Date, Host version from
  `claude --version`, Node, Repo SHA, What this entry claims and does not claim,
  Method, Raw output, Verdict). `docs/compatibility.md` A9 row for the row shape;
  the row's notes must link `verification-log.md#a10--check-skill-in-a-live-session`
  (check the anchor GitHub generates for the exact heading you write). Write
  the status cell as plain uppercase words with no em dash where the observation
  allows (D10). Findings "check excludes `.drydock/`", "check counts every
  untracked file" and "assert-matrix check 2". **If the Skill tool cannot invoke
  `drydock:check`, stop BLOCKED; do not read any SKILL.md as a substitute.** If
  the skill's Step 4 path shows `${CLAUDE_PLUGIN_ROOT}` unexpanded, use the
  installed cache path (`~/.claude/plugins/cache/drydock/drydock/0.16.0/scripts/drydock-audit.mjs`)
  and record that you did.
- **Forbidden:** editing anything under `site/`; staging `check-probe.txt` or
  `.drydock/`; running the audit anywhere other than at the skill's Step 4;
  writing a status word the outputs do not support.
- **Acceptance criterion:** `node -e "const fs=require('fs');try{require('child_process').execFileSync('node',['site/scripts/assert-matrix.mjs'],{stdio:'ignore'})}catch(e){process.exit(1)}const v=fs.readFileSync('docs/verification-log.md','utf8'),c=fs.readFileSync('docs/compatibility.md','utf8');const i=v.indexOf('## A10 '),j=v.indexOf('## A9 ');if(i<0||j<i||fs.existsSync('check-probe.txt'))process.exit(1);const s=v.slice(i,j);process.exit(s.includes('FLAG outside scope: check-probe.txt')&&s.includes('check: FLAG (1)')&&s.includes('check: PASS')&&/^[|] A10 [|].*verification-log[.]md#a10/m.test(c)?0:1)"`

### Wave 1.2 - Exercise planwright's learnings step

#### T1.2.1 - Run planwright to the end of Step 2, and record A11

- **Description:** Invoke the installed `drydock:planwright` on the request below
  and stop when Step 2 is complete: no plan file is written. Record which
  `drydock-audit.mjs learnings` command it ran, its raw output, and the
  *Findings & constraints* text the skill produced from it, in a new
  `## A11 — planwright's learnings step in a live session` entry placed
  immediately above `## A10`, and add the A11 row to `compatibility.md` citing
  it. Paste raw output inside fenced code blocks: `learnings` prints `## <path>`
  lines and table rows that would otherwise become headings and tables in the
  log. Say in the entry that the run stopped after Step 2 by design, was
  model-invoked inside a subagent, and used interview answers supplied by this
  brief.
- **Files owned:** `docs/verification-log.md`, `docs/compatibility.md`
- **Depends on:** T1.1.1
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D5, D9, D10. The request: "Plan a fix so
  `drydock-audit.mjs plan-status` reads the most recent `Wave x.R verdict`
  heading instead of the last one in document order (plan 008 reconcile, Q1)."
  Interview answers to supply when the skill asks (record them in the entry as
  supplied inputs, not as a user's): a plan IS wanted despite the change's size
  (answering the ceremony section's "offer to just do the work"); lane small;
  execution solo; no UI surface; testing as in
  `drydock/scripts/drydock-audit.test.mjs`; no tracker; human gate none. If the
  Skill tool cannot invoke `drydock:planwright`, stop BLOCKED; do not read any
  SKILL.md as a substitute. The entry and row shapes as in T1.1.1 (A10 is now the shape to copy);
  the row links `verification-log.md#a11--planwrights-learnings-step-in-a-live-session`
  (check the generated anchor).
- **Forbidden:** writing any file under `docs/plans/`; continuing past Step 2;
  running `learnings` yourself instead of letting the skill run it; editing
  `site/`.
- **Acceptance criterion:** `node -e "const fs=require('fs');try{require('child_process').execFileSync('node',['site/scripts/assert-matrix.mjs'],{stdio:'ignore'})}catch(e){process.exit(1)}const v=fs.readFileSync('docs/verification-log.md','utf8'),c=fs.readFileSync('docs/compatibility.md','utf8');const i=v.indexOf('## A11 '),j=v.indexOf('## A10 ');if(i<0||j<i)process.exit(1);const s=v.slice(i,j);process.exit(s.includes('drydock-audit.mjs learnings')&&(s.includes('basename only:')||s.includes('(none)'))&&/^[|] A11 [|].*verification-log[.]md#a11/m.test(c)?0:1)"`

## Phase 2: The page

**Phase gate: OPEN, awaiting human approval of the rendered page (D17).** Mechanical half met 2026-10-07 at `706e5f4`: `cd site && npm run verify` exits 0 (`assert-copy: PASS ... 26 literals ... version matches plugin.json`, `assert-matrix: PASS — 12 matrix rows`); Wave 2.R APPROVED on re-review after repair Wave 2.2; seatrial **GO** (5/5, TG5 failed as designed; sheet at `.drydock/testing/009-site-016-additions/verdict.md`). No push before this line reads CLOSED.

### Wave 2.1 - Copy and layout

> Two disjoint files. The piece count (nine) and every string are fixed by
> this plan, so neither task depends on the other.

#### T2.1.1 - Copy for check, init, learnings, the lock, CI; A10 and A11 rows; pins

- **Description:** Edit `site/content/copy.ts` to the contract below and add the
  four required literals to `assert-copy.mjs`.
- **Files owned:** `site/content/copy.ts`, `site/scripts/assert-copy.mjs`
- **Depends on:** T1.2.1
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D3, D4, D5, D10, D12. `site/content/copy.ts` (`meta.lifecycle`,
  `lifecycle.pieces`, `evidence.rows`); `site/scripts/assert-copy.mjs` `REQUIRED`
  and its comment on the seven pieces; `docs/compatibility.md` rows A10 and A11
  as committed. CLAUDE.md "Honesty rule". No em-dash in any new string.
- **Contract (complete; every string verbatim):**
  - `meta.lifecycle.heading`: `"Nine pieces, one contract"`.
  - New piece, FIRST in `pieces`: name `"init"`, kind `"skill"`, invocation
    `"model or /drydock:init (once per repo)"`, detail `"Onboards a repository once: scans for its quality gates, test framework, commit convention and CI, asks only what scanning cannot answer, and writes a host profile that later plans read instead of asking again."`
  - New piece, LAST in `pieces` (after reconcile): name `"check"`, kind `"skill"`,
    invocation `"model or /drydock:check (no plan)"`, detail `"For work too small for a plan: state the scope in a few lines, do the work, and an audit afterwards flags every tracked or untracked file changed outside it and every criterion that fails. It detects after the fact and prevents nothing."`
  - `planwright` detail: append one sentence, `" While exploring, it pulls the CLAUDE.md lines and past Deviation Log rows that name the files the plan will own."`
  - `wavecheck` detail: append two sentences, `" wave-start refuses to arm a wave while an earlier one lacks a PASS report. drydock/scripts/audit-corpus.mjs re-audits every sealed wave from a clean checkout, and this repository runs it in CI on every push."`
  - `evidence.rows`: two new rows after the last existing row, ids `"A10"` and
    `"A11"`, labels `"check skill runs in a live session (model-invoked, inside a plan wave)"`
    and `"planwright runs its learnings step in a live session (stopped after Step 2)"`;
    `status` = the compat row's status cell normalised: markdown stripped, em
    dash replaced by a comma, uppercased (D10); `tone` `"pass"` only if that
    status is PASSED, else `"hold"`; `note` a one-sentence plain summary of the
    compat row's notes, ending with what was NOT shown. For A10: that `check`
    itself prevents nothing, and that this run sat inside an armed plan wave
    whose owned files included the probe, so it does not show `check` on
    unplanned, unarmed work. For A11: that the run stopped after Step 2 on
    supplied interview answers.
  - `assert-copy.mjs` `REQUIRED`: add `"/drydock:check"`, `"/drydock:init"`,
    `"Nine pieces"`, `"prevents nothing"`, with a comment in the file's voice.
- **Forbidden:** any other `copy.ts` change (flow strip, FAQ, hero, VERSION);
  any token, cost or percentage figure; describing reconcile's token step;
  editing `docs/`.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');try{c.execSync('npx next build',{cwd:'site',stdio:'ignore'});c.execSync('node scripts/assert-copy.mjs',{cwd:'site',stdio:'ignore'})}catch(e){process.exit(1)}const h=fs.readFileSync('site/out/index.html','utf8').replace(/<script[^>]*>[^]*?<[/]script>/g,'');const a=fs.readFileSync('site/scripts/assert-copy.mjs','utf8');process.exit(['Nine pieces','/drydock:check','/drydock:init','prevents nothing','A10','A11'].every(s=>h.includes(s))&&a.includes('/drydock:check')?0:1)"`

#### T2.1.2 - Lifecycle layout for nine cards

- **Description:** In `Lifecycle.tsx`, keep the last card spanning the row
  below `lg` and cancel the span at `lg`, and rewrite the header comment so
  it is true for nine pieces.
- **Files owned:** `site/components/sections/Lifecycle.tsx`
- **Depends on:** T1.2.1
- **Model / thinking:** Mechanical / off (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D4, D11; finding "Lifecycle layout is tuned to seven
  cards"; plan 001 deviation 47 (the comment must describe what renders).
  CLAUDE.md "Tailwind v4 is CSS-first" (a mistyped class emits nothing, with
  no error).
- **Implementation sketch:** the `<li>` class `last:col-span-full` gains
  `lg:last:col-span-1`; confirm the emitted CSS in `site/out/_next/static/chunks/*.css`
  contains a rule for it, since a wrong variant order compiles silently.
- **Forbidden:** any other class or markup change; editing `copy.ts`.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');try{c.execSync('npx next build',{cwd:'site',stdio:'ignore'});c.execSync('node scripts/assert-copy.mjs',{cwd:'site',stdio:'ignore'})}catch(e){process.exit(1)}const s=fs.readFileSync('site/components/sections/Lifecycle.tsx','utf8');const d='site/out/_next/static/chunks';const css=fs.readdirSync(d).filter(f=>f.endsWith('.css')).map(f=>fs.readFileSync(d+'/'+f,'utf8')).join('');process.exit(s.includes('lg:last:col-span-1')&&!/[Ss]even/.test(s)&&css.includes('lg[:]last[:]col-span-1'.split('[:]').join(String.fromCharCode(92,58)))?0:1)"`

### Wave 2.2 - Fixes for the Wave 2.R rejection

> Added after approval (deviation 1). Retry 1 of the escalation policy's 2.
> Repairs the review's major finding F1 and minors F2, F3, F4 and nit F6, all in
> T2.1.1's two files (sequential handoff). Nit F5 is declined (deviation 4).

#### T2.2.1 - Narrow the audit-corpus sentence, tighten the pins and the A10 note

- **Description:** In `site/content/copy.ts` and `site/scripts/assert-copy.mjs`,
  make exactly the replacements in the contract below.
- **Files owned:** `site/content/copy.ts`, `site/scripts/assert-copy.mjs`
- **Depends on:** T2.1.1
- **Model / thinking:** Mechanical / off (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** the Wave 2.R verdict below (F1-F6); `drydock/scripts/audit-corpus.mjs`
  lines 1-13 (v3 plans only, i.e. 005 on); `.github/workflows/verify.yml` `on:`
  (push to `main`, `pull_request`). CLAUDE.md "Honesty rule". No em dash in any
  new string.
- **Contract (complete; every string verbatim):**
  - `wavecheck` detail: replace the sentence `"drydock/scripts/audit-corpus.mjs re-audits every sealed wave from a clean checkout, and this repository runs it in CI on every push."`
    with `"drydock/scripts/audit-corpus.mjs re-audits every sealed wave of every plan from 005 on, and this repository runs it in CI, from a clean checkout, on every push to main and every pull request."` (F1)
  - A10 `note`: replace `"then reported a pass once the probe was deleted."` with
    `"then reported a pass once the probe was deleted on the task brief's instruction, which the skill itself forbids."` (F4)
  - `assert-copy.mjs` `REQUIRED`: replace the literal `"prevents nothing"` with
    `"It detects after the fact and prevents nothing."` (F3)
  - `assert-copy.mjs` comment on the new pins: say `check` and `init` joined
    **the page** in 0.16.0 (F6); say the `"Nine pieces"` pin fixes the
    heading's text and does not count the cards (F2); say the `check` pin is the
    card's whole sentence because the bare phrase also appears in the A10 note
    (F3).
- **Forbidden:** any other change to either file; adding a card-count
  assertion (F2 is resolved by the comment); acting on F5; editing `docs/`.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');try{c.execSync('npx next build',{cwd:'site',stdio:'ignore'});c.execSync('node scripts/assert-copy.mjs',{cwd:'site',stdio:'ignore'})}catch(e){process.exit(1)}const h=fs.readFileSync('site/out/index.html','utf8').replace(/<script[^>]*>[^]*?<[/]script>/g,'');const a=fs.readFileSync('site/scripts/assert-copy.mjs','utf8');process.exit(h.includes('of every plan from 005 on')&&h.includes('on every push to main and every pull request')&&!h.includes('CI on every push.')&&h.includes('which the skill itself forbids')&&a.includes('It detects after the fact and prevents nothing.')&&a.includes('joined the page in 0.16.0')?0:1)"`

### Wave 2.R - Quality review

#### T2.R.1 - Fresh-context review of the page against the evidence

- **Description:** After wavecheck 2.1 PASS, review the Phase 2 diff and the
  built page: every new claim traces to a `compatibility.md` row or a measured
  mechanic; no token figure; pins can fail; the layout class is emitted. Record
  `## Wave 2.R verdict, APPROVED|REJECTED, <date>`.
- **Files owned:** none (the verdict is written by the orchestrator)
- **Depends on:** T2.1.1, T2.1.2
- **Model / thinking:** Judgment / extended (Opus 5.5)   **Executor:** general-purpose reviewer, fresh context
- **Context brief:** `git diff <baseline SHA>..HEAD -- site/ docs/compatibility.md docs/verification-log.md`;
  this plan's Decision Log, Phase 2 task blocks and Testing Gate; CLAUDE.md
  "Honesty rule for site copy".
- **Acceptance criterion:** `node -e "const s=require('fs').readFileSync('docs/plans/009-site-016-additions.md','utf8');process.exit(/^## Wave 2[.]R verdict, APPROVED/m.test(s)?0:1)"`

## Deviation Log

| # | Task | What deviated | Why | Impact | Recorded |
|---|---|---|---|---|---|
| 1 | T2.1.1 / Wave 2.2 | Wave 2.R REJECTED on F1: the contract's verbatim sentence "audit-corpus.mjs re-audits every sealed wave from a clean checkout, and this repository runs it in CI on every push" overclaims. The script re-audits only `format_version: 3` plans (005 on; 001-004 would fail 14 of 29 waves), and `verify.yml` runs on push to `main` and on pull requests, not every push. Wave 2.2 / T2.2.1 appended after approval as the repair, retry 1 of 2 | Planner error in the approved copy contract; the executor applied it verbatim, correctly | One sentence of approved copy changes, narrowed, before anything is pushed. The human sees the final wording at the Phase 2 gate | 2026-10-07 |
| 2 | Wavecheck 2.1 | Check 3 called the CI sentence true on the evidence "`verify.yml:80` runs `audit-corpus.mjs` on push". It read `on: push` without its `branches: [main]` filter and did not test "every sealed wave" against the script's v3-only scope. **discovered-by-review** | The auditor checked that the claim had a mechanism, not the claim's quantifiers | The wavecheck 2.1 PASS stands on ownership and criteria. Its forbidden-audit sentence about the CI claim was wrong and is corrected by this entry, not by editing the sealed report | 2026-10-07 |
| 3 | Wave 2.R | Ran unarmed: `wave-start 2.R` refuses, because "wave 2.R declares no owned files ... Arming an empty boundary would deny every write in the repo" | The reviewer is read-only and owns nothing; the refusal is correct | No enforcement receipt for 2.R. The reviewer was told not to write, and `git status` was clean after it ran | 2026-10-07 |
| 4 | Wave 2.2 | F5 (nit, "every tracked or untracked file" vs the code's untracked-and-not-gitignored set) declined | The wording was set deliberately by pressure test P12, and a gitignored file is not one a user changed in scope | None on the claim's honesty; a later copy pass may tighten it | 2026-10-07 |

## Wavecheck reports

### Wavecheck 1.1 - PASS - 2026-10-07

`execution: fleet`: T1.1.1 ran in a spawned `drydock:executor` (Sonnet), so this
audit is not self-authored. Wavecheck ran from the installed 0.16.0 skill.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `format_version: 3`, status `EXECUTING`, wave 1.1 is the first wave (no prior report required); `validate-plan` PASS at T0 |
| 2. Ownership | PASS | `audit-wave 1.1: PASS, docs/plans/009-site-016-additions.md (1 task(s), 1 commit(s), attribution: manifest)`; table below. **enforcement active: 5 hook decision(s) recorded for wave 1.1 (0 denied)**; bash layer 7 command(s) seen, 0 write(s) detected outside `owns`. Working tree clean |
| 3. Forbidden | PASS | `ca612bf` touches only `docs/compatibility.md` and `docs/verification-log.md`: nothing under `site/`, `check-probe.txt` and `.drydock/` not staged. Transcript shows the audit run exactly twice, both at the skill's Step 4 command. Status `OBSERVED FLAG THEN PASS` is what the two outputs show; no PASSED claim |
| 4. Acceptance | PASS | T1.1.1 criterion run through `spawnSync(..., {shell: true})` (`cmd.exe`): exit 0 |
| D13 reproduction | PASS | Re-ran `node drydock/scripts/drydock-audit.mjs check .drydock/check.md` after the commit: `check: PASS (2 file(s), 1 criteria)`, exit 0, identical to the recorded run-2 line. Subagent transcript `subagents/agent-ab1aed38e2d54f077.jsonl` contains a `Skill` tool_use with `"skill":"drydock:check"` and `Launching skill: drydock:check`, and both recorded outputs appear as Bash **tool results** (`FLAG outside scope: check-probe.txt` / `check: FLAG (1)` / `exit=1`, then `check: PASS (2 file(s), 1 criteria)` / `exit=0`), not as model-written text |
| 5. Deviations | PASS | Executor reported none. Its notes (probe deleted with Bash `rm`, an owned file the brief said to delete; `${CLAUDE_PLUGIN_ROOT}` never appeared, the cache path was printed by Step 4) are within the brief, not deviations |

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.1.1 | `ca612bf` | `docs/compatibility.md`<br>`docs/verification-log.md` | `docs/verification-log.md`<br>`docs/compatibility.md`<br>`.drydock/check.md`<br>`check-probe.txt` | none |

Deviations logged: 0 (0 discovered by wavecheck)

### Wavecheck 1.2 - PASS - 2026-10-07

`execution: fleet`: T1.2.1 ran in a spawned `drydock:executor` (Sonnet), so this
audit is not self-authored. Wavecheck ran from the installed 0.16.0 skill.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | Status `EXECUTING`; wave 1.1 has a PASS report; `plan-status` agreed after 1.1 |
| 2. Ownership | PASS | `audit-wave 1.2: PASS, docs/plans/009-site-016-additions.md (1 task(s), 1 commit(s), attribution: manifest)`; table below. **enforcement active: 2 hook decision(s) recorded for wave 1.2 (0 denied)**; bash layer 6 command(s) seen, 0 write(s) detected outside `owns`. Working tree clean. Staleness diff before arming was T1.1.1's own `ca612bf` only (handoff, baseline kept) |
| 3. Forbidden | PASS | `f93aa6c` touches only the two owned docs: no file under `docs/plans/` or `site/`. Transcript shows exactly one `learnings` Bash call, issued after the `Skill` invocation as the skill's Step 2 command; no Step 3+ artefact written. Status `OBSERVED PARTIAL` matches a run stopped after Step 2 |
| 4. Acceptance | PASS | T1.2.1 criterion run through `spawnSync(..., {shell: true})` (`cmd.exe`): exit 0 |
| D13 reproduction | PASS | Re-ran the recorded command (repo copy, same 0.16.0 program) `node drydock/scripts/drydock-audit.mjs learnings drydock/scripts/drydock-audit.mjs drydock/scripts/drydock-audit.test.mjs`: output equals the entry's raw-output fence exactly after CRLF normalisation. Subagent transcript `subagents/agent-a5b43afdb3e6a318a.jsonl` contains a `Skill` tool_use with `"skill":"drydock:planwright"`, `Launching skill: drydock:planwright`, and the `learnings` output as a Bash tool result |
| 5. Deviations | PASS | Executor reported none of substance. Its read of `drydock-audit.mjs` 698-731 is planwright's own Step 2 exploration, not a substitute for the skill |

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.2.1 | `f93aa6c` | `docs/compatibility.md`<br>`docs/verification-log.md` | `docs/verification-log.md`<br>`docs/compatibility.md` | none |

Deviations logged: 0 (0 discovered by wavecheck)

### Wavecheck 2.1 - PASS - 2026-10-07

`execution: fleet`: T2.1.1 and T2.1.2 each ran in a spawned `drydock:executor`
(Sonnet), one at a time, so this audit is not self-authored.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | Status `EXECUTING`; waves 1.1 and 1.2 have PASS reports; Phase 1 gate CLOSED. Staleness diff of the wave's owned files against `9276d74` was empty before arming |
| 2. Ownership | PASS | `audit-wave 2.1: PASS, docs/plans/009-site-016-additions.md (2 task(s), 2 commit(s), attribution: manifest)`; table below. **enforcement active: 11 hook decision(s) recorded for wave 2.1 (0 denied)**; bash layer 9 command(s) seen, 0 write(s) detected outside `owns`. Working tree clean |
| 3. Forbidden | PASS | T2.1.1's `copy.ts` hunks are exactly the contract's: the heading, the `init` and `check` pieces, the planwright and wavecheck sentences, and the A10 and A11 rows. The flow strip, FAQ, hero and VERSION are untouched, with no token, cost or percentage figure, no reconcile token step, and no `docs/` edit. The new rows' status equals the compat cells (`OBSERVED FLAG THEN PASS`, `OBSERVED PARTIAL`, already plain and uppercase), and the tone is `hold` because neither status is PASSED. No em dash in any new string. T2.1.2 changes only the header comment and adds `lg:last:col-span-1` to the `<li>`. The CI sentence holds: `verify.yml:80` runs `node drydock/scripts/audit-corpus.mjs` on push, and `verify.yml` was green on `9276d74` (Baseline) |
| 4. Acceptance | PASS | Both criteria run through `spawnSync(..., {shell: true})` (`cmd.exe`): T2.1.1 exit 0 (6.6 s), T2.1.2 exit 0 (5.4 s). Emitted rule per executor and criterion: `.lg\:last\:col-span-1:last-child{grid-column:span 1/span 1}` inside the `lg` media block |
| 5. Deviations | PASS | None reported, none found. For 2.R: the new `assert-copy.mjs` comment says "check and init joined in 0.16.0". `init` shipped in 0.14.0 and joined the *page* in 0.16.0, so the comment is ambiguous. It is a code comment, not page copy, and is in scope for the review rather than a conformance miss |

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T2.1.1 | `76376bf` | `site/content/copy.ts`<br>`site/scripts/assert-copy.mjs` | `site/content/copy.ts`<br>`site/scripts/assert-copy.mjs` | none |
| T2.1.2 | `9b6cb88` | `site/components/sections/Lifecycle.tsx` | `site/components/sections/Lifecycle.tsx` | none |

Deviations logged: 0 (0 discovered by wavecheck)

### Wavecheck 2.2 - PASS - 2026-10-07

`execution: fleet`: T2.2.1 ran in a spawned `drydock:executor` (Sonnet), so this
audit is not self-authored. Wave 2.2 is the repair of the Wave 2.R rejection
(deviation 1). It re-owns T2.1.1's files after that sealed wave, a sequential
handoff: the staleness diff since baseline is T2.1.1's own `76376bf` only.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | Status `EXECUTING`; waves 1.1, 1.2 and 2.1 have PASS reports; `validate-plan` PASS (7 task(s), 5 wave(s)) after Wave 2.2 was appended |
| 2. Ownership | PASS | `audit-wave 2.2: PASS, docs/plans/009-site-016-additions.md (1 task(s), 1 commit(s), attribution: manifest)`; table below. **enforcement active: 4 hook decision(s) recorded for wave 2.2 (0 denied)**; bash layer 3 command(s) seen, 0 write(s) detected outside `owns`. Working tree clean |
| 3. Forbidden | PASS | Diff is exactly the contract's four changes: the wavecheck sentence, the A10 note, the pin literal and the pin comment. No card-count assertion, the check card's "tracked or untracked" is untouched (F5 declined), and no `docs/` edit |
| 4. Acceptance | PASS | Criterion through `spawnSync(..., {shell: true})` (`cmd.exe`): exit 1 before the task (proved failable at `4a9edb5`), exit 0 after `75a1b02` |
| 5. Deviations | PASS | None reported, none found |

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T2.2.1 | `75a1b02` | `site/content/copy.ts`<br>`site/scripts/assert-copy.mjs` | `site/content/copy.ts`<br>`site/scripts/assert-copy.mjs` | none |

Deviations logged: 0 (0 discovered by wavecheck)

## Wave 2.R verdict, APPROVED, 2026-10-07 (re-review, after Wave 2.2)

A second fresh-context Opus 5.5 reviewer (general-purpose, read-only, given the
T2.R.1 brief and the first verdict) reviewed all of `9276d74..HEAD` and the built
page. **APPROVED**: no blocker or major; F1-F4 and F6 fixed, and the fix wording
measured true (`audit-corpus: PASS, 23 wave(s) in 5 plan(s)`, plans 005-009 are
exactly the v3 plans; `verify.yml`'s `docs` job does a fresh `actions/checkout`
and runs it on push to `main` and `pull_request`). Each of the four new pins was
shown to fail when its literal is removed from a fixture copy. `git status` was
clean after the review. Left as follow-ups, not repaired:

1. **Minor.** "every plan from 005 on" is true but the page never explains plan
   numbering, so a reader cannot see that the homepage's own plans (001-004) are
   excluded. Later copy pass: "every plan in the current format (005 on)".
2. **Nit.** The A10 note joins "check itself prevents nothing" to the unarmed
   caveat with "because"; the two facts belong in separate sentences.
3. **Nit, outside the diff.** The provenance line "across five plans"
   (`copy.ts:261`) is stale: 001-006 and 009 all touch `site/`. It was forbidden
   to this plan.

## Wave 2.R verdict, REJECTED, 2026-10-07

A fresh-context Opus 5.5 reviewer (general-purpose, read-only, given the T2.R.1
context brief) reviewed `9276d74..HEAD` and the built page. **REJECTED** on one
major finding:

1. **F1, MAJOR.** The audit-corpus sentence overclaims. It was dictated
   verbatim by the contract. The script re-audits `format_version: 3` plans
   only (`audit-corpus: PASS, 22 wave(s) in 5 plan(s)`, plans 005-009), while
   plans 001-004 are the homepage's own and would fail 14 of 29 waves.
   `verify.yml` triggers on push to `main` and on `pull_request`, not on every
   push. The orchestrator re-verified both facts before accepting the finding.
2. **F2, minor.** The `"Nine pieces"` comment claims the pin stops the count
   going stale. Nothing counts the cards.
3. **F3, minor.** `"prevents nothing"` appears twice on the page (the check card
   and the A10 note), so deleting it from the card stays green.
4. **F4, minor.** The A10 note omits that deleting the probe overrode the skill's
   own "do not delete to make a FLAG go away".
5. **F5, nit.** "Every tracked or untracked file" vs untracked-and-not-ignored.
   Declined (deviation 4).
6. **F6, nit.** "check and init joined in 0.16.0" reads as init shipping in
   0.16.0. It shipped in 0.14.0.

Verified clean: build, `assert-copy` (26 literals) and `assert-matrix` PASS; the
A10 and A11 page statuses equal the compat cells, with tone `hold`; the
`wave-start` lock claim holds (`drydock-audit.mjs:933-952`); the init, planwright
and check details match the skills and the code; no token, cost or percentage
figure and no em dash in the stripped page; `lg:last:col-span-1` is emitted
inside `@media (min-width:64rem)`; nine `<li>` render; the flow strip, FAQ, hero
and VERSION are untouched. Repair: Wave 2.2 (deviation 1), then a re-review.

## Progress log

| Date | Task | Result | Notes |
|---|---|---|---|
| 2026-10-07 | T0 | DONE | Baseline at `9276d74`; installed 0.16.0, no VERSION DRIFT; `verify.yml` green on `9276d74`; README row added; status EXECUTING; criterion exits 0; `assert-matrix` PASS |
| 2026-10-07 | T1.1.1 | DONE | `ca612bf`; A10 `OBSERVED FLAG THEN PASS`; wavecheck 1.1 PASS, reproduction matched |
| 2026-10-07 | T1.2.1 | DONE | `f93aa6c`; A11 `OBSERVED PARTIAL`; wavecheck 1.2 PASS, reproduction matched |
| 2026-10-07 | T2.1.1 | DONE | `76376bf`; copy contract applied, four pins added |
| 2026-10-07 | T2.1.2 | DONE | `9b6cb88`; `lg:last:col-span-1` emitted; wavecheck 2.1 PASS |
| 2026-10-07 | T2.R.1 | REJECTED | F1 major (audit-corpus overclaim) plus minors; repair Wave 2.2 appended |
| 2026-10-07 | T2.2.1 | DONE | `75a1b02`; F1-F4, F6 repaired; wavecheck 2.2 PASS |
| 2026-10-07 | T2.R.1 | APPROVED | Re-review after Wave 2.2 (retry 1 of 2 used); one minor, two nits left as follow-ups |
| 2026-10-07 | Testing Gate | GO | Staleness HALT answered "re-validate" by Sandeep Takasi; TG1-TG5 PASS (TG5 by inversion); specs GENERATED, NOT EXECUTED in `e2e/009-site-016-additions/` (uncommitted) |

## Reconcile report
