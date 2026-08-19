# ADR 0002 — `site/` is a static export with deployment deferred

**Status:** accepted · **Date:** 2026-08-19 · **Origin:** plan 001, Decision 2

## Context

`site/` targets GitHub Pages, which serves from a repo root, `/docs`, or a
branch — never an arbitrary subdirectory. At the time of building, the repo had
**no git remote**, so the eventual URL was unknowable.

## Decision

Build only. `output: 'export'`, `images: { unoptimized: true }`, and **no
`basePath` / `assetPrefix`**. The deliverable is a verified export in `site/out/`.
No deploy workflow, no `.nojekyll`, no custom domain.

## Consequences

- A project-site URL (`<user>.github.io/drydock`) will need
  `basePath: '/drydock'`. Committing to one now would have broken every asset
  path if wrong.
- The export's absolute `/_next/…` paths mean `file://` does not work. Serve it.
- Root `index.html` remains the repo's only published homepage. Retiring it, and
  choosing the deploy shape, belong to a follow-up plan.
