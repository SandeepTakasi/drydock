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

---

## A2b — Post-wavecheck worktree merge procedure

**Date:** 2026-08-19
**Host version:** `claude --version` → `2.1.235 (Claude Code)` — note this differs
from A1/A2's `2.1.234`; the host updated between tests.
**Git version:** 2.51.0

**Method, and its limit — read this before the result.** The merge procedure
(`plan-format.md` §Worktree merge procedure, steps 1–4) was executed
**mechanically** against a throwaway repository at `/tmp/dd-a2b`, not by spawning
live `drydock:executor-isolated` agents. Two reasons, both stated so the evidence
is not overread:

1. A2b covers the **merge**, and A2 already verified live worktree *spawning*.
2. A2b requires merging into `main`. Running it in `drydock-repo` would leave test
   merge commits in the project's real history.

So worktrees were created with `git worktree add` and task commits authored
directly in the contract's `drydock(<task-id>): …` format. This mirrors
`self-audit.md`'s method for the audit logic — mechanical execution of the
contract, not a live Claude Code run. **The procedure is verified; live
agent-driven merging is not.** `drydock-repo` was confirmed untouched afterwards
(`git status --porcelain` → 0 lines).

### Part A — happy path: disjoint ownership, ascending merge

Two worktrees off `main`, disjoint owned files, merged in ascending task-id order.

```
per-worktree diffs (the isolation-mode ownership audit mechanism)
  A2B.1 changed: alpha.txt
  A2B.2 changed: beta.txt
merge A2B.1: CLEAN
merge A2B.2: CLEAN
integration smoke against the merged tree: SMOKE OK (exit 0)
```

Steps 1, 2 and 4 behave as specified. Both tasks' changes are present on `main`.

### Part B — a rogue task whose edit collides

`A2B.4` owns `alpha.txt` and, **by design**, also edits `shared.txt` — owned by
sibling `A2B.3` — while reporting `deviations: none`.

```
A2B.3 changed: shared.txt
A2B.4 changed: alpha.txt shared.txt      <- shared.txt is UNOWNED
merge A2B.3: CLEAN
merge A2B.4: CONFLICT
  Auto-merging shared.txt
  CONFLICT (content): Merge conflict in shared.txt
  Automatic merge failed; fix conflicts and then commit the result.
in-progress merge: yes (MERGE_HEAD present)
conflicted paths: shared.txt      conflict marker lines: 3
git merge --abort  -> main clean (0 dirty paths), retains A2B.3 only
```

Both defences hold. The ownership audit (procedure step 1's `wavecheck PASS`
precondition) catches it **before** any merge is attempted. If that were skipped,
the merge itself fails safely, and step 3's "never resolve inline" is satisfiable
— `--abort` restores `main` with the compliant sibling's work intact.

### Part C — a rogue task whose edit does NOT collide

`A2B.5` owns `beta.txt` and, by design, also weakens `verify.sh` — a file **no
sibling in the wave touches**.

```
A2B.5 changed: beta.txt verify.sh        <- verify.sh is UNOWNED
merge A2B.5: CLEAN
did the unowned edit reach main? YES — verify.sh was silently modified
```

**This is the finding.** A clean merge is **not** evidence of ownership
compliance. Procedure step 2 reads "each merge is expected conflict-free —
ownership is disjoint by construction. ANY conflict is a plan defect", which
invites the inverse reading that conflict-freeness indicates correctness. It does
not: a rogue edit only conflicts if a sibling happened to touch the same file.
The **ownership audit is the only defence** against a non-colliding rogue edit,
exactly as `self-audit.md` finding 2 established for combined-diff attribution in
default mode.

### Observations

1. Steps 1–4 of the procedure execute correctly and need no change.
2. Step 2's wording should be tightened: conflict is sufficient evidence of a
   defect, but conflict-freeness is **not** evidence of compliance. The merge is a
   backstop for collisions only.
3. Per-worktree `git diff --name-only main` is a clean, sound ownership-audit
   mechanism in isolation mode — it attributes changes per task with no
   line-level inspection, which is the soundness problem default mode had.
4. Worktrees holding commits are not auto-removed; `git worktree remove --force`
   was required (consistent with A2's finding).

**Verdict:** PASSED — the merge procedure executes as specified, and the BLOCKED
path is reachable and recoverable. Verified mechanically, not agent-driven. One
documented limitation: a clean merge does not imply ownership compliance.

---

## A3 — Orchestrator gate compliance

**Date:** 2026-08-19
**Host:** `claude --version` → `2.1.235 (Claude Code)`
**Scope:** closing the A3 measurement across pilot plans 001, 002 and 003.
**Method:** mechanical re-derivation from `docs/plans/*.md`, not a reading of
`a3-gate-compliance.md`'s own running notes. This matters — the ledger was appended
by the same sessions it measures, so it is a self-report until independently counted.

### Command 1 — declared implementation waves

```sh
grep -hoE "^### Wave [0-9]+\.[0-9R]+" docs/plans/*.md | sort | uniq -c
```

Output, verbatim:

```
   3 ### Wave 1.0
   3 ### Wave 1.1
   3 ### Wave 1.2
   2 ### Wave 1.3
   2 ### Wave 1.4
   1 ### Wave 1.5
   1 ### Wave 1.6
   3 ### Wave 1.R
   1 ### Wave 2.0
   1 ### Wave 2.1
   1 ### Wave 2.2
   1 ### Wave 2.3
   1 ### Wave 2.4
   1 ### Wave 2.5
   1 ### Wave 2.6
   1 ### Wave 2.R
```

Implementation waves = 22. Review waves (`1.R`×3, `2.R`×1) = 4, excluded by design.

### Command 2 — recorded wavecheck verdicts

```sh
grep -hoE "^### Wavecheck [0-9]+\.[0-9]+ — [A-Z]+" docs/plans/*.md | sort | uniq -c
```

Output, verbatim:

```
   3 ### Wavecheck 1.0 — PASS
   3 ### Wavecheck 1.1 — PASS
   3 ### Wavecheck 1.2 — PASS
   2 ### Wavecheck 1.3 — PASS
   2 ### Wavecheck 1.4 — PASS
   1 ### Wavecheck 1.5 — PASS
   1 ### Wavecheck 1.6 — PASS
   1 ### Wavecheck 2.0 — PASS
   1 ### Wavecheck 2.1 — PASS
   1 ### Wavecheck 2.2 — PASS
   1 ### Wavecheck 2.3 — PASS
   1 ### Wavecheck 2.4 — PASS
   1 ### Wavecheck 2.5 — PASS
   1 ### Wavecheck 2.6 — PASS
```

22 reports, all PASS, zero BLOCK. **Wave-for-report match is exact** — the counts
agree per wave id, so no wave opened without a report standing behind the prior one.

### Observations

1. **The falsification condition in the ledger did not fire.** Its stated test is "a
   wave opening while the prior wave has no wavecheck report in its plan." 22 waves,
   22 matching reports, nothing unmatched.
2. **This check cannot see the one real blemish.** Plan 003's wave-1.0 gate was
   performed but not *recorded* until wavecheck 1.1 caught the omission, so the 1.0
   report exists today and the grep counts it as clean. The defect is only visible in
   plan 003 deviation 2 and is timing, not presence — which is itself a limit of the
   mechanical check worth stating: **it proves reports exist, not that they existed
   before the next wave opened.** Recorded compliance is therefore 21 of 22 on the
   stricter reading, 22 of 22 on the grep's.
3. **Unprompted holds where it was tested.** Gates in plan 003 were invoked on bare
   "continue" and "go ahead" instructions naming no gate.
4. **The bias is unchanged and unresolvable here.** Every session counted above knew
   A3 was measured; one said so aloud at a gate. 22/22 is an upper bound, not a rate.
5. **Sample is 3 plans against a 5–10 bar.** Short, and closed short on purpose:
   more plans under the same observed conditions raise the numerator without changing
   what the number means.

### Not tested

A session that has not been told the gate is under observation, on a plan it did not
itself plan. That is the only experiment that converts this row to PASSED.

**Verdict:** PUBLISHED — **not PASSED.** 22 of 22 observed gates invoked, 0 skipped,
21 of 22 recorded before the next wave opened, across 3 plans. Real numbers, published;
an upper bound from self-observed runs, not a compliance rate. Measurement closed.

---

## A5 — Playwright MCP availability and browser-drive round trip

**Date:** 2026-08-20
**Host version:** `claude --version` → `2.1.237 (Claude Code)`
**Parent session model:** Opus 5 (1M context) — `claude-opus-5[1m]`
**Repo SHA at run time:** `29bc6fc`

**Context:** the planning session for [plan 004](plans/004-seatrial-e2e-gate.md)
found no browser tools at all, which is why Phase 2 of that plan was
`BLOCKED(Q1)`. In this session the `playwright` MCP server connected at startup
and advertised 24 `mcp__playwright__browser_*` tools. This entry records the
first observed round trip. Executed inline by the orchestrating session rather
than by `drydock:executor` (deviation 8).

### Target

```
mkdir -p /tmp/dd && ln -sfn "$PWD/site/out" /tmp/dd/drydock
cd /tmp/dd && python3 -m http.server 5173
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5173/drydock/   # → 200
```

### Step 1 — navigate

Spawn parameters: `mcp__playwright__browser_navigate` with
`{"url": "http://127.0.0.1:5173/drydock/"}`.

Raw result, verbatim:

```
### Ran Playwright code
await page.goto('http://127.0.0.1:5173/drydock/');
### Page
- Page URL: http://127.0.0.1:5173/drydock/
- Page Title: Drydock -- plan-first parallel execution for Claude Code
### Snapshot
- [Snapshot](.playwright-mcp/page-2026-08-20T17-19-13-779Z.yml)
```

The returned page title matches the exported `<title>`, so the navigation
reached the served export and not a cached or error page.

### Step 2 — screenshot

Spawn parameters: `mcp__playwright__browser_take_screenshot` with
`{"scale": "css", "filename": "a5-roundtrip.png"}`.

Raw result, verbatim:

```
### Result
- [Screenshot of viewport](./a5-roundtrip.png)
### Ran Playwright code
await page.screenshot({
  path: './a5-roundtrip.png',
  scale: 'css',
  type: 'png'
});
```

Artifact on disk: 89692 bytes, PNG. **Written to the session working directory
(`~/a5-roundtrip.png`), not to the path implied by a relative filename.** Moved
afterwards to `.drydock/testing/004-seatrial-e2e-gate/A5/a5-roundtrip.png`
(gitignored per Decision 8, so the file is evidence for this run and is not
committed).

### Observations

1. The round trip works: navigate returned live page state and screenshot
   produced a non-empty PNG. This is the first observation of A5 in any session.
2. A relative `filename` resolved against the MCP server's own working
   directory, not the evidence root. Any skill that declares an evidence path
   must relocate artifacts after capture, or pass an absolute path — a
   `filename` alone does not place the file. This bears directly on plan 004's
   TG1, whose evidence clause fails when evidence lands outside the declared
   path.
3. Availability is per-session and depends on the MCP server connecting. It was
   absent in the planning session and present here, on the same machine. A5 is
   therefore evidence that the round trip *can* work, not that it is reliably
   present.

### Not tested

Click, form fill, video capture, network-request recording, `browser_evaluate`,
and multi-tab handling. Only navigate and screenshot were exercised. Plan 004's
Testing Gate exercises the rest.

**Verdict:** OBSERVED — one navigate + screenshot round trip succeeded against
the local static export on 2026-08-20. Whether one round trip justifies moving
the A5 row off `PENDING` is a human decision on this evidence, per plan 004 §9.
