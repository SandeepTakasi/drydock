# Drydock Plan Format Contract v2

Every Drydock skill reads or writes plan documents conforming to this file.
Planwright WRITES it. Executors OBEY task blocks from it. Wavecheck AUDITS
against it. Replan PATCHES it. Reconcile CLOSES it. Changing this file means
bumping `format_version` and updating every consumer; skills refuse plans with
unsupported versions.

v2 = the team's proven plan template merged with the Drydock execution
contract. Task IDs are `T<phase>.<wave>.<n>` and never change once assigned.

## Plan file

One markdown file at `{plans_dir}/NNN-<feature-slug>.md` (NNN = zero-padded
sequence; `plans_dir` from plugin config, default `docs/plans`).

## Header (yaml frontmatter)

```yaml
---
plan: NNN-<slug>
format_version: 2
status: DRAFT | APPROVED | EXECUTING | BLOCKED | DONE | RECONCILED
isolation: none | worktree          # opt-in worktree isolation, default none
created: YYYY-MM-DD
approved_by: <name> | unapproved
---
```

Status transitions are one-way except BLOCKED (may return to EXECUTING after
replan or human decision). Only a human sets APPROVED. Executors MUST NOT run
against a plan that is not APPROVED or EXECUTING. RECONCILED is set only by
the reconcile skill.

## Orchestrator contract — embed VERBATIM in every plan's preamble

> **Execution protocol.** Spawn each task in the current wave as its declared
> executor agent (`drydock:executor`, or `drydock:executor-isolated` when the
> header says `isolation: worktree`) with its declared model and thinking
> budget, passing ONLY the task's context brief. Before starting any wave, run
> the staleness check below. Wait for all tasks in the wave, then invoke the
> `drydock:wavecheck` skill with this plan path and the wave id. Do not begin
> the wave's quality-review task, or the next wave, until wavecheck reports
> PASS. On BLOCK, set status BLOCKED and stop — do not self-repair; the paths
> out are `/drydock:replan` or a human decision. Quality-review rejections
> follow the escalation policy (max 2 retries → tier up → human); wavecheck
> BLOCKs on ownership violations or unlogged deviations get NO retries. When
> the final wave and phase gate pass, invoke `drydock:reconcile`.

**Staleness check (before every wave):**
`git diff <baseline SHA>..HEAD -- <wave's owned files + wave-0 contract files>`.
Non-empty → wave is STALE: re-validate its tasks against current code, update
the baseline SHA and Decision Log, then execute — or run `/drydock:replan` if
task contents (not just context) are invalidated. Never execute a stale wave
on original assumptions.

## Required sections, in order

1. **Requirement** — one paragraph; what must be true when done. No solutioning.
2. **Spec reference** — path + sections, or "none — requirement is complete".
3. **Surgical-scope statement** — the smallest satisfying diff, 1–2 sentences.
4. **Baseline** — filled by T0: commit SHA, quality-gate results verbatim,
   pre-existing failures excluded from acceptance criteria.
5. **Practices in effect** — table: practice, value, source (user answer /
   CLAUDE.md / CI config).
6. **Findings & constraints** — exploration output; link files, don't restate.
7. **Decision Log** — append-only: `| # | Question | Decision | Decided by | Rationale |`.
   "Decided by" is `user` or `planner (assumed — flag if wrong)`.
8. **Open questions** — `| # | Question | Blocks | Recommended answer |`;
   blocked tasks carry `BLOCKED(Qn)`.
9. **Out of scope / follow-ups** — valuable-but-not-required work, explicitly
   excluded from all tasks.
10. **Execution policies** — review protocol (wavecheck gate + quality review
    + phase review), escalation, checkpointing (commit per task/wave, rollback
    unit), human gates, tracker mirroring (plan file is source of truth).
11. **Pressure-test verdict** — adversarial fresh-context review result;
    APPROVED required before presenting to the user.
12. **Phases → waves → tasks** — structure below.
13. **Deviation Log** — append-only, maintained during execution:
    `| # | Task | What deviated | Why | Impact | Recorded |`. Sources:
    executor completion reports, wavecheck discoveries
    (flagged `discovered-by-wavecheck`), staleness findings.
14. **Wavecheck reports** — appended by wavecheck per wave (shape in that skill):
    `### Wavecheck <phase>.<wave> — PASS|BLOCK — <date>`.
15. **Progress log** — `| Date | Task | Result | Notes |`.
16. **Reconcile report** — appended once by reconcile at completion.

## Phase / wave / task structure

```markdown
## Phase 0: Pre-flight
#### T0 — Baseline verification
- Status: TODO — runs every quality-gate command on the untouched codebase,
  records SHA + results in Baseline. Files owned: — (read-only).
  Model: Mechanical / off.

## Phase <p>: <milestone>
**Exit state:** <verifiable, ideally shippable state>
**Phase gate:** <commands> + architectural review + <human gate if required>

### Wave <p>.0 — Contracts
> Pins the shared surface (interfaces, types, schemas, API shapes, migration
> order). Every phase with a parallel wave needs one.

#### T<p>.<w>.<n> — <title>
- **Status:** TODO | IN PROGRESS | DONE | BLOCKED(Qn)
- **Description:** 2–4 sentences, one outcome, no "and also".
- **Files owned:** explicit list/globs — disjoint from every other task in
  this wave; nothing else may be written.
- **Depends on:** task IDs from earlier waves, or —
- **Model / thinking:** per rubric   **Executor:** drydock:executor |
  drydock:executor-isolated
- **Context brief:** exactly what the executing agent reads — files, spec
  sections, Decision Log entries. Nothing more.
- **Forbidden:** explicit non-goals (optional but recommended).
- **Implementation sketch:** Complex/Judgment tiers only — signatures, data
  flow, invariants. Never complete code.
- **Acceptance criterion:** one command that exits 0.

### Wave <p>.R — Quality review
#### T<p>.R.1 — Fresh-context quality review of the phase's waves
- Runs AFTER wavecheck PASS on the phase's final wave. Context brief: the
  phase diff, this plan, Decision Log. Reviews correctness, conventions,
  edge cases — conformance was already audited by wavecheck. Verdict recorded;
  APPROVED required for the phase gate.
```

Checkpointing rule (load-bearing, not stylistic): in default (non-worktree)
mode, every executor MUST commit its completed task as
`drydock(<task-id>): <task name>` touching only its owned files — per-task
commits are wavecheck's only sound attribution mechanism. Plans may not relax
this to per-wave commits unless isolation is worktree.

Ownership rules:
- `Files owned` sets within a wave MUST be disjoint (planwright validates at
  write time; wavecheck re-verifies against the actual diff).
- A file owned in wave N may be owned again in wave N+1 (sequential handoff).
- Task IDs are never reused; a replan-replaced task gets a suffixed id
  (`T2.1.3r1`) and the original is struck through with a pointer.

## Worktree merge procedure (isolation: worktree only)

Minimal v1 — expect revision after the first real isolated run:
1. Merge only after the wave's wavecheck PASS, in ascending task-id order.
2. Each merge is expected conflict-free — ownership is disjoint by
   construction. ANY conflict is a plan defect: stop merging, set BLOCKED,
   record a deviation naming both tasks and the file.
3. Never resolve conflicts inline; resolution goes through `/drydock:replan`
   or human decision.
4. After the last merge, re-run the wave's command-shaped acceptance criteria
   once against the merged tree (integration smoke) before closing the wave.

Isolated executors commit inside their worktree as
`drydock(<task-id>): <task name>` and report the `worktree_commit` sha.
