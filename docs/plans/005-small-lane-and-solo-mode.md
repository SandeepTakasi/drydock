---
plan: 005-small-lane-and-solo-mode
format_version: 3
status: EXECUTING
isolation: none
enforcement: required
attribution: manifest
lane: small
execution: solo
created: 2026-09-01
approved_by: sandeep
---

# 005 — A small-plan lane, and plans that admit they run solo

> **Execution protocol.** This plan declares `execution: solo`: tasks are run
> in-session by the orchestrator, NOT spawned as `drydock:executor` subagents.
> That is a property of the plan, recorded once here, and it must not be logged
> as a per-wave deviation. Before starting the wave, run the staleness check
> below. When the wave's tasks are done, invoke `drydock:wavecheck` with this
> plan path and wave id. On BLOCK, set status BLOCKED and stop — do not
> self-repair; the paths out are `/drydock:replan` or a human decision.
> Wavecheck BLOCKs on ownership violations or unlogged deviations get NO
> retries. `lane: small` means one wave, one gate, no Wave x.R quality-review
> task and no phase review. When the wave and the phase gate pass, invoke
> `drydock:reconcile`.

**Staleness check (before the wave):**
`git diff 6797317..HEAD -- drydock/skills/ drydock/scripts/`. Non-empty → the
wave is STALE: re-validate its tasks against current code and update the
baseline SHA and Decision Log before executing.

## 1. Requirement

Close [#4](https://github.com/SandeepTakasi/drydock/issues/4) and
[#1](https://github.com/SandeepTakasi/drydock/issues/1). Both report the same
thing from different angles: **the plan format assumes a fleet of parallel
executors, and solo or sequential runs pay for machinery they never use.**

- **#4** — ~20 five-check wave gates for one feature with no parallel critical
  path, because RED and implementation land in separate waves. Add a small-plan
  lane; stop forcing the split.
- **#1** — every plan run under a standing no-unprompted-agents rule opens with
  the same Deviation 1: *"tasks executed in-session by the orchestrator."* Emit
  a solo-mode plan instead of asserting a fleet and then caveating it.

## 2. Spec reference

The two issues above are the spec. Contract under change:
`drydock/skills/planwright/reference/plan-format.md`.

## 3. Surgical-scope statement

Two optional v3 header keys, their consequences in four prose files, and the
validator changes that hold plans to them. No change to the ownership audit,
the enforcement hook, attribution, `seatrial`, or `reconcile`.

## 4. Baseline

- **Baseline SHA:** `6797317`
- **T0 records:** `node drydock/scripts/drydock-audit.test.mjs` (expect 24/24),
  `node drydock/hooks/enforce-owns.test.mjs` (expect 12 cases), and
  `for f in docs/plans/*.md; do node drydock/scripts/drydock-audit.mjs validate-plan "$f"; done`
  — expect 002/003 PASS, 001/004 FAIL on their one documented same-wave
  dependency, README SKIP. **Those two FAILs are the pre-existing state and must
  survive this plan unchanged** (see Decision 4).
- **T0 result, 2026-09-01, at `6797317`:** staleness check empty (not stale).
  `drydock-audit.test.mjs` 24/24. `enforce-owns.test.mjs` PASS, 12 cases.
  Validator sweep: 002 PASS, 003 PASS, 001 FAIL(1), 004 FAIL(1), README SKIP,
  and **005 FAIL(9) — nine same-wave dependencies and nothing else**, which is
  the state Decision 3 predicted and T1.0.2 closes. Baseline is green; no
  pre-existing failure is scoped out of any acceptance criterion.

## 5. Practices in effect

| Practice | Setting | Source |
|---|---|---|
| Execution | **Solo** — no executor subagents | user, 2026-09-01 |
| Testing | Test-after, **proven failable** (revert the logic, watch it fail) | user, 2026-09-01 |
| Lane | `small` — one phase, one wave, one gate | user, 2026-09-01 |
| Commit granularity | One checkpoint commit per task, `task-close` after each | `attribution: manifest`, v0.7.2 |
| Quality gates | `drydock-audit.test.mjs`, `enforce-owns.test.mjs`, `cd site && npm run verify` | CLAUDE.md |
| Branching | Feature branch, `--ff-only` merge to main, direct push | this session's four prior releases |
| Tracker | GitHub Issues; the issues close via commit trailer, no mirroring task | user |

## 6. Findings & constraints

1. **The RED/implementation split is nowhere stated — it is forced by
   contradictory text.** `planwright/SKILL.md:45` ("tests appear as the first
   task of every wave") and its checklist at `:126` ("test task precedes
   implementation task in every wave") describe an ordering *within* a wave,
   but same-wave tasks are declared parallel, so that ordering is precisely the
   same-wave dependency `validate-plan` rejects. The only valid reading left is
   wave-splitting. **#4's root cause is two lines of prose.**
2. **`validate-plan`'s same-wave-dependency check is only correct under a
   fleet.** Under `execution: solo` tasks run in sequence, so a same-wave
   dependency holds fine. The check must become conditional — which is also why
   this plan does not validate until T1.0.2 lands (Decision 3).
3. **#1's evidence overstates the symptom.** `wavecheck/SKILL.md` contains no
   independence language at all, and "independence caveat" appears once in the
   whole plan corpus, in plan 004's reconcile report — not in every wavecheck
   report. The underlying claim holds: plan 004 deviation 1 is exactly this, and
   this repo's sessions run under a standing no-agents rule.
4. **The practices interview never asks whether executors will be spawned.** The
   nearest question is "appetite for parallelism: how many concurrent
   subagents" — a number, not a yes/no, and it is asked about capacity rather
   than intent.
5. **Two optional-key precedents exist and both work:** `enforcement:` (v0.7.0)
   and `attribution:` (v0.7.2). Optional, back-compatible default, validated
   against a closed enumeration, written on new plans by planwright. The two new
   keys follow that shape exactly and nothing about plans 001–004 changes.

## 7. Decision Log

| # | Question | Decision | Who | Why |
|---|---|---|---|---|
| 1 | Solo or fleet for this plan's own execution? | **Solo.** | user | It is what actually happens here, and it makes 005 the first real exercise of the feature it adds. Consumed by the header `execution: solo` and the Execution protocol. |
| 2 | How is the small lane selected? | **Header key `lane: small \| full`, default `full`.** | user | The plan records which lane it took, so an auditor sees whether the ceremony matched the change instead of inferring it. Deriving it from the file-count table alone leaves nothing holding a "small" plan small. Consumed by T1.0.1 and T1.0.2. |
| 3 | This plan does not pass `validate-plan` until its own T1.0.2 lands. Split it, or accept it? | **Accept, and make it the acceptance criterion.** T1.0.2's criterion is that `validate-plan --strict` on this file exits 0. | planwright *(assumed — flag if wrong)* | A criterion that fails before the task and passes after is the failable criterion the checklist demands, and here it is the feature itself. Splitting the plan to dodge it would hide the very behaviour under test. Consumed by T1.0.2. |
| 4 | Do plans 001–004 change? | **No.** Defaults are `lane: full`, `execution: fleet`; 001 and 004 keep their documented same-wave-dependency FAILs. | planwright *(assumed — flag if wrong)* | Same rule as every prior optional key: execution history is not a draft, and `docs/plans/README.md` documents those two FAILs as deliberate. A fix that silently turned them green would destroy that evidence. Consumed by T0 and T1.0.2. |
| 5 | Testing approach? | **Test-after, proven failable.** | user | Matches the repo's existing idiom, and keeps test and implementation in one task — which is what #4 asks the format to allow, so the plan demonstrates the fix instead of contradicting it. |
| 6 | Short-form track (5–15 files) — pressure test and phase review? | **Both skipped**, per the right-size table. | planwright *(assumed — flag if wrong)* | 10 files. Applying full ceremony to the change that exists to reduce ceremony would be self-refuting. Recorded in §12. |

## 8. Open questions

None. No task is BLOCKED.

## 9. Out of scope / follow-ups

- **`wavecheck/SKILL.md` check 1 says `format_version` supported "(v2)"** while
  v3 has existed since v0.7.0. A one-word staleness bug found during
  exploration, in a file this plan already touches. Left out deliberately: it is
  not needed for #4 or #1, and folding it in is the "while we're here" creep the
  scope statement forbids.
- Retrofitting `lane:`/`execution:` onto plans 001–004 (Decision 4).
- Issues #3, #6, #7 remain open and are untouched.

## 10. Execution policies

- **Review protocol:** one `drydock:wavecheck` gate after wave 1.0. No Wave 1.R
  quality-review task and no phase review — `lane: small`.
- **Escalation:** wavecheck BLOCK on ownership or unlogged deviation → no
  retries, go to `/drydock:replan` or a human.
- **Checkpointing:** one commit per task, staging only owned files, followed by
  `drydock-audit.mjs task-close docs/plans/005-small-lane-and-solo-mode.md <id>`
  — this plan declares `attribution: manifest`, so the commit subject follows
  repo convention and the manifest carries attribution.
- **Human gate:** the phase gate is human-signed before `reconcile` runs.
- **Independence, stated once:** under `execution: solo` the session that writes
  the diff is the session that audits it. Wavecheck's mechanical checks are
  unaffected — ownership per commit and acceptance criteria are evidence, not
  opinion — but its judgement calls are weaker, and that is the cost the user
  accepted in Decision 1. It is not a per-wave deviation.

## 11. Testing Gate

N/A — this plan changes a plugin's markdown contracts and one Node script. It
ships no UI, no API and no browser-drivable surface; the site is touched only by
the version string, which `site/scripts/assert-copy.mjs` already gates inside
`npm run verify` (T1.0.6's criterion).

## 12. Pressure-test verdict

Skipped — short-form track, per the right-size table's 5–15 row and Decision 6.

## Phase 1: Two keys, and the text that stops fighting them

**Exit state:** `lane:` and `execution:` are defined, validated, written by
planwright, and honoured by wavecheck; the RED/impl contradiction is gone; the
plugin ships as 0.8.0 with `npm run verify` green.
**Phase gate:** `node drydock/scripts/drydock-audit.test.mjs`,
`node drydock/hooks/enforce-owns.test.mjs`, the full `validate-plan` sweep, and
`cd site && npm run verify` — plus human sign-off.

#### T0 — Baseline verification
- **Description:** Runs every quality-gate command in §4 on the untouched
  codebase and records SHA + results in Baseline.
- **Files owned:** — (read-only; writes §4 of this plan only)
- **Depends on:** —
- **Model / thinking:** Mechanical / off (Haiku)  **Executor:** in-session (solo)
- **Context brief:** This plan §4.
- **Acceptance criterion:** `bash -c 'node drydock/scripts/drydock-audit.test.mjs && node drydock/hooks/enforce-owns.test.mjs'` exits 0.

### Wave 1.0 — the whole change

> One wave, executed sequentially in-session (`execution: solo`). The
> `Depends on:` fields below are real execution order, not a parallelism claim
> — which is exactly the distinction T1.0.2 teaches the validator.

#### T1.0.1 — Define `lane:` and `execution:` in the format contract
- **Description:** Add both optional v3 keys to the frontmatter block, each with
  its default and its consequences. Define the small lane concretely: one phase,
  one wave, one gate, no `Wave x.R`, no pressure test. Define solo mode: no
  executor spawning, same-wave dependencies legal, independence stated once in
  the header rather than per wave.
- **Files owned:** `drydock/skills/planwright/reference/plan-format.md`
- **Depends on:** —
- **Model / thinking:** Judgment / extended (Opus)  **Executor:** in-session (solo)
- **Context brief:** This plan §1, §6 findings 1–2 and 5, Decisions 2 and 3. The
  existing `enforcement:` and `attribution:` key blocks in the same file are the
  shape to copy — optional, defaulted, closed enumeration.
- **Forbidden:** changing any existing key's default; touching the Worktree
  merge procedure.
- **Acceptance criterion:** `bash -c 'f=drydock/skills/planwright/reference/plan-format.md; grep -q "lane: small | full" "$f" && grep -q "execution: solo | fleet" "$f" && grep -q "default full" "$f" && grep -q "default fleet" "$f"'` exits 0.

#### T1.0.2 — Validate the keys, and make the same-wave rule fleet-only
- **Description:** Validate both keys against closed enumerations, rejecting an
  unknown value rather than defaulting through it. Gate the same-wave-dependency
  error on `execution` being fleet (absent counts as fleet). Add a small-lane
  shape check: a `lane: small` plan may declare at most one implementation wave.
  Cover all of it in the existing test harness.
- **Files owned:** `drydock/scripts/drydock-audit.mjs`,
  `drydock/scripts/drydock-audit.test.mjs`
- **Depends on:** T1.0.1
- **Model / thinking:** Complex / extended (Sonnet)  **Executor:** in-session (solo)
- **Context brief:** This plan §6 finding 2, Decisions 3 and 4. In
  `drydock-audit.mjs`, the `ATTRIBUTION_MODES` constant and the
  `attribution`-validation block are the pattern; the same-wave error lives in
  the "dependencies point backwards" block. Test style: the existing 24 cases.
- **Forbidden:** changing the ownership audit, `task-close`, `plan-status`, or
  the enforcement-log check. **Plans 001 and 004 must still FAIL** on their
  same-wave dependency — they default to fleet.
- **Acceptance criterion:** `bash -c 'node drydock/scripts/drydock-audit.mjs validate-plan --strict docs/plans/005-small-lane-and-solo-mode.md && ! node drydock/scripts/drydock-audit.mjs validate-plan docs/plans/001-drydock-homepage.md'` exits 0 — this plan validates, and 001 still does not. (The `; test $? -eq 1` form drafted first PASSED against the untouched repo: `&&` short-circuited, so it succeeded exactly when this plan was invalid.)

#### T1.0.3 — Name the lanes in planwright, and delete the RED/impl contradiction
- **Description:** Turn the right-size table's rows into the named lanes, tell
  planwright to write both keys, and fix the two lines that force RED and
  implementation into separate waves — TDD orders tasks within a wave under
  solo, and a wave boundary is a synchronisation point that red/green does not
  need.
- **Files owned:** `drydock/skills/planwright/SKILL.md`
- **Depends on:** T1.0.1
- **Model / thinking:** Judgment / extended (Opus)  **Executor:** in-session (solo)
- **Context brief:** This plan §6 finding 1 and Decisions 2 and 5. The two
  offending lines are `SKILL.md:45` and the checklist item at `:126`. The
  `enforcement:` instruction in step 4 is the shape for the new key
  instructions.
- **Forbidden:** changing the model rubric or the atomicity test.
- **Acceptance criterion:** `bash -c 'f=drydock/skills/planwright/SKILL.md; grep -q "lane: small" "$f" && grep -q "execution: solo" "$f" && ! grep -q "test task precedes implementation task in every wave" "$f"'` exits 0.

#### T1.0.4 — Ask whether executors will actually be spawned
- **Description:** Add the question to the interview's *Execution preferences*
  block: will `drydock:executor` subagents actually be spawned, or will the
  orchestrator run tasks in-session? It is a yes/no about intent, distinct from
  the existing capacity question about parallelism appetite.
- **Files owned:** `drydock/skills/planwright/reference/practices-interview.md`
- **Depends on:** T1.0.1
- **Model / thinking:** Standard / default (Sonnet)  **Executor:** in-session (solo)
- **Context brief:** This plan §6 finding 4 and Decision 1. The existing
  *Execution preferences* block and its question style — each question carries a
  parenthetical saying what it affects.
- **Forbidden:** touching the End-to-end verification block.
- **Acceptance criterion:** `bash -c 'f=drydock/skills/planwright/reference/practices-interview.md; grep -qi "spawned" "$f" && grep -q "execution: solo" "$f"'` exits 0.

#### T1.0.5 — Teach wavecheck to read `execution: solo`
- **Description:** Wavecheck reads the header, states the reduced-independence
  caveat once from it, and does not treat in-session execution as a deviation.
  The mechanical checks are explicitly unchanged.
- **Files owned:** `drydock/skills/wavecheck/SKILL.md`
- **Depends on:** T1.0.1
- **Model / thinking:** Standard / default (Sonnet)  **Executor:** in-session (solo)
- **Context brief:** This plan §6 finding 3, §10's *Independence, stated once*,
  and Decision 1. Check 1 (plan integrity) is where the header is already read.
- **Forbidden:** changing checks 2–5; fixing the stale "(v2)" in check 1 (§9).
- **Acceptance criterion:** `bash -c 'f=drydock/skills/wavecheck/SKILL.md; grep -q "execution: solo" "$f" && grep -qi "not a deviation" "$f"'` exits 0.

#### T1.0.6 — Cut 0.8.0
- **Description:** Changelog entry for both issues, and the version in the three
  places `assert-copy.mjs` pins together. Minor bump, not patch: the plan format
  gains two keys.
- **Files owned:** `drydock/CHANGELOG.md`, `drydock/.claude-plugin/plugin.json`,
  `site/content/copy.ts`, `README.md`
- **Depends on:** T1.0.1, T1.0.2, T1.0.3, T1.0.4, T1.0.5
- **Model / thinking:** Standard / default (Sonnet)  **Executor:** in-session (solo)
- **Context brief:** This plan §1 and the Decision Log. The 0.7.2 and 0.7.3
  changelog entries are the house style; `site/content/copy.ts` holds `VERSION`
  and the footer date.
- **Forbidden:** editing any required copy literal in `content/copy.ts` other
  than `VERSION` and the footer date.
- **Acceptance criterion:** `bash -c 'v=$(node -p "require(\"./drydock/.claude-plugin/plugin.json\").version"); test "$v" = "0.8.0" && grep -q "## 0.8.0" drydock/CHANGELOG.md && grep -q "v0.8.0" README.md && (cd site && npm run verify)'` exits 0.

## Deviation Log

| # | Task | What deviated | Why | Impact | Recorded |
|---|------|---------------|-----|--------|----------|
| 1 | T1.0.6 | `drydock/CHANGELOG.md` was written through Bash (a `python` heredoc) rather than a file tool, so that write left **no entry in `.drydock/enforcement.log`**. | The session's standing instruction prefers Bash for file edits, and the long changelog entry was written with a heredoc out of habit. | **Minor, and it is the documented A6 ceiling rather than a surprise:** Bash-mediated writes bypass `PreToolUse` file-tool hooks entirely. The file is inside T1.0.6's `owns`, the ownership audit reads the commit rather than the log, and the wave carries 13 receipts from its other writes — so `enforcement: required` is satisfied. What is lost is one write's receipt, which is why `audit-wave` is the backstop. | orchestrator, at wave close |
| 2 | — (orchestrator) | The hook **denied** an edit to this plan document while wave 1.0 was still armed. | Orchestrator bookkeeping was attempted before closing the wave; the plan file is owned by no task, by design. | **None — this is the mechanism working, and it is the wave's most useful result.** It is the same mixture that produced plan 004's deviation 13 (`5a32ac9` staged the plan document alongside a task's owned file), and here it was refused at the tool boundary instead of being caught by a retroactive audit. The correct response was to close the wave and then write, not to widen the boundary — which is what the denial message says to do. Receipt: 1 deny, 12 allows. | orchestrator, at wave close |
| 3 | — (gate) | `drydock:wavecheck` for this wave runs from the **session-cached 0.7.0 copy** of the skill, which predates T1.0.5's solo handling. | Plugin skill files load at session start; T1.0.5 edited `wavecheck/SKILL.md` in this same session. | **Material for what the gate proves, not for its verdict.** T1.0.5 changes no mechanical check, so the ownership and criteria evidence stands. But **T1.0.5 is itself unexercised** — the gate that ran could not read `execution:` and so could not have honoured it. Shipped-but-unproven until a later session gates a solo plan; same rule as CLAUDE.md's skill-cache note. The same caveat applies to T1.0.3 and T1.0.4, which are planwright prose this session cannot re-invoke. | orchestrator, at wave close |

## Wavecheck reports

## Progress log

| Date | Task | Result | Notes |
|------|------|--------|-------|

## Reconcile report

*Appended once by `drydock:reconcile` at completion.*
