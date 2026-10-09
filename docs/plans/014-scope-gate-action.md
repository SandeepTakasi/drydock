---
plan: 014-scope-gate-action
format_version: 3
status: RECONCILED
isolation: none
enforcement: required
attribution: manifest
lane: small
execution: fleet
created: 2026-10-09
approved_by: Sandeep Takasi
---

# 014 - Scope gate: a PR is audited against the scope its issue declared first

**Plan location:** `docs/plans/`, committed with the repo.

> **Execution protocol.** Spawn each task in the current wave as its declared
> executor agent (`drydock:executor`, or `drydock:executor-isolated` when the
> header says `isolation: worktree`) with its declared model and thinking
> budget, passing ONLY the task's context brief. Before starting any wave, run
> the staleness check below. Wait for all tasks in the wave, then invoke the
> `drydock:wavecheck` skill with this plan path and the wave id. Do not begin
> the wave's quality-review task, or the next wave, until wavecheck reports
> PASS. On BLOCK, set status BLOCKED and stop, do not self-repair; the paths
> out are `/drydock:replan` or a human decision. Quality-review rejections
> follow the escalation policy (max 2 retries → tier up → human); wavecheck
> BLOCKs on ownership violations or unlogged deviations get NO retries. When
> the final wave and phase gate pass, invoke `drydock:reconcile`.
>
> **If you cannot spawn executors**, a standing instruction against unprompted
> agents, agents unavailable, that is a deviation to log **before the wave
> opens**, not after it closes, and it does not become permission to skip the
> wave gate. Two obligations survive intact: stage **only** the task's owned
> files in its checkpoint commit (a spawned executor gets this for free; by hand
> it is the first thing to slip), and tell wavecheck the diff is self-authored,
> because its forbidden audit is weakened when the auditor wrote the code and it
> must say so rather than imply independence it does not have.

**Ownership enforcement:** `wave-start docs/plans/014-scope-gate-action.md 1.1`
before the wave, `audit-wave` after, then `rm .drydock/wave-owns.json`. Spawn
executors one at a time; each commits only its owned files, then `task-close`.
Close the wave before writing this file, and commit it before any later
`wave-start` (CLAUDE.md). Paste `audit-wave`'s per-task rows and its
`enforcement active: ...` sentence verbatim into the report, never its
`### audit-wave` heading line (plan 012 deviation 10).

**Staleness check:** `git diff <baseline SHA>..HEAD -- scope-gate .github/workflows drydock/scripts/drydock-audit.mjs docs/compatibility.md`.

## 1. Requirement

A GitHub Action, usable from any repo, that fails a pull request whose diff
leaves the scope declared in the issue it closes. The scope is the `check`
intent format (`- **Files owned:**` globs, optional `- **Forbidden:**`,
`- **Acceptance criterion:**` commands) written in the issue body before the
work. The gate refuses, failing closed, when the PR links no issue or more than
one, when the issue's author is not OWNER, MEMBER or COLLABORATOR, or when the
issue was created after the PR. Otherwise it audits the PR's diff from its base
SHA with `drydock-audit.mjs check`, runs the criteria, and fails naming every
out-of-scope file (as a file annotation) and every failing criterion. It is
dogfooded on this repo through a local-path workflow. No release is cut (D1).

## 2. Spec reference

None, the requirement is complete. The intent format is `drydock/skills/check/SKILL.md`
Step 2; its parser is `readIntent` in `drydock/scripts/drydock-audit.mjs`.

## 3. Surgical-scope statement

A thin wrapper: read the event, fetch the issue, refuse untrusted scope, write
an intent file with `base:` set to the PR's base SHA, and hand it to the
existing `check`. Zero changes to `drydock-audit.mjs`, zero dependencies.

## 4. Baseline

_Filled by T0, 2026-10-09._ Installed plugin 0.18.0, repo 0.18.0; `validate-plan` PASS, no VERSION DRIFT.

| Item | Value |
|---|---|
| Commit SHA | `c308f72` |
| `node drydock/scripts/drydock-audit.test.mjs` | 161/161 passed |
| `node site/scripts/assert-matrix.mjs` (after T0's README row) | PASS, 13 matrix rows, 5 A3 ledger plans, 1 logged gate skip accounted for |
| `prove-failable` on this plan | PASS, 4 of 4 criteria fail at baseline (T0, T1.1.1, T1.1.2, T1.1.3 each exit 1) |

## 5. Practices in effect

| Practice | Value | Source |
|---|---|---|
| Tests | standalone Node scripts, no framework, each listed in `verify.yml`'s OS x Node matrix | `verify.yml` lines 58-62 |
| TDD | the failing test and its code are one task; the executor watches it fail first | planwright |
| Dependencies | none; Node built-ins only (`fetch`, `node:http` in tests) | repo convention |
| Honesty | no claim of a live gate until A13 has evidence | CLAUDE.md "Honesty rule" |
| Criteria | run through `cmd.exe` here: no backslashes | CLAUDE.md |
| Execution | fleet, executors one at a time | user, D4 |

## 6. Findings & constraints

- `check` (`drydock-audit.mjs` `check()`, ~line 2179) already does the audit:
  it diffs `base` to the working tree plus untracked files, matches owned and
  forbidden globs, then runs each criterion with `spawnSync(cmd, {shell: true})`
  in the repo root, printing `FLAG outside scope: <f>`, `FLAG forbidden: <f>`,
  `FLAG criterion exited <n>: <cmd>`, and `check: PASS (...)` exit 0 or
  `check: FLAG (n)` exit 1. It exits 3 when `base` does not resolve or no
  owned globs were given. The changed set is computed **before** criteria run,
  so files a criterion builds are never flagged.
- `readIntent` reads `base:` only from the frontmatter (up to the second
  `---`), and reads every `- **Field:**` bullet anywhere after it. So an intent
  file is `---`, `base: <sha>`, `---`, then the issue body verbatim.
- `drydock-audit.mjs` runs its CLI at import, so the gate spawns it rather than
  importing it.
- On `pull_request`, `actions/checkout` checks out the merge commit; with
  `fetch-depth: 0` the base SHA is present, and `base.sha..merge` is the PR's
  change.
- `GITHUB_API_URL` is a standard runner variable (it differs on GHES), which
  lets the test point the gate at a local `node:http` server with no test-only
  code path.
- Learnings: CLAUDE.md:195 (compatibility.md is the source of truth, so A13
  starts PENDING); the `cmd.exe` criteria rule. No Deviation Log row names
  these files.

## 7. Decision Log

| # | Question | Decision | Decided by | Rationale |
|---|---|---|---|---|
| 1 | Release in this plan? | No. Dogfood via `uses: ./scope-gate`; tag 0.19.0 only after the live proof | user | Same rule as plan 013: no shipped claim before a live run |
| 2 | Whose scope is trusted? | Issue `author_association` in OWNER, MEMBER, COLLABORATOR; anything else fails closed | user | A stranger's issue on a public repo must not inject acceptance commands into CI |
| 3 | "Declared before the work" in v1? | Fail if the issue's `created_at` is after the PR's `created_at`. Body edits after the PR opened are NOT detected (needs GraphQL edit history), stated as a ceiling | user | Smallest check that holds for the honest case |
| 4 | Fleet or solo? | Fleet, one at a time | user | Auditor did not write the diff |
| 5 | Which issue is linked? | PR body closing keywords (`close`/`closes`/`closed`, `fix`/`fixes`/`fixed`, `resolve`/`resolves`/`resolved`, case-insensitive, then `#<n>`). Zero distinct numbers, or more than one, fails closed. A linked number that is itself a PR (the API returns `pull_request`) fails closed | planner (assumed, flag if wrong) | Regex over the body needs no GraphQL; ambiguity is refused rather than guessed |
| 6 | Where does the Action live? | `scope-gate/` at the repo root (`action.yml`, `gate.mjs`, `gate.test.mjs`, `README.md`), spawning `../drydock/scripts/drydock-audit.mjs`; used as `SandeepTakasi/drydock/scope-gate@<ref>` | planner | Marketplace listing is impossible for a repo with workflows anyway; a subdirectory action needs no repo split |
| 7 | Action type? | Composite, one `node` step; the workflow supplies Node (`actions/setup-node`) | planner | No bundling, no `dist/`, zero dependencies |
| 8 | Event and permissions | `pull_request` only (types opened, edited, synchronize, reopened), never `pull_request_target`; `permissions: contents: read, issues: read, pull-requests: read` | planner | Criteria run code from the repo; a fork PR must not get secrets or a write token |
| 9 | PR with no linked issue | Fails closed. A repo that wants opt-in scopes the workflow with its own `if:` | planner (assumed, flag if wrong) | The point is that unscoped work cannot pass |

## 8. Open questions

None.

## 9. Out of scope / follow-ups

- Release 0.19.0 and a tag, after A13 has a live PASS (D1).
- Detecting issue-body edits after the PR opened (GraphQL `userContentEdits`) (D3).
- Re-running the gate when the issue changes (issues do not trigger `pull_request`).
- A site mention, once A13 is evidenced.

## 10. Execution policies

- **Per task:** the criterion exits 0, re-run by wavecheck through `spawnSync(..., {shell: true})`.
- **Per wave:** `drydock:wavecheck` 1.1 is the only gate (small lane: no review wave, no pressure test).
- **Escalation:** ownership or unlogged-deviation BLOCKs get no retries.
- **Checkpointing:** one commit per task, owned files only, then `task-close`.
- **Human gate:** the live dogfood run below, by a named human, before any release.
- **Tracker:** none.

## 11. Testing Gate

N/A, there is no browser-drivable surface: the gate's output is a GitHub check
run and annotations on a pull request, which Playwright MCP does not drive. The
logic is covered by `gate.test.mjs` against a local HTTP stand-in for the API and
throwaway git repos, and the live surface is exercised by a human at the phase
gate on two real pull requests.

## 12. Pressure-test verdict

N/A, `lane: small` has no pressure test. `prove-failable` stands in for its
criterion half and is recorded in the Baseline.

## Phase 1: The gate

**Exit state:** `scope-gate/` exists, its test passes in the CI matrix, the
dogfood workflow is committed, and A13 sits in `compatibility.md` as PENDING.

**Phase gate: CLOSED, approved by Sandeep Takasi - 2026-10-09.** Criteria were wavecheck 1.1 PASS, then a scoped issue and two PRs that close it, one inside the scope (gate passes) and one touching an unowned file (gate fails naming it), with both run URLs recorded in the Progress log. Met by issue #25, PR #26 (pass) and PR #27 (fail naming `stray-probe.txt`); opened through `gh` under that account with approval, see deviation 4.

#### T0 - Baseline and plan index row
- **Description:** Record the SHA and gate results in Baseline, add this plan's row to `docs/plans/README.md`, run `prove-failable` on this plan and record it. Stop if any criterion already exits 0.
- **Files owned:** `docs/plans/README.md` (and this plan's Baseline, before any wave is armed)
- **Depends on:** none
- **Model / thinking:** Mechanical / off   **Executor:** orchestrator, inline
- **Context brief:** section 4; `docs/plans/README.md`; CLAUDE.md "Executing a plan here".
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');const r=c.spawnSync('node',['drydock/scripts/drydock-audit.mjs','validate-plan','docs/plans/014-scope-gate-action.md'],{encoding:'utf8'});const t=fs.readFileSync('docs/plans/014-scope-gate-action.md','utf8');process.exit(r.status===0&&/Commit SHA [|] .?[0-9a-f]{7,40}/.test(t)&&fs.readFileSync('docs/plans/README.md','utf8').includes('014-scope-gate-action')?0:1)"`

### Wave 1.1 - The gate, its wiring, its docs

#### T1.1.1 - gate.mjs and its test
- **Description:** Write `scope-gate/gate.mjs` and `scope-gate/gate.test.mjs` together, test first: watch each case fail before the code makes it pass. The gate reads the event, refuses per D2, D3, D5, writes the intent file and runs `check`.
- **Files owned:** `scope-gate/gate.mjs`, `scope-gate/gate.test.mjs`
- **Depends on:** T0
- **Model / thinking:** Complex / extended (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** sections 1, 3 and 6; D2, D3, D5, D6, D8, D9; `drydock/scripts/drydock-audit.mjs` `readIntent`, `repoAndBase`, `check` (lines ~2105-2215) and its CLI dispatch; `drydock/scripts/drydock-audit.test.mjs` lines 1-60 (harness style: throwaway repos under `tmpdir()`, `spawnSync` the CLI); CLAUDE.md "On Windows, directory junctions" (no symlinks in tests).
- **Implementation sketch:**
  - Exports (pure): `linkedIssue(body) -> number` (throws `no linked issue` or `links N issues`); `trusted(assoc) -> boolean`; `intentFrom(issueBody, baseSha) -> string` (`---\nbase: <sha>\n---\n<body>\n`); `refusals({ pr, issue }) -> string[]` (untrusted author, issue created after the PR, linked number is a PR).
  - `main()` runs only when the file is the entry point (`process.argv[1]` resolves to it). It reads `GITHUB_EVENT_PATH`, and with no `pull_request` it exits 2. It fetches `${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/issues/<n>` with `Authorization: Bearer ${GITHUB_TOKEN}`; a non-200 is a refusal. Each refusal prints `::error::scope-gate: <reason>` and the process exits 1. Otherwise it writes the intent to `${RUNNER_TEMP}/scope-gate-intent.md` (outside the workspace) and spawns `node <dir>/../drydock/scripts/drydock-audit.mjs check <intent>` with `cwd: GITHUB_WORKSPACE`, capturing stdout. It echoes every line, adds `::error file=<f>::outside the scope declared in #<n>` for each `FLAG outside scope: <f>` and `FLAG forbidden: <f>`, and exits with check's status (3 stays 3).
  - Invariants: the token is never printed, and nothing is written inside the workspace.
- **Test cases (all required):** linkedIssue on `Closes #12`, `fixes #3`, `RESOLVED #4`, the same number twice, none (throws), two different numbers (throws); trusted for each of the three roles, plus `CONTRIBUTOR` and `NONE` false. End to end, each with a `node:http` server as `GITHUB_API_URL` and a throwaway git repo as `GITHUB_WORKSPACE`:
  - in-scope change → exit 0
  - an unowned file changed → exit 1 with the `::error file=` line naming it
  - a failing criterion → exit 1
  - untrusted author → exit 1 naming the reason
  - issue newer than the PR → exit 1
  - linked number is a PR → exit 1
  - no linked issue → exit 1

  The last line printed is exactly `PASS, <n> cases` (exit 0) or `FAIL, <k> of <n> cases` (exit 1).
- **Forbidden:** editing `drydock-audit.mjs` or any file outside `owns`; any dependency or `package.json`; printing the token; network access other than `GITHUB_API_URL`.
- **Acceptance criterion:** `node -e "const r=require('child_process').spawnSync('node',['scope-gate/gate.test.mjs'],{encoding:'utf8'});const m=/PASS, ([0-9]+) cases/.exec(r.stdout||'');process.exit(r.status===0&&m&&Number(m[1])>=14?0:1)"`

#### T1.1.2 - The action, the dogfood workflow, the CI test line
- **Description:** Write the composite `scope-gate/action.yml` running `gate.mjs` (D7), the dogfood workflow `.github/workflows/scope-gate.yml` (D8), and add `node scope-gate/gate.test.mjs` to `verify.yml`'s test steps.
- **Files owned:** `scope-gate/action.yml`, `.github/workflows/scope-gate.yml`, `.github/workflows/verify.yml`
- **Depends on:** T0
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D6, D7, D8, D9; section 6 (checkout and base SHA); `.github/workflows/verify.yml` (permissions block, test steps at lines 58-62, `actions/setup-node` usage). The gate's contract: `node gate.mjs` with env `GITHUB_TOKEN` and the runner's standard variables.
- **Implementation sketch:** `action.yml` takes input `github-token` (default `${{ github.token }}`) and has one step, `shell: bash`, `run: node "${{ github.action_path }}/gate.mjs"`, with `env: GITHUB_TOKEN: ${{ inputs.github-token }}`. The workflow runs on `pull_request` (types opened, edited, synchronize, reopened) with the D8 permissions block. Its steps are `actions/checkout@v4` with `fetch-depth: 0`, `actions/setup-node@v4` with Node 22, then `uses: ./scope-gate`. `verify.yml` gains exactly one `run:` line beside the other test lines.
- **Forbidden:** `pull_request_target`; any `write` permission; secrets other than `github.token`; changing any other line of `verify.yml`.
- **Acceptance criterion:** `node -e "const fs=require('fs');const a=fs.readFileSync('scope-gate/action.yml','utf8'),w=fs.readFileSync('.github/workflows/scope-gate.yml','utf8'),v=fs.readFileSync('.github/workflows/verify.yml','utf8');process.exit(/using: .?composite/.test(a)&&a.includes('github.action_path')&&a.includes('gate.mjs')&&w.includes('pull_request:')&&!w.includes('pull_request_target')&&!/: write/.test(w)&&w.includes('contents: read')&&w.includes('issues: read')&&w.includes('fetch-depth: 0')&&w.includes('uses: ./scope-gate')&&v.includes('node scope-gate/gate.test.mjs')?0:1)"`

#### T1.1.3 - Usage docs and the PENDING evidence row
- **Description:** Write `scope-gate/README.md`: the issue format with a copyable example, the workflow snippet, the trust and timing rules (D2, D3, D5, D9), why `pull_request` and never `pull_request_target` (D8), and the ceilings. Add row A13 to `docs/compatibility.md` as PENDING.
- **Files owned:** `scope-gate/README.md`, `docs/compatibility.md`
- **Depends on:** T0
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** sections 1 and 6; D2, D3, D5, D8, D9; `drydock/skills/check/SKILL.md` Step 2 (the intent format; write the same fields); `docs/compatibility.md` row shape; CLAUDE.md "Honesty rule for site copy". The ceilings to state:
  - edits to the issue after the PR opened are not detected
  - issue edits do not re-run the gate
  - scope is file-level, so drift inside an owned file passes
  - criteria run repository code in CI
  - a trusted insider can still scope their own work
- **Forbidden:** any claim that the gate has run live (A13 is PENDING); a dated entry for A13 in `verification-log.md`; editing any other row.
- **Acceptance criterion:** `node -e "const fs=require('fs'),c=require('child_process');const r=fs.readFileSync('scope-gate/README.md','utf8'),m=fs.readFileSync('docs/compatibility.md','utf8');const row=m.split(String.fromCharCode(10)).find(l=>l.startsWith('| A13 |'))||'';process.exit(r.includes('- **Files owned:**')&&r.includes('- **Acceptance criterion:**')&&r.includes('COLLABORATOR')&&r.includes('pull_request_target')&&/ceiling/i.test(r)&&row.includes('| PENDING |')&&c.spawnSync('node',['site/scripts/assert-matrix.mjs'],{stdio:'ignore'}).status===0?0:1)"`

## Deviation Log

| # | Task | What deviated | Why | Impact | Recorded |
|---|---|---|---|---|---|
| 1 | T1.1.2 | The dogfood workflow pins `actions/checkout@v5` and `actions/setup-node@v5`, not the sketch's `@v4` | Matches the pins `verify.yml` already uses | None; criterion does not name a version | executor report, 2026-10-09 |
| 2 | T1.1.3 | The A13 row was inserted with a `node` one-liner through Bash, not the Edit tool | Executor reached for a script after finding Python absent | No PREVENTION receipt for `docs/compatibility.md`; the Bash layer saw the command and found nothing outside `owns`; the commit diff is the one row | executor report, 2026-10-09 |
| 3 | T1.1.3 | `scope-gate/README.md` also has no file-tool receipt: the hook log for wave 1.1 holds `allow` entries for T1.1.1 (2) and T1.1.2 (3) only, so both of T1.1.3's files landed through Bash, while the executor reported only the row | Unreported in the executor's hand-back | Same as 2: ownership proven by the commit, not prevented by the hook. Bash writes were inside `owns`, so nothing was at risk; the report understated it | discovered-by-wavecheck, 2026-10-09 |
| 4 | Phase gate | The issue and both PRs were opened by the orchestrating session through `gh`, logged in as SandeepTakasi, not by the human in the web UI. The PRs target a pushed `plan-014` branch, not `main` | Sandeep Takasi handed over `gh` and approved the exact steps in chat. `plan-014` was needed because a PR into `main` would include all of plan 014's files in its diff, and a `pull_request` run uses the workflow from the merge commit | The trust check is unaffected: the issue is authored by the OWNER account. The human half of the gate is "authorised by Sandeep Takasi, performed by Claude", not "opened by a human" | orchestrator, 2026-10-09 |

## Wavecheck reports

### Wavecheck 1.1 - PASS - 2026-10-09

Fleet execution: all three tasks were written by spawned `drydock:executor`
agents (Sonnet 5.5), one at a time; the auditor (orchestrating session, Opus
5.5) wrote none of the diff. Installed plugin 0.18.0, repo 0.18.0, no VERSION
DRIFT.

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.1.1 | `31cf598` | `scope-gate/gate.mjs`<br>`scope-gate/gate.test.mjs` | `scope-gate/gate.mjs`<br>`scope-gate/gate.test.mjs` | none |
| T1.1.2 | `8880173` | `.github/workflows/scope-gate.yml`<br>`.github/workflows/verify.yml`<br>`scope-gate/action.yml` | `scope-gate/action.yml`<br>`.github/workflows/scope-gate.yml`<br>`.github/workflows/verify.yml` | none |
| T1.1.3 | `e9043c3` | `docs/compatibility.md`<br>`scope-gate/README.md` | `scope-gate/README.md`<br>`docs/compatibility.md` | none |

  note: enforcement active: 5 hook decision(s) recorded for wave 1.1 (0 denied)

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `format_version: 3`, status `EXECUTING` (set by T0 in `86792a7`), wave 1.1 is the plan's only wave, `execution: fleet` |
| 2. Ownership | PASS | `audit-wave 1.1: PASS` (3 tasks, 3 commits, `attribution: manifest`), table above; working tree clean. Enforcement ran: 5 file-tool `allow` receipts (T1.1.1: 2, T1.1.2: 3) and 16 Bash commands observed, 0 writes detected outside `owns`. T1.1.3 has no file-tool receipt because both its files went through Bash (deviations 2, 3), the one innocent cause; its ownership is proven by its commit |
| 3. Forbidden | PASS | `git diff --stat c308f72..HEAD` over `drydock/scripts/drydock-audit.mjs`, `docs/verification-log.md`, `package.json` is empty. `gate.mjs`: the token appears only in the `Authorization` header (line 61); every `console` call prints a refusal reason, a check output line or an annotation; the only `fetch` is to `GITHUB_API_URL`; the test asserts the token string is absent from every e2e case's output. `scope-gate.yml` and `action.yml` contain no `pull_request_target`, no `write`, no `secrets`. `verify.yml` diff is one added line. `compatibility.md` diff is one added line (0 removed); A13 is `PENDING` and says "Not run live"; the README says "not yet run live" and names no tag |
| 4. Acceptance | PASS | Every criterion run through `spawnSync(cmd, {shell: true})` (cmd.exe): T0 exit 0, T1.1.1 exit 0 (`PASS, 18 cases`), T1.1.2 exit 0, T1.1.3 exit 0. Test-first is consistent with the receipts: `gate.test.mjs` allowed at 03:13:53Z, `gate.mjs` at 03:14:10Z; the executor reports `FAIL, 18 of 18 cases` before `gate.mjs` existed |
| 5. Deviations | PASS | 2 executor-reported deviations logged (1, 2); 1 discovered (3) |

Observations, not deviations: `action.yml`'s input description says the token
reads "the linked issue and PR files", but the gate reads only the issue; the
non-`pull_request` exit 2 path has no test case; the suite has run on Windows
only, so ubuntu is first proven by CI.

Deviations logged: 3 (1 discovered by wavecheck)

## Progress log

| Date | Task | Result | Notes |
|---|---|---|---|
| 2026-10-09 | T0 | DONE `86792a7` | Baseline filled, README row, status EXECUTING; prove-failable 4 of 4 |
| 2026-10-09 | T1.1.1 | DONE `31cf598` | 18 cases, test written and seen failing first |
| 2026-10-09 | T1.1.2 | DONE `8880173` | Deviation 1 |
| 2026-10-09 | T1.1.3 | DONE `e9043c3` | Deviations 2, 3 |
| 2026-10-09 | Wave 1.1 | PASS | audit-wave PASS, wavecheck PASS; phase gate open, awaiting the live run |
| 2026-10-09 | Phase gate, in scope | PASS | Issue [#25](https://github.com/SandeepTakasi/drydock/issues/25) (owns `scope-gate-probe/**`, criterion `node scope-gate/gate.test.mjs`); PR [#26](https://github.com/SandeepTakasi/drydock/pull/26) into `plan-014` adds `scope-gate-probe/in-scope.txt`. Run <https://github.com/SandeepTakasi/drydock/actions/runs/37884210279>: success, log `check: PASS (1 file(s), 1 criteria)`, so the gate's own suite also passed on ubuntu |
| 2026-10-09 | Phase gate, unowned file | FAIL as intended | PR [#27](https://github.com/SandeepTakasi/drydock/pull/27) into `plan-014` adds `stray-probe.txt`. Run <https://github.com/SandeepTakasi/drydock/actions/runs/37884214325>: failure, log `FLAG outside scope: stray-probe.txt`, `check: FLAG (1)`, annotation `stray-probe.txt: outside the scope declared in #25` |
| 2026-10-09 | Phase gate | CLOSED | Approved by Sandeep Takasi; status DONE. A13 stays PENDING by instruction; no release or tag (D1) |

## Reconcile report

Reconciled 2026-10-09 at `1bb9248`. Gate signed (Sandeep Takasi, 2026-10-09);
Testing Gate N/A; Verify run 37884446602 on `1bb9248`: 9 of 9 jobs green,
including `node scope-gate/gate.test.mjs` on ubuntu and windows x Node 20/22/24.

### Deviation synthesis

| Cluster | Deviations | Output |
|---|---|---|
| (a) assumption false | 4 (the gate's probe PRs could not target `main`; `gh` was assumed unusable) | R2, R3 |
| (b) instructions ambiguous | 1 (sketch pinned `@v4` against the repo's `@v5`) | planwright feedback |
| (d) executor overreach | 2, 3 (owned files written through Bash; one of the two unreported) | executor feedback |

### Assumption postmortem

| Id | Verdict | Evidence |
|---|---|---|
| D1 | held | No release or tag cut; A13 PENDING |
| D2 | held for the trusted path; untrusted path never-exercised live | #25 is OWNER-authored and passed; CONTRIBUTOR/NONE refusals proven only in `gate.test.mjs` |
| D3 | held; the ceiling never-exercised | #25 created before #26/#27; no body edit was attempted |
| D4 | held | Three executors, one at a time; auditor wrote none of the diff |
| D5 | held | `Closes #25` resolved live; zero/many/PR-number refusals proven only in tests |
| D6 | held locally; remote form never-exercised | `uses: ./scope-gate` ran; `SandeepTakasi/drydock/scope-gate@<ref>` from another repo has not run |
| D7 | held | Composite action with one `node` step ran on `ubuntu-latest` with `setup-node` 22 |
| D8 | held | Both live runs used `pull_request` with read-only permissions, and the issue fetch succeeded with `issues: read` |
| D9 | never-exercised live | No unlinked PR has been opened since the workflow landed; test only |
| §6 `check` output shape | held | Live log `FLAG outside scope: stray-probe.txt`, `check: FLAG (1)`; annotation emitted from it |
| §6 `readIntent` over an issue body | held | `check: PASS (1 file(s), 1 criteria)` from #25's body |
| §6 merge checkout + `fetch-depth: 0` | held | `base.sha` resolved in both runs (no exit 3) |
| §6 `GITHUB_API_URL` | held | Test stand-in and live API both served by the same code path |

### New knowledge

- From `1bb9248`, every PR into `main` runs `scope-gate.yml`, and a PR whose body
  does not close exactly one OWNER/MEMBER/COLLABORATOR issue that predates it fails
  (D9). Nothing in CLAUDE.md says so (R1).
- A `pull_request` workflow runs from the PR's merge commit, so dogfooding a new one
  needs a base branch that already contains it, and a PR into `main` would also
  carry every one of the plan's own files into the gate's diff (R2).
- `gh`'s 401s on this machine were a stale user-level `GITHUB_TOKEN`, which
  overrides the keyring login (R3).

### Proposals

#### Proposal R1 | target: CLAUDE.md | kind: addition
Finding: the repo's own PRs are now gated by `scope-gate` and fail closed without a linked, scoped issue (D9, new knowledge 1).
Confidence: high
```diff
@@ ## Working on `site/`
+**Every PR into `main` is scope-gated** (`.github/workflows/scope-gate.yml`,
+plan 014). The PR body must say `Closes #<n>` for exactly one issue, opened
+before the PR by an OWNER/MEMBER/COLLABORATOR, whose body declares
+`- **Files owned:**` globs (and optional `- **Forbidden:**`,
+`- **Acceptance criterion:**`). No link, two links, or a file outside the
+globs fails the check. Open the scope issue first.
+
 ```bash
 cd site && npm install
```

#### Proposal R2 | target: CLAUDE.md | kind: addition
Finding: the plan's phase gate assumed probe PRs need no particular base; they had to target a pushed branch holding the workflow (deviation 4).
Confidence: high
```diff
@@ ## Executing a plan here
+- **Dogfood a new `pull_request` workflow from a branch that already has it.**
+  The run uses the workflow file from the PR's merge commit, so the probe PR's
+  base must contain it; and a probe into `main` before the plan is pushed would
+  carry every one of the plan's files into the diff under test. Push the plan's
+  commits to a throwaway branch (`plan-NNN`), open the probes against it, and
+  delete it after. Plan 014 deviation 4.
```

#### Proposal R3 | target: CLAUDE.md | kind: addition
Finding: `gh` returned 401 for months because a Windows user-level `GITHUB_TOKEN` overrides the keyring login (deviation 4, new knowledge 3).
Confidence: medium (a machine fact; drop it if the variable is deleted)
```diff
@@ ## Toolchain facts that cost time to discover
+- **`gh` 401 here means the stale user-level `GITHUB_TOKEN`, not a bad login.**
+  `gh` prefers that variable over its keyring, and the variable's token is
+  invalid. Run `env -u GITHUB_TOKEN gh …` (Git Bash), or delete the variable.
+  Measured 2026-10-09, plan 014.
```

### Questions for the human

- **Q1.** A13 has live evidence (#26 pass, #27 fail naming the file), but was kept
  PENDING by instruction. `docs/compatibility.md` is outside reconcile's targets.
  Promote it, with a `verification-log.md` entry, in a follow-up plan before 0.19.0?

### Planwright feedback (cluster b)

- When a sketch names third-party action versions, read the repo's existing pins
  first; plan 014 wrote `@v4` beside a `verify.yml` on `@v5`.
- A phase gate that needs live PRs should name the PR base branch, and say
  whether the session may open them through `gh`.

### Executor feedback (cluster d)

- An executor that writes an owned file through Bash must list **every** such file
  in its hand-back; T1.1.3 reported one of two, and only the hook log showed it.

### Token usage

```
bucket          input       cache_create  cache_read    output      total
orchestration   486         1513495       58535038      198655      60247674
execution       32          151658        1050835       4941        1207466
other subagents 0           0             0             0           0
overhead: 98.0% (orchestration + other subagents) of 61455140 tokens across 2 session(s)
1fe06cf7-2642-4481-b0d9-729a0d144d6d  54043373  also mentions: 009-site-016-additions, 001-drydock-homepage, 002-design-system-modernisation, 003-hero-revamp, 004-seatrial-e2e-gate, 005-small-lane-and-solo-mode, 006-external-review-repairs, 007-deferred-hardening, 008-stats-gates-check-learnings, 010-guard-entry-point, 011-stale-bash-snapshot, 012-homepage-restructure, 013-guard-beside-any-planner
9d009a6e-79a0-4458-80b5-a73fd882c80b  6204301  also mentions: 009-site-016-additions, 001-drydock-homepage, 002-design-system-modernisation, 003-hero-revamp, 004-seatrial-e2e-gate, 005-small-lane-and-solo-mode, 006-external-review-repairs, 007-deferred-hardening, 008-stats-gates-check-learnings, 010-guard-entry-point, 011-stale-bash-snapshot, 012-homepage-restructure, 013-guard-beside-any-planner
a session that mentions 014-scope-gate-action is counted whole, including unrelated work in it; tokens, not cost
```

### Applied

2026-10-09, approved by Sandeep Takasi: R1, R2 and R3 applied to CLAUDE.md (R1 as its own section, "Pull requests into `main` are scope-gated", rather than inside "Working on `site/`"). Q1 answered yes: A13 promoted to PASSED with a verification-log entry.
