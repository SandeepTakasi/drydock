---
name: init
description: Onboard a repository to Drydock. Scan it for the facts a plan needs (quality-gate commands, test framework, commit convention, CI, plans directory), interview only for what scanning cannot determine (whether executor subagents will actually be spawned, who signs human gates, model budget, browser target), and emit a schema-valid drydock.config.yaml host profile plus a gap report. Run it once per repo, before the first plan. Use when the user says "drydock init", "set up drydock", "initialize drydock", or "onboard this repo to drydock".
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
---

# init: onboard a repo to Drydock

You are generating the **host profile**: one file carrying everything
project-specific, so the plugin itself stays generic. `planwright` reads it and
skips every question it answers.

The problem it solves is measured, not theoretical. The practices interview runs
from scratch on every plan, and nothing persists the answers — plan 006 asked
what plan 001 asked. This file is the answer sheet.

**Discover what you can, ask about what you cannot, and never invent a value.**

Recommended model: any current model. Discovery and interviewing, not judgment.

## The rule that governs everything here

**A profile holds DEFAULTS, not facts.** Any plan may override any value, and
`planwright` records the override in that plan's Decision Log. A profile that
silently shapes plans it no longer describes is the drift class this repo keeps
finding; an override that is written down is not drift.

So every value you write carries its **provenance**: `discovered` with the file
it came from, or `stated` with the date. A reader must be able to tell what was
measured from what was asserted.

## 0. Preflight

Resolve the path: userConfig `config_path`, default `drydock.config.yaml` at the
repo root.

If one already exists, validate it, then ask whether to **update** (keep valid
values, re-interview only the gaps) or **abort**. Never silently overwrite it.

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/drydock-audit.mjs" validate-config <path>
```

## 1. Discovery scan

Read-only. Do not ask about anything you can find.

| Look for | How | Fills |
|---|---|---|
| Quality-gate commands | the scripts block in `package.json`; `Makefile`; `pyproject.toml`; `Cargo.toml` | `gates.test`, `gates.lint`, `gates.build`, `gates.typecheck` |
| What CI actually runs | `.github/workflows/*.yml`, `.gitlab-ci.yml` — the commands, not the names | `gates.ci` |
| Test framework | devDependencies, or the runner named in the test script | `gates.framework` |
| Commit convention | `git log -50 --format=%s`; look for `type(scope):` or a ticket prefix | `vcs.commit_convention`, and it decides `attribution` |
| Default branch | `git symbolic-ref refs/remotes/origin/HEAD` | `vcs.default_branch` |
| Plans directory | `drydock-audit.mjs resolve-plans-dir` | `paths.plans_dir` |
| Is `.drydock/` ignored | `git check-ignore .drydock` | `paths.drydock_ignored` |
| Doc targets for reconcile | `CLAUDE.md`, `docs/decisions/`, `docs/architecture.md`, ADR dirs | `paths.docs_targets` |
| Browser surface | any `index.html`, a dev/start script, a `playwright.config.*` | `browser.present` |

**Adopt what exists, never replace it.** An existing test runner, CI workflow or
plans directory is a fact about this host, not something to improve.

Report the scan as a short table before asking anything. People correct a wrong
guess faster than they answer a blank question.

## 2. Interview

Use `AskUserQuestion`. Batch related questions. Ask only these.

1. **Will `drydock:executor` subagents actually be spawned?** The load-bearing
   question, and the one most often discovered too late. A standing rule against
   unprompted agents, a host without subagents, or a user who intends to run the
   tasks themselves all mean **`execution: solo`**.

   Getting this wrong costs a deviation on every wave: plan 004's deviation 1 is
   exactly this, and plan 005 exists because every plan opened with the same
   entry. Ask it once, here, and stop paying for it.

2. **Testing approach.** Test-first, test-with, or none — and if none, why. This
   sets whether a task's criterion is a failing test or an assertion.

3. **Who signs a human gate, by name.** A phase gate with no name and no date is
   a refusal to close the plan.

4. **Model budget and parallelism appetite.** How many concurrent executors this
   host is willing to run, and whether Opus-tier work is in budget. Feeds the
   per-task model assignment.

5. **Tracker mirroring.** Whether plan tasks mirror into ClickUp, Jira, GitHub
   Issues, or nothing.

6. **Browser target**, only if the scan found a browser surface: the base URL and
   the command that starts the app. This is what `seatrial` needs and currently
   re-asks per plan. "There is no browser-drivable surface" is a complete answer
   and sets `browser.present: false`.

## 3. Emit the profile

Write it to the resolved path, following
`${CLAUDE_PLUGIN_ROOT}/skills/init/reference/config-schema.md` exactly. Comment
any value a future reader would question.

Then validate, and **loop until it passes**:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/drydock-audit.mjs" validate-config <path>
```

Fix every error. Report every warning rather than silencing it.

## 4. Gap report

Print it; do not write a file. Name the skill each gap blocks.

| Gap | Blocks |
|---|---|
| No runnable quality-gate command | every acceptance criterion: `prove-failable` has nothing to run, and criteria fall back to prose |
| `.drydock/` not gitignored | the first `audit-wave`, which fails on the tool's own state files. `wave-start` fixes this itself; say so |
| `plans_dir` gitignored | plans cannot be committed, so `wave-start` refuses to arm. The fallback is `.drydock/plans/` |
| No browser surface, but a UI exists | `seatrial`: the Testing Gate will read `N/A` on a plan that should have one |
| Host forbids tool names in commit subjects | `attribution: commit-prefix`. Use `manifest`, which this profile then sets |
| No human named for gates | phase closure: `plan-status` reports an unsigned gate and the plan never closes |

## 5. Hand off

**Recommend committing the profile.** An uncommitted one means each developer
plans against a different definition of the same repo.

Then state the next step: describe the change you want and let `planwright` size
it. Below about five units of work it will offer to skip the plan entirely, and
that offer is worth taking.

## What this skill does not do

It does not make other skills refuse to run. Drydock has plans and a public
install that predate any profile, and a hard requirement would retroactively
break them. **Absent profile means "interview as before"** — `planwright` asks
the full question set and says why.

It also writes no plan, and does not run one.
