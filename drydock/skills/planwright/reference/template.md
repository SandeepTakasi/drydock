---
plan: NNN-short-slug
format_version: 3
status: DRAFT
isolation: none
enforcement: required
attribution: manifest
lane: small
execution: solo
created: YYYY-MM-DD
approved_by: unapproved
---

# NNN - <one line saying what will be true when this is done>

<!--
COPY THIS FILE, do not edit it in place. It is the skeleton `validate-plan
--strict` requires: all sixteen sections, in this order, plus one phase. Delete
every comment as you fill it in.

Check your copy before you arm anything:
  node <plugin>/scripts/drydock-audit.mjs validate-plan --strict docs/plans/NNN-slug.md

`wave-start` refuses a plan that does not pass, so this is the first gate, not
an optional one. A worked plan of this shape is in `example-small-plan.md`.

Separator grammar: comma, hyphen and em dash all parse wherever a reason or a
verdict follows a label. Write the comma form.
-->

**Plan location:** `docs/plans/`, committed with the repo.

> **Execution protocol.** Spawn each task in the current wave as its declared
> executor agent with its declared model, passing ONLY the task's context brief
> plus one standing clause: file edits go through Write or Edit, never a Bash
> redirect, `sed -i` or a heredoc, because the ownership hook sees only file
> tools and a wave edited through Bash closes with an empty enforcement log.
> Wait for every task in the wave, then run the wave gate. Do not open the next
> wave until it passes.

**Ownership enforcement, before and after every implementation wave:**

```bash
node <plugin>/scripts/drydock-audit.mjs wave-start docs/plans/NNN-slug.md <wave>
# ... the wave's tasks run; writes outside the boundary are denied ...
node <plugin>/scripts/drydock-audit.mjs audit-wave docs/plans/NNN-slug.md <wave>
rm .drydock/wave-owns.json
```

## 1. Requirement

<!-- One paragraph. What must be TRUE when this is done. No solutioning. -->

## 2. Spec reference

None, the requirement is complete.

## 3. Surgical-scope statement

<!-- The smallest diff that fully satisfies section 1, in one or two sentences.
     Name what you are deliberately NOT doing. -->

## 4. Baseline

**Baseline SHA:** `TBD by T0`

| Command | Expected at baseline |
|---|---|
| `<the quality gate this repo already has>` | <exit 0, or the failure that is pre-existing> |

<!-- Pre-existing failures are listed here and excluded from every acceptance
     criterion below. A task must never be gated on a defect it did not cause. -->

## 5. Practices in effect

| Practice | Value | Source |
|---|---|---|
| Testing approach | <test-first, test-with, or none and why> | <who said so> |
| File edits during a wave | Write/Edit only, never Bash redirects | the hook sees only file tools |
| Commit granularity | One commit per task, owned files only | plan-format.md |
| Attribution | `manifest`, via `task-close` after each commit | this plan's header |

## 6. Findings & constraints

<!-- What you learned reading the code, each with its own reproduction. A
     finding without evidence is a guess, and every task below inherits it. -->

**F1.** <finding, with the command or file:line that shows it>

**Constraint C1.** <something the plan must work around, and why>

## 7. Decision Log

| # | Question | Decision | Decided by | Rationale |
|---|---|---|---|---|
| 1 | <the question you actually had> | <what was chosen> | <human, or planner (assumed, flag if wrong)> | <why, and which task consumes it> |

## 8. Open questions

| # | Question | Blocks | Recommended answer |
|---|---|---|---|
| Q1 | <question> | <what it blocks, or nothing> | <your recommendation> |

## 9. Out of scope / follow-ups

<!-- Valuable, deliberately excluded. This is where a good idea goes so it does
     not silently widen a task. -->

## 10. Execution policies

**Review protocol.** Per task: the acceptance criterion must pass, run by the
gate rather than taken from the executor's report.

**Checkpointing.** One commit per task, staging only that task's owned files,
followed by `drydock-audit.mjs task-close docs/plans/NNN-slug.md <task-id>`.

**Plan document writes.** The plan file is owned by no task. Close the wave with
`rm .drydock/wave-owns.json` before writing into it, then commit it, or
`wave-start` refuses to arm the next wave.

## 11. Testing Gate

N/A, <reason>

<!-- Or: declare TG1..TGn, each with steps, an expected result, an evidence type
     and a severity. Write them BEFORE the code. `video` is not capturable
     through the Playwright MCP driver, so do not declare it. -->

## 12. Pressure-test verdict

PENDING. A fresh-context reviewer must try to break this plan before approval.
Required: every file path and line reference in section 6 resolves; no task
depends on another task in its own wave; and **every acceptance criterion has
been run at baseline and fails there**, because a criterion that already passes
gates nothing.

## Phase 1: <milestone>

**Exit state:** <what is true when this phase closes>

**Phase gate:** <the command that proves it> plus a named human approval.

#### T0 - Baseline verification
- **Description:** Runs the quality gates on the untouched tree and records the
  SHA and verbatim results in section 4.
- **Files owned:** none (read-only)
- **Depends on:** none
- **Model / thinking:** Mechanical / off
- **Context brief:** section 4 of this plan.
- **Acceptance criterion:** `<the baseline command>`

### Wave 1.0 - <what this wave does>

#### T1.0.1 - <imperative title>
- **Description:** <what changes, in two or three sentences>
- **Files owned:** `path/to/file.ts`
- **Depends on:** T0
- **Model / thinking:** Standard / default
- **Context brief:** <the findings and files this executor needs, and nothing else>
- **Forbidden:** <what it must not touch, especially files another task owns>
- **Acceptance criterion:** `<one command that exits 0 only if this task is done>`

## Deviation Log

| # | Task | What deviated | Why | Impact | Recorded |
|---|---|---|---|---|---|
| | | | | | |

## Wavecheck reports

<!-- `### Wavecheck <phase>.<wave>, PASS|BLOCK, <date>` per wave, appended. -->

## Progress log

| Date | Task | Result | Notes |
|---|---|---|---|

## Reconcile report

<!-- Appended once, at completion. -->
