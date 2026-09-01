---
plan: 005-small-lane-and-solo-mode
format_version: 3
status: RECONCILED
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
**Phase gate: CLOSED, approved by sandeep — 2026-09-01.**
Conditions met: `drydock-audit.test.mjs` 33/33; `enforce-owns.test.mjs` PASS,
12 cases; the full `validate-plan` sweep (002/003/005 PASS, 001/004 FAIL on
their one documented same-wave dependency, README SKIP); `cd site && npm run
verify` exit 0 with `assert-copy` reporting `version matches plugin.json`; and
wavecheck 1.0 PASS on all five checks.

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
| 4 | — (post-gate) | `plan-status` calls this plan's `status: EXECUTING` a contradiction once its only wave passed, and `--write` refuses because DONE and RECONCILED are both consistent. | **Discovered after wavecheck 1.0 was written.** The 0.7.3 derivation treats *every wave has a PASS report* as *the plan should be closed* — but this plan's §10 requires a **human-signed phase gate** before `reconcile`, and that gate is still open. | **Minor, and a real gap in v0.7.3 rather than in this wave.** The derived state has no notion of an outstanding human gate, so it reports a contradiction where `EXECUTING` is in fact correct. Status is deliberately left at `EXECUTING` pending the phase-gate signature; setting `DONE` to satisfy the tool would assert a gate nobody signed, which is the exact over-claim the check exists to prevent. Carried to `reconcile` as a proposed follow-up: the derivation should treat an unsigned phase gate as a legitimate reason to stay `EXECUTING`. | orchestrator, post-gate |

## Wavecheck reports

### Wavecheck 1.0 — PASS — 2026-09-01

**Independence, stated once (per `execution: solo`).** The session that wrote
this diff is the session auditing it. The mechanical checks below are unaffected
— ownership per commit and executed acceptance criteria are evidence, not
opinion — but the judgement in check 3 carries less weight than a fresh-context
auditor's would. This is the cost recorded in Decision 1, not a finding.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `format_version: 3`, `status: EXECUTING`, wave `1.0` exists, no prior waves to gate. **Noted, not blocking:** this skill's check-1 text still reads "supported (v2)" while the script's `SUPPORTED_FORMAT_VERSIONS` is `[2, 3]` and the plan validates at v3 — the stale string is §9's logged out-of-scope item, and T1.0.5 was forbidden to fix it. |
| 2. Ownership audit | PASS | `audit-wave 1.0` → **PASS (6 tasks, 6 commits, attribution: manifest)**. Every task's changed set ⊆ its `owns`; **"Outside owns: none" on all six rows**; working tree clean. Table pasted below. |
| 2b. Enforcement | PASS | `enforcement: required` satisfied: **13 hook decisions recorded for wave 1.0 — 12 allow, 1 deny.** The hook was genuinely live, not merely configured. The single deny is deviation 2 and is the mechanism working. One write (deviation 1) went through Bash and left no receipt — the documented A6 ceiling, considered and rejected as an innocent-cause explanation for the whole wave, since 13 other receipts exist. |
| 3. Forbidden audit | PASS | T1.0.1: no existing key line removed, Worktree procedure untouched. T1.0.2: diff is purely additive — ownership audit, `task-close`, `plan-status` and the enforcement check have zero removed lines. T1.0.3: only removal is a table separator (the right-size table gained a column); model rubric and atomicity test intact. T1.0.4: only removal is the parallelism question, re-added with a qualifier; End-to-end block untouched. T1.0.5: purely additive, so checks 2–5 **and the stale `(v2)` it was forbidden to fix** are verifiably untouched. T1.0.6: `copy.ts` diff is exactly one line, `VERSION`. |
| 4. Acceptance audit | PASS | All seven executed by the auditor, never taken on report: T0 `exit=0`, T1.0.1 `0`, T1.0.2 `0`, T1.0.3 `0`, T1.0.4 `0`, T1.0.5 `0`, T1.0.6 `0` (incl. `npm run verify` → `assert-copy: PASS … version matches plugin.json`). T1.0.2's criterion is the notable one: **it failed before its task and passes after** — this plan validates and 001 still does not. |
| 5. Deviation reconciliation | PASS | 3 deviations logged, all by the orchestrator before the gate. No unlogged deviation found in the diff. |

```
| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.0.1 | `f397ad9` | `drydock/skills/planwright/reference/plan-format.md` | `drydock/skills/planwright/reference/plan-format.md` | none |
| T1.0.2 | `f9cfdcc` | `drydock/scripts/drydock-audit.mjs`<br>`drydock/scripts/drydock-audit.test.mjs` | `drydock/scripts/drydock-audit.mjs`<br>`drydock/scripts/drydock-audit.test.mjs` | none |
| T1.0.3 | `13399e4` | `drydock/skills/planwright/SKILL.md` | `drydock/skills/planwright/SKILL.md` | none |
| T1.0.4 | `2fbeea2` | `drydock/skills/planwright/reference/practices-interview.md` | `drydock/skills/planwright/reference/practices-interview.md` | none |
| T1.0.5 | `6222011` | `drydock/skills/wavecheck/SKILL.md` | `drydock/skills/wavecheck/SKILL.md` | none |
| T1.0.6 | `8da47c7` | `README.md`<br>`drydock/.claude-plugin/plugin.json`<br>`drydock/CHANGELOG.md`<br>`site/content/copy.ts` | `drydock/CHANGELOG.md`<br>`drydock/.claude-plugin/plugin.json`<br>`site/content/copy.ts`<br>`README.md` | none |

Working tree: clean
  note: enforcement active: 13 hook decision(s) recorded for wave 1.0 (1 denied)
```

**Worth recording beyond the verdict:** not one of these six commits carries a
`drydock(<task-id>):` subject — attribution came entirely from
`.drydock/attribution.jsonl`. This is the first live exercise of `manifest`
mode (v0.7.2), of `task-close`, and of the wrapped-`Files owned:` parse
(v0.7.1), which read T1.0.2's two-line list correctly when arming the wave.

Deviations logged: 3 (0 discovered by wavecheck)

**Verdict: PASS.** `lane: small` means this is the plan's only wave, so the next
step is the human phase gate, then `drydock:reconcile` — there is no wave 1.R.

## Progress log

| Date | Task | Result | Notes |
|------|------|--------|-------|
| 2026-09-01 | T0 | DONE | Baseline green at `6797317`; 005 FAIL(9) as Decision 3 predicted. |
| 2026-09-01 | T1.0.1 | DONE | `f397ad9` — both keys defined in the contract. |
| 2026-09-01 | T1.0.2 | DONE | `f9cfdcc` — same-wave rule now fleet-only; 005 validates, 001 still does not. |
| 2026-09-01 | T1.0.3 | DONE | `13399e4` — lanes named, RED/impl contradiction deleted. |
| 2026-09-01 | T1.0.4 | DONE | `2fbeea2` — the spawn question added to the interview. |
| 2026-09-01 | T1.0.5 | DONE | `6222011` — wavecheck reads `execution:`. Unexercised (deviation 3). |
| 2026-09-01 | T1.0.6 | DONE | `8da47c7` — 0.8.0 cut, `npm run verify` green. |
| 2026-09-01 | Wave 1.0 | **PASS** | wavecheck 1.0 PASS, 3 deviations, 0 discovered by wavecheck. |

## Reconcile report

**Plan:** 005-small-lane-and-solo-mode · **Reconciled:** 2026-09-01 ·
**Precondition:** 1 implementation wave, 1 wavecheck report, PASS, zero BLOCK.
`lane: small` takes no `Wave x.R` by design. Phase gate CLOSED, approved by
sandeep — 2026-09-01. Testing Gate is `N/A` with a reason, so no verdict sheet
is required. Proceeding.

## Deviation synthesis

Four deviations, three root causes, and **none of them is cluster (b) ambiguous
instructions or (d) executor overreach** — the two that would indict the plan or
its executor. All three are (a) *a false assumption about the environment*,
which is the cluster that produces doc proposals.

| Cluster | Deviations | Root cause |
|---|---|---|
| (a) assumption false — tool mediation | 1, 2 | The ownership hook's real operating envelope was assumed rather than known: which writes it sees (not Bash's), and when it is armed (denying plan-document bookkeeping). |
| (a) assumption false — skill caching | 3 | Known in general (CLAUDE.md documents it), unknown in the shape that bit here: a plan's **own gate** runs from cache, so a plan editing `wavecheck` cannot exercise that edit. |
| (a) assumption false — tool design | 4 | v0.7.3's status derivation assumed *every wave passed* ⇒ *plan closed*, with no notion of an outstanding human phase gate. |

## Assumption postmortem

| Assumption | Verdict | Evidence |
|---|---|---|
| D3 — accept that the plan is invalid until its own T1.0.2 lands | **HELD** | The criterion failed before the task (`exit=1`) and passed after (`exit=0`). The self-referential gate worked as designed. |
| D4 — plans 001–004 unchanged by the new keys | **HELD** | Post-change sweep: 002/003 PASS, 001/004 FAIL on exactly their one documented same-wave dependency. Verified, not assumed. |
| D6 — short-form track: skip the pressure test and phase review | **NEVER EXERCISED, and not gradeable from this run.** | The wave passed and no post-hoc defect surfaced — but "no pressure test found nothing" is not evidence, because none was run. Recorded honestly rather than counted as a win. |

## New knowledge

1. **Enforcement fired for real, in a fresh context, unprompted.** 13 hook
   decisions for wave 1.0 — 12 allow, 1 **deny**. The deny refused an edit to
   the plan document while the wave was armed. Same mixture that produced plan
   004's deviation 13 (`5a32ac9`), refused at the tool boundary this time
   instead of caught by a retroactive audit.
2. **Manifest attribution works end to end.** Six task commits, **not one
   carrying a `drydock(<task-id>):` subject**, all attributed by `audit-wave`
   from `.drydock/attribution.jsonl`. First live exercise of v0.7.2.
3. **The per-task sequence is: edit with a file tool → commit only owned files →
   `task-close`.** Bash-mediated edits drop silently out of step one.
4. **`.drydock/` now holds three runtime artifacts**, and no repo doc names any
   of them.

## Proposals

#### Proposal R1 — target: CLAUDE.md — kind: addition
Finding: Nothing in the repo's context tells a session how to operate the
ownership hook while executing a plan here, and both mediation assumptions cost
something this run (deviations 1 and 2).
Confidence: high

```diff
 ## Plans
 
 `docs/plans/`. Read a completed plan's Deviation Log before planning adjacent
 work — plan 001's has 49 entries and most are still live constraints.
+
+## Executing a plan here
+
+- **A session told to prefer Bash for file edits will silently produce no
+  enforcement receipts.** `PreToolUse` hooks see Write/Edit and never see a
+  `python` heredoc, a `>` redirect or `sed -i`. A wave whose edits all go
+  through Bash leaves `.drydock/enforcement.log` empty, and on a plan declaring
+  `enforcement: required` that is a wavecheck BLOCK — indistinguishable from a
+  hook that was never armed. **Use Write/Edit for the owned files of an
+  executing wave**, whatever the session's general preference. Measured
+  2026-09-01, plan 005 deviation 1: one changelog write went through Bash and
+  left no receipt while the wave's other 13 decisions were logged.
+- **Close the wave before writing the plan document.** The plan file is owned by
+  no task, so while `.drydock/wave-owns.json` is armed the hook **denies** edits
+  to it — including the orchestrator's own bookkeeping. Order is: finish the
+  tasks, `rm .drydock/wave-owns.json`, then write the Deviation Log and the
+  wavecheck report. Measured 2026-09-01, plan 005 deviation 2. Widening `owns`
+  to include the plan file is the wrong fix and is what the denial message says
+  not to do — it is the mixture behind plan 004's deviation 13.
+- **Per task: edit (file tool) → commit only owned files →
+  `drydock-audit.mjs task-close <plan> <task-id>`.** Under
+  `attribution: manifest` the commit subject is free; the manifest carries
+  attribution, and a task with no entry BLOCKs the wave exactly as a missing
+  commit does.
```

#### Proposal R2 — target: CLAUDE.md — kind: correction
Finding: The skill-cache bullet warns that a same-session test proves nothing,
but not that a plan's **own gate** is subject to it — so a plan that edits
`wavecheck` or `planwright` ships those edits unexercised by its own run
(deviation 3).
Confidence: high

```diff
   same-session test of a just-edited skill exercises the stale copy and proves
   nothing** — restart before verifying, and treat any skill this session wrote
-  as unexercised until a later session runs it. See plan 004, deviation 7.
+  as unexercised until a later session runs it. See plan 004, deviation 7.
+  **This includes the plan's own gate.** A plan whose tasks edit
+  `wavecheck/SKILL.md` or `planwright/SKILL.md` cannot exercise those edits when
+  its wave closes: `drydock:wavecheck` runs from the copy cached at session
+  start. Plan 005 changed wavecheck to read `execution:` and was then gated by a
+  wavecheck that could not read it (deviation 3). Such a task is shipped, gated
+  on its mechanical criteria, and **still unproven** — say so in the wavecheck
+  report rather than letting a PASS imply otherwise.
```

#### Proposal R3 — target: docs/architecture.md — kind: addition
Finding: The repo-shape table omits `.drydock/` entirely, though it now holds
three runtime artifacts plan execution depends on, and no doc says they exist.
Confidence: high

```diff
 | `docs/self-audit.md` | adversarial dry-run of the auditor |
 | `docs/plans/` | Drydock plan documents |
+| `.drydock/` | plan-execution runtime state, **gitignored**: `wave-owns.json` (the armed ownership boundary; deleting it closes the wave), `enforcement.log` (one JSONL receipt per hook decision), `attribution.jsonl` (task → commit manifest under `attribution: manifest`), `testing/` (seatrial evidence) |
```

#### Proposal R4 — target: docs/architecture.md — kind: addition
Finding: The Gates table covers only `site/` gates. The plan-execution gates are
now the more load-bearing half of this repo and appear nowhere — including the
one that produced this plan's most useful result.
Confidence: medium

```diff
 | `.github/workflows/deploy.yml` | runs `verify` before any publish, so a red gate cannot reach Pages | anything `verify` is blind to |
+| `enforce-owns.mjs` (PreToolUse) | Write/Edit to a path the armed wave does not own — denied at the tool boundary, before the edit lands | **Bash-mediated writes entirely**, and paths outside the project directory |
+| `drydock-audit.mjs audit-wave` | per-task ownership against the real diff, unattributable tasks, a dirty tree, and whether enforcement actually ran | intent, quality, anything a commit does not record |
+| `drydock-audit.mjs validate-plan --strict` | plan defects a reader cannot eyeball: duplicate ids, same-wave collisions and dependencies, section order, Testing Gate completeness | whether the plan is a *good* plan |
 | human browser check | typography metrics, grid legibility, optical spacing | — |
```

## Feedback, not proposals

Outside `docs_targets`, so handed over rather than diffed:

- **Tool defect, v0.7.3 (deviation 4).** `plan-status` derives *every wave has a
  PASS report* ⇒ *DONE or RECONCILED*, with no notion of an outstanding human
  phase gate — so it reported a contradiction while `status: EXECUTING` was
  correct. **Recommend a GitHub issue.** The fix is to treat an unsigned
  `**Phase gate:**` as a legitimate reason to stay `EXECUTING`; `reconcile`
  already parses that line, so the reader exists.
- **`wavecheck/SKILL.md` check 1 still says `format_version` supported "(v2)"**
  while the script supports `[2, 3]` and plans are written at v3. Logged in §9 as
  out of scope and deliberately left unfixed (T1.0.5 was forbidden it). Still
  true; still one word.
- **Planwright's checklist demands `validate-plan --strict` exit 0 before the
  pressure test**, which a plan that *changes the validator* cannot satisfy at
  authoring time. Plan 005 resolved it by making the passing state a task's
  acceptance criterion (Decision 3); that pattern belongs in the skill rather
  than being rediscovered.
