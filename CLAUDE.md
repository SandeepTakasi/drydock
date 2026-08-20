# Drydock — working notes for Claude

Two deliverables live here: the **plugin** in `drydock/`, and the **homepage**.

## One homepage: `site/`

The hand-written root `index.html` was retired when the site went live
(ADR 0003). To recover it, find the deleting commit rather than guessing a
depth: `git log --diff-filter=D --format=%H -- index.html`, then
`git show <sha>^:index.html`.

**Deployment is resolved** (ADR 0003, superseding ADR 0002). GitHub Pages
project site at <https://takasivenkatasandeep-08.github.io/drydock/>, built and
published by `.github/workflows/deploy.yml` on every push touching `site/**`.
The workflow runs `npm run verify` before it uploads anything, so a failing gate
blocks the deploy rather than shipping past it.

`basePath: '/drydock'` is set in `site/next.config.ts` and is the single place
that decides it. Serving from a domain root instead means setting it to `""` and
changing nothing else.

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
The export uses absolute `/drydock/_next/…` paths, so `file://` will not load
assets, and **serving `out/` at a server root will 404 every asset** — the paths
carry the basePath. Mount it where it expects to be:

```bash
mkdir -p /tmp/dd && ln -sfn "$PWD/site/out" /tmp/dd/drydock
cd /tmp/dd && python3 -m http.server 5173   # then open /drydock/
```

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
- Display and body both resolve to **Inter** (`--font-src-sans`), which ships
  real `size-adjust` fallback metrics. It replaced `Big_Shoulders`, which had
  none and an unpinned `opsz` axis, shifted the hero headline on every load, and
  printed a build warning every time.
- **A `--color-*` token can silently shadow a built-in `text-*` utility.**
  `--color-base` made `text-base` emit `color: var(--color-base)` instead of
  Tailwind's `font-size: 1rem` — measured in the emitted CSS. The token is now
  `--color-ground`. Before naming a colour token, check the name is not also a
  default `text-*` scale step (`base`, `sm`, `lg`, `xl`, …).
- **`metadataBase` must NOT contain the basePath.** Next prepends `basePath` to
  every metadata-relative asset, so a base of `…github.io/drydock/` emits
  `/drydock/drydock/opengraph-image.png` — a 404 on every social share, and
  nothing in the build complains. `content/copy.ts` keeps `site.origin` (bare
  host, for `metadataBase`) separate from `site.url` (full address, for `og:url`).
- **The OG image is a committed binary**, `app/opengraph-image.png`, rendered
  from `scripts/og-card.html` by one headless-Chrome command in that file's
  header comment. No `next/og`, no satori, no wasm in the build. Because no copy
  assertion can read inside a PNG, `assert-copy.mjs` checks the card's promise
  sentence is still on the page and tells you to re-render when it is not.
- **A misspelled animation state name compiles clean.** `Variants` from
  `motion/react` is an index-signature type, so `{ hidden: {…}, shwon: {…} }`
  passes `tsc`, passes lint, passes every gate, and simply does not animate. Only
  `"hidden"` and `"shown"` are wired up.
- **`out/index.html` is not reproducible across builds.** Two builds of identical
  source differ in a random build id. **Never checksum `index.html`** to detect a
  change — `out/_next/static/chunks/*.css` is stable and is what the plan-002 gate
  uses; comparing the emitted file-name set across the whole `out/` tree is
  stronger still.
- **Not every `@theme` token yields a utility.** `--color-*` and `--text-*` are
  Tailwind v4 namespaces and generate classes (`bg-surface`, `text-title`).
  `--stroke-*` is not — `--stroke-rule` is a bare custom property, referenced as
  `var(--stroke-rule)` on the hero SVG. Tree-shaking retains it by name scan, so
  a dynamically-built token name is the one thing that loses.

## Honesty rule for site copy

`docs/compatibility.md` is the **source of truth** for every verification claim
the site makes. `site/content/copy.ts` holds all on-page strings and must match
it; `scripts/assert-copy.mjs` enforces the required literals and rejects
over-claim patterns. Do not promote a PENDING or MEASURING row, and do not add a
benchmark the repo cannot evidence.

## Plans

`docs/plans/`. Read a completed plan's Deviation Log before planning adjacent
work — plan 001's has 49 entries and most are still live constraints.
