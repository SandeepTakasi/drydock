---
plan: 008-stats-gates-check-learnings
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

# 008 - Measure the overhead, lock the wave order, a light check, recall past learnings

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
# The REPO copy, deliberately (D15): from Wave 1.2 on it carries T1.1.1's
# wave-order lock, which the installed 0.15.1 does not. Expect a VERSION DRIFT
# banner until 0.16.0 is installed; it is accurate, not an error.
node drydock/scripts/drydock-audit.mjs wave-start docs/plans/008-stats-gates-check-learnings.md <wave>
# ... the wave's executors run ...
node drydock/scripts/drydock-audit.mjs audit-wave docs/plans/008-stats-gates-check-learnings.md <wave>
rm .drydock/wave-owns.json
```

**Orchestrator bookkeeping (CLAUDE.md, plans 005-007):** set `status: EXECUTING`
and this plan's `docs/plans/README.md` row in the commit before the first
`wave-start`; write this plan file only while no wave is armed, and commit it
before the next `wave-start`; spawn a wave's executors **one at a time** (D2);
a review rejection is repaired in a new wave with new task ids; edit owned files
with Write/Edit, never Bash, so the hook leaves receipts.

**Staleness check (before every wave):**
`git diff <baseline SHA>..HEAD -- <wave's owned files>`. Non-empty → re-validate
the wave's tasks against current code and update the baseline SHA and Decision
Log before executing.

## Requirement

The external review of 2026-10-06, as narrowed by this repo's own evaluation,
leaves four things to build. (1) A command that reports, for one plan, the
tokens spent on orchestration versus execution, recovered from the host's
session transcripts, so the cost question in `docs/cost-001.md` gets a number.
(2) `wave-start` refuses to arm a wave while any earlier implementation wave of
the same plan lacks a PASS wavecheck report, and CI re-audits every sealed wave
of every v3 plan. (3) A lightweight `/drydock:check` skill: the user states the
scope and done-criteria in a few lines, the work happens without a plan, and a
mechanical `check` reports files changed outside scope and criteria that fail.
(4) Planwright, while exploring, pulls the lines from `CLAUDE.md` files and past
Deviation Logs that name the files the new plan will own. Ship as 0.16.0.

## Spec reference

none, requirement is complete. Background: the evaluation in the session of
2026-10-06 and the external plan it reviewed (Priorities 1, 2, 3, 6, the cheap
half of each). `docs/cost-001.md` § "What would make this page better" names (1).

## Surgical-scope statement

Two new scripts (`drydock-stats.mjs`, `audit-corpus.mjs`), three additions to `drydock-audit.mjs`
(a precondition in `waveStart`, a `check` subcommand, a `learnings` subcommand),
one CI step, one new skill, two skill paragraphs, one release. No anchors, no
expiry, no signing, no benchmark, no new dependency.

## Baseline

Recorded by T0 on 2026-10-07, before any wave was armed.

| Item | Value |
|---|---|
| Commit SHA | `a72deebefef51b2f265df78973f5e8de09ec4701` (0.15.2: the resolver suite used a different ruler than the code it measured) |
| `node drydock/scripts/drydock-audit.test.mjs` | **GREEN.** `139/139 passed` |
| `node drydock/hooks/enforce-owns.test.mjs` | **GREEN.** `enforce-owns: PASS, 42 cases` |
| `node drydock/hooks/detect-bash-writes.test.mjs` | **GREEN.** `detect-bash-writes: PASS, 21 cases` |
| `node drydock/lib/resolve-target.test.mjs` | **GREEN.** `resolve-target: PASS, 8 cases` |
| `node site/scripts/assert-matrix.mjs` | **RED until T0's own row landed:** `assert-matrix: FAIL (1)`, `docs/plans/README.md has no row for 008-stats-gates-check-learnings.md`. Green after T0. |
| `cd site && npm run verify` | **RED for the same single reason:** `next build`, `tsc --noEmit`, `eslint .` and `assert-copy: PASS` (22 literals, version matches plugin.json) all passed; the chain's last step, `assert-matrix`, failed on the missing row. Green after T0. |

No pre-existing failure is excluded from any acceptance criterion: the four
plugin suites are green at baseline, and both red rows are this plan's own
missing index row, which T0 adds.

## Practices in effect

| Practice | Value | Source |
|---|---|---|
| Testing | Plain-script suites, no framework, `ok   — <name>` lines, non-zero exit on failure | `drydock/scripts/drydock-audit.test.mjs` |
| Runtime | Node ≥ 20.17, built-ins only, no dependencies | `plugin.json` `engines`, `verify.yml` matrix 20/22/24 |
| Platforms | Windows and Linux both gate | `verify.yml` |
| Quality gates | the four plugin suites, `assert-matrix`, `validate-plan` over the corpus, `npm run verify` in `site/` | `verify.yml`, CLAUDE.md |
| Commits | one per task, owned files only, then `task-close` (`attribution: manifest`) | CLAUDE.md "Executing a plan here" |
| Execution | fleet, executors spawned one at a time | user, D2 |
| Human gate | Phase 2 release, signed by Sandeep Takasi, named and dated | user, D5 |
| Acceptance criteria | run through `cmd.exe` on this machine: no backslashes, character classes, suite stderr suppressed | CLAUDE.md |
| Docs honesty | no site claim for any new feature; `compatibility.md` unchanged | CLAUDE.md "Honesty rule" |
| Tracker | none | plans 005-007 |

## Findings & constraints

- **`waveStart`** (`drydock/scripts/drydock-audit.mjs` ~884) preflights
  `validate-plan` and an uncommitted plan, and checks nothing about earlier
  waves. `derivePlanState` (~705) already lists implementation waves in document
  order (`waves`) and each wave's LAST verdict (`verdicts`); review waves
  (`Wave x.R`) are excluded from `waves`. The new precondition is a lookup in
  those two, not a new parser.
- **Existing `wave-start` tests** (test file ~1767-1800) arm wave `1.0` only, the
  first wave, so the new precondition leaves them passing.
- **Sealed waves re-audit from a clean checkout.** Measured 2026-10-07 in a fresh
  worktree with no `.drydock/`: all 14 sealed waves of plans 005, 006, 007 exit 0
  from `audit-wave` ("ATTRIBUTION RECOVERED FROM THE SEALED REPORT"). Plans
  001-004 (`format_version: 2`) exit 1 on 14 of 29 waves: they predate the
  manifest and per-task attribution. CI can gate v3 plans only (D9).
- **CI checkout is shallow by default** (`actions/checkout` `fetch-depth: 1`);
  `audit-wave` runs `git show` on historical commits, so the job needs
  `fetch-depth: 0`.
- **Transcripts.** `~/.claude/projects/<encoded repo root>/<session>.jsonl` holds
  one JSON object per line; assistant lines carry `message.usage` with
  `input_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`,
  `output_tokens`, plus `requestId`. Subagents live in
  `<session>/subagents/agent-<id>.jsonl` with a sibling `agent-<id>.meta.json`
  holding `agentType` (e.g. `"general-purpose"`, `"drydock:executor"`). The
  encoded directory for `C:\Users\91891\Desktop\drydock` is
  `C--Users-91891-Desktop-drydock` (every non-alphanumeric character → `-`).
- **Usage lines repeat per API request, and the repeats disagree.** One session
  measured 465 lines with `usage` and 257 unique `requestId`s. In the 35
  subagent files, 550 repeats carry a different `output_tokens` from the earlier
  line for the same id (streaming partials), and the later value is always the
  larger; keeping the first line undercounts output by ~18%. Across main session
  files, 496 `requestId`s appear in more than one file (resumed and forked
  sessions copy history). So deduplication is global and keeps the max (D8).
- **Sessions mention several plans.** Session `5d8c4868` names both the 006 and
  007 slugs and owns 23 `drydock:executor` subagents; this planning session names
  006, 007 and 008. Whole-session attribution would misassign in both directions
  (D7).
- **The audit suite polices skill vocabulary.** The case "consumers name only
  vocabulary the format contract defines" (`drydock-audit.test.mjs` ~1126-1185)
  fails on a backticked lowercase token in a SKILL.md that `plan-format.md` does
  not define. A grep criterion on a skill file cannot see that; Wave 2.1's
  criteria run the suite.
- **`git diff --name-only` detects renames by default**, so a move reports only
  the new path and hides the deletion of the old one; it also octal-escapes
  non-ASCII names unless `-z` is used.
- **Skills are discovered from `drydock/skills/<name>/SKILL.md`**; `plugin.json`
  lists none. A new skill is a new directory.
- **Skill edits are unexercisable this session and by any session until a
  release is installed** (CLAUDE.md). Phase 2's skill tasks ship gated on their
  mechanical criteria and are unproven until a later session runs them (D14).
- **Site copy.** `site/content/copy.ts` `VERSION` must equal `plugin.json`
  (`assert-copy`). Its "Seven pieces" section is not updated here (out of scope).

## Decision Log

| # | Question | Decision | Decided by | Rationale |
|---|---|---|---|---|
| D1 | Lane? | `full` | planner (assumed, flag if wrong) | Three tasks edit `drydock-audit.mjs` and its test file, so they cannot share a wave; `small` allows one wave. Size alone (~12 files) would be small. |
| D2 | Execution? | fleet, executors spawned one at a time | user | Matches 006/007, and makes plan 008 the first plan `drydock-stats` can measure with a real orchestration/execution split. One at a time per plan 007's D7. |
| D3 | Does `/drydock:check` arm the hook? | No, audit afterwards only | user | Cheapest entry point; arming would interrupt every legitimate scope miss. Consumed by T1.2.1, T2.1.1. |
| D4 | Publish numbers in this plan? | `stats` output goes in plan 008's reconcile report only | user | One plan is one data point; a public cost page waits for several. Consumed by T2.1.3. |
| D5 | Release? | 0.16.0, Phase 2 human gate signed by Sandeep Takasi | user | New subcommands and a new skill are a minor bump. Consumed by T2.2.1. |
| D6 | `stats` as an audit subcommand or its own script? | Own script, `drydock/scripts/drydock-stats.mjs` | planner (assumed, flag if wrong) | It reads the user's home directory, not the repo; keeping it out of the audit script keeps that script repo-only and lets it run in Wave 1.1 beside T1.1.1. Consumed by T1.1.2, T2.1.3. |
| D7 | Which transcript tokens belong to a plan? | A main session counts as orchestration when its text contains the slug; a subagent counts only when **its own** transcript contains the slug. Output is one row per session, naming every other `NNN-` plan slug that session mentions, so shared sessions are visible rather than silently assigned | planner, after pressure test | No transcript field names a plan. Measured: one session names two plans and owns 23 executors, so whole-session counting can deflate as well as inflate overhead. The earlier claim that the error "cannot flatter Drydock" was wrong and is withdrawn. Consumed by T1.1.2. |
| D8 | Usage duplication? | Deduplicate globally across every file counted, keyed on `requestId`, keeping the max of each usage field; lines with no `requestId` count individually | planner, measured | Repeats disagree (streaming partials, later always larger) and ids recur across resumed/forked session files. Per-file first-wins undercounts output ~18% and double-counts shared history. Consumed by T1.1.2. |
| D9 | Which waves does CI re-audit? | Every wave of every `format_version: 3` plan whose LAST `### Wavecheck` heading says PASS, via a small script so the same command runs locally and in CI | planner, measured; script after pressure test | v3 waves all re-audit PASS from a clean checkout (also with an empty `CLAUDE_CONFIG_DIR`, so CI needs no plugin install); v2 plans fail 14 of 29 for reasons that predate the manifest. A wave whose last verdict is BLOCK is a plan state, not a CI failure. A yml-only loop could only be gated by grepping it, which a comment satisfies. Consumed by T1.1.3. |
| D10 | How do learnings get retrieved? | A grep: `learnings <path>...` prints `CLAUDE.md` lines and Deviation Log rows containing each path, then, listed separately, rows matching only its basename | planner (assumed, flag if wrong) | The cheap half of the review's Priority 6. Basenames like `SKILL.md` hit 13+ rows, so full-path hits lead. Anchors and expiry wait until retrieval proves useful. Consumed by T1.3.1, T2.1.2. |
| D11 | What counts as "earlier wave" for `wave-start`? | The distinct `waveOf(task)` of non-superseded tasks, in order of first appearance, before the target's; each must have a LAST verdict of PASS. Review waves have no tasks in that sense and are exempt; a wave whose tasks are all superseded drops out. The escape after a BLOCK is the one plans 006/007 already used: re-run wavecheck on the repaired wave and append a re-audit heading, whose PASS supersedes the BLOCK | planner, after pressure test | Deriving order from tasks, not `### Wave` headings, covers plans and fixtures without wave headings. Without a stated escape, a replan that leaves a BLOCKed wave's completed tasks in place would lock every later wave. Consumed by T1.1.1. |
| D12 | Quality review per phase? | Wave 1.R only. Phase 2 is skill prose and a version bump, gated by its criteria and the human | planner (assumed, flag if wrong) | A Judgment-tier review of three short skill paragraphs costs more than it can find; the code is in Phase 1. |
| D13 | Testing Gate? | N/A | planner | See § Testing Gate. |
| D14 | Skill edits unexercised? | Shipped gated on mechanical criteria, reported as unproven at wavecheck and in the CHANGELOG | planner, CLAUDE.md | The running session and every session until `claude plugin update` read the installed copy. Consumed by T2.1.1, T2.1.2, T2.1.3, T2.2.1. |
| D15 | Which copy arms waves? | The repo copy, `node drydock/scripts/drydock-audit.mjs`, for every wave | planner, after pressure test | The installed 0.15.1 lacks T1.1.1's lock; arming with the repo copy exercises it from Wave 1.2 on. The ownership hook itself is still the installed one, which is unchanged by this plan. |

## Open questions

| # | Question | Blocks | Recommended answer |
|---|---|---|---|
| none | | | |

## Out of scope / follow-ups

- Plan approval signing (review P2 row 2): a hash the model can write is not a lock; needs something outside the session.
- The A/B benchmark and a public `docs/cost-002.md`: after `stats` has run on several plans.
- Learning anchors and staleness expiry (review P6 steps 1 and 3).
- Criterion↔file coverage lint (review P4).
- Non-browser seatrial drivers (review P5).
- The site's "Seven pieces" section naming `check`.
- Running `claude plugin marketplace update drydock && claude plugin update drydock@drydock` and exercising `check`, planwright's learnings step and reconcile's stats step in a fresh session. That is the proof D14 says this plan cannot give itself.

## Execution policies

- **Per task:** the acceptance criterion must exit 0, verified by the executor
  and re-run by wavecheck.
- **Per wave:** `drydock:wavecheck` is the blocking gate. From Wave 1.2 on, the
  repo-copy `wave-start` (D15) also enforces it mechanically via T1.1.1.
- **Per phase:** Wave 1.R, a fresh-context Judgment-tier review of the Phase 1
  diff after wavecheck PASS on Wave 1.3. APPROVED required for the Phase 1 gate.
  Phase 2 has no review wave (D12).
- **Escalation:** review rejections get max 2 retries, each as a new wave with
  new task ids, then one model tier up, then a human. Wavecheck BLOCKs on
  ownership or unlogged deviations get no retries.
- **Checkpointing:** one commit per task, owned files only, then `task-close`.
- **Human gate:** Phase 2, named and dated (D5).
- **Tracker mirroring:** none.

## Testing Gate

N/A, this plan changes CLI scripts, a CI workflow and skill prose; the only
user-facing surface it touches is the homepage version string, which
`site/scripts/assert-copy.mjs` already asserts against `plugin.json` at build
time. No interactive behaviour changes. Runtime proof for the CLI changes is the
acceptance criteria, which execute them.

## Pressure-test verdict

**Independent, fresh-context Opus reviewer, 2026-10-07** (a first spawn died
on an internal error; the second completed). Every cited symbol and line was
confirmed to exist. Verdict APPROVED-WITH-FIXES; all twelve findings applied:

1. **BLOCKER, T1.1.2 dedupe.** Repeats for one `requestId` disagree (550
   streaming partials in subagent files, later always larger; re-measured by the
   planner) and 496 ids recur across session files. D8 rewritten: global
   dedupe, max per field; three dedupe cases added.
2. **D7's "cannot flatter" claim was false**: a session naming 006 and 007 owns
   23 executors. D7 rewritten: subagents count only when their own transcript
   names the slug, and each session row names the other plans it mentions.
3. **T1.1.1 could deadlock after a replan.** D11 rewritten: wave order derived
   from non-superseded tasks (fixtures lack `### Wave` headings), the re-audit
   escape stated, and a third case for it.
4. **Wave 2.1 edits could break the audit suite's vocabulary case** unseen by
   grep criteria. Each T2.1.x brief names the case and each criterion runs the suite.
5. **The stats suite never reached CI.** T1.1.3 now adds its `run:` line.
6. **T1.1.3's grep criterion passed on a comment.** The loop moved into
   `audit-corpus.mjs` (D9), and the criterion executes it.
7. **Renames hid a forbidden deletion in `check`.** `--no-renames -z`, plus a case.
8. **Last-verdict parsing unspecified** → T1.1.3 brief points at `WAVECHECK_RE`.
9. **Basename noise** → full-path hits listed first (D10), plus a case.
10. **Contradiction on which copy arms waves** → D15, repo copy throughout.
11. **T0's criterion was weak** → also requires no `_pending_` cell and `assert-matrix` PASS.
12. **`check` criteria run under `cmd.exe`** → the skill must say so; criterion greps it.

**Verdict: APPROVED for presentation.**

## Phase 0: Pre-flight

#### T0 - Baseline verification and plan index row

- **Description:** Record the commit SHA and the verbatim result of every gate
  command in *Baseline*, and add this plan's row to `docs/plans/README.md` with
  status matching the frontmatter, so `assert-matrix.mjs` passes.
- **Files owned:** `docs/plans/README.md` (the *Baseline* section of this plan
  is also written here, before any wave is armed)
- **Depends on:** none
- **Model / thinking:** Mechanical / off   **Executor:** orchestrator, inline
- **Context brief:** this plan's *Baseline*; `docs/plans/README.md`;
  `site/scripts/assert-matrix.mjs` (the row's status column must equal this
  plan's frontmatter `status:` and moves with it).
- **Acceptance criterion:** `node -e "const fs=require('fs');const p=fs.readFileSync('docs/plans/008-stats-gates-check-learnings.md','utf8'),i=fs.readFileSync('docs/plans/README.md','utf8');const m=p.match(/Commit SHA [|] .?([0-9a-f]{7,40})/);if(!m||!i.includes('008-stats-gates-check-learnings')||/[|] _pending_ [|]/.test(p))process.exit(1);try{require('child_process').execFileSync('node',['site/scripts/assert-matrix.mjs'],{stdio:'ignore'})}catch(e){process.exit(1)}"`

## Phase 1: Mechanics

**Phase gate:** all four plugin suites exit 0, `node drydock/scripts/drydock-stats.test.mjs` exits 0, `validate-plan` over the corpus as CI runs it, and Wave 1.R APPROVED.

### Wave 1.1 - The wave-order lock, the stats script, the CI re-audit

> The three tasks share no file and no interface. `drydock-stats.mjs` is
> consumed only by T2.1.3, in Phase 2, against the contract stated here.

#### T1.1.1 - wave-start refuses while an earlier wave lacks a PASS report

- **Description:** In `waveStart`, after the uncommitted-plan check, refuse to
  arm wave N when any earlier wave (per D11) has no wavecheck report or a last
  verdict other than PASS. Add three named cases to the audit suite.
- **Files owned:** `drydock/scripts/drydock-audit.mjs`,
  `drydock/scripts/drydock-audit.test.mjs`
- **Depends on:** T0
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D11. `waveStart` (~884-970) and `derivePlanState` (~705-797)
  in `drydock-audit.mjs`, including the `WAVE_RE`/`WAVECHECK_RE` comments above
  it; the existing `wave-start` cases (test file ~1765-1800) and the `bareRepo`,
  `git`, `cli` helpers they use. Error output follows the file's style: lines
  prefixed `wave-start:`, exit 1, nothing written.
- **Contract:** earlier waves = distinct `waveOf(t)` over `plan.tasks.filter(t => !t.superseded)`,
  in order of first appearance, before the target's first appearance (D11; do
  NOT use `derivePlanState().waves`, which needs `### Wave` headings the test
  fixtures lack). Verdicts come from `derivePlanState(plan).verdicts` (last
  heading per wave wins). The refusal names the first offending wave and its
  state, e.g. `wave-start: wave 1.1 has no PASS wavecheck report (none), so wave 1.2 cannot be armed.`
  followed by one line: run `drydock:wavecheck` on it (after a BLOCK and a
  replan, a re-audit heading whose PASS supersedes the BLOCK), commit the
  report, re-arm. The first wave is never refused by this check.
- **Cases:** `wave-start refuses when an earlier wave has no PASS report`;
  `wave-start arms a wave whose earlier waves all PASS`;
  `wave-start arms after a re-audit PASS supersedes a BLOCK`.
- **Forbidden:** changing `derivePlanState`, `WAVECHECK_RE`, or any other
  subcommand; editing existing test cases; any dependency.
- **Acceptance criterion:** `node -e "let o='';try{o=require('child_process').execFileSync('node',['drydock/scripts/drydock-audit.test.mjs'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch(e){process.exit(1)}process.exit(/ok +. wave-start refuses when an earlier wave has no PASS report/.test(o)&&/ok +. wave-start arms a wave whose earlier waves all PASS/.test(o)&&/ok +. wave-start arms after a re-audit PASS supersedes a BLOCK/.test(o)?0:1)"`

#### T1.1.2 - drydock-stats.mjs: tokens per plan, orchestration vs execution

- **Description:** Create `drydock/scripts/drydock-stats.mjs <plan.md> [--projects <dir>]`
  that finds every session transcript mentioning the plan's slug, sums token
  usage per bucket with per-request deduplication, and prints a table plus an
  overhead percentage. Add its own plain-script test suite with a synthetic
  transcript fixture.
- **Files owned:** `drydock/scripts/drydock-stats.mjs`,
  `drydock/scripts/drydock-stats.test.mjs`
- **Depends on:** T0
- **Model / thinking:** Complex / extended (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D6, D7, D8, and the findings "Transcripts" and "Usage lines
  repeat per API request" in this plan. `drydock/scripts/drydock-audit.mjs`
  lines 1-45 and the `fail`/exit-code block at the end (~2071-2095) for house
  style and exit codes (0 pass, 1 nothing found, 2 usage, 3 could not run).
  `drydock/scripts/drydock-audit.test.mjs` tail for the `ok   — <name>` /
  `FAIL — <name>` harness to copy.
- **Implementation sketch:**
  - slug = frontmatter `plan:` value, else the file's basename without `.md`.
  - repo root = `git -C <plan dir> rev-parse --show-toplevel`; projects dir =
    `--projects` if given, else `join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude"), "projects", root.replace(/[^A-Za-z0-9]/g, "-"))`.
    Resolve the root through `realpathSync.native` first so the Windows drive
    letter case and separators match what the host encoded.
  - sessions = top-level `*.jsonl` in the projects dir whose raw text includes
    the slug → bucket `orchestration`. Subagents: every
    `<sessionId>/subagents/agent-*.jsonl` (any session, mentioning or not) whose
    **own** raw text includes the slug → `execution` when its sibling
    `.meta.json` `agentType` starts with `drydock:executor`, else
    `other subagents` (missing or unreadable meta → `other subagents`).
  - usage, globally deduplicated (D8): parse each line of every counted file
    (skip lines that fail `JSON.parse`); take `message.usage`; key on
    `requestId` across ALL counted files, keeping per key the max of each of
    `input_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`,
    `output_tokens` (absent → 0), and the bucket of the first file that held
    it; lines with no `requestId` count individually.
  - output: one row per bucket with the four counts and a total; then
    `overhead: <n>% (orchestration + other subagents) of <total> tokens across <k> session(s)`;
    then one line per main session: `<sessionId>  <total>  also mentions: <other NNN- slugs or none>`
    (other slugs = matches of `/[0-9]{3}-[a-z0-9-]+/` in the file that name a
    `.md` in the plan's directory, excluding this plan); then the caveat line
    `a session that mentions <slug> is counted whole, including unrelated work in it; tokens, not cost`.
    No session found → `drydock-stats: no transcript in <dir> mentions <slug>`, exit 1.
- **Cases (names fixed, the criterion greps them):** `counts a requestId once`;
  `keeps the final usage of a request`; `counts a request shared by two session files once`;
  `splits executor subagents into execution`; `ignores a subagent that never mentions the plan`;
  `ignores sessions that never mention the plan`; `names other plans a session mentions`;
  `exits 1 when no session mentions the plan`. Assert exact token sums.
  - Node built-ins only; no network; reads nothing outside the projects dir and the plan.
- **Forbidden:** editing `drydock-audit.mjs`; any dependency; converting tokens
  to money; writing any file.
- **Acceptance criterion:** `node -e "let o='';try{o=require('child_process').execFileSync('node',['drydock/scripts/drydock-stats.test.mjs'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch(e){process.exit(1)}const n=['counts a requestId once','keeps the final usage of a request','counts a request shared by two session files once','splits executor subagents into execution','ignores a subagent that never mentions the plan','ignores sessions that never mention the plan','names other plans a session mentions','exits 1 when no session mentions the plan'];process.exit(n.every(x=>o.split(String.fromCharCode(10)).some(l=>/^ok /.test(l)&&l.trim().endsWith(x)))?0:1)"`

#### T1.1.3 - CI re-audits every sealed wave of every v3 plan

- **Description:** Create `drydock/scripts/audit-corpus.mjs`, which runs
  `drydock-audit.mjs audit-wave` for every wave of every `format_version: 3`
  plan in `docs/plans/` whose last `### Wavecheck` heading says PASS. In
  `verify.yml`, give the `docs` job a full-history checkout and a step running
  that script, and add one `run:` line for `drydock/scripts/drydock-stats.test.mjs`
  to the `plugin` job.
- **Files owned:** `drydock/scripts/audit-corpus.mjs`, `.github/workflows/verify.yml`
- **Depends on:** T0
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D9 and the findings "Sealed waves re-audit from a clean
  checkout" and "CI checkout is shallow by default". In `drydock-audit.mjs`, the
  `SEP`/`VERDICT`/`WAVECHECK_RE` definitions and comments (~650-670): copy that
  regex rule (comma, hyphen or em dash; parenthetical allowed; the LAST heading
  per wave wins) rather than inventing one. `verify.yml` `plugin` job (~57-61)
  and `docs` job (~62-95) for comment density. The script's header comment
  states the v2 exclusion and its reason, and the ceiling: commits after a
  sealed wave that no task claims are not seen. The stats suite file name is
  fixed by T1.1.2's contract; it does not need to exist yet for this edit.
- **Contract:** `node drydock/scripts/audit-corpus.mjs` spawns
  `process.execPath` on the sibling `drydock-audit.mjs audit-wave <plan> <wave>`
  per selected wave, streaming each child's last line; prints
  `audit-corpus: PASS, <n> wave(s) in <k> plan(s)` and exits 0, or
  `audit-corpus: FAIL, <m> of <n> wave(s)` naming each, and exits 1. Node
  built-ins only.
- **Forbidden:** changing any other job or step beyond the two named additions
  and the `fetch-depth`; adding a `paths:` filter (the file header explains
  why); any `|| true`; editing `drydock-audit.mjs`.
- **Acceptance criterion:** `node -e "const c=require('child_process');let o='';try{o=c.execFileSync('node',['drydock/scripts/audit-corpus.mjs'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch(e){process.exit(1)}const s=require('fs').readFileSync('.github/workflows/verify.yml','utf8');process.exit(/audit-corpus: PASS, [0-9]+ wave/.test(o)&&/fetch-depth: 0/.test(s)&&/node drydock[/]scripts[/]audit-corpus[.]mjs/.test(s)&&/node drydock[/]scripts[/]drydock-stats[.]test[.]mjs/.test(s)?0:1)"`

### Wave 1.2 - The check subcommand

#### T1.2.1 - drydock-audit.mjs check: diff since base against a declared scope

- **Description:** Add `drydock-audit.mjs check <intent.md>`: read a base SHA,
  owned globs, optional forbidden globs and criterion commands from a small
  intent file, flag every file changed since the base that falls outside the
  owned globs or inside a forbidden glob, run every criterion, and print
  `check: PASS` or `check: FLAG (<n>)`. Add named cases to the audit suite and a
  usage line.
- **Files owned:** `drydock/scripts/drydock-audit.mjs`,
  `drydock/scripts/drydock-audit.test.mjs`
- **Depends on:** T1.1.1
- **Model / thinking:** Complex / extended (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D3. `drydock/lib/owns-match.mjs` (already imported by the
  audit script; reuse it for glob matching). `repoRoot`, `relFromRoot`, `git`
  helpers and the main dispatch / usage block in `drydock-audit.mjs`
  (~990-2116). `proveFailable` (~1839) for how criteria are executed through the
  platform shell. The test file's `mkrepo`, `commitAs`, `cli` helpers.
- **Contract, intent file format (complete; T2.1.1's skill writes exactly this):**
  ```
  ---
  base: <full or short commit SHA>
  ---
  - **Goal:** <one line, informational>
  - **Files owned:** `glob`, `glob`
  - **Forbidden:** `glob`            (optional)
  - **Acceptance criterion:** `command`   (one or more backticked commands, optional)
  ```
  A field's value is every backticked item from its bullet up to the next line
  starting `- **`. CRLF-safe (`split(/\r?\n/)`).
- **Implementation sketch:** changed set = `git diff --no-renames --name-only -z <base>` ∪
  `git ls-files --others --exclude-standard -z`, split on NUL, repo-relative,
  POSIX, excluding `.drydock/`. `--no-renames` so a move reports both the
  deleted old path and the new one; `-z` so non-ASCII names are not
  octal-escaped. Each changed file not matching any owned glob → `FLAG outside scope: <file>`;
  matching a forbidden glob → `FLAG forbidden: <file>`. Each criterion run with
  `spawnSync(cmd, { shell: true, cwd: root, stdio: ["ignore", "pipe", "pipe"] })`;
  non-zero → `FLAG criterion exited <code>: <cmd>`. Final line
  `check: PASS (<files> file(s), <k> criteria)` exit 0, or `check: FLAG (<n>)`
  exit 1. Missing or unresolvable `base`, or no owned globs → exit 3 with a
  one-line reason. Writes nothing.
- **Forbidden:** changing any existing subcommand; arming or reading
  `.drydock/wave-owns.json`; any dependency.
- **Acceptance criterion:** `node -e "let o='';try{o=require('child_process').execFileSync('node',['drydock/scripts/drydock-audit.test.mjs'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch(e){process.exit(1)}process.exit(/ok +. check flags a file outside the declared scope/.test(o)&&/ok +. check flags a failing criterion/.test(o)&&/ok +. check flags the old path of a file moved into scope/.test(o)&&/ok +. check passes an in-scope diff whose criteria exit 0/.test(o)?0:1)"`

### Wave 1.3 - The learnings subcommand

#### T1.3.1 - drydock-audit.mjs learnings: past lessons that name a path

- **Description:** Add `drydock-audit.mjs learnings [--plans-dir <dir>] <path>...`
  that prints, per given path, every line of every tracked `CLAUDE.md` and every
  Deviation Log table row in the plans directory containing that path or its
  basename. Add named cases to the audit suite and a usage line.
- **Files owned:** `drydock/scripts/drydock-audit.mjs`,
  `drydock/scripts/drydock-audit.test.mjs`
- **Depends on:** T1.2.1
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D10. `parsePlan` and `sectionBody` (~161, ~624) for reading
  a plan's `Deviation Log` section; `resolvePlansDir` (~1772) for the default
  plans directory (`docs/plans`); the main dispatch / usage block. The test
  file's `mkrepo` helper.
- **Contract:** sources = `git ls-files` entries named `CLAUDE.md` at any depth,
  plus the `## Deviation Log` section rows (`|`-prefixed lines, header and
  separator excluded) of every `*.md` in the plans dir. A path matches a line
  when the line contains the path itself, or contains its basename and that
  basename has an extension and is at least 6 characters (so `index` alone never
  matches). Output grouped under `## <path>`: full-path hits first, then a
  `basename only:` sub-list (D10), each hit as
  `<source>:<line number>  <text trimmed to 200 chars>`; a path with no hits
  prints `(none)`. Exit 0 whenever it ran (informational), 2 on no paths.
- **Forbidden:** changing any existing subcommand; reading outside the repo;
  any dependency.
- **Acceptance criterion:** `node -e "let o='';try{o=require('child_process').execFileSync('node',['drydock/scripts/drydock-audit.test.mjs'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch(e){process.exit(1)}process.exit(/ok +. learnings finds a CLAUDE.md line naming the path/.test(o)&&/ok +. learnings finds a Deviation Log row naming the path/.test(o)&&/ok +. learnings lists basename-only hits after full-path hits/.test(o)&&/ok +. learnings ignores a short extensionless basename/.test(o)?0:1)"`

### Wave 1.4 - Fixes for the Wave 1.R rejection

> Added after approval (deviation 6). Retry 1 of the escalation policy's 2.
> Finding F1 needed no code: it was repaired in the plan document by the
> orchestrator while no wave was armed (deviation 5). This wave repairs F2.

#### T1.4.1 - Restore the validate-config usage line, and pin it

- **Description:** Restore the single space that T1.2.1's usage-block edit
  removed, so the line prints `validate-config <drydock.config.yaml>` again,
  and add one suite case that fails if any usage line loses it.
- **Files owned:** `drydock/scripts/drydock-audit.mjs`,
  `drydock/scripts/drydock-audit.test.mjs`
- **Depends on:** T1.3.1
- **Model / thinking:** Mechanical / off (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** the Wave 1.R verdict below (F2) and deviation 4. The usage
  block at the end of `drydock-audit.mjs`; at `a72deeb` the line read
  `validate-config <drydock.config.yaml>`. The test file's `cli` helper.
- **Cases:** `usage lists validate-config with its argument` (run the CLI with
  no arguments; assert the output includes `validate-config <drydock.config.yaml>`).
- **Forbidden:** any other change to the usage block or any subcommand; editing
  existing cases; acting on the review's nice-to-have items; any dependency.
- **Acceptance criterion:** `node -e "const c=require('child_process');let o='';try{o=c.execFileSync('node',['drydock/scripts/drydock-audit.test.mjs'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch(e){process.exit(1)}const u=c.spawnSync('node',['drydock/scripts/drydock-audit.mjs'],{encoding:'utf8'});process.exit(/ok +. usage lists validate-config with its argument/.test(o)&&(u.stdout+u.stderr).includes('validate-config <drydock.config.yaml>')?0:1)"`

### Wave 1.5 - Fixes for the second Wave 1.R rejection

> Added after approval (deviation 7). Retry 2 of the escalation policy's 2: a
> third rejection goes one model tier up, then to a human.

#### T1.5.1 - Make the check fixtures' criteria portable to /bin/sh

- **Description:** Two `check` cases pass criteria written as
  `node -e process.exit(7)` and `node -e process.exit(0)`. `check` runs criteria
  through the platform shell, and under `/bin/sh` (dash on ubuntu, and Git's sh
  here) the unquoted `(` is a syntax error that exits 2, so both cases fail on
  every ubuntu leg of the `plugin` job. Replace the two criteria with `exit 7`
  and `exit 0`.
- **Files owned:** `drydock/scripts/drydock-audit.test.mjs`
- **Depends on:** T1.4.1
- **Model / thinking:** Mechanical / off (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** the second Wave 1.R verdict below (G1). Test file lines
  ~1870 and ~1894. Measured by the orchestrator: `spawnSync(cmd, {shell})` with
  Git's `sh.exe` gives status 2 for `node -e process.exit(7)`, 7 for
  `node -e "process.exit(7)"`, and 7 for `exit 7`; cmd.exe gives 7 for all three.
- **Forbidden:** editing `drydock-audit.mjs`; changing any case name or any
  other assertion; any dependency.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');let o='';try{o=c.execFileSync('node',['drydock/scripts/drydock-audit.test.mjs'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch(e){process.exit(1)}const s=fs.readFileSync('drydock/scripts/drydock-audit.test.mjs','utf8');process.exit(/ok +. check flags a failing criterion/.test(o)&&/ok +. check passes an in-scope diff whose criteria exit 0/.test(o)&&!s.includes('-e process.exit(')?0:1)"`

### Wave 1.R - Quality review

#### T1.R.1 - Fresh-context quality review of Phase 1

- **Description:** After wavecheck PASS on Wave 1.3, review the Phase 1 diff for
  correctness, Windows/Linux path handling, CRLF, exit codes, and whether each
  new test can fail. Record `## Wave 1.R verdict, APPROVED|REJECTED, <date>`.
- **Files owned:** none (review only; the verdict is written by the orchestrator after the review)
- **Depends on:** T1.3.1, T1.4.1, T1.5.1
- **Model / thinking:** Judgment / extended (Opus 5.5)   **Executor:** general-purpose reviewer, fresh context
- **Context brief:** `git diff <baseline SHA>..HEAD -- drydock/ .github/`; this
  plan's Decision Log and Phase 1 task blocks; CLAUDE.md "Toolchain facts" items
  on cmd.exe criteria, Windows junctions, and CRLF.
- **Acceptance criterion:** `node -e "const s=require('fs').readFileSync('docs/plans/008-stats-gates-check-learnings.md','utf8');process.exit(/^## Wave 1[.]R verdict, APPROVED/m.test(s)?0:1)"`

## Phase 2: Skills and release

**Phase gate:** `cd site && npm run verify` exits 0, all plugin suites exit 0, and human release approval recorded by name and date (D5).

### Wave 2.1 - Skill text

> Three disjoint skill files, each consuming a Phase 1 interface that is frozen
> by the time this wave opens. All three are unexercised until a later session
> runs an installed 0.16.0 (D14).

#### T2.1.1 - The check skill

- **Description:** Create `drydock/skills/check/SKILL.md`: before work, the
  skill records `git rev-parse HEAD` and writes the intent file to
  `.drydock/check.md` in the exact format of T1.2.1's contract from the user's
  3-5 line statement; the work then proceeds with no plan and no waves; at the
  end it runs `drydock-audit.mjs check .drydock/check.md` and reports the output
  verbatim. Under ~80 lines.
- **Files owned:** `drydock/skills/check/SKILL.md`
- **Depends on:** T1.2.1
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D3, D14. T1.2.1's intent-file contract (copy it verbatim).
  `drydock/skills/init/SKILL.md` frontmatter for the `name`/`description`/
  `allowed-tools` shape. Script path written as
  `${CLAUDE_PLUGIN_ROOT}/scripts/drydock-audit.mjs` (substituted in skill
  bodies). The skill must say plainly what `check` does not do: it prevents
  nothing, it detects after the fact, and a FLAG is reported, never auto-fixed.
  It must also say that criteria run through the platform shell, `cmd.exe` on
  Windows, so a criterion should avoid backslash escapes (CLAUDE.md). Run the
  audit suite before committing: its case "consumers name only vocabulary the
  format contract defines" fails on backticked lowercase tokens that
  `plan-format.md` does not define, so prefer plain words over backticks for new
  terms.
- **Forbidden:** arming the ownership hook; writing a plan document; editing any
  other skill.
- **Acceptance criterion:** `node -e "const fs=require('fs');const f='drydock/skills/check/SKILL.md';if(!fs.existsSync(f))process.exit(1);try{require('child_process').execFileSync('node',['drydock/scripts/drydock-audit.test.mjs'],{stdio:'ignore'})}catch(e){process.exit(1)}const s=fs.readFileSync(f,'utf8');process.exit(/^name: check$/m.test(s)&&/drydock-audit[.]mjs check/.test(s)&&/[.]drydock[/]check[.]md/.test(s)&&/cmd[.]exe/.test(s)?0:1)"`

#### T2.1.2 - Planwright pulls learnings for the files it plans to own

- **Description:** In planwright's Step 2, add one short paragraph: once the
  files the plan will own are known, run `drydock-audit.mjs learnings <paths>`
  and carry every relevant hit into *Findings & constraints* (or state that none
  applied). Nothing else in the skill changes.
- **Files owned:** `drydock/skills/planwright/SKILL.md`
- **Depends on:** T1.3.1
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D10, D14. `drydock/skills/planwright/SKILL.md` § Step 2
  (lines ~59-67) and how the file already spells script paths
  (`${CLAUDE_PLUGIN_ROOT}/scripts/drydock-audit.mjs`). T1.3.1's contract. The
  audit suite's case "consumers name only vocabulary the format contract
  defines" (`drydock-audit.test.mjs` ~1126) polices backticked tokens in this
  file: run the suite before committing.
- **Forbidden:** any other edit to planwright; editing `reference/`.
- **Acceptance criterion:** `node -e "try{require('child_process').execFileSync('node',['drydock/scripts/drydock-audit.test.mjs'],{stdio:'ignore'})}catch(e){process.exit(1)}const s=require('fs').readFileSync('drydock/skills/planwright/SKILL.md','utf8');process.exit(/drydock-audit[.]mjs learnings/.test(s)?0:1)"`

#### T2.1.3 - Reconcile records the plan's token split

- **Description:** In reconcile, add one step: run
  `node ${CLAUDE_PLUGIN_ROOT}/scripts/drydock-stats.mjs <plan>` and paste its
  output verbatim under a `### Token usage` heading in the reconcile report,
  including the caveat line; if it exits 1, record that no transcript was found
  rather than omitting the heading.
- **Files owned:** `drydock/skills/reconcile/SKILL.md`
- **Depends on:** T1.1.2
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D4, D7, D14. `drydock/skills/reconcile/SKILL.md` in full
  (place the step where the report is assembled). T1.1.2's output shape. The
  audit suite's case "consumers name only vocabulary the format contract
  defines" (`drydock-audit.test.mjs` ~1126) polices backticked tokens in this
  file: run the suite before committing.
- **Forbidden:** changing any other reconcile step; proposing doc edits from the
  numbers.
- **Acceptance criterion:** `node -e "try{require('child_process').execFileSync('node',['drydock/scripts/drydock-audit.test.mjs'],{stdio:'ignore'})}catch(e){process.exit(1)}const s=require('fs').readFileSync('drydock/skills/reconcile/SKILL.md','utf8');process.exit(/drydock-stats[.]mjs/.test(s)&&/Token usage/.test(s)?0:1)"`

### Wave 2.2 - Cut 0.16.0

#### T2.2.1 - Bump to 0.16.0 and write the release note

- **Description:** Set the version to 0.16.0 in `plugin.json`, `copy.ts`
  `VERSION` and both READMEs' status lines, add the `check` row to the plugin
  README's component table, and write the 0.16.0 CHANGELOG entry covering the
  four changes, the measured CI scope (v3 only), and the D14 statement that the
  three skill changes are unexercised until installed.
- **Files owned:** `drydock/.claude-plugin/plugin.json`, `drydock/CHANGELOG.md`,
  `drydock/README.md`, `README.md`, `site/content/copy.ts`
- **Depends on:** T2.1.1, T2.1.2, T2.1.3
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D5, D14. The 0.15.2 CHANGELOG entry for voice and shape
  (bold lead sentence per change, measured claims only, test counts line at the
  end with the real counts from running the suites). `site/content/copy.ts` line
  ~81 only. CLAUDE.md "Honesty rule": no new site claim, `compatibility.md`
  untouched.
- **Forbidden:** any other `copy.ts` edit; editing `docs/compatibility.md`;
  claiming any skill change was exercised.
- **Acceptance criterion:** `node -e "const fs=require('fs');const v=JSON.parse(fs.readFileSync('drydock/.claude-plugin/plugin.json','utf8')).version;const c=fs.readFileSync('site/content/copy.ts','utf8');const l=fs.readFileSync('drydock/CHANGELOG.md','utf8');process.exit(v==='0.16.0'&&/VERSION = .0[.]16[.]0./.test(c)&&/^## 0[.]16[.]0/m.test(l)?0:1)"`

## Deviation Log

| # | Task | What deviated | Why | Impact | Recorded |
|---|---|---|---|---|---|
| 1 | T0 | T0's criterion tested `/_pending_/` against the whole plan; narrowed to `/[\|] _pending_ [\|]/`, a table cell | The plan contains the literal `_pending_` twice outside the Baseline table, in pressure-test item 11 and in the criterion's own text, so the criterion could fail but never pass (exit 1 with every cell filled). Item 11 states the intent: "no `_pending_` cell". Both halves re-proved through `spawnSync(..., {shell: true})`: exit 1 with one cell set back to `_pending_`, exit 0 filled | Criterion text changed after approval, in the orchestrator's T0 commit; intent unchanged. Same class as CLAUDE.md's "can fail but can never pass" note: a criterion that greps a file must not be able to match itself | 2026-10-07 |
| 2 | T1.1.3 | Finding "Sealed waves re-audit from a clean checkout" says 14 sealed waves in plans 005-007; `audit-corpus` selects 12. **discovered-by-wavecheck** | Plans 005-007 carry exactly 12 `### Wavecheck` headings, all PASS (005: 1.0; 006: 1.1, 1.2, 1.3, 2.1, 2.2; 007: 1.1-1.5, 2.1). The 14 included the two `1.R` review waves, which own no files and get no wavecheck. The script follows D9 exactly | None on the code: no sealed wave is skipped. The finding's count was wrong, not the gate | 2026-10-07 |
| 3 | T1.2.1 | A changed file matching a forbidden glob prints only `FLAG forbidden:`, never also `FLAG outside scope:` | The contract gave both rules and did not say which wins when one file meets both; one line per file keeps the FLAG count equal to the number of problems | One FLAG per file. Reported by the executor | 2026-10-07 |
| 4 | T1.2.1 | Adding the `check` usage line removed the space in the existing `validate-config` usage line, which now prints `validate-config<drydock.config.yaml>`. **discovered-by-wavecheck** | Collateral damage in the shared usage block. The `validate-config` dispatch and behaviour are untouched, so the task's "changing any existing subcommand" was not crossed. The executor's report counted `-1` without naming it | Cosmetic, user-visible in usage output. Carried to Wave 1.R. A repair needs a new wave with new task ids, and must not be made under T1.2.1's sealed id | 2026-10-07 |
| 5 | Wavecheck 1.1-1.3 | The three wavecheck reports paraphrased the audit's enforcement note, so from a clean checkout `audit-corpus` failed 3 of 15 waves. Each report gained a `2b. Enforcement ran` row quoting the sentence verbatim. **discovered by Wave 1.R review (F1)** | `audit-wave` without `.drydock/` recovers the enforcement receipt only from the literal `enforcement active: N hook decision(s) recorded for wave X (N denied)`. The orchestrator wrote prose instead. The counts (8, 6, 9, all 0 denied) are the audit's own, unchanged | Sealed reports amended in place by adding rows, not by rewording verdicts. Re-proved from a fresh clone with an empty `CLAUDE_CONFIG_DIR`. Every later report carries the sentence. A wavecheck that writes its own enforcement evidence must paste it, not paraphrase it | 2026-10-07 |
| 6 | Wave 1.4 | Wave 1.4 / T1.4.1 added after approval; T1.R.1 now also depends on T1.4.1 | Wave 1.R REJECTED (F2). CLAUDE.md: repair a review rejection in a NEW wave with NEW task ids. Retry 1 of 2 | One extra wave in Phase 1; Wave 1.R re-runs after it | 2026-10-07 |
| 7 | Wave 1.5 | Wave 1.5 / T1.5.1 added after approval; T1.R.1 now also depends on T1.5.1 | The re-review REJECTED on G1: two `check` fixtures used shell syntax that only cmd.exe accepts. Every wavecheck re-ran the criteria on Windows only, so none could see it. Retry 2 of 2 | One more Phase 1 wave. The lesson for this repo: CLAUDE.md warns about criteria that cross cmd.exe, and the same applies in reverse to test fixtures that `check` runs through `/bin/sh` in CI | 2026-10-07 |

## Wavecheck reports

### Wavecheck 1.1, PASS, 2026-10-07

Executed `fleet`: each task by its own spawned `drydock:executor` (Sonnet 5.5),
one at a time, each committed and `task-close`d before the next spawned. This
audit is by the orchestrating session, which wrote none of the diff. Wave armed
and audited with the REPO copy (D15); the installed 0.15.1 `audit-wave` was also
run and agrees.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `format_version: 3`, status `EXECUTING`, wave 1.1 is the first wave (T0 has no wave, `waveOf` → `null`), so no prior report is required. `validate-plan: PASS (11 task(s), 6 wave(s))` at T0 |
| 2. Ownership | PASS | Table below. Repo copy and installed 0.15.1 copy both `audit-wave 1.1: PASS (3 task(s), 3 commit(s), attribution: manifest)`. Enforcement ran: 8 hook decisions, 0 denied (T1.1.1: 4 allow, T1.1.2: 2, T1.1.3: 2); bash layer 17 commands, 0 writes outside `owns`. Working tree clean |
| 2b. Enforcement ran | PASS | `enforcement active: 8 hook decision(s) recorded for wave 1.1 (0 denied)`. The audit's literal sentence, added after Wave 1.R finding F1 (deviation 5): `audit-wave` recovers the receipt from this sentence when `.drydock/` is gone |
| 3. Forbidden | PASS | T1.1.1: `--numstat` 21/0 and 27/0, no line removed anywhere, so no existing case, `derivePlanState` or `WAVECHECK_RE` changed; no import added. T1.1.2: commit touches only its two files; imports are `node:` built-ins only; no `writeFile`/`mkdir`/`rm`/network call in the script; no money conversion. T1.1.3: the yml diff is exactly the stats `run:` line, `fetch-depth: 0` with its comment, and the `audit-corpus` step; no `paths:`, no `\|\| true`; `drydock-audit.mjs` untouched; header states the v2 exclusion and the ceiling |
| 4. Acceptance | PASS | Each criterion re-run by the auditor through `spawnSync(cmd, {shell: true})` (cmd.exe): T1.1.1 exit 0 (suite 142/142), T1.1.2 exit 0 (8/8), T1.1.3 exit 0 (`audit-corpus: PASS, 12 wave(s) in 3 plan(s)`) |
| 5. Deviations | PASS | Executors reported none. One plan-finding error discovered here and logged as deviation 2 |

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.1.1 | `8918038` | `drydock/scripts/drydock-audit.mjs`<br>`drydock/scripts/drydock-audit.test.mjs` | `drydock/scripts/drydock-audit.mjs`<br>`drydock/scripts/drydock-audit.test.mjs` | none |
| T1.1.2 | `94b2a28` | `drydock/scripts/drydock-stats.mjs`<br>`drydock/scripts/drydock-stats.test.mjs` | `drydock/scripts/drydock-stats.mjs`<br>`drydock/scripts/drydock-stats.test.mjs` | none |
| T1.1.3 | `58b0fee` | `.github/workflows/verify.yml`<br>`drydock/scripts/audit-corpus.mjs` | `drydock/scripts/audit-corpus.mjs`<br>`.github/workflows/verify.yml` | none |

Executor notes carried forward to Wave 1.R: T1.1.1's gate checks nothing when
the target wave owns no task (a review wave such as `1.R` is never refused).
T1.1.2's per-session row total counts the requests first held by that main
session, not its subagents; overhead prints to one decimal. A smoke run on plan
007 reported 92.0% overhead with one session holding 152M of 161M orchestration
tokens while naming six other plans, which is D7's caveat measured, not a defect.

**Unexercised (D14):** Wave 2.1's three skill edits (`check`, planwright,
reconcile) have not run yet. When they do, this session and every session until
0.16.0 is installed will load the 0.15.1 copies, so this report says nothing
about them.

Deviations logged: 2 (1 discovered by wavecheck)

### Wavecheck 1.2, PASS, 2026-10-07

Executed `fleet` by one spawned `drydock:executor` (Sonnet 5.5); audited by the
orchestrating session, which wrote none of the diff.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | Status `EXECUTING`; wave 1.1 has a PASS report, committed at `a556e8c`. **Staleness: non-empty.** `git diff a72deeb..HEAD` over the two owned files shows exactly one commit, `8918038` (T1.1.1, this task's declared dependency): a sequential handoff, not drift. Re-validated before arming: every anchor the brief names exists, shifted +21 to +28 lines, and the executor was given current line numbers. Baseline SHA deliberately kept at `a72deeb`, because Wave 1.R's review diff is defined against it. **T1.1.1's lock exercised live:** `wave-start ... 1.3` before this wave refused with `wave-start: wave 1.2 has no PASS wavecheck report (none), so wave 1.3 cannot be armed.`, exit 1, no `wave-owns.json` written; `wave-start ... 1.2` then armed |
| 2. Ownership | PASS | Table below. Repo copy and installed 0.15.1 copy both `audit-wave 1.2: PASS (1 task(s), 1 commit(s))`. Enforcement ran: 6 hook decisions, 0 denied; bash layer 8 commands, 0 writes outside `owns`. Working tree clean |
| 2b. Enforcement ran | PASS | `enforcement active: 6 hook decision(s) recorded for wave 1.2 (0 denied)`. Added after Wave 1.R finding F1 (deviation 5) |
| 3. Forbidden | PASS, one finding | No import added; the diff never names `wave-owns`; no existing subcommand's code changed: the only removed line is in the shared usage block, see deviation 4. Live run against this repo (base `a72deeb`, owned `drydock/**`, one passing and one `exit 4` criterion): flagged `.github/workflows/verify.yml` and both plan files outside scope, `FLAG criterion exited 4`, `check: FLAG (4)`, exit 1 |
| 4. Acceptance | PASS | Criterion re-run by the auditor through cmd.exe: exit 0; suite 148/148. The executor showed the moved-file case is failable: it dropped `--no-renames`, saw that case alone fail (147/148), and restored the flag |
| 5. Deviations | PASS | Executor-reported deviation logged as 3; one discovered here, logged as 4 |

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.2.1 | `9d351fb` | `drydock/scripts/drydock-audit.mjs`<br>`drydock/scripts/drydock-audit.test.mjs` | `drydock/scripts/drydock-audit.mjs`<br>`drydock/scripts/drydock-audit.test.mjs` | none |

**Unexercised (D14):** Wave 2.1's three skill edits are unexercised by this
session and by any session until 0.16.0 is installed.

Deviations logged: 4 (2 discovered by wavecheck)

### Wavecheck 1.3, PASS, 2026-10-07

Executed `fleet` by one spawned `drydock:executor` (Sonnet 5.5); audited by the
orchestrating session, which wrote none of the diff.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | Status `EXECUTING`; waves 1.1 and 1.2 have PASS reports (`4af95ed`), so the repo-copy `wave-start` (T1.1.1's lock) armed 1.3 without refusal. Staleness non-empty for the same reason as 1.2: `git diff a72deeb..HEAD` over the owned files is exactly `8918038` and `9d351fb`, this task's dependency chain; anchors re-located and current line numbers given to the executor |
| 2. Ownership | PASS | Table below. Repo copy and installed 0.15.1 copy both `audit-wave 1.3: PASS (1 task(s), 1 commit(s))`. Enforcement ran: 9 hook decisions, 0 denied; bash layer 5 commands, 0 writes outside `owns`. Working tree clean |
| 2b. Enforcement ran | PASS | `enforcement active: 9 hook decision(s) recorded for wave 1.3 (0 denied)`. Added after Wave 1.R finding F1 (deviation 5) |
| 3. Forbidden | PASS | The only removed line is the `node:fs` import, re-added with `readdirSync`: no dependency. No existing subcommand changed; the `validate-config` usage line (deviation 4) was left untouched as instructed. Reads only `git ls-files` and the plans dir. Live runs: `learnings` with no path prints usage and exits 2; `learnings drydock/skills/planwright/SKILL.md index` groups by path and lists basename-only hits under `basename only:`. The executor's run for `drydock/scripts/drydock-audit.mjs` reported 3 hits, and the auditor's own awk/grep count of Deviation Log rows plus `CLAUDE.md` lines agrees: 1 + 2 |
| 4. Acceptance | PASS | Criterion re-run by the auditor through cmd.exe: exit 0; suite 153/153. The executor mutated the basename floor (6 → 1) and the list order; each turned its case red; both were reverted |
| 5. Deviations | PASS | None reported; none discovered |

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.3.1 | `7440fc0` | `drydock/scripts/drydock-audit.mjs`<br>`drydock/scripts/drydock-audit.test.mjs` | `drydock/scripts/drydock-audit.mjs`<br>`drydock/scripts/drydock-audit.test.mjs` | none |

For Wave 1.R: full-path matching is a plain substring test, per the contract,
so a short path such as `index` matches every `index.html` line as a full-path
hit. The 6-character floor applies only to the basename rule. This is conformant,
and left to the review to judge.

**Unexercised (D14):** Wave 2.1's three skill edits are unexercised by this
session and by any session until 0.16.0 is installed.

Deviations logged: 4 (2 discovered by wavecheck)

### Wavecheck 1.4, PASS, 2026-10-07

Executed `fleet` by one spawned `drydock:executor` (Sonnet 5.5); audited by the
orchestrating session, which wrote none of the diff.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | Status `EXECUTING`; wave 1.4 added after approval (deviation 6), committed at `16c3f1a` before arming; waves 1.1-1.3 have PASS reports, so the repo-copy `wave-start` armed it. Staleness: the owned files changed since `a72deeb` only by this plan's own task commits |
| 2. Ownership | PASS | Table below. Repo copy and installed 0.15.1 copy both `audit-wave 1.4: PASS, docs/plans/008-stats-gates-check-learnings.md (1 task(s), 1 commit(s), attribution: manifest)`. Working tree clean |
| 2b. Enforcement ran | PASS | `enforcement active: 2 hook decision(s) recorded for wave 1.4 (0 denied)`. Bash layer: 5 commands, 0 writes outside `owns` |
| 3. Forbidden | PASS | `--numstat` 1/1 and 3/0. The single changed source line is the `validate-config` usage line, now `validate-config <drydock.config.yaml>`; no other usage line, subcommand or existing case touched; no review nice-to-have acted on |
| 4. Acceptance | PASS | Criterion re-run by the auditor through cmd.exe: exit 0. It exited 1 before the task (proved when the wave was added). The executor showed the new case FAIL with the space missing |
| 5. Deviations | PASS | None reported; none discovered |

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.4.1 | `e2cff77` | `drydock/scripts/drydock-audit.mjs`<br>`drydock/scripts/drydock-audit.test.mjs` | `drydock/scripts/drydock-audit.mjs`<br>`drydock/scripts/drydock-audit.test.mjs` | none |

**Unexercised (D14):** Wave 2.1's three skill edits are unexercised by this
session and by any session until 0.16.0 is installed.

Deviations logged: 6 (2 discovered by wavecheck, 1 by review)

### Wavecheck 1.5, PASS, 2026-10-07

Executed `fleet` by one spawned `drydock:executor` (Sonnet 5.5); audited by the
orchestrating session, which wrote none of the diff.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | Status `EXECUTING`; wave 1.5 added after approval (deviation 7), committed at `8a2a155` before arming; waves 1.1-1.4 have PASS reports. Staleness: the owned file changed since `a72deeb` only by this plan's own task commits |
| 2. Ownership | PASS | Table below. Repo copy and installed 0.15.1 copy both `audit-wave 1.5: PASS, docs/plans/008-stats-gates-check-learnings.md (1 task(s), 1 commit(s), attribution: manifest)`. Working tree clean |
| 2b. Enforcement ran | PASS | `enforcement active: 2 hook decision(s) recorded for wave 1.5 (0 denied)`. Bash layer: 6 commands, 0 writes outside `owns` |
| 3. Forbidden | PASS | `--numstat` 2/2, test file only: the two criterion strings became `exit 7` and `exit 0`; case names and assertions unchanged (they match `FLAG criterion exited 7:` and `check: PASS (1 file(s), 1 criteria)`, not the command text); `drydock-audit.mjs` untouched |
| 4. Acceptance | PASS | Criterion re-run by the auditor through cmd.exe: exit 0 (it exited 1 before the task). **POSIX-shell run, the CI condition the wavechecks had missed:** on Windows, Node's `shell: true` takes its shell from `%ComSpec%`. With `ComSpec` pointed at Git's `sh.exe` (probe: `node -e process.exit(7)` → status 2, `syntax error near unexpected token`), the suite at `eed9b83^` failed exactly the two G1 cases (152/154), and at HEAD all five plugin suites pass: audit 154/154, stats 8/8, enforce-owns 42, detect-bash-writes 21, resolve-target 8. WSL has dash but no Node, so this is the nearest local stand-in for the ubuntu leg, not a run of it |
| 5. Deviations | PASS | None reported; none discovered |

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.5.1 | `eed9b83` | `drydock/scripts/drydock-audit.test.mjs` | `drydock/scripts/drydock-audit.test.mjs` | none |

**Unexercised (D14):** Wave 2.1's three skill edits are unexercised by this
session and by any session until 0.16.0 is installed.

Deviations logged: 7 (2 discovered by wavecheck, 1 by review)

## Wave 1.R verdict, REJECTED, 2026-10-07 (re-review after Wave 1.4)

A second fresh-context Opus 5.5 reviewer, read-only.

- **F1: VERIFIED.** A fresh clone of `e13c148` with no `.drydock/` and an empty
  `CLAUDE_CONFIG_DIR`/`HOME` gave `audit-corpus: PASS, 16 wave(s) in 4 plan(s)`,
  rc 0. It passed both as a CRLF checkout and as an LF (`core.autocrlf=false`)
  clone, which is what the Linux CI checkout gets.
- **F2: VERIFIED.** Usage prints `validate-config <drydock.config.yaml>`. With
  the space removed again in a scratch clone, the pinning case failed (153/154).
- **G1, must-fix (T1.2.1's fixtures).** `check flags a failing criterion` and
  `check passes an in-scope diff whose criteria exit 0` pass the criteria
  `node -e process.exit(7)` / `node -e process.exit(0)`. Under `/bin/sh` on
  ubuntu-latest (dash), the unquoted `(` is a syntax error that exits 2, so both
  cases fail on every ubuntu leg of the `plugin` job. CI has not run on Phase 1
  yet (local `main` is ahead of `origin/main`). The orchestrator re-measured it
  with Git's `sh.exe`: status 2 unquoted, 7 quoted, 7 for `exit 7`, against 7
  for all three under cmd.exe. **Repair:** Wave 1.5, T1.5.1.

Nice-to-haves, not acted on: `audit-corpus` prints `nullnull` if a spawn itself
fails (the exit code still gates); `learnings ./x` does not normalise a leading
`./`; of the three lock cases only the refusal case turns red without the lock,
because the other two are allow-cases.

## Wave 1.R verdict, REJECTED, 2026-10-07

Fresh-context Opus 5.5 reviewer, read-only, given only T1.R.1's context brief
plus the two items wavecheck routed to it. Two must-fix findings, both
re-measured by the orchestrator before acting.

- **F1 (T1.1.3's CI step, caused by this plan's own reports).** From a clean
  clone with an empty `CLAUDE_CONFIG_DIR`, `audit-corpus` failed
  `FAIL, 3 of 15 wave(s)`: plan 008 waves 1.1-1.3 each exit 1 with
  `plan declares enforcement: required but ... enforcement.log holds no entries`.
  `sealedRecord` recovers the receipt only from the audit's literal sentence
  `enforcement active: N hook decision(s) recorded for wave X (N denied)`, and
  the three reports paraphrased it ("Enforcement ran: 8 hook decisions"). The
  local PASS held only because this checkout still has `.drydock/`. **Repair:**
  no code; each report gained a `2b. Enforcement ran` row carrying the sentence
  verbatim (deviation 5), and every later report in this plan carries it too.
- **F2 (T1.2.1, deviation 4).** `validate-config<drydock.config.yaml>` in the
  usage output, a regression from `a72deeb`. **Repair:** Wave 1.4, T1.4.1.

Nice-to-haves recorded, not acted on: `learnings` with a bare short path
substring-matches broadly (conformant; planwright passes concrete paths, and
an `owns` glob such as `drydock/**` matches nothing); `check` prints
`exited undefined` for a signal-killed or maxBuffer-overflowed criterion; a
non-ancestor `base` diffs without warning; arming an `x.R` wave skips the
earlier-wave check; `audit-corpus` detects `format_version: 3` on any line, not
only the frontmatter; the stats suite has no exit-2 or CRLF case (both work by
hand); `learnings --plans-dir` with no value exits 3, not 2.

Verified fine by the reviewer, with evidence: D11 semantics and non-vacuous
lock tests; D7/D8 dedupe with exact sums that would differ without dedupe
(101 vs 102, 59 vs 5/50); per-session totals summing to orchestration; the
corpus heading rule character-for-character `WAVECHECK_RE`; `check` on CRLF
intents, deleted files and continuation-line criteria; `learnings` on nested
`CLAUDE.md` and CRLF Deviation Logs.

## Progress log

| Date | Task | Result | Notes |
|---|---|---|---|
| 2026-10-07 | T0 | DONE | Baseline at `a72deeb`; README row added; status EXECUTING; criterion repaired (deviation 1) and exits 0; `assert-matrix` PASS |
| 2026-10-07 | T1.1.1 | DONE | `8918038`; suite 142/142 |
| 2026-10-07 | T1.1.2 | DONE | `94b2a28`; stats suite 8/8 |
| 2026-10-07 | T1.1.3 | DONE | `58b0fee`; `audit-corpus: PASS, 12 wave(s) in 3 plan(s)` |
| 2026-10-07 | Wave 1.1 | PASS | wavecheck 1.1 |
| 2026-10-07 | T1.2.1 | DONE | `9d351fb`; suite 148/148 |
| 2026-10-07 | Wave 1.2 | PASS | wavecheck 1.2; deviation 4 carried to 1.R |
| 2026-10-07 | T1.3.1 | DONE | `7440fc0`; suite 153/153 |
| 2026-10-07 | Wave 1.3 | PASS | wavecheck 1.3 |
| 2026-10-07 | T1.R.1 | REJECTED | F1 (CI from a clean checkout) repaired in the plan; F2 to Wave 1.4 |
| 2026-10-07 | T1.4.1 | DONE | `e2cff77` |
| 2026-10-07 | Wave 1.4 | PASS | wavecheck 1.4 |
| 2026-10-07 | T1.R.1 | REJECTED | re-review: F1, F2 verified; G1 (fixtures fail under /bin/sh) to Wave 1.5 |
| 2026-10-07 | T1.5.1 | DONE | `eed9b83` |
| 2026-10-07 | Wave 1.5 | PASS | wavecheck 1.5; suites pass with `shell: true` routed to sh |

## Reconcile report
