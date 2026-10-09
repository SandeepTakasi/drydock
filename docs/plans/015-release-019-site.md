---
plan: 015-release-019-site
format_version: 3
status: BLOCKED
isolation: none
enforcement: required
attribution: manifest
lane: full
execution: fleet
created: 2026-10-09
approved_by: Sandeep Takasi
---

# 015 - Release 0.19.0 and a homepage a newcomer can start from

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

**Ownership enforcement:** before each wave, `wave-start docs/plans/015-release-019-site.md <wave>`;
after it, `audit-wave`, then `rm .drydock/wave-owns.json`. Spawn executors one
at a time; each commits only its owned files, then the orchestrator runs
`task-close`. Close each wave before writing this file and commit the report
before the next `wave-start`. Paste `audit-wave`'s per-task rows and its
`enforcement active: ...` sentence verbatim into each report, never its
`### audit-wave` heading line.

**Staleness check:** `git diff <baseline SHA>..HEAD -- site/app site/components site/content site/scripts/assert-copy.mjs drydock/.claude-plugin drydock/CHANGELOG.md README.md scope-gate/README.md docs/compatibility.md`.

## 1. Requirement

Cut 0.19.0, the release plan 014 deferred until A13 passed live (it did,
2026-10-09): version, changelog, `scope-gate/README.md` pointed at the tag, tag
`v0.19.0`, and backfill the missing `v0.18.0` tag. Rebuild the homepage from the
UI/UX and content audit in section 6 so that a first-time visitor can tell what
Drydock does, what they would type, what they get back, and how to start:
plain-language hero with GitHub as a call to action, steps that show commands
and outcomes, a new "Three ways in" section (planwright, check, scope-gate), a
fifth refusal from a real pull request, scannable limits, a numbered get-started
section, a reordered FAQ, and an A13 row on the evidence page. Every claim stays
bounded by `docs/compatibility.md`.

## 2. Spec reference

The audit in section 6 (approved by the user 2026-10-09) and the copy deck in
section 6a. Behaviour of the Action: `scope-gate/README.md`.

## 3. Surgical-scope statement

Copy, layout and one new section component. No new dependency, no new route, no
change to the visual identity (colours, type, theme), the hero excerpt's lines,
the wave illustration, the motion library, or plugin code.

## 4. Baseline

_Filled by T0, 2026-10-09._ Installed plugin 0.18.0, repo 0.18.0, no VERSION DRIFT.

| Item | Value |
|---|---|
| Commit SHA | `d296aab` |
| `cd site && npm run verify` | build, tsc, eslint PASS; assert-copy PASS (home 22 literals, evidence 7, 4 pins, version matches); assert-matrix PASS once T0 added the README row (it failed on that row alone before) |
| `node drydock/scripts/drydock-audit.test.mjs` | 161/161 passed |
| `prove-failable` on this plan | PASS, 10 of 10 criteria fail at baseline |

## 5. Practices in effect

| Practice | Value | Source |
|---|---|---|
| Site gate | `npm run verify` (build, tsc, eslint, assert-copy, assert-matrix), run at every wave gate | CLAUDE.md |
| Honesty | every claim bounded by `compatibility.md`; every existing required literal stays rendered | CLAUDE.md "Honesty rule" |
| Copy | written by the planner, pinned in 6a, copied byte for byte, compared by wavecheck; no em dash and no apostrophe in a new string | user (audit), plan 011 D14, plan 013 |
| Criteria | run through `cmd.exe`: no backslashes | CLAUDE.md |
| Human gate | Sandeep Takasi views the built page, desktop and 375px, before any push, tag or install | user |
| Execution | fleet, one executor at a time | user |

## 6. Findings & constraints

**Audit (approved 2026-10-09).** Content: C1 the hero never says what Drydock is
in plain words; C2 jargon before definitions; C3 no "what you type, what you
get"; C4 the nine-piece grid sits mid-pitch; C5 0.18 (beside another planner)
and 0.19 (PR gate) are invisible; C6 the hero artifact has no plain caption
above it; C7 install becomes a settings paragraph; C8 the FAQ misses cost, other
planners and PRs; C9 limits read as a wall; C10 no GitHub call to action. UI: U1
five pills before the headline; U2 at 375px `break-all` splits
`SandeepTakasi/drydock` mid-word (Hero ~line 59, Install row `<code>`); U3 the
header status pill crowds the bar; U4 nine equal dense cards; U5 prose-only
steps; U6 limits as plain paragraphs; U7 a stale footer date.

**Constraints from the gate.**
- `assert-copy.mjs` `REQUIRED_HOME` (lines ~59-102) must stay rendered on home:
  `APPROVED (HUMAN-ONLY)`, `open pilot`, `field benchmarks pending`,
  `Node 20.17 or newer`, the two excerpt literals, `drift`, `one-file change`,
  the thesis, the seven piece names, the two Bash/project-directory sentences,
  `/drydock:check`, `/drydock:init`, `file-tool edits outside that scope are
  denied`, `Bash writes are still only detected.` Text inside a closed
  `<details>` is in the export, so it counts. `executor` must occur at least
  twice.
- Exactly one `<h1>`, containing `Drydock`. The hero excerpt (`data-excerpt-of`,
  `data-excerpt-verdict`) is checked line by line against plan 004; do not
  change its lines or markup contract.
- The pin check needs `data-source` under `drydock/` and exactly 4 pins today
  (~lines 295-310); the fifth refusal needs `scope-gate/` and 5.
- Motion contract: no `duration:`/`delay:` literal in `components/sections/*.tsx`;
  a section importing `motion/react` must use `useMotionSafe` and `data-reveal`.
- `assert-copy` in full mode needs `plugin.json`'s version rendered and in root
  `README.md`; fixture mode (`out/index.html` as argument) skips that and the
  evidence page but keeps the pin checks.
- `out/index.html` repeats strings in the RSC payload: strip `<script>` bodies
  before matching. Header links use `next/link` with `prefetch={false}`.
- Plugin code is unchanged since 0.18.0 and `v0.18.0` was never tagged.
- Learnings: Bash edits leave no receipt (plan 005 D1, plan 014 D2-D3), so use
  Write/Edit; Haiku paraphrased pinned prose (plan 011 D2).

### 6a. Copy deck (verbatim; `${VERSION}`, `${REPO}`, `${BLOB}` are the existing constants)

**`site`**: `title` `"Drydock: parallel Claude Code agents, checked against the plan"`;
`description` `"A Claude Code plugin: plan a change, let agents build it in parallel inside the files each one owns, and get every wave audited against the real git diff before the next one starts."`;
new `githubLabel` `"GitHub"`. (`status` is removed in T1.3.1.)

**`nav`** (exactly): `/#lifecycle` "How it works", `/#ways` "Where it fits", `/#refuses` "What it catches", `/evidence` "Evidence", `/#install` "Get started".

**`meta`** (eyebrow, heading), plus new key `ways` with `id: "ways"`:
- problem: `"01 / THE PROBLEM"`, `"Parallel agents collide, then they drift"`
- lifecycle: `"02 / HOW IT WORKS"`, `"Plan it, build it in waves, check every wave"`
- ways: `"03 / WHERE IT FITS"`, `"Three ways in, from one change to every pull request"`
- refuses: `"04 / WHAT IT CATCHES"`, `"Five things it will not let through"`
- limits: `"05 / LIMITS"`, `"What it does not do"`
- install: `"06 / GET STARTED"`, `"Start in three steps"`
- faq: `"07 / QUESTIONS"`, `"Questions people ask"`
- evidence: unchanged.

**`hero`** (new fields `meta`, `ctaSecondary`, `artifactLead`; `kicker` and `badges` are removed in T1.3.1):
- `meta`: `` `Claude Code plugin · v${VERSION} · open pilot · MIT` ``
- `promise`: `"Your agents build what you approved. Drydock checks that they did."`
- `sub`: `"Plan a change, let Claude Code agents build it in parallel, each inside the files it owns, and get every wave audited against the real git diff before the next one starts. Collisions and edits outside the plan get caught at the gate, not found in your repo."`
- `ctaPrimary`: `"Get started"`; `ctaSecondary`: `"Star on GitHub"`
- `artifactLead`: `"A real gate from plan 004: four checks passed, one did not, and the next wave was not allowed to start."`
- `headline`, `thesis`, `artifact`, `wave`: unchanged.

**`problem`**: unchanged.

**`lifecycle`** (`steps` gain optional `command` and required `outcome`; new `commandLabel`, `outcomeLabel`, `piecesSummary`):
- `commandLabel`: `"You type"`; `outcomeLabel`: `"You get"`; `piecesSummary`: `"All nine pieces of the plugin"`
- step 01: title `"Plan the change"`; body `"planwright interviews you, reads the code the change touches, and writes a plan: tasks grouped into waves, the exact files each task may touch, and a command that proves each task is done. Nothing runs until you approve it."`; command `"/drydock:planwright add rate limiting to the API"`; outcome `"A plan file in docs/plans, waiting for your approval."`
- step 02: title `"Build in parallel waves"`; body `"Agents take one task each and work side by side. Each may only write the files its task owns: while the wave runs, a hook denies file-tool edits to other files in the project."`; no command; outcome `"One commit per task, each inside its own files."`
- step 03: title `"Check every wave against the diff"`; body `"wavecheck reads what actually changed in git, not what the agents say they did: the right files, the checks passing, nothing extra. PASS opens the next wave. BLOCK stops the plan and says why."`; no command; outcome `"PASS or BLOCK, written into the plan with its evidence."`
- `loop`: `"On a BLOCK nothing retries on its own: you decide, or /drydock:replan repairs the plan."`
- `pieces`, `readmeHref`, `readmeLinkText`: unchanged.

**`ways`** (new export, `{ lead: string; items: { title: string; command: string; body: string; href?: string; linkText?: string }[]; plannerNote: string }`):
- `lead`: `"Drydock is not only for big plans. Pick the size of the change."`
- item 1: title `"A change across many files"`; command `"/drydock:planwright <your change>"`; body `"The full loop: a plan you approve, agents in parallel waves, a gate after every wave, and a reconcile step that turns what went wrong into proposed doc fixes."`
- item 2: title `"A small change, no plan"`; command `"/drydock:check"`; body `"Say in a few lines which files the change may touch, do the work, and get an audit of every file and check that strayed. Arm the optional guard and file-tool edits outside the scope are denied as you go."`
- item 3: title `"Every pull request"`; command `"uses: SandeepTakasi/drydock/scope-gate@v0.19.0"`; body `"A GitHub Action that reads the scope from the issue a pull request closes and fails the check on any file outside it. A scope written by someone outside the repo is refused, a path proven by tests and not yet seen live."`; href `` `${BLOB}/scope-gate/README.md` ``; linkText `"Read the scope-gate README"`
- `plannerNote`: `"Already plan with another tool, such as Superpowers? Keep it. The check skill can take the file list from that task and audit the work against it. That path shipped in 0.18.0 and is not yet observed in a live session."`

**`refusals`** (`Refusal` gains `href?: string; hrefLabel?: string`):
- `lead`: `"Real output, not mockups. Each message is copied from an actual run, four against a scratch repo and one from a pull request on this repo, and the build checks that each key phrase still exists in the code that prints it."`
- items 1-4 unchanged. Item 5, with a comment above it in the style of the others naming run 37884214325 and the check-runs API annotation:
  title `"A pull request outside its issue"`; body `"In CI, scope-gate reads the scope from the issue a pull request closes, audits the diff from its base, and fails the check naming every file outside that scope."`; command `"pull request #27 (issue #25 owns scope-gate-probe/**)"`; source `"scope-gate/gate.mjs"`; pin `"outside the scope declared in"`; output `"FLAG outside scope: stray-probe.txt\ncheck: FLAG (1)\nstray-probe.txt: outside the scope declared in #25"`; href `"https://github.com/SandeepTakasi/drydock/actions/runs/37884214325"`; hrefLabel `"See the run"`.

**`limits`** (new `points: { lead: string; detail: string }[]`; `items` is removed in T1.3.1; `lead` and `evidenceLinkText` unchanged):
1. `"Bash can write around the hook."` / `"Two ceilings stand, both exercised rather than assumed: Bash-mediated writes bypass file-tool hooks entirely, and paths outside the project directory are not enforced. The wave audit is the backstop."`
2. `"Small changes are audited, and only optionally guarded."` / `"For work too small for a plan, the check skill audits scope afterwards. With the opt-in guard armed, file-tool edits outside that scope are denied; Bash writes are still only detected."`
3. `"Gate compliance is measured, not promised."` / `"28 of 29 wave gates were invoked at their boundary across 5 pilot plans. Every session counted knew it was being observed, so read the figure as a ceiling, not a rate."`
4. `"Approval is a human job."` / `"Human approval is an instruction the plan format states and a reader upholds. Nothing in the tooling stops a session writing status: APPROVED itself."`
5. `"It is an open pilot, field benchmarks pending."` / `"Every figure on this site comes from pilot plans run in this repo; there are no field benchmarks yet."`

**`install`** (new `steps`, `ci`, `ciSummary`; `commands`, `requirement`, copy labels unchanged; `scopeNote` and `configNote` replaced in place):
- Move the two install commands into a module-level `const INSTALL_COMMANDS` and use it for both `install.commands` and step 01 (a reference to `install` inside its own literal does not compile).
- `steps`: 01 title `"Install the plugin"`, body `"In Claude Code, add the marketplace, then install."`, commands = `INSTALL_COMMANDS`; 02 title `"Teach it your repo"`, body `"Run this once. Drydock detects your quality gates, test framework, commit style and CI, asks only what it cannot detect, and saves a profile every plan follows."`, commands `["/drydock:init"]`; 03 title `"Plan your first change"`, body `"Start with something small. For a quick fix, skip the plan and run /drydock:check instead."`, commands `["/drydock:planwright <describe your change>"]`. Type: `{ index: string; title: string; body: string; commands: string[] }[]`.
- `scopeNote`: `"Add --scope project to the install to share it with your team."`
- `configNote`: `"Settings on enable: where plans live (default docs/plans), which docs reconcile may propose changes to, and where seatrial writes its specs (default e2e)."`
- `ciSummary`: `"Optional: gate pull requests in CI"`
- `ci`: `{ note: "This workflow checks every pull request against the scope declared in the issue it closes. It runs on pull_request with read-only permissions, never pull_request_target, because acceptance commands run code from the pull request.", copyAriaLabel: "Copy the workflow to clipboard", snippet: <exactly the block below, lines joined with a newline, no trailing newline> }`

  ~~~~
  name: scope-gate

  on:
    pull_request:
      types: [opened, edited, synchronize, reopened]

  permissions:
    contents: read
    issues: read
    pull-requests: read

  jobs:
    scope-gate:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v5
          with:
            fetch-depth: 0
        - uses: actions/setup-node@v5
          with:
            node-version: 22
        - uses: SandeepTakasi/drydock/scope-gate@v0.19.0
  ~~~~

**`faq`** (exactly this order; existing answers verbatim where marked):
1. "Who is it for?" (existing)
2. "Is this overkill for a one-file change?" (existing)
3. `"Does it cost more tokens?"` / `"Yes. Planning, the audit after every wave and reconcile all run on top of the build itself. In exchange, a mistake is caught at the wave that made it instead of in review. The reconcile report of every plan prints its token split between orchestration and execution, counting each session whole, so you can see the cost on your own work rather than take a number from this page."`
4. `"Can I keep my current planner?"` / `"Yes. If a tool such as Superpowers already writes your plan, run /drydock:check on its task: the skill copies the files that task says it will touch into a scope and audits the work against it, and the optional guard denies file-tool edits outside it. That path shipped in 0.18.0 and is not yet observed in a live session."`
5. `"Can it check pull requests?"` / `"Yes, with the scope-gate Action. Write the owned files and acceptance commands in an issue, then close that issue from the pull request. The check fails when the pull request links no issue or more than one, when the issue was opened after the pull request or by someone who is not an owner, member or collaborator, or when any changed file is outside the scope. The out-of-scope failure was observed on this repo; the refusals are proven by the test suite and not yet seen live. It checks files, not lines, and edits to the issue after the pull request opened are not detected (see the scope-gate README)."`
6. "How is this different from other planning plugins?" (existing)
7. "What if I do not run subagents at all?" (existing)
8. "Does it review code quality?" (existing)
9. "Can the model skip the gates?" (existing)
10. "Does anything actually touch a browser?" (existing)
11. "My repo forbids tool names in commit messages." (existing)
12. "Why the name?" (existing)

**`evidence.rows`**: append after A12: id `"A13"`, label `"scope-gate Action fails a PR outside the scope declared in its linked issue, on GitHub-hosted runners"`, status `"PASSED"`, tone `"pass"`, note `"2026-10-09, on GitHub-hosted runners. Issue #25 declared a scope; a pull request inside it passed, and a pull request adding a file outside it failed, naming that file. The refusals for untrusted authors, missing or extra links, late issues and linked pull requests, a forbidden glob and a failing criterion are proven by the test suite, not yet live. The issue and both pull requests were opened by the owner account, and no other repository has used the Action yet."`

**`footer`**: `meta` `` [`v${VERSION}`, "MIT"] ``; `links` gain, after "Plugin README", `` { href: `${BLOB}/drydock/CHANGELOG.md`, label: "Changelog" } ``; `tagline` unchanged.

**`VERSION`**: `"0.19.0"`.

## 7. Decision Log

| # | Question | Decision | Decided by | Rationale |
|---|---|---|---|---|
| 1 | Versioning | 0.19.0 in `plugin.json`, root README and CHANGELOG; the entry says the plugin is unchanged. Tag `v0.19.0` and backfill `v0.18.0` at `e0847c1` | user | One version line; the Action needs a tag to pin |
| 2 | Site scope | The full audit in section 6 and the deck in 6a | user ("Yes" to the audit, 2026-10-09) | A newcomer must be able to tell what it does and how to start |
| 3 | Site verification | Testing Gate N/A; `npm run verify` at every wave gate, a fresh-context review (T1.R.1), and the human viewing the built page | user | Chosen for this plan's site work |
| 4 | Who writes the copy | The planner, pinned in 6a, byte for byte | planner | Plan 011 D14; executors implement layout only |
| 5 | Wave shape | 1.1 adds copy beside the old (and cuts the release); 1.2 rebuilds sections against it; 1.3 removes the old fields and pins the new literals | planner | The build and `npm run verify` stay green at every gate, and wave-1.2 tasks never depend on each other |
| 6 | Hero install commands | Shown from `lg` up, hidden below; never `break-all` | planner (user asked why they are there) | Plan 012's requirement was both commands visible at 1280x800, which still holds; on a phone they crowd the hero and wrap mid-word |
| 7 | The nine pieces | Inside a closed `<details>` titled "All nine pieces of the plugin" | planner | C4; text in a closed `<details>` is still in the export, so the piece-name literals hold |
| 8 | Claims about 0.18's other-planner path | Stated with "not yet observed in a live session" | planner | No compatibility row evidences it; plan 013 says it is unexercised |
| 9 | Refusal five's output | The two `check` lines from run 37884214325's log, then the annotation as the check-runs API returns it (`path: message`) | planner | Pasted, not composed |
| 10 | Header | Drop the status pill (pilot status moves to the hero meta line and limits point 5); add a GitHub link | planner | U3, C10 |
| 11 | `assert-copy.mjs` ownership | T1.1.1 (pins 4→5, `scope-gate/` sources) then T1.3.1 (new literals) | planner | Sequential handoff across waves |
| 12 | Push, tags, install | Orchestrator after the human gate: move this plan's `docs/plans/README.md` row with its status at every status change, push `main`, push tags `v0.18.0` and `v0.19.0`, watch Verify and Deploy, then `claude plugin marketplace update drydock && claude plugin update drydock@drydock` | planner | Executors never push or tag |
| 13 | Lane | full: three implementation waves and a review | planner | Size (~13 files) and the copy/component dependency |
| 14 | How is wavecheck 1.1's BLOCK (deviation 1) repaired? | Plan 012's replaced-task mechanism: `T1.1.1` superseded by `T1.1.1r1` in wave 1.1, which takes over its ownership and restores 6a's FAQ order, then a re-audit of wave 1.1. Wave-1.2 tasks depend on `T1.1.1r1` | user (Sandeep Takasi, 2026-10-09) | `wave-start` will not arm a wave after one whose last verdict is BLOCK; a new task id keeps one `task-close` per task |

## 8. Open questions

None.

## 9. Out of scope / follow-ups

- New imagery, a demo video or GIF on the page (the drydock-demo recording exists; embedding it is its own decision).
- A GitHub Release object; this repo uses tags.
- Changing the visual identity, fonts or colours.
- The evidence page layout (only the A13 row is added); its missing A8 and A9 rows.
- The local-only specs under `e2e/009-*/` and `e2e/012-*/` (not run in CI) expect four refusals, the "Install" nav label and a visible pieces grid; they go stale and are left for a later seatrial pass.

## 10. Execution policies

- **Per task:** the criterion exits 0, re-run by wavecheck through `spawnSync(..., {shell: true})`.
- **Per wave:** wavecheck, which also runs `cd site && npm run verify` (exit 0 required) and compares pinned strings byte for byte against 6a.
- **Quality review:** T1.R.1 after wavecheck 1.3, fresh context, Judgment tier. Rejection: max 2 repair rounds as new waves with new task ids (CLAUDE.md), then the human.
- **Escalation:** ownership or unlogged-deviation BLOCKs get no retries.
- **Checkpointing:** one commit per task, owned files only, then `task-close`.
- **Tracker:** none.

## 11. Testing Gate

N/A, the user chose (D3) to verify this site work by viewing the built page on
desktop and at 375px before anything ships, backed by `npm run verify` at every
wave gate and the fresh-context review T1.R.1; no browser cases are run.

## 12. Pressure-test verdict

2026-10-09, fresh-context reviewer (Opus 5.5, read-only). Verdict: mechanics
sound, every criterion can both fail and pass; one BLOCKING and eight
SHOULD-FIX findings, all fixed before approval: an apostrophe in FAQ 3 that
would have forced a BLOCK (rewritten, and the drydock-stats pointer replaced by
reconcile's token report with its whole-session caveat); a self-reference in
`install` (now `INSTALL_COMMANDS`); a missing aria label and an unpinned
workflow snippet (both pinned); refusal and A13 claims widened past the evidence
(now qualified, and the A13 note carries every caveat in `compatibility.md`);
two enforcement over-claims (step 02, hero `sub`); D6's 1280x800 promise now
checked at T1.R.1 and the human gate; T1.2.5 told about the CI spec reading
`#install`. NITs: the stale local e2e specs and the missing A8/A9 evidence rows
are logged in section 9; refusal 5's `$ ` prefix is accepted as consistent with
refusal 3.

## Phase 1: Release and homepage

**Exit state:** 0.19.0 committed; the homepage follows 6a; `npm run verify` passes; T1.R.1 APPROVED.

**Phase gate:** wavecheck 1.1, 1.2 and 1.3 PASS, T1.R.1 APPROVED, then a named human approves the built page (desktop and 375px, with both hero install commands visible without scrolling at 1280x800, plan 012's requirement) before the orchestrator pushes `main`, pushes tags `v0.18.0` (at `e0847c1`) and `v0.19.0`, watches Verify and Deploy go green, and updates the installed plugin.

#### T0 - Baseline and plan index row
- **Description:** Record the SHA and gate results in Baseline, run `prove-failable` on this plan and record it, add this plan's row to `docs/plans/README.md`, set status EXECUTING with the row. Stop if any criterion already exits 0.
- **Files owned:** `docs/plans/README.md` (and this plan's Baseline, before any wave is armed)
- **Depends on:** none
- **Model / thinking:** Mechanical / off   **Executor:** orchestrator, inline
- **Context brief:** section 4; CLAUDE.md "Executing a plan here".
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');const r=c.spawnSync('node',['drydock/scripts/drydock-audit.mjs','validate-plan','docs/plans/015-release-019-site.md'],{encoding:'utf8'});const t=fs.readFileSync('docs/plans/015-release-019-site.md','utf8');process.exit(r.status===0&&/Commit SHA [|] .?[0-9a-f]{7,40}/.test(t)&&fs.readFileSync('docs/plans/README.md','utf8').includes('015-release-019-site')?0:1)"`

### Wave 1.1 - The release, and the new copy beside the old

#### ~~T1.1.1 - Copy deck into copy.ts, and the pin check widened~~ - SUPERSEDED by T1.1.1r1
- **Status:** SUPERSEDED (commit `4e552d3` stands as history; its copy and pin check are kept, and its FAQ order is deviation 1). Ownership of both files transfers to `T1.1.1r1`, so the wave's active ownership sets stay disjoint (D14).
- **Description:** Apply section 6a to `site/content/copy.ts` additively: change strings in place where the field already exists, add the new fields and exports, and keep `hero.kicker`, `hero.badges`, `limits.items` and `site.status` (removed in T1.3.1) so the current components still build. In `site/scripts/assert-copy.mjs`, accept a `data-source` under `drydock/` or `scope-gate/` (update its message) and expect exactly 5 `data-pin` elements.
- **Files owned:** `site/content/copy.ts`, `site/scripts/assert-copy.mjs`
- **Depends on:** T0
- **Model / thinking:** Standard / extended (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** section 6 "Constraints from the gate" and 6a in full; D4, D5, D8, D9, D11; `site/content/copy.ts`; `site/scripts/assert-copy.mjs` ~lines 290-310. Types must describe the new shapes (`Refusal`, `meta` key union with `ways`, `lifecycle.steps`, `ways`, `limits.points`, `install.steps`/`ci`). Full `npm run verify` stays red on the version check until T1.1.2 commits; do not touch `plugin.json` or `README.md`. Use Write/Edit, not Bash.
- **Forbidden:** any string not in 6a; changing `hero.artifact` or `hero.wave`; removing a field the current components read; an em dash or apostrophe in a new string.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');const ok=(x)=>c.spawnSync(x,{cwd:'site',shell:true,stdio:'ignore'}).status===0;const s=fs.readFileSync('site/content/copy.ts','utf8'),a=fs.readFileSync('site/scripts/assert-copy.mjs','utf8');const k=['Your agents build what you approved. Drydock checks that they did.','Three ways in, from one change to every pull request','Five things it will not let through','outside the scope declared in #25','It is an open pilot, field benchmarks pending.','Optional: gate pull requests in CI','Can I keep my current planner?','no other repository has used the Action yet','githubLabel'];if(!(/VERSION = .0[.]19[.]0./.test(s)&&k.every(x=>s.includes(x))&&a.includes('scope-gate/')&&/pins[.]length !== 5/.test(a)))process.exit(1);process.exit(ok('npx next build')&&ok('npx tsc --noEmit')&&ok('node scripts/assert-copy.mjs out/index.html')?0:1)"`

#### T1.1.2 - Cut 0.19.0
- **Description:** Set the version to 0.19.0 in `drydock/.claude-plugin/plugin.json` and in the root `README.md` status line `(v0.18.0)`. Add the entry below at the top of `drydock/CHANGELOG.md` (above `## 0.18.0`), exactly, with `<date>` the execution date as `YYYY-MM-DD`. In `scope-gate/README.md`, replace the status paragraph below and change `scope-gate@main` to `scope-gate@v0.19.0`.
- **Pinned changelog entry (verbatim):**

  ```
  ## 0.19.0: <date>

  **`scope-gate`: a GitHub Action that checks a pull request against the scope its issue declared.** Write `- **Files owned:**` globs, and optionally `- **Forbidden:**` globs and `- **Acceptance criterion:**` commands, in an issue, then close it from the pull request. The Action runs `drydock-audit.mjs check` on the diff from the PR's base and fails with a file annotation on every file outside the scope. It fails closed on a PR that links no issue or more than one, on an issue whose author is not OWNER, MEMBER or COLLABORATOR, and on an issue created after the PR. Use it as `SandeepTakasi/drydock/scope-gate@v0.19.0` on `pull_request` with read-only permissions, never `pull_request_target`. See `scope-gate/README.md`.

  **Observed live (A13).** On this repo, a PR inside its issue's scope passed and a PR adding an unowned file failed, naming it. The refusal paths are proven by `scope-gate/gate.test.mjs` (18 cases, in CI on Linux and Windows), not yet live.

  **The homepage is rebuilt for a first-time visitor.** It says what Drydock does in plain words, shows what you type and what you get at each step, adds a "Three ways in" section (planwright, check, scope-gate) and a three-step start, and quotes the PR gate's real output.

  **The plugin itself is unchanged from 0.18.0.** This version exists so the Action has a tag to pin.

  Tests: audit 161, scope-gate 18 (new), others unchanged.
  ```

- **Pinned `scope-gate/README.md` replacement.** Replace these three lines:

  ```
  Status: dogfooded on this repo, **not yet run live** (row A13 in
  `docs/compatibility.md` is PENDING). No release or tag exists; reference
  `@main` or a commit SHA.
  ```

  with exactly:

  ```
  Status: observed live on this repo (row A13 in `docs/compatibility.md`,
  PASSED 2026-10-09). Pin a release tag, `@v0.19.0` or later.
  ```

- **Files owned:** `drydock/.claude-plugin/plugin.json`, `drydock/CHANGELOG.md`, `README.md`, `scope-gate/README.md`
- **Depends on:** T0
- **Model / thinking:** Mechanical / off (Haiku 4.5)   **Executor:** drydock:executor
- **Context brief:** D1, D4, D12; the 0.18.0 entry atop `drydock/CHANGELOG.md` for shape; root `README.md` line 11; `scope-gate/README.md`. Use Write/Edit, not Bash.
- **Forbidden:** any other edit; paraphrasing pinned text; pushing, tagging or installing.
- **Acceptance criterion:** `node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('drydock/.claude-plugin/plugin.json','utf8')).version,r=fs.readFileSync('README.md','utf8'),l=fs.readFileSync('drydock/CHANGELOG.md','utf8'),g=fs.readFileSync('scope-gate/README.md','utf8');const h=(l.match(new RegExp('^## .*$','m'))||[''])[0];process.exit(p==='0.19.0'&&r.includes('(v0.19.0)')&&!r.includes('(v0.18.0)')&&h.startsWith('## 0.19.0: 2026-')&&l.includes('The plugin itself is unchanged from 0.18.0.')&&l.includes('rebuilt for a first-time visitor')&&g.includes('scope-gate@v0.19.0')&&!g.includes('@main')&&!g.includes('PENDING')?0:1)"`

#### T1.1.1r1 - Restore the deck's FAQ order
- **Description:** In `site/content/copy.ts`, reorder the `faq` array to 6a's order exactly: move "My repo forbids tool names in commit messages." from after "What if I do not run subagents at all?" to after "Does anything actually touch a browser?". Move whole items; change no string (deviation 1, D14).
- **Files owned:** `site/content/copy.ts`, `site/scripts/assert-copy.mjs` (the second transferred from T1.1.1, not to be edited)
- **Depends on:** T1.1.1
- **Model / thinking:** Mechanical / off (Haiku 5.5)   **Executor:** drydock:executor
- **Context brief:** 6a `faq` (the numbered order); deviation 1; D14; `site/content/copy.ts` `export const faq`. Use Write/Edit, not Bash.
- **Forbidden:** changing any string; editing `assert-copy.mjs` or any other file.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');const s=fs.readFileSync('site/content/copy.ts','utf8');const f=s.slice(s.indexOf('export const faq'));const q=[...f.matchAll(/q: .([^,]+[?.]).,/g)].map(m=>m[1]);const want=['Who is it for?','Is this overkill for a one-file change?','Does it cost more tokens?','Can I keep my current planner?','Can it check pull requests?','How is this different from other planning plugins?','What if I do not run subagents at all?','Does it review code quality?','Can the model skip the gates?','Does anything actually touch a browser?','My repo forbids tool names in commit messages.','Why the name?'];if(JSON.stringify(q)!==JSON.stringify(want))process.exit(1);process.exit(c.spawnSync('npm run verify',{cwd:'site',shell:true,stdio:'ignore'}).status===0?0:1)"`

### Wave 1.2 - The sections, rebuilt against the new copy

Every task here reads only the copy that wave 1.1 froze, so the five run in any
order. Each criterion builds the site and checks its own section in the export.

#### T1.2.1 - Header, footer and hero
- **Description:** In `app/layout.tsx`, remove the status pill, add a GitHub link (`site.repo`, `site.githubLabel`, external, visible from `md`) beside the nav, and render the footer from the updated `footer`. In `MobileNav.tsx`, add the same GitHub link to the menu. Rebuild the hero text column: `hero.meta` as one quiet mono line replacing the kicker and badges, the `<h1>` unchanged, `promise`, `sub`, the install commands shown only from `lg` (`hidden lg:flex`) and never `break-all`, then the primary CTA (`#install`), a secondary CTA to `site.repo` and the self-audit as a text link. Put `hero.artifactLead` directly above the artifact.
- **Files owned:** `site/app/layout.tsx`, `site/components/MobileNav.tsx`, `site/components/sections/Hero.tsx`
- **Depends on:** T1.1.1r1
- **Model / thinking:** Standard / extended (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** 6a `site`, `nav`, `hero`, `footer`; D6, D10; section 6 constraints (one `<h1>` containing Drydock; the excerpt's `data-excerpt-of` `<pre>` and `data-excerpt-verdict` badge stay as they are; `prefetch={false}` on internal links; no timing literals); the three files; CLAUDE.md "Tailwind v4 is CSS-first", "`react-hooks/set-state-in-effect`".
- **Forbidden:** editing `hero.artifact` rendering beyond moving it; new colours or fonts; `break-all` on a command; files outside `owns`.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');const H=fs.readFileSync('site/components/sections/Hero.tsx','utf8'),L=fs.readFileSync('site/app/layout.tsx','utf8'),M=fs.readFileSync('site/components/MobileNav.tsx','utf8');if(H.includes('break-all')||H.includes('hero.badges')||H.includes('hero.kicker')||L.includes('site.status')||!L.includes('githubLabel')||!M.includes('githubLabel')||!H.includes('artifactLead')||!H.includes('ctaSecondary'))process.exit(1);const ok=(x)=>c.spawnSync(x,{cwd:'site',shell:true,stdio:'ignore'}).status===0;if(!ok('npx next build')||!ok('npx tsc --noEmit')||!ok('npx eslint app components'))process.exit(1);const h=fs.readFileSync('site/out/index.html','utf8').replace(/<script[^]*?<[/]script>/g,'');process.exit(['Star on GitHub','four checks passed, one did not','Changelog'].every(x=>h.includes(x))?0:1)"`

#### T1.2.2 - How it works
- **Description:** In `Lifecycle.tsx`, render each step with its body, then the command (when present) as a labelled code chip using `commandLabel`, and the `outcomeLabel` line with `outcome`; keep the wave illustration; render `loop`; put the pieces grid inside a native `<details>` (closed) whose `<summary>` is `piecesSummary`; update the header comment that says "nine pieces".
- **Files owned:** `site/components/sections/Lifecycle.tsx`
- **Depends on:** T1.1.1r1
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** 6a `lifecycle`; D7; section 6 constraints (motion contract, piece-name literals); `Lifecycle.tsx`; `Faq.tsx` for the `<details>` idiom.
- **Forbidden:** changing the wave SVG or its motion; files outside `owns`.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');const F=fs.readFileSync('site/components/sections/Lifecycle.tsx','utf8');if(!F.includes('<details')||!F.includes('piecesSummary')||!F.includes('outcomeLabel'))process.exit(1);const ok=(x)=>c.spawnSync(x,{cwd:'site',shell:true,stdio:'ignore'}).status===0;if(!ok('npx next build')||!ok('npx tsc --noEmit')||!ok('npx eslint components'))process.exit(1);const h=fs.readFileSync('site/out/index.html','utf8').replace(/<script[^]*?<[/]script>/g,'');process.exit(['All nine pieces of the plugin','You type','add rate limiting to the API','One commit per task','nothing retries on its own'].every(x=>h.includes(x))?0:1)"`

#### T1.2.3 - Three ways in
- **Description:** Create `components/sections/Ways.tsx` rendering `ways` inside the existing `Section` shell: the lead, three cards side by side from `md` (title, the command as a code chip that scrolls rather than wraps mid-word, body, the link when present), then `plannerNote`. Add `<Ways meta={meta.ways} />` to `app/page.tsx` after `Lifecycle` and update its order comment.
- **Files owned:** `site/components/sections/Ways.tsx`, `site/app/page.tsx`
- **Depends on:** T1.1.1r1
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** 6a `ways`; section 6 constraints (motion contract: no timing literal; if it imports `motion/react` it needs `useMotionSafe` and `data-reveal`); `components/Section.tsx`; `components/sections/Refusals.tsx` for card styling; `app/page.tsx`.
- **Forbidden:** a new dependency; new colours or fonts; files outside `owns`.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');if(!fs.existsSync('site/components/sections/Ways.tsx')||!fs.readFileSync('site/app/page.tsx','utf8').includes('<Ways'))process.exit(1);const ok=(x)=>c.spawnSync(x,{cwd:'site',shell:true,stdio:'ignore'}).status===0;if(!ok('npx next build')||!ok('npx tsc --noEmit')||!ok('npx eslint app components'))process.exit(1);const h=fs.readFileSync('site/out/index.html','utf8').replace(/<script[^]*?<[/]script>/g,'');process.exit([h.includes('id='+String.fromCharCode(34)+'ways'+String.fromCharCode(34)),h.includes('Three ways in, from one change to every pull request'),h.includes('A small change, no plan'),h.includes('Read the scope-gate README'),h.includes('not yet observed in a live session')].every(Boolean)?0:1)"`

#### T1.2.4 - What it catches, and limits
- **Description:** In `Refusals.tsx`, render `href`/`hrefLabel` as a link under the output when present, and make an odd last item span both columns from `md`; update the header comment that says "four". In `Limits.tsx`, render `limits.points` as a marked list: each `lead` in strong ink, its `detail` after it in dim text.
- **Files owned:** `site/components/sections/Refusals.tsx`, `site/components/sections/Limits.tsx`
- **Depends on:** T1.1.1r1
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** 6a `refusals`, `limits`; section 6 constraints (the `<pre>` keeps `data-source`/`data-pin`; the limits literals); both files.
- **Forbidden:** changing the `data-source`/`data-pin` contract; files outside `owns`.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');const R=fs.readFileSync('site/components/sections/Refusals.tsx','utf8'),L=fs.readFileSync('site/components/sections/Limits.tsx','utf8');if(!R.includes('hrefLabel')||!R.includes('col-span-2')||!L.includes('limits.points')||L.includes('limits.items'))process.exit(1);const ok=(x)=>c.spawnSync(x,{cwd:'site',shell:true,stdio:'ignore'}).status===0;if(!ok('npx next build')||!ok('npx tsc --noEmit')||!ok('npx eslint components'))process.exit(1);const h=fs.readFileSync('site/out/index.html','utf8').replace(/<script[^]*?<[/]script>/g,'');process.exit(['See the run','Bash can write around the hook.','Approval is a human job.','It is an open pilot, field benchmarks pending.'].every(x=>h.includes(x))?0:1)"`

#### T1.2.5 - Get started
- **Description:** Rebuild `Install.tsx` as three numbered step cards from `install.steps`: title, body, and each command as a row with the existing copy button (no `break-all`; the line scrolls). Under the steps: `scopeNote`, `configNote`, `requirement`. Then a closed `<details>` whose summary is `ciSummary`, holding `ci.note` and `ci.snippet` in a `<pre>` with its own copy button. Copy state must be distinct per command and for the snippet.
- **Files owned:** `site/components/sections/Install.tsx`
- **Depends on:** T1.1.1r1
- **Model / thinking:** Standard / extended (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** 6a `install`; section 6 constraints (`Node 20.17 or newer` and `/drydock:init` stay rendered; no timing literals); `Install.tsx` (keep `copyToClipboard` and the aria-live pattern); `Faq.tsx` for `<details>`; CLAUDE.md "`react-hooks/set-state-in-effect`". CI runs `e2e/tg4-install-command-video.spec.ts`, which requires the first `code` or `pre` inside `#install` to contain `/plugin marketplace add`: keep step numbers and titles out of `<code>`, and step 01's commands first. Use `ci.copyAriaLabel` for the snippet button.
- **Forbidden:** files outside `owns`; a new dependency.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');const F=fs.readFileSync('site/components/sections/Install.tsx','utf8');if(F.includes('break-all')||!F.includes('install.steps')||!F.includes('ciSummary')||!F.includes('<details'))process.exit(1);const ok=(x)=>c.spawnSync(x,{cwd:'site',shell:true,stdio:'ignore'}).status===0;if(!ok('npx next build')||!ok('npx tsc --noEmit')||!ok('npx eslint components'))process.exit(1);const h=fs.readFileSync('site/out/index.html','utf8').replace(/<script[^]*?<[/]script>/g,'');process.exit(['Teach it your repo','Plan your first change','Optional: gate pull requests in CI','never pull_request_target','scope-gate@v0.19.0','Node 20.17 or newer'].every(x=>h.includes(x))?0:1)"`

### Wave 1.3 - Remove the old copy, pin the new

#### T1.3.1 - Delete superseded fields and pin the new literals
- **Description:** Remove `hero.kicker`, `hero.badges`, `limits.items` and `site.status` from `copy.ts` (no component reads them after wave 1.2). In `assert-copy.mjs`, add to `REQUIRED_HOME`, each with a one-line comment citing this plan: `"Your agents build what you approved"`, `"/drydock:planwright"`, `"It checks files, not lines"`, `"never pull_request_target"`, `"not yet observed in a live session"`; add to `REQUIRED_EVIDENCE`: `"no other repository has used the Action yet"`.
- **Files owned:** `site/content/copy.ts`, `site/scripts/assert-copy.mjs`
- **Depends on:** T1.2.1, T1.2.2, T1.2.3, T1.2.4, T1.2.5
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D5, D11; section 6 constraints; both files. Removing an existing required literal is forbidden.
- **Forbidden:** any other copy change; removing or weakening an existing check.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');const s=fs.readFileSync('site/content/copy.ts','utf8'),a=fs.readFileSync('site/scripts/assert-copy.mjs','utf8');if(/badges:|kicker:|status: .open pilot/.test(s)||/^  items: [[]$/m.test(s.slice(s.indexOf('export const limits'),s.indexOf('export const',s.indexOf('export const limits')+5)))||!['Your agents build what you approved','It checks files, not lines','never pull_request_target','not yet observed in a live session','no other repository has used the Action yet'].every(x=>a.includes(x)))process.exit(1);process.exit(c.spawnSync('npm run verify',{cwd:'site',shell:true,stdio:'ignore'}).status===0?0:1)"`

### Wave 1.R - Quality review

#### T1.R.1 - Fresh-context review of the rebuilt page
- **Description:** After wavecheck 1.3 PASS, review the Phase 1 diff and the built page as a first-time visitor and as an auditor: every claim traces to `compatibility.md` or a repo artifact; the copy matches 6a; the page reads clearly at 1280px and 375px with no horizontal scroll and no mid-word command breaks; both hero install commands sit above 800px at 1280x800 (D6); keyboard and screen-reader basics hold (one `<h1>`, labelled copy buttons, `<details>` usable). Record `## Wave 1.R verdict, APPROVED|REJECTED, <date>` with findings.
- **Files owned:** none (the verdict is written by the orchestrator)
- **Depends on:** T1.3.1
- **Model / thinking:** Judgment / extended (Opus 5.5)   **Executor:** general-purpose reviewer, fresh context
- **Context brief:** `git diff <baseline SHA>..HEAD -- site/`; this plan's sections 1, 6, 6a and 7; CLAUDE.md "Honesty rule for site copy"; `docs/compatibility.md`; the built `site/out`, served at `/drydock/`.
- **Acceptance criterion:** `node -e "const s=require('fs').readFileSync('docs/plans/015-release-019-site.md','utf8');process.exit(/^## Wave 1[.]R verdict, APPROVED/m.test(s)?0:1)"`

## Deviation Log

| # | Task | What deviated | Why | Impact | Recorded |
|---|---|---|---|---|---|
| 1 | T1.1.1 | The FAQ order in `copy.ts` does not match 6a: "My repo forbids tool names in commit messages." is item 8, where 6a ("exactly this order") puts it at 11, ahead of code quality, gate skipping and the browser. Every string is byte-identical; only the order differs. The executor reported no deviation | Not stated by the executor | The FAQ renders in an order the plan did not approve. Content and claims unaffected | discovered-by-wavecheck, 2026-10-09 |
| 2 | T1.1.2 | The plan names the executor model "Haiku 4.5"; the available model is Haiku 5.5, which ran it | Model availability | None; the pinned text matched byte for byte | orchestrator, 2026-10-09 |

## Wavecheck reports

### Wavecheck 1.1 - BLOCK - 2026-10-09

Fleet execution: T1.1.2 by `drydock:executor` (Haiku 5.5), then T1.1.1 by
`drydock:executor` (Sonnet 5.5), one at a time; the auditor (orchestrating
session, Opus 5.5) wrote none of the diff. `audit-wave` printed VERSION DRIFT:
the repo script is v0.19.0 and the installed plugin v0.18.0. That is this wave's
own version bump; plugin code is unchanged since `e0847c1`, and the install is
updated at the phase gate (D12).

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.1.1 | `4e552d3` | `site/content/copy.ts`<br>`site/scripts/assert-copy.mjs` | `site/content/copy.ts`<br>`site/scripts/assert-copy.mjs` | none |
| T1.1.2 | `6606c00` | `README.md`<br>`drydock/.claude-plugin/plugin.json`<br>`drydock/CHANGELOG.md`<br>`scope-gate/README.md` | `drydock/.claude-plugin/plugin.json`<br>`drydock/CHANGELOG.md`<br>`README.md`<br>`scope-gate/README.md` | none |

  note: enforcement active: 19 hook decision(s) recorded for wave 1.1 (0 denied)

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `format_version: 3`, status `EXECUTING` (`563b84b`), wave 1.1 is the first wave, `execution: fleet` |
| 2. Ownership | PASS | `audit-wave 1.1: PASS` (2 tasks, 2 commits, manifest); 19 file-tool `allow` receipts (T1.1.1: 14, T1.1.2: 5), 16 Bash commands observed, 0 writes outside `owns`; working tree clean |
| 3. Forbidden | PASS | `hero.artifact` and `hero.wave` byte-identical to `563b84b`; `hero.kicker`, `hero.badges`, `limits.items`, `site.status` kept; all 9 existing FAQ answers verbatim; no file outside `owns`; no push, tag or install |
| 4. Acceptance | PASS | Both criteria re-run through `spawnSync(cmd, {shell: true})`: T1.1.1 exit 0, T1.1.2 exit 0. `cd site && npm run verify` exit 0 (assert-copy: home 22 literals, evidence 7, 5 pins, version matches 0.19.0; assert-matrix PASS) |
| 5. Deviations | **BLOCK** | Byte-for-byte: all 88 pinned 6a strings present in `copy.ts`, the workflow snippet equal line for line, the 0.19.0 changelog entry and the `scope-gate/README.md` status block exact. But the FAQ order departs from 6a's "exactly this order" (deviation 1), unreported by the executor. Deviation 2 logged by the orchestrator |

**Verdict: BLOCK.** Wave 1.2 must not start. Remediation options: (a) a targeted
fix task in a new wave that restores 6a's FAQ order in `copy.ts`, with its own
criterion; (b) fold the reorder into T1.3.1, which already owns `copy.ts`, by
amending its description and criterion; (c) accept the executor's order by a
human decision and amend 6a. Nothing was fixed by this audit.

Deviations logged: 2 (1 discovered by wavecheck)

## Progress log

| Date | Task | Result | Notes |
|---|---|---|---|

## Reconcile report
