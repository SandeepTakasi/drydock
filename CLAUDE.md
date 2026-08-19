# Drydock — working notes for Claude

Two deliverables live here: the **plugin** in `drydock/`, and the **homepage**.

## Two homepages exist. This is deliberate, not a mistake.

- `index.html` — hand-written single-file site at the repo root, no build step.
- `site/` — Next.js static export, built by plan 001.

They are visually different by decision (plan 001, Decision 1: design fresh, do
not port). Neither has been retired. **Deployment is unresolved** — there is no
git remote, so no `basePath` was ever chosen (plan 001, Q2/Q3).

## Working on `site/`

```bash
cd site && npm install
npm run build     # static export to site/out/
npm run verify    # THE gate: build && tsc --noEmit && eslint . && assert-copy
```

`npm run verify` is deliberately **hermetic and browser-free**. Browser-only
checks are a separate, explicit step:

```bash
node scripts/measure-reduced-motion.mjs   # needs Chrome; proven failable
```

There is **no `dev` script** — it was removed by an over-constrained task brief.
The export uses absolute `/_next/…` paths, so `file://` will not load assets.
To look at it: `cd site/out && python3 -m http.server 5173`.

## Toolchain facts that cost time to discover

- **`next lint` does not exist** in next@16. ESLint is wired directly
  (`eslint .` with a flat `eslint.config.mjs`).
- The ESLint config must **not** enable type-aware rules (`projectService`,
  `parserOptions.project`) — parallel single-file linting depends on it staying
  program-free — and must ignore `out/**` and `.next/**`.
- **Tailwind v4 is CSS-first.** Tokens live in `@theme` in `app/globals.css`;
  there is no `tailwind.config.js`. **A mistyped token emits nothing, with no
  error**, and unreferenced tokens are tree-shaken out of the build.
- **`react-hooks/set-state-in-effect` is a hard ERROR** here. The
  `useState` + `useEffect(() => setX(true), [])` mount-flag idiom will not lint.
  `useMotionSafe()` already solves hydration via `useSyncExternalStore`.
- **Per-file typecheck must go through a temp tsconfig**, or `@/*` aliases fail:
  `tsc` given explicit file arguments ignores `tsconfig.json` entirely.
  ```bash
  printf '{"extends":"'"$PWD"'/tsconfig.json","include":[],"files":["'"$PWD"'/<file>"]}' > /tmp/c.json
  npx tsc --noEmit --project /tmp/c.json
  ```
  `"include": []` is load-bearing — `include` is inherited through `extends`.
- **`out/index.html` contains the RSC flight payload**, so every rendered string
  appears **twice**. Strip `<script>…</script>` **bodies** before matching or
  counting anything in the export.
- Turbopack resolves its workspace root **above** this repo (a stray
  `~/yarn.lock`) and warns on every build. `turbopack.root` is unset.
- `Big_Shoulders` has no `size-adjust` fallback metrics and an unpinned `opsz`
  axis — expect layout shift on the hero headline.

## Honesty rule for site copy

`docs/compatibility.md` is the **source of truth** for every verification claim
the site makes. `site/content/copy.ts` holds all on-page strings and must match
it; `scripts/assert-copy.mjs` enforces the required literals and rejects
over-claim patterns. Do not promote a PENDING or MEASURING row, and do not add a
benchmark the repo cannot evidence.

## Plans

`docs/plans/`. Read a completed plan's Deviation Log before planning adjacent
work — plan 001's has 49 entries and most are still live constraints.
