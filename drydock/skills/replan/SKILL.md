---
name: replan
description: Surgically repair a stale or blocked Drydock plan — re-verify its load-bearing decisions and findings against the current codebase, patch only the tasks invalidated by drift or deviations, and preserve the Decision Log and all completed-wave history. Invoke on a plan that is blocked, old, or whose assumptions no longer hold.
disable-model-invocation: true
---

# Replan

User-invoked only (`/drydock:replan <plan-path>`). Auto-triggered replanning is
how plans get silently mutated mid-execution — that is why model invocation is
disabled. If Claude believes a replan is needed, it recommends the command;
the human runs it.

Contract: `${CLAUDE_PLUGIN_ROOT}/skills/planwright/reference/plan-format.md`.

## Scope discipline — the whole point

Replan is a PATCH operation, never regeneration. Hard invariants:

- Decision Log: append-only. Prior decisions stand unless the human explicitly
  reverses one (append the reversal as a new entry; never rewrite).
- Completed waves and their wavecheck reports: immutable history.
- Task ids: never reused. A replaced task gets a new id with suffix
  (`T2.3.1r1`); the original is struck through with a pointer, not deleted.

## Process

1. **Assumption sweep.** Re-verify every load-bearing entry in the plan's
   **Decision Log** and **Findings & constraints** against the current codebase.
   Mark each verified-today or FAILED, and append any new load-bearing fact you
   discover to Findings & constraints.

   **This sweep is judgement, not a command run, and that is a real weakness.**
   Until 0.8.12 this step said "run every Assumptions Register verification
   command" — but no such section exists in the format contract, in any plan, or
   anywhere outside this file and `reconcile`. The step named a source that was
   never defined, so it could not be followed as written. The Decision Log is
   where those facts actually live (`reconcile` already reads it that way —
   plan 005's Assumption postmortem keys its rows on `D3`/`D4`/`D6`), but its
   columns are `| # | Question | Decision | Decided by | Rationale |` with no
   verification command, so nothing here is machine-checkable. **Follow-up, not
   fixed:** a real Assumptions Register with a command column is a contract
   change at `format_version: 4`, touching every consumer. Until then, say in
   the report which assumptions you re-verified by running something and which
   you re-verified by reading.

2. **Blast radius.** For each FAILED assumption and each unresolved BLOCK,
   compute the affected task set: tasks whose `files owned`, `description`,
   `implementation sketch`, `acceptance criterion` or `depends on` reference the
   failed fact — the contract's field names, not invented ones. Everything outside
   that set is untouchable — resist the urge to "improve" healthy tasks.

3. **Patch.** For affected tasks only: rewrite the task block (new id),
   re-derive its wave placement, and re-validate disjoint ownership across the
   affected waves. If patching changes wave structure, renumber ONLY
   not-yet-executed waves.

4. **Re-gate.** New/changed questions go through one batched clarification and
   into the Decision Log, same as planwright. Then set status back to `DRAFT`
   if the plan was `BLOCKED` pre-execution, or `EXECUTING` if mid-execution and
   the human approves resuming — that approval is explicit, ask for it.

5. **Report.** Summarize: assumptions failed, tasks replaced (old id → new id),
   waves renumbered, decisions added. One screen, no prose padding.

## Refusals

- More than ~40% of remaining tasks invalidated → recommend a fresh planwright
  run instead; a patch that large is a rewrite wearing a patch's clothes.
- Asked to alter completed-wave history or reuse a task id → refuse, cite the
  invariants above.
