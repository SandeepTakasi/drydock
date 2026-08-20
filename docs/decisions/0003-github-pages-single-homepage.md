# ADR 0003 — One homepage, published to GitHub Pages

**Status:** accepted · **Date:** 2026-08-20 · **Origin:** going live
· **Supersedes:** [ADR 0002](0002-static-export-no-deploy.md)

## Context

ADR 0002 deferred deployment for one honest reason: the repo had no remote, so
the eventual URL was unknowable and committing to a `basePath` would have broken
every asset path if the guess was wrong. That left two homepages standing —
a hand-written root `index.html` and the `site/` export — deliberately different
by plan 001's Decision 1, with neither retired.

Both conditions have now changed. The remote is
`TakasiVenkataSandeep-08/drydock`, which fixes the URL, and the plugin is being
shown to people, which makes two divergent homepages a liability rather than an
open option: whichever one a visitor lands on, the other contradicts it.

## Decision

1. **`site/` is the only homepage.** Root `index.html` is deleted. It stays
   recoverable in git history; nothing links to it.
2. **GitHub Pages project site**, served at
   `https://takasivenkatasandeep-08.github.io/drydock/`.
3. **`basePath: '/drydock'`** in `site/next.config.ts`, declared once as a
   single named constant, because a project site is served from a subdirectory.
4. **Publishing runs through the gate.** `.github/workflows/deploy.yml` runs
   `npm run verify` and uploads the artifact only if it passes. A red gate
   cannot reach production.
5. **`public/.nojekyll`** ships in the export, so nothing downstream can decide
   to skip the underscore-prefixed `_next/` directory.

## Consequences

- Serving `out/` at a server root now **404s every asset**, because the emitted
  paths carry `/drydock`. Local inspection has to mount the export where it
  expects to be; `CLAUDE.md` carries the two-line recipe.
- `scripts/measure-reduced-motion.mjs` grew a matching `BASE_PATH` constant and
  strips the prefix when serving. It is the one place that duplicates the value,
  and it degrades correctly to the domain-root case when the prefix is empty.
- Moving to a custom domain, or to a `<user>.github.io` repo, means setting
  `BASE_PATH` to `""` in both files and changing nothing else.
- Plan 001's Decision 1 (design fresh, do not port) is retired along with the
  file it applied to. The two-homepage note is gone from `CLAUDE.md`.
- The `site/` design that went live is not the one plan 001 built: the naval
  blueprint was replaced by a neutral-dark instrument panel, and the hero hull
  drawing by a wave diagram showing three tasks, disjoint ownership, and a gate.
  ADR 0001's reveal contract survived that change intact.
