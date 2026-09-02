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

**Human-gate refusal.** Read every `**Phase gate:**` line in the plan. Any phase
whose gate declares a human approval must show it recorded — `CLOSED, approved
by <name> — <date>`, per the format contract. An open gate, or a closed one with
no name and date, is a refusal: closing the plan would record a sign-off nobody
gave. Do not infer approval from a passing wave, from an APPROVED quality
review, or from the fact that someone asked you to run reconcile — those are
different claims, and a human gate exists precisely because none of them
substitute for it. Say which phase is unsigned and stop.

This refusal was added after a plan reached reconcile with all waves PASS, a
properly attributed verdict sheet, and an unsigned Phase 2 gate: nothing in this
skill would have stopped the close, and only the orchestrating session holding
back by hand prevented it. The gate a closer cannot see is a gate that does not
hold.

**Testing Gate refusal.** If the plan's `## Testing Gate` section exists and is
not `N/A — <reason>`, then before doing anything else:

1. Read `.drydock/testing/<plan-id>/verdict.md` — that exact path, frozen by the
   format contract and written by `drydock:seatrial`.
2. **Missing** → refuse. The plan declared browser-verified cases and nothing
   verified them; closing it would record a completion that did not happen.
3. **Reads `NO-GO`** → refuse. Say which blocker cases failed.
4. **Reads `GO-WITH-OVERRIDES`** → proceed only if the sheet records the override
   for every failed major case, each naming the case, the reason, and who
   decided. An override that names no decider is not an override.
5. **Reads `GO`** → proceed.

A refusal here is not a finding to be argued with: it means the plan is not
finished. Report it and stop. Do not run the gate yourself — reconcile is a
closer, not a verifier — and do not propose doc updates from an unverified plan.

## Process

1. **Deviation synthesis.** Cluster the Deviation Log by root cause, not by
   task. Typical clusters: (a) assumption was false, (b) instructions were
   ambiguous, (c) codebase drifted mid-execution, (d) executor overreach.
   Clusters (a) and (c) produce doc proposals; (b) produces planwright-skill
   feedback; (d) produces executor-contract feedback.

2. **Assumption postmortem.** For every load-bearing entry in the plan's
   **Decision Log** and **Findings & constraints**: held / failed /
   never-exercised, keyed by its id (`D3`, `D4`, …). Failed assumptions that
   trace to a claim in a doc (CLAUDE.md says X, reality was Y) are your
   highest-value findings, and `never-exercised` is a verdict, not a gap to
   round up — plan 005 recorded D6 that way rather than counting an unrun
   pressure test as a win.

   This step read "every Assumptions Register entry" until 0.8.12, naming a
   section the contract never defined. The Decision Log is what you were already
   reading in practice; now it says so. The output section is unchanged and
   keeps its name: `## Assumption postmortem` is real, is in the corpus, and is
   this step's product rather than its input.

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
   section (position 17 in the format contract — NOT §9, which is *Out of scope /
   follow-ups*). Locate it by NAME, not by counting: this position moved from 16
   to 17 when `## Testing Gate` was inserted at 11, and a report filed by ordinal
   lands in the wrong section. Then set status `RECONCILED`,
   and summarize for the user: n proposals by target, top 3 by impact, and
   any planwright/executor feedback (cluster b/d) as bullet points they may
   fold into the skill files.

## Anti-goals

- No retrospective prose ("the team did well"). Findings and diffs only.
- No proposals restating what docs already say.
- No editing the plan's historical sections — §§2–8 are a record, not a draft.
