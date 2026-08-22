# Changelog

## 0.7.0 — 2026-08-22

**0.6.0 shipped a claim its mechanism did not fully support.** An external review
of the released state found three ways ownership enforcement could silently not
happen, all the same shape — nothing noticed. This release makes non-enforcement
detectable, which is the difference between a claim and a guarantee.

- **`wave-start` generates the ownership boundary from the plan.** Nothing
  created `.drydock/wave-owns.json` in 0.6.0; the only instruction to write it
  was a sentence in the format contract, so the hook was armed only if a model
  remembered to arm it — the same prose-compliance the hook exists to replace,
  and this repo's own A3 row records an orchestrator forgetting a gate. Deriving
  the config from the plan also deletes a second defect rather than checking for
  it: a hand-typed `{"owns":["**"]}` enforced nothing while looking exactly like
  enforcement, and a derived boundary cannot exceed its plan.
- **The hook leaves a receipt, and the audit demands it.** Every decision, allow
  and deny alike, is appended to `.drydock/enforcement.log`. `audit-wave` now
  answers *did enforcement actually run for this wave* rather than *was a config
  present* — a question a hook that never executed also satisfies. A hook that
  was never armed, never registered by the host, or that bailed on an old Node
  all leave the same trace: nothing. It also compares the enforced boundary
  against the plan's, catching a stale or hand-widened config.
- **Node < 22 no longer fails open silently.** The hook imported `matchesGlob`
  as a *named* export, so on older Node it was a parse-time SyntaxError — exit 1,
  not exit 2, therefore not a deny. Writes proceeded with an error on every edit.
  A named import cannot be guarded, which is precisely why this shipped
  undetected; it is now a default import with a capability check that exits 0
  with one clear message. Still fail-open, deliberately — wedging every edit in
  someone's repo over a runtime version is worse — but the missing receipt now
  makes it visible to the audit.
- **Plan format v3**: optional `enforcement: required | none`, default `none`.
  wavecheck BLOCKs an unenforced wave only when the plan claims enforcement, so
  plans 001–004 audit exactly as before. v2 and v3 are both supported; the bump
  retires nothing. planwright writes `required` on new plans.
- **`docs/plans/README.md`** explains why two of the four reference plans FAIL
  `validate-plan`. They are real defects the validator found on its first run,
  missed by three layers of review, and they stay unedited because execution
  history is not a draft. Without that page a new reader reasonably concludes the
  tool is broken, when it is the tool's best demonstration.
- **A worked wave lifecycle in the plugin README** — arm, run, audit, close. The
  mechanism was described twice and never shown.
- Hook self-check is now 12 cases, adding the receipt on both paths and the
  old-Node fail-open. The latter needed `spawnSync`: the case is expected to
  succeed, and `execFileSync` only surfaces stderr on failure, so the assertion
  would have been blind exactly when the behaviour was correct.

A6 does not move. It still needs a session that did not write the hook to watch
it deny a real edit, and the site literals that force its caveat stay required.

## 0.6.0 — 2026-08-21

The first release that ships **code**. Every prior version enforced its contract
with prose, and the field record showed prose not holding: plan 004 logged an
ownership breach whose stated cause was that the work ran inline, where no
instruction binds, and a wave gate that was skipped because "continue" read as
authorisation. v0.5.1 answered both with four more refusals. This release
answers them with three programs, and states what they cannot do.

**Implemented directly rather than as a plan 005** — by this plugin's own new
size guidance the change sits in the short-form band, and dogfooding a plan whose
subject is enforcement would have cost more than it taught. Logged here because
the alternative was to not say it.

- **Ownership is enforced by a `PreToolUse` hook** (`hooks/enforce-owns.mjs`).
  Reads `.drydock/wave-owns.json`, denies any Write/Edit/NotebookEdit to a path
  no task in the active wave owns. Wave-level, because hook input exposes no
  subagent identity and a wave runs N executors at once. **Inert when the file is
  absent** — the normal state of a repo, and the escape hatch that makes `deny`
  safe. **Fails closed when the file is present but unparseable**, because a
  broken enforcement control must not become no enforcement. **Ceilings: Bash
  writes bypass file-tool hooks entirely**, and paths outside the project
  directory are not enforced. `hooks/enforce-owns.test.mjs` covers ten cases,
  including both Windows path separators.
- **`scripts/drydock-audit.mjs`**, two subcommands, no dependencies.
  `validate-plan [--strict]` gives planwright's own output the runnable criterion
  it demands of every task it writes. `audit-wave` computes wavecheck's ownership
  audit from per-task commits and **prints the SHAs and file lists it derived** —
  never a bare verdict, because a wrong script is more dangerous than a wrong
  model when it looks authoritative. Lenient by default so it does not red-flag
  plans written before it existed; `--strict` for newly authored plans.
- **Found on its first run, in this repo's own plans:** two plans place a task in
  the same wave as a task it depends on, so those waves cannot run in parallel as
  declared (001 T2.3.1→T2.3.2, 004 T2.1.2→T2.1.1). Neither was caught by a
  wavecheck, a quality review, or an adversarial pressure test.
- **Found by the audit and worth a contract fix later:** the checkpoint subject
  `drydock(<task-id>): …` carries no plan id, and task ids repeat across plans —
  `drydock(T2.0.1)` matches a commit in two different plans here. `audit-wave`
  scopes its search to the plan's recorded Baseline SHA and says so when a plan
  records none.
- **planwright right-sizes its own ceremony.** Under ~5 files it advises against
  planning at all rather than refusing; ~5–15 takes a short form with no pressure
  test and no phase review; over ~15 is the full workflow. Thresholds are marked
  assumed, not measured.
- **planwright will not declare `video` evidence**, now checked mechanically in
  `--strict` rather than only asked for in prose (v0.5.1).
- **The orchestrator writes and deletes `.drydock/wave-owns.json`** around each
  wave; the format contract carries the shape and the warning that a stale file
  blocks the next unrelated edit.
- **Honesty matrix drift now fails a gate.** `site/scripts/assert-matrix.mjs`
  joins `npm run verify`: a PENDING row may not have evidence in the verification
  log, a row citing the log must have it, and a plan logging a skipped gate must
  be accounted for in the A3 ledger. Written before the fix and **observed failing
  on three real drifts**, then made green: A5 moved PENDING → OBSERVED, and A3
  moved 22/22 across 3 plans → 27/28 across 4, with the skip stated.
- **First cost figure published** — [docs/cost-001.md](../docs/cost-001.md).
  Includes the number it could not capture (token spend was never instrumented)
  and says so, because the economy claim is otherwise unevidenced.

## 0.5.1 — 2026-08-21

Guardrails harvested from plan 004's own execution. Every item here is a
refusal or a check that plan wanted and did not have — applied from
[its reconcile report](../docs/plans/004-seatrial-e2e-gate.md), which proposed
them rather than applying them itself.

- **`reconcile` refuses to close a plan whose human phase gate is unsigned.**
  Previously its ladder read the verdict sheet and wave-PASS status only, so a
  plan with all waves PASS and a properly attributed `GO-WITH-OVERRIDES` sheet
  would close with nobody having signed the phase gate. Plan 004 reached exactly
  that state; only the orchestrating session holding back by hand stopped it.
- **The format contract freezes how a closed phase gate is recorded** —
  `**Phase gate: CLOSED, approved by <name> — <date>.**` — so the refusal above
  has something unambiguous to read, and no skill infers a human's approval from
  surrounding prose.
- **`planwright` will not declare an evidence type the driver cannot capture.**
  Confirm the capability in the authoring session; default to `screenshot` or
  `network assertion` otherwise. `video` is a per-`BrowserContext` setting fixed
  at creation, so a Playwright MCP server started without video saving cannot
  produce it by any call — plan 004's only NO-GO came from a case declaring it
  on paper, a red that described the harness rather than the software.
- **`planwright`'s self-review checklist now requires every acceptance criterion
  to have been RUN before its task block is frozen** — both that it can fail and
  that it can *pass*. Three criteria in plan 004 broke this way: one unpassable
  whatever the repo state, one already satisfied before its task began, one
  grepping a heading level the target file never uses.
- **The orchestrator contract states what survives when executors cannot be
  spawned**: log it as a deviation before the wave opens, stage only owned files
  by hand, and tell wavecheck the diff is self-authored. Inline execution caused
  four of plan 004's fourteen deviations, including its one real ownership
  breach.

No behaviour changes to `seatrial`, `wavecheck` or `replan`.

## 0.5.0 — 2026-08-20

Adds a browser-based E2E verification gate. Planned with planwright and executed
under its own gates ([plan 004](../docs/plans/004-seatrial-e2e-gate.md)), which
is also where every defect below was caught.

- **Plan format: new required section `## Testing Gate` at position 11.**
  Written end-to-end cases, authored at plan time, each with an id, title,
  preconditions, Given/When/Then steps, an expected result, exactly one declared
  evidence type (`screenshot` | `video` | `network assertion`) and a severity
  (`blocker` | `major` | `minor`). The gate rule is prose: any blocker FAIL is
  NO-GO, a major FAIL needs a recorded human override naming case, reason and
  decider, a minor FAIL is recorded only, and a case that **cannot** be run is
  neither a pass nor a skip but a HALT. Plans with no user-facing surface write
  `N/A — <reason>`; a bare "N/A" is not valid.
- **No `format_version` bump, deliberately.** The rule this project set itself
  says a new required section forces one — but the section is N/A-able, and
  bumping to 3 would make every consumer refuse plans 001–003, which are v2, in
  exchange for nothing a reader gains. Consumers keep accepting v2.
- **New skill `seatrial`.** Executes the gate through Playwright MCP, captures
  the declared evidence per case under `.drydock/testing/<plan-id>/<case-id>/`,
  generates re-runnable `.spec.ts` files, and writes the go/no-go sheet at
  `.drydock/testing/<plan-id>/verdict.md`. Model-invocable, like wavecheck,
  because plans name it as a gate.
  - **It halts rather than degrades.** MCP absent → stop with install
    instructions, and explicitly no fallback to raw CDP, `curl`, `fetch` or a
    headless screenshot flag: those answer a different question than "does this
    work in a browser". Gate stale against the baseline SHA → stop. Step not
    performable as written → FAIL with reason `step not executable`, plus a HALT
    when it reads as a plan defect rather than an app defect. False precondition
    → HALT for that case, not FAIL, because recording it as failed blames the app
    for the harness.
  - **A subset run writes no sheet.** There is no partial verdict: reconcile
    branches on exactly missing / NO-GO / GO-WITH-OVERRIDES / GO, so a fourth
    value would leave it with no rule and a plan could close on a run that
    verified part of it. This shipped wrong first — an earlier draft returned
    `PARTIAL`, wavecheck BLOCKed the wave for it, and the fix narrowed the skill
    rather than widening the contract.
  - Unrun generated specs are labelled `GENERATED, NOT EXECUTED`. No dependency
    is ever added unasked.
- **reconcile refuses to close an unverified plan.** If the plan declares a
  Testing Gate that is not `N/A`, reconcile reads the frozen verdict path and
  refuses when it is missing or NO-GO; `GO-WITH-OVERRIDES` proceeds only when
  every failed major case carries an override naming its decider. Same shape as
  the existing "any wave lacks a PASS" refusal. Reconcile does not run the gate:
  it is a closer, not a verifier.
- **planwright interviews for it, and its checklist enforces it.** Step 1 asks
  for base URL plus start command, auth approach, evidence retention and
  severities when a browser-drivable surface exists; step 6 writes the section;
  the self-review checklist fails an absent section on a UI-touching plan or a
  bare "N/A", and requires at least one designed-to-fail case — a gate nobody has
  watched fail is not known to work.
- **Two stale section citations corrected**, and both told to locate their
  section by name rather than by ordinal: wavecheck 14 → 15, reconcile 16 → 17.
  Release 0.4.0 already fixed these once; counting is the defect, not the count.
- **`plugin.json`** gains `e2e_dir` (default `e2e`), following the `plans_dir`
  shape. It does **not** gain a configurable evidence root: an earlier draft did,
  and the phase's quality review rejected it, because the contract calls that root
  frozen so seatrial and reconcile cannot disagree about where a verdict lives. A
  relocatable root reintroduced exactly that drift — the draft skill had already
  split into two forms inside one file.

**Not verified, and not claimed to be.** The gate has never been executed. A new
compatibility row **A5 — Playwright MCP availability** is registered as PENDING:
the MCP was absent from the session that built this, so plan 004's Phase 2 is
BLOCKED on it rather than assuming it works. No screenshot, video or verdict
sheet has been produced by this release, and the row does not move without a
dated verification-log entry.

Deliberately NOT changed, having been considered and rejected:

- **A hook that blocks a wave until a verdict exists.** Every Drydock gate is
  prose that a human reads; a mechanical gate would be a different product.
- **Adding `@playwright/test` to this repo.** seatrial generates spec files and
  asks before touching any `package.json`. A generated suite nobody has run is
  not a re-runnable suite, and labelling it as one would be the over-claim the
  honesty rule forbids.
- **Giving wavecheck any Testing Gate duty.** It audits waves; the gate runs
  after the final wave.

## 0.4.1 — 2026-08-19

- **plan-format: worktree merge procedure gains step 2a.** A2b verified the
  procedure works, and found that its wording invited a false inference: step 2
  said conflicts indicate a defect, which reads as though conflict-freeness
  indicates compliance. It does not. A rogue edit conflicts only if a sibling
  touched the same file; a non-colliding unowned edit merges cleanly and lands
  silently — measured. Step 2a states the one-way implication, names the
  ownership audit as the only defence, and explains why step 1's ordering is
  load-bearing. Steps 1 and 3 annotated with the same run's evidence.
- No `format_version` bump: this adds no required section, field, or task-block
  shape, so no consumer would refuse an existing v2 plan. Bumping would force
  every skill to reject every existing plan over a wording fix.

## 0.4.0 — 2026-08-19

Field-driven fixes from the first full pilot plan (001-drydock-homepage: 2 phases,
16 waves, 14 wavecheck PASSes, 49 deviations). Each change below traces to an
observed failure, not to speculation.

- **executor / executor-isolated: checkpoint ordering is now a stated rule.**
  Seven executors across one plan finished verified work and lost its attribution
  by stopping before committing — turn exhaustion, a transient API error, a
  silent turn-end, a stalled stream. Raising `maxTurns` 30 → 60 did not help,
  because the ceiling was never the cause. The contract now says: commit the
  moment the owned files satisfy the criterion, before the completion report, and
  explains that finished-but-uncommitted work is indistinguishable from no work.
  Adds a rule for a presumed-dead executor that revives with a commit already
  present (two commits sharing a task-id subject destroyed attribution once).
- **wavecheck: corrected a stale section reference.** It instructed appending
  reports "under §8"; in a v2 plan §8 is *Open questions* and Wavecheck reports
  are position 14. Now references the section by name.
- **reconcile: same bug, same fix.** It said "append as §9"; §9 is *Out of scope /
  follow-ups* and the Reconcile report is position 16.
- **planwright: three new self-review checklist items**, each from a defect that
  reached execution — a Decision must be cited in its consuming task's brief to
  count as closed; contract rules must be written as complete rule bodies rather
  than deltas; and acceptance criteria must be provably failable, with gates for
  text-invisible defects verified by deliberately introducing the defect.

Deliberately NOT changed, having been considered and rejected:

- Widening `reconcile`'s `docs_targets` to reach plugin files. It is already
  user-configurable; the default excluding plugin paths is correct for the repos
  Drydock is installed into.
- Requiring a phase to own its shell/config files. Shell defects are discovered
  unpredictably; appended repair waves are the correct mechanism and worked four
  times under gate. Owning files a phase does not need to change would violate
  surgical scope.
- No `format_version` bump: the checklist additions are planwright-side
  validations, not new required fields in the plan format.

## 0.2.0 — 2026-08-18

- Merged the team's production planwright skill as the flagship (Wave-0 contracts, T0 baseline, context briefs, 4-tier rubric, escalation ladder, SHA staleness check, adversarial pressure-test, practices interview bank).
- Plan format contract v2: team template + Drydock execution contract unified (task IDs T<p>.<w>.<n>, statuses DRAFT/APPROVED/EXECUTING/BLOCKED/DONE/RECONCILED).
- Review split formalized: wavecheck = conformance audit (gate), Wave x.R = quality review (post-PASS); no retries on contract breaches.
- Added VERIFICATION.md pre-flight checklist and minimal worktree merge procedure.

## 0.1.0 — 2026-08-18

Initial internal release.

## 0.3.0 — 2026-08-18

- Dry-run-driven fix: per-task checkpoint commits mandatory in default mode; wavecheck attributes ownership per commit, BLOCKs when commits are missing; executor report gains checkpoint_commit field.
- VERIFICATION.md updated with dry-run evidence and A4 pass.

## 0.3.1 — 2026-08-18

- VERIFICATION.md graduated out of the plugin into repo docs/: evidence → docs/self-audit.md, runtime checklist → docs/compatibility.md. Installs stay lean; the repo keeps the story.
