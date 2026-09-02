# Quickstart — your first Drydock plan in about 15 minutes

This walks one small change end to end. It uses the **small lane**, which is
where most work belongs; the fourteen-wave lifecycle in the README is what
Drydock does when a change actually needs it.

## Before you start

| | |
|---|---|
| **Claude Code** | the host — Drydock is a plugin, not a standalone CLI |
| **Node ≥ 22** on PATH | the ownership hook and audit script use `path.matchesGlob`, stdlib from 22. Below 22 the hook **exits 0 and enforces nothing**; it says so, and the wave audit reports the wave as unenforced |
| **A git repo** | attribution is per-commit; there is nothing to audit without one |

```
/plugin marketplace add SandeepTakasi/drydock
/plugin install drydock@drydock
```

Then **restart the session.** Skills are loaded from the installed plugin at
session start, so a fresh install is not live until you restart. (This bites
harder than it sounds — see the note at the end.)

Confirm the hook works before relying on it:

```bash
node ~/.claude/plugins/cache/drydock/drydock/*/hooks/enforce-owns.test.mjs
# enforce-owns: PASS — 12 cases
```

## 1. Ask for a plan

Just describe the change. You do not need to say "plan".

> Add a `--json` flag to the export command so CI can parse the output.

Planwright interviews you — a handful of questions it cannot answer by reading
the repo — then explores the code and writes a plan document to `docs/plans/`.

**Two things it should do that are worth watching for.** It sizes the work
first: below about five units it will say so and **offer to just do the task
instead of planning it.** Take that offer when it comes. And for anything
small it writes `lane: small` and `execution: solo` in the header — one wave,
one gate, no quality-review wave, no pressure test.

## 2. Read the plan, then approve it

The plan is the deliverable of this step. Read at least:

- **Surgical-scope statement** — the smallest diff that satisfies the ask.
- **Files owned** per task — the boundary each task may write, and nothing else.
- **Acceptance criterion** per task — *one command that exits 0.* If a criterion
  is prose rather than a command, say so; that is the single most common way a
  plan gates nothing.
- **Open questions** — anything it could not decide alone.

Nothing executes until you say so. A human flipping the plan to `APPROVED` is
one of the two things in Drydock that are mechanically absolute.

## 3. Execute

Say `execute the plan`. In the small lane the session runs the tasks itself,
committing each one separately. Under the hood, before the wave opens:

```bash
node <plugin>/scripts/drydock-audit.mjs wave-start docs/plans/00N-your-plan.md 1.0
```

That derives the ownership boundary **from the plan** and arms the hook. From
here, a write to a file no task in the wave owns is **denied at the tool
boundary** — not warned about afterwards. Two ceilings, stated plainly:
`sed -i`, `>` redirects and other Bash writes do not pass through file-tool
hooks and are not caught; and paths outside the project directory are not
enforced. The post-hoc audit is the backstop for both.

## 4. Let the gate run

At the wave boundary, `drydock:wavecheck` audits what actually happened against
what the plan said — per-task ownership from each commit's real diff, acceptance
criteria re-executed rather than taken on report, and the forbidden list checked
against the hunks. It emits PASS or BLOCK and appends the report to the plan.

**A BLOCK is the system working.** Ownership violations get no retries; they are
contract breaches, not quality misses.

## 5. Close the loop

```
/drydock:reconcile docs/plans/00N-your-plan.md
```

Reconcile turns what execution *learned* into proposed edits to your `CLAUDE.md`,
ADRs and architecture notes — **proposed, never applied.** Failed assumptions
that trace to a claim in a doc are the highest-value output: the doc said X,
reality was Y.

## When something goes wrong

| Symptom | What it means |
|---|---|
| Every edit denied | A stale `.drydock/wave-owns.json`. `rm` it; that is how a wave closes. |
| "ownership enforcement is INACTIVE" | Node < 22. The hook fails open deliberately rather than wedging your repo. |
| Wavecheck BLOCKs on a missing commit | A task did not check-point. Attribution is impossible, so the wave cannot be audited. |
| A skill behaves like an older version | See below. |

**The one that will cost you an hour if nobody tells you.** Skills load from the
*installed* plugin, never from a checkout, and they are cached for the life of a
session. Editing a skill file changes nothing until you `claude plugin update
drydock@drydock` **and** restart. A same-session test of a just-edited skill
exercises the stale copy and proves nothing. `drydock-audit.mjs` prints its own
version and path on every verdict and shouts `VERSION DRIFT` when the script you
ran and the plugin your skills came from disagree.

## What this skipped

The full lane — multiple phases, parallel `drydock:executor` subagents on
disjoint files, a `Wave x.R` quality review, an adversarial pressure test — and
the **Testing Gate**, where `seatrial` drives written end-to-end cases through a
real browser and emits a go/no-go sheet. Reach for those when the change is big
enough to deserve them. [Plan 005](../docs/plans/005-small-lane-and-solo-mode.md)
is a small-lane plan you can read end to end in a few minutes;
[plan 001](../docs/plans/001-drydock-homepage.md) is the other extreme, 28 tasks
across 14 waves, with a 49-entry Deviation Log that is the honest record of what
went wrong.
