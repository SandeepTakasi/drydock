---
plan: 003-hero-revamp
format_version: 2
status: DRAFT
isolation: none
created: 2026-08-19
approved_by: unapproved
---

# 003 — Hero revamp

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

## 1. Requirement

The hero becomes the page's modern centrepiece using **only** the vocabulary plan
002 froze: the `--text-hero` display step, the `--color-raised` tier, the
`--stroke-*` ramp, `heroReveal` beats, and `useDriftY` scroll drift. It stays an
engineering drawing — hull in a cradle, a **dashed** primer waterline carrying
`APPROVED (HUMAN-ONLY)`, draft marks, keel labels, the page's only `<h1>` — inside
the sheet frame, with hull-primer orange as the only accent. `Big_Shoulders`'s
optical axis is pinned so the larger display step does not worsen layout shift.
**And the reduced-motion harness is extended to cover scroll-linked motion before
the hero introduces any.** Done means both gates green, the extended harness proven
able to fail, and a human confirming it in a browser.

## 2. Spec reference

None. Design direction from plan 002 Decision 1: blueprint substrate plus modern
devices. Depth is stacked planes and stroke weight — no diffuse shadow, no blur,
no glass (plan 002 Decision 2).

## 3. Surgical-scope statement

Three files: `site/lib/fonts.ts`, `site/scripts/measure-reduced-motion.mjs`,
`site/components/sections/Hero.tsx`. No other section, no shell, no copy module.

## 4. Baseline

Filled by T0: SHA, `npm run verify`, `node scripts/measure-reduced-motion.mjs`.
**No CSS checksum gate in this plan** — unlike 002, this one deliberately changes
rendered output, so a byte-identical stylesheet would mean the work did not happen.

## 5. Practices in effect

Unchanged from plan 001 §5. Test-after; gates are `npm run verify` plus the
reduced-motion harness; one commit per task as `drydock(<task-id>): <task name>`,
committed **the moment the criterion passes** (v0.4.0 contract); `isolation: none`;
Haiku mechanical / Sonnet standard-and-complex / Opus contracts-and-reviews; max 5
concurrent executors; criteria run from the repo root. **Plus a human browser gate
at the phase boundary — this is the first plan whose output a human can judge.**

## 6. Findings & constraints

**F1 — The hero must work within the copy that already exists.** `hero` exports
`headline`, `thesis`, `sub`, `waterlineLabel`, `badges` (3), `svgAriaLabel`,
`draftMarks` (6), `keelLabels` (3). `content/copy.ts` is owned by **no task in this
plan**, so a revamp needing a new string is blocked, not merely inconvenienced —
that was plan 001's B1, which blocked three tasks at once. If a new string is
genuinely required, report a deviation; do not invent one and do not hardcode it.

**F2 — The waterline has three ways to go wrong and one right one.** `pathLength`
is implemented by overwriting `stroke-dasharray`, so: use `waterlineReveal`
(clip-based) for the dashed line; **never** `drawLine` on it; **never**
`heroSequence.waterline`, which still animates `pathLength` and survives only
because deleting it was forbidden. `drawLine` remains correct for the solid hull.

**F3 — Attribute pairing, and plan 002's new exports are on the other side of it.**
`pathLength`-animated elements carry `data-reveal-path`; clip/opacity/transform
elements carry `data-reveal` only. **`heroReveal` animates `opacity`/`y`, so its
consumers take `data-reveal`** — copying the attribute from the adjacent hull would
strip the waterline's dash under reduced motion (plan 002 deviation 4). No gate can
check this pairing; a human reads the diff.

**F4 — `heroReveal` is bounded to beats 0–8.** Cadence is
`0.4 + 0.15i + 0.35`; beat 8 ends at 1.95s, level with `heroSequence.label`, and
beat 9 would reach 2.10s past the 2s hero ceiling (plan 002 deviation 5).

**F5 — `useDriftY` degrades correctly but not instantly.** It returns a constant-0
MotionValue when `useMotionSafe()` is false. Two known limits: `useMotionSafe()`
returns `true` until hydration, so a reduced-motion visitor can get **one painted
frame** of drift; and `useScroll({ target })` truncates its range at document
edges, so a short element near the top can rest at a non-zero offset and never
animate in. Both were measured by plan 002's review (notes R1, R2). Consequence for
this plan: **the drift target belongs mid-document, not at the very top of the
page** — which for a hero means drifting an interior layer, not the whole block.

**F6 — `--stroke-*` yields no utilities.** Use `var(--stroke-hair)` in CSS or an
arbitrary-value class; there is no `border-hair`. `--color-raised` and `--text-hero`
**do** generate `bg-raised` / `text-hero` (plan 002 deviation 2).

**F7 — Nothing may bleed to the viewport edge.** `<body>` carries `p-2 sm:p-4` and
the page sits inside a `border border-line` sheet, so `min-h-screen`, `w-screen`
and full-bleed backgrounds overflow the trim (plan 001 deviation 32).

**F8 — A misspelled variant state name compiles clean.** `Variants` is an
index-signature type; `shwon` passes `tsc`, lint and every gate, and silently does
not animate (plan 002 deviation 8). Only `"hidden"` and `"shown"` are wired.

**F9 — Never checksum `index.html`.** It embeds a random per-build id, so two
builds of identical source differ (plan 002 deviation 9). The harness reads the
served DOM; that is the right mechanism.

**F10 — The harness must be extended before the hero uses drift, and must be
proven able to fail.** It currently asserts the waterline dash, stippling, hull
opacity and invisible text — nothing scroll-linked. A new assertion written before
any consumer exists passes **vacuously**, so the task that writes it must also
demonstrate a failing fixture. Plan 001's reduced-motion harness was only trusted
after the defect was deliberately reintroduced and the gate watched failing.

## 7. Decision Log

| # | Question | Decision | Decided by | Rationale |
|---|---|---|---|---|
| 1 | Harness extension before or after the hero uses drift? | **Before** — Wave 1.1, ahead of the hero in Wave 1.2 | planner | Plan 002's M4: applying scroll motion in one plan and auditing it in the next is the ordering that produced plan 001's worst defect. Whoever introduces the risk extends the gate |
| 2 | The new assertion is vacuous until a consumer exists. Accept that? | No — T1.1.1 must ship a **failing fixture** proving the assertion can fail | planner | An unfallible gate is worse than none; it manufactures confidence. Plan 001's harness was only trusted after a controlled reintroduction |
| 3 | Where does drift apply, given F5's edge truncation? | An **interior layer** of the hero SVG (linework), not the hero block itself | planner (assumed — flag if wrong) | A block at the top of the document rests at a truncated offset and never animates in; an interior layer inside a mid-viewport SVG does not |
| 4 | `opsz` axis fix — this plan or later? | Here, Wave 1.0, before the display step lands | planner | Plan 002 handed it over precisely because `--text-hero` worsens the existing shift, and 002's checksum gate could not accommodate a font change |
| 5 | Does the hero get new copy? | No. It works within the eight existing `hero` exports (F1) | planner | `content/copy.ts` is owned by no task here; a needed string is a blocker, reported as a deviation |

## 8. Open questions

| # | Question | Blocks | Recommended answer |
|---|---|---|---|
| Q1 | Should `useMotionSafe`'s one-frame pre-hydration window (F5) be fixed here? | Nothing — the drift is one interior layer and self-corrects sub-frame | Defer. The fix belongs in `lib/motion.ts`, owned by no task in this plan, and plan 002's review noted it is fixable without a hydration mismatch. Record it for whoever next owns that file |

## 9. Out of scope / follow-ups

Other sections, the shell, `content/copy.ts`, `lib/motion.ts`, `globals.css`,
responsive and a11y sweeps (plan 005), N17's draft-mark overlap **unless** the new
display scale makes it worse, and deleting `drawLine`/`revealClip`.

## 10. Execution policies

Per task: one criterion, exit 0, re-run by wavecheck. Per wave: `drydock:wavecheck`,
PASS before the next. Per phase: `Wave 1.R` fresh-context Opus review, APPROVED
required. Escalation: quality-review rejection → 2 retries → tier up → human;
wavecheck BLOCK on ownership or unlogged deviation → no retries → `/drydock:replan`
or human. Checkpointing: one commit per task, committed as soon as the criterion
passes. **Human gate: a browser check at the phase boundary**, served via
`cd site/out && python3 -m http.server 5173` (the export uses absolute `/_next/`
paths, so `file://` will not load assets). Tracker mirroring: none. Reconcile:
deferred to plan 005 (plan 002 deviation 11).

## 11. Pressure-test verdict

*To be filled by the adversarial fresh-context review before approval.*

---

## Phase 0: Pre-flight

#### T0 — Baseline verification
- **Status:** TODO
- **Description:** Record SHA, tree state and both gate results on the untouched tree. Fill §4.
- **Files owned:** `docs/plans/003-hero-revamp.md` (§4 + Progress log)
- **Depends on:** —
- **Model / thinking:** Mechanical / off (Haiku)  **Executor:** drydock:executor
- **Context brief:** This plan §4, §5.
- **Forbidden:** Editing anything under `site/`.
- **Acceptance criterion:**
  `git rev-parse HEAD && cd site && npm run verify && node scripts/measure-reduced-motion.mjs`

---

## Phase 1: Hero

**Exit state:** the hero reads as a modern engineering drawing at display scale;
the harness covers scroll-linked motion and has been observed failing; both gates
green; a human has confirmed it in a browser.

**Phase gate:** `cd site && npm run verify` exits 0; `node scripts/measure-reduced-motion.mjs` exits 0; wavecheck PASS on 1.0–1.3; T1.R.1 APPROVED; **human browser confirmation**; human approval.

### Wave 1.0 — Font metrics
> Single task. Lands before the display step so the larger type never ships on
> unpinned metrics.

#### T1.0.1 — Pin the display face's optical axis
- **Status:** TODO
- **Description:** Pin `Big_Shoulders`'s `opsz` axis so `--text-hero` renders at its
  intended optical weight, and reduce the layout shift the missing `size-adjust`
  metrics cause.
- **Files owned:** `site/lib/fonts.ts`
- **Depends on:** T0
- **Model / thinking:** Standard / default (Sonnet)  **Executor:** drydock:executor
- **Context brief:** This plan §1, Decision 4. Read `site/lib/fonts.ts`. CLAUDE.md's
  note on `Big_Shoulders`.
- **Forbidden:** Adding a new font family. Changing `IBM_Plex_Mono` or `Archivo`.
  Renaming any `--font-src-*` variable — `globals.css` maps them and is not owned
  here. Touching any other file.
- **Implementation sketch:** add `axes: ["opsz"]` to the `Big_Shoulders` call so the
  optical-size axis is served rather than defaulted at 14. Report whether the build's
  `Failed to find font override values` warning changes — it may persist, since that
  is about `size-adjust` metrics rather than axes, and if so say so plainly rather
  than implying the shift is fixed.
- **Acceptance criterion:**
  `cd site && npx eslint lib/fonts.ts && printf '{"extends":"'"$PWD"'/tsconfig.json","include":[],"files":["'"$PWD"'/lib/fonts.ts"]}' > /tmp/dd3-f.json && npx tsc --noEmit --project /tmp/dd3-f.json && grep -q "opsz" lib/fonts.ts && grep -q -- "--font-src-display" lib/fonts.ts && grep -q "IBM_Plex_Mono" lib/fonts.ts && grep -q "Archivo" lib/fonts.ts && npm run build >/dev/null && npm run verify >/dev/null`

### Wave 1.1 — Harness extension
> Single task, and deliberately **ahead of** the hero. Whoever introduces a risk
> class extends the gate that covers it (Decision 1).

#### T1.1.1 — Extend the harness to cover scroll-linked motion
- **Status:** TODO
- **Description:** Add an assertion that scroll-linked transforms are inert under
  reduced motion, and prove it can fail.
- **Files owned:** `site/scripts/measure-reduced-motion.mjs`
- **Depends on:** T1.0.1
- **Model / thinking:** Complex / extended (Sonnet)  **Executor:** drydock:executor
- **Context brief:** This plan §1, F5, F10, Decisions 1–2. Read
  `site/scripts/measure-reduced-motion.mjs` and `useDriftY` in `site/lib/motion.ts`.
- **Forbidden:** Weakening or removing any existing assertion (C1, C2, M1, the
  invisible-text check, or the reduced-motion control). Adding a runtime dependency.
  Wiring the harness into `npm run verify` — it needs Chrome and stays a separate
  deliberate step. Touching `lib/motion.ts` or any component.
- **Implementation sketch:**
  - Under forced reduced motion, assert that every element carrying the drift
    marker has **no scroll-induced transform** — i.e. its computed `transform` is
    `none` or an identity matrix, and stays so across two scroll positions.
  - The marker must be something a component can carry without inventing copy;
    `data-drift` is the natural choice. State it in your report — the hero task
    depends on the name.
  - **Prove it can fail (Decision 2).** The assertion is vacuous until the hero
    lands, so add a fixture: inject an element that drifts under reduced motion,
    confirm the harness exits non-zero and names the assertion, then remove it. This
    is the same method that made plan 001's harness trustworthy.
  - Keep the existing per-assertion failure report shape.
- **Acceptance criterion:**
  `cd site && npx eslint scripts/measure-reduced-motion.mjs && node --check scripts/measure-reduced-motion.mjs && grep -q "data-drift" scripts/measure-reduced-motion.mjs && for a in "C1" "C2" "M1" "control"; do grep -q "$a" scripts/measure-reduced-motion.mjs || exit 1; done && node scripts/measure-reduced-motion.mjs`

### Wave 1.2 — The hero
> Single task. The gate for its riskiest behaviour now exists and has been seen to
> fail.

#### T1.2.1 — Revamp the hero at display scale
- **Status:** TODO
- **Description:** Rebuild the hero as the page's modern centrepiece using plan
  002's vocabulary, keeping every honesty and accessibility property it already has.
- **Files owned:** `site/components/sections/Hero.tsx`
- **Depends on:** T1.1.1
- **Model / thinking:** Complex / extended (Sonnet)  **Executor:** drydock:executor
- **Context brief:** This plan §1, F1–F9, Decisions 1, 3, 5. Read
  `site/lib/motion.ts` (its header states the attribute contract),
  `site/content/copy.ts`, `site/app/globals.css`, and the current
  `site/components/sections/Hero.tsx`.
- **Forbidden:** Hardcoding any copy, or adding a string to `content/copy.ts` —
  which this plan does not own (F1). `heroSequence.waterline` or `drawLine` on the
  waterline (F2). `data-reveal-path` on any clip/opacity-animated element (F3).
  `heroReveal` beats above 8 (F4). Any timing literal — `duration:`, `delay:`,
  `duration-N` all fail the copy harness. `min-h-screen`, `w-screen`, full-bleed
  backgrounds (F7). A second accent colour. Diffuse shadow, blur, glass. Wrapping
  itself in `<Section>` — Hero is exempt. Adding a second `<h1>`.
- **Implementation sketch:**
  - `hero.headline` stays the page's only `<h1>`, now at `text-hero`.
  - Keep the hull-in-cradle SVG, `drawLine` on the solid hull with
    `data-reveal-path`, and the dashed waterline via `waterlineReveal` with
    `data-reveal` and its own `strokeDasharray`.
  - Use `heroReveal(i)` for the new staged beats — badges, thesis, sub, draft
    marks, keel labels — within beats 0–8.
  - Apply `useDriftY` to an **interior linework layer** and mark it `data-drift`
    (the name T1.1.1 asserts). Not the hero block: F5's edge truncation would leave
    a top-of-document element resting at a non-zero offset.
  - Depth from `--color-raised` planes and the `--stroke-*` ramp via
    `var(--stroke-hair)` etc. — no `border-hair` class exists (F6).
  - Keep `hero.svgAriaLabel` on the `<svg role="img">`, and every string from
    `content/copy.ts`.
- **Acceptance criterion:**
  `cd site && npx eslint components/sections/Hero.tsx && printf '{"extends":"'"$PWD"'/tsconfig.json","include":[],"files":["'"$PWD"'/components/sections/Hero.tsx"]}' > /tmp/dd3-h.json && npx tsc --noEmit --project /tmp/dd3-h.json && grep -q "text-hero" components/sections/Hero.tsx && grep -q "heroReveal" components/sections/Hero.tsx && grep -q "useDriftY" components/sections/Hero.tsx && grep -q "data-drift" components/sections/Hero.tsx && grep -q "waterlineReveal" components/sections/Hero.tsx && grep -q "<h1" components/sections/Hero.tsx && ! grep -qF "heroSequence.waterline" components/sections/Hero.tsx && ! grep -qE "(duration|delay):|duration-[0-9]|min-h-screen|w-screen" components/sections/Hero.tsx && npm run verify && node scripts/measure-reduced-motion.mjs`

### Wave 1.3 — Integration

#### T1.3.1 — Integration verification
- **Status:** TODO
- **Description:** Run both gates against the revamped hero and record the result. Fixes nothing.
- **Files owned:** `docs/plans/003-hero-revamp.md` (Progress log)
- **Depends on:** T1.2.1
- **Model / thinking:** Mechanical / off (Haiku)  **Executor:** drydock:executor
- **Context brief:** This plan §10.
- **Forbidden:** Editing anything under `site/`. Fixing a failing gate — record a deviation and route per §10.
- **Acceptance criterion:**
  `cd site && npm run verify && node scripts/measure-reduced-motion.mjs`

### Wave 1.R — Quality review

#### T1.R.1 — Fresh-context quality review
- **Status:** TODO
- **Description:** Judge whether the hero is genuinely modern **and** still an
  engineering drawing, whether the attribute pairing is right (no gate can check
  it), and whether the harness extension is real rather than vacuous.
- **Files owned:** `docs/plans/003-hero-revamp.md` (Progress log)
- **Depends on:** T1.3.1 and wavecheck PASS on 1.0–1.3
- **Model / thinking:** Judgment / extended (Opus)  **Executor:** drydock:executor
- **Context brief:** `git diff <T0 SHA>..HEAD -- site/`, this plan, §7. Use a
  headless browser; screenshots are permitted and encouraged.
- **Forbidden:** Editing anything under `site/`. Re-litigating §7.
- **Acceptance criterion:** Verdict APPROVED or REJECTED with specific findings
  appended to the Progress log, committed as
  `drydock(T1.R.1): fresh-context quality review of plan 003`.

---

## Deviation Log

| # | Task | What deviated | Why | Impact | Recorded |
|---|------|---------------|-----|--------|----------|
| — | — | — | — | — | — |

## Wavecheck reports

*Appended by `drydock:wavecheck`, one section per wave.*

## Progress log

| Date | Task | Result | Notes |
|------|------|--------|-------|
| 2026-08-19 | — | Plan drafted | Carries ten inherited constraints from plans 001–002 as F1–F10; each traces to a defect already paid for |

## Reconcile report

*Deferred to plan 005 (plan 002 deviation 11), which reconciles 002–005 together.*
