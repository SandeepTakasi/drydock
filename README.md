# Drydock

*Nothing sails until it leaves the dock.*

Plan-first parallel execution for Claude Code: a rigorous plan document as
the source of truth, subagents executing it in parallel waves with disjoint
file ownership, a conformance audit gating every wave, and a reconcile loop
that feeds execution learnings back into your docs.

**Status: internal pilot (v0.3.0).** No field benchmarks yet — on purpose.
What exists today is an adversarial [self-audit](docs/self-audit.md) of the
auditor itself (it caught a lying executor while all tests were green, and
exposed + fixed a defect in our own attribution design), plus an honest
[compatibility checklist](docs/compatibility.md) of what's verified vs pending.

Homepage: `index.html` · Plugin: [`drydock/`](drydock/) ·
Lifecycle, pieces, and philosophy: [`drydock/README.md`](drydock/README.md)

```
/plugin marketplace add <org>/drydock
/plugin install drydock@drydock
```
