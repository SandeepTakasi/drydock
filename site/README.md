# site/

The Drydock homepage — a Next.js static export published to GitHub Pages at
<https://sandeeptakasi.github.io/drydock/>.

This file used to be unedited `create-next-app` boilerplate, which mattered more
than it looks: it told you to run `npm run dev`, and **there is no `dev`
script.** It was removed by an over-constrained task brief and never restored.
Instructions that do not run are worse than no instructions.

## Commands

```bash
npm install
npm run build     # static export to out/
npm run verify    # THE gate: build && tsc --noEmit && eslint . && assert-copy && assert-matrix
```

`npm run verify` is deliberately **hermetic and browser-free**, and it is what
`deploy.yml` runs before publishing anything. Browser-only checks are a separate,
explicit step:

```bash
node scripts/measure-reduced-motion.mjs                  # needs a real Chrome
DRIFT_FIXTURE=1 node scripts/measure-reduced-motion.mjs  # must FAIL, naming D1
```

The second line is not a curiosity — it is how the gate proves it can fail. It
finds Chrome per-platform; set `CHROME_PATH` to override.

## Viewing the export locally

`next.config.ts` sets `basePath: '/drydock'`, so the export references absolute
`/drydock/_next/…` paths. `file://` will not load assets, and **serving `out/` at
a server root 404s every asset.** Mount it where it expects to be:

```bash
mkdir -p /tmp/dd && ln -sfn "$PWD/out" /tmp/dd/drydock
cd /tmp/dd && python3 -m http.server 5173   # then open /drydock/
```

Serving from a domain root instead means setting `basePath` to `""` and changing
nothing else.

## Conventions worth knowing before editing

- **All copy lives in `content/copy.ts`.** Components carry no hardcoded strings.
  `scripts/assert-copy.mjs` pins the literals that must appear and rejects
  over-claim patterns (`/\d+%\s*faster/` and friends) in the built export.
- **Every verification claim traces to `docs/compatibility.md`**, which is the
  source of truth. `scripts/assert-matrix.mjs` fails the build if the site, the
  READMEs and the compatibility matrix disagree about what has been proven.
- **Tailwind v4 is CSS-first** — tokens live in `@theme` in `app/globals.css`,
  there is no `tailwind.config.js`, and a mistyped token emits nothing with no
  error.
- **All motion timing lives in `lib/motion.ts`.** A `duration:` or `delay:`
  literal in `components/sections/*.tsx` fails `assert-copy`.
