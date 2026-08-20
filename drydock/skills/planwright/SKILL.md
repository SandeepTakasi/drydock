---
name: planwright
description: Craft a rigorous, surgical implementation plan — phases, parallel waves, atomic tasks, right-sized model assignments, and verification gates — as a persistent plan document, without writing any implementation code. Use this skill whenever the user asks to "create a plan", "plan this feature/change", "break this down", "design phases and tasks", wants a task breakdown for subagent or parallel execution, or requests any multi-file change large enough that a plan should precede implementation — even if they never say the word "plan".
---

# Planwright — Surgical Implementation Planner

Produce implementation plans that a fresh-context agent (or a team of subagents) can execute without drifting, over-building, or colliding. The plan is the deliverable. **Never implement anything while this skill is active** — no source edits, no scaffolding, no "quick fixes along the way". If the user asks to also implement, finish and deliver the plan first, then treat implementation as a separate task outside this skill.

Plans conform to `reference/plan-format.md` (the Drydock contract + template). Read it before writing.

## Core principles

These four principles resolve every judgment call in this skill. When in doubt, come back here.

1. **Explore before planning.** A plan built on assumptions about the codebase is confident fiction. Read the actual code, configs, specs, and ADRs that the change touches before designing anything.
2. **Surgical scope.** The best plan produces the smallest diff that fully satisfies the requirement. No opportunistic refactors, no speculative abstractions, no "while we're here" work. If a genuinely valuable improvement is discovered during exploration, list it under *Out of scope / follow-ups* in the plan — never fold it into the tasks.
3. **Verify, don't trust.** Every task carries an objective, machine-checkable acceptance criterion. LLM review is a second layer for design quality, never the only quality mechanism.
4. **Decisions are logged, not implied.** Every question asked, answer received, and trade-off resolved is recorded in the plan's Decision Log so future sessions inherit the reasoning, not just the conclusion.

## Workflow

Follow these six steps in order. Steps 1–3 are about earning the right to plan; steps 4–6 produce the plan.

### Step 1: Gather constraints and the user's practices

Before asking the user anything, check what is already written down: `CLAUDE.md` (root and nested), ADRs, contributing guides, CI config, existing specs. Never ask the user something the repo already answers — it wastes their time and signals you didn't look.

Then interview the user about the practices the plan must abide by. Read `reference/practices-interview.md` for the full question bank and how to run it. The essentials to establish: testing approach (TDD or test-after, coverage expectations), review gates (human approval points, browser/manual confirmation steps, PR review), version control conventions (branching, commit granularity, worktrees), quality gates (lint, typecheck, build, CI), execution preferences (subagent parallelism appetite, model budget, worktree isolation appetite — see step 4), whether a spec/design document already exists for this change, and whether plan tasks should be mirrored into the team's tracker (ClickUp, GitHub Issues, Jira, etc.). Batch these into **one** message using whatever selection UI is available, or a compact numbered list — do not drip-feed questions across turns.

**If the change touches a UI or API surface, the interview must also produce testable acceptance criteria** — the base URL and the command that starts the app, the auth approach for a test run, evidence retention, and which outcomes are blockers. That is what makes the **Testing Gate** (step 6) writable at plan time instead of invented afterwards by whoever happens to be looking at the screen. The question block is in `reference/practices-interview.md` under *End-to-end verification*. A user answering "there is no browser-drivable surface here" is a complete answer: it becomes the section's `N/A — <reason>`.

Record every answer in the plan's *Practices in effect* section. These are constraints, not suggestions: if the user works TDD, tests appear as the first task of every wave; if they require a browser confirmation gate, it appears as an explicit human-gate task.

### Step 2: Explore the codebase

Map everything the change touches: entry points, affected modules, data models, migrations, contracts between services, existing tests, and the conventions already in use. If subagents are available, delegate exploration to them and keep only their conclusions — exploration noise (dozens of file reads and greps) should not pollute the planning context. If not, explore inline but summarize findings into a short constraints list before moving on.

The output of this step is a written **Findings & constraints** summary: what exists, what the change must integrate with, what could break, and which conventions the plan must follow. If exploration reveals the request is simpler than expected, say so — a plan that shrinks the work is a better plan.

**Spec linkage.** The plan describes *how*; a spec describes *what*. If a spec or design document exists, reference it (file path + relevant sections) in the plan header and per-task context briefs rather than restating it. If none exists and the change is large or design-ambiguous, tell the user a design doc should precede the plan — do not smuggle design decisions into task descriptions where nobody will review them.

### Step 3: Clarify all doubts, then log the decisions

List every ambiguity, conflict, or missing requirement discovered in steps 1–2. Present them to the user in **one batched message**, each question paired with your recommended answer and its trade-off, so the user can mostly confirm rather than compose. Do not proceed on silent assumptions — the user chose this skill precisely to avoid that.

If something is genuinely trivial and any reasonable answer works, decide it yourself but still log it as a decision with rationale marked *(assumed — flag if wrong)*.

Every resolved question becomes a row in the **Decision Log** (see template): the question, the decision, who decided, and why. Unresolved questions go to **Open questions** and any task depending on them is marked `BLOCKED`.

### Step 4: Design phases, waves, and atomic tasks

**Phases** are sequential milestones, each ending in a verifiable, ideally shippable state with a quality gate and (where the user's practices require) a human gate. **Waves** live inside a phase: tasks in the same wave run in parallel; waves within a phase run in sequence.

Parallelism rules — these prevent the two classic failure modes (agents colliding on files, agents inventing incompatible interfaces):

- **Wave 0 defines contracts.** Before any parallel implementation wave, a wave must pin down the shared surface: interfaces, types, schemas, API shapes, migration order. Parallel tasks then build against frozen contracts.
- **Disjoint file ownership.** Every task lists the files it owns. Within a wave, no file appears in two tasks. If two tasks need the same file, they belong in different waves or should be merged.
- A task is only in a wave if **all** its dependencies completed in earlier waves.
- **Worktree isolation (opt-in).** If the user opted in during step 1, or tasks are high-collision-risk (generated code, lockfiles, sweeping renames), set `isolation: worktree` in the plan header. Tasks then run via `drydock:executor-isolated`, each in its own git worktree, merged per the procedure in the format contract. It adds a merge step per wave — do not default to it.

**Atomicity test** — a task is atomic when all four hold; if any fails, split it:
1. Executable in a single fresh context window by an agent given only the task's context brief.
2. Touches a bounded, explicitly listed file set.
3. Has exactly one objectively checkable acceptance criterion (a command that exits 0: a test, a build, a lint run, a script assertion).
4. Describable in 2–4 sentences without "and also".

**Context brief per task.** Each task specifies exactly what the executing agent should read: which files, which spec sections, which decisions from the log. This is what makes parallel subagents cheap and accurate — they receive a curated slice, and only conclusions return to the orchestrator.

**Pre-flight baseline.** Every plan's first task (T0) runs all quality-gate commands on the untouched codebase and records the result. Without a known-green (or known-red-with-reasons) baseline, an executing agent whose acceptance criterion fails on a pre-existing issue will "fix" code it was never meant to touch. Pre-existing failures get logged in the plan, and acceptance criteria are scoped to exclude them.

**Implementation sketches for hard tasks.** For Complex- and Judgment-tier tasks (see rubric below), include a short implementation sketch in the task: key signatures, data flow, and invariants that must hold. Not complete code — code in a plan goes stale and bloats it — just enough that an agent with no project context cannot pick a wrong architecture. Mechanical and Standard tasks don't need sketches; the contract from wave 0 is their guardrail.

### Step 5: Assign models, executors, and the review protocol

Right-size the model per task instead of using the top model everywhere. Apply this rubric and record the assignment on each task:

| Tier | Assign to | Model | Thinking |
|---|---|---|---|
| Mechanical | Renames, boilerplate, config edits, mechanical migrations, doc updates | Haiku (or cheapest available) | Off / minimal |
| Standard | Implementation against a clear spec and frozen contracts, straightforward tests, CRUD | Sonnet | Default |
| Complex | Ambiguous logic, concurrency, tricky state, non-trivial algorithms, cross-module changes | Sonnet + extended thinking, or Opus | Extended |
| Judgment | Contract/interface design (wave 0), architectural trade-offs, phase-boundary review | Opus (or strongest available) | Extended |

Adjust names to the models actually available in the user's environment, and honor any budget preference from step 1 — the rubric sets relative tiers, the user sets the ceiling.

**Executor assignment.** Every implementation task runs as `drydock:executor` (or `drydock:executor-isolated` when the plan header says `isolation: worktree`), spawned with the task's model and only its context brief. The executor contract — ownership, forbidden lists, deviation reporting, the completion-report shape — lives in the agent definition; the plan supplies the task block it enforces against.

**Review protocol** (encode it in the plan, don't leave it implied):

- **Per task:** the acceptance criterion must pass. This is non-negotiable and automated.
- **Per wave (conformance — mechanical gate):** the wave's exit gate is the `drydock:wavecheck` skill: plan integrity, ownership audit against the real diff, forbidden audit, acceptance criteria executed (never taken on the executor's word), deviation reconciliation. Wavecheck PASS is required before the next wave starts. This is the old "stage 1: spec compliance" review, hardened into an evidence-based audit.
- **Per wave (quality — judgment review):** a reviewer agent in a **fresh context**, same tier as the wave's work, reviews the wave's diff for correctness, conventions, and edge cases — *after* wavecheck passes. Well-written code that drifts from the plan is caught by wavecheck; this stage catches plan-conformant code that is still wrong. Fresh context matters more than model size — an agent reviewing code it didn't write finds what the author-agent is blind to. Encode this as an explicit review task (Wave x.R in the template).
- **Per phase:** a strongest-model reviewer performs architectural review against the plan, the Decision Log, and the surgical-scope principle — explicitly checking for scope creep and contract violations, not just bugs.
- **Escalation on rejection:** quality-review rejections get **max 2 retries** with the review feedback injected into the retry prompt. Still failing → escalate the task one model tier. Still failing → stop and escalate to the human with a written summary of attempts. Never silently loop, never silently ship rejected work. **No retries for wavecheck BLOCKs on ownership violations or unlogged deviations** — those are contract breaches, not quality misses: they go to `/drydock:replan` or the human.

**Staleness check on resume:** plans are written as if the repo freezes; on a real team it doesn't. Before any wave starts, diff the wave's owned files (and its wave-0 contract files) against the baseline SHA recorded by T0. Any change since planning — a teammate's merge, another plan's execution — makes the wave stale: re-validate its tasks against the current code before executing, and update the baseline SHA and Decision Log with what changed. Never execute a stale wave on the original assumptions. If staleness invalidates task contents (not just context), recommend `/drydock:replan` instead of patching ad hoc.

**Checkpointing:** one commit per completed task (or per wave, if the user's conventions prefer), so a bad wave rolls back cleanly. If parallel *sessions* (not just subagents) are planned, prescribe git worktrees to avoid workspace collisions.

**Tracker mirroring (optional):** if the user opted in during step 1, add one Mechanical-tier task that creates the tracker items (one per task or per wave, matching the team's granularity) with links back to the plan file. The plan file remains the source of truth; the tracker mirrors status, never redefines scope.

### Step 6: Write the plan artifact and self-review

Write the plan as a file in the plans directory (plugin config `plans_dir`, default `docs/plans/`; follow repo conventions if a plans directory already exists) named `NNN-<feature-slug>.md`, using the exact structure in `reference/plan-format.md`.

**Write the Testing Gate (§11) for any plan touching a UI or API surface.** Its schema and gate rule are in `reference/plan-format.md` under *Testing Gate section*; `drydock:seatrial` executes it after the final wave and `drydock:reconcile` refuses to close the plan without a GO verdict. Author it **now**, from the acceptance criteria the interview produced — a gate written after implementation tests what was built rather than what was asked for, which is the entire failure it exists to prevent. Each case needs an id, a title, preconditions, Given/When/Then steps performable exactly as written, an expected result, one declared evidence type, and a severity. **Do not declare an evidence type the driver cannot capture.** Confirm the capability in the session that authors the case, and default to `screenshot` or `network assertion` when you cannot: `video` in particular is a per-`BrowserContext` setting fixed at creation, so a Playwright MCP server started without video saving cannot produce it by any call, and a case declaring it fails its evidence clause on every possible run however correct the application is. That failure describes your harness, not the software — which makes it the most expensive kind of red, because it looks like a defect. Where the capability is genuinely unknown at plan time, say so in the case and flag it for a human decision rather than declaring the type on paper. Include at least one case that is designed to FAIL and say so in its expected result: a gate nobody has watched fail is not known to work. Where the change has no browser-drivable surface, the whole section is `N/A — <reason>` — the reason is required, and "not applicable" alone is not a reason. Embed the Orchestrator contract from that file verbatim in the plan preamble — the executing session must not be able to miss the gate and reconcile obligations. The plan is machine-readable by design — task IDs, dependency references, status fields — so a separate execution session can consume it and check off progress. Chat output is not a deliverable; the file is.

Before presenting the plan to the user, run this self-review checklist and fix anything that fails:

- [ ] Zero implementation was performed; the only new file is the plan.
- [ ] Every practice from step 1 is visibly enforced in the tasks (e.g., TDD → test task precedes implementation task in every wave; manual gates appear as explicit tasks).
- [ ] Every task passes the four-part atomicity test.
- [ ] No file is owned by two tasks in the same wave; every dependency points to an earlier wave.
- [ ] Every task has a runnable acceptance criterion, a context brief, and a model/executor assignment; Complex/Judgment tasks have implementation sketches.
- [ ] T0 baseline pre-flight exists; if a spec exists, the Spec reference is set and context briefs point into it.
- [ ] Every non-obvious choice appears in the Decision Log; unresolved items sit in Open questions with dependent tasks marked BLOCKED.
- [ ] **Every Decision that names a consuming task is cited in that task's context brief.** A Decision recorded in the log and absent from the brief is not closed — the executor never sees the log, only its brief. Grep each Decision for task ids and confirm the back-reference exists. (Observed failure: a plan recorded this exact lesson mid-execution and then repeated it two waves later, leaving a forbidden construction sitting in the brief of the task forbidden to use it.)
- [ ] **Every contract rule is stated as a complete rule body, never as a delta.** "Selector B adds property X" reads as both *B has the full set plus X* and *B has only X*; two tasks read it opposite ways and the divergence survived five waves behind a comment claiming they matched. Write out every property of every rule, in both places it appears.
- [ ] **Every acceptance criterion is provably failable, and criteria guarding defects that text cannot see say how.** Ask of each: what state makes this command exit non-zero? If a criterion's clauses were already satisfied by earlier tasks before this task began, it gates nothing. Where a criterion guards a class of defect invisible to source text (computed styles, rendered output, runtime behaviour), require evidence that the check has been observed failing — introduce the defect deliberately, watch the gate catch it, revert.
- [ ] **Every acceptance criterion was RUN, against the real file and the real shell, before the task block was frozen.** Ask both halves: can it fail, *and can it pass?* A criterion authored from memory of a platform's output or a file's shape is the most common way a task ships an inert or unpassable gate — and it is Mechanical- and Standard-tier criteria, which get the least scrutiny, that break this way. Confirm each literal pattern against the actual convention it greps: heading level, exact command output, padding. Three separate criteria in one plan failed this way — one unpassable regardless of repo state (BSD `wc` left-pads, so `grep -qx 1` could never match), one already satisfied before its task began, one grepping `####` at a file that uses `##` throughout.
- [ ] **§11 Testing Gate is written, or is `N/A` with a real reason.** If the plan touches a UI or API surface: every case has all seven fields, every declared evidence type is one of `screenshot` / `video` / `network assertion` **and the connected driver has been confirmed this session to capture it**, at least one case is designed to fail and declares that inversion, and the target's base URL and start command came from the user rather than from a guess. An absent section on a UI-touching plan, or a bare "N/A", fails this item.
- [ ] Scope is surgical: challenge each task with "does the requirement fail without this?" — anything that survives only as "nice to have" moves to Out of scope / follow-ups.
- [ ] The Orchestrator contract is embedded; wavecheck gates, quality-review tasks, escalation policy, checkpoint policy, and the final `drydock:reconcile` step are filled in, not left as template text.

**Adversarial pressure-test.** After the checklist passes, dispatch one fresh-context reviewer agent (Judgment tier) whose only job is to break the plan before the user sees it: verify every claimed file path and interface actually exists in the repo, hunt for hidden dependencies between tasks marked parallel, and challenge each task with "what does the executing agent not know that will make it guess?" You wrote the plan, so you have the same author-blindness toward it that code authors have toward their code — and a plan defect multiplies across every agent that executes it. Fix confirmed findings, log the material ones in the Decision Log, and record the verdict in the plan. If subagents are unavailable, do the pass yourself with explicit fresh eyes: re-open the actual files and verify claims against the repo, not against memory.

Present the plan with a short summary: phase count, wave structure, total tasks, where the human gates are, and any open questions blocking execution. **For plans with more than two phases, walk the user through it phase by phase and collect approval per phase** rather than presenting one wall of text — people rubber-stamp walls of text and actually read sections. Fold their corrections into the plan file and the Decision Log as you go. Then stop — implementation is someone else's job, and only a human flips the plan to APPROVED.

## Anti-patterns to refuse

- Planning without exploring ("I know how auth usually works") — explore or say you can't plan yet.
- Padding the plan with refactors, "improvements", or infrastructure the requirement doesn't need.
- Vague acceptance criteria ("works correctly", "code is clean") — if it's not a command that can fail, it's not a criterion.
- Assigning the strongest model everywhere "to be safe" — that's the overkill this skill exists to prevent.
- Answering the user's clarifying-question phase yourself and moving on — the user decides; you recommend.
- Marking the plan APPROVED yourself — approval is human-only, always.
