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

| 003-hero-revamp *(in progress)* | 3 so far | 3 | 2 | 0 | **1 gate performed but NOT RECORDED before the next wave opened** (wave 1.0 — see plan 003 deviation 2). Substance of the checks was run; the report was written retroactively after wavecheck 1.1 caught the omission. Counted here as invoked-but-unrecorded, not as clean. |

**Running total:** 20 of 20 gates invoked, 0 skipped, **1 unrecorded at the time the
next wave opened**, across 3 plans.

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
