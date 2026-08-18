# Verification log

Raw evidence behind every status in [compatibility.md](compatibility.md). One
entry per test run. No row in the compatibility table is marked PASSED without
a corresponding entry here.

Each entry records: test id, date, host `claude --version`, the exact command or
spawn parameters, the raw output or completion report verbatim (trimmed to the
relevant lines), and a one-line verdict matching the table.

---

## A1 — Per-task model override at spawn (param vs agent frontmatter precedence)

**Date:** 2026-08-18
**Host version:** `claude --version` → `2.1.234 (Claude Code)`
**Parent session model:** Opus 5 (1M context) — `claude-opus-5[1m]`

**Control:** `drydock/agents/executor.md` frontmatter declares `model: sonnet`.
This value is distinct from both spawn params below, so an ignored param would
surface as Sonnet in both reports.

### Run 1 — spawn param `haiku`

Spawn parameters (Task/Agent tool, plain spawning — not agent-teams mode):

```
subagent_type: "drydock:executor"
model:         "haiku"
prompt:        "Report exactly which model you are running as your completion
                report.\n\nDo not perform any other work. Do not read files,
                run commands, or make edits. Your entire completion report
                should be the model name and model ID you are running as,
                exactly as stated in your own system context."
```

Completion report, verbatim:

```
**Model Running:**

Model Name: Haiku 4.5
Model ID: claude-haiku-4-5-20251001
```

Reported usage: 19,872 subagent tokens, 0 tool uses, 2,611 ms.

### Run 2 — spawn param `opus`

Identical spawn parameters and prompt, with `model: "opus"`.

Completion report, trimmed to the relevant lines:

```
TASK: model-report — DONE
acceptance:
  - Report the model being run: VERIFIED — model name: **Opus 5 (1M context)**;
    exact model ID: **claude-opus-5[1m]**, quoted verbatim from my own system
    context.
deviations:
  - No checkpoint commit made. The task produced no file changes and the working
    directory (`/Users/takasivenkatasandeep`) is not a git repo [...]
```

Reported usage: 21,888 subagent tokens, 0 tool uses, 6,549 ms.

### Observations

1. **Precedence resolved.** The frontmatter default (`sonnet`) was overridden in
   both runs. The spawn param wins.
2. **`opus` is not a pinned ID.** Run 2 returned `claude-opus-5[1m]`, the parent
   session's 1M-context variant, rather than plain `claude-opus-5`. The param
   appears to select a model *tier* resolved against the session, not a fixed
   model ID. Plan authors writing `model: opus` should not assume they are
   pinning an exact build.
3. **Untested:** the agent-teams-mode limitation noted in the A1 row. Drydock
   uses plain Task spawning, so it is out of scope for this run but remains
   unverified.

### Method limitation

Both data points are the subagent reading the model name out of its own system
context — not an independent measurement of which weights served the tokens. The
`model: sonnet` frontmatter control is what makes the result load-bearing: a
silently-ignored param would have produced two Sonnet reports and did not. For
this result to be wrong, the harness would have to stamp a model name into
subagent context that disagrees with the model actually serving it.

**Verdict:** PASSED — spawn param overrides agent frontmatter; `opus` resolves to
the session's opus variant, not a pinned model ID.

---

## A1 (replication) — independent re-run of the same test

Re-run to check the first result was not a one-off. Same host session, same
`model: sonnet` frontmatter control, but the task text was passed **verbatim as
specified** rather than with the added "do no other work" constraints used in the
first pair of runs — so the two pairs differ in prompt as well as in timing.

**Date:** 2026-08-18
**Host version:** `claude --version` → `2.1.234 (Claude Code)`

### Run 3 — spawn param `haiku`

```
subagent_type: "drydock:executor"
model:         "haiku"
prompt:        "Report exactly which model you are running as your completion report."
```

Completion report, verbatim:

```
I am running **Claude Haiku 4.5** (model ID: `claude-haiku-4-5-20251001`).
```

Reported usage: 19,847 subagent tokens, 0 tool uses, 4,157 ms.

### Run 4 — spawn param `opus`

Identical spawn parameters and prompt, with `model: "opus"`.

Completion report, verbatim:

```
I am running **Claude Opus 5 (1M context)** — exact model ID `claude-opus-5[1m]`.

No task block was provided in this session, so there is no Drydock work to execute
or report on.

TASK: n/a — BLOCKED
files_changed: []
checkpoint_commit: none
acceptance:
  - report running model: VERIFIED (model ID `claude-opus-5[1m]`, Opus 5 1M context,
    from my own runtime identity)
deviations:
  - No task block was delivered; the request was a model-identity question only. Nothing
    was implemented and nothing was committed (the working directory is also not a git
    repo, per env).
observations:
  - /Users/takasivenkatasandeep/Desktop/drydock-repo/drydock is not a git repo, so the
    checkpoint-commit step of the executor contract cannot run as specified if a real
    task arrives here.
```

Reported usage: 21,846 subagent tokens, 0 tool uses, 9,096 ms.

### Observations

1. **Replicates run 1–2 exactly.** Four spawns across two prompt variants, zero
   Sonnet reports. The frontmatter default never surfaced.
2. **`opus` again resolved to `claude-opus-5[1m]`**, confirming the tier-not-build
   behaviour rather than a one-off.
3. **Executor contract gap surfaced unprompted.** Run 4 flagged that the repo is
   not a git repo, so its mandated checkpoint-commit step cannot run. This is a
   real finding about the repo, not about A1 — every executor task run here will
   report the same deviation. Tracked separately from this row.
4. **Verbatim task text is under-specified for a probe.** Given the bare task,
   run 4 correctly classified itself BLOCKED (no task block supplied) while still
   answering. The identity answer was unaffected, but a probe prompt that satisfies
   the executor contract would produce cleaner reports.

**Verdict:** PASSED — replicated; spawn param takes precedence over frontmatter.

---

## A2 — `isolation: "worktree"` agent spawning

**Date:** 2026-08-18
**Host version:** `claude --version` → `2.1.234 (Claude Code)`
**Git version:** 2.51.0

**Scope note:** this run tests the **spawning half** of A2 only. The merge
procedure was deliberately not exercised — see "Not tested" below.

### Setup

`drydock-repo` was not a git repository before this test; A2 is untestable
without one, so it was initialized as part of the run:

```
git init -b main
# .gitignore added containing: .DS_Store
git add -A && git commit -m "Initial commit: drydock plugin + docs"   → ba944d6 (17 files)
# scratch/test.txt created containing one line: worktree smoke test
git add scratch/test.txt && git commit -m "test: A2 worktree smoke fixture" → aa38357
```

Baseline immediately before spawning: one worktree (`main` at `aa38357`), one
branch, no `.claude/` directory.

### Spawn

```
subagent_type: "drydock:executor-isolated"
model:         (not overridden — frontmatter default: sonnet)
isolation:     (NOT passed as a param — relying on the agent's own
                frontmatter `isolation: "worktree"`, which is the path
                Drydock actually uses)
```

Task block supplied: task id `TEST.1`, task name `worktree smoke test`,
`owns: [scratch/test.txt]`, instruction to add a second line reading exactly
`edited in isolation`, forbidding changes outside `owns` and preserving line 1.

### Completion report, verbatim

```
task_id: TEST.1
status: DONE
owns_touched: [scratch/test.txt]
acceptance:
  - "scratch/test.txt contains a second line reading 'edited in isolation'" — VERIFIED
    (git diff shows first line unchanged, second line added exactly as specified)
forbidden_check: no other files modified; first line "worktree smoke test" preserved
    — VERIFIED via git diff
observations: none
worktree_commit: 6b8ba31612e03029601d268e60035319f516fad4
```

Harness-reported worktree metadata:
`path: .claude/worktrees/agent-<id>`, `branch: worktree-agent-<id>`.

Reported usage: 30,652 subagent tokens, 7 tool uses, 43,033 ms.

### Independent verification

All three checks were run by the orchestrator against git directly, not taken
from the agent's self-report.

**(a) A worktree was actually created.** `git worktree list` shows a second
entry at `.claude/worktrees/agent-<id>` on branch
`worktree-agent-<id>` at `6b8ba31`, and the directory exists on disk.
Frontmatter-declared isolation was honoured without an explicit param.

**(b) The mandated commit exists with the correct message.**
`git log -1 6b8ba31` → subject exactly `drydock(TEST.1): worktree smoke test`,
matching the contract's `drydock(<task-id>): <task name>` format.
`git show --stat` confirms `1 file changed, 1 insertion(+)` touching only
`scratch/test.txt` — the `owns` set was respected.

**(c) The file has both lines at the worktree commit.**
`git show 6b8ba31:scratch/test.txt` → `worktree smoke test` / `edited in
isolation`. The main working tree still holds one line and `main` is still at
`aa38357`, which is **correct** unmerged-isolation behaviour, not a failure.

### Observations

1. **Isolation held.** Main-tree HEAD and file content were untouched by the
   agent. The commit lives only on the worktree branch.
2. **The worktree persists after completion.** It was not auto-removed, because
   it contained changes. Cleanup and merge are therefore orchestrator
   responsibilities, not automatic.
3. **`.claude/` pollutes `git status`.** Post-run `git status` showed `?? .claude/`
   in the main repo. Left unignored, every worktree plan adds untracked noise and
   risks the worktree dir being accidentally committed — and it would surface in
   wavecheck as an unexplained change outside every task's `owns` set.
   `.claude/` was added to `.gitignore` as a result of this finding.
4. **Commit authorship is the human's git identity** (`sandeep
   <venkatas@geekyants.com>`), not a distinct agent identity. Attribution of
   agent-authored commits relies entirely on the `drydock(...)` subject prefix.

### Not tested

The **merge procedure** half of the A2 row was not exercised: no merge of
`worktree-agent-<id>` into `main` was attempted, so the contract's
"post-wavecheck merge is clean and attributable" claim and its BLOCKED-on-conflict
path remain unverified. This needs its own test, ideally including a deliberate
conflict outside the `owns` set.

**Verdict:** PASSED (spawning) — frontmatter isolation honoured, worktree created,
contract-format commit present, file correct on the worktree branch, main tree
untouched. Merge procedure still unverified.
