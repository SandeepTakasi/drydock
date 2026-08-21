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
| `seatrial` | skill | model, or `/drydock:seatrial` — after the final wave |
| `replan` | skill | **human-only** (`disable-model-invocation`) |
| `reconcile` | skill | final step of every plan |

## What makes it different

- **Disjoint ownership is enforced, not requested** (v0.6.0). A `PreToolUse`
  hook reads `.drydock/wave-owns.json` and **denies** any Write/Edit to a path no
  task in the active wave owns. Prose did not hold this line — a plan in this
  repo staged a file outside its `owns` and the stated cause was that the work
  ran inline, where the contract binds nobody. A hook binds every writer in the
  session. Three ceilings, stated plainly: **Bash writes bypass it** (`sed -i`,
  `>`, `git checkout`) and the post-hoc audit is the backstop; it is
  **wave-level, not per-task**, because hook input carries no subagent identity;
  and it is **inert unless `.drydock/wave-owns.json` exists**, which is both the
  default state and the escape hatch. Same-wave tasks can additionally be
  isolated by git worktrees (`isolation: worktree` in the plan header).
- **Plan-conformance auditing, not code review.** Wavecheck answers one
  question: did the wave do exactly what the plan said and nothing else —
  ownership boundaries, forbidden lists, acceptance criteria verified against
  the actual diff, never against executor claims.
- **The plan is checked by a program, not only by a reader.**
  `scripts/drydock-audit.mjs validate-plan` catches duplicate task ids,
  same-wave ownership collisions, dependencies on same-wave tasks, and Testing
  Gate defects; `audit-wave` computes the ownership audit from per-task commits
  and prints the SHAs and file lists it derived, so wavecheck's evidence is
  reproducible rather than eyeballed. Its first run found a same-wave dependency
  in two of this repo's four plans that reviews and pressure tests had missed.
- **Per-task model right-sizing lives in the plan**, not in global config.
- **The Testing Gate is written before the code.** A plan touching a UI or API
  surface carries its end-to-end cases from the start, with declared evidence
  types and severities; `seatrial` drives them through a real browser afterwards
  and emits a go/no-go sheet for QA. A gate written after implementation tests
  what was built rather than what was asked for. The sheet says what it is worth:
  evidence about the paths tested at one commit in one browser, never proof that
  other defects are absent.
- **Reconcile closes the loop.** Deviations and failed assumptions become
  proposed diffs to CLAUDE.md / ADRs / architecture docs — proposed, never
  auto-applied.
- **Replan patches, never regenerates.** Decision Log append-only, completed
  waves immutable, task ids never reused.

## Requirements

**Node >= 22**, on PATH. New in v0.6.0: the ownership hook and the audit script
are Node programs (`path.matchesGlob` is stdlib from 22). Before this release the
plugin was markdown-only and ran wherever Claude Code ran; that is no longer
true, and it is a real adoption cost rather than a footnote. The host must also
support `PreToolUse` hooks, or ownership enforcement silently does nothing —
run `node drydock/hooks/enforce-owns.test.mjs` to confirm the hook behaves before
relying on it.

## Install (internal, team scope)

```
/plugin marketplace add TakasiVenkataSandeep-08/drydock
/plugin install drydock@drydock
```

Add `--scope project` to the install to share it with your team.

Configure on enable (or `--config`): `plans_dir` (default `docs/plans`),
`docs_targets` (default `CLAUDE.md,docs/decisions,docs/architecture.md`).

Versioning: explicit semver from v0.4.0 (`CHANGELOG.md` maintained per release).
Licensed MIT. Remaining before public release, per
[compatibility](../docs/compatibility.md): A3 published with real numbers across
several pilot plans, and A2b (worktree merge) verified.

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
