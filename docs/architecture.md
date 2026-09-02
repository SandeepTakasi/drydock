# Architecture

## Repo shape

| Path | What |
|---|---|
| `drydock/` | the Claude Code plugin (skills, agents, plan-format contract) |
| `site/` | Next.js static-export homepage, live on GitHub Pages (ADR 0003) |
| `.github/workflows/deploy.yml` | gate-then-publish pipeline for `site/` |
| `docs/compatibility.md` | runtime verification status — source of truth for site claims |
| `docs/verification-log.md` | raw evidence behind each compatibility row |
| `docs/self-audit.md` | adversarial dry-run of the auditor |
| `docs/plans/` | Drydock plan documents |
| `.drydock/` | plan-execution runtime state, **gitignored**: `wave-owns.json` (the armed ownership boundary; deleting it closes the wave), `enforcement.log` (one JSONL receipt per hook decision), `attribution.jsonl` (task → commit manifest under `attribution: manifest`), `testing/` (seatrial evidence) |

## `site/` — four frozen contracts, then components

Section components are built against contracts that are pinned first. Changing a
contract means changing every consumer.

| Contract | Owns |
|---|---|
| `app/globals.css` | the `@theme` design tokens (ground/surface/line, ink, accent, the three verdict colours, type scale), the reduced-motion restore (ADR 0001) |
| `lib/section.ts` | `SectionMeta`, `SectionProps`, `SectionShellProps`, `SectionComponent` |
| `lib/motion.ts` | every animation variant **and every timing literal in the codebase** |
| `content/copy.ts` | every on-page string, plus the six `SectionMeta` objects |

**Composition:** `app/layout.tsx` owns the sticky nav, footer, skip link,
`<main>`, and the `<noscript>` restore. `components/Section.tsx` owns each
section's `<section>`, id, eyebrow, `<h2>`, top hairline, scroll reveal, and the
`mt-10` heading-to-body gap. `app/page.tsx` renders `<Hero/>` unwrapped, then six
`SectionComponent`s in narrative order: problem, lifecycle, gate, evidence,
install, questions. Sections render their own `<Section meta={meta}>` root and
must **not** add a top margin to their first child.

**Hero is exempt** from the section shell: no `SectionMeta`, no eyebrow, no
`<h2>`. It renders the page's only `<h1>`, and it is where the two SVG contracts
ADR 0001 governs live — the convergence rail (`data-reveal-path`, the only
`pathLength`-drawn element) and the dashed gate line (`data-reveal`, the
document's only `stroke-dasharray="10 8"` path).

**Sections run edge to edge.** Each `<section>` carries a full-width top
hairline and constrains its own content with `max-w-6xl`; there is no page-level
trim border, so full-bleed backgrounds are fine.

## Gates

| Gate | Catches | Blind to |
|---|---|---|
| `npm run verify` | build, types, lint, required literals, over-claim patterns, motion-contract source rules | anything only visible as a computed style |
| `scripts/measure-reduced-motion.mjs` | the reveal-attribute contract, dash preservation, stippling, invisible elements, scroll-linked drift (D1/D2, vacuous while nothing drifts) | everything else |
| `.github/workflows/deploy.yml` | runs `verify` before any publish, so a red gate cannot reach Pages | anything `verify` is blind to |
| `enforce-owns.mjs` (PreToolUse) | Write/Edit to a path the armed wave does not own — denied at the tool boundary, before the edit lands | **Bash-mediated writes entirely**, and paths outside the project directory |
| `drydock-audit.mjs audit-wave` | per-task ownership against the real diff, unattributable tasks, a dirty tree, and whether enforcement actually ran | intent, quality, anything a commit does not record |
| `drydock-audit.mjs validate-plan --strict` | plan defects a reader cannot eyeball: duplicate ids, same-wave collisions and dependencies, section order, Testing Gate completeness | whether the plan is a *good* plan |
| `drydock-audit.mjs plan-status` | frontmatter `status:` contradicting what the wavecheck reports actually recorded — a plan reading `EXECUTING` after every wave passed, or `DONE` over a `BLOCK` | whether a gate was *skipped*: a retroactively written report is a heading like any other |
| `.github/workflows/verify.yml` | the plugin's own tests (audit + hook) and the honesty matrix, on every push and PR, with no `paths` filter | anything needing a site build — that stays in `deploy.yml` |
| human browser check | typography metrics, grid legibility, optical spacing | — |

`verify` stays hermetic and browser-free on purpose. Timing lives only in
`lib/motion.ts`; a section file containing `duration:` / `delay:` fails the gate.
