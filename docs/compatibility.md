# Compatibility & pre-release checklist

Runtime properties that depend on the host Claude Code version. Status is
stated plainly; anything PENDING is a reason this plugin is still in internal
pilot, not a footnote.

| # | Property | Status | Notes |
|---|----------|--------|-------|
| A1 | Per-task model override at spawn (param vs agent frontmatter precedence) | PASSED | 2026-08-18, host 2.1.234. Spawn param takes precedence over frontmatter: `executor.md` declares `model: sonnet`, and `haiku` and `opus` params each won across 4 spawns in 2 independent runs — zero Sonnet reports. Per-tier executor variants not needed. Note: `opus` resolved to the session's variant (`claude-opus-5[1m]`), not a pinned model ID — `model: opus` selects a tier, not an exact build. Evidence is agent self-report against the sonnet frontmatter control — see [verification-log.md](verification-log.md#a1--per-task-model-override-at-spawn-param-vs-agent-frontmatter-precedence). Known limit, still untested: param ignored in agent-teams mode — Drydock uses plain Task spawning. |
| A2 | `isolation: "worktree"` agent spawning | PASSED | 2026-08-18, host 2.1.234, git 2.51.0. Smoke test TEST.1 via `drydock:executor-isolated`, isolation from frontmatter only (no param). (a) Worktree created: `git worktree list` showed a second entry at `.claude/worktrees/agent-<id>` on branch `worktree-agent-<id>`, present on disk. (b) Commit exists in contract format: `6b8ba31` subject exactly `drydock(TEST.1): worktree smoke test`, `1 file changed, 1 insertion(+)`, only the owned file. (c) Both lines present at that commit via `git show 6b8ba31:scratch/test.txt`; main tree correctly still one line at `aa38357`, unmerged. Worktree is **not** auto-removed when it contains changes — cleanup is the orchestrator's job. `.claude/` must be gitignored or it shows as untracked noise in every wavecheck diff. See [verification-log.md](verification-log.md#a2--isolation-worktree-agent-spawning). |
| A2b | Post-wavecheck worktree merge procedure | PASSED | 2026-08-19, host 2.1.235, git 2.51.0. Steps 1–4 execute as specified: disjoint worktrees merge conflict-free in ascending task-id order and the integration smoke passes; a rogue edit colliding with a sibling's file produces a merge conflict, leaves `MERGE_HEAD`, and `git merge --abort` restores `main` with the compliant sibling's work intact — so step 3's "never resolve inline" is satisfiable. **Documented limitation: a clean merge is NOT evidence of ownership compliance.** A rogue edit only conflicts if a sibling happened to touch the same file; a non-colliding unowned edit merges cleanly and lands on `main` silently (verified). The ownership audit is the only defence there — the same shape as [self-audit](self-audit.md) finding 2. **Method: executed mechanically, not agent-driven** (A2 covers live spawning; merging into `main` was kept out of this repo's history). See [verification-log.md](verification-log.md#a2b--post-wavecheck-worktree-merge-procedure). |
| A3 | Orchestrator gate compliance (wavecheck invoked unprompted between waves) | PUBLISHED — **not PASSED** | Updated 2026-08-21 (was 2026-08-19). **27 of 28 wave gates invoked at their boundary, 1 skipped, 26 of 28 recorded before the next wave opened**, across 4 pilot plans (001–004). Gates were invoked on bare "continue"/"go ahead" instructions that named no gate. **The one skip is the most useful data point here, not a blemish:** plan 004's wave-2.0 gate was not run before wave 2.1 opened (deviation 11), the next gate refused to open on the missing prior report, and the retroactive audit then BLOCKed on a *real* ownership breach (deviation 13). The failure path is observed end to end rather than assumed. **Still an upper bound, not a rate:** every session knew A3 was measured and one said so aloud at a gate, and the sample is 4 plans against this row's own 5–10 bar. The bias is not resolved by more plans under the same conditions. PASSED requires one session not told the gate is observed, on a plan it did not plan. Note the 2026-08-19 grep-based recount **cannot detect a skip** — a retroactive report is an ordinary heading — which is why `site/scripts/assert-matrix.mjs` now checks logged skips against the ledger instead. See [a3-gate-compliance.md](a3-gate-compliance.md) and [verification-log.md](verification-log.md#a3--orchestrator-gate-compliance). |
| A4 | `claude plugin validate --strict` | PASSED | 2026-08-18, including `disable-model-invocation` and `isolation` frontmatter. |
| A5 | Playwright MCP availability and browser-drive round trip | OBSERVED — **not PASSED** | 2026-08-20, host 2.1.237, repo SHA `29bc6fc`. The `playwright` MCP connected at session start advertising 24 `mcp__playwright__browser_*` tools; `browser_navigate` returned live page state whose title matched the exported `<title>`, and `browser_take_screenshot` produced an 89,692-byte PNG. The same session then ran the full [seatrial gate](verification-log.md#seatrial-gate-run--plan-004-testing-gate-tg1tg6) (TG1–TG6). **Two limits keep this off PASSED.** (a) **Availability is per-session:** the planning session for [plan 004](plans/004-seatrial-e2e-gate.md) found no browser tools at all on the same machine, so this is evidence the round trip *can* work, not that the driver is reliably present. (b) **Only navigate and screenshot were exercised** — click, form fill, `browser_evaluate`, network recording and multi-tab were not, and **`video` evidence is uncapturable through this driver at all** (a per-`BrowserContext` setting fixed at creation; no video, record or trace tool is exposed), which is what produced plan 004's only NO-GO. See [verification-log.md](verification-log.md#a5--playwright-mcp-availability-and-browser-drive-round-trip). |
| A6 | Ownership enforcement hook fires in a live session | LOGIC VERIFIED — live registration PENDING | 2026-08-21, host 2.1.237, Node v24.14.1. New in v0.6.0. The hook's logic passes 10 of 10 cases driven by PreToolUse-shaped JSON — deny on unowned paths in both Windows separator styles, allow inside `owns`, inert with no config, **fail closed** on a malformed one. **Whether the host actually invokes it is not verified and could not be from the authoring session:** hooks register at session start on the same terms as skill files (plan 004 deviation 7), so a hook is never live in the session that writes it. A4 re-run green with `hooks/hooks.json` present. Documented ceiling, not a gap: **Bash-mediated writes bypass file-tool hooks entirely** — the post-hoc `audit-wave` is the backstop there. See [verification-log.md](verification-log.md#a6--ownership-enforcement-hook-pretooluse). |
| — | Contract logic (audit soundness, BLOCK path, attribution) | VERIFIED | Adversarial dry-run — see [self-audit.md](self-audit.md). Defect found and fixed in v0.3.0. |

Public release criteria — **3 of 4 met, 1 partial**:

- ✅ A1 and A2 resolved to one-line compatibility notes.
- ✅ One example plan ([001-drydock-homepage](plans/001-drydock-homepage.md)) and
  one field case study ([case-study-001-homepage](case-study-001-homepage.md)).
- ⚠️ **A3 published with real numbers — half met, and deliberately stopped there.**
  The numbers are real and published (27/28 across 4 plans, including one skipped
  gate that the following gate caught). The sample is still short of the 5–10 this
  row asks for, and every run was observed, so the figure is an upper bound rather
  than a rate. Continuing under the same conditions would fix the count and not the
  meaning, which is why measurement stopped at 4 rather than being extended.
- ✅ **A2b verified** (2026-08-19, mechanically — see the row above for the method
  limit and the clean-merge caveat).

Licensed MIT as of v0.4.0. Remaining before public release is therefore evidence,
not code.

**Cost:** what one full run costs is published in [cost-001.md](cost-001.md) —
including the number that run never captured. Token spend was not instrumented,
so the economy claim in the plugin description remains a design intent rather
than a measured result, and the page says so rather than estimating.

## 2026-08-20 — published as an open pilot

The homepage went live at <https://takasivenkatasandeep-08.github.io/drydock/>
and the repo went public with **A3 unresolved and stated on the page**, rather
than holding the release until it passes.

**No row status changed to make that happen.** Going public is a decision, not
evidence, and this file moves only on evidence — see
[verification-log.md](verification-log.md). The release criteria above still read
3 of 4 met, 1 partial, because that is still true.

What ships visible instead: the site renders A3 as `PUBLISHED, NOT PASSED` with
"ceiling, not a rate" attached, and `scripts/assert-copy.mjs` now **requires**
both of those strings. Before this, nothing forced the caveat to appear — the
page could have promoted A3 and the gate would still have gone green. Proven
failable the same day: doctoring the export to say `PASSED` with the caveat
removed fails `assert-copy` naming both literals.

The status line reads "open pilot -- field benchmarks pending" rather than
"internal pilot", which was simply false on a public URL.

A3's route to PASSED is unchanged: one session not told the gate is observed, on
a plan it did not plan.
