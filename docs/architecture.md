# Architecture

## Repo shape

| Path | What |
|---|---|
| `drydock/` | the Claude Code plugin (skills, agents, plan-format contract) |
| `index.html` | hand-written single-file homepage, no build |
| `site/` | Next.js static-export homepage (plan 001) |
| `docs/compatibility.md` | runtime verification status — source of truth for site claims |
| `docs/verification-log.md` | raw evidence behind each compatibility row |
| `docs/self-audit.md` | adversarial dry-run of the auditor |
| `docs/plans/` | Drydock plan documents |

## `site/` — four frozen contracts, then components

Section components are built against contracts that are pinned first. Changing a
contract means changing every consumer.

| Contract | Owns |
|---|---|
| `app/globals.css` | the nine `@theme` design tokens, the blueprint grid, the reduced-motion restore (ADR 0001) |
| `lib/section.ts` | `SectionMeta`, `SectionProps`, `SectionShellProps`, `SectionComponent` |
| `lib/motion.ts` | every animation variant **and every timing literal in the codebase** |
| `content/copy.ts` | every on-page string, plus the six `SectionMeta` objects |

**Composition:** `app/layout.tsx` owns the drawing-sheet frame, title block, skip
link, `<main>`, and the `<noscript>` restore. `components/Section.tsx` owns each
section's `<section>`, id, draft mark, `<h2>`, scroll reveal, and the `mt-8`
heading-to-body gap. `app/page.tsx` renders `<Hero/>` unwrapped, then six
`SectionComponent`s. Sections render their own `<Section meta={meta}>` root, use
`space-y-6` for internal rhythm, and must **not** add a top margin.

**Hero is exempt** from the section shell: no `SectionMeta`, no draft mark, no
`<h2>`. It renders the page's only `<h1>`.

**Nothing may bleed to the viewport edge** — `<body>` has `p-2 sm:p-4` and the
page sits inside a trim border, so `min-h-screen` / full-bleed backgrounds
overflow the sheet.

## Gates

| Gate | Catches | Blind to |
|---|---|---|
| `npm run verify` | build, types, lint, required literals, over-claim patterns, motion-contract source rules | anything only visible as a computed style |
| `scripts/measure-reduced-motion.mjs` | the reveal-attribute contract, dash preservation, stippling, invisible elements | everything else |
| human browser check | typography metrics, grid legibility, optical spacing | — |

`verify` stays hermetic and browser-free on purpose. Timing lives only in
`lib/motion.ts`; a section file containing `duration:` / `delay:` fails the gate.
