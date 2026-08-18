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
