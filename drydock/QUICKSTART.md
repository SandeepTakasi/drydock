# Quickstart: your first Drydock plan

This walks one small change end to end. It uses the **small lane**, which is
where most work belongs; the full lifecycle in the README is what Drydock does
when a change actually needs it.

No time estimate is given here, because none has been measured. The first run
costs more than the second: you are learning what a plan document is for.

## Before you start

| | |
|---|---|
| **Claude Code** | the host. Drydock is a plugin, not a standalone CLI |
| **Node >= 20.17** on PATH | matches `engines` in `plugin.json`, and is tested in CI on 20, 22 and 24 |
| **A git repo** | attribution is per-commit; there is nothing to audit without one |

```
/plugin marketplace add SandeepTakasi/drydock
/plugin install drydock@drydock
```

Then **restart the session.** Skills load from the installed plugin at session
start, so a fresh install is not live until you restart. This bites harder than
it sounds; see the last section.

### One variable, and every command below runs

The plugin's install directory is not on your PATH, and `$CLAUDE_PLUGIN_ROOT` is
empty in a shell: it is substituted by the host when it loads a skill, not by
bash. So set this once per shell, and paste anything from here on.

```bash
DD=$(ls -d ~/.claude/plugins/cache/drydock/drydock/*/ | sort -V | tail -1)
```

Confirm the ownership hook actually works before relying on it:

```bash
node "$DD/hooks/enforce-owns.test.mjs"
node "$DD/hooks/detect-bash-writes.test.mjs"
```

You want `PASS` from both. They run in temp directories and touch nothing in
your repo. The two are different layers: the first denies a write at the tool
boundary, the second records a write a Bash command already made.

## 1. Ask for a plan

Describe the change. You do not need to say "plan".

> Add a `--json` flag to the export command so CI can parse the output.

Planwright asks the few questions it cannot answer by reading the repo, explores
the code, and writes a plan document to `docs/plans/`.

**Two things worth watching for.** It sizes the work first: below about five
units it will say so and **offer to just do the task instead of planning it**.
Take that offer when it comes. And for anything small it writes `lane: small`
and `execution: solo`: one wave, one gate, no quality-review wave.

## 2. Read the plan, then approve it

The plan is this step's deliverable. Read at least:

- **Surgical-scope statement**: the smallest diff that satisfies the ask.
- **Files owned** per task: the boundary that task may write, and nothing else.
- **Acceptance criterion** per task: *one command that exits 0*. If a criterion
  is prose rather than a command, say so. That is the most common way a plan
  ends up gating nothing.
- **Open questions**: anything it could not decide alone.

Then check it mechanically, and note `--strict`, which is the real gate:

```bash
node "$DD/scripts/drydock-audit.mjs" validate-plan --strict docs/plans/00N-your-plan.md
```

Nothing executes until you flip the plan to `APPROVED`.

**Commit the plan before executing.** `wave-start` refuses to arm a wave while
the plan file is uncommitted, because a boundary that can change under the
executors is not a boundary.

Two files ship with the plugin if you want to write or read one by hand:
`$DD/skills/planwright/reference/template.md` is a copyable skeleton that passes
`--strict`, and `$DD/skills/planwright/reference/example-small-plan.md` is a
finished small-lane plan, logs and all.

## 3. Execute

Say `execute the plan`. In the small lane the session runs the tasks itself,
committing each separately. Before the wave opens it runs:

```bash
node "$DD/scripts/drydock-audit.mjs" wave-start docs/plans/00N-your-plan.md 1.0
```

That validates the plan, refuses to arm if it fails or is uncommitted, adds
`.drydock/` to your `.gitignore` if it is missing, derives the ownership
boundary **from the plan**, and arms the hook. From here a write to a file no
task in the wave owns is **denied at the tool boundary**.

**Prevention is file-tool only, and always will be.** A `>` redirect, `sed -i`
or a heredoc never reaches a file-tool hook, and no amount of reading the command
string fixes that: `cd site && printf x > a.txt` alone defeats it. So Bash writes
are **detected, not prevented** — a second hook records any file a Bash command
changed outside the wave's `owns`, and `audit-wave` fails the wave on it. The
write still lands; you learn about it immediately instead of at the gate, or not
at all.

Paths outside the project directory are not enforced by either layer, and a
gitignored path is invisible to the detector.

## 4. Let the gate run

At the wave boundary:

```bash
node "$DD/scripts/drydock-audit.mjs" audit-wave docs/plans/00N-your-plan.md 1.0
rm .drydock/wave-owns.json
```

`audit-wave` derives each task's file set from its own commit, compares it to
the plan's `owns`, and fails the wave on any commit no task claims. `wavecheck`
wraps that with the judgment checks: acceptance criteria re-executed rather than
taken on report, and the forbidden list checked against the hunks.

**A BLOCK is the system working.** Ownership violations get no retries; they are
contract breaches, not quality misses.

## 5. Close the loop

```
/drydock:reconcile docs/plans/00N-your-plan.md
```

Reconcile turns what execution *learned* into proposed edits to your
`CLAUDE.md`, ADRs and architecture notes. **Proposed, never applied.** Failed
assumptions that trace back to a claim in a doc are the highest-value output:
the doc said X, reality was Y.

## When something goes wrong

| Symptom | What it means |
|---|---|
| Every edit denied | A stale `.drydock/wave-owns.json`. `rm` it; that is how a wave closes. |
| `wave-start` refuses: does not pass validate-plan | Fix the plan first. The boundary it would arm comes from that file. |
| `wave-start` refuses: uncommitted changes | Commit the plan document, then arm. |
| `audit-wave` reports a commit claimed by no task | Something was committed during the wave that no task owns. That is the check working. |
| Exit code 3 | The tool could not run at all (missing file, not a git repo), as opposed to exit 1, which means the plan failed the check. |
| Wavecheck BLOCKs on a missing commit | A task did not check-point, so attribution is impossible and the wave cannot be audited. |
| A skill behaves like an older version | See below. |

**The one that will cost you an hour if nobody tells you.** Skills load from the
*installed* plugin, never from a checkout, and are cached for the life of a
session. Editing a skill file changes nothing until you
`claude plugin update drydock@drydock` **and** restart. A same-session test of a
just-edited skill exercises the stale copy and proves nothing.
`drydock-audit.mjs` prints its own version and path on every verdict and shouts
`VERSION DRIFT` when the script you ran and the plugin your skills came from
disagree.

## What this skipped

The full lane: multiple phases, parallel `drydock:executor` subagents on
disjoint files, a `Wave x.R` quality review, an adversarial pressure test. Also
the **Testing Gate**, where `seatrial` drives written end-to-end cases through a
real browser and emits a go/no-go sheet. Reach for those when the change is big
enough to deserve them.
