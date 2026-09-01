# Drydock — working notes for Claude

Two deliverables live here: the **plugin** in `drydock/`, and the **homepage**.

## One homepage: `site/`

The hand-written root `index.html` was retired when the site went live
(ADR 0003). To recover it, find the deleting commit rather than guessing a
depth: `git log --diff-filter=D --format=%H -- index.html`, then
`git show <sha>^:index.html`.

**Deployment is resolved** (ADR 0003, superseding ADR 0002). GitHub Pages
project site at <https://sandeeptakasi.github.io/drydock/>, built and
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
- **Never link a doc with a repo-relative `../` href.** Only `site/out` is
  deployed, so `docs/` does not exist in production, and on a Pages project site
  `../` climbs out of the basePath to the domain root. Four such links shipped
  live and 404'd. Docs are linked absolutely from `REPO`/`BLOB` in
  `content/copy.ts`; `assert-copy.mjs` rejects any `../` href in the export.
- **Plugin skill files are session-cached; a skill edit needs a fresh session.**
  Editing `drydock/skills/*/SKILL.md` has no effect on the running session —
  invoking the skill returns the copy loaded at session start, and a skill
  created mid-session does not appear at all. Measured 2026-08-20: after
  committing and pushing reconcile's new refusal, invoking `drydock:reconcile`
  returned the pre-edit text while disk and `origin/main` carried the edit, and
  `seatrial` was absent from the skill list despite existing on disk. **A
  same-session test of a just-edited skill exercises the stale copy and proves
  nothing** — restart before verifying, and treat any skill this session wrote
  as unexercised until a later session runs it. See plan 004, deviation 7.
  **This includes the plan's own gate.** A plan whose tasks edit
  `wavecheck/SKILL.md` or `planwright/SKILL.md` cannot exercise those edits when
  its wave closes: `drydock:wavecheck` runs from the copy cached at session
  start. Plan 005 changed wavecheck to read `execution:` and was then gated by a
  wavecheck that could not read it (deviation 3). Such a task is shipped, gated
  on its mechanical criteria, and **still unproven** — say so in the wavecheck
  report rather than letting a PASS imply otherwise.
  **And a restart is not enough — this note understated the problem until
  2026-09-01.** The host loads skills from the INSTALLED plugin
  (`~/.claude/plugins/cache/drydock/drydock/<version>/`), never from this
  working tree, so a fresh session re-reads the same stale copy. Measured that
  day: the install sat at **0.7.0 pinned at `d7de845`** while the repo was at
  0.8.4 — every 0.8.x change unexercised by any session, and plan 005 executed
  by skills that cannot describe the `lane`/`execution` keys it declares. The
  two copies also disagree on real plans: 0.7.0 does not know `execution: solo`
  and FAILS plan 005 with four same-wave-dependency errors that 0.8.4 PASSES.
  Cut a release and **`claude plugin marketplace update drydock && claude plugin
  update drydock@drydock`**, then restart. `drydock-audit.mjs` now stamps its
  version and path on every verdict and shouts `VERSION DRIFT` when the running
  script and the installed plugin disagree — but note it compares versions, so
  editing the plugin without bumping is drift it cannot see. Bump.
- **`metadataBase` must NOT contain the basePath.** Next prepends `basePath` to
  every metadata-relative asset, so a base of `…github.io/drydock/` emits
  `/drydock/drydock/opengraph-image.png` — a 404 on every social share, and
  nothing in the build complains. `content/copy.ts` keeps `site.origin` (bare
  host, for `metadataBase`) separate from `site.url` (full address, for `og:url`).
- **The OG image is a committed binary**, `app/opengraph-image.png`, picked up by
  Next's file convention. No `next/og`, no satori, no wasm in the build.
  **It is logo art, not a text card, and that is why nothing gates it.** Until
  `487e7b0` it was a synthetic card rendered from `scripts/og-card.html`, and
  because that card restated page copy, `assert-copy.mjs` carried a drift guard
  pinning its promise sentence to the page. Both were deleted together, on
  purpose: *a logo restates no claim*, so there is nothing for a copy assertion
  to keep honest. **Do not go looking for `scripts/og-card.html` or that guard —
  neither exists, and re-adding a text card would reverse the decision.**
  The only page string the image still carries is the thesis, "Nothing sails
  until it leaves the dock", which `assert-copy` pins on its own account.
  To re-derive it after a brand change, the source is
  `assets/drydock-logo-full.png`: the art is 3:2 with empty top and bottom
  margin, so trim the margin to 1536x806 and scale to 1200x630 — nothing cropped,
  nothing letterboxed. `assets/` holds every source; everything else is derived.
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
- **BSD `wc -l` left-pads its count** (`"       1"`, not `"1"`), so piping it
  into `grep -qx 1` — or any exact-string match — never matches, whatever the
  real count is. Strip it (`tr -d ' '`) and compare with `[ "$n" = 1 ]`. This
  cost a whole acceptance criterion in plan 004: the check was unpassable
  regardless of repo state, and the idiom was written on Linux `wc` habits.
- **Playwright MCP resolves a relative screenshot `filename` against the MCP
  server's own working directory**, not the repo and not any path you declare —
  so `filename: "TG1/shot.png"` lands somewhere you did not ask for. Pass an
  absolute path, and `mkdir -p` its parent first: a missing parent fails
  `ENOENT` rather than being created. Measured 2026-08-20, plan 004.
- **Playwright MCP records zero network requests for a fragment-only
  navigation.** `page.goto` to a URL differing from the current page only by
  `#anchor` is a same-document change that never leaves the page, so
  `browser_network_requests` comes back empty — and a network assertion built on
  it silently measures nothing. Use a real navigation. Measured 2026-08-20,
  plan 004. The same run found that **a `video` evidence type is uncapturable
  through Playwright MCP** at all: video is a per-`BrowserContext` setting fixed
  at creation, and the server exposes no video, record or trace tool.

## Honesty rule for site copy

`docs/compatibility.md` is the **source of truth** for every verification claim
the site makes. `site/content/copy.ts` holds all on-page strings and must match
it; `scripts/assert-copy.mjs` enforces the required literals and rejects
over-claim patterns. Do not promote a PENDING or MEASURING row, and do not add a
benchmark the repo cannot evidence.

## Plans

`docs/plans/`. Read a completed plan's Deviation Log before planning adjacent
work — plan 001's has 49 entries and most are still live constraints.

## Executing a plan here

- **A session told to prefer Bash for file edits will silently produce no
  enforcement receipts.** `PreToolUse` hooks see Write/Edit and never see a
  `python` heredoc, a `>` redirect or `sed -i`. A wave whose edits all go
  through Bash leaves `.drydock/enforcement.log` empty, and on a plan declaring
  `enforcement: required` that is a wavecheck BLOCK — indistinguishable from a
  hook that was never armed. **Use Write/Edit for the owned files of an
  executing wave**, whatever the session's general preference. Measured
  2026-09-01, plan 005 deviation 1: one changelog write went through Bash and
  left no receipt while the wave's other 13 decisions were logged.
- **Close the wave before writing the plan document.** The plan file is owned by
  no task, so while `.drydock/wave-owns.json` is armed the hook **denies** edits
  to it — including the orchestrator's own bookkeeping. Order is: finish the
  tasks, `rm .drydock/wave-owns.json`, then write the Deviation Log and the
  wavecheck report. Measured 2026-09-01, plan 005 deviation 2. Widening `owns`
  to include the plan file is the wrong fix and is what the denial message says
  not to do — it is the mixture behind plan 004's deviation 13.
- **Per task: edit (file tool) → commit only owned files →
  `drydock-audit.mjs task-close <plan> <task-id>`.** Under
  `attribution: manifest` the commit subject is free; the manifest carries
  attribution, and a task with no entry BLOCKs the wave exactly as a missing
  commit does.
