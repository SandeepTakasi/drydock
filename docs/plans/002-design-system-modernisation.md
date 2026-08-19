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
| 3 | T1.0.1 | The `! grep -qE "shadow\|…"` clause bans the bare substring `shadow`, so the file cannot contain the word even in a comment, and a zero-blur plane edge — which Decision 2 explicitly permits — must be written as `border`/`outline` rather than `box-shadow: inset` | A crude substring assertion cannot distinguish blur-0 from blur-8 | Accepted cost, and it worked: the executor phrased its rationale as "no diffuse depth effects" and used hairline borders. But the gate forces an implementation around itself, which is worth noting rather than pretending the constraint is free |
| 1 | — (planner, caught pre-execution) | **Wave 1.0 was split into two serial waves (1.0 tokens, 1.1 motion); integration moved to 1.2.** Task `T1.0.2` renumbered to `T1.1.1` — legitimate, as it had not executed | The C3 repair added `npm run build` + a compiled-CSS checksum to both criteria. Run in parallel, the two tasks build into the same `site/out` and `site/.next`, so one task's checksum would be diffed against a stylesheet the other built — the shared-build-directory race plan 001 Decision 16 exists to forbid. **The pressure test could not have caught this: it reviewed the plan before the fix that introduced it** | None on output; caught before either task ran. Serializing costs almost nothing at two tasks and preserves both the build gate and the isolation rule. **Reconcile: a fix that adds a build step to a criterion must re-check the wave's parallelism** — the two constraints interact and nothing currently forces that check |

## Wavecheck reports

*Appended by `drydock:wavecheck`, one section per wave.*

## Progress log

| Date | Task | Result | Notes |
|------|------|--------|-------|
| 2026-08-19 | — | Plan drafted | Lean by design: plan 001 ran 2,069 lines for a 240-line artifact, which its own case study flagged as disproportionate |
| 2026-08-19 | — | Round-1 pressure test REJECTED | 4 CRITICAL / 5 MAJOR / 5 MINOR, all fixed (§11). Three findings indicted the planner and were independently reproduced before acceptance |
| 2026-08-19 | — | **APPROVED by sandeep** | Round 2 not run — repair was ~20 lines of specification on a 4-task plan and every finding was reproduced. Status → EXECUTING |
| 2026-08-19 | T0 | Baseline recorded | HEAD 9e6fadc..., CSS shasum 40b6a434... in 1s2vcbm8xcik1.css. Both gates green. |

## Reconcile report

*Appended once by `drydock:reconcile` at completion.*
