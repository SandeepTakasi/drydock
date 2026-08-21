# Cost of one Drydock run — plan 004

Drydock's pitch includes per-task model right-sizing as an economy story, and
until now the repo carried **no cost figure of any kind**. This page is the first
one. It measures a single completed run —
[plan 004](plans/004-seatrial-e2e-gate.md), which added the `seatrial` browser
gate — from artifacts that survive in the repository, so every number below is
recoverable by anyone with a clone.

**Read the limits section before quoting anything here.** The most important
number for a buying decision — token spend — is **not in this page, because it
was never instrumented.** Saying so is the point of publishing.

## What one run produced

| | |
|---|---|
| Baseline SHA → HEAD | `7f934ba` → `05cbe49` |
| Elapsed | 2026-08-20 20:58 → 2026-08-21 02:30 IST (**5 h 32 m wall clock**) |
| Phases / implementation waves | 2 / 6 |
| Tasks | 20 (1 superseded and replaced) |
| Wave gates run | 9 wavecheck reports for 6 waves — 3 are re-audits after BLOCK |
| Commits | 44 total: 19 task checkpoints, 21 plan-bookkeeping, 4 other |
| Product diff | 23 files, +937 / −19 |
| Plan document | +980 lines, ending at 1,641 |
| Decisions logged | 12 |
| Deviations logged | 14 |

## The ratio worth staring at

**The plan document grew by 980 lines to produce 937 lines of product diff.**
Slightly more plan than product, at roughly 1.05:1.

That is the honest headline and it is not flattering, but it needs its context:
the 937 lines are five skill files, a plugin manifest and six generated spec
files, and the plan document is also the execution record — decisions,
deviations, nine audit reports and a progress log all live inside that 980. It
is not 980 lines of specification for 937 lines of code. It is a specification
plus an audit trail, and if you do not want the audit trail you should not be
paying for it.

For comparison, the earlier
[case study](case-study-001-homepage.md) records a 2,069-line plan against a
240-line prior artifact — a far worse ratio, on a plan the case study itself
says sat near the "do not use this" boundary. Two data points, both n=1, and
they differ by 8x. Neither is a rate.

## Model mix

The right-sizing rubric was applied, and the distribution is the shape it
predicts — most work is cheap, judgment is concentrated:

| Tier | Tasks |
|---|---|
| Mechanical | 10 |
| Standard | 7 |
| Judgment | 4 |

**This does not mean the run was cheap.** Task execution is only part of the
spend: planning, the adversarial pressure test, nine wavecheck audits, the
quality-review waves and reconcile all run at Standard or Judgment tier and are
*not* in the table above, because they are not tasks. A 50%-Mechanical task mix
sitting under an all-Judgment orchestration layer can easily cost more in total
than a single-session implementation would have. **Nothing here measures that**,
which is the gap named below.

## What this page does NOT measure

- **Token spend. Not instrumented, not recoverable.** No transcript-level usage
  was recorded for this run, so there is no total, no per-tier breakdown, and no
  orchestration-vs-execution split. This is the single most useful number for
  anyone deciding whether to adopt Drydock, and it is missing.
- **Wall clock is elapsed time, not work time.** 5 h 32 m spans a human's
  evening, including breaks, reading, and decisions taken away from the keyboard.
  It is an upper bound on machine time and a meaningless lower bound on anything.
- **No comparison to a baseline.** Running the same task under plain plan mode
  and diffing the cost would be the interesting experiment; it is not this one.
  At n=1 per arm, with the task text, repo state and reviewer prompt unpinned,
  the comparison would be arguable, and an arguable number is worth less to this
  repo than an unarguable one. It needs a protocol designed for it.
- **n = 1.** One plan, one repository, one operator, one model family.

## What a future run must capture

One thing, and it is cheap: **total token usage, split into orchestration
(planning, gates, reviews, reconcile) and execution (tasks).** That single split
answers the question this page cannot — whether right-sizing task models
recovers what the gate layer costs, or whether it does not. Until it exists, the
economy claim in the plugin description is unevidenced and should be read as a
design intent rather than a measured result.
