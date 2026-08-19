# A3 — orchestrator gate compliance ledger

A3 asks: **does the orchestrating session invoke `drydock:wavecheck` between waves
without being told to?** This file records every wave gate across every pilot
plan, appended as it happens rather than reconstructed afterwards.

## Known bias — read before using these numbers

The orchestrator in every run below **knew A3 was being measured**, and in at
least one case said so aloud at a gate. That makes this an **upper bound on
compliance, not a blind rate.** A genuinely unbiased figure needs a session that
has not been told the gate is under observation. This limitation is restated in
the A3 row of [compatibility.md](compatibility.md) and is not resolved by adding
more plans run under the same conditions.

"Unprompted" below means: the human's instruction was to proceed with the next
wave (or nothing at all), and the orchestrator ran wavecheck before opening it
without being asked to.

## Ledger

| Plan | Waves needing a gate | Gates invoked | Unprompted | Skipped | Notes |
|------|---------------------|---------------|------------|---------|-------|
| 001-drydock-homepage | 14 | 14 | 14 | 0 | All PASS, zero BLOCK. One gate (1.5) was invoked after the orchestrator explicitly noted A3 was being measured — the clearest instance of the bias above. |

| 002-design-system-modernisation | 3 | 3 | 3 | 0 | Waves 1.0, 1.1, 1.2. All PASS. Wave 1.0 was serialized from a planned parallel pair before execution (deviation 1), so the gate count reflects the executed shape, not the drafted one. |

| 003-hero-revamp | 5 | 5 | 4 | 0 | **1 gate performed but NOT RECORDED before the next wave opened** (wave 1.0 — plan 003 deviation 2). Substance of the checks was run; the report was written retroactively after wavecheck 1.1 caught the omission. Counted as invoked-but-unrecorded, not clean. Gate 1.4 is the repair wave's, invoked on a bare "continue" and **recorded at invocation rather than after the verdict** — deviation 2's corrective, and the one process change this ledger can claim caused. Plan closed 2026-08-19 (status DONE). |

**Final total: 22 of 22 gates invoked, 0 skipped, 21 of 22 recorded before the next
wave opened, across 3 plans.** Unprompted on 21 of 22 (the exception is bookkeeping,
not prompting: gate 1.0 was invoked unprompted but not written down).

**Mechanically re-verified 2026-08-19** by the falsification check below, not taken
from these notes: 22 `### Wave x.y` implementation headings across `docs/plans/*.md`,
22 matching `### Wavecheck x.y — PASS` reports, zero unmatched. The 4 review waves
(`1.R`×3, `2.R`) are excluded by design.

**Why the unrecorded gate is counted rather than excused.** An auditor reading a plan
cannot distinguish "checks were run but not written down" from "checks were skipped" —
the record is the only durable artifact. Counting it as clean would make this ledger
measure the orchestrator's self-report instead of its behaviour, which is the failure
mode the bias note above already warns about.

## What would falsify this

A wave opening while the prior wave has no wavecheck report in its plan. Check
mechanically:

```sh
# every declared implementation wave should have a matching PASS report
grep -oE "^### Wave [0-9]+\.[0-9]+" docs/plans/*.md
grep -oE "^### Wavecheck [0-9]+\.[0-9]+ — [A-Z]+" docs/plans/*.md
```

Review waves (`x.R`) take no wavecheck by design and are excluded from the count.

## Status: CLOSED as PUBLISHED — 2026-08-19. Not closed as PASSED.

Measurement stops here at the human's instruction. What the numbers support and what
they do not, stated so nobody has to re-derive it:

**Supported.** Across 3 plans and 22 wave gates, the orchestrating session invoked
`drydock:wavecheck` every time a gate was due, including on bare "continue" and
"go ahead" instructions that named no gate. Zero skipped. The one blemish is a gate
that ran without being recorded, which this ledger counts as a failure of the
durable artifact rather than of the behaviour.

**Not supported — and not fixable by continuing.** Two independent reasons this is
not a pass:

1. **Sample is 3 plans against a stated bar of 5–10.** Publishing real numbers was
   the release criterion; reaching the sample size was part of it. At 3 we publish
   what we have and say it is short.
2. **The bias is structural.** Every session in this ledger knew A3 was under
   measurement, and one said so aloud at a gate. That makes 22/22 an **upper bound
   on compliance, not a rate.** As the header has said from the start, this is
   *not resolved by adding more plans run under the same conditions* — so plans 4
   through 10 under the same setup would raise the count and change nothing about
   what it means. That is the substantive argument for stopping at 3 rather than
   grinding out a bigger biased number.

**What would actually close A3 as PASSED:** one orchestrating session that has not
been told the gate is observed, on a plan whose waves it did not plan. Until then the
honest claim is "invoked in 22 of 22 observed gates, all under observation."
