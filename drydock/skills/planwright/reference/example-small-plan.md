---
plan: 012-retry-webhook-deliveries
format_version: 3
status: DONE
isolation: none
enforcement: required
attribution: manifest
lane: small
execution: solo
created: 2026-04-14
approved_by: priya (2026-04-14)
---

# 012 - Failed webhook deliveries retry instead of vanishing

**Plan location:** `docs/plans/`, committed with the repo.

> **Execution protocol.** `execution: solo`, so the orchestrating session runs
> the tasks itself. File edits go through Write or Edit, never a Bash redirect,
> because the ownership hook sees only file tools. Run the wave gate before
> closing the wave.

**Ownership enforcement:**

```bash
node <plugin>/scripts/drydock-audit.mjs wave-start docs/plans/012-retry-webhook-deliveries.md 1.0
# ... tasks run ...
node <plugin>/scripts/drydock-audit.mjs audit-wave docs/plans/012-retry-webhook-deliveries.md 1.0
rm .drydock/wave-owns.json
```

## 1. Requirement

A webhook delivery that fails with a retryable error is retried with backoff
instead of being dropped, and a delivery that exhausts its retries is visible to
an operator rather than silently gone.

## 2. Spec reference

None, the requirement is complete.

## 3. Surgical-scope statement

Add a retry loop and a `failed` terminal state to the existing delivery worker.
No queue library, no new table, no change to the public webhook API. Dead-letter
inspection tooling is explicitly out of scope and listed in section 9.

## 4. Baseline

**Baseline SHA:** `a41c9e2`

| Command | Expected at baseline |
|---|---|
| `npm test` | 214 passing, 0 failing, exit 0 |
| `npm run lint` | exit 0 |

No pre-existing failures. Every acceptance criterion below is therefore gated on
a clean tree.

## 5. Practices in effect

| Practice | Value | Source |
|---|---|---|
| Testing approach | Test-with: the failing test and the code that satisfies it land in one task | priya, interview |
| File edits during a wave | Write/Edit only, never Bash redirects | the hook sees only file tools |
| Commit granularity | One commit per task, owned files only | plan-format.md |
| Attribution | `manifest`, via `task-close` after each commit | this plan's header |
| Quality gates | `npm test`, `npm run lint` | existing CI |

## 6. Findings & constraints

**F1. Failures are swallowed, not logged.** `src/webhooks/deliver.ts:88` catches
every error from `fetch` and returns `undefined`; the caller at `worker.ts:42`
treats `undefined` as success and marks the row `delivered`. Reproduced by
pointing a delivery at a closed port: the row reads `delivered` with no request
having succeeded.

**F2. The status column has no failure state.** `migrations/0007_deliveries.sql`
declares `status text check (status in ('pending','delivered'))`, so a retry
count and a terminal failure have nowhere to live without a migration.

**Constraint C1. Retryable and permanent failures must be distinguished.** A 410
from a subscriber that has deleted its endpoint must not be retried 5 times an
hour for a day; a 503 must. The split is by status class, and 4xx other than 408
and 429 is permanent.

## 7. Decision Log

| # | Question | Decision | Decided by | Rationale |
|---|---|---|---|---|
| 1 | Add a queue library, or retry in the existing worker? | Existing worker, `setTimeout` backoff. | priya | Volume is under 200 deliveries a day. A queue is operational surface nobody asked for, and section 9 keeps the option open if volume changes. Consumed by T1.0.2. |
| 2 | How many attempts before terminal failure? | 5, with backoff 1s, 4s, 15s, 60s, 300s. | priya | Covers a subscriber restart without holding a row for over an hour. Consumed by T1.0.2. |
| 3 | Widen the status check constraint, or add a separate column? | Widen the constraint and add `attempts integer not null default 0`. | planner (assumed, flag if wrong) | One migration, and `status` stays the single source of truth an operator reads. Consumed by T1.0.1. |

## 8. Open questions

| # | Question | Blocks | Recommended answer |
|---|---|---|---|
| Q1 | Should an operator be alerted on terminal failure, or is the row enough for now? | Nothing in this plan | The row. Alerting is section 9. |

## 9. Out of scope / follow-ups

- Dead-letter inspection and manual replay tooling.
- Alerting on terminal failure (Q1).
- Moving to a real queue if daily volume passes a few thousand (Decision 1).

## 10. Execution policies

**Review protocol.** Per task: the acceptance criterion is run by the gate, not
taken from the executor's report. Per wave: `audit-wave` before the wave closes.

**Checkpointing.** One commit per task, owned files only, then
`drydock-audit.mjs task-close docs/plans/012-retry-webhook-deliveries.md <task-id>`.

**Plan document writes.** The plan file is owned by no task. Close the wave with
`rm .drydock/wave-owns.json` before writing the Deviation Log into it, then
commit it.

## 11. Testing Gate

N/A, this plan changes a background worker and a database migration. There is no
user-facing surface to drive: the behaviour is asserted by the unit tests each
task carries, and the retry schedule is verified with a fake timer rather than by
waiting five minutes in a browser.

## 12. Pressure-test verdict

APPROVED WITH AMENDMENTS, 2026-04-14. The reviewer found that T1.0.2's original
criterion, `grep -q 'retry' src/webhooks/deliver.ts`, passed at baseline because
a comment already contained the word. Replaced with the assertion below, which
was re-run at baseline and failed. No same-wave dependencies; both file paths in
section 6 resolve.

## Phase 1: Retry with a terminal state

**Exit state:** a retryable failure is retried on the Decision 2 schedule, a
permanent failure is not retried, and an exhausted delivery is `failed` in the
database. `npm test` and `npm run lint` both exit 0.

**Phase gate:** `npm test && npm run lint`, plus priya's sign-off. Closed
2026-04-15 by priya.

#### T0 - Baseline verification
- **Description:** Records the SHA and both gate results on the untouched tree.
- **Files owned:** none (read-only)
- **Depends on:** none
- **Model / thinking:** Mechanical / off
- **Context brief:** section 4 of this plan.
- **Acceptance criterion:** `npm test && npm run lint`

### Wave 1.0 - Schema, then behaviour

> One wave, two tasks, disjoint files. T1.0.2 depends on T1.0.1's migration, so
> they run in order within the wave rather than as a fleet.

#### T1.0.1 - Give a delivery somewhere to record failure
- **Description:** Adds a migration widening the `status` check constraint to
  include `failed` and adding `attempts integer not null default 0`, per
  Decision 3. Schema only, no behaviour change.
- **Files owned:** `migrations/0012_delivery_attempts.sql`
- **Depends on:** T0
- **Model / thinking:** Mechanical / off
- **Context brief:** finding F2 and Decision 3 in this plan;
  `migrations/0007_deliveries.sql` for the existing constraint and the project's
  migration naming.
- **Forbidden:** editing `0007_deliveries.sql` (migrations are append-only),
  touching any file under `src/`, dropping or renaming a column.
- **Acceptance criterion:** `npm test`

#### T1.0.2 - Retry the retryable, fail the rest
- **Description:** Replaces the swallowed catch at `deliver.ts:88` with a
  classified result, retries a retryable failure on the Decision 2 schedule, and
  marks a delivery `failed` once attempts are exhausted. The tests land with the
  code.
- **Files owned:** `src/webhooks/deliver.ts`, `src/webhooks/worker.ts`, `src/webhooks/deliver.test.ts`
- **Depends on:** T1.0.1
- **Model / thinking:** Standard / default
- **Context brief:** findings F1, C1 and Decisions 1 and 2 in this plan;
  `deliver.ts` in full; `worker.ts:42` where `undefined` is read as success. Use
  the fake timer already set up in `src/test/timers.ts`.
- **Forbidden:** adding a dependency, changing the public webhook API, editing
  any migration, retrying a 4xx other than 408 and 429 (C1).
- **Acceptance criterion:** `npx vitest run src/webhooks/deliver.test.ts -t "retries a 503 five times then marks the delivery failed"`

## Deviation Log

| # | Task | What deviated | Why | Impact | Recorded |
|---|---|---|---|---|---|
| 1 | T1.0.2 | `worker.ts` needed a two-line change the description did not anticipate, to stop treating a classified failure as success | F1 named the line but the plan described only `deliver.ts` | None, `worker.ts` was already in the task's `owns` | before the commit |

## Wavecheck reports

### Wavecheck 1.0, PASS, 2026-04-15

| Check | Result | Evidence |
|---|---|---|
| 1. Plan integrity | PASS | `status: EXECUTING`, wave 1.0 is the only implementation wave. |
| 2. Ownership | PASS | `4f21ab8` touched `migrations/0012_delivery_attempts.sql` only; `9c3e770` touched the three files T1.0.2 owns. No commit in the wave's span is unattributed. Tree clean. |
| 3. Forbidden | PASS | No new dependency in `package.json`; `0007_deliveries.sql` unchanged; the classifier returns `permanent` for 404 and 410, `retryable` for 408, 429 and 5xx. |
| 4. Acceptance | PASS | Both criteria run verbatim, exit 0. `npm test` 219 passing. |
| 5. Deviation reconciliation | PASS | Deviation 1 recorded before the commit, inside `owns`. |

note: enforcement active: 9 hook decision(s) recorded for wave 1.0 (0 denied)

**Verdict: PASS.**

## Progress log

| Date | Task | Result | Notes |
|---|---|---|---|
| 2026-04-14 | T0 | PASS | 214 passing at `a41c9e2` |
| 2026-04-15 | T1.0.1 | PASS | `4f21ab8` |
| 2026-04-15 | T1.0.2 | PASS | `9c3e770`, deviation 1 |

## Reconcile report

One proposal, accepted: `CLAUDE.md` now records that `src/webhooks/worker.ts`
reads `undefined` from a deliver call as success, since F1 showed that is a trap
anyone touching delivery will hit. No other document needed a change; Decision 1
is already visible in the plan for whoever revisits the queue question.
