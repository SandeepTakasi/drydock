# Plans

Every plan Drydock has executed, kept as written. These are execution records,
not documentation samples — the Decision Logs, Deviation Logs and wavecheck
reports are the parts worth reading, and they are the parts a tidied-up example
would have lost.

| Plan | What it built | Status |
|---|---|---|
| [001-drydock-homepage](001-drydock-homepage.md) | The `site/` homepage, 28 tasks across 14 waves | RECONCILED |
| [002-design-system-modernisation](002-design-system-modernisation.md) | Design-token and typography pass | RECONCILED |
| [003-hero-revamp](003-hero-revamp.md) | Hero section rebuild | DONE |
| [004-seatrial-e2e-gate](004-seatrial-e2e-gate.md) | The `seatrial` browser gate (v0.5.0) | RECONCILED |

Plan 001 also has a [field case study](../case-study-001-homepage.md) written
against it, including the parts that reflect badly on the tool.

## Two of these fail the validator, on purpose

```
validate-plan: FAIL (1) — docs/plans/001-drydock-homepage.md
validate-plan: FAIL (1) — docs/plans/004-seatrial-e2e-gate.md
```

**That is a real defect in each plan, and the tool is right.** Both place a task
in the same wave as a task it depends on — `T2.3.1` depends on `T2.3.2` in wave
2.3, and `T2.1.2` depends on `T2.1.1` in wave 2.1. Same-wave tasks are declared
to run in parallel, so neither dependency can hold; `T2.1.2` generates spec files
from the run `T2.1.1` performs, and the two were placed side by side anyway.

Both were found by `drydock-audit.mjs validate-plan` **on its first run**, in
v0.6.0. Neither was caught by a wavecheck, by a fresh-context quality review, or
by an adversarial pressure test — three layers of review that all read these
plans and passed them. That is the argument for checking plans with a program
rather than only with a reader, and it is why these two failures stay here rather
than being quietly repaired.

They are not edited because **execution history is not a draft.** Rewriting a
finished plan to make a tool go green would destroy the evidence and teach the
opposite lesson.

## Running the tools against them

```bash
node drydock/scripts/drydock-audit.mjs validate-plan docs/plans/002-design-system-modernisation.md
node drydock/scripts/drydock-audit.mjs audit-wave   docs/plans/004-seatrial-e2e-gate.md 2.0
```

The `audit-wave` command above is also a fixture: it reports the ownership breach
that plan 004 actually committed at `5a32ac9` (deviation 13), where a checkpoint
commit staged a file outside its task's `owns`.

Plans 001–004 predate `format_version: 3` and carry no `enforcement:` key, so
they default to `none` and are not held to the enforcement-log check added in
v0.7.0. Nothing about them changed when that check landed.
