# Drydock

Ships get built here. Nothing sails until it leaves the dock.

Drydock is a plan-first execution system for Claude Code: rigorous plan
documents, wave-based parallel subagent execution with **disjoint file
ownership**, plan-conformance **verification gates** between waves, and a
**reconcile loop** that feeds what execution learned back into your project
docs. The plan is the source of truth from first question to final doc diff.

## The lifecycle

```
planwright ──► [human approves] ──► execute waves ──► wavecheck ──► seatrial ──► reconcile
                                         ▲                │              │
                                         └── /replan ◄────┴──────────────┘
                                             (on BLOCK, drift, or NO-GO)
```

| Piece | Kind | Invocation |
|-------|------|-----------|
| `planwright` | skill | model or `/drydock:planwright` |
| `executor` / `executor-isolated` | agents | spawned per task by the orchestrating session |
| `wavecheck` | skill | named as a blocking gate inside every plan |
| `seatrial` | skill | model, or `/drydock:seatrial` (after the final wave) |
| `replan` | skill | **human-only** (`disable-model-invocation`) |
| `reconcile` | skill | final step of every plan |

## What makes it different

- **Disjoint ownership is enforced, not requested** (v0.6.0). A `PreToolUse`
  hook reads `.drydock/wave-owns.json` and **denies** any Write/Edit to a path no
  task in the active wave owns. Prose did not hold this line: a plan in
  this repo staged a file outside its `owns` and the stated cause was that the work
  ran inline, where the contract binds nobody. A hook binds every writer in the
  session. Three ceilings, stated plainly: **Bash writes bypass it** (`sed -i`,
  `>`, `git checkout`) and the post-hoc audit is the backstop; it is
  **wave-level, not per-task**, because hook input carries no subagent identity;
  and it is **inert unless `.drydock/wave-owns.json` exists**, which is both the
  default state and the escape hatch. Same-wave tasks can additionally be
  isolated by git worktrees (`isolation: worktree` in the plan header).
  **`enforcement: required` is a receipt check, not a coverage guarantee**: it
  asserts the hook ran, and the hook is one of two layers. The hook *prevents*
  at the tool boundary and cannot see Bash; `audit-wave` *detects* from each
  task's commit and the working tree and never consults the hook, so it catches
  what the hook is blind to, after the fact rather than before. A wave with an
  empty log ran without prevention, not without auditing.
- **Plan-conformance auditing, not code review.** Wavecheck answers one
  question: did the wave do exactly what the plan said and nothing else?
  Ownership boundaries, forbidden lists, acceptance criteria verified against
  the actual diff, never against executor claims.
- **The plan is checked by a program, not only by a reader.**
  `scripts/drydock-audit.mjs validate-plan` catches duplicate task ids,
  same-wave ownership collisions, dependencies on same-wave tasks, and Testing
  Gate defects; `audit-wave` computes the ownership audit from per-task commits
  and prints the SHAs and file lists it derived, so wavecheck's evidence is
  reproducible rather than eyeballed. Its first run reported a same-wave
  dependency in two of this repo's plans that reviews and pressure tests had
  missed, **and one of the two turned out to be the checker's own defect**,
  which is the more useful half of the story: the wave was read off the task id
  when the format contract says an id outlives its wave assignment, so a
  correctly-moved task looked like a cycle. One real defect (plan 004, accepted
  and recorded as its deviation 15), one checker bug (fixed in v0.8.10).
- **There is a small lane, and the planner routes you to it.** Not every change
  wants fourteen waves. `lane: small` is **one phase, one wave, one gate**: no
  `Wave x.R` quality review, no adversarial pressure test, plan under ~100
  lines. And `execution: solo` drops subagent spawning entirely, so the orchestrating
  session runs the tasks itself. Everything that makes Drydock worth using still
  applies: ownership, acceptance criteria, the Decision Log, the Deviation Log,
  the Testing Gate. `validate-plan` enforces the lane's limits rather than
  trusting the header, so a "small" plan that grows a second wave fails.
  Planwright sizes the work first and picks the lane; **below about five units of
  work it offers to skip the plan and just do the task.** A tool that always
  recommends itself is a tool you stop believing. Worked example:
  [plan 005](../docs/plans/005-small-lane-and-solo-mode.md).
- **Per-task model right-sizing lives in the plan**, not in global config.
- **The Testing Gate is written before the code.** A plan touching a UI or API
  surface carries its end-to-end cases from the start, with declared evidence
  types and severities; `seatrial` drives them through a real browser afterwards
  and emits a go/no-go sheet for QA. A gate written after implementation tests
  what was built rather than what was asked for. The sheet says what it is worth:
  evidence about the paths tested at one commit in one browser, never proof that
  other defects are absent.
- **Reconcile closes the loop.** Deviations and failed assumptions become
  proposed diffs to CLAUDE.md / ADRs / architecture docs. Proposed, never
  auto-applied.
- **Replan patches, never regenerates.** Decision Log append-only, completed
  waves immutable, task ids never reused.

## The wave lifecycle, in three commands

Ownership enforcement is armed per wave, from the plan, and closed when the wave
closes:

```bash
node $DD/scripts/drydock-audit.mjs wave-start docs/plans/005-x.md 2.1   # arm the hook
# ... the wave's executors run; the hook denies writes outside the boundary ...
node $DD/scripts/drydock-audit.mjs audit-wave  docs/plans/005-x.md 2.1  # audit afterwards
rm .drydock/wave-owns.json                                              # close the wave
```

`$DD` is the plugin's install directory. **You do not have to find it by hand:**
the host substitutes `${CLAUDE_PLUGIN_ROOT}` when it loads a skill body, so the
commands `planwright`, `wavecheck` and `executor` hand you already carry the
absolute path. It substitutes nothing in a file read from disk, and
`$CLAUDE_PLUGIN_ROOT` is empty in a shell, so a command copied out of this
README or out of `plan-format.md` with the placeholder still in it runs
`node /scripts/…` and dies `MODULE_NOT_FOUND`. In a checkout of this repo,
`$DD` is `drydock/`.

`wave-start` derives the boundary from the plan. Never write
`.drydock/wave-owns.json` by hand. The hook records every decision to
`.drydock/enforcement.log`, and `audit-wave` reads that log to establish whether
enforcement was actually running, which is a different and stronger question than
whether a config file existed. Both files live under the gitignored `.drydock/`.

## Requirements

**Node >= 22**, on PATH. New in v0.6.0: the ownership hook and the audit script
are Node programs (`path.matchesGlob` is stdlib from 22). Before this release the
plugin was markdown-only and ran wherever Claude Code ran; that is no longer
true, and it is a real adoption cost rather than a footnote. The host must also
support `PreToolUse` hooks, or ownership enforcement silently does nothing.
Run `node $DD/hooks/enforce-owns.test.mjs` to confirm the hook behaves before
relying on it (`$DD` as above; `drydock/` in a checkout of this repo).

## Quickstart

**[QUICKSTART.md](QUICKSTART.md)** walks one small change end to end, in
about 15 minutes. It uses the small lane, which is where most work belongs. Start there
rather than here; this file is the reference, not the on-ramp.

## Install (internal, team scope)

```
/plugin marketplace add SandeepTakasi/drydock
/plugin install drydock@drydock
```

Add `--scope project` to the install to share it with your team.

Configure on enable (or `--config`): `plans_dir` (default `docs/plans`),
`docs_targets` (default `CLAUDE.md,docs/decisions,docs/architecture.md`).
If your repo gitignores `plans_dir` (house rules against committing tool
artifacts), planwright falls back to `.drydock/plans/` and says so in one fixed
sentence in the plan, rather than each plan improvising a justification for its
own location. `drydock-audit.mjs resolve-plans-dir` reports what it resolved.

Versioning: explicit semver from v0.4.0 (`CHANGELOG.md` maintained per release).
Licensed MIT. Per [compatibility](../docs/compatibility.md), three of the four
public-release criteria are met and one is partial: A2b (worktree merge) passed
2026-08-19, and A3's numbers are published across five pilot plans. **What A3
still lacks is independence, not sample size.** Every run was self-observed, so
the figure is a ceiling rather than a rate, and the row stays `PUBLISHED, not
PASSED` until a session that has not been told the gate is watched runs a plan it
did not write.

## The spine

Everything interoperates through one contract:
`skills/planwright/reference/plan-format.md`. Change it → bump
`format_version` → update every consumer. Skills refuse plans with unsupported
versions.

## Deliberate non-goals

- Code-quality review (use a review tool; wavecheck audits conformance only)
- Minimalism enforcement (pairs well with `ponytail`, which owns that)
- Spec authoring (specs feed *into* planwright from outside)
- Auto-editing any documentation, ever
