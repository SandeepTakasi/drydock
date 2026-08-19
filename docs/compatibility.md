# Compatibility & pre-release checklist

Runtime properties that depend on the host Claude Code version. Status is
stated plainly; anything PENDING is a reason this plugin is still in internal
pilot, not a footnote.

| # | Property | Status | Notes |
|---|----------|--------|-------|
| A1 | Per-task model override at spawn (param vs agent frontmatter precedence) | PASSED | 2026-08-18, host 2.1.234. Spawn param takes precedence over frontmatter: `executor.md` declares `model: sonnet`, and `haiku` and `opus` params each won across 4 spawns in 2 independent runs — zero Sonnet reports. Per-tier executor variants not needed. Note: `opus` resolved to the session's variant (`claude-opus-5[1m]`), not a pinned model ID — `model: opus` selects a tier, not an exact build. Evidence is agent self-report against the sonnet frontmatter control — see [verification-log.md](verification-log.md#a1--per-task-model-override-at-spawn-param-vs-agent-frontmatter-precedence). Known limit, still untested: param ignored in agent-teams mode — Drydock uses plain Task spawning. |
| A2 | `isolation: "worktree"` agent spawning | PASSED | 2026-08-18, host 2.1.234, git 2.51.0. Smoke test TEST.1 via `drydock:executor-isolated`, isolation from frontmatter only (no param). (a) Worktree created: `git worktree list` showed a second entry at `.claude/worktrees/agent-<id>` on branch `worktree-agent-<id>`, present on disk. (b) Commit exists in contract format: `6b8ba31` subject exactly `drydock(TEST.1): worktree smoke test`, `1 file changed, 1 insertion(+)`, only the owned file. (c) Both lines present at that commit via `git show 6b8ba31:scratch/test.txt`; main tree correctly still one line at `aa38357`, unmerged. Worktree is **not** auto-removed when it contains changes — cleanup is the orchestrator's job. `.claude/` must be gitignored or it shows as untracked noise in every wavecheck diff. See [verification-log.md](verification-log.md#a2--isolation-worktree-agent-spawning). |
| A2b | Post-wavecheck worktree merge procedure | PASSED | 2026-08-19, host 2.1.235, git 2.51.0. Steps 1–4 execute as specified: disjoint worktrees merge conflict-free in ascending task-id order and the integration smoke passes; a rogue edit colliding with a sibling's file produces a merge conflict, leaves `MERGE_HEAD`, and `git merge --abort` restores `main` with the compliant sibling's work intact — so step 3's "never resolve inline" is satisfiable. **Documented limitation: a clean merge is NOT evidence of ownership compliance.** A rogue edit only conflicts if a sibling happened to touch the same file; a non-colliding unowned edit merges cleanly and lands on `main` silently (verified). The ownership audit is the only defence there — the same shape as [self-audit](self-audit.md) finding 2. **Method: executed mechanically, not agent-driven** (A2 covers live spawning; merging into `main` was kept out of this repo's history). See [verification-log.md](verification-log.md#a2b--post-wavecheck-worktree-merge-procedure). |
| A3 | Orchestrator gate compliance (wavecheck invoked unprompted between waves) | MEASURING | Tracked across the first 5–10 pilot plans; results will be published here. |
| A4 | `claude plugin validate --strict` | PASSED | 2026-08-18, including `disable-model-invocation` and `isolation` frontmatter. |
| — | Contract logic (audit soundness, BLOCK path, attribution) | VERIFIED | Adversarial dry-run — see [self-audit.md](self-audit.md). Defect found and fixed in v0.3.0. |

Public release criteria — **3 of 4 met**:

- ✅ A1 and A2 resolved to one-line compatibility notes.
- ✅ One example plan ([001-drydock-homepage](plans/001-drydock-homepage.md)) and
  one field case study ([case-study-001-homepage](case-study-001-homepage.md)).
- ❌ **A3 published with real numbers.** One pilot plan is not enough; the note
  above says 5–10, and in that run the orchestrator knew it was being measured.
- ✅ **A2b verified** (2026-08-19, mechanically — see the row above for the method
  limit and the clean-merge caveat).

Licensed MIT as of v0.4.0. Remaining before public release is therefore evidence,
not code.
