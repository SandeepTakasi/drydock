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

### A5 addendum — 2026-08-22

**Date:** 2026-08-22
**Host version:** `claude --version` → `2.1.235 (Claude Code)`
**Node:** `v24.14.1` (also the static server's runtime)
**Repo SHA at run time:** working tree, pre-commit, on top of `8ebf7f2`
**Driver:** Playwright MCP, exposed this session under the plugin-scoped
namespace `mcp__plugin_playwright_playwright__browser_*` — **not** the
`mcp__playwright__browser_*` prefix the 2026-08-20 run recorded. Any check that
greps for a fixed tool prefix is checking the wrong thing.
**Browser:** `navigator.userAgent` →
`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36`
**Target:** `http://127.0.0.1:5173/drydock/`

`python3 is not installed on this machine`, so CLAUDE.md's `python3 -m http.server`
recipe does not run here. Replaced with a ~25-line Node `http` server held in the
session scratchpad (not the repo) that maps `/drydock/*` onto `site/out/*`
directly, which also removes the symlink step. Preflight before any browser call:

```
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5173/drydock/         → 200
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5173/drydock/404.html → 200
```

This run exists to close limb (b) of the 2026-08-20 entry: only navigate and
screenshot had ever been exercised.

### Capabilities exercised

| Capability | Expected | Observed |
|---|---|---|
| `browser_navigate` | reaches the served export | `Page URL: http://127.0.0.1:5173/drydock/`, `Page Title: Drydock -- plan-first parallel execution for Claude Code` — matches the exported `<title>` |
| `browser_snapshot` | accessibility tree, not pixels | full tree at `depth: 4`: one `banner`, one `main`, one `contentinfo`, `heading "Drydock" [level=1]`, and the four in-page nav links `#problem` `#lifecycle` `#evidence` `#install`. The heading contract `assert-copy` checks statically is confirmed live |
| `browser_click` (nav link) | scrolls to the section | before: `{scrollY: 0, hash: ""}`; after clicking `Evidence`: `{scrollY: 3346, hash: "#evidence", evidenceTop: -24}`. Real effect, verified by measurement rather than by the click returning without error |
| `browser_click` (disclosure) | toggles one FAQ item | `details.open` before `[true,false,false,false,false]`, after clicking summary 03: `[true,false,true,false,false]`. Exactly one item changed |
| `browser_evaluate` | reads what only the live DOM knows | `--color-ground` → `#08090b`; `--stroke-rule` → `2px` (confirms live that it is a bare custom property, not a utility); `<h1>` `font-family` → `Inter, "Inter Fallback", system-ui, sans-serif` (the `size-adjust` fallback is present); `document.forms.length` → `0` |
| `browser_network_requests` | records a **real** navigation | after `page.goto('…/drydock/404.html')` — a cross-document navigation, not a fragment change — **10 requests, all `[200] OK`, all under `/drydock/`**: the document, 1 PNG, 1 CSS chunk, 5 JS chunks, 2 self-hosted `.woff2`. No external host is contacted |
| `browser_resize` | layout responds | 390x844 → `h1` `52px`; 1280x800 → `h1` `112px`; `documentElement.scrollWidth > innerWidth` false at both widths |
| `browser_tabs` | list / new / close | `new` opened a second tab and made it current (`0: …/drydock/`, `1: (current) …/404.html`); `close index:1` returned to a single tab, `0: (current)` |
| `browser_console_messages` | surfaces page diagnostics | `Total messages: 0 (Errors: 0, Warnings: 0)` across the whole session, `all: true`, `level: warning` |

### Form fill — not exercisable on this target

`browser_fill_form` was **not** exercised, and not because it failed.
`browser_evaluate` measured the page first:

```
{ forms: 0, inputs: 0, details: 5, buttons: 2 }
```

The homepage is a static marketing export with zero `<form>`, zero
`<input>`/`<textarea>`/`<select>`. There is nothing on this target to fill, so
the capability is **untested here** and no claim is made about it either way.
Filling a fabricated page would evidence the fixture, not the driver.

### Observations

1. **Limb (b) of the 2026-08-20 entry is closed.** Click, `browser_evaluate`,
   network recording, snapshot, resize and multi-tab all returned live state,
   and every effect was confirmed by a second measurement rather than by the
   call not erroring.
2. **A real navigation records requests; the fragment lesson holds.** The
   10-request list came from `goto` to a different document. The earlier finding
   that a fragment-only `goto` records nothing is unchanged — this run avoided
   it rather than disproving it.
3. **The tool namespace moved between sessions.** 2026-08-20 saw
   `mcp__playwright__browser_*`; this session sees
   `mcp__plugin_playwright_playwright__browser_*`. The capability is the same;
   the identifier is not stable across sessions.
4. **Availability is still per-session, and that is environmental.** Present
   here, absent in plan 004's planning session, on the same machine. Nothing in
   this repo can make an MCP server connect. `drydock:seatrial` HALTs with
   install instructions when the driver does not resolve, which is the designed
   response to a driver that is simply not there.
5. **`video` remains uncapturable.** Unchanged and re-confirmed by inspection of
   the exposed tool list: no video, record or trace tool exists. Video is a
   per-`BrowserContext` setting fixed at creation. This produced plan 004's only
   NO-GO and is a permanent ceiling of this driver, not a pending item.
6. **The server working directory is not stable either.** Auto-saved
   snapshots landed in `.playwright-mcp/` **under the repo root** this session;
   the 2026-08-20 run saw a relative filename resolve to the session home
   directory instead. The 2026-08-20 lesson stands and gets sharper: the
   resolution base is unpredictable across sessions, so pass an absolute path.
   The six snapshot files this run produced were deleted afterwards.

### Not tested

Form fill (no form exists on this target — see above); video capture
(uncapturable, above); file upload, drag/drop, dialog handling, `browser_hover`,
`browser_press_key`, `browser_select_option`; authenticated targets; any target
that is not this local static export; and any browser other than the Chromium
build the MCP server launched.

**Verdict:** PASSED for the **browser-drive round trip** — nine capabilities
returned live, verified state against the served export on 2026-08-22. Two things
are deliberately *not* folded into that verdict, because neither is a pending
verification: per-session availability is a property of the environment, and
`video` is a permanent limit of this driver.

---

## A7 — Seatrial Testing Gate, end to end (plan 004, TG1–TG6)

**Row id assigned 2026-08-22.** This entry was headed `Seatrial gate run` and
carried no compatibility id, so the matrix could not cite it and `assert-matrix`
could not check it. The run itself is unchanged — nothing below was re-run to
give it a letter.

**Date:** 2026-08-20
**Host version:** `claude --version` → `2.1.237 (Claude Code)`
**Parent session model:** Opus 5 (1M context) — `claude-opus-5[1m]`
**Repo SHA at run time:** `5a32ac9`
**Driver:** Playwright MCP (`@playwright/mcp`), Chromium headless, desktop viewport
**Target:** `http://127.0.0.1:5173/drydock/` — `site/out` symlinked at the
basePath, served by `python3 -m http.server 5173`

This is the **first execution of the `seatrial` skill in any session**. Deviation
7 established that skills written in a session are stale within it; this session
is the first that could run it, and the run below is what it did.

**Verdict sheet:** `.drydock/testing/004-seatrial-e2e-gate/verdict.md`
(gitignored per Decision 8 — this entry is the tracked record of the run).

### Preflight — all six passed

| Check | Result |
|---|---|
| Gate section exists, `format_version: 2`, status `EXECUTING` | pass |
| Not stale — `git diff 7f934ba..HEAD -- site/` | empty; export built 21:00 vs newest source 19:33 |
| Playwright MCP resolves | 24 `mcp__playwright__browser_*` tools |
| Target answers | `curl -o /dev/null -w %{http_code}` → `200` |
| Evidence root writable | `.drydock/testing/004-seatrial-e2e-gate/` created |
| Auth settled | gate header declares `none`; target is public |

### Results

| Case | Severity | Verdict | Actual |
|---|---|---|---|
| TG1 | blocker | PASS | one `<h1>`, text `Drydock`; one image at the declared path |
| TG2 | blocker | **FAIL — as designed** | `open pilot -- field benchmarks pending` vs expected `CLOSED PILOT` |
| TG3 | blocker | **FAIL `step not executable` — as designed**, plus HALT | `[data-testid="checkout-submit"]` → 0; page has no test ids at all; `checkout` absent from the DOM |
| TG4 | major | **FAIL on the evidence clause** | assertion held (`$/plugin marketplace add …`); no video obtainable |
| TG5 | major | PASS | 13 same-origin requests, all 200; no cross-origin request |
| TG6 | minor | PASS | `naturalWidth` 256, `naturalHeight` 256, `complete: true`, box 26x26 |

**Summary verdict as run: NO-GO** — TG4 is a major FAIL, and seatrial never
writes an override for itself.

**Amended the same day: GO-WITH-OVERRIDES.** Sandeep recorded one override, on
TG4, transcribed into the verdict sheet's Overrides table: the case's assertion
held and only its evidence clause failed, on an evidence type this harness cannot
capture at all, so the failure describes the driver's configuration rather than
the site. The underlying FAIL is unchanged and still stands in the Cases table —
an override records a human's decision to ship past a known gap, not a
re-verdict.

### Observations — what this run proves about seatrial

1. **The three designed-to-fail paths behaved.** TG2 failed against a false
   expectation rather than agreeing with it. TG3 returned the exact reason string
   `step not executable`, clicked no substitute element, and **halted and asked**
   instead of manufacturing a NO-GO. The halt was resolved by the user as
   "synthetic case, continue". This is the first evidence that the skill's
   refusal paths work rather than merely being written down.
2. **A `video` evidence declaration is unreachable through Playwright MCP as
   configured.** Video is a per-`BrowserContext` setting fixed at creation, and
   the server exposes no video, record or trace tool. So TG4's failure is a
   harness capability gap, not a site defect. Any plan declaring `video` evidence
   needs the MCP server launched with video saving enabled, or it will fail this
   clause every time.
3. **A relative screenshot `filename` does not land in the evidence root.** It
   resolves against the MCP server's own working directory (observed under A5).
   An absolute path works, but the parent directory must already exist — the
   first absolute-path attempt failed `ENOENT` until the per-case directories
   were created. Seatrial must `mkdir -p` the case directory before capturing.
4. **`page.goto` to a URL differing only by fragment records no network
   requests.** The `#install` navigation logged nothing, which briefly produced
   an empty TG5 evidence file. A network case needs a real navigation, not a
   hash change.
5. **A locator written from an accessibility snapshot was wrong.** TG2's pill
   read as `generic` in the snapshot; the generated CSS selector
   `header > div > div` matched zero elements because it is a `span`. Caught by
   re-resolving every generated selector against the live DOM. Generating specs
   from the run rather than from the prose is load-bearing, not stylistic.

### Not tested

Click (no case needed one — TG3's click was the unperformable step), form fill
and mutation, video capture, multi-tab, mobile and tablet viewports, non-Chromium
engines, the accessibility tree, the live production origin, and every page other
than `/`. Generated specs in `e2e/` are **GENERATED, NOT EXECUTED** —
`@playwright/test` is absent and no dependency was added.

**Verdict:** OBSERVED — seatrial ran end to end, honoured its three refusal
paths, and returned NO-GO for a stated reason. The NO-GO reflects a harness
capability gap (TG4's video evidence), not a defect in the site.

### A7 addendum — 2026-08-26, second full run

**Date:** 2026-08-26 (16:38Z) · **Host:** 2.1.235 · **Node:** v24.14.1
**Repo SHA at run time:** `05627d1` · **Baseline the cases were written at:** `7f934ba`
**Target:** `http://127.0.0.1:5173/drydock/`, `site/out` served at the basePath by
a Node static server. **Driver:** Playwright MCP, 24 tools registered.

The same six cases, run again by a session that did not write them, against a
target that had moved **12 commits** since the cases were authored. Every verdict
matched the 2026-08-20 run: TG1 PASS, TG2 FAIL, TG3 FAIL `step not executable`,
TG4 FAIL on the evidence clause, TG5 PASS, TG6 PASS, sheet **NO-GO**.

**What the re-run adds, which the first run could not.** The first run measured
seatrial against a target it was written for, in one sitting. This one hit three
refusal conditions the first never reached, and each behaved as the contract
says:

| Condition | Contract | Observed |
|---|---|---|
| Cases stale — 12 commits touched `site/` since baseline | HALT and ask, do not test fixed cases against a moved target | Preflight 2 stopped the run; it proceeded only after a human re-validated the six cases |
| Target unreachable — the static server had died between sessions | HALT, name the URL; **do not start the app** | Preflight 4 stopped with `000` on the declared URL. The server was restarted by the operator *outside* the gate, then preflight re-run |
| Driver lost mid-suite — the Playwright MCP server disconnected after TG3 | HALT, no fallback driver, no partial sheet | Run stopped with three cases verdicted. **No `verdict.md`, no spec files, `git status e2e/` clean.** Two other browser drivers were available in-session and neither was used |

That third row is the one worth keeping. A partial sheet reads to a later human
exactly like a complete one, and a sheet whose evidence came from an undeclared
driver answers a different question than the one the gate asked. Both were
available shortcuts; neither was taken.

**Reproducibility, measured rather than asserted.** Regenerating the spec files
from this run produced them **byte-identical** to the committed ones -- same
locators, same assertions, same measured values (13 same-origin requests all 200,
mark 256x256, pill `open pilot -- field benchmarks pending`, zero test ids).
Only `e2e/README.md` changed, to record the re-run. Specs remain
**GENERATED, NOT EXECUTED**: no runner was installed for either run.

**Unchanged limits.** Video evidence is still uncapturable through this driver,
which is still what produces the NO-GO; one target, one browser, one viewport,
one page; and no override was recorded this time, so the sheet stands at NO-GO
rather than GO-WITH-OVERRIDES.

**Verdict: OBSERVED, twice.** Two independent runs, four days and twelve commits
apart, returning identical verdicts, with the staleness, unreachable-target and
lost-driver refusals all exercised in the second.

## A6 — Ownership enforcement hook (PreToolUse)

**Date:** 2026-08-21
**Host version:** `claude --version` → `2.1.237 (Claude Code)`
**Node:** v24.14.1 (`path.matchesGlob` requires >= 22)
**Repo SHA at run time:** working tree, pre-commit, on top of `05cbe49`

**What this entry does and does not claim.** The hook's *logic* was exercised
directly, by piping PreToolUse-shaped JSON into `hooks/enforce-owns.mjs` and
asserting the exit code. Its *registration* — whether Claude Code actually
invokes it on Write/Edit in a live session — is **NOT** verified here and cannot
be from this session: hooks register at session start on the same terms as skill
files (CLAUDE.md, plan 004 deviation 7), so a hook added by the session that
writes it is not live in that session. Treat live enforcement as unexercised
until a later session denies a real edit.

### Method

`node drydock/hooks/enforce-owns.test.mjs` — ten cases, inputs built with
`JSON.stringify` rather than shell heredocs. That detail is load-bearing: an
earlier heredoc fixture silently dropped the backslash escapes, producing invalid
JSON, which the hook's parse-error path treats as allow. Three cases then *looked*
like they passed enforcement while nothing had been enforced at all. A fixture
that cannot fail proves nothing, and the fix is generating the JSON.

### Result — 10 of 10

| Case | Expect | Got |
|---|---|---|
| relative path inside `owns` | allow | allow |
| relative path outside `owns` | **deny** | deny |
| absolute native (`\`) path outside `owns` | **deny** | deny |
| absolute POSIX (`/`) path outside `owns` | **deny** | deny |
| absolute native path inside `owns` | allow | allow |
| glob subtree (`e2e/**`) | allow | allow |
| path outside the project directory | allow | allow |
| `notebook_path` instead of `file_path` | **deny** | deny |
| config file absent | allow (inert) | allow |
| config present but unparseable | **deny** (fail closed) | deny |

Denial payload, verbatim, for the relative-unowned case:

```
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny"},
 "systemMessage":"Drydock ownership violation: 005-x wave 2.1 does not own site/content/copy.ts.\n
 Owned by this wave: docs/**, e2e/**\n…Stale? delete .drydock/wave-owns.json"}
```

### Observations

1. **Both Windows path separators had to be handled explicitly.** The tool hands
   back native paths; plan `owns` globs are always written with forward slashes.
   Normalising to a repo-relative POSIX path before `matchesGlob` is what makes
   the two comparable, and the failure mode without it is allow — the dangerous
   direction.
2. **Absent config must be inert, and that is not a convenience.** The plugin
   installs into repos that are not mid-wave; a hook that denied by default would
   break every unrelated edit in every repo that installed it.
3. **Present-but-broken config fails closed.** A malformed enforcement control
   that degrades into no enforcement is worse than no control, because it reads
   as protection. The denial message names the remedy so a stale file cannot
   wedge a repo silently.
4. **A4 re-run with `hooks/hooks.json` present:**
   `claude plugin validate ./drydock --strict` → `✔ Validation passed`, exit 0.

### Not tested

Live registration and invocation by the host (see above); enforcement against
Bash-mediated writes (`sed -i`, `>` redirect, `git checkout`), which do not pass
through file-tool hooks at all and are a documented ceiling rather than a gap;
worktree-isolated sessions; and any host without `PreToolUse` support.

**Verdict:** LOGIC VERIFIED, LIVE ENFORCEMENT UNEXERCISED. The script does what
the contract says on ten cases including both separator styles and both failure
postures. Whether the host calls it is the next session's evidence.

### A6 addendum — 2026-08-22, v0.7.0

**Repo SHA at run time:** working tree, pre-commit, on top of `1e0b8a6`

0.6.0's hook could silently not run, and nothing would have said so. Three
mechanisms shipped in 0.7.0 to make that detectable; each was exercised.

**1. The boundary is derived, not typed.** `wave-start` against plan 004 wave 2.1
emitted exactly the union of `T2.1.1` and `T2.1.2`'s `owns`
(`docs/verification-log.md`, `e2e/**`) and nothing wider. A boundary generated
from the plan cannot exceed the plan, which retires the hand-authored
`{"owns":["**"]}` case rather than checking for it.

**2. The receipt, proven in all three directions.** Against a copy of plan 004
carrying `format_version: 3` / `enforcement: required`:

| Condition | Expected | Observed |
|---|---|---|
| No enforcement log | BLOCK | `FAIL (1)` — "this wave ran with ownership enforcement INACTIVE", naming the four possible causes including the innocent one |
| Two decisions driven through the hook | clear | `PASS` — note: "enforcement active: 2 hook decision(s) recorded for wave 2.1 (0 denied)" |
| Config widened to `["**"]` by hand after arming | mismatch caught | `FAIL (1)` — "Plan: [docs/verification-log.md, e2e/\*\*]. Enforced: [\*\*, docs/verification-log.md, e2e/\*\*]" |

The log is written on allow as well as deny. An allow is the evidence the hook
was alive for that write, and without it the audit could only establish that a
config file existed — which a hook that never executed also satisfies.

**3. Old Node fails open, loudly, and is now visible.** Exercised by blanking
`path.matchesGlob` through a CJS preload: exit 0, and
`Drydock: ownership enforcement is INACTIVE — Node <version> does not provide
path.matchesGlob (added in v22)` on stderr. It writes no receipt, so check 2
reports the wave as unenforced instead of the failure passing unnoticed. The
import was changed from named to default because a named import fails at parse
time — no guard could run, which is why the 0.6.0 behaviour shipped undetected.

Backward compatibility confirmed: plans 001–004 carry no `enforcement:` key,
default to `none`, and produce byte-identical verdicts to before the check
existed. `audit-wave 2.0` still reports the `5a32ac9` ownership breach.

Self-check now 12 cases, all passing.

**Verdict: unchanged — LOGIC VERIFIED, LIVE ENFORCEMENT UNEXERCISED.** Nothing
here observes the host invoking the hook; every case above drives it directly.
What changed is that a wave which runs unenforced now says so in its audit
instead of passing quietly. A6 moves when a session that did not write this code
watches a real edit get denied.

### A6 addendum — 2026-08-22, live registration OBSERVED

**Date:** 2026-08-22
**Host version:** `claude --version` → `2.1.235 (Claude Code)`
**Node:** v24.14.1
**Repo SHA at run time:** `d7de845`, working tree clean
**Plugin copy that ran:** `~/.claude/plugins/cache/drydock/drydock/0.7.0`,
`gitCommitSha d7de845` — byte-identical to `drydock/hooks/enforce-owns.mjs`
modulo CRLF. Worth stating: the hook the host executes is the installed cache
copy, not the working tree, so editing the repo file mid-session changes nothing.

**This is the evidence the two entries above said was missing.** The session that
ran it did not write the hook, the audit tool or either of the earlier entries;
it read the repo, armed a wave and tried to write outside it. Every decision
below was made by the host invoking the hook, not by piping JSON into it.

### Method

`node drydock/scripts/drydock-audit.mjs wave-start docs/plans/004-seatrial-e2e-gate.md 2.1`
armed the boundary — `owns: docs/verification-log.md, e2e/**`, derived from
`T2.1.1` and `T2.1.2`. Probes were then issued as ordinary tool calls. Each
verdict is confirmed twice: by what the host returned, and by the state of the
file on disk afterwards.

### Result — 7 of 7

| # | Probe | Expect | Observed |
|---|---|---|---|
| 1 | `Write` to unowned `site/a6-probe.txt` | deny | `PreToolUse:Write hook error` carrying the hook's verbatim deny payload; **file not created** |
| 2 | `Write` to owned `e2e/a6-allow-probe.txt` | allow | created; receipt `allow` |
| 3 | `Edit` of that owned file | allow | applied; second receipt `allow` |
| 4 | `Edit` of unowned `site/a6-probe.txt`, `old_string` a real match | **deny** | `PreToolUse:Edit hook error`, deny payload; **content unchanged** (`A6 probe line`) |
| 5 | `Write` outside the project dir (session scratchpad) | allow, no receipt | created; no log line — the `../` early-out precedes `record()` |
| 6 | `printf > site/a6-probe.txt` via Bash | allow, no receipt | wrote; no log line — the documented ceiling, now observed rather than reasoned |
| 7 | Same `Write` as probe 1 after `rm .drydock/wave-owns.json` | inert allow | created; no fifth receipt |

`.drydock/enforcement.log` ended with exactly 4 lines — 2 `deny`, 2 `allow` —
one per hook-mediated in-repo decision, and none for probes 5, 6 or 7.

### Observations

1. **A failing `Edit` precondition short-circuits before the hook.** An `Edit`
   whose `old_string` did not match an unowned file returned the ordinary
   "String to replace not found" tool error and wrote **no receipt** — the hook
   never ran. No enforcement hole (no write happens either way), but the receipt
   log counts *attempted writes the host would have performed*, not every tool
   call aimed at a file. Probe 4 exists because of this: the first attempt at a
   deny-on-`Edit` case proved nothing, and a matching `old_string` was needed to
   put a real write in front of the hook.
2. **The deny payload reaches the caller intact**, including the remedy line.
   The host surfaces it as a tool error, so the writer sees which wave, which
   path, and what the owned set is, without reading the plan.
3. **Disarming is immediate and needs no restart.** Probe 7 is the same write as
   probe 1, denied then allowed, minutes apart in one session. The *config* is
   read per invocation even though the *registration* is fixed at session start.

### Not tested

`NotebookEdit` (this repo has no notebooks — the matcher covers it and the logic
case passes, but no live notebook write has been denied); worktree-isolated
sessions; hosts without `PreToolUse` support; concurrent executors racing on the
append.

**Verdict: PASSED — the host invokes the hook, and a real edit was denied.**
Both ceilings stand and are unchanged: Bash-mediated writes bypass file-tool
hooks entirely, and paths outside the project directory are not enforced. Both
were exercised here (probes 5 and 6) rather than assumed.

**Copy gate moved with the row.** `assert-copy.mjs` required
`"LOGIC VERIFIED, LIVE ENFORCEMENT UNEXERCISED"` and `"has not been observed
once"`; both would now force the page to understate its own evidence, so they
were replaced by `"outside the project directory are not enforced"` — pinning
what is still *not* true, alongside the Bash-ceiling literal that was already
required. Proven failable the same day: rewriting that phrase in the export to
"fully enforced everywhere" fails the gate naming the missing literal, and
`npm run verify` is green with the export restored.
