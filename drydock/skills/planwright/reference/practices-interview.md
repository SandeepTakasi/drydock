# Practices Interview

The plan must abide by the user's existing engineering practices — not impose defaults. This file is the question bank for step 1 of the workflow.

## How to run the interview

1. **Check written sources first.** CLAUDE.md files, ADRs, CONTRIBUTING.md, CI config (`.github/workflows`, `cloudbuild.yaml`, etc.), lint/test configs, and existing plan documents often answer most of this. Pre-fill answers from those sources and only ask about the gaps. When presenting questions, show what you already inferred ("CI runs `dotnet test` and `eslint` on PR — I'll treat those as mandatory gates; correct?") so the user confirms instead of re-explaining.
2. **One batched message.** Ask everything remaining in a single message. Use a selection UI tool if one is available; otherwise a compact numbered list with your recommended default marked on each question.
3. **Offer defaults.** Every question should be answerable with "yes to all your defaults". Busy users will take that path — make the defaults good.
4. **Record everything** in the plan's *Practices in effect* section, including answers inferred from the repo (mark the source).

## Question bank

Skip any question already answered by the repo or by prior context in the conversation or project instructions.

### Testing
- TDD (tests written first, task-by-task) or test-after? *(Affects task ordering in every wave: TDD puts a failing-test task before each implementation task.)*
- Expected test levels for this change: unit / integration / e2e? Any coverage threshold?
- Preferred test framework/runner if multiple exist in the repo?

### Review & gates
- Human approval required at phase boundaries, or only at the end?
- Any manual confirmation gates — e.g., verifying UI changes in a browser, checking a staging deploy, running a smoke script by hand? *(Each becomes an explicit human-gate task in the plan.)*
- PR-based review, or direct commits to a working branch?

### Version control
- Branching model (feature branch, trunk-based, stacked PRs)?
- Commit granularity: per task, per wave, or squash at the end?
- Are parallel sessions in scope? If so, git worktrees or separate clones?

### Quality gates
- Which commands must pass before a task counts as done (lint, typecheck, build, test suite, formatter)? *(These become the acceptance-criterion vocabulary.)*
- Any hooks already enforcing rules (pre-commit, PreToolUse/PostToolUse) the plan should assume rather than duplicate?

### Execution preferences
- Appetite for parallelism: how many concurrent subagents/sessions is the user comfortable orchestrating?
- Model budget: any ceiling (e.g., "no Opus except reviews") or floor ("never below Sonnet for production code")?
- Where should the plan file live, and does a plan/spec format already exist in the repo that should be matched?

### Spec & tracking
- Does a spec or design document exist for this change? *(If yes, it becomes the Spec reference and per-task context briefs point into it. If no and the change is large/design-ambiguous, recommend writing one before planning.)*
- Should plan tasks be mirrored into a tracker (ClickUp, GitHub Issues, Jira)? At what granularity — per task or per wave? *(If yes, a Mechanical-tier task creates the items; the plan file stays the source of truth.)*

### Domain guardrails
- Any architectural decisions that are settled and must not be revisited by this plan? *(Point at ADRs/CLAUDE.md if they exist; otherwise capture them now into the Decision Log as pre-existing decisions.)*
- Anything explicitly out of bounds for this change (files, services, schemas that must not be touched)?
