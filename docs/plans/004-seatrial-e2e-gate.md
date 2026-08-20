---
plan: 004-seatrial-e2e-gate
format_version: 2
status: EXECUTING
isolation: none
created: 2026-08-20
approved_by: sandeep
---

# 004 — Seatrial: a browser-based E2E verification gate

> **Execution protocol.** Spawn each task in the current wave as its declared
> executor agent (`drydock:executor`, or `drydock:executor-isolated` when the
> header says `isolation: worktree`) with its declared model and thinking
> budget, passing ONLY the task's context brief. Before starting any wave, run
> the staleness check below. Wait for all tasks in the wave, then invoke the
> `drydock:wavecheck` skill with this plan path and the wave id. Do not begin
> the wave's quality-review task, or the next wave, until wavecheck reports
> PASS. On BLOCK, set status BLOCKED and stop — do not self-repair; the paths
> out are `/drydock:replan` or a human decision. Quality-review rejections
> follow the escalation policy (max 2 retries → tier up → human); wavecheck
> BLOCKs on ownership violations or unlogged deviations get NO retries. When
> the final wave and phase gate pass, invoke `drydock:reconcile`.

**Staleness check (before every wave):**
`git diff <baseline SHA>..HEAD -- <wave's owned files + wave-0 contract files>`.
Non-empty → wave is STALE: re-validate its tasks against current code, update
the baseline SHA and Decision Log, then execute — or run `/drydock:replan` if
task contents (not just context) are invalidated. Never execute a stale wave
on original assumptions.

---

## 1. Requirement

A Drydock plan can declare, at plan time, a set of written end-to-end test cases
that a real browser executes after the implementation waves pass. Planwright
authors that declaration; a new `seatrial` skill executes it through Playwright
MCP, records evidence per case, and emits a go/no-go verdict sheet fit for QA
handoff; reconcile refuses to close a plan whose declared gate has no GO verdict.
Nothing about this is enforced by a hook — every gate stays prose, as the rest of
Drydock's gates are.

## 2. Spec reference

None — the requirement in the user's brief is complete and is reproduced in
Decisions 1–4 and §11. No design document precedes this plan; the design surface
that needed resolving (section placement, spec-file strategy, MCP dependency,
self-test target) was resolved by interview before drafting rather than smuggled
into task descriptions.

## 3. Surgical-scope statement

Nine existing files edited and one created: the format contract gains one
section and a renumbering, its two position-citing consumers are corrected,
planwright learns to author the section, seatrial is written, reconcile learns
one refusal, and packaging (version, changelog, README, gitignore,
compatibility row) is updated. No hooks, no new dependencies, no changes to the
executor contract, and no changes to `site/`.

## 4. Baseline

Recorded by T0 on 2026-08-20.

**Baseline SHA:** `7f934ba`

**`claude plugin validate ./drydock --strict`** — exit 0:
```
Validating plugin manifest: .../drydock/.claude-plugin/plugin.json
✔ Validation passed
```

**`cd site && npm run verify`** — exit 0:
```
assert-copy: PASS — .../site/out/index.html (16 literals, 5x executor, 1 h1, motion contract)
```

**`format_version` across plans 001–003:** exactly one distinct value, `2`, so
Decision 1's no-bump choice is verified against the files rather than assumed.

**Pre-existing failures excluded from acceptance criteria:** none. Both gates are
green at baseline, so any red during Phase 1 was introduced by Phase 1.

**Non-blocking noise, unchanged from earlier plans:** the Turbopack workspace-root
warning (stray `~/yarn.lock`, CLAUDE.md) appears on every `npm run verify` and is
not a failure.

## 5. Practices in effect

| Practice | Value | Source |
|---|---|---|
| Testing approach | No unit-test framework exists. The repo's equivalent is the **proven-failable rule**: a gate counts only once observed failing. Applied to every new gate here. | repo convention (`docs/compatibility.md`, plan 003 Decision 7) |
| Quality gate (plugin) | `claude plugin validate ./drydock --strict` exits 0 | plan 002/003, verified A4 |
| Quality gate (site) | `cd site && npm run verify` — untouched by this plan, run at T0 only to prove it was already green | CLAUDE.md |
| Review gates | `drydock:wavecheck` per wave; fresh-context Wave x.R quality review per phase; human approval at each phase boundary | plans 001–003 |
| Version control | Direct commits to `main`, no PR flow | git history (all commits direct) |
| Commit granularity | One commit per task, `drydock(<task-id>): <task name>`, staged to owned files only | format contract, checkpointing rule |
| Isolation | `none` — every task owns a distinct file, so worktrees would add a merge step per wave and buy nothing | Decision 5 |
| Model budget | No ceiling; right-size per rubric. Opus reserved for the contract wave, seatrial's authoring, and reviews | plan 002/003 |
| Tracker mirroring | None | plans 001–003 |
| Plans directory | `docs/plans/`, next sequence number 004 | repo convention |
| Evidence artifacts | `.drydock/` gitignored by default; committing any evidence requires asking first | user brief |

## 6. Findings & constraints

1. **Renumbering has a blast radius, and it is exactly the 0.4.0 bug.**
   `plan-format.md` numbers its required sections 1–16. `wavecheck/SKILL.md`
   instructs appending "position 14" and `reconcile/SKILL.md` "position 16" — by
   number, in prose. Inserting a section at 11 shifts both. Release 0.4.0 fixed
   these very two references when they had gone stale; this plan must not
   recreate that defect, so both edits are mandatory and are owned by tasks in
   the same phase as the renumbering.
2. **No test convention exists anywhere in the repo.** No Playwright, no vitest,
   no jest, no `e2e/`. `site/scripts/assert-copy.mjs` and
   `measure-reduced-motion.mjs` are hand-rolled Node harnesses driving raw CDP.
   Generated `.spec.ts` files therefore have no local runner unless a dependency
   is added — see Decision 2.
3. **Playwright MCP is absent in the planning session.** A tool search for
   browser navigate/click/screenshot returned only unrelated MCP servers. This
   is seatrial's stated hard dependency, so Phase 2 is BLOCKED(Q1) and the
   dependency gets a compatibility row rather than an assumption.
4. **The homepage is the only browser-testable surface this repo owns**, and
   `site/out` must be served at the `/drydock` basePath or every asset 404s
   (CLAUDE.md). The gate's target uses the documented recipe verbatim.
5. **Evidence paths must be frozen in wave 0.** Both reconcile (refusal rule)
   and seatrial (writer) reference `verdict.md`. If each invents its own path
   the refusal silently never fires. The contract task pins one path string,
   quoted identically in both consumer briefs (see the complete-rule-body
   checklist item, which exists because a delta-stated rule diverged for five
   waves in plan 002).
6. **`drydock/README.md` documents the lifecycle** as a diagram plus a
   piece/kind/invocation table; a new skill must appear in both or the README
   contradicts the plugin.
7. **`plugin.json` carries `userConfig`** with `plans_dir` and `docs_targets`.
   Path configuration for this feature belongs there, following that pattern,
   not hardcoded in the skill.
8. **Version convention:** explicit semver since 0.4.0, `CHANGELOG.md`
   maintained per release. A new skill plus a new format section is a minor
   bump: 0.4.1 → 0.5.0.

## 7. Decision Log

| # | Question | Decision | Decided by | Rationale |
|---|---|---|---|---|
| 1 | How does `## Testing Gate` enter the format contract, given two consumers cite section positions by number? | Insert as §11, renumber 11→12 … 16→17, correct wavecheck's and reconcile's position prose in the same phase, keep `format_version: 2`. | user | The section belongs next to Execution policies because it is authored at plan time. No bump: the section is required-for-new-plans but N/A-able, so no existing v2 plan becomes unreadable and no consumer needs range support. Consumed by T1.0.1 (renumber), T1.1.3 (wavecheck ref), T1.1.4 (reconcile ref). |
| 2 | What do seatrial's generated `.spec.ts` files assume, with no test framework in the repo? | Generate into `{e2e_dir}` (default `e2e/`); never add a dependency silently — ask before touching `package.json`; label unexecuted specs `GENERATED, NOT EXECUTED` in verdict.md. | user | The repo has refused three dependencies this month. A generated suite nobody has run is not a re-runnable suite, and claiming otherwise is the over-claim the honesty rule forbids. Consumed by T1.0.1 (contract), T1.1.5 (seatrial), T2.1.2 (execution). |
| 3 | Playwright MCP is not installed. Assume, install, or gate? | Add compatibility row **A5** as PENDING; Phase 2 is BLOCKED(Q1) until A5 has a dated entry in `docs/verification-log.md`. | user | Identical shape to A1/A2/A2b: a host-dependent runtime property gets a row with dated evidence, never an assumption. Consumed by T1.2.5 (row), T2.0.1 (verification). |
| 4 | Target for this plan's own Testing Gate, and may it include cases designed to fail? | Local server at `http://127.0.0.1:5173/drydock/`; yes — three of six cases are designed not to pass. | user | Local keeps the run hermetic and offline, and a mid-run deploy cannot move the target. Cases that cannot fail gate nothing; the proven-failable rule applies to seatrial itself. Consumed by T2.1.1 (execution) and §11. |
| 5 | Worktree isolation? | `isolation: none`. | planner (assumed — flag if wrong) | Every task owns exactly one file and no file is shared inside a wave, so worktrees would add a merge step per wave and remove nothing. Consumed by every task's Executor field. |
| 6 | Is seatrial model-invocable? | Yes — same posture as wavecheck. Not `disable-model-invocation`. | planner (assumed — flag if wrong) | It is named as a gate inside plan documents, so the orchestrating session must be able to reach it unprompted. `replan` is human-only because auto-replanning mutates plans; running a read-only verification gate carries no such risk. Consumed by T1.1.5. |
| 7 | Skill name | `seatrial` | planner (assumed — flag if wrong) | A sea trial is what a ship undergoes after it leaves the drydock: the metaphor already had this slot open. Consumed by T1.1.5, T1.2.1, T1.2.2, T1.2.3. |
| 8 | Where do evidence artifacts live, and are they committed? | `.drydock/testing/<plan-id>/<case-id>/`; `.drydock/` gitignored; the dated **record** of a run is committed to `docs/verification-log.md`, the **artifacts** are not, and committing artifacts requires asking. | planner (assumed — flag if wrong) | Screenshots and video in git history bloat a public repo permanently. The record is what a later session needs; the artifacts are for the QA handoff at the time. This also gives Phase 2's tasks a tracked file to commit, which the checkpointing rule requires. Consumed by T1.0.1, T1.1.5, T1.2.4, T2.1.1. |
| 9 | Does the adversarial pressure-test run as a subagent? | No — performed inline by the planner with files re-opened from disk, because this session is instructed not to spawn agents. Recorded as a substitution, not a skip. | planner (assumed — flag if wrong) | Planwright permits the inline fallback but the loss of fresh eyes is real and is stated in §12 rather than hidden. |

## 8. Open questions

| # | Question | Blocks | Recommended answer |
|---|---|---|---|
| Q1 | Playwright MCP is not installed in this environment. Who installs it, and is its configuration in scope for this plan? | All of Phase 2 (`T2.0.1`, `T2.1.1`, `T2.1.2`) — marked `BLOCKED(Q1)` | Human installs it out-of-band, then T2.0.1 verifies a navigate+screenshot round trip and records A5. Keeping MCP configuration out of the plan avoids a plan that mutates the operator's machine config. |
| Q2 | Should `e2e_dir` default to `e2e/` at the repo root, or `site/e2e/` next to the only app? | Nothing — `T1.2.1` ships the default and it is user-configurable | Repo root `e2e/`. Drydock is installed into other people's repos where `site/` means nothing; the config key exists for anyone who disagrees. |

## 9. Out of scope / follow-ups

- **Any mechanical hook.** No `PreToolUse` gate that blocks a wave until a
  verdict exists. Explicitly excluded by the brief and by Drydock's design.
- **Adding `@playwright/test` to `site/`.** Decision 2 forbids doing it
  silently; doing it deliberately is a separate decision with a ~300 MB
  browser-binary cost.
- **A5 → PASSED.** This plan can only move A5 from absent to a first dated
  observation. Whether one round trip is enough evidence is the compatibility
  file's business, not this plan's.
- **Accessibility, mobile viewport, and multi-browser cases.** One Chromium,
  desktop viewport. Stated as a coverage gap in the QA handoff note.
- **Retro-fitting a Testing Gate onto plans 001–003.** They are closed records;
  §§2–8 of a completed plan are history, not a draft.
- **CI execution of generated specs.** `deploy.yml` stays as it is; wiring a
  browser suite into Actions is a separate change.

## 10. Execution policies

Per task: one acceptance criterion, a command that exits 0, re-run independently
by wavecheck — except review tasks, whose criterion is a written verdict.
Per wave: `drydock:wavecheck`, PASS required before the next wave opens.
Per phase: `Wave x.R` fresh-context Opus quality review; APPROVED required at
the gate, plus human approval.
Escalation: quality-review rejection → max 2 retries with feedback injected →
tier up → human. Wavecheck BLOCK on ownership or unlogged deviation → no
retries → `/drydock:replan` or human decision.
Checkpointing: one commit per task, `drydock(<task-id>): <task name>`, staged to
owned files only, committed the moment the criterion passes.
Human gates: Phase 1 boundary (read the diff), Phase 2 boundary (read
`verdict.md` and sign the go/no-go).
Tracker mirroring: none. Final step: `drydock:reconcile`.

## 11. Testing Gate

**Target:** `http://127.0.0.1:5173/drydock/` — `site/out` mounted at the
basePath using CLAUDE.md's documented recipe (`ln -sfn site/out /tmp/dd/drydock`,
`python3 -m http.server 5173` from `/tmp/dd`). Local rather than the live URL:
hermetic, offline, and a mid-run deploy cannot move the target under a running
case (Decision 4).
**Auth:** none — the page is public and unauthenticated.
**Browser:** Chromium via Playwright MCP. **Commit SHA:** recorded at run time.
**Evidence root:** `.drydock/testing/004-seatrial-e2e-gate/<case-id>/`
(gitignored per Decision 8).

**What this gate verifies — read this before the cases.** It does *not* verify
the homepage. The homepage is a fixture, already gated by `npm run verify` and
`measure-reduced-motion.mjs`. These cases verify **seatrial's own fidelity**:
that it reports PASS only when a written expectation actually holds, FAIL when it
does not, and "step not executable" rather than quietly substituting something
that works. Three of the six are therefore designed **not** to pass. A run in
which all six pass is a failed run — it means seatrial is rationalising, and the
correct verdict for the plan is NO-GO.

**Gate rule (prose — no mechanical hook enforces this).**
- Any **blocker** FAIL → **NO-GO**. Deployment does not proceed, and reconcile
  refuses to close the plan.
- Any **major** FAIL → **GO-WITH-OVERRIDES**, and only with an explicit human
  override recorded in `verdict.md` naming the case, the reason, and who
  decided. Without that record the verdict is NO-GO.
- Any **minor** FAIL → recorded in `verdict.md`, no effect on the verdict.
- A case that cannot be run at all — target unreachable, MCP absent, evidence
  path unwritable — is **neither a pass nor a skip**: seatrial HALTs and asks.
  A gate that degrades to "skipped" under pressure is not a gate.
- For TG2 and TG3, whose expected outcome IS a failure, the gate rule inverts:
  a PASS verdict on those cases is itself a blocker failure. Stated per case.

| ID | Title | Severity | Evidence |
|---|---|---|---|
| TG1 | A satisfiable case reports PASS and writes its evidence | blocker | screenshot |
| TG2 | A deliberately false expectation reports FAIL | blocker | screenshot |
| TG3 | An unperformable step reports "step not executable" and HALTs | blocker | screenshot |
| TG4 | A case declaring video evidence produces a video file | major | video |
| TG5 | Every same-origin asset the page requests returns < 400 | major | network assertion |
| TG6 | The nav mark renders with non-zero natural dimensions | minor | screenshot |

#### TG1 — A satisfiable case reports PASS and writes its evidence
- **Severity:** blocker · **Evidence:** screenshot
- **Preconditions:** target reachable; Playwright MCP available (A5 recorded).
- **Steps:**
  - **Given** the export is served at `http://127.0.0.1:5173/drydock/`
  - **When** seatrial navigates to that URL and reads the `<h1>` text content
  - **Then** the `<h1>` text contains `Drydock`, and a screenshot is written
- **Expected result:** verdict `PASS`; exactly one image file present at
  `.drydock/testing/004-seatrial-e2e-gate/TG1/`; the `verdict.md` row for TG1
  links that file by relative path.
- **Why it can fail:** if seatrial writes no evidence, or writes it outside the
  declared path, TG1 fails on the evidence clause even with a correct assertion.

#### TG2 — A deliberately false expectation reports FAIL
- **Severity:** blocker · **Evidence:** screenshot
- **Preconditions:** as TG1.
- **Steps:**
  - **Given** the export is served at the target URL
  - **When** seatrial reads the text of the status pill in the page header
  - **Then** the pill reads `CLOSED PILOT`
- **Expected result:** verdict `FAIL`, with actual-vs-expected recorded as
  actual `open pilot -- field benchmarks pending` against expected
  `CLOSED PILOT`. **A PASS verdict on this case is a blocker failure of the
  gate itself**, because the page demonstrably says otherwise and a gate that
  agrees with a false expectation cannot detect a real regression.
- **Why it can fail (as designed):** the expectation is false against a string
  pinned by `assert-copy.mjs`, so it cannot silently become true.

#### TG3 — An unperformable step reports "step not executable" and HALTs
- **Severity:** blocker · **Evidence:** screenshot
- **Preconditions:** as TG1.
- **Steps:**
  - **Given** the export is served at the target URL
  - **When** seatrial clicks the element with test id `checkout-submit`
  - **Then** an order confirmation is displayed
- **Expected result:** verdict `FAIL` with reason exactly
  `step not executable`, **plus** a HALT-and-ask: a step naming a checkout
  control on a page that has no checkout is far more likely a plan defect than
  an app defect, which is the condition the brief requires seatrial to stop on.
  Clicking any other element, or reporting PASS because "no checkout exists so
  nothing was submitted", are both contract breaches.
- **Why it can fail (as designed):** no element with that test id exists
  anywhere in the export.

#### TG4 — A case declaring video evidence produces a video file
- **Severity:** major · **Evidence:** video
- **Preconditions:** as TG1.
- **Steps:**
  - **Given** the export is served at the target URL
  - **When** seatrial navigates to the URL, then to the `#install` anchor, and
    reads the first install command
  - **Then** the command text contains `/plugin marketplace add`
- **Expected result:** verdict `PASS`; a video file exists at
  `.drydock/testing/004-seatrial-e2e-gate/TG4/`. If the assertion passes but no
  video is produced, TG4 is a FAIL on the evidence clause — the declared
  evidence type is part of the case, not a preference.

#### TG5 — Every same-origin asset the page requests returns < 400
- **Severity:** major · **Evidence:** network assertion
- **Preconditions:** as TG1.
- **Steps:**
  - **Given** the export is served at the target URL
  - **When** seatrial navigates to the URL and records every network request
    whose origin matches the target origin
  - **Then** no recorded response has status ≥ 400
- **Expected result:** verdict `PASS`; the recorded request/status table is
  saved as the case's evidence.
- **Why this case exists:** two production 404s shipped this month that every
  hermetic gate passed — a doubled `basePath` in `og:image`, and a `next/image`
  string `src` that did not receive the basePath at all. This is the only case
  here that guards a class of defect the repo has actually shipped twice.

#### TG6 — The nav mark renders with non-zero natural dimensions
- **Severity:** minor · **Evidence:** screenshot
- **Preconditions:** as TG1.
- **Steps:**
  - **Given** the export is served at the target URL
  - **When** seatrial reads `naturalWidth` and `naturalHeight` of the image
    inside the header wordmark link
  - **Then** both are greater than zero
- **Expected result:** verdict `PASS`. A broken image reports `naturalWidth: 0`
  while still occupying its declared 26×26 box, so a screenshot alone does not
  settle it — this is the regression that shipped as a broken-image placeholder
  before the static-import fix.

**QA handoff note (to be reproduced in `verdict.md`).**
Covered: one Chromium desktop viewport against a local static export; document
title and `<h1>`; header status pill; install command text; same-origin asset
status codes; nav mark natural dimensions; seatrial's PASS, FAIL, and
step-not-executable paths.
Not covered: authentication (the target has none), forms and mutations, mobile
and tablet viewports, other browser engines, the accessibility tree, reduced
motion (covered separately by `measure-reduced-motion.mjs`), the live production
origin including Pages headers and caching, and every page other than `/`.
**A browser verdict is evidence about the paths tested. It is not evidence that
other defects are absent.**

## 12. Pressure-test verdict

**Round 1 — inline, by the planner, files re-opened from disk (not a fresh
subagent — Decision 9).** The substitution is a real weakening: author blindness
toward one's own plan is exactly what the fresh-context pass exists to defeat,
and this pass does not defeat it. Recorded rather than glossed. Findings fixed
before presenting:

| # | Finding | Fix |
|---|---|---|
| P1 | The renumbering would have broken `wavecheck` and `reconcile` silently — both cite positions by number in prose, and nothing mechanically checks the citation. Verified by re-reading both files: "position 14" and "position 16" are present today. | T1.1.3 and T1.1.4 own those edits, in the same phase as the renumber, and T1.0.1's criterion asserts the new numbering is contiguous 1–17 so a partial renumber cannot pass. |
| P2 | A Phase 2 task that only writes gitignored evidence would have **no tracked file to commit**, and the checkpointing rule makes a missing per-task commit an automatic wavecheck BLOCK on check-1 grounds. The plan would have deadlocked at its own final gate. | Decision 8 splits record from artifact: `T2.1.1` and `T2.1.2` own `docs/verification-log.md` and commit the dated run record; the artifacts stay untracked. |
| P3 | `verdict.md`'s path was stated in two places (seatrial writes it, reconcile refuses on it) and would have been free to diverge — the delta-stated-rule failure from plan 002. | The path string is frozen in T1.0.1's contract output and quoted **identically** in T1.1.4's and T1.1.5's context briefs. |
| P4 | TG5 originally declared `screenshot` evidence for a network claim, which a screenshot cannot substantiate. | Evidence type corrected to `network assertion`; the recorded request/status table is the artifact. |
| P5 | A spec-file-agreement case was originally TG5, but its evidence is a test-run transcript, which is not one of the three declared evidence types. Forcing it into the schema would have widened the schema for one case. | Moved out of the gate into `T2.1.2`'s acceptance criterion, where a command exit code is the natural evidence. |
| P6 | With three cases designed to fail, a naive reading of the gate rule yields NO-GO on every run, permanently. | The gate rule now states the inversion explicitly for TG2 and TG3, and §11 says plainly that an all-six-pass run is a failed run. |

**Round 2:** not run. If the human gate at Phase 1 finds a defect of the kind a
fresh-context reviewer should have caught, that is evidence the inline
substitution was not adequate, and it should be recorded against Decision 9.

---

## Phase 0: Pre-flight

#### T0 — Baseline verification
- **Status:** TODO
- **Description:** Run every quality-gate command on the untouched tree and
  record results verbatim in §4, plus the `format_version` of all three existing
  plans, so the no-bump decision rests on observation.
- **Files owned:** — (read-only; writes §4 of this plan only)
- **Depends on:** —
- **Model / thinking:** Mechanical / off · **Executor:** drydock:executor
- **Context brief:** this plan §4, §5. CLAUDE.md's "Working on `site/`" section.
- **Acceptance criterion:** `claude plugin validate ./drydock --strict && (cd site && npm run verify) && grep -h '^format_version:' docs/plans/00[123]-*.md | sort -u | wc -l | grep -qx 1` exits 0.

## Phase 1: Contract, skill, and packaging

**Exit state:** the plugin validates strict at 0.5.0; the format contract
defines `## Testing Gate` at §11 with a contiguous 1–17 list; planwright
authors the section; `seatrial` exists; reconcile refuses on a missing or NO-GO
verdict; README, changelog, gitignore and the A5 row are current. Nothing has
been executed in a browser yet, and the plan says so.

**Phase gate:** `claude plugin validate ./drydock --strict` exits 0 · `T1.R.1`
APPROVED · human reads the diff and approves.

### Wave 1.0 — Contracts

> Pins the shared surface every later task builds against: the section schema,
> the evidence path strings, the gate-rule wording, and the renumbering.

#### T1.0.1 — Insert `## Testing Gate` as §11 and renumber the contract
- **Status:** TODO
- **Description:** Add the `## Testing Gate` required section to the format
  contract at position 11, documenting the per-case schema, the gate rule, the
  N/A escape, and the frozen evidence paths. Renumber the following sections
  11→12 through 16→17.
- **Files owned:** `drydock/skills/planwright/reference/plan-format.md`
- **Depends on:** T0
- **Model / thinking:** Judgment / extended · **Executor:** drydock:executor
- **Context brief:** the whole of `plan-format.md`; §11 of this plan as the
  worked example of the section it is defining; Decisions 1, 2, 8 verbatim.
  Note from Decision 1 that `format_version` stays **2** and that the two
  consumer files citing positions are owned by T1.1.3 and T1.1.4 — do not edit
  them here.
- **Forbidden:** changing `format_version`; editing any other file; adding any
  hook or mechanical enforcement; renumbering sections 1–10.
- **Implementation sketch:** Section defines, as a complete rule body: case
  fields `id`, `title`, `preconditions`, `steps` (Given/When/Then), `expected`,
  `evidence` (exactly one of `screenshot` | `video` | `network assertion`),
  `severity` (exactly one of `blocker` | `major` | `minor`); the header fields
  target URL, auth approach, browser, commit SHA, evidence root; the gate rule
  as prose with the blocker/major/minor consequences and the
  cannot-run-is-a-HALT clause; the N/A form `N/A — <reason>` for plans with no
  user-facing surface; and these two frozen strings, quoted exactly:
  `.drydock/testing/<plan-id>/<case-id>/` for evidence and
  `.drydock/testing/<plan-id>/verdict.md` for the sheet.
- **Acceptance criterion:** `bash -c 'f=drydock/skills/planwright/reference/plan-format.md; grep -q "^11\. \*\*Testing Gate\*\*" "$f" && grep -q "^17\. \*\*Reconcile report\*\*" "$f" && [ "$(grep -cE "^1?[0-9]\. \*\*" "$f")" = 17 ] && grep -q "format_version. 2" "$f" && grep -q "\.drydock/testing/<plan-id>/verdict\.md" "$f"'` exits 0.

### Wave 1.1 — Consumers

> Four files, four tasks, disjoint by construction. All read T1.0.1's frozen
> contract; none reads another task's output.

#### T1.1.1 — Teach planwright to interview for and author the Testing Gate
- **Status:** TODO
- **Description:** Add the Testing Gate to planwright's workflow: step 1
  interviews for testable acceptance criteria and the app's base URL and auth
  approach; step 6 writes the section for any plan touching a UI or API surface;
  the self-review checklist gains an item that fails an absent or unjustified
  section.
- **Files owned:** `drydock/skills/planwright/SKILL.md`
- **Depends on:** T1.0.1
- **Model / thinking:** Standard / default · **Executor:** drydock:executor
- **Context brief:** current `planwright/SKILL.md` steps 1 and 6; the
  `## Testing Gate` section as written by T1.0.1; Decision 1 (section is
  required-for-new-plans, N/A-able, `format_version` stays 2).
- **Forbidden:** editing `plan-format.md` or `practices-interview.md`; adding a
  hook; making the section unconditionally mandatory with no N/A path.
- **Acceptance criterion:** `bash -c 'f=drydock/skills/planwright/SKILL.md; grep -q "Testing Gate" "$f" && grep -q "seatrial" "$f" && grep -qE "N/A" "$f"'` exits 0.

#### T1.1.2 — Add the E2E question block to the practices interview
- **Status:** TODO
- **Description:** Extend the question bank with the questions seatrial needs
  answered at plan time: base URL per environment, auth approach for test runs,
  evidence retention expectations, and whether generated spec files are wanted.
- **Files owned:** `drydock/skills/planwright/reference/practices-interview.md`
- **Depends on:** T1.0.1
- **Model / thinking:** Mechanical / minimal · **Executor:** drydock:executor
- **Context brief:** current `practices-interview.md` (note the existing
  "Review & gates" question about browser confirmation, which this extends
  rather than duplicates); Decision 2 (`e2e_dir`, never a silent dependency).
- **Forbidden:** editing any other file; duplicating the existing browser-gate
  question rather than cross-referencing it.
- **Acceptance criterion:** `bash -c 'f=drydock/skills/planwright/reference/practices-interview.md; grep -qi "base url" "$f" && grep -qi "E2E" "$f"'` exits 0.

#### T1.1.3 — Correct wavecheck's stale section position
- **Status:** TODO
- **Description:** Wavecheck instructs appending its report at "position 14";
  after the renumbering, Wavecheck reports are position 15. Update the prose.
- **Files owned:** `drydock/skills/wavecheck/SKILL.md`
- **Depends on:** T1.0.1
- **Model / thinking:** Mechanical / minimal · **Executor:** drydock:executor
- **Context brief:** the Verdict section of `wavecheck/SKILL.md`; Finding 1 of
  this plan; Decision 1. Wavecheck gains **no** new responsibility for the
  Testing Gate — it audits waves, and the gate runs after the final wave.
- **Forbidden:** giving wavecheck any Testing Gate duty; editing any other file.
- **Acceptance criterion:** `bash -c 'f=drydock/skills/wavecheck/SKILL.md; grep -q "position 15" "$f" && ! grep -q "position 14" "$f"'` exits 0.

#### T1.1.4 — Reconcile: correct its position and add the verdict refusal
- **Status:** TODO
- **Description:** Update reconcile's "position 16" to 17, and add the refusal:
  if the plan has a Testing Gate section that is not `N/A`, reconcile refuses to
  set `RECONCILED` unless the verdict sheet exists and reads GO or
  GO-WITH-OVERRIDES with a recorded override.
- **Files owned:** `drydock/skills/reconcile/SKILL.md`
- **Depends on:** T1.0.1
- **Model / thinking:** Standard / default · **Executor:** drydock:executor
- **Context brief:** current `reconcile/SKILL.md` Inputs and step 5; Decision 8
  and the frozen path string `.drydock/testing/<plan-id>/verdict.md` **quoted
  exactly as it appears in T1.0.1's contract**; the existing refusal precedent
  in Inputs ("if any wave lacks a PASS report, refuse").
- **Forbidden:** adding a hook; refusing when the section reads `N/A — <reason>`;
  inventing a different verdict path than the frozen one.
- **Acceptance criterion:** `bash -c 'f=drydock/skills/reconcile/SKILL.md; grep -q "position 17" "$f" && ! grep -q "position 16" "$f" && grep -q "\.drydock/testing/<plan-id>/verdict\.md" "$f" && grep -q "NO-GO" "$f"'` exits 0.

#### T1.1.5 — Author the `seatrial` skill
- **Status:** TODO
- **Description:** Write `drydock/skills/seatrial/SKILL.md`: the preflight
  halts, per-case execution through Playwright MCP with no improvisation,
  evidence capture per declared type, spec generation, and the verdict sheet.
- **Files owned:** `drydock/skills/seatrial/SKILL.md` (new)
- **Depends on:** T1.0.1
- **Model / thinking:** Judgment / extended · **Executor:** drydock:executor
- **Context brief:** `wavecheck/SKILL.md` as the house style for a gate skill
  (inputs, ordered checks, verdict shape, cost discipline); the
  `## Testing Gate` section from T1.0.1; §11 of this plan as a worked example
  of the input it consumes; Decisions 2, 3, 6, 8, with the evidence and verdict
  path strings **quoted exactly as T1.0.1 froze them**.
- **Forbidden:** any mechanical hook; falling back to a non-Playwright driver
  (raw CDP, curl, fetch) when the MCP is absent — that path is a HALT with
  install instructions; improvising a step that cannot be performed as written;
  adding a dependency to any `package.json`; claiming a generated spec file is
  CI-ready when it has not been executed; asserting that a GO verdict means the
  app is defect-free.
- **Implementation sketch:** Frontmatter `name: seatrial`, description in the
  house pattern, **no** `disable-model-invocation` (Decision 6). Sections:
  *Inputs* (plan path; optional case ids). *Preflight, all HALT-and-ask on
  failure*: plan has a Testing Gate that is not N/A; the gate is not stale
  (same `git diff <baseline SHA>..HEAD` mechanism planwright prescribes, over
  the target's owned paths); Playwright MCP tools resolve — if absent, HALT
  with install instructions and **do not** substitute another driver; target URL
  reachable; evidence root writable. *Per case, in declared order*: drive the
  written steps exactly; on a step that cannot be performed, verdict FAIL with
  reason `step not executable` plus HALT-and-ask when it reads as a plan defect
  rather than an app defect; capture the declared evidence type into
  `.drydock/testing/<plan-id>/<case-id>/`; record actual vs expected.
  *Spec generation*: one `.spec.ts` per case into `{e2e_dir}` with
  `video: 'retain-on-failure'`; ask before touching `package.json`; if the
  runner is absent, mark them `GENERATED, NOT EXECUTED`. *Verdict*: write
  `.drydock/testing/<plan-id>/verdict.md` — summary verdict at top
  (GO | NO-GO | GO-WITH-OVERRIDES), environment block (base URL, browser,
  commit SHA, run timestamp), one row per case (id, title, verdict, severity,
  evidence links), and the QA handoff note listing covered and not-covered.
  *Anti-goals*: the over-claim clause, stated in the skill's own words — a
  browser verdict is evidence about tested paths, never proof that other
  defects are absent.
- **Acceptance criterion:** `bash -c 'f=drydock/skills/seatrial/SKILL.md; test -f "$f" && grep -q "^name: seatrial" "$f" && ! grep -q "disable-model-invocation" "$f" && grep -q "step not executable" "$f" && grep -q "GENERATED, NOT EXECUTED" "$f" && grep -q "GO-WITH-OVERRIDES" "$f" && grep -q "\.drydock/testing/<plan-id>/verdict\.md" "$f" && claude plugin validate ./drydock --strict'` exits 0.

### Wave 1.2 — Packaging

> Sequenced after 1.1 because the changelog and README describe what 1.0 and
> 1.1 actually landed.

#### T1.2.1 — Bump to 0.5.0 and add the path config keys
- **Status:** TODO
- **Description:** Set `version` to `0.5.0` and add `userConfig` entries
  `e2e_dir` (default `e2e`) and `evidence_dir` (default `.drydock/testing`),
  following the existing `plans_dir` shape.
- **Files owned:** `drydock/.claude-plugin/plugin.json`
- **Depends on:** T1.0.1, T1.1.5
- **Model / thinking:** Mechanical / minimal · **Executor:** drydock:executor
- **Context brief:** current `plugin.json`; Finding 7 and 8; Decision 2 and
  Q2's recommended default (`e2e` at repo root).
- **Forbidden:** adding an `icon` field — measured 2026-08-20, `validate
  --strict` rejects it as unknown; changing `description` or `keywords`.
- **Acceptance criterion:** `bash -c 'claude plugin validate ./drydock --strict && python3 -c "import json;d=json.load(open(\"drydock/.claude-plugin/plugin.json\"));assert d[\"version\"]==\"0.5.0\";assert \"e2e_dir\" in d[\"userConfig\"];assert \"evidence_dir\" in d[\"userConfig\"]"'` exits 0.

#### T1.2.2 — Changelog entry for 0.5.0
- **Status:** TODO
- **Description:** Add the 0.5.0 entry in the established style: what changed,
  traced to why, plus a "deliberately NOT changed" list, and state explicitly
  that `format_version` stays 2 and why.
- **Files owned:** `drydock/CHANGELOG.md`
- **Depends on:** T1.0.1, T1.1.1, T1.1.2, T1.1.3, T1.1.4, T1.1.5
- **Model / thinking:** Mechanical / minimal · **Executor:** drydock:executor
- **Context brief:** current `CHANGELOG.md` — match the 0.4.1 entry's habit of
  justifying the version-bump decision; Decisions 1, 2, 3; the actual diff of
  waves 1.0 and 1.1.
- **Forbidden:** claiming the gate has been executed or that A5 passed — at this
  point in the plan nothing has run a browser.
- **Acceptance criterion:** `bash -c 'f=drydock/CHANGELOG.md; grep -q "^## 0.5.0" "$f" && grep -q "seatrial" "$f" && grep -q "format_version" "$f"'` exits 0.

#### T1.2.3 — README: lifecycle diagram and piece table
- **Status:** TODO
- **Description:** Add seatrial to the lifecycle diagram and to the
  piece/kind/invocation table, and note the Testing Gate in "What makes it
  different".
- **Files owned:** `drydock/README.md`
- **Depends on:** T1.1.5
- **Model / thinking:** Mechanical / minimal · **Executor:** drydock:executor
- **Context brief:** current `drydock/README.md` lifecycle block and table;
  Decision 6 (invocation column reads model-invocable, like wavecheck).
- **Forbidden:** over-claiming in the differentiator bullet — no "guarantees",
  no "proves the app works".
- **Acceptance criterion:** `bash -c 'f=drydock/README.md; grep -c seatrial "$f" | awk "{exit !(\$1>=2)}"'` exits 0.

#### T1.2.4 — Gitignore the evidence root
- **Status:** TODO
- **Description:** Add `.drydock/` to the repo `.gitignore` so evidence
  artifacts are untracked by default.
- **Files owned:** `.gitignore`
- **Depends on:** T1.0.1
- **Model / thinking:** Mechanical / minimal · **Executor:** drydock:executor
- **Context brief:** current `.gitignore` (note the existing `.claude/` entry
  and its A2 rationale comment); Decision 8.
- **Forbidden:** ignoring `docs/` or anything under `drydock/`.
- **Acceptance criterion:** `bash -c 'grep -qx "\.drydock/" .gitignore && git check-ignore -q .drydock/testing/x/y.png'` exits 0.

#### T1.2.5 — Register A5 as a PENDING compatibility row
- **Status:** TODO
- **Description:** Add row A5 — Playwright MCP availability and browser-drive
  round trip — as PENDING, with the note that Phase 2 of this plan is the
  intended first evidence.
- **Files owned:** `docs/compatibility.md`
- **Depends on:** T1.0.1
- **Model / thinking:** Mechanical / minimal · **Executor:** drydock:executor
- **Context brief:** current `docs/compatibility.md` table and the A1/A2 rows as
  the shape to match; Decision 3; the verification-log protocol — **a row never
  moves without a dated evidence entry, and ambiguous means INCONCLUSIVE**.
- **Forbidden:** marking A5 anything other than PENDING; editing any other row;
  editing the public-release-criteria list.
- **Acceptance criterion:** `bash -c 'f=docs/compatibility.md; grep -q "| A5 |" "$f" && grep "| A5 |" "$f" | grep -q PENDING'` exits 0.

### Wave 1.R — Quality review

#### T1.R.1 — Fresh-context quality review of Phase 1
- **Status:** TODO
- **Description:** Review the Phase 1 diff for correctness, house-style
  consistency across the five skill files, and over-claim in the new prose.
  Conformance was already audited by wavecheck.
- **Files owned:** — (appends its verdict to this plan)
- **Depends on:** all of waves 1.0–1.2
- **Model / thinking:** Judgment / extended · **Executor:** drydock:executor
- **Context brief:** the Phase 1 diff; this plan; the Decision Log. Check
  specifically: the frozen path strings are byte-identical in `plan-format.md`,
  `reconcile/SKILL.md` and `seatrial/SKILL.md`; the section list is contiguous
  1–17; no file gained a hook; seatrial's anti-goals contain the over-claim
  clause; nothing claims A5 passed.
- **Acceptance criterion:** a written verdict APPROVED or REJECTED appended to
  this plan; APPROVED required for the phase gate.

## Phase 2: Prove it — BLOCKED(Q1)

**Exit state:** A5 has a first dated observation; `verdict.md` exists for this
plan with all six cases recorded and the three designed-to-fail cases having
actually failed; generated spec files exist with their execution status stated
honestly.

**Phase gate:** `verdict.md` summary reads GO (or GO-WITH-OVERRIDES with a
recorded override) · human reads `verdict.md` and signs the go/no-go.

### Wave 2.0 — Dependency verification

#### T2.0.1 — Verify and record the Playwright MCP round trip (A5)
- **Status:** BLOCKED(Q1)
- **Description:** With Playwright MCP installed, drive one navigate plus one
  screenshot against the local target, and record the observation as a dated
  entry in the verification log.
- **Files owned:** `docs/verification-log.md`
- **Depends on:** T1.R.1, Q1 resolved
- **Model / thinking:** Standard / default · **Executor:** drydock:executor
- **Context brief:** `docs/verification-log.md` existing entry shape (the A1 and
  A2b entries); Decision 3; the local-serve recipe from CLAUDE.md; the
  verification-log protocol — dated evidence, and ambiguous is INCONCLUSIVE
  followed by a stop, never a lenient pass.
- **Forbidden:** editing the A5 row in `docs/compatibility.md` (a later human
  decision, on this evidence); recording a pass on a partial round trip.
- **Acceptance criterion:** `bash -c 'grep -q "^#### A5" docs/verification-log.md && grep -A5 "^#### A5" docs/verification-log.md | grep -qE "2026-[0-9]{2}-[0-9]{2}"'` exits 0.

### Wave 2.1 — Run the gate

#### T2.1.1 — Execute the Testing Gate and emit the verdict sheet
- **Status:** BLOCKED(Q1)
- **Description:** Invoke `seatrial` against this plan, execute TG1–TG6 as
  written, capture the declared evidence for each, and write the verdict sheet.
  Commit the dated run record; leave artifacts untracked.
- **Files owned:** `docs/verification-log.md`
- **Depends on:** T2.0.1
- **Model / thinking:** Standard / default · **Executor:** drydock:executor
- **Context brief:** §11 of this plan in full; the `seatrial` skill;
  Decisions 4 and 8. TG2 and TG3 are expected to FAIL — a PASS on either is a
  gate defect to report, not a success to celebrate.
- **Forbidden:** editing §11 to make a case pass; committing anything under
  `.drydock/`; skipping a case that cannot run instead of halting.
- **Acceptance criterion:** `bash -c 'v=.drydock/testing/004-seatrial-e2e-gate/verdict.md; test -f "$v" && grep -qE "^(GO|NO-GO|GO-WITH-OVERRIDES)" "$v" && for c in TG1 TG2 TG3 TG4 TG5 TG6; do grep -q "$c" "$v" || exit 1; done && grep -q "TG2" "$v" && grep -A1 "TG2" "$v" | grep -q FAIL'` exits 0.

#### T2.1.2 — Generate the repeatable spec files and state their status
- **Status:** BLOCKED(Q1)
- **Description:** Generate one `.spec.ts` per case into `e2e/`, and record in
  the verdict sheet whether they were executed or only generated.
- **Files owned:** `e2e/**`
- **Depends on:** T2.1.1
- **Model / thinking:** Standard / default · **Executor:** drydock:executor
- **Context brief:** the `seatrial` spec-generation section; Decision 2; §11's
  case list.
- **Forbidden:** adding `@playwright/test` or any dependency to any
  `package.json` without asking first; describing unexecuted specs as passing,
  green, or CI-ready.
- **Acceptance criterion:** `bash -c 'ls e2e/*.spec.ts >/dev/null 2>&1 && grep -q "retain-on-failure" e2e/*.spec.ts && grep -qE "GENERATED, NOT EXECUTED|spec run:" .drydock/testing/004-seatrial-e2e-gate/verdict.md'` exits 0.

### Wave 2.R — Quality review

#### T2.R.1 — Fresh-context review of the verdict sheet
- **Status:** BLOCKED(Q1)
- **Description:** Review `verdict.md` for honesty rather than for green: does
  each row's evidence actually substantiate its verdict, are the three
  designed-to-fail cases failed for the stated reason rather than incidentally,
  and does the QA handoff note understate coverage rather than overstate it.
- **Files owned:** — (appends its verdict to this plan)
- **Depends on:** T2.1.1, T2.1.2
- **Model / thinking:** Judgment / extended · **Executor:** drydock:executor
- **Context brief:** `verdict.md`; the evidence directory; §11; this plan's
  Decision Log.
- **Acceptance criterion:** a written verdict APPROVED or REJECTED appended to
  this plan; APPROVED required for the phase gate.

## Deviation Log

| # | Task | What deviated | Why | Impact | Recorded |
|---|---|---|---|---|---|
| 1 | all of Phase 1 | Tasks executed inline by the orchestrating session instead of being spawned as `drydock:executor` subagents, contrary to the embedded Execution protocol. | The session operates under a standing instruction not to spawn agents unless explicitly asked; "execute phase 1" was read as plan approval, not as agent authorisation. | **Material.** Two properties are lost: fresh-context isolation per task (the executor sees only its brief; this session sees the whole plan and this conversation), and independent authorship from the auditor — wavecheck's forbidden-audit judgement is weakened when the auditor wrote the diff, which wavecheck's own text names as the disqualifying condition. Mechanical checks (ownership per commit, acceptance criteria as commands) are unaffected: they are evidence, not opinion. Ownership lists, forbidden lists and per-task commits are honoured exactly as written. | orchestrator, at wave 1.0 open |

## Wavecheck reports

_Appended by `drydock:wavecheck`, one per wave._

## Progress log

| Date | Task | Result | Notes |
|---|---|---|---|
| 2026-08-20 | — | plan drafted, status DRAFT | Four decisions taken by user before drafting; inline pressure-test found 6 defects, all fixed |

## Reconcile report

_Appended once by `drydock:reconcile` at completion._
