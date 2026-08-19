---
plan: 002-design-system-modernisation
format_version: 2
status: EXECUTING
isolation: none
created: 2026-08-19
approved_by: sandeep
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

Recorded 2026-08-19. HEAD `9e6fadc04e9c4c77989ab97eb45e9b89e3f65e82`, tree clean.
`npm run verify` PASS (`14 literals, 4x executor, 1 h1, motion contract`).
`node scripts/measure-reduced-motion.mjs` PASS (reducedMotion=true, waterline="10px, 8px", stippled=0, hull={"opacity":"1","dasharray":"none"}, invisibleText=0).

**Compiled stylesheet baseline:**
- Basename: `1s2vcbm8xcik1.css`
- Shasum: `40b6a434624dbb530bd0bbb2bd002125acba1037`

This shasum is the load-bearing one (F7): Wave 1.0's criteria compare against it to verify no accidental compiled changes. Purely additive `@theme` work leaves the stylesheet byte-identical.

## 5. Practices in effect

Unchanged from plan 001 §5 and not re-interviewed — same repo, same human, same
toolchain. Restated for a fresh executor: test-after; gates are `npm run verify`
plus the reduced-motion harness; one commit per task as
`drydock(<task-id>): <task name>`, committed **the moment the criterion passes**
(v0.4.0 contract); `isolation: none`; human approval at the phase gate; Haiku
mechanical / Sonnet standard-and-complex / Opus contracts-and-reviews; max 5
concurrent executors; criteria run from the repo root.

## 6. Findings & constraints

**F1 — Additive only, because the consumers are frozen. Corrected against the
actual tree (the first draft of this finding was wrong in both directions):**

- `app/globals.css` defines **25 named tokens**, not nine: 6 `--color-*`,
  3 `--font-*`, 6 `--text-*`, 7 `--text-*--line-height`/`--letter-spacing`
  modifiers, and 3 grid vars. **All six `--text-*` steps are consumed** across
  `Section.tsx`, `layout.tsx` and six section files (10 usages).
- `lib/motion.ts` exports ten names, imported by **4 files only** —
  `Section.tsx`, `Hero.tsx`, `Terminal.tsx`, `Lifecycle.tsx` — not by all seven
  sections. **`drawLine` and `revealClip` have zero consumers today**: they are
  already dead exports, which is context for adding two more speculative ones.

**F2 — Tailwind v4 tree-shakes unreferenced `@theme` tokens**, and a mistyped or
deleted name emits nothing with no error. New tokens will therefore be absent from
the compiled CSS until a later plan consumes them — expected, not a defect. The
dangerous corollary: **rescaling or deleting an existing `--text-*` token makes
every `<h2>` render at browser default and `npm run verify` still exits 0.**
Verified. Neither existing gate looks at type size.

**F7 — The compiled-CSS checksum is the only gate that can see F2's failure
mode.** The emitted stylesheet is content-hashed. A purely additive change to
`@theme` leaves it **byte-identical** (verified: an unreferenced token adds
nothing). So T0 records its `shasum`, and every Wave-1.0 criterion asserts the
checksum still matches. This is also the only mechanical test of §10's claim that
this plan changes no rendered output.

**F8 — Substring greps do not guard exports or tokens.** `grep -q "revealClip"`
is satisfied by `revealClipStagger`; `grep -q "drawLine"` is satisfied by its own
doc comment. Both export blocks were deleted from a copy and the guard loop still
passed. Every name assertion in this plan is therefore **anchored**:
`grep -qE "^export (const|function) <name>\b"` for exports, `--<name>:` for
tokens. This class of error has now occurred three times in this repo's history —
treat an unanchored name grep as a defect on sight.

**F3 — Scroll-linked motion is a new risk class and gets a single auditable
branch.** `NO_MOTION` is the swap target for variant-driven motion and must never
set `pathLength` (plan 001 deviation 45 — it destroys author dash patterns). But
`NO_MOTION` **cannot** stand in for a MotionValue-driven transform, and a hook
cannot be called conditionally. So scroll drift is exported as **one hook,
`useDriftY(ref)`, which itself returns a constant-0 MotionValue when
`useMotionSafe()` is false.** Six consumers in plan 004 then get one correct
branch instead of six chances to get it wrong. `assert-copy.mjs` only checks that
the string `useMotionSafe` is present, never that the branch is correct.

**F4 — The reduced-motion harness cannot see scroll-linked motion, and the fix
must precede the exposure.** It asserts the waterline dash, stippling, hull
opacity and invisible text — nothing scroll-driven. Plan 004 *applies* scroll
motion. **Extending the harness is therefore a blocking prerequisite of plan 004,
not a plan-005 item** (§9). Shipping unguarded scroll motion and auditing it a
plan later is the ordering that produced plan 001's worst defect.

**F6 — Frozen contract: the exact names and types plans 003–005 receive.** Values
are delegated to Judgment tier; **names and types are not.** Plans 003–005 cannot
be written against names an executor invents.

| New name | File | Shape | Consumed by |
|---|---|---|---|
| `--color-raised` | globals.css | colour, third surface tier | 003, 004 |
| `--text-hero` | globals.css | `clamp()` + paired line-height/letter-spacing | 003 |
| `--stroke-hair` / `--stroke-rule` / `--stroke-heavy` | globals.css | length; the stroke-weight ramp Decision 2 names as the depth mechanism | 003, 004 |
| `anchorReveal(i: number)` | motion.ts | `Variants`, per-index, `"hidden"`/`"shown"` | 004 |
| `heroReveal(i: number)` | motion.ts | `Variants`, per-beat, so 003 adds hero beats without a timing literal | 003 |
| `useDriftY(ref)` | motion.ts | hook → `MotionValue<number>`; constant 0 when `useMotionSafe()` is false (F3) | 003, 004 |

**Namespace note (deviation 2):** `--color-*` and `--text-*` are Tailwind v4 theme
namespaces and yield utilities (`bg-raised`, `text-hero`). `--stroke-*` is **not** —
those three are bare custom properties, consumed as `var(--stroke-hair)` in CSS.

Nothing outside this table may be added. Motion exports carry `satisfies` types
against the `motion` package's own, matching `heroSequence`'s existing idiom —
untyped object literals pass single-file `tsc` and fail only in a later plan that
does not own this file.

**F5 — Timing literals live only in `lib/motion.ts`.** Section files fail the
harness on `duration:` / `delay:` / `duration-N`, so any cadence a later plan
needs must be exported from here.

## 7. Decision Log

| # | Question | Decision | Decided by | Rationale |
|---|---|---|---|---|
| 1 | How far from the current austerity? | Blueprint substrate + modern devices: keep frame, draft marks, single accent, mono labels, grid; add display scale, contrast steps, per-section anchors, choreographed motion | user | The prior review treated "landing page" as a failure mode; this extends that finding rather than reversing it |
| 2 | How is depth built? | A third surface tier (`--color-raised`), a stroke-weight ramp, and layered planes. **No diffuse shadow (any blur radius > 0), no `blur()`, no glass, no radial-gradient glow.** A zero-blur hairline edge (`box-shadow: inset 0 1px 0 var(--color-line)`) **is** permitted — it is the canonical stacked-plane edge and Decision 2's own mechanism | planner (assumed — flag if wrong) | Diffuse shadow is the landing-page tell verdict D objected to; a drawing gets depth from stacked planes and stroke weight. The first wording banned the hairline it meant to require, and its grep missed `drop-shadow`, `text-shadow` and gradient glows |
| 5 | What contrast must `--color-raised` hold? | `--color-ink-dim` ≥ 4.5:1 **on raised**, `--color-primer` ≥ 4.5:1 **on raised**, and raised ≥ 1.15:1 **against `--color-panel`** so it reads as a distinct tier | planner (assumed — flag if wrong) | The first draft asked for contrast against `--color-ink` (14–16:1, cannot fail) and `--color-dock` (not the adjacent tier). The two pairs that actually fail were unmeasured, and the reviewer had no rubric. A plausible tier like `#1a4159` gives ink-dim 4.22:1 — below AA — while sitting only 1.53:1 from panel |
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

**Handed to plan 003:** pinning `Big_Shoulders`'s `opsz` axis and its missing
`size-adjust` metrics. `--text-hero` makes the existing layout shift worse, but the
fix changes emitted font CSS and so cannot coexist with this plan's checksum gate
(F7). Plan 003 renders the display step and can judge it in a browser.

**Reordered dependency (F4):** extending `scripts/measure-reduced-motion.mjs` to
cover scroll-linked motion is a **blocking prerequisite of plan 004**, which is the
plan that applies it. It is no longer a plan-005 item. Plan 004 must not open until
that assertion exists, or it ships unguarded scroll motion.

## 10. Execution policies

Per task: the single criterion must exit 0, re-run independently by wavecheck —
except review tasks, whose criterion is a written verdict (permitted by the format
contract's Wave x.R template). A verdict of REJECTED satisfies the criterion but
**fails the phase gate**, which requires APPROVED.
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

**Round 1 — REJECTED** (fresh-context Opus, 2026-08-19). 4 CRITICAL, 5 MAJOR,
5 MINOR. It proved its exploits rather than asserting them. All confirmed findings
are fixed above:

| Finding | Fix |
|---|---|
| C1 Export guard non-functional — both export blocks deleted from a copy and the loop still passed (`revealClip` matched by `revealClipStagger`, `drawLine` by its own doc comment) | F8 + every name assertion anchored to `^export (const\|function) <name>\b`. **Independently reproduced by the orchestrator before accepting.** |
| C2 Six consumed `--text-*` tokens unguarded; deleting one renders every `<h2>` at browser default with `verify` still green | Guard extended to all 15 named colour/font/text tokens; F1/F2 corrected |
| C3 Wave 1.0 never builds, so a broken `@theme` surfaces at a task forbidden from fixing it | Both Wave-1.0 criteria end with `npm run build` + a compiled-CSS `shasum` diff against T0's baseline (F7) |
| C4 Labelled a Contracts wave but pinned no contract — no names, no types | F6's frozen name/type table; "plus any supporting scale tokens" deleted; `satisfies` types required; `--stroke-*` ramp and `heroReveal` added because **nothing in the first draft served plan 003** |
| M1 F1 factually wrong in both directions | Corrected: 25 named tokens not 9; 4 importers not "the shell and all seven sections"; `drawLine`/`revealClip` already dead |
| M2 No contrast threshold, and the criterion asked for pairs that cannot fail | Decision 5: ink-dim ≥ 4.5:1 and primer ≥ 4.5:1 **on raised**, raised ≥ 1.15:1 vs panel |
| M3 Shadow grep bypassable (`drop-shadow`, `text-shadow`, radial glow) **and** over-broad (banned the zero-blur hairline it meant to require) | Decision 2 reworded to "no diffuse shadow (blur > 0)"; grep widened to `shadow\|backdrop-filter\|blur(\|radial-gradient` |
| M4 Scroll motion applied in 004, audited in 005 — the ordering that produced plan 001's worst defect | `useDriftY(ref)` owns the reduced-motion branch in one place; harness extension is now a **blocking prerequisite of plan 004** |
| M5 T1.R.1 pointed at the plan document's diff, not the code diff | Context brief corrected |
| minors | Baseline SHA `03233e0` → `7cb635a`; §10's blanket criterion claim qualified for review tasks and notes REJECTED fails the gate; T1.0.1 gains `data-reveal-path`/`stroke-dasharray` guards |

**One fix introduced a conflict, caught by the orchestrator while verifying:**
owning `lib/fonts.ts` to pin the `opsz` axis contradicts the new checksum gate,
because font changes alter the emitted CSS. `fonts.ts` was removed from ownership
and the axis fix handed to plan 003 (§9).

**Round 2:** not run. The repair is ~20 lines of specification against a 4-task
plan, every finding was independently reproduced before acceptance, and the
verdict's own assessment was that 269 lines is the right length — it crossed only
into delegating names and types alongside values.

---

## Phase 0: Pre-flight

#### T0 — Baseline verification
- **Status:** TODO
- **Description:** Record HEAD, tree state, both gate results, **and the basename
  and `shasum` of the compiled stylesheet** on the untouched tree. Wave 1.0's
  criteria compare against that checksum (F7). Fill §4.
- **Files owned:** `docs/plans/002-design-system-modernisation.md` (§4 + Progress log)
- **Depends on:** —
- **Model / thinking:** Mechanical / off (Haiku)  **Executor:** drydock:executor
- **Context brief:** This plan §4, §5.
- **Forbidden:** Editing anything under `site/`. Editing any plan section but §4 and the Progress log.
- **Acceptance criterion:**
  `git rev-parse HEAD && cd site && npm run verify && node scripts/measure-reduced-motion.mjs && shasum out/_next/static/chunks/*.css | tee /tmp/dd2-css-baseline.txt`

---

## Phase 1: Design system extension

**Exit state:** the token and motion vocabularies carry everything plans 003–005
need; both gates green; no consumer changed.

**Phase gate:** `cd site && npm run verify` exits 0; `node scripts/measure-reduced-motion.mjs` exits 0; wavecheck PASS on 1.0, 1.1 and 1.2; T1.R.1 APPROVED; human approval.

### Wave 1.0 — Contracts: tokens
> **Single task, deliberately not parallel.** The C3 fix ends each criterion with
> `npm run build` plus a compiled-CSS checksum diff. Two concurrent builds write
> the same `site/out` and `site/.next`, which is the shared-build-directory race
> plan 001 Decision 16 forbids — one task's checksum would be diffed against a
> stylesheet the other task built. Serializing costs almost nothing at two tasks
> and keeps both the build gate (C3) and the isolation rule (Decision 16). Logged
> as deviation 1.

#### T1.0.1 — Surface tier, display step, stroke ramp
- **Status:** TODO
- **Description:** Add the third surface tier, the large display step, and the
  stroke-weight ramp as additive `@theme` entries. `globals.css` only.
- **Files owned:** `site/app/globals.css`
- **Depends on:** T0
- **Model / thinking:** Judgment / extended (Opus)  **Executor:** drydock:executor
- **Context brief:** This plan §1, §6 (F1, F2), Decisions 1–3. Read
  `site/app/globals.css`.
- **Forbidden:** Renaming or removing any of the nine existing tokens. A second
  accent colour — primer stays the only warm hue. `box-shadow`, `backdrop-filter`,
  `filter: blur()`, or gradient meshes (Decision 2). Touching `lib/motion.ts`,
  `components/`, `content/`, `app/layout.tsx`, `app/page.tsx`.
- **Implementation sketch:**
  - Add **exactly** the names in F6's table for this file: `--color-raised`,
    `--text-hero`, and the `--stroke-hair` / `--stroke-rule` / `--stroke-heavy`
    ramp. **Nothing else** — no "supporting" tokens of your own choosing.
  - `--color-raised` must satisfy Decision 5's three thresholds. **Compute and
    report all three ratios**: ink-dim on raised, primer on raised, raised vs
    panel. Do not report ink-on-raised — it cannot fail and is not the constraint.
  - `--text-hero` — a display step above `--text-sheet`, `clamp()`-based, with
    paired line-height and letter-spacing in the existing `--text-*` idiom.
  - **Do not rescale or remove any existing `--text-*` step.** Six are consumed in
    10 places and Tailwind emits nothing for a missing token — an `<h2>` would
    silently render at browser default with every gate still green (F2).
  - Leave the reduced-motion block, both restore selectors, and all 25 existing
    named tokens untouched.
  - **Do not touch `lib/fonts.ts`.** `Big_Shoulders` has an unpinned `opsz` axis
    and no `size-adjust` metrics, so `--text-hero` will worsen existing layout
    shift — but pinning the axis changes the emitted font CSS, which would break
    this task's checksum gate (F7). That fix belongs to plan 003, which actually
    renders the display step and can judge it in a browser.
- **Acceptance criterion:**
  `cd site && for t in --color-raised --text-hero --stroke-hair --stroke-rule --stroke-heavy; do grep -q -- "$t:" app/globals.css || exit 1; done && for t in --color-dock --color-panel --color-line --color-ink --color-ink-dim --color-primer --font-display --font-mono --font-body --text-mark --text-note --text-body --text-lead --text-title --text-sheet; do grep -q -- "$t:" app/globals.css || exit 1; done && ! grep -qE "shadow|backdrop-filter|blur\(|radial-gradient" app/globals.css && grep -q "prefers-reduced-motion" app/globals.css && grep -q "data-reveal-path" app/globals.css && grep -q "stroke-dasharray" app/globals.css && npm run build >/dev/null && shasum out/_next/static/chunks/*.css | diff -q - /tmp/dd2-css-baseline.txt`
  *(Guards all 15 named colour/font/text tokens, not nine. Bans every shadow
  property plus gradient glow — a zero-blur hairline must therefore be written as
  a `border`/`outline`, not `box-shadow`. Ends with a build and a compiled-CSS
  checksum diff against T0's baseline: purely additive `@theme` work leaves it
  byte-identical, so any accidental rendered change fails loudly here rather than
  in a later task forbidden from fixing it.)*

### Wave 1.1 — Contracts: motion primitives
> Second half of the contract, serialized behind 1.0 for the reason above. It owns
> a different file and depends on nothing 1.0 produces — the ordering is purely to
> keep builds off each other.

#### T1.1.1 — Choreography primitives
- **Status:** TODO
- **Description:** Add the motion primitives for scroll-choreographed sections —
  scroll-linked drift and a per-index anchor reveal — each with a reduced-motion
  path. Additive; the ten existing exports are untouched.
- **Files owned:** `site/lib/motion.ts`
- **Depends on:** T1.0.1
- **Model / thinking:** Judgment / extended (Opus)  **Executor:** drydock:executor
- **Context brief:** This plan §1, §6 (F1, F3, F5, F6, F7, F8), Decisions 1, 4. Read
  `site/lib/motion.ts` including its header contract.
- **Forbidden:** Renaming or removing any of the ten existing exports. Adding
  `pathLength` to `NO_MOTION` (destroys author dash patterns — plan 001
  deviation 45). Spring physics, bounce, or overshoot. Writing JSX. Touching
  `globals.css`, `components/`, `content/`.
- **Implementation sketch:**
  - Add **exactly** F6's three names for this file and nothing else:
    - `anchorReveal(i: number): Variants` — per-index reveal for a section's
      visual anchor, in the cadence idiom of `revealClipStagger`.
    - `heroReveal(i: number): Variants` — per-beat, so plan 003 can add hero beats
      without writing a timing literal in a section file (F5 makes that fatal).
    - `useDriftY(ref): MotionValue<number>` — scroll-linked drift as **one hook
      that owns the reduced-motion branch itself**, returning a constant 0 when
      `useMotionSafe()` is false. Do **not** export a bare config and require each
      consumer to branch: hooks cannot be called conditionally, and six consumers
      would mean six chances to get it wrong with no gate watching (F3).
  - Carry `satisfies` types against the `motion` package's own, as `heroSequence`
    already does. Untyped literals pass single-file `tsc` and fail only in a later
    plan that does not own this file.
  - Update the file header to state that scroll-linked motion is **not** covered by
    the `[data-reveal]` CSS restore, and that `useDriftY` is where that branch lives.
  - State names stay exactly `"hidden"` / `"shown"` (silent failure otherwise).
- **Acceptance criterion:**
  `cd site && npx eslint lib/motion.ts && printf '{"extends":"'"$PWD"'/tsconfig.json","include":[],"files":["'"$PWD"'/lib/motion.ts"]}' > /tmp/dd2-m.json && npx tsc --noEmit --project /tmp/dd2-m.json && for n in anchorReveal heroReveal useDriftY; do grep -qE "^export (const|function) $n\b" lib/motion.ts || exit 1; done && for n in sectionReveal staggerChildren childRise drawLine revealClip revealClipStagger heroSequence waterlineReveal useMotionSafe NO_MOTION; do grep -qE "^export (const|function) $n\b" lib/motion.ts || exit 1; done && grep -q "useMotionSafe" lib/motion.ts && node -e "const s=require('fs').readFileSync('lib/motion.ts','utf8');const m=s.match(/export const NO_MOTION[\s\S]*?\n};/);if(!m)process.exit(1);process.exit(m[0].includes('pathLength')?1:0)" && npm run build >/dev/null && shasum out/_next/static/chunks/*.css | diff -q - /tmp/dd2-css-baseline.txt`
  *(Every name assertion is **anchored** to `^export (const|function) <name>\b`.
  The unanchored form was proven non-functional: `revealClip` is matched by
  `revealClipStagger` and `drawLine` by its own doc comment, so both export blocks
  could be deleted with the guard still passing — F8.)*

### Wave 1.2 — Integration

#### T1.2.1 — Integration verification
- **Status:** TODO
- **Description:** Run both gates against the extended system and record the
  result. Fixes nothing.
- **Files owned:** `docs/plans/002-design-system-modernisation.md` (Progress log)
- **Depends on:** T1.0.1, T1.1.1
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
- **Depends on:** T1.2.1 and wavecheck PASS on 1.0, 1.1, 1.2
- **Model / thinking:** Judgment / extended (Opus)  **Executor:** drydock:executor
- **Context brief:** `git diff <T0 baseline SHA>..HEAD -- site/` — the **code**
  diff, not the plan document's diff — plus this plan and §7. Measure the new
  tokens' contrast ratios against Decision 5's three thresholds rather than
  accepting reported values.
- **Forbidden:** Editing anything under `site/`. Re-litigating §7.
- **Acceptance criterion:** Verdict APPROVED or REJECTED with specific findings
  appended to the Progress log, committed as
  `drydock(T1.R.1): fresh-context quality review of plan 002`.

---

## Deviation Log

| # | Task | What deviated | Why | Impact | Recorded |
|---|------|---------------|-----|--------|----------|
| 2 | T1.0.1 | **`--stroke-hair` / `--stroke-rule` / `--stroke-heavy` are not a Tailwind v4 theme namespace, so they emit no utilities.** Plans 003–005 must consume them as `var(--stroke-hair)` in CSS, not as `border-hair`-style classes | The planner specified three token names without checking them against Tailwind v4's namespace rules — only `--color-*`, `--font-*`, `--text-*` and the other documented namespaces generate utilities | None yet: caught before any consumer exists, and the tokens are correctly placed inside `@theme` so tree-shaking keeps the stylesheet byte-identical until referenced. **Would have cost plan 004 a repair wave** had a section task tried `border-hair` and found nothing. Added to F6's table for 003–005. Reconcile: a plan that freezes token names should state, per token, whether it yields a utility or a bare custom property |
| 4 | T1.1.1 | `anchorReveal` and `heroReveal` animate `opacity`/`y`, **not** `clipPath` — so consumers need `data-reveal` and **not** `data-reveal-path` | Copying a neighbouring variant's attribute is the easy mistake, and `data-reveal-path` forces `stroke-dasharray: none` | Stated in both docblocks by the executor, unprompted. This is ADR 0001's pairing hazard reaching plan 002's new exports; plans 003–005 must not copy the attribute from an adjacent element |
| 5 | T1.1.1 | `heroReveal` is bounded to **beats 0–8**: beat 9 would end at 2.10s, past the 2s hero ceiling | The per-beat cadence is `HERO_BEAT_BASE + i * HERO_BEAT_STEP + HERO_BEAT` = 0.4 + 0.15i + 0.35 | Documented in the export's docblock. Verified arithmetically by wavecheck: beat 8 lands at 1.95s, level with `heroSequence.label`. Plan 003 must not exceed beat 8 |
| 6 | T1.1.1 | `useScroll` with a `target` ref logs a Framer warning when the ref is not yet attached on first render | Inherent to `useScroll({ target })` | Harmless and pre-existing, but **plan 004's six anchors will each hit it** if a ref is passed before mount. Recorded for that plan rather than guarded here, since a guard would assume a component shape this file deliberately does not know |
| 7 | T1.1.1 | `DRIFT` is a single 16px constant for every consumer; per-layer parallax depth would need an amplitude argument, deliberately **not** added | Speculative generality — the file already carries two dead exports (`drawLine`, `revealClip`) from earlier speculation | Correct restraint. If plan 004 wants differentiated depth it must amend this plan's contract rather than find the knob already present |
| 3 | T1.0.1 | The `! grep -qE "shadow\|…"` clause bans the bare substring `shadow`, so the file cannot contain the word even in a comment, and a zero-blur plane edge — which Decision 2 explicitly permits — must be written as `border`/`outline` rather than `box-shadow: inset` | A crude substring assertion cannot distinguish blur-0 from blur-8 | Accepted cost, and it worked: the executor phrased its rationale as "no diffuse depth effects" and used hairline borders. But the gate forces an implementation around itself, which is worth noting rather than pretending the constraint is free |
| 1 | — (planner, caught pre-execution) | **Wave 1.0 was split into two serial waves (1.0 tokens, 1.1 motion); integration moved to 1.2.** Task `T1.0.2` renumbered to `T1.1.1` — legitimate, as it had not executed | The C3 repair added `npm run build` + a compiled-CSS checksum to both criteria. Run in parallel, the two tasks build into the same `site/out` and `site/.next`, so one task's checksum would be diffed against a stylesheet the other built — the shared-build-directory race plan 001 Decision 16 exists to forbid. **The pressure test could not have caught this: it reviewed the plan before the fix that introduced it** | None on output; caught before either task ran. Serializing costs almost nothing at two tasks and preserves both the build gate and the isolation rule. **Reconcile: a fix that adds a build step to a criterion must re-check the wave's parallelism** — the two constraints interact and nothing currently forces that check |

## Wavecheck reports

### Wavecheck 1.0 — PASS — 2026-08-19

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `format_version: 2`, `status: EXECUTING`, `approved_by: sandeep`. Wave 1.0 exists with one task. First wave, so no prior report expected — 0 found. |
| 2. Ownership | PASS | `9821002 drydock(T1.0.1)` → `site/app/globals.css` only. Tree clean (0 dirty paths). |
| 3. Forbidden | PASS | Touched none of `fonts.ts`, `lib/motion.ts`, `components/`, `content/`, `layout.tsx`, `page.tsx` (0 matches). **Zero deletions in the diff** — 11 insertions, 0 removals, so no existing token was rescaled or removed. No second warm accent. The word `shadow` appears 0 times, so Decision 2's grep is satisfied without a workaround in a comment. Both reduced-motion restore selectors survive. |
| 4. Acceptance | PASS | Criterion run verbatim → exit 0, including `npm run build` and the compiled-CSS checksum diff against T0's baseline. Both project gates re-run green afterwards: `assert-copy PASS (14 literals, 4x executor, 1 h1, motion contract)` and `measure-reduced-motion PASS`. Only the two known pre-existing build warnings appeared (stray `~/yarn.lock` workspace root; `Big Shoulders` missing `size-adjust`). |
| 5. Deviation reconciliation | PASS | Executor reported no deviations and three observations; two were promoted to Deviation Log rows 2 and 3 because they bind on later plans. **Contrast ratios independently recomputed by the auditor from the WCAG luminance formula rather than accepted:** ink-dim on raised **5.34:1**, primer on raised **4.77:1**, raised vs panel **1.21:1** — all three thresholds met, and the brief's cited failing candidate `#1a4159` reproduces at 4.22:1 / 1.53:1 as a control. |

**F7 validated.** The compiled stylesheet is byte-identical to T0's baseline, which
was the one mechanism in this plan that had never been exercised. A purely additive
`@theme` change leaves the hash unchanged, so any later task that alters rendered
output will fail in the task that caused it rather than in a task forbidden from
fixing it. That was C3's whole point and it now demonstrably works.

Deviations logged: 3 (0 discovered by wavecheck)

**Verdict: PASS.** Wave 1.1 may start.


### Wavecheck 1.1 — PASS — 2026-08-19

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `status: EXECUTING`. Wave 1.1 exists with one task. Wave 1.0 carries a PASS report. |
| 2. Ownership | PASS | `497f4d3 drydock(T1.1.1)` → `site/lib/motion.ts` only. Tree clean. Touched none of `globals.css`, `components/`, `content/`, `app/` (0 matches). |
| 3. Forbidden | PASS | **Zero `^-export` deletions** — no existing export removed. **`NO_MOTION` is byte-identical**, verified two ways: the block extracted from both commits diffs clean, and its old line (144) falls between every diff hunk (1–11, 31–36, 45–50, 97–102, 136–141, 182–184). The criterion's `pathLength` guard matches and returns false. The only `spring`/`bounce` hits are two comments *asserting their absence* (lines 39, 252). No JSX. |
| 4. Acceptance | PASS | Criterion run verbatim → exit 0, including the anchored `^export (const\|function) <name>\b` loops for all thirteen exports, and the compiled-CSS checksum diff (trivially unchanged — this task edits TypeScript, as expected). Both project gates re-run green. |
| 5. Deviation reconciliation | PASS | No deviations reported; six observations, four promoted to Deviation Log rows 4–7. **Every cadence claim independently recomputed rather than accepted:** `anchorReveal(5)` delay 0.50 at duration 0.45 (≤ 600ms ✓); `heroReveal(8)` ends at **1.95s**, exactly level with `heroSequence.label`, and `heroReveal(9)` would reach 2.10s — so the docblock's "beats 0–8" bound is correct, not approximate. |

**The reduced-motion branch was verified by the executor at runtime, which no gate in
this plan can do.** It transpiled the real module, rendered a probe through
`react-dom/server`, and asserted the returned MotionValue: safe path returned 16
(`DRIFT`), and a copy with only `useMotionSafe`'s body forced to `false` returned
`get() === 0` and `getVelocity() === 0`. The orchestrator read the source
independently and confirms the shape is correct — all four hooks called
unconditionally in fixed order, only the *return* value branching:

```ts
const safe = useMotionSafe();
const { scrollYProgress } = useScroll({ target: ref, offset: [...] });
const drift = useTransform(scrollYProgress, [0, 1], [DRIFT, -DRIFT]);
const still = useMotionValue(0);
return safe ? drift : still;
```

Deviations logged: 7 (0 discovered by wavecheck)

**Verdict: PASS.** Wave 1.2 (integration) may start.

### Wavecheck 1.2 — PASS — 2026-08-19

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `status: EXECUTING`. Wave 1.2 exists with one task. Waves 1.0 and 1.1 both carry PASS reports. |
| 2. Ownership | PASS | `61c5e3d drydock(T1.2.1)` → `docs/plans/002-design-system-modernisation.md` only. **Zero files under `site/` touched** — the constraint that matters for a verifier. Tree clean. |
| 3. Forbidden | PASS | Nothing under `site/` modified; no gate "fixed"; only the Progress log edited. |
| 4. Acceptance | PASS | Criterion exit 0, re-run independently by the auditor: `assert-copy PASS (14 literals, 4x executor, 1 h1, motion contract)` and `measure-reduced-motion PASS (reducedMotion=true, waterline="10px, 8px", stippled=0, hull opacity 1 / dasharray none, invisibleText=0)`. |
| 5. Deviation reconciliation | PASS | No deviations, no observations. |

**The plan's central claim is now mechanically verified.** Compiled CSS is
`40b6a434624dbb530bd0bbb2bd002125acba1037  out/_next/static/chunks/1s2vcbm8xcik1.css`
— byte-identical to T0's baseline. Five `@theme` tokens and three motion exports were
added and **rendered output did not change**, because Tailwind tree-shakes
unreferenced tokens and unreferenced TypeScript never reaches the bundle. That is
what C3's checksum gate was built to prove, and it is the only mechanism in this plan
capable of proving it.

Deviations logged: 7 (0 discovered by wavecheck)

**Verdict: PASS.** All three implementation waves complete. T1.R.1 may run.

## Progress log

| Date | Task | Result | Notes |
|------|------|--------|-------|
| 2026-08-19 | — | Plan drafted | Lean by design: plan 001 ran 2,069 lines for a 240-line artifact, which its own case study flagged as disproportionate |
| 2026-08-19 | — | Round-1 pressure test REJECTED | 4 CRITICAL / 5 MAJOR / 5 MINOR, all fixed (§11). Three findings indicted the planner and were independently reproduced before acceptance |
| 2026-08-19 | — | **APPROVED by sandeep** | Round 2 not run — repair was ~20 lines of specification on a 4-task plan and every finding was reproduced. Status → EXECUTING |
| 2026-08-19 | T0 | Baseline recorded | HEAD 9e6fadc..., CSS shasum 40b6a434... in 1s2vcbm8xcik1.css. Both gates green. |
| 2026-08-19 | T1.2.1 | Integration verification PASS | **npm run verify:** assert-copy: PASS — /Users/takasivenkatasandeep/Desktop/drydock-repo/site/out/index.html (14 literals, 4x executor, 1 h1, motion contract). **measure-reduced-motion:** PASS — reducedMotion=true, waterline="10px, 8px", stippled=0, hull={"opacity":"1","dasharray":"none"}, invisibleText=0. Both gates exited 0. HEAD b71b2a34e90aae397285f5dc35ead848b37fd28a. **CSS checksum:** 40b6a434624dbb530bd0bbb2bd002125acba1037 out/_next/static/chunks/1s2vcbm8xcik1.css — **matches T0 baseline byte-for-byte**. No rendered output changed. |
| 2026-08-19 | T1.R.1 | **Fresh-context quality review — APPROVED** | 3 thresholds independently re-measured and met; tier perceptually real (L* ladder 5.50 / 11.51 / 18.71); token retention empirically verified on all three consumption paths. 5 non-blocking findings, R1–R5 below. |

### T1.R.1 — Fresh-context quality review — **APPROVED** — 2026-08-19

Reviewed `git diff 9e6fadc..HEAD -- site/` (2 files, 11 + 101 lines). Conformance
was already audited three times; this review asked the different question — **is
the vocabulary good, and is it sufficient for plans 003–005 to build against
without guessing.** It is. Nothing in these 110 lines will multiply into a
downstream defect. Five findings below are notes for plans 003–005, not grounds
for rejection.

**1. `--color-raised = #0b304a` — all three thresholds re-measured from the WCAG
formula, not accepted.** Using the tree's actual token values (`--color-ink-dim:
#8ba5bb`, `--color-primer: #ff6a1f`, `--color-panel: #0b2032`):

| Decision 5 threshold | Required | Measured |
|---|---|---|
| ink-dim on raised | ≥ 4.5:1 | **5.337:1** |
| primer on raised | ≥ 4.5:1 | **4.775:1** |
| raised vs panel | ≥ 1.15:1 | **1.212:1** |

Matches wavecheck 1.0's 5.34 / 4.77 / 1.21 to three digits. Decision 5's cited
failing candidate `#1a4159` reproduces as a control at 4.216:1 / 3.772:1 / 1.535:1.

**And it is a real tier, not a token that does nothing.** 1.21:1 sounds inert only
because WCAG ratios compress badly at the dark end — a `+0.05` flare term dominates
when both luminances are ~0.01. The honest metric is CIE lightness, and the ramp is
evenly spaced there:

| Tier | Y | L* | ΔL* from previous |
|---|---|---|---|
| dock `#061320` | 0.00609 | **5.50** | — |
| panel `#0b2032` | 0.01334 | **11.51** | +6.01 |
| raised `#0b304a` | 0.02679 | **18.71** | +7.20 |

A ~7 L* step on a large flat area is several times the just-noticeable difference;
it will read as a distinct plane on any calibrated display, and the three-tier ramp
is close to perceptually uniform. The executor's narrow-band note is also correct
and worth keeping: the satisfiable band is Lr ∈ [0.02285, 0.03148], so the **maximum
tier separation this constraint set permits is 1.286:1 (L\* 20.63)**. The chosen
value sits at L\* 18.71 — within 2 L* of the ceiling. There is no brighter third
tier available without dropping primer below AA, and spending the remaining headroom
would buy an imperceptible ~1.9 L*. **Right call, and there is nothing better to
pick.** (raised vs dock is 1.369:1 / ΔL* 13.2, so a raised plane on the page ground
is unambiguous.)

**2. Sufficiency — the tokens are consumable by plans 003–005 without owning
`globals.css`, verified empirically rather than reasoned.** Deviation 2 correctly
established that `--stroke-*` yields no utilities. The unasked follow-on question is
the dangerous one: **F2 says Tailwind tree-shakes unreferenced `@theme` tokens, so
does a bare custom property with no utility survive to be `var()`-ed at all?** If
not, `border: var(--stroke-hair) solid …` resolves to a guaranteed-invalid value,
the whole shorthand drops, and the plane edge silently disappears with no error —
exactly this repo's recurring defect class. Tested on a scratch clone of `site/`
(three separate production builds, nothing under `site/` touched):

| Consumption path | Token emitted to `:root`? |
|---|---|
| `var(--stroke-hair)` in a CSS rule in `globals.css` | **yes** |
| `className="border-[length:var(--stroke-rule)]"` in a `.tsx` | **yes**, and the utility emits `border-width:var(--stroke-rule)` |
| `className="border-(length:--stroke-rule)"` (v4 shorthand) | **yes**, same declaration |
| `className="[border-width:var(--stroke-rule)]"` | **yes** |
| `style={{ borderTopWidth: "var(--stroke-heavy)" }}` in a `.tsx` | **yes** — the scanner keeps any theme var whose *name* appears in scanned source |
| not mentioned anywhere | no (tree-shaken, as F2 predicts) |

Retention is name-scan based, so it is robust across every path a section file
would plausibly use. `.text-hero` emits `font-size` **plus** both paired modifiers
(`--text-hero--line-height: .88`, `--text-hero--letter-spacing: -.02em` both land
in `:root`), and `.bg-raised` / `.border-raised` / `.text-raised` all generate. The
only way to lose a token is to build its name dynamically (`var(--stroke-${w})`) —
worth one line in plan 003's forbidden list, nothing more.

Against the six things plans 003–005 actually need — hero at `--text-hero`, six
section anchors, layered depth from planes plus stroke weight, choreographed
scroll, responsive behaviour, an a11y pass — **the frozen table covers five.**
Responsive behaviour needs no new name (`clamp()` and existing breakpoints carry
it). The a11y pass is plan 005's harness work, already correctly sequenced by F4.
**I found nothing missing that forces a repair wave.**

**3. `useDriftY` — shape correct, two behaviours the probe could not see.** The
source is right: four hooks called unconditionally in fixed order, only the return
value branching, and `useDriftY(ref: RefObject<HTMLElement | null>)` mirrors the
installed package's own `UseScrollOptions.target` type exactly (framer-motion
13.1.0, `index.d.ts:1044`) rather than inventing a looser one. `NO_MOTION` type-swaps
cleanly against both new variant factories. What the `react-dom/server` probe could
not reach:

- **Geometry is sane but off-centre at the document edges.** With
  `offset: ["start end", "end start"]`, progress = `(s − topᵈᵒᶜ + vh) / (eh + vh)`,
  monotonic and well-defined for any `eh`, including `eh > vh` — an element taller
  than the viewport is fine, it just traverses the range more slowly. But at the
  **top** of the document the range cannot start at 0: a full-height hero begins at
  progress 0.5 (y = 0, harmless), while a *short* element at the top begins at
  `vh/(eh+vh)` — an 800px viewport and a 100px element start at progress 0.889,
  i.e. **y ≈ −12.4px at rest, a static offset that never animates in and can never
  reach +16.** The last element in the document is symmetric (max progress
  `eh/(eh+vh)`, never reaches −16). Both are inherent to `useScroll`, not defects
  here — but plan 003 is the hero plan, so: **`useDriftY` belongs on mid-document
  anchors; on an above-the-fold element it reads as a static displacement, not
  drift.** Worth stating in plan 003 rather than discovering in a browser.
- **The docblock overclaims by one frame.** "Under reduced motion … nothing ever
  writes to its transform" is not literally true. `useMotionSafe()` deliberately
  returns `true` until hydration completes (correct for variant swaps, which
  `[data-reveal]` covers), so on the hydration render `useDriftY` returns `drift`,
  not `still`. `useScroll` measures in a layout effect; the `useSyncExternalStore`
  correction lands in a passive effect — later. So a reduced-motion visitor can get
  one painted frame at up to ±16px before it snaps to 0. Self-correcting and
  sub-frame on a fast device; visible as a small jump on a slow one. Note that
  **`useDriftY` could close this without a hydration mismatch** — unlike a variant
  swap, `still` (y = 0) *is* the correct server output, so gating on hydration as
  well as on `reduced` is strictly safer — but that needs `isHydrated` exposed and
  is a change to a file this plan's waves have closed. **This is the assertion plan
  005's harness extension should carry: check the post-hydration steady state and
  the first paint, not merely that the branch exists.**

**4. Three unconsumed exports next to two dead ones — justified.** Position: this
is not the same thing as `drawLine`/`revealClip`. Those two are dead because
nothing ever needed them; these three exist because F5 makes the alternative
*fatal* — a section file that writes its own `delay:` fails `assert-copy.mjs`, so
plan 003 cannot author a hero beat at all unless the cadence is exported from here
first. That is frozen-contract-first sequencing with a gate enforcing it, not
speculation. Deviation 7's refusal to add a `DRIFT` amplitude argument is the
correct application of the same judgment in the other direction, and the file is
now 3-for-3 on adding only what a named downstream consumer requires. The real
lesson for reconcile is about the *old* pair: `drawLine` and `revealClip` have had
zero consumers across two plans and should be **deleted**, not out-populated — a
plan that owns `lib/motion.ts` should carry that deletion.

**5. Silent-failure hunt — one confirmed, pre-existing and inherited, not
introduced.** `Variants` is `{ [key: string]: Variant }`, an index-signature type,
so **a misspelled state name typechecks silently**: a probe declaring
`{ hidden: {…}, shwon: {…} } satisfies Variants` compiles with zero errors under
this repo's own `tsconfig.json`. Neither the `: Variants` return annotation on
`anchorReveal`/`heroReveal` nor a `satisfies` clause would catch it — the plan's
"state names stay exactly `hidden`/`shown` (silent failure otherwise)" instruction
is therefore **unenforceable by the type system, and no gate checks it either**.
The new exports are correct and match the existing idiom exactly, so this is
inherited surface, not a regression — but it is now on six more call sites in plan
004, and the cheap fix is a literal union (`Record<"hidden" | "shown", Variant>`)
in whichever plan next owns this file. The SVG counterpart is the good news:
handing `useDriftY` a `RefObject<SVGGElement | null>` is a **compile error**
(TS2345), so plan 004 drifting linework will fail loudly and must wrap in an HTML
element — loud, not silent, and the right way round. Beyond those, I found nothing:
no unanchored guard, no `pathLength` in `NO_MOTION` (byte-identical), no `shadow`
/`blur(`/`backdrop-filter`/`radial-gradient` anywhere in `globals.css`, both
reduced-motion restore selectors intact, zero deletions in either file, and
`--text-hero` is strictly above `--text-sheet` at every clamp stop (3.5/12vw/9rem
vs 2.75/9vw/6.5rem).

**6. Scope and honesty.** Nothing was added beyond §1 and F6's table — exactly five
tokens and three exports, no "supporting" extras, no second accent. Decision 2 was
honoured in substance and not merely in grep: depth is built from hairline
`border`/`outline` weights, and the executor's own comment states the rule
("no diffuse depth effects anywhere in this design") rather than working around the
substring ban. §10's "changes no rendered output" claim holds for CSS by checksum,
and holds for the HTML for the right reason — unreferenced TypeScript never enters
the bundle. See the addendum below for the independent whole-`out/` verification.

**Verdict: APPROVED.** Plans 003–005 can be written against this without guessing.
Findings R1–R5 are notes to carry forward, listed in the order a downstream plan
will need them:

- **R1** → plan 003: `useDriftY` on above-the-fold elements reads as a static
  offset, not drift. Put it on mid-document anchors.
- **R2** → plan 005: the harness assertion for scroll motion must check first
  paint as well as the post-hydration steady state (the one-frame window in §3).
- **R3** → plan 004: `useDriftY` takes an HTML ref, not an SVG one; wrap linework
  in a `motion.div`. A single 16px `DRIFT` shared by six anchors produces no
  *relative* depth — if differentiated parallax is wanted, amend this contract
  (deviation 7), do not expect the knob to exist.
- **R4** → whichever plan next owns `lib/motion.ts`: type the two variant state
  names as a literal union, and delete `drawLine` / `revealClip`.
- **R5** → plan 003: never build a token name dynamically; `var(--stroke-${w})`
  is tree-shaken to nothing with no error.

**Addendum — §10's "no rendered output" claim independently verified across the
whole emitted tree, not just the stylesheet.** The plan's checksum gate covers one
file. The unchecked surfaces are the exported HTML and the client JS bundles:
`lib/motion.ts` **is** imported by four components, so three new exports added to a
live module could plausibly survive into a bundle and change its content hash,
which would change the `<script src>` in `index.html`. Tested by building both
revisions from clean source in a scratch clone (`git archive 9e6fadc` and
`git archive HEAD`, four production builds total, nothing under `site/` touched):

- Both builds emit **45 files with identical names** — so every content-hashed JS
  chunk is unchanged, and the three new motion exports were tree-shaken out of the
  client bundle as F7 assumes.
- After normalising Next's build id, **all 45 files are byte-identical (0 differing
  files).** The only variance anywhere in `out/` is the 21-character random build id,
  which appears in the RSC flight payload as `"b":"<id>"` and in the
  `_next/static/<id>/` directory name. It differs between two builds of *identical*
  source — three separate builds of HEAD produced `vWsqz6rk…`, `Zn1Ws1tf…` and a
  base build produced `XY-ZOPIo…` — so it is build nondeterminism, not a source
  change. Worth knowing: a future plan that tries to checksum `index.html` directly
  will get a false positive unless it normalises that id first.
- The compiled stylesheet is `40b6a434624dbb530bd0bbb2bd002125acba1037` in basename
  `1s2vcbm8xcik1.css` from both revisions — matching T0's recorded baseline exactly.

Both project gates were also re-run first-hand against a HEAD build rather than
taken from wavecheck 1.2: `assert-copy: PASS (14 literals, 4x executor, 1 h1, motion
contract)` and `measure-reduced-motion: PASS (reducedMotion=true, waterline="10px,
8px", stippled=0, hull opacity 1 / dasharray none, invisibleText=0)`.


## Reconcile report

*Appended once by `drydock:reconcile` at completion.*
