# Drydock Plan Format Contract v3

Every Drydock skill reads or writes plan documents conforming to this file.
Planwright WRITES it. Executors OBEY task blocks from it. Wavecheck AUDITS
against it. Replan PATCHES it. Reconcile CLOSES it. Changing this file means
bumping `format_version` and updating every consumer; skills refuse plans with
unsupported versions.

Task IDs are `T<phase>.<wave>.<n>` and never change once assigned. An id
outlives its wave assignment, so the `### Wave` heading a task sits under is
where it runs and the id is only a fallback.

**Version history.** Both are supported; a plan written at either audits
exactly as it always did.

| | |
|---|---|
| **v2** | The team's proven plan template merged with the Drydock execution contract. |
| **v3** | Adds four optional frontmatter keys, each a closed enumeration with a back-compatible default: `enforcement:` (hook receipts required), `attribution:` (`commit-prefix` \| `manifest`), `lane:` (`full` \| `small`), `execution:` (`fleet` \| `solo`). Absent means the v2 behaviour in every case. |

This heading read `v2` for two releases after v3 shipped, in the one file
whose own rule is "changing this file means bumping `format_version` and
updating every consumer".

## Plan file

One markdown file at `{plans_dir}/NNN-<feature-slug>.md` (NNN = zero-padded
sequence; `plans_dir` from plugin config, default `docs/plans`).

**Where it goes is resolved, not reasoned about.** `drydock-audit.mjs
resolve-plans-dir` reports the directory and whether the repo will carry the
file: a repo that gitignores `plans_dir` (house rules against committing tool
artifacts) gets `.drydock/plans/` instead, beside the other execution
artifacts. The plan carries that command's one-line `**Plan location:**`
sentence verbatim under its title and nothing more. A plan arguing its own
location in prose is a plan whose reasoning differs from the next plan's.

**Invoking `drydock-audit.mjs`.** This file names it bare, and the runnable
absolute path is the one the SKILL.md files print. The host substitutes
`${CLAUDE_PLUGIN_ROOT}` when it loads a **skill body**, so those commands arrive
ready to run. It does **not** substitute inside a file read from disk (this one),
and `$CLAUDE_PLUGIN_ROOT` is empty in the shell, so a command copied from a
reference file with the placeholder still in it runs `node /scripts/…` and dies
`MODULE_NOT_FOUND`. Measured 2026-09-01. Take the path from the skill that sent
you here, never from this page.

## Header (yaml frontmatter)

```yaml
---
plan: NNN-<slug>
format_version: 3
status: DRAFT | APPROVED | EXECUTING | BLOCKED | DONE | RECONCILED
isolation: none | worktree          # opt-in worktree isolation, default none
enforcement: required | none        # v3; default none when the key is absent
attribution: commit-prefix | manifest   # v3; default commit-prefix when absent
lane: small | full                  # v3; default full when the key is absent
execution: solo | fleet             # v3; default fleet when the key is absent
created: YYYY-MM-DD
approved_by: <name> | unapproved
---
```

**`enforcement: required`** means this plan claims it was executed with the
ownership hook live, and `drydock:wavecheck` holds it to that claim: a wave with
no hook decisions recorded in `.drydock/enforcement.log` is a BLOCK, because the
wave ran unenforced. Write `required` on every new plan. Plans authored before v3
omit the key, default to `none`, and audit exactly as they always did. The
version bump retires nothing, and both v2 and v3 are supported.

The distinction is the whole reason the key exists: "a config file was present"
is satisfied by a hook that never ran, so the plan states its own standard and
the audit checks the standard the plan stated.

**What `required` does NOT mean, stated because it has been read the other way.**
It is a **receipt check, not a coverage guarantee.** Ownership has two layers and
they answer different questions:

- The hook **prevents** a write at the tool boundary. It sees `Write`/`Edit` and
  is **blind to Bash** (`sed -i`, a heredoc, `>`) and to paths outside the
  project directory.
- `audit-wave` **detects** a violation after the fact, from each task's commit
  and the working tree, and it never consults the hook. This layer sees
  everything a commit or a dirty tree carries, Bash-mediated writes included.

So a wave with an empty enforcement log ran without *prevention*; it did not run
without *auditing*. Reading the pair as "enforcement can only fail on its own
absence" gets it backwards: the audit is the layer that cannot be bypassed by
choosing a different tool, because it reads the result rather than the act.

**`attribution:`** decides how wavecheck FINDS a task's commit, never how it
judges it. The ownership check is `git show --name-only` against the task's
`owns` either way.

- **`commit-prefix`** (the default, and every plan written before v0.7.2) reads
  the commit subject: `drydock(<task-id>): <task name>`.
- **`manifest`** reads `.drydock/attribution.jsonl`, appended by
  `drydock-audit.mjs task-close <plan> <task-id>` immediately after each task's
  checkpoint commit. The subject is then free, so a host repo whose commit policy
  forbids tool names or task ids in subjects can run Drydock unmodified. Write
  `manifest` on every new plan.

The manifest is **generated from HEAD, never hand-written**, same rule as
`wave-start`, for the same reason: a record a model types is armed only if
somebody remembers to type it, and a derived record cannot disagree with the
commit it names. Two entries for one task is ambiguity, not last-wins, and the
audit says so.

**Neither mode removes the per-task commit.** Attribution from a combined
working-tree diff cannot tell which task touched a file, and a rogue edit to a
sibling's file passes a naive union check (confirmed in the 2026-08-18 dry-run),
which is why per-task commits became mandatory in v0.3.0. `manifest` replaces
the subject convention, not the commit.

**`lane:`** is how much ceremony this plan is buying. Default `full` when the
key is absent, which is every plan written before v0.8.0.

- **`full`**: phases, contract waves, `Wave x.R` quality reviews, a phase
  review, and an adversarial pressure test.
- **`small`**: **one phase, one implementation wave, one wavecheck gate, no
  `Wave x.R` task, no phase review, no pressure test.** Everything that scales
  with *risk* stays: ownership, acceptance criteria, the Decision Log, the
  Deviation Log, the Testing Gate. Only what scales with *cost* is dropped.

The lane is recorded rather than inferred so an auditor can see whether the
ceremony matched the change. A plan measured in ~20 gates for one feature with
no parallel critical path is the failure this exists to prevent: gate overhead
should track risk and genuine concurrency, never the shape of the template.

**`execution:`** is whether a fleet actually exists. Default `fleet`.

- **`fleet`**: tasks are spawned as `drydock:executor` subagents, each in a
  fresh context, so the auditor did not write the diff.
- **`solo`**: the orchestrating session runs the tasks itself. State it in the
  header **once**; it is a property of the plan, and logging it as a per-wave
  deviation on every wave is bookkeeping, not information.

Two things follow from `solo`, and both are load-bearing:

1. **Same-wave dependencies are legal.** Tasks in one wave run in sequence, so
   `T1.0.2` may depend on `T1.0.1`. The parallelism prohibition exists because
   simultaneous tasks cannot depend on each other; without simultaneity there is
   nothing to prohibit. `validate-plan` enforces the rule only under `fleet`.
2. **Independence is reduced, and said once.** The session writing the diff is
   the session auditing it. Wavecheck's mechanical checks are unaffected,
   ownership per commit and acceptance criteria are evidence, not opinion, but
   its judgement calls are weaker, and the plan states that plainly instead of
   asserting a fleet and then caveating it every wave.

`solo` does **not** relax ownership, per-task commits, acceptance criteria or
any gate. It removes a claim the plan was making falsely, nothing else.

Status transitions are one-way except BLOCKED (may return to EXECUTING after
replan or human decision). Only a human sets APPROVED. Executors MUST NOT run
against a plan that is not APPROVED or EXECUTING. RECONCILED is set only by
the reconcile skill.

## Orchestrator contract: embed VERBATIM in every plan's preamble

> **Execution protocol.** Spawn each task in the current wave as its declared
> executor agent (`drydock:executor`, or `drydock:executor-isolated` when the
> header says `isolation: worktree`) with its declared model and thinking
> budget, passing ONLY the task's context brief. Before starting any wave, run
> the staleness check below. Wait for all tasks in the wave, then invoke the
> `drydock:wavecheck` skill with this plan path and the wave id. Do not begin
> the wave's quality-review task, or the next wave, until wavecheck reports
> PASS. On BLOCK, set status BLOCKED and stop, do not self-repair; the paths
> out are `/drydock:replan` or a human decision. Quality-review rejections
> follow the escalation policy (max 2 retries → tier up → human); wavecheck
> BLOCKs on ownership violations or unlogged deviations get NO retries. When
> the final wave and phase gate pass, invoke `drydock:reconcile`.
>
> **If you cannot spawn executors**, a standing instruction against unprompted
> agents, agents unavailable, that is a deviation to log **before the wave
> opens**, not after it closes, and it does not become permission to skip the
> wave gate. Two obligations survive intact: stage **only** the task's owned
> files in its checkpoint commit (a spawned executor gets this for free; by hand
> it is the first thing to slip), and tell wavecheck the diff is self-authored,
> because its forbidden audit is weakened when the auditor wrote the code and it
> must say so rather than imply independence it does not have.

**Ownership enforcement (arm before every wave, from v0.7.0):**

```bash
node drydock-audit.mjs wave-start <plan> <wave>     # absolute path: see above
# ... the wave's executors run ...
rm .drydock/wave-owns.json     # closing the wave
```

`wave-start` derives the boundary from the plan itself and writes
`.drydock/wave-owns.json`; the `PreToolUse` hook reads it and denies any
Write/Edit to a path no task in the wave owns. **Do not write that file by
hand.** v0.6.0 asked you to, and it was the wrong instruction twice over: an
orchestrator that forgot left the hook inert with no error, and a boundary typed
by hand can be wider than the plan, `{"owns":["**"]}` enforces nothing while
looking exactly like enforcement. A derived boundary cannot exceed its plan, and
`wavecheck` compares what was enforced against what the plan says.

It is wave-level because a wave runs N executors at once and hook input carries
no subagent identity; per-task attribution remains wavecheck's job. **Leaving a
stale file behind blocks the next unrelated edit**, so deleting it is part of
closing the wave. It does not replace the audit. Bash writes bypass file-tool
hooks entirely.

**Staleness check (before every wave):**
`git diff <baseline SHA>..HEAD -- <wave's owned files + wave-0 contract files>`.
Non-empty → wave is STALE: re-validate its tasks against current code, update
the baseline SHA and Decision Log, then execute, or run `/drydock:replan` if
task contents (not just context) are invalidated. Never execute a stale wave
on original assumptions.

## Required sections, in order

1. **Requirement**, one paragraph; what must be true when done. No solutioning.
2. **Spec reference**, path + sections, or "none, requirement is complete".
3. **Surgical-scope statement**, the smallest satisfying diff, 1–2 sentences.
4. **Baseline**, filled by T0: commit SHA, quality-gate results verbatim,
   pre-existing failures excluded from acceptance criteria.
5. **Practices in effect**, table: practice, value, source (user answer /
   CLAUDE.md / CI config).
6. **Findings & constraints**, exploration output; link files, don't restate.
7. **Decision Log**, append-only: `| # | Question | Decision | Decided by | Rationale |`.
   "Decided by" is `user` or `planner (assumed, flag if wrong)`.
8. **Open questions**, `| # | Question | Blocks | Recommended answer |`;
   blocked tasks carry `BLOCKED(Qn)`.
9. **Out of scope / follow-ups**, valuable-but-not-required work, explicitly
   excluded from all tasks.
10. **Execution policies**, review protocol (wavecheck gate + quality review
    + phase review), escalation, checkpointing (commit per task/wave, rollback
    unit), human gates, tracker mirroring (plan file is source of truth).
11. **Testing Gate**, written browser-executed E2E cases, authored at plan
    time, executed after the final wave by the `drydock:seatrial` skill. Schema
    and gate rule below. Plans with no user-facing surface write
    `N/A, <reason>` and nothing else.

12. **Pressure-test verdict**, adversarial fresh-context review result;
    APPROVED required before presenting to the user.
13. **Phases → waves → tasks**, structure below.
14. **Deviation Log**, append-only, maintained during execution:
    `| # | Task | What deviated | Why | Impact | Recorded |`. Sources:
    executor completion reports, wavecheck discoveries
    (flagged `discovered-by-wavecheck`), staleness findings.
15. **Wavecheck reports**, appended by wavecheck per wave (shape in that skill):
    `### Wavecheck <phase>.<wave>, PASS|BLOCK, <date>`.
16. **Progress log**, `| Date | Task | Result | Notes |`.
17. **Reconcile report**, appended once by reconcile at completion.

## Testing Gate section

Authored by planwright at plan time, never bolted on after implementation, and
never written by the session that just implemented the code. `drydock:seatrial`
consumes it; `drydock:reconcile` refuses to close a plan whose gate has no GO
verdict. No hook enforces any of this: the gate is prose, like every other gate
in Drydock.

A plan with no user-facing surface writes exactly `N/A, <reason>` as the whole
section body. "N/A" without a reason is not valid.

### Header fields (all required when the section is not N/A)

| Field | Content |
|---|---|
| Target | Base URL under test, and how it is served (command, port, path). **A claim, not a fact:** `seatrial` re-resolves the origin from the repo's dev config at gate start and HALTs if they disagree, because a port written at plan time drifts. |
| Auth | How a case authenticates, or `none` and why |
| Browser | Engine and driver. Playwright MCP is the only supported driver. Also re-resolved at gate start; a gate naming a different driver is a HALT, since the run would produce a different kind of evidence than the plan promised. |
| Commit SHA | Recorded by seatrial at run time, not by the planner |
| Evidence root | `.drydock/testing/<plan-id>/<case-id>/`, frozen, not a suggestion |

### Per-case fields (all required, every case)

| Field | Content |
|---|---|
| `id` | Stable within the plan, never reused (convention: `TG<n>`) |
| `title` | One line, what the case establishes |
| `preconditions` | What must already be true; a false precondition is a HALT, not a FAIL |
| `steps` | Given / When / Then. Written to be performed exactly as stated |
| `expected` | The observable result, including which evidence must exist |
| `evidence` | Exactly one of `screenshot` \| `video` \| `network assertion` |
| `severity` | Exactly one of `blocker` \| `major` \| `minor` |

A case whose expected outcome is itself a failure (used to prove the gate can
fail) MUST say so in `expected`, and MUST state that a PASS verdict on it is a
failure of the gate. Without that inversion written down, a later reader
reasonably treats the case as broken.

### Gate rule: complete rule body

- Any case of severity **blocker** with verdict FAIL → **NO-GO**. Deployment
  does not proceed and reconcile refuses to set `RECONCILED`.
- Any case of severity **major** with verdict FAIL → **GO-WITH-OVERRIDES**, and
  only when `verdict.md` records an explicit human override naming the case, the
  reason, and who decided. Absent that record the verdict is **NO-GO**.
- Any case of severity **minor** with verdict FAIL → recorded in `verdict.md`;
  no effect on the summary verdict.
- All cases PASS, no overrides needed → **GO**.
- A case that **cannot be executed at all**, target unreachable, driver absent,
  evidence path unwritable, precondition false, is neither a PASS nor a skip.
  seatrial HALTs and asks. A gate that degrades to "skipped" under pressure is
  not a gate.
- A step that cannot be performed as written is verdict FAIL with reason
  `step not executable`. Improvising a substitute step is a contract breach, not
  a workaround.

### Verdict sheet

seatrial writes `.drydock/testing/<plan-id>/verdict.md`, frozen path, quoted
identically here, in `drydock:seatrial`, and in `drydock:reconcile`. It carries
the summary verdict on its first line (`GO` | `NO-GO` | `GO-WITH-OVERRIDES`), an
environment block, one row per case, and a QA handoff note stating what was
covered and what was not. Evidence artifacts live under the evidence root and
are gitignored by default; committing them requires asking first.

**A browser verdict is evidence about the paths that were tested. It is not
evidence that other defects are absent.** Plans and skills must not phrase it as
proof of correctness.

### Staleness

The gate is stale if the target's source changed after the cases were written:
`git diff <baseline SHA>..HEAD -- <paths the target is built from>`. Non-empty →
seatrial HALTs and asks rather than testing written cases against a moved target.

## Phase / wave / task structure

```markdown
## Phase 0: Pre-flight
#### T0 - Baseline verification
- Runs every quality-gate command on the untouched codebase, records SHA +
  results in Baseline. Files owned: none (read-only). Model: Mechanical / off.

## Phase <p>: <milestone>
**Exit state:** <verifiable, ideally shippable state>
**Phase gate:** <commands> + architectural review + <human gate if required>

A gate that has been met is rewritten in place to record it, and a human gate
records **who** and **when**: `**Phase gate: CLOSED, approved by <name> -
<YYYY-MM-DD>.**` followed by the conditions met. Nothing infers a human's
approval from surrounding text, and `drydock:reconcile` reads this line, so an
open gate, or a closed one with no name and date, is a refusal to close the
plan. Write the unmet form while the phase is open; amend it when it closes.

### Wave <p>.0 - Contracts
> Pins the shared surface (interfaces, types, schemas, API shapes, migration
> order). Every phase with a parallel wave needs one.

#### T<p>.<w>.<n> - <title>
- **Description:** 2–4 sentences, one outcome, no "and also".
- **Files owned:** explicit list/globs, disjoint from every other task in
  this wave; nothing else may be written.
- **Depends on:** task IDs from earlier waves, or none
- **Model / thinking:** per rubric   **Executor:** drydock:executor |
  drydock:executor-isolated
- **Context brief:** exactly what the executing agent reads: files, spec
  sections, Decision Log entries. Nothing more.
- **Forbidden:** explicit non-goals (optional but recommended).
- **Implementation sketch:** Complex/Judgment tiers only: signatures, data
  flow, invariants. Never complete code.
- **Acceptance criterion:** one command that exits 0.

### Wave <p>.R - Quality review
#### T<p>.R.1 - Fresh-context quality review of the phase's waves
- Runs AFTER wavecheck PASS on the phase's final wave. Context brief: the
  phase diff, this plan, Decision Log. Reviews correctness, conventions,
  edge cases; conformance was already audited by wavecheck. Verdict recorded;
  APPROVED required for the phase gate.
```

Checkpointing rule (load-bearing, not stylistic): in default (non-worktree)
mode, every executor MUST commit its completed task touching only its owned
files, and the commit MUST be attributable to exactly one task, per-task
commits are wavecheck's only sound attribution mechanism. How the commit is
attributed is the plan's `attribution:` mode: the subject
`drydock(<task-id>): <task name>` under `commit-prefix`, or a `task-close`
entry under `manifest`, where the subject is the host repo's business. Plans may
not relax this to per-wave commits unless isolation is worktree.

Ownership rules:
- `Files owned` sets within a wave MUST be disjoint (planwright validates at
  write time; wavecheck re-verifies against the actual diff).
- A file owned in wave N may be owned again in wave N+1 (sequential handoff).
- Task IDs are never reused; a replan-replaced task gets a suffixed id
  (`T2.1.3r1`) and the original is struck through with a pointer.

**No per-task `Status:` field.** It was in this template until v0.7.3 and
nothing ever maintained it, measured wrong in 40 of 40 tasks in the field,
because every mechanism that knows a task finished (the wavecheck report, the
Progress log, the checkpoint commit) writes somewhere else. A field that is
always stale is worse than an absent one: it reads like state. Plans 001–004
still carry theirs; execution history is not a draft.

**Plan status is derived, not remembered.** The wavecheck reports are the only
state a gate writes, so they are the ground truth and frontmatter `status:`
must agree with them:

```
node drydock-audit.mjs plan-status [--write] <plan.md>
```

`validate-plan` fails on a contradiction and `audit-wave` notes one at the wave
boundary, so a plan cannot sit at `EXECUTING` after its last wave passed, or
claim `DONE` over a `BLOCK`. `--write` sets only what the reports prove;
`DONE` vs `RECONCILED` is reconcile's business and it refuses to guess.

## Worktree merge procedure (isolation: worktree only)

Revised after the first isolated run (A2b, 2026-08-19):
1. Merge only after the wave's wavecheck PASS, in ascending task-id order. This
   ordering is load-bearing, not cosmetic, see 2a.
2. Each merge is expected conflict-free, because ownership is disjoint by
   construction. ANY conflict is a plan defect: stop merging, set BLOCKED,
   record a deviation naming both tasks and the file.
2a. **A conflict-free merge is NOT evidence of ownership compliance.** The
   implication runs one way only: conflict proves a defect; absence of conflict
   proves nothing. A task that writes a file it does not own conflicts only if
   some sibling happened to touch the same file, a non-colliding unowned edit
   merges cleanly and lands silently (verified in A2b). **The ownership audit in
   step 1 is the only defence against that**, which is why merging before
   wavecheck PASS is forbidden rather than merely discouraged. Per-worktree
   `git diff --name-only <base>` is the sound attribution mechanism in isolation
   mode; the merge is a collision backstop, not an audit.
3. Never resolve conflicts inline; resolution goes through `/drydock:replan`
   or human decision. `git merge --abort` restores the target branch with
   already-merged siblings' work intact (verified in A2b).
4. After the last merge, re-run the wave's command-shaped acceptance criteria
   once against the merged tree (integration smoke) before closing the wave.

Isolated executors commit inside their worktree as
`drydock(<task-id>): <task name>` and report the `worktree_commit` sha.
