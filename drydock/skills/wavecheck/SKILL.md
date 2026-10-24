---
name: wavecheck
description: Verify a completed execution wave against its Drydock plan, audit that each task's diff stays inside its owned files, acceptance criteria hold, forbidden items were respected, and nothing outside the plan changed. Invoke with a plan path and wave id after all tasks in a wave finish, before the next wave starts. Emits PASS or BLOCK and appends the report to the plan.
---

# Wavecheck

You are a conformance auditor, not a code reviewer. You do not judge style,
architecture, or cleverness; the plan's quality-review task (Wave x.R) does
that, and it runs only after you PASS. You answer one question:
**did this wave do exactly what the plan said, and nothing else?**

Contract: `${CLAUDE_PLUGIN_ROOT}/skills/planwright/reference/plan-format.md`.

## Inputs

- Plan path and wave id (e.g. `docs/plans/012-auth-refresh.md`, wave `2.1` = tasks `T2.1.*`).
- The working tree / worktrees containing the wave's changes.
- Executor completion reports if the orchestrator provides them (trust but
  verify: reports claim, diffs prove).

## Checks (all must pass)

Run in this order; stop early only on check 1 failure.

1. **Plan integrity.** Plan exists, `format_version` is supported; the script's
   `SUPPORTED_FORMAT_VERSIONS` is the authority, never a number written here. Status is
   `EXECUTING`, the wave id exists, all prior waves have PASS reports. Missing
   prior report = BLOCK (someone skipped a gate).

   **Read `execution:` here too.** Under `execution: solo` (v0.8.0) the
   orchestrating session ran the tasks itself rather than spawning
   `drydock:executor` subagents. **That is not a deviation**; it is a declared
   property of the plan, and demanding it be logged per wave produced the same
   opening entry on every plan run this way. Say it once in your report, in the
   form the plan already states: the mechanical checks below are unaffected,
   because ownership per commit and executed acceptance criteria are evidence
   rather than opinion, while your judgement calls carry less weight because the
   session that wrote the diff is the session auditing it. Under `fleet`, or
   when the key is absent, nothing changes. A task executed by a sibling
   session the plan did not declare is a deviation, logged once per task, and
   audited as `solo` if it ran in this checkout or as `isolation: worktree` if
   it ran in its own.

2. **Ownership audit: run the script, paste its evidence.**

   ```
   node ${CLAUDE_PLUGIN_ROOT}/scripts/drydock-audit.mjs audit-wave <plan> <wave>
   ```

   It derives each task's changed-file set from its `drydock(<task-id>)`
   checkpoint commit and compares it to the task's `owns`. **Paste its table
   into your report verbatim.** The commit SHAs and per-task file lists are the
   evidence for this check, and a bare PASS from a script is worth less than a
   model's judgment because it looks authoritative while showing nothing. If the
   script's verdict contradicts what you read in the diff, say so and stop; a
   disagreement between the two is a finding, not something to average.

   From v0.7.0 it also answers **did enforcement actually run for this wave**,
   not "was a config present", which a hook that never executed also satisfies.
   The hook records every decision it makes to `.drydock/enforcement.log`, so an
   empty log means the wave ran with the ownership boundary unenforced. On a plan
   declaring `enforcement: required` that is a check-2 BLOCK, found here inside
   the ownership audit rather than at check 1. One
   innocent cause exists and the report must consider it: a wave whose writes all
   went through Bash never reaches a file-tool hook. Say which you concluded.

   Do not delegate checks 3–5 to it. It computes what is mechanical; those need
   judgment, which is why you are here.

   The rules it enforces, unchanged: attribution must be per task, never inferred
   from the combined wave diff; the combined diff cannot tell WHICH task touched
   a file, and a rogue edit to a file owned by a sibling task passes a naive
   union check (defect confirmed in dry-run 2026-08-18). Mechanism by mode:
   - `isolation: worktree` → `git diff --name-only` per worktree.
   - default mode → per-task commits, audited with `git show --name-only`.
     Which commit belongs to which task is the plan's `attribution:` mode: the
     subject `drydock(<task-id>): ...` under `commit-prefix` or the key's
     absence, or a `task-close` entry in `.drydock/attribution.jsonl` under
     `manifest` (v0.7.2), where the subject follows the host repo's own policy.
     A task the mode cannot attribute (no commit, or no manifest entry) is a
     check-2 BLOCK (audit is impossible), not a judgment call. The
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
   the diff get logged by YOU, flagged `discovered-by-wavecheck`. These are
   the most serious kind.

## Verdict

Append to the plan's **`## Wavecheck reports`** section (position 15 in the
format contract, NOT §8, which is *Open questions*). Locate it by NAME, not by
counting: the position moved from 14 to 15 when `## Testing Gate` was inserted at
11, and a report filed by ordinal lands in the wrong section:

```
### Wavecheck <P>.<W> - PASS|BLOCK - <date>
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
  (c) human decision. Do NOT fix anything yourself: an auditor who edits
  the code under audit is no auditor.

**Then move the plan's status, with the script rather than by hand**: every
plan in the field was still sitting at `EXECUTING` with its per-task `Status:`
fields wrong in 40 of 40 cases, because status was a thing somebody had to
remember (issue #5):

```
node ${CLAUDE_PLUGIN_ROOT}/scripts/drydock-audit.mjs plan-status --write <plan>
```

It derives the status from the wavecheck reports in the plan, including the one
you just wrote, so it cannot disagree with the gates. It refuses to choose
between `DONE` and `RECONCILED`: closing the plan is the separate step below,
not a side effect of the last wave passing. `validate-plan` fails on a status
the reports contradict, and `audit-wave` notes one, so a stale status is
detectable rather than merely regrettable.

## Closing the plan (after the final wave PASSes)

This step was the reconcile skill until 0.20.0. Run it once, when every wave
has a PASS report. You still edit no code and no doc: you propose diffs a human
applies or rejects. Allowed proposal targets come from plugin config
`docs_targets` (default `CLAUDE.md,docs/decisions,docs/architecture.md`).

**Refuse to close, and say why, when any of these holds:**

- **A human gate is unsigned.** Every `**Phase gate:**` line that declares a
  human approval must read `CLOSED, approved by <name> - <YYYY-MM-DD>`, the
  form in `plan-format.md`. Do not infer approval from a passing wave, an
  APPROVED review, or being asked to close.
- **The Testing Gate fails.** If `## Testing Gate` is not `N/A, <reason>`, run
  its specs (`npx playwright test <e2e_dir>/<plan-id>`, written by the plan's
  final-wave spec task) and apply the gate rule in the format contract. A
  blocker FAIL is NO-GO; a major FAIL needs a recorded human override naming the
  case, the reason and who decided. No specs at all is NO-GO: the plan declared
  browser cases and nothing ran them. Paste the runner's summary line verbatim.

**Then write the close-out** into the plan's **`## Reconcile report`** section
(located by NAME, position 17):

1. **Deviation synthesis.** Cluster the Deviation Log by root cause: (a) false
   assumption, (b) ambiguous instructions, (c) codebase drift, (d) executor
   overreach. (a) and (c) produce doc proposals; (b) and (d) produce feedback on
   planwright and the executor contract.
2. **Assumption postmortem.** Each load-bearing Decision Log and Findings entry,
   by id: held / failed / never-exercised. A failed assumption traced to a doc
   claim is the highest-value finding.
3. **Proposals.** One concern each, minimal diff against the doc as it is now;
   anything `low` confidence becomes a question instead:

   ````
   #### Proposal R<n> | target: <path> | kind: correction|addition|deletion
   Finding: <one sentence, citing deviation/decision ids>
   Confidence: high|medium|low
   ```diff
   <minimal unified diff>
   ```
   ````
4. **Token usage.** Run `node ${CLAUDE_PLUGIN_ROOT}/scripts/drydock-stats.mjs <plan>`
   and paste its output verbatim under `### Token usage`; if it exits 1, say no
   transcript was found. Propose nothing from the numbers.

Set status `RECONCILED`, and tell the user: proposals by target, the top three,
and any (b)/(d) feedback. No retrospective prose, nothing the docs already say,
and no edits to the plan's historical sections.

## Cost discipline

Scope every command to the wave's owned paths where possible. Do not run the
full test suite when acceptance criteria name specific tests. Do not re-read
files outside changed paths except to verify `forbidden` items.
