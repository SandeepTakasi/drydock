# ADR 0001 — Reveal attribute contract for reduced motion

**Status:** accepted · **Date:** 2026-08-19 · **Origin:** plan 001, Decision 25
and deviations 41, 45, 46

## Context

Framer Motion writes an element's `initial` variant state as an **inline style**
(`style="opacity:0"`). CSS cannot override an inline style without `!important`,
and CSS cannot detect absent JavaScript at all. Separately, Framer implements
SVG `pathLength` by **writing `stroke-dasharray` / `stroke-dashoffset` as
attributes** — which destroys any author dash pattern on that element.

The hero contains both cases at once: a hull that is drawn on via `pathLength`
and must end solid, and a waterline that is **dashed by design** and must keep
its pattern.

## Decision

Every animated element carries exactly one of two attributes.

| Attribute | For | Restored properties |
|---|---|---|
| `data-reveal` | clip / opacity / transform reveals | `opacity`, `transform`, `clip-path`, `width` |
| `data-reveal-path` | `pathLength`-animated strokes | the four above **plus** `stroke-dasharray`, `stroke-dashoffset` |

`data-reveal-path` is a **superset**, not a delta. Both rules are stated in full,
in two places that must stay identical:

1. `app/globals.css` — inside `@media (prefers-reduced-motion: reduce)`
2. `app/layout.tsx` — inside `<noscript><style>`, for JS-disabled visitors

`NO_MOTION` in `lib/motion.ts` must **never** set `pathLength`. Doing so makes
Framer write a `1 1` dash onto every element it drives — rendering the dashed
waterline solid and, because `stroke-dasharray` is **inherited**, stippling every
child of any `<g>` it touches.

## Consequences

- Putting `data-reveal-path` on a dashed element strips its dash under reduced
  motion. Putting `data-reveal` on a `pathLength` element leaves it a
  zero-length dash: invisible.
- **This pairing is not machine-checkable.** `data-reveal-path` contains
  `data-reveal` as a substring, so text-based gates cannot distinguish them.
  `scripts/measure-reduced-motion.mjs` is the only check that can, and it
  measures computed styles in Chrome.
- Any change to `NO_MOTION`, either restore block, or an element's reveal
  attribute **must** be verified by running that script. It has a demonstrated
  failure mode; a passing text gate proves nothing here.
