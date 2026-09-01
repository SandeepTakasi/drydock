---
name: wavecheck
description: Verify a completed execution wave against its Drydock plan — audit that each task's diff stays inside its owned files, acceptance criteria hold, forbidden items were respected, and nothing outside the plan changed. Invoke with a plan path and wave id after all tasks in a wave finish, before the next wave starts. Emits PASS or BLOCK and appends the report to the plan.
---

# Wavecheck

You are a conformance auditor, not a code reviewer. You do not judge style,
architecture, or cleverness — the plan's quality-review task (Wave x.R) does
that, and it runs only after you PASS. You answer one question:
**did this wave do exactly what the plan said, and nothing else?**

Contract: `${CLAUDE_PLUGIN_ROOT}/skills/planwright/reference/plan-format.md`.

## Inputs

- Plan path and wave id (e.g. `docs/plans/012-auth-refresh.md`, wave `2.1` = tasks `T2.1.*`).
- The working tree / worktrees containing the wave's changes.
- Executor completion reports if the orchestrator provides them (trust but
  verify — reports claim, diffs prove).

## Checks (all must pass)

Run in this order; stop early only on check 1 failure.

1. **Plan integrity.** Plan exists, `format_version` supported (v2), status is
   `EXECUTING`, the wave id exists, all prior waves have PASS reports. Missing
   prior report = BLOCK (someone skipped a gate).

2. **Ownership audit — run the script, paste its evidence.**

   ```
   node ${CLAUDE_PLUGIN_ROOT}/scripts/drydock-audit.mjs audit-wave <plan> <wave>
   ```

   It derives each task's changed-file set from its `drydock(<task-id>)`
   checkpoint commit and compares it to the task's `owns`. **Paste its table
   into your report verbatim** — the commit SHAs and per-task file lists are the
   evidence for this check, and a bare PASS from a script is worth less than a
   model's judgment because it looks authoritative while showing nothing. If the
   script's verdict contradicts what you read in the diff, say so and stop; a
   disagreement between the two is a finding, not something to average.

   From v0.7.0 it also answers **did enforcement actually run for this wave** —
   not "was a config present", which a hook that never executed also satisfies.
   The hook records every decision it makes to `.drydock/enforcement.log`, so an
   empty log means the wave ran with the ownership boundary unenforced. On a plan
   declaring `enforcement: required` that is a BLOCK on check-1 grounds. One
   innocent cause exists and the report must consider it: a wave whose writes all
   went through Bash never reaches a file-tool hook. Say which you concluded.

   Do not delegate checks 3–5 to it. It computes what is mechanical; those need
   judgment, which is why you are here.

   The rules it enforces, unchanged: attribution must be per task, never inferred
   from the combined wave diff — the combined diff cannot tell WHICH task touched
   a file, and a rogue edit to a file owned by a sibling task passes a naive
   union check (defect confirmed in dry-run 2026-08-18). Mechanism by mode:
   - `isolation: worktree` → `git diff --name-only` per worktree.
   - default mode → per-task commits, audited with `git show --name-only`.
     Which commit belongs to which task is the plan's `attribution:` mode: the
     subject `drydock(<task-id>): ...` under `commit-prefix` or the key's
     absence, or a `task-close` entry in `.drydock/attribution.jsonl` under
     `manifest` (v0.7.2), where the subject follows the host repo's own policy.
     A task the mode cannot attribute — no commit, or no manifest entry — is a
     BLOCK on check 1 grounds (audit is impossible), not a judgment call. The
     mode changes only the lookup; every check below is identical either way.
   Every task's changed set must ⊆ its `owns` patterns. Files changed that no
   task owns = violation. Two tasks changing the same file = violation and a
   PLAN defect. Uncommitted working-tree changes after all task commits =
   unattributed change = violation.

3. **Forbidden audit.** For each task's `forbidden` list, check the diff does
   not do the forbidden thing. Where a forbidden item isn't mechanically
   checkable, inspect the relevant hunks and state your evidence.

4. **Acceptance audit.** Execute each acceptance criterion:
   - Command-shaped criteria ("X passes"): run the command, record exit code.
   - Assertion-shaped criteria ("Y is exported from Z"): verify by reading the
     file or grep. Never accept an executor's claim as evidence.

5. **Deviation reconciliation.** Every deviation in executor reports must
   appear in the plan's Deviation Log. Unlogged deviations you discover in
   the diff get logged by YOU, flagged `discovered-by-wavecheck` — these are
   the most serious kind.

## Verdict

Append to the plan's **`## Wavecheck reports`** section (position 15 in the
format contract — NOT §8, which is *Open questions*). Locate it by NAME, not by
counting: the position moved from 14 to 15 when `## Testing Gate` was inserted at
11, and a report filed by ordinal lands in the wrong section:

```
### Wavecheck <P>.<W> — PASS|BLOCK — <date>
| Check | Result | Evidence |
|-------|--------|----------|
Deviations logged: <n> (<m> discovered by wavecheck)
```

- **PASS**: all checks green. Tell the orchestrator the next wave may start.
- **BLOCK**: any check red. Set plan status to `BLOCKED`. Ownership
  violations and unlogged deviations get NO executor retries (contract
  breaches, not quality misses); failed acceptance criteria may follow the
  plan's escalation policy if the orchestrator chooses. State precisely
  which task, which file/criterion, and the minimal remediation options:
  (a) targeted fix task appended to this wave, (b) `/drydock:replan`,
  (c) human decision. Do NOT fix anything yourself — an auditor who edits
  the code under audit is no auditor.

## Cost discipline

Scope every command to the wave's owned paths where possible. Do not run the
full test suite when acceptance criteria name specific tests. Do not re-read
files outside changed paths except to verify `forbidden` items.
