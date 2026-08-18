# Compatibility & pre-release checklist

Runtime properties that depend on the host Claude Code version. Status is
stated plainly; anything PENDING is a reason this plugin is still in internal
pilot, not a footnote.

| # | Property | Status | Notes |
|---|----------|--------|-------|
| A1 | Per-task model override at spawn (param vs agent frontmatter precedence) | PASSED | 2026-08-18, host 2.1.234. Spawn param takes precedence over frontmatter: `executor.md` declares `model: sonnet`, and `haiku` and `opus` params each won across 4 spawns in 2 independent runs — zero Sonnet reports. Per-tier executor variants not needed. Note: `opus` resolved to the session's variant (`claude-opus-5[1m]`), not a pinned model ID — `model: opus` selects a tier, not an exact build. Evidence is agent self-report against the sonnet frontmatter control — see [verification-log.md](verification-log.md#a1--per-task-model-override-at-spawn-param-vs-agent-frontmatter-precedence). Known limit, still untested: param ignored in agent-teams mode — Drydock uses plain Task spawning. |
| A2 | `isolation: "worktree"` agent spawning + merge procedure | PENDING | Test on a trivial isolated task before the first worktree plan. |
| A3 | Orchestrator gate compliance (wavecheck invoked unprompted between waves) | MEASURING | Tracked across the first 5–10 pilot plans; results will be published here. |
| A4 | `claude plugin validate --strict` | PASSED | 2026-08-18, including `disable-model-invocation` and `isolation` frontmatter. |
| — | Contract logic (audit soundness, BLOCK path, attribution) | VERIFIED | Adversarial dry-run — see [self-audit.md](self-audit.md). Defect found and fixed in v0.3.0. |

Public release criteria: A1 and A2 resolved to one-line compatibility notes;
A3 published with real numbers; one example plan and one field case study in
this docs folder.
