# Changelog

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
