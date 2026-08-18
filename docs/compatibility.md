# Compatibility & pre-release checklist

Runtime properties that depend on the host Claude Code version. Status is
stated plainly; anything PENDING is a reason this plugin is still in internal
pilot, not a footnote.

| # | Property | Status | Notes |
|---|----------|--------|-------|
| A1 | Per-task model override at spawn (param vs agent frontmatter precedence) | PASSED | 2026-08-18, host 2.1.234. Spawn param takes precedence over frontmatter: `executor.md` declares `model: sonnet`, and `haiku` and `opus` params each won across 4 spawns in 2 independent runs — zero Sonnet reports. Per-tier executor variants not needed. Note: `opus` resolved to the session's variant (`claude-opus-5[1m]`), not a pinned model ID — `model: opus` selects a tier, not an exact build. Evidence is agent self-report against the sonnet frontmatter control — see [verification-log.md](verification-log.md#a1--per-task-model-override-at-spawn-param-vs-agent-frontmatter-precedence). Known limit, still untested: param ignored in agent-teams mode — Drydock uses plain Task spawning. |
| A2 | `isolation: "worktree"` agent spawning | PASSED | 2026-08-18, host 2.1.234, git 2.51.0. Smoke test TEST.1 via `drydock:executor-isolated`, isolation from frontmatter only (no param). (a) Worktree created: `git worktree list` showed a second entry at `.claude/worktrees/agent-<id>` on branch `worktree-agent-<id>`, present on disk. (b) Commit exists in contract format: `6b8ba31` subject exactly `drydock(TEST.1): worktree smoke test`, `1 file changed, 1 insertion(+)`, only the owned file. (c) Both lines present at that commit via `git show 6b8ba31:scratch/test.txt`; main tree correctly still one line at `aa38357`, unmerged. Worktree is **not** auto-removed when it contains changes — cleanup is the orchestrator's job. `.claude/` must be gitignored or it shows as untracked noise in every wavecheck diff. See [verification-log.md](verification-log.md#a2--isolation-worktree-agent-spawning). |
| A2b | Post-wavecheck worktree merge procedure | PENDING | Split out of A2 on 2026-08-18: the spawning half passed, the merge half was never exercised. Needs its own test — merge a worktree branch into `main`, plus a deliberate conflict outside the task's `owns` set to verify the contract's BLOCKED path. |
| A3 | Orchestrator gate compliance (wavecheck invoked unprompted between waves) | MEASURING | Tracked across the first 5–10 pilot plans; results will be published here. |
| A4 | `claude plugin validate --strict` | PASSED | 2026-08-18, including `disable-model-invocation` and `isolation` frontmatter. |
| — | Contract logic (audit soundness, BLOCK path, attribution) | VERIFIED | Adversarial dry-run — see [self-audit.md](self-audit.md). Defect found and fixed in v0.3.0. |

Public release criteria: A1 and A2 resolved to one-line compatibility notes;
A3 published with real numbers; one example plan and one field case study in
this docs folder.
