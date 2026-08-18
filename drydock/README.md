# Drydock

Ships get built here. Nothing sails until it leaves the dock.

Drydock is a plan-first execution system for Claude Code: rigorous plan
documents, wave-based parallel subagent execution with **disjoint file
ownership**, plan-conformance **verification gates** between waves, and a
**reconcile loop** that feeds what execution learned back into your project
docs. The plan is the source of truth from first question to final doc diff.

## The lifecycle

```
planwright ──► [human approves] ──► execute waves ──► wavecheck ──► ... ──► reconcile
                                         ▲                │
                                         └── /replan ◄────┘ (on BLOCK or drift)
```

| Piece | Kind | Invocation |
|-------|------|-----------|
| `planwright` | skill | model or `/drydock:planwright` |
| `executor` / `executor-isolated` | agents | spawned per task by the orchestrating session |
| `wavecheck` | skill | named as a blocking gate inside every plan |
| `replan` | skill | **human-only** (`disable-model-invocation`) |
| `reconcile` | skill | final step of every plan |

## What makes it different

- **Plan-conformance auditing, not code review.** Wavecheck answers one
  question: did the wave do exactly what the plan said and nothing else —
  ownership boundaries, forbidden lists, acceptance criteria verified against
  the actual diff, never against executor claims.
- **Disjoint ownership as a first-class constraint.** Same-wave tasks can
  never own the same file; optionally enforced by git worktrees
  (`isolation: worktree` in the plan header).
- **Per-task model right-sizing lives in the plan**, not in global config.
- **Reconcile closes the loop.** Deviations and failed assumptions become
  proposed diffs to CLAUDE.md / ADRs / architecture docs — proposed, never
  auto-applied.
- **Replan patches, never regenerates.** Decision Log append-only, completed
  waves immutable, task ids never reused.

## Install (internal, team scope)

```bash
claude plugin marketplace add <org>/drydock-marketplace
claude plugin install drydock --scope project
```

Configure on enable (or `--config`): `plans_dir` (default `docs/plans`),
`docs_targets` (default `CLAUDE.md,docs/decisions,docs/architecture.md`).

Versioning: internal phase uses commit-SHA versioning (no `version` bump
needed per change). Before any public release: adopt explicit semver, pick a
license, and maintain CHANGELOG.md.

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
