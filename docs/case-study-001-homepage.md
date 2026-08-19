# Field case study: building this site with Drydock

The first full pilot of Drydock on real work, not a toy repo. Plan
[001-drydock-homepage](plans/001-drydock-homepage.md) built `site/` — a
statically-exported Next.js homepage — across two phases. This is what the run
actually produced, including the parts that reflect badly on the tool and on the
plan. Method and limits are stated at the end; the numbers below are all
recoverable from the plan document and `git log`.

## Shape

| | |
|---|---|
| Phases / waves | 2 / 16 (14 implementation, 2 review) |
| Tasks executed | 28, each with a per-task checkpoint commit |
| Wavecheck reports | 14 — **all PASS, zero BLOCK** |
| Deviations logged | 49 |
| Review rejections | 3 quality-review verdicts + 2 adversarial pressure-test rounds |
| Commits | 63 |

## What the conformance audit caught

**Nothing, of its primary target.** All 14 ownership audits returned PASS. Across
28 tasks there was not one ownership violation and not one unreported
forbidden-item breach. The failure mode Drydock exists to catch — a task editing
a file it does not own and omitting it from its report — **did not occur once.**

That is the honest headline, and it cuts both ways. The disjoint-ownership
machinery worked: seven executors ran concurrently in one wave, on one working
tree, with no collision and no `index.lock` contention. But a reader deciding
whether to adopt this should know that the audit's headline check found nothing,
because nothing was there to find.

What the audit *did* contribute was different: **13 deviations tagged
`discovered-by-wavecheck`** — findings executors had not reported, surfaced by
re-running criteria and reading diffs rather than trusting completion reports.
Several were consequential. One example: a build warning about Turbopack
resolving its workspace root above the repository appeared in an executor's own
build output and went unmentioned in its report.

## What the audit could not catch

Eight deviations are one species: **a mistake that produces no error.** Not one
was caught by a passing gate. Every one came from a fresh-context reviewer or a
browser measurement.

- Tailwind v4 silently emits nothing for an unreferenced or mistyped `@theme`
  token.
- Animation variant state names are plain object keys; a typo produces no lint,
  type, or build error — just no animation.
- The static export embeds the RSC hydration payload, so every rendered string
  appears **twice**. Any counting assertion passes vacuously off the payload.
- A per-file typecheck command silently ignored `tsconfig.json`, so it could not
  resolve path aliases. It had passed three times — only on files that happened to
  import nothing aliased.

Three of these invalidated a fix that a prior wavecheck had already marked
closed. **Twelve consecutive PASSes did not mean what they appeared to mean.**

## The most instructive defect

One requirement — a dashed waterline in the hero SVG — was broken three times, by
three different mechanisms, and each fix was correct against the route it knew
about.

1. **Via the library.** Framer Motion implements `pathLength` by *overwriting*
   `stroke-dasharray`, so a line cannot be both dashed and drawn-on. Fixed by
   splitting it into two elements.
2. **Via CSS.** The reduced-motion restore forced `stroke-dasharray: none` on
   every revealed element, stripping the author's dash. Fixed by splitting the
   restore attribute.
3. **Via JavaScript.** A zero-duration "no motion" variant set `pathLength: 1`,
   so under reduced motion the library wrote the dash attributes anyway —
   rendering the line solid, and stippling every inherited child. Found only by
   reading computed styles in headless Chrome.

The third route was invisible to source text, to the full gate, and to twelve
wavecheck passes. The repair added a browser-measurement script — which was then
only trusted after the defect was deliberately reintroduced and the script was
watched failing.

## What went wrong with the plan, not the code

Two of three blocking findings in the final review were **planner errors, not
executor errors**:

- Two Decisions were recorded in the plan's Decision Log and never propagated
  into the task briefs that consume them. The plan had **already recorded this
  exact lesson two waves earlier** and repeated it anyway. An executor following
  its brief would have built the precise construction the Decision existed to
  forbid.
- A contract rule was written as a delta — "this selector *adds* two properties"
  — which two tasks read in opposite ways. The divergence survived five waves
  behind a comment asserting the two halves matched.

Separately, **seven executors finished verified work and lost its attribution** by
stopping before committing: turn-budget exhaustion, a transient API error, a
silent turn-end, a stalled stream. Raising the turn ceiling did not help, because
the ceiling was never the cause — the checkpoint commit simply came last. Each was
caught only by checking `git status` by hand. This drove the v0.4.0 contract
change.

## Cost, stated plainly

The plan document reached **2,069 lines** to build a seven-section page that
**already existed** in this repo as a **240-line** hand-written HTML file with no
build step — a roughly 8.6:1 ratio of plan to prior art. The Next.js version adds a component architecture, an animation
layer, and machine-checked honesty constraints that the original does not have —
but anyone reading this should weigh that ratio. Drydock's own FAQ answers "is
this overkill for a one-file change?" with *yes, and then do not use it*. This
plan sat near the boundary, and two adversarial review rounds plus three
quality-review rejections were a meaningful share of the total cost.

## Limits of this evidence

- **n = 1.** One plan, one repository, one orchestrating session.
- **A3 is not measured by this run.** Gate compliance is meant to be tracked
  across 5–10 pilot plans. Worse, the orchestrator knew it was being measured and
  said so at the gates — the weakest possible conditions for a compliance number.
  A3 remains MEASURING.
- **The worktree path is half-verified.** `isolation: none` throughout, so A2b
  (post-wavecheck merge) was never exercised and remains PENDING.
- **Neither phase's final review was re-run after its repairs.** Both gates were
  closed on measured verification and a human browser check instead
  (deviations 36, 49). The reviewer rejected three times and was right three
  times; nobody with fresh eyes examined either repaired tree.
- **A bookkeeping inconsistency, for the record:** running tallies inside the
  later wavecheck reports drifted from the tag count. Thirteen deviations carry
  the `discovered-by-wavecheck` tag; some audit-discovered findings were
  attributed with other wording, so 13 is a floor rather than an exact total. The
  tallies in those reports should not be quoted.

## What a reader should take from this

The contract mechanics held: ownership, per-task attribution, gates between
waves. The audit surfaced real findings executors had not reported. But the
defects that mattered most were found by **fresh-context review and by
measurement**, not by any passing gate — and twelve consecutive PASSes coexisted
with a live, shipped defect in the page's signature element.

Wavecheck is necessary and not sufficient. Plan 001's evidence supports keeping
the adversarial review and the browser gate, not replacing them with the audit.
