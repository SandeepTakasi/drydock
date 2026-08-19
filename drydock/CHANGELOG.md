# Changelog

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
