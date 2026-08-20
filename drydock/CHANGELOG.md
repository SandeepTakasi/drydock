# Changelog

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
