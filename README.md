<p align="center">
  <img src="assets/drydock-logo-full.png"
       alt="Drydock -- nothing sails until it leaves the dock" width="840">
</p>

Plan-first parallel execution for Claude Code: a rigorous plan document as
the source of truth, subagents executing it in parallel waves with disjoint
file ownership, a conformance audit gating every wave, and a reconcile loop
that feeds execution learnings back into your docs.

**Status: open pilot (v0.7.0).** Four plans have been planned, executed
and gated with it — see the [case study](docs/case-study-001-homepage.md) and
[docs/plans/](docs/plans/). Gate compliance is measured, not asserted: 27 of 28
wave gates invoked at their boundary across those 4 plans, **1 skipped** — and
the skip is the useful part, because the next gate refused to open on the
missing report and the retroactive audit found a real ownership breach behind
it. Every session knew it was observed, so the figure is a ceiling rather than a
rate, and it is published as PUBLISHED, **not** PASSED. From v0.6.0 ownership is
**enforced by a hook** rather than requested in prose, and what one run costs is
[published](docs/cost-001.md) — including the number that run never captured.
Behind it: an adversarial
[self-audit](docs/self-audit.md) of the auditor itself (it caught a lying
executor while all tests were green, and exposed + fixed a defect in our own
attribution design) and an honest
[compatibility checklist](docs/compatibility.md) of what's verified vs pending.

Homepage: <https://takasivenkatasandeep-08.github.io/drydock/> ·
Plugin: [`drydock/`](drydock/) ·
Lifecycle, pieces, and philosophy: [`drydock/README.md`](drydock/README.md)

```
/plugin marketplace add TakasiVenkataSandeep-08/drydock
/plugin install drydock@drydock
```
