---
plan: 002-design-system-modernisation
format_version: 2
status: DRAFT
isolation: none
created: 2026-08-19
approved_by: unapproved
---

# 002 — Design system modernisation

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

`site/`'s design system gains the vocabulary a modern revamp needs, and nothing
else changes. Specifically: a third surface tier so depth can be built from
layered planes rather than shadows; a display type step large enough to carry a
section-scale visual moment; and motion primitives for choreographed scroll —
scroll-linked drift and per-index anchor reveals — each with a reduced-motion
path. **No section content, no shell structure, no copy, and no second accent
colour.** Done means the existing gates stay green and every new name is present.

## 2. Spec reference

None. Design direction decided by the human on 2026-08-19: *blueprint substrate
plus modern devices* — keep the sheet frame, draft marks, single primer accent,
mono labels and grid; add contemporary weight through type scale, contrast steps,
per-section visual anchors and choreographed motion. Recorded as Decision 1.

## 3. Surgical-scope statement

Three files: `site/app/globals.css`, `site/lib/fonts.ts`, `site/lib/motion.ts`.
Additive only — no existing token, export, or rule is renamed or removed, because
seven section components and the shell consume them.

## 4. Baseline

Filled by T0. Pre-observed 2026-08-19: HEAD `03233e0`, tree clean, `npm run verify`
PASS (`14 literals, 4x executor, 1 h1, motion contract`),
`node scripts/measure-reduced-motion.mjs` PASS.

## 5. Practices in effect

Unchanged from plan 001 §5 and not re-interviewed — same repo, same human, same
toolchain. Restated for a fresh executor: test-after; gates are `npm run verify`
plus the reduced-motion harness; one commit per task as
`drydock(<task-id>): <task name>`, committed **the moment the criterion passes**
(v0.4.0 contract); `isolation: none`; human approval at the phase gate; Haiku
mechanical / Sonnet standard-and-complex / Opus contracts-and-reviews; max 5
concurrent executors; criteria run from the repo root.

## 6. Findings & constraints

**F1 — Additive only, because the consumers are frozen.** Nine `@theme` tokens and
ten `lib/motion.ts` exports are consumed by the shell and all seven sections.
Renaming or removing any is out of scope and would require touching files this
plan does not own.

**F2 — Tailwind v4 tree-shakes unreferenced `@theme` tokens**, and a mistyped name
emits nothing with no error. New tokens will therefore be **absent from the
compiled CSS until a later plan consumes them** — that is expected, not a defect,
and criteria must assert on source rather than on `out/`.

**F3 — Every motion primitive needs a reduced-motion path.** `NO_MOTION` is the
swap target and must never set `pathLength` (plan 001 deviation 45 — it destroys
author dash patterns). Scroll-linked motion is a **new risk class** here: a
`useScroll`-driven transform is not covered by the existing `[data-reveal]` CSS
restore, so each new primitive must state how it degrades.

**F4 — The reduced-motion harness asserts today's contract only.** It checks the
waterline dash, stippling, hull opacity and invisible text. It will not catch a
new scroll-linked primitive that ignores reduced motion. Extending it belongs to
plan 005, and until then that gap is open.

**F5 — Timing literals live only in `lib/motion.ts`.** Section files fail the
harness on `duration:` / `delay:` / `duration-N`, so any cadence a later plan
needs must be exported from here.

## 7. Decision Log

| # | Question | Decision | Decided by | Rationale |
|---|---|---|---|---|
| 1 | How far from the current austerity? | Blueprint substrate + modern devices: keep frame, draft marks, single accent, mono labels, grid; add display scale, contrast steps, per-section anchors, choreographed motion | user | The prior review treated "landing page" as a failure mode; this extends that finding rather than reversing it |
| 2 | How is depth built? | A third surface tier (`--color-raised`) and layered linework. **No box-shadows, no blur, no glass.** | planner (assumed — flag if wrong) | Shadows are the landing-page tell verdict D objected to; a drawing gets depth from stacked planes and stroke weight |
| 3 | Do new tokens replace old ones? | No — purely additive (F1) | planner | Nine tokens and ten exports have frozen consumers |
| 4 | Scroll-linked motion, given F3? | Permitted, but each primitive must export a reduced-motion variant AND be documented as scroll-linked so plan 005 can extend the harness to cover it | planner (assumed — flag if wrong) | The existing CSS restore cannot reach a JS-driven scroll transform; the gap must be named now rather than discovered later |

## 8. Open questions

| # | Question | Blocks | Recommended answer |
|---|---|---|---|
| Q1 | Should the harness be extended to cover scroll-linked motion in this plan rather than 005? | Nothing — F4 records the gap | Defer to 005, where responsive and a11y re-verification also land. Extending it here would mean owning `scripts/` for one assertion |

## 9. Out of scope / follow-ups

Section components, `layout.tsx`, `Section.tsx`, `page.tsx`, `content/copy.ts`,
the harness scripts, the draft-mark overlap fix (N17), and any deployment work.
Plans 003–005 consume what this plan produces.

## 10. Execution policies

Per task: the single criterion must exit 0, re-run independently by wavecheck.
Per wave: `drydock:wavecheck`, PASS required before the next wave.
Per phase: `Wave 1.R` fresh-context Opus review; APPROVED required at the gate.
Escalation: quality-review rejection → max 2 retries → tier up → human. Wavecheck
BLOCK on ownership or unlogged deviation → no retries, route to `/drydock:replan`
or a human.
Checkpointing: one commit per task, committed as soon as the criterion passes.
Human gate: approval at the phase gate. No browser gate — this plan changes no
rendered output that a human could judge; plan 003 introduces the first visible
change.
Tracker mirroring: none. Final step: `drydock:reconcile`.

## 11. Pressure-test verdict

*To be filled by the adversarial fresh-context review before approval.*

---

## Phase 0: Pre-flight

#### T0 — Baseline verification
- **Status:** TODO
- **Description:** Record HEAD, tree state, and both gate results on the untouched tree. Fill §4.
- **Files owned:** `docs/plans/002-design-system-modernisation.md` (§4 + Progress log)
- **Depends on:** —
- **Model / thinking:** Mechanical / off (Haiku)  **Executor:** drydock:executor
- **Context brief:** This plan §4, §5.
- **Forbidden:** Editing anything under `site/`. Editing any plan section but §4 and the Progress log.
- **Acceptance criterion:**
  `git rev-parse HEAD && cd site && npm run verify && node scripts/measure-reduced-motion.mjs`

---

## Phase 1: Design system extension

**Exit state:** the token and motion vocabularies carry everything plans 003–005
need; both gates green; no consumer changed.

**Phase gate:** `cd site && npm run verify` exits 0; `node scripts/measure-reduced-motion.mjs` exits 0; wavecheck PASS on 1.0 and 1.1; T1.R.1 APPROVED; human approval.

### Wave 1.0 — Contracts
> Two parallel tasks, disjoint files, neither importing the other's output.
> Criteria are source-scoped: new tokens are tree-shaken until consumed (F2), so
> asserting on `out/` would fail for a correct implementation.

#### T1.0.1 — Surface tiers and display scale
- **Status:** TODO
- **Description:** Add a third surface tier and the large display step, plus any
  supporting scale tokens, as additive `@theme` entries. Register no new font.
- **Files owned:** `site/app/globals.css`, `site/lib/fonts.ts`
- **Depends on:** T0
- **Model / thinking:** Judgment / extended (Opus)  **Executor:** drydock:executor
- **Context brief:** This plan §1, §6 (F1, F2), Decisions 1–3. Read
  `site/app/globals.css`.
- **Forbidden:** Renaming or removing any of the nine existing tokens. A second
  accent colour — primer stays the only warm hue. `box-shadow`, `backdrop-filter`,
  `filter: blur()`, or gradient meshes (Decision 2). Touching `lib/motion.ts`,
  `components/`, `content/`, `app/layout.tsx`, `app/page.tsx`.
- **Implementation sketch:**
  - `--color-raised` — a third tier above `--color-panel`, so surfaces read
    dock → panel → raised. State its measured contrast against `--color-ink` and
    against `--color-dock` in your report.
  - `--text-hero` — a display step above `--text-sheet`, `clamp()`-based, with
    paired line-height and letter-spacing in the existing `--text-*` idiom.
  - Keep the reduced-motion block and the nine contract tokens untouched.
- **Acceptance criterion:**
  `cd site && npx eslint lib/fonts.ts && printf '{"extends":"'"$PWD"'/tsconfig.json","include":[],"files":["'"$PWD"'/lib/fonts.ts"]}' > /tmp/dd2-f.json && npx tsc --noEmit --project /tmp/dd2-f.json && grep -q -- "--color-raised:" app/globals.css && grep -q -- "--text-hero:" app/globals.css && for t in --color-dock --color-panel --color-line --color-ink --color-ink-dim --color-primer --font-display --font-mono --font-body; do grep -q -- "$t:" app/globals.css || exit 1; done && ! grep -qE "box-shadow|backdrop-filter|blur\(" app/globals.css && grep -q "prefers-reduced-motion" app/globals.css`

#### T1.0.2 — Choreography primitives
- **Status:** TODO
- **Description:** Add the motion primitives for scroll-choreographed sections —
  scroll-linked drift and a per-index anchor reveal — each with a reduced-motion
  path. Additive; the ten existing exports are untouched.
- **Files owned:** `site/lib/motion.ts`
- **Depends on:** T0
- **Model / thinking:** Judgment / extended (Opus)  **Executor:** drydock:executor
- **Context brief:** This plan §1, §6 (F1, F3, F5), Decisions 1, 4. Read
  `site/lib/motion.ts` including its header contract.
- **Forbidden:** Renaming or removing any of the ten existing exports. Adding
  `pathLength` to `NO_MOTION` (destroys author dash patterns — plan 001
  deviation 45). Spring physics, bounce, or overshoot. Writing JSX. Touching
  `globals.css`, `components/`, `content/`.
- **Implementation sketch:**
  - `anchorReveal(i: number)` — per-index reveal for a section's visual anchor,
    in the cadence idiom of the existing `revealClipStagger`.
  - `parallaxDrift` — a scroll-linked y-offset for layered linework. Export the
    config, not a hook that assumes a component shape, so plan 004 can apply it.
  - **Each new primitive must have a documented reduced-motion path**, and the
    file header must state that scroll-linked motion is **not** covered by the
    `[data-reveal]` CSS restore (F3/F4) — a consumer must branch on
    `useMotionSafe()` itself.
  - State names stay exactly `"hidden"` / `"shown"` (silent failure otherwise).
- **Acceptance criterion:**
  `cd site && npx eslint lib/motion.ts && printf '{"extends":"'"$PWD"'/tsconfig.json","include":[],"files":["'"$PWD"'/lib/motion.ts"]}' > /tmp/dd2-m.json && npx tsc --noEmit --project /tmp/dd2-m.json && grep -q "anchorReveal" lib/motion.ts && grep -q "parallaxDrift" lib/motion.ts && for n in sectionReveal staggerChildren childRise drawLine revealClip revealClipStagger heroSequence waterlineReveal useMotionSafe NO_MOTION; do grep -q "$n" lib/motion.ts || exit 1; done && node -e "const s=require('fs').readFileSync('lib/motion.ts','utf8');const m=s.match(/export const NO_MOTION[\s\S]*?\n};/);process.exit(m[0].includes('pathLength')?1:0)"`

### Wave 1.1 — Integration
> Single task; first point a full build is safe.

#### T1.1.1 — Integration verification
- **Status:** TODO
- **Description:** Run both gates against the extended system and record the
  result. Fixes nothing.
- **Files owned:** `docs/plans/002-design-system-modernisation.md` (Progress log)
- **Depends on:** T1.0.1, T1.0.2
- **Model / thinking:** Mechanical / off (Haiku)  **Executor:** drydock:executor
- **Context brief:** This plan §10.
- **Forbidden:** Editing anything under `site/`. Fixing a failing gate — a failure
  is a deviation to record and route per §10.
- **Acceptance criterion:**
  `cd site && npm run verify && node scripts/measure-reduced-motion.mjs`

### Wave 1.R — Quality review

#### T1.R.1 — Fresh-context quality review
- **Status:** TODO
- **Description:** Judge whether the extended vocabulary is actually sufficient for
  plans 003–005 to build against without guessing, and whether Decision 2's
  no-shadows constraint was honoured in spirit as well as in grep.
- **Files owned:** `docs/plans/002-design-system-modernisation.md` (Progress log)
- **Depends on:** T1.1.1 and wavecheck PASS on 1.0, 1.1
- **Model / thinking:** Judgment / extended (Opus)  **Executor:** drydock:executor
- **Context brief:** the plan diff, this plan, §7. Measure the new tokens'
  contrast ratios rather than accepting reported values.
- **Forbidden:** Editing anything under `site/`. Re-litigating §7.
- **Acceptance criterion:** Verdict APPROVED or REJECTED with specific findings
  appended to the Progress log, committed as
  `drydock(T1.R.1): fresh-context quality review of plan 002`.

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
| 2026-08-19 | — | Plan drafted | Lean by design: plan 001 ran 2,069 lines for a 240-line artifact, which its own case study flagged as disproportionate |

## Reconcile report

*Appended once by `drydock:reconcile` at completion.*
