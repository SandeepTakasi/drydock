---
name: reconcile
description: Close out a completed Drydock plan — consolidate the Deviation Log, diff the plan's assumptions against what execution actually revealed, and produce proposed (never auto-applied) updates to project docs like CLAUDE.md, ADRs, and architecture notes so the next plan starts from reality instead of stale context. Invoke after the final wave passes wavecheck.
---

# Reconcile

Plans die; what they learned shouldn't. You turn one executed plan into
durable corrections to the project's authoritative context. You NEVER edit
any doc — you propose diffs a human applies or rejects.

Contract: `${CLAUDE_PLUGIN_ROOT}/skills/planwright/reference/plan-format.md`.
Allowed proposal targets come from plugin config `docs_targets`
(default: `CLAUDE.md,docs/decisions,docs/architecture.md`). Propose nothing
outside those paths.

## Inputs

A plan with all waves PASS. If any wave lacks a PASS report, refuse — reconcile
on an unverified plan launders unaudited changes into the docs.

## Process

1. **Deviation synthesis.** Cluster the Deviation Log by root cause, not by
   task. Typical clusters: (a) assumption was false, (b) instructions were
   ambiguous, (c) codebase drifted mid-execution, (d) executor overreach.
   Clusters (a) and (c) produce doc proposals; (b) produces planwright-skill
   feedback; (d) produces executor-contract feedback.

2. **Assumption postmortem.** For every Assumptions Register entry: held /
   failed / never-exercised. Failed assumptions that trace to a claim in a doc
   (CLAUDE.md says X, reality was Y) are your highest-value findings.

3. **New-knowledge harvest.** Facts execution established that no doc states
   and the next planner would need: new module boundaries, new invariants,
   commands that turned out to be the real way to test/build something.

4. **Proposal generation.** For each finding, emit a proposal:

```
#### Proposal R<n> — target: <path> — kind: correction|addition|deletion
Finding: <one sentence, citing deviation/assumption ids>
Confidence: high|medium|low
```diff
<minimal unified diff against the current doc content — read the doc first,
diff against what is actually there>
```
```

   Rules: minimal diffs; one concern per proposal; corrections outrank
   additions; anything with `low` confidence becomes a question to the human
   instead of a diff. If a finding warrants a NEW ADR, propose the ADR file
   content in full but mark it `addition`.

5. **Close the plan.** Append the full report to the plan's **`## Reconcile report`**
   section (position 16 in the format contract — NOT §9, which is *Out of scope /
   follow-ups*), set status `RECONCILED`,
   and summarize for the user: n proposals by target, top 3 by impact, and
   any planwright/executor feedback (cluster b/d) as bullet points they may
   fold into the skill files.

## Anti-goals

- No retrospective prose ("the team did well"). Findings and diffs only.
- No proposals restating what docs already say.
- No editing the plan's historical sections — §§2–8 are a record, not a draft.
