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

| 004-seatrial-e2e-gate | 6 | 5 | 5 | 1 | **1 gate SKIPPED at its boundary** — wave 2.0's gate was not run before wave 2.1 opened ([plan 004](plans/004-seatrial-e2e-gate.md) deviation 11); "continue" was read as authorisation to proceed rather than as a wave boundary. Caught by wavecheck 2.1's check 1 ("missing prior report = BLOCK") and run retroactively, where it **BLOCKed on a real ownership breach** (deviation 13, commit `5a32ac9`). Both waves converted to PASS on re-audit after Decision 12. Waves 1.R and 2.R excluded as review waves. |

| 005-small-lane-and-solo-mode | 1 | 1 | 1 | 0 | First plan on the `lane: small` / `execution: solo` track (v0.8.0), so **one wave and one gate by design** — the count is small because the ceremony was, which is the point of the lane. Gate invoked at its boundary on a bare "execute the plan", recorded before the phase gate. **Read this row as the weakest evidence in the table, not the strongest:** one session planned it, executed it, audited it and knew A3 was under measurement, so it fails both halves of this row's stated close condition at once. It is recorded because the ledger is appended as things happen, not because the sample got better. |

**Final total: 28 of 29 gates invoked at their boundary, 1 skipped, 27 of 29 recorded
before the next wave opened, across 5 plans.** Unprompted on 27 of 28 invoked (the
exception is bookkeeping, not prompting: gate 1.0 of plan 003 was invoked unprompted
but not written down).

**Reaching 5 plans is not progress toward PASSED, and saying so is the point of
this line.** This ledger has argued from the start that the bias is structural and
*not resolved by adding more plans run under the same conditions*. Plan 005 is run
under the same conditions, only more so — the session that authored it also
executed and audited it. Counting it as the fifth of "5 to 10" would convert an
argument this file already made into a number that contradicts it. The sample size
moved; what the sample is evidence *of* did not.

**The skip is the most informative row in this ledger, and it is not a footnote.**
Plans 001–003 produced 22 clean gates under observation, which is the weakest kind of
evidence — a number with no failure in it cannot show what happens when the process
breaks. Plan 004 shows it: a gate was skipped, the *next* gate refused to open on a
missing prior report, the retroactive audit found a genuine ownership violation
sitting behind the skip, and the plan went BLOCKED until a human decided it. That is
a working failure path, observed end to end. It is better evidence for the design
than the 22 clean gates were, and it is why this ledger reopened after being closed.

**Mechanically re-verified 2026-08-19** by the falsification check below, for plans
001–003: 22 `### Wave x.y` implementation headings across `docs/plans/*.md`, 22
matching `### Wavecheck x.y — PASS` reports, zero unmatched. The 4 review waves
(`1.R`×3, `2.R`) are excluded by design.

**And the limit of that check, found 2026-08-21.** It cannot detect plan 004's skip.
A retroactively written report is a `### Wavecheck x.y` heading like any other, so the
grep matches it and the count comes out clean — 28 wave headings against 31 wavecheck
headings today, the surplus being re-audits. **The only durable evidence of a skip is
that somebody logged it as a deviation.** That is what `site/scripts/assert-matrix.mjs`
now checks: every plan logging a skipped gate must be accounted for in this ledger, and
the ledger's `Skipped` total may not fall below what the plans record.

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

## Status: REOPENED 2026-08-21 by plan 004. Still PUBLISHED, not PASSED.

Measurement was closed at 3 plans on 2026-08-19 and reopened when plan 004 executed under gates and logged the first skip. It stops here again, at 4. What the numbers support and what
they do not, stated so nobody has to re-derive it:

**Supported.** Across 4 plans and 28 wave gates, the orchestrating session invoked
`drydock:wavecheck` at 27 of 28 boundaries, including on bare "continue" and
"go ahead" instructions that named no gate. **One gate was skipped** (plan 004,
deviation 11) and one ran without being recorded (plan 003, deviation 2). Both were
caught by the following gate rather than by a human noticing, which is the property
worth having: the recovery path is observed, not assumed.

**Not supported — and not fixable by continuing.** Two independent reasons this is
not a pass:

1. **Sample is 4 plans against a stated bar of 5–10.** Publishing real numbers was
   the release criterion; reaching the sample size was part of it. At 4 we publish
   what we have and say it is short.
2. **The bias is structural.** Every session in this ledger knew A3 was under
   measurement, and one said so aloud at a gate. That makes 27/28 an **upper bound
   on compliance, not a rate.** As the header has said from the start, this is
   *not resolved by adding more plans run under the same conditions* — so plans 5
   through 10 under the same setup would raise the count and change nothing about
   what it means. That is the substantive argument for stopping at 4 rather than
   grinding out a bigger biased number.

**What would actually close A3 as PASSED:** one orchestrating session that has not
been told the gate is observed, on a plan whose waves it did not plan. Until then the
honest claim is "invoked at 27 of 28 observed boundaries, all under observation."
