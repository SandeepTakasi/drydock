---
plan: 001-drydock-homepage
format_version: 2
status: EXECUTING
isolation: none
created: 2026-08-18
approved_by: sandeep
---

# 001 — Drydock homepage as a statically-exported Next.js site

> **Execution protocol.** Spawn each task in the current wave as its declared
> executor agent (`drydock:executor`, or `drydock:executor-isolated` when the
> header says `isolation: worktree`) with its declared model and thinking
> budget, passing ONLY the task's context brief. Before starting any wave, run
> the staleness check below. Wait for all tasks in the wave, then invoke the
> `drydock:wavecheck` skill with this plan path and the wave id. Do not begin
> the wave's quality-review task, or the next wave, until wavecheck reports
> PASS. On BLOCK, set status BLOCKED and stop — do not self-repair; the paths
> out are `/drydock:replan` or a human decision. Quality-review rejections
> follow the escalation policy (max 2 retries → tier up → human); wavecheck
> BLOCKs on ownership violations or unlogged deviations get NO retries. When
> the final wave and phase gate pass, invoke `drydock:reconcile`.

**Staleness check (before every wave):**
`git diff <baseline SHA>..HEAD -- <wave's owned files + wave-0 contract files>`.
Non-empty → wave is STALE: re-validate its tasks against current code, update
the baseline SHA and Decision Log, then execute — or run `/drydock:replan` if
task contents (not just context) are invalidated. Never execute a stale wave
on original assumptions.

---

## 1. Requirement

A Next.js site lives in `site/`, builds to a static export (`output: 'export'`)
with no server features, and presents the Drydock homepage in a naval
engineering blueprint idiom: deep harbor blue ground, blueprint linework,
hull-primer orange as the **only** accent, IBM Plex Mono for labels and code, a
condensed industrial display face for headings.

Seven components, each owning exactly one file:

1. **Hero** — the signature element: an animated hull-in-cradle SVG where the
   hull rests in the dock and the waterline draws in as a dashed orange line
   labelled `APPROVED (HUMAN-ONLY)`, as one orchestrated load sequence.
2. **Problem** — the two failure modes of parallel agents: collision and drift.
3. **Evidence** — a two-column verified / not-yet-verified board with a link to
   `docs/self-audit.md`, and **no invented benchmarks**.
4. **Terminal** — a terminal-styled "green tests, blocked wave" moment where the
   BLOCK verdict is **revealed by a typing animation**.
5. **Lifecycle** — the six pieces as an **interactive ladder**.
6. **Install** — two commands, each with a **copy button**.
7. **FAQ**.

Animation is orchestrated and restrained — one hero load sequence,
scroll-triggered section reveals, the terminal typing reveal, the ladder's
disclosure, and subtle hover states. Nothing confetti-grade; this reads as an
engineering drawing. `prefers-reduced-motion` is honoured everywhere, producing
a page that is **still, complete, and visible** — not merely one whose text
exists in the markup.

The voice is dry and honest. The page states `internal pilot` and
`field benchmarks pending` while `docs/compatibility.md` still holds unverified
rows, and every factual claim traces to a repo document.

Done means, from `site/`: `npm run build`, `npx tsc --noEmit`, `npm run lint`,
and `node scripts/assert-copy.mjs` all exit 0 — chained as `npm run verify`.

## 2. Spec reference

None — §1 plus the Decision Log is complete. On-page copy is pinned in this
plan (Decisions 13–15, 20) or sourced from the repo documents named in F3.

## 3. Surgical-scope statement

The smallest satisfying diff creates `site/` and this plan file, and nothing
else. Root `index.html`, `README.md`, `drydock/`, and `docs/*.md` are read-only
throughout; no deployment workflow, no test runner, and no `basePath` are added.

## 4. Baseline

**Baseline confirmed by T0.** Verified at execution time (2026-08-18):

| Item | Observed value |
|---|---|
| Baseline SHA | `c664671` |
| Working tree | clean |
| node / npm | v22.23.1 / 11.18.0 |
| `site/` exists | no |
| `package.json` anywhere | none |
| CI config | none (`.github/` absent) |
| Lint config | none |
| Registry | next 16.3.1, tailwindcss + @tailwindcss/postcss 4.3.3, motion 13.1.0, eslint-config-next 16.3.1 |

**Pre-existing failures excluded from acceptance criteria:** none. **No quality
gate is runnable before T1.0.1 completes**, because no `package.json` exists.
T0 records gates as `N/A — pre-scaffold`; the first meaningful gate run is
T1.0.1's own criterion.

## 5. Practices in effect

| Practice | Value | Source |
|---|---|---|
| Testing approach | Test-after; no test runner added | user |
| Quality gates | `npm run build`, `npx tsc --noEmit`, `npm run lint`, `node scripts/assert-copy.mjs`, chained as `npm run verify` | user |
| Commit granularity | One commit per task, `drydock(<task-id>): <task name>`; retry on `index.lock` (Decision 17) | user + format contract |
| Isolation | `none` — see Decisions 16, 21 for how the shared-state hazards are handled without worktrees | user |
| Human gates | Approval at each phase boundary; browser confirmation at the Phase 2 gate | user |
| Model budget | Haiku mechanical / Sonnet sections / Opus contracts + reviews only | user |
| **Tier → model map** | Mechanical → **Haiku**, thinking off. Standard → **Sonnet**, default. Complex → **Sonnet**, extended thinking. Judgment → **Opus**, extended thinking. | planner, from the user's budget |
| Parallelism cap | Max 5 concurrent executors | user |
| Branching | Direct commits to `main` (no remote exists) | repo state |
| Tracker mirroring | None. This plan file is the source of truth | planner (assumed — flag if wrong) |
| Pre-commit hooks | None present | repo state |
| Working directory | Every acceptance criterion runs from the repo root, `/Users/takasivenkatasandeep/Desktop/drydock-repo`, and `cd`s from there | planner |

## 6. Findings & constraints

**F1 — A complete hand-written homepage already exists at root `index.html`.**
It implements this same design direction and has no animation. Per Decision 1
the user chose to design fresh, so **root `index.html` is excluded from every
context brief and forbidden to read or modify**. Accepted consequence: the repo
temporarily holds two visually different homepages (Q3).

**F1a — Copy may not be sourced from `index.html`, even indirectly.** Revision 1
of this plan required three literals that existed only there. Every required
literal is now either pinned verbatim in this plan or verified present in an F3
document. **Every string a section renders must have a named export in
`content/copy.ts`** — no exceptions, including the Hero's headline (the omission
that round 2 caught).

**F2 — No git remote exists**, so the Pages URL is unknown and
`basePath`/`assetPrefix` cannot be decided. Deployment is out of scope
(Decision 2); the deliverable is a verified export in `site/out/`.

**F3 — Sanctioned factual sources:**
- `drydock/README.md` — lifecycle, the six pieces, the piece/kind/invocation
  table, non-goals, the tagline "Nothing sails until it leaves the dock",
  contains "drift" (line 16).
- `docs/self-audit.md` — dry-run method, findings, limitations.
- `docs/compatibility.md` — current verified / not-yet-verified rows.
- `drydock/skills/wavecheck/SKILL.md` — the five checks and real verdict format.
- `drydock/.claude-plugin/plugin.json` — name, displayName, version `0.3.1`.

**F4 — The Evidence board must be regenerated, not copied.** Current
`docs/compatibility.md` state: **verified** = contract logic (self-audit), A1
model override, A2 worktree spawning, A4 `plugin validate --strict`;
**not yet verified** = A2b post-wavecheck merge procedure (PENDING), A3
gate-compliance rate (MEASURING). A3 having no numbers is what keeps
"field benchmarks pending" true.

**F5 — Animated text must be server-rendered and then revealed.** A typing
effect that appends characters leaves its text absent from `out/index.html`.
All animated copy exists in the markup; animation drives only opacity, clip,
width, or transform. The hero's waterline label is a real SVG `<text>` node, and
the ladder's per-rung detail text is present regardless of disclosure state.

**F5a — Presence is not visibility.** Framer Motion writes inline
`style="opacity:0"` for an element's `initial` state, and a CSS
`prefers-reduced-motion` net cannot override an inline style. So a reduced-motion
visitor would receive a page whose text exists but is invisible until hydration.
Every animated element therefore carries a `data-reveal` attribute, and
T1.1.1's reduced-motion block force-restores it (`opacity:1!important` etc.).
This is gated in T1.1.1's criterion and in the assertion harness.

**F6 — Tailwind v4 is CSS-first.** Tokens live in an `@theme` block; no
`tailwind.config.js`. PostCSS integration is `@tailwindcss/postcss`. Tailwind
silently emits nothing for an unknown `--color-*` utility, so a mistyped token is
not a build error — hence token-name gating.

**F6a — `next/font` variable names must differ from `@theme` token names.**
Pointing `--font-display` at itself (`@theme { --font-display: var(--font-display) }`)
is self-referential, silently dropped, and invisible until a human looks at the
page. Fonts declare `--font-src-display` / `--font-src-mono` / `--font-src-body`;
`@theme` maps `--font-display: var(--font-src-display), sans-serif`.

**F7 — `next lint` does not exist in next@16.3.1** (verified against the CLI's
command list). ESLint is wired directly: `eslint` + `eslint-config-next`, flat
`eslint.config.mjs`, `"lint": "eslint ."`. Settled, not for the executor to
rediscover.

**F7a — The ESLint flat config must not enable type-aware rules.** Decision 16
scopes parallel-wave criteria to `npx eslint <own file>`; that is only hermetic
if the config has no `projectService` and no `parserOptions.project`, which would
otherwise build a TS program across the whole `include` and read siblings'
half-written files. The config must also ignore `out/**` and `.next/**`, since
`eslint .` runs after a build exists.

**F8 — Framer Motion ships as `motion@13.1.0`**, imported from `motion/react`;
the subpath re-exports framer-motion including `useReducedMotion`, which returns
`boolean | null` (`null` during static export). Every animated component needs
`"use client"`, compatible with `output: 'export'`.

**F9 — Static export constraints.** `images: { unoptimized: true }`; no route
handlers, middleware, ISR, or dynamic params. `next/font` self-hosts at build
time and is export-safe.

**F10 — `next/font/google` has no `Big_Shoulders_Display`.** Available exports:
`Big_Shoulders`, `Big_Shoulders_Inline`, `Big_Shoulders_Stencil`. `Big_Shoulders`
is a variable weight axis (100–900), so no `weight` array.

**F11 — Matching text in the export requires normalisation, not just entity
decoding.** React SSR inserts `<!-- -->` between adjacent text expressions, and
any literal wrapped mid-phrase in a tag (`internal <span>pilot</span>`) is split
by markup. The assertion harness therefore normalises before matching: strip
HTML comments, strip all tags, collapse whitespace, then decode entities. In
addition, **no gated literal may contain markup, markdown emphasis, angle
brackets, or an apostrophe** — enforced by the forbidden lists of T1.2.1 and
every T2.x task.

**F12 — Nothing typechecks in a parallel wave unless it is hermetic.** Project
`tsc --noEmit` reads every sibling, so it cannot run in waves 1.1/2.1/2.2.
Without a per-file check, a `.ts` file using `React.FC` with no React import
passes ESLint, passes wavecheck, and blocks a later task that does not own it.

**F12a — CORRECTED (deviation 27). The original per-file invocation is broken for
any file using the `@/*` alias.** `tsc` given explicit file arguments ignores
`tsconfig.json` entirely, so the `paths` map never loads and `@/lib/section`
fails with TS2307. This passed three times in Wave 1.1 only by accident: those
files import solely from node_modules (`react`, `motion/react`,
`next/font/google`). Every Phase-2 section imports `@/lib/section`,
`@/lib/motion`, and `@/content/copy`, so all seven criteria would have failed.

The canonical hermetic typecheck, verified to resolve aliases, exclude siblings,
and still catch a real injected type error:

```sh
printf '{"extends":"'"$PWD"'/tsconfig.json","include":[],"files":["'"$PWD"'/<file>"]}' \
  > /tmp/dd-tc-<unique>.json && npx tsc --noEmit --project /tmp/dd-tc-<unique>.json
```

`"include": []` is load-bearing: `include` is **inherited through `extends`**, so
without clearing it the config pulls every sibling section file back into the
graph and hermeticity is lost. Measured: with it, the graph for
`content/copy.ts` is exactly `lib/section.ts` + `content/copy.ts` and zero
`components/sections/*` files; without it, seven sibling files enter the graph.
`<unique>` must differ per task — parallel executors write these concurrently.

**F13 — `.claude/` is gitignored**, so agent worktrees cannot pollute wavecheck
diffs.

**F14 — Repo version strings disagree**: root `README.md` says `v0.3.0`,
`plugin.json` says `0.3.1`. The site uses `plugin.json` as authoritative
(Decision 20). Fixing the README is a follow-up, not this plan's work.

## 7. Decision Log

| # | Question | Decision | Decided by | Rationale |
|---|---|---|---|---|
| 1 | Port root `index.html` or design fresh? | Design fresh; `index.html` excluded from all briefs and forbidden to read | user | Excluding it from briefs is the only way that choice is honoured rather than nominally stated |
| 2 | Deployment shape / `basePath`? | Build only. No deploy task, no `basePath`, no workflow. Artifact is `site/out/` | user | No remote exists; a `basePath` guess breaks every asset path if wrong |
| 3 | Evidence board content? | Regenerate from `docs/compatibility.md` | user | Copying `index.html`'s columns would publish claims the repo's own table contradicts |
| 4 | Practices? | §5 | user | No CLAUDE.md, CI, or lint config existed to infer from |
| 5 | Animation package? | `motion@13`, from `motion/react` | planner (assumed — flag if wrong) | Current published name; `framer-motion` is the legacy alias |
| 6 | Display face? | `Big_Shoulders` (variable 100–900), `IBM_Plex_Mono`, `Archivo` for body | planner (assumed — flag if wrong) | `Big_Shoulders_Display` does not exist (F10). Alternatives: `Oswald`, `Saira_Condensed` |
| 7 | Tailwind token mechanism? | v4 `@theme` in `app/globals.css`; no `tailwind.config.js` | planner (assumed — flag if wrong) | v4 is CSS-first (F6) |
| 8 | How do seven sections stay disjoint when all register in one page? | Wave 1.3 pre-wires `page.tsx` with all seven imports and ships stubs; each Phase-2 task replaces exactly one stub and never touches `page.tsx` | planner | Otherwise every section task contends for `page.tsx` and Phase 2 cannot be parallel |
| 9 | How is animated copy kept greppable? | Server-rendered text; animation drives only opacity / clip / width / transform | planner | F5 |
| 10 | Test runner? | None | user | Acceptance is command-shaped by the requirement |
| 11 | Tracker mirroring? | None | planner (assumed — flag if wrong) | Not requested |
| 12 | Self-audit link that cannot resolve in a static export? | Render as specified, as the single constant `site.selfAuditHref` | planner | Confines a known-broken link to one place |
| 13 | Terminal transcript copy — revision 1 required `VERDICT: BLOCK`, which wavecheck never emits and which came from the forbidden `index.html` | Pinned verbatim in T1.2.1, modelled on wavecheck's real five checks and verdict format, using the dry-run scenario from `docs/self-audit.md`, captioned as an illustration | planner | A fabricated CLI transcript on a page arguing against fabrication is the worst available defect. The real format is more convincing anyway |
| 14 | FAQ questions — revision 1 required a literal existing only in `index.html` | Pinned verbatim in T1.2.1, planner-authored | planner | No sanctioned source carries FAQ copy |
| 15 | Problem copy? | Pinned verbatim in T1.2.1; "drift" sourced from `drydock/README.md` | planner | The literal is gated, so it must be guaranteed rather than hoped for |
| 16 | Parallel executors share one `site/` tree — concurrent `next build` clobbers `.next`/`out`, and project-wide `tsc`/`eslint` read siblings | Parallel-wave criteria are scoped to owned files: `npx eslint <file>` + hermetic per-file `tsc` (F12) + greps. Full `npm run verify` runs only in single-task waves (1.0, 1.2, 1.3, 2.0, 2.3) and at phase gates | planner | The user chose `isolation: none`; ownership protects the diff, not a shared build directory. Worktree isolation is the alternative but would depend on the A2b merge procedure `docs/compatibility.md` lists as PENDING |
| 17 | Concurrent per-task `git commit` collides on `.git/index.lock` | Executors retry up to 3 times with short backoff, then report a deviation. **Added to the context brief of every parallel-wave task**, since briefs are all an executor receives | planner (assumed — flag if wrong) | Real hazard of `isolation: none`; round 2 caught that stating it only in §10 delivered it to nobody |
| 18 | Does the `Section` shell take children, and does Hero use it? | `lib/section.ts` exports `SectionProps` (no children) and `SectionShellProps` (with children). Each section renders its own `<Section meta={meta}>` root; `page.tsx` renders bare `<Problem meta={…}/>`. **Hero is exempt** — not a `SectionComponent`, no draft mark, no `<h2>`, rendered `<Hero/>` unwrapped, and has **no `SectionMeta`** | planner | Ambiguity would produce two conventions across seven agents. Hero is the opening element with a load sequence, not a scroll-revealed section |
| 19 | Who owns section headings and page metadata? | `content/copy.ts` exports the six `SectionMeta` objects and the `metadata` strings; `page.tsx` and `layout.tsx` import them and author no copy | planner | Otherwise T1.3.1 authors copy in a file that must not change again, while every T2.x task is forbidden from hardcoding copy |
| 20 | Hero copy, and which version string the page shows | Pinned verbatim in T1.2.1 as `export const hero`; version is `0.3.1` from `plugin.json` (F14) | planner | Round 2 found the page's most prominent text had no source and no owner — the exact failure mode F1a exists to prevent |
| 21 | Content (`T1.2.1`) needs `SectionMeta`, authored by `lib/section.ts` — a wave-mate in revision 2 | Content moved to its own **Wave 1.2**, depending on T1.1.2; the shell moved to **Wave 1.3**. Task IDs renumbered accordingly (legitimate: this plan is DRAFT and has never executed) | planner | Round 2 caught this as a re-run of the same sideways-dependency defect round 1 found. Eslint and grep do not resolve imports, so it would have passed its wave and detonated in the shell task |
| 22 | The `duration:` ban had loopholes (`delay:`, Tailwind `duration-700`) and squeezed out the Terminal's and Hero's legitimate cadence needs | Ban widened to `(duration\|delay):\|duration-[0-9]` over `components/sections/*.tsx` only; `lib/motion.ts` gains `revealClipStagger(i)` and `heroSequence` so the cadence lives in the contract | planner | A gate that forbids what the requirement needs forces the executor to either break the gate or break the feature |

| 23 | **B2** — §1 requires the waterline to "draw in as a dashed orange line", but `pathLength` in `motion-dom` implements drawing by overwriting `stroke-dasharray` with one dash and one gap, so dashed and drawing-on are mutually exclusive on a single element and the finished state is solid | **The waterline is built as TWO elements: a dashed overlay `<path>` with an author `stroke-dasharray`, revealed left-to-right by `revealClip` (a clip/width animation), NOT by `drawLine`/`pathLength`.** `drawLine` remains correct for the hull outline, which is solid | planner, on human instruction | Satisfies §1's dashed requirement with no change to the frozen `lib/motion.ts` and no timing literal in a section file. The alternative — adding a `pathSpacing`-aware variant — would reopen a contract that seven tasks already build against. Traced to the installed source, not assumed |
| 24 | **B4** — the export has no `<h1>`; Decision 18 removed Hero's `<h2>` but nothing ever assigned the page a top-level heading | **Hero renders `hero.headline` as the page's single `<h1>`.** Pinned in T2.1.1's brief and asserted by T2.0.1's harness | planner, on human instruction | Restores heading order and gives the page an accessible name. Fixed by contract rather than by code, so Phase 1 will still show zero `<h1>` while Hero is a stub — the re-review must treat B4 as addressed-by-decision, not look for it in Phase 1's diff |

| 25 | **B5** — the reduced-motion restore uses an unqualified `[data-reveal]` selector, so `stroke-dasharray: none !important` hits every revealed element. Decision 23's dashed overlay must carry `data-reveal` (it is clip-animated, so Framer writes inline `opacity: 0`), which means the dashed waterline renders **solid** under reduced motion — silently losing §1's dashed requirement | **The restore attribute is split.** `[data-reveal]` restores `opacity`, `transform`, `clip-path`, `width` — everything a clip/opacity reveal needs. A second attribute `[data-reveal-path]` adds `stroke-dasharray: none !important` and `stroke-dashoffset: 0 !important`, and is applied **only** to elements animated via `pathLength`. The dashed overlay carries `data-reveal` alone and keeps its author dash pattern | planner, on human instruction | B3 and Decision 23 were each correct in isolation and collided. Splitting the attribute is the minimum change that keeps both: path-drawn strokes still get restored to visible, dash-patterned strokes keep their pattern. Measured in headless Chrome by T1.R.1 before the fix: a dashed `data-reveal` path is restored visible and solid while a control stays dashed |
| 26 | **B2 residue** — `revealClip` is `t(REVEAL)` = 0.5s at **delay 0**, so beat 3 of `heroSequence` (waterline at 1.0s) has no in-contract carrier. The only route was `revealClipStagger(11)`, a magic line index no brief sanctions and the timing-ban regex does not catch | **`lib/motion.ts` gains `waterlineReveal`** — a clip/width reveal carrying the waterline's 1.0s delay, so the dashed overlay is revealed on the hero timeline without a section file containing any timing literal | planner, on human instruction | Decision 23 told T2.1.1 to reveal the dash by clip instead of `pathLength`, but the frozen contract had no delayed clip variant to do it with. A contract fix that cannot be built is not a fix |

## 8. Open questions

| # | Question | Blocks | Recommended answer |
|---|---|---|---|
| Q1 | Which install-command form is canonical? Three variants exist across `README.md`, `drydock/README.md`, and `index.html`; `<org>` is an unfilled placeholder with no remote to resolve it. | Nothing — T1.2.1 pins the root-README form | Root-README form, `<org>` intact. No assertion targets it (F11: angle brackets). Revisit when a remote exists |
| Q2 | Pages deploy shape; does the export replace root `index.html`? | Nothing (deferred by Decision 2) | Decide once a remote exists; likely `basePath: '/drydock'`. Separate plan |
| Q3 | Acceptable to hold two visually different homepages until deploy is decided? | Nothing — accepted consequence of Decision 1 | Yes, temporarily |

## 9. Out of scope / follow-ups

- **Deployment**: Actions workflow, `basePath`/`assetPrefix`, custom domain,
  `.nojekyll`.
- **Retiring root `index.html`** or reconciling its design with `site/`.
- **A test runner** and component tests.
- **Rendering `docs/*.md` in-site** so the self-audit link resolves.
- **Analytics, OG images, sitemap, robots.txt.**
- **Resolving the real `<org>` and marketplace name** (Q1).
- **Reconciling the `v0.3.0` / `0.3.1` version mismatch** between root
  `README.md` and `plugin.json` (F14).
- **A CLAUDE.md** for the repo.

## 10. Execution policies

**Per task:** the single acceptance criterion must exit 0, run by the executor and
re-run independently by wavecheck **from the repo root** (§5). In parallel waves,
criteria are scoped to owned files per Decision 16.

**Per wave (conformance):** `drydock:wavecheck` with this plan path and the wave
id. PASS required before the wave's quality review or the next wave.
**Phase 0 gets no wavecheck** — T0 is a read-and-record task with no code diff.

**Baseline SHA advances.** After each wavecheck PASS, the baseline SHA in §4 is
updated to that wave's last checkpoint commit. Without this every wave after 1.0
reports STALE by construction, because earlier waves legitimately changed the
files later waves own.

**Per phase (quality):** the `Wave <p>.R` task — fresh-context Opus reviewer over
the phase diff, checking correctness, conventions, edge cases, and scope creep.
Runs only after wavecheck PASS. APPROVED required for the phase gate. The R
criteria are assertion-shaped (a written verdict), which wavecheck's check 4
permits; note they cannot mechanically fail, so the phase gate — not the
criterion — is what enforces them.

**Escalation:** quality-review rejection → max 2 retries with feedback injected →
tier up → human with a written summary. Wavecheck BLOCK on ownership violation or
unlogged deviation → **no retries**, route to `/drydock:replan` or a human.
**T2.3.1 integration failure** → append targeted fix tasks `T2.3.2+`, one per
failing file, each owning exactly that file; no cross-file fixes, no edits by
T2.3.1 itself.

**Checkpointing:** one commit per task, `drydock(<task-id>): <task name>`,
touching only owned files; retry on `index.lock` (Decision 17). Rollback unit is
the task.

**Declared format deviations (so wavecheck sees them declared, not discovered):**
Phase 1's parallel wave is governed by Wave 1.1; Phase 2's by Wave 2.0. There is
no separate `Wave x.0` beyond these. T0, the R tasks, and T2.3.1 own sections of
this plan file rather than nothing, and their checkpoint commit is that append.

**Human gates:** approval after each phase's R task; plus browser confirmation at
the Phase 2 gate — load the export, confirm the hero sequence, scroll reveals,
the terminal reveal, ladder interaction by keyboard, and that enabling OS "reduce
motion" yields a still, complete, **visible** page.

**Final step:** `drydock:reconcile` after the Phase 2 gate passes.

## 11. Pressure-test verdict

**Round 1 — REJECTED.** 9 CRITICAL / 9 MAJOR / 5 MINOR. Headlines: a font that
does not exist; parallel executors sharing one build directory; a conformance
task whose criterion could not fail; and three required literals sourced from the
forbidden `index.html`, two of which existed in no sanctioned source at all.
Three "scope creep" findings were **rejected** — the copy buttons, interactive
ladder, and typing reveal are explicit user requirements; the real defect was
that §1 omitted them.

**Round 2 — REJECTED.** 3 CRITICAL / 9 MAJOR / 14 MINOR, all against the
revision. Confirmed and fixed here:

| Finding | Fix |
|---|---|
| C-1 Content task depended on its wave-mate for `SectionMeta` — the same sideways-dependency defect round 1 found | Decision 21 — content moved to Wave 1.2, shell to Wave 1.3, tasks renumbered |
| C-2 The Hero's headline had no source, no owner, and no "hardcoding copy" prohibition | Decision 20 + F1a — `hero` pinned in T1.2.1, forbidden list extended, criterion changed to gate the import not the literal |
| C-3 Wave 1.1 contracts were never typechecked; `React.FC` in a `.ts` file passes ESLint and fails `tsc` | F12 — hermetic per-file `tsc` added to every scoped criterion; React import stated in T1.1.2's sketch |
| M-1 Scoped lint is only hermetic if the config has no type-aware rules | F7a + T1.0.1 sketch pins it |
| M-2 `eslint .` would lint `out/` and `.next/` | F7a + T1.0.1 pins `ignores` and the exact lint script |
| M-3 The harness criterion validated the script's text, not its behaviour | T2.0.1 takes a path argument; criterion is a two-fixture pass/fail self-test |
| M-4 React splits text nodes; pinned prose contained markdown emphasis | F11 — normalise (strip comments, strip tags, collapse, decode); markup banned inside gated literals; `*good*` removed from the pinned prose |
| M-5 Nothing compiled the sections until integration, and no escalation path existed for that failure | F12 per-file `tsc` in 2.1/2.2 + §10's `T2.3.2+` policy |
| M-6 Reduced motion shipped inline `opacity:0` that CSS cannot override | F5a — `data-reveal` + forced restore, gated in T1.1.1 and the harness |
| M-7 Font `variable` names collided with `@theme` token names, silently killing fonts | F6a — distinct `--font-src-*` names, gated |
| M-8 Decision 17 was stated only in §10, which no executor reads | Added to every parallel-wave context brief |
| M-9 The `duration:` ban had loopholes and squeezed out needed cadence | Decision 22 — widened regex, scoped glob, `revealClipStagger`/`heroSequence` added to the contract |
| m-1 `grep -- "--color-ink"` matched `--color-ink-dim` | Token greps use `"$t:"` |
| m-2 Piece loop verified 5 of 6; two matched the transcript, not the array | Loop greps `agents` and distinguishing strings |
| m-3 T0 might have nothing to commit → wavecheck BLOCK | T0 owns §4 + a mandatory Progress-log row; no wavecheck for Phase 0 |
| m-4 Every wave was STALE by construction | §10 — baseline SHA advances per wavecheck PASS |
| m-5 Pinned transcript had ragged dot-leaders on a monospace showcase | Re-padded to a uniform 31-column gutter |
| m-8 Mixed relative/absolute cwd across criteria | §5 states the cwd once |
| m-9 An unused `typecheck` script | Dropped |
| m-11 Tier→model map was never stated | §5 |
| m-12 Version string ambiguity | F14 + Decision 20 |
| m-13 §10 missing the tracker-mirroring clause; R criteria cannot fail | §5/§10 state both, with the limitation named |
| m-14 A Hero `SectionMeta` nothing consumed | Decision 18 — Hero has no meta |

**Not fixed, accepted with reasons:** m-6 (`! grep -q` exits 0 on a missing file)
— harmless because the preceding `npx eslint <file>` fails first on an absent
file; the ordering is deliberate. m-7 (`grep -q "problem"` is satisfiable by a
barely-touched stub) — accepted: per-file criteria detect wiring, and the
substantive check is the harness at T2.3.1 plus the R review. m-10 (§11 cites
round-1 IDs that no longer exist) — kept deliberately; this section is a history
and the old IDs are what round 1 actually reported.

**Round 3:** not yet run. See the note to the approver below.

> **Note to the approver.** Two adversarial rounds each found real, execution-
> blocking defects, and both times the defects were in the *plan*, not the idea.
> That is the pressure test working, but it is also a signal: this plan is now
> substantially longer than the artifact it describes, and the existing
> `index.html` delivers the same seven sections in 240 lines with no build step.
> The Next.js/Tailwind/Framer stack, the fresh design, and the animation layer
> are all things you asked for and they are legitimately more than `index.html`
> has — but if a third rejection round would not change your mind about
> proceeding, running one is ceremony. Your call, and it is recorded either way.

---

## Phase 0: Pre-flight

#### T0 — Baseline verification
- **Status:** TODO
- **Description:** Confirm the baseline on the untouched repo — HEAD SHA, clean
  tree, node/npm versions, absence of `site/` and any `package.json` — and record
  that no quality gate is runnable pre-scaffold.
- **Files owned:** `docs/plans/001-drydock-homepage.md` (§4 and the Progress log)
- **Depends on:** —
- **Model / thinking:** Mechanical / off (Haiku)  **Executor:** drydock:executor
- **Context brief:** This plan §4, §5 (working directory).
- **Forbidden:** Creating `site/`. Installing anything. Editing any section of
  this plan other than §4 and the Progress log.
- **Acceptance criterion:**
  `cd /Users/takasivenkatasandeep/Desktop/drydock-repo && git rev-parse HEAD && node --version && npm --version && test ! -d site && grep -q "Baseline confirmed" docs/plans/001-drydock-homepage.md`

---

## Phase 1: Foundation — buildable shell with frozen contracts

**Exit state:** `site/` builds to a static export rendering a laid-out page of a
Hero plus six placeholder sections; tokens, the section interface, animation
variants, and all copy are frozen and imported by the shell. **Amended after
T1.R.1's REJECTED verdict (deviation 25):** the copy inventory covers every
string the seven Phase-2 sections must render, the reduced-motion restore covers
SVG stroke channels, the blueprint grid is perceptible, and the shell carries
drawing furniture rather than reading as a dark landing page.

**Phase gate:** `cd site && npm run build && npx tsc --noEmit && npm run lint`
exits 0; wavecheck PASS on 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, **1.6**; human approval.
**T1.R.1 ran twice and REJECTED twice** (B1–B4 + D, then B2/B4/B5). B1, B3 and D
were closed by waves 1.4/1.5; B2 and B4 by orchestrator brief edits; B5 by wave
1.6. **A third review run was deliberately skipped by human decision** — see
deviation 36, which records the accepted residual risk and names the verifier.

### Wave 1.0 — Scaffold
> Single task by necessity: nothing builds, typechecks, or lints until a
> `package.json` exists.

#### T1.0.1 — Scaffold the Next.js static-export app
- **Status:** TODO
- **Description:** Create a minimal Next.js App Router + TypeScript app in
  `site/` configured for static export, with Tailwind v4 and `motion` installed
  and a hermetic lint setup. The outcome is a green toolchain, not any design.
- **Files owned:** `site/package.json`, `site/package-lock.json`,
  `site/next.config.ts`, `site/tsconfig.json`, `site/next-env.d.ts`,
  `site/eslint.config.mjs`, `site/postcss.config.mjs`, `site/.gitignore`,
  `site/README.md`, `site/app/layout.tsx`, `site/app/page.tsx`,
  `site/app/globals.css`, `site/app/favicon.ico`, `site/public/**`
- **Depends on:** T0
- **Model / thinking:** Standard / default (Sonnet)  **Executor:** drydock:executor
- **Context brief:** This plan §6 (F6, F7, F7a, F8, F9), Decisions 5, 7.
- **Forbidden:** Any design work — no palette, no fonts, no section components.
  Reading or modifying root `index.html`. Adding `basePath` or `assetPrefix`.
  Adding a test runner. Enabling type-aware ESLint rules. Creating files outside
  `site/`.
- **Implementation sketch:**
  - `next.config.ts`: `{ output: 'export', images: { unoptimized: true } }`.
  - `site/.gitignore`: `node_modules/`, `.next/`, `out/`.
  - Tailwind v4: `@tailwindcss/postcss` in `postcss.config.mjs`;
    `@import "tailwindcss";` first line of `globals.css`. No
    `tailwind.config.js`.
  - ESLint: `next lint` does not exist (F7). Install `eslint` +
    `eslint-config-next`, flat `eslint.config.mjs`. **Pin exactly**
    `ignores: ["out/**", ".next/**", "node_modules/**"]`, and **no
    `projectService`, no `parserOptions.project`** (F7a).
  - Scripts: exactly `"build": "next build"` and `"lint": "eslint ."`. Do not add
    `verify` (T2.0.1 owns it) or a `typecheck` script (nothing calls it).
  - `create-next-app` is permitted; its extra emissions are pre-owned above.
- **Acceptance criterion:**
  `cd site && npm install && npm run build && npx tsc --noEmit && npm run lint && test -f out/index.html && node -e "const c=require('fs').readFileSync('eslint.config.mjs','utf8'); process.exit(c.includes('projectService')||c.includes('parserOptions')?1:0)"`

### Wave 1.1 — Contracts
> Pins the shared surface. Three leaf-level tasks; none imports another's output.
> Criteria are scoped per Decision 16 and hermetically typechecked per F12.

#### T1.1.1 — Freeze design tokens
- **Status:** TODO
- **Description:** Define the blueprint palette, type scale, blueprint-grid
  ground, and the reduced-motion restore rule as Tailwind v4 `@theme` tokens and
  CSS custom properties, derived from §1's brief. Register the three fonts.
- **Files owned:** `site/app/globals.css`, `site/lib/fonts.ts`
- **Depends on:** T1.0.1
- **Model / thinking:** Judgment / extended (Opus)  **Executor:** drydock:executor
- **Context brief:** This plan §1, §6 (F5a, F6, F6a, F10, F12), Decisions 1, 6, 7,
  17, §10 Checkpointing. **Do not read root `index.html`** — derive the palette
  fresh from the brief.
- **Forbidden:** Reading or copying root `index.html`. Any second accent colour —
  hull-primer orange is the only one. Touching `layout.tsx` or `page.tsx`.
  Pointing a `@theme` font token at a `var()` of the same name (F6a).
- **Implementation sketch:**
  - Nine `@theme` names, all gated: `--color-dock`, `--color-panel`,
    `--color-line`, `--color-ink`, `--color-ink-dim`, `--color-primer`,
    `--font-display`, `--font-mono`, `--font-body`.
  - `lib/fonts.ts`: `next/font/google` instances for `Big_Shoulders` (variable,
    no `weight` array — F10), `IBM_Plex_Mono`, `Archivo`, with `variable` set to
    `--font-src-display` / `--font-src-mono` / `--font-src-body` (F6a). `@theme`
    maps e.g. `--font-display: var(--font-src-display), sans-serif`.
  - Blueprint grid as a repeating-linear-gradient utility on the body ground.
  - `@media (prefers-reduced-motion: reduce)`: kill animation, transition, and
    `scroll-behavior`, **and force-restore animated elements** —
    `[data-reveal]{opacity:1!important;transform:none!important;clip-path:none!important;width:auto!important}`
    (F5a).
- **Acceptance criterion:**
  `cd site && npx eslint lib/fonts.ts && npx tsc --noEmit --strict --jsx react-jsx --module esnext --moduleResolution bundler --esModuleInterop --skipLibCheck --target es2022 lib/fonts.ts && for t in --color-dock --color-panel --color-line --color-ink --color-ink-dim --color-primer --font-display --font-mono --font-body; do grep -q -- "$t:" app/globals.css || exit 1; done && grep -q "prefers-reduced-motion" app/globals.css && grep -q "data-reveal" app/globals.css && grep -q -- "--font-src-display" lib/fonts.ts && grep -q "Big_Shoulders" lib/fonts.ts`

#### T1.1.2 — Freeze the section component interface
- **Status:** TODO
- **Description:** Define the TypeScript contract every section implements, the
  shell's props, and the Hero exemption. Types only, no rendering.
- **Files owned:** `site/lib/section.ts`
- **Depends on:** T1.0.1
- **Model / thinking:** Mechanical / off (Haiku)  **Executor:** drydock:executor
- **Context brief:** This plan Decisions 8, 18, §6 (F12), Decision 17,
  §10 Checkpointing.
- **Forbidden:** Writing any component or JSX. Reading root `index.html`.
  Touching `globals.css`, `page.tsx`, or anything under `components/`. Adding
  fields beyond those specified — eight files import this.
- **Implementation sketch:** exactly this surface, and **`import type React from
  "react"` is required** or the file fails a hermetic `tsc` (F12):
  - `SectionMeta { id: string; draftMark: string; heading: string }`
  - `SectionProps { meta: SectionMeta }`
  - `SectionShellProps { meta: SectionMeta; children: React.ReactNode }`
  - `SectionComponent = React.FC<SectionProps>`
  - A doc comment stating: each section renders its own `<Section meta={meta}>`
    root; `page.tsx` renders bare `<Problem meta={…}/>`; **Hero is exempt, is not
    a `SectionComponent`, and has no `SectionMeta`**.
- **Acceptance criterion:**
  `cd site && npx eslint lib/section.ts && npx tsc --noEmit --strict --jsx react-jsx --module esnext --moduleResolution bundler --esModuleInterop --skipLibCheck --target es2022 lib/section.ts && for n in SectionMeta SectionProps SectionShellProps SectionComponent; do grep -q "$n" lib/section.ts || exit 1; done`

#### T1.1.3 — Freeze shared animation variants
- **Status:** TODO
- **Description:** Define the reusable `motion` variants, the per-index cadence
  helpers the Hero and Terminal need, and the reduced-motion gate, so no
  component invents its own timings.
- **Files owned:** `site/lib/motion.ts`
- **Depends on:** T1.0.1
- **Model / thinking:** Judgment / extended (Opus)  **Executor:** drydock:executor
- **Context brief:** This plan §1, §6 (F5, F5a, F8, F12), Decisions 5, 9, 17, 22,
  §10 Checkpointing.
- **Forbidden:** Writing any component or JSX. Reading root `index.html`. Any
  variant that animates text content rather than opacity / clip / width /
  transform. Confetti-grade effects, bounce, or spring overshoot.
- **Implementation sketch:**
  - Exports, all gated: `sectionReveal`, `staggerChildren`, `childRise`,
    `drawLine` (`pathLength` 0→1 for the waterline), `revealClip`,
    **`revealClipStagger(i: number)`** (per-line cadence for the Terminal's
    sequential reveal — Decision 22), **`heroSequence`** (the four-beat hero
    timeline: linework → hull draw → waterline → label), `useMotionSafe`,
    `NO_MOTION`.
  - `useMotionSafe(): boolean` wraps `useReducedMotion()`, which returns
    `boolean | null` (F8). Treat `null` as motion allowed so the export carries
    the pre-animation state with all text present (F5), and guard against a
    hydration mismatch.
  - `NO_MOTION` — zero-duration variant set returned under reduced motion, so
    consumers swap variant objects rather than branching JSX.
  - Restraint: reveals ≤ 600ms, `heroSequence` ≤ 2s total, standard easing, no
    overshoot. **All timing literals live here**, which is why
    `components/sections/*.tsx` may not contain any (Decision 22).
- **Acceptance criterion:**
  `cd site && npx eslint lib/motion.ts && npx tsc --noEmit --strict --jsx react-jsx --module esnext --moduleResolution bundler --esModuleInterop --skipLibCheck --target es2022 lib/motion.ts && for n in sectionReveal staggerChildren childRise drawLine revealClip revealClipStagger heroSequence useMotionSafe NO_MOTION; do grep -q "$n" lib/motion.ts || exit 1; done`

### Wave 1.2 — Content contract
> Its own wave because it imports `SectionMeta` from T1.1.2 (Decision 21). Single
> task, so a full build is safe here.

#### T1.2.1 — Freeze site content and its types
- **Status:** TODO
- **Description:** Author the typed content module holding **every on-page
  string** and the six `SectionMeta` objects. Seven downstream tasks are
  forbidden from hardcoding copy, so a missing export blocks them structurally.
- **Files owned:** `site/content/copy.ts`
- **Depends on:** T1.1.2
- **Model / thinking:** Judgment / extended (Opus)  **Executor:** drydock:executor
- **Context brief:** This plan §1, §6 (F1a, F3, F4, F11, F14), Decisions 3, 12–15,
  19, 20, and Q1. Read `site/lib/section.ts`, `drydock/README.md`,
  `docs/self-audit.md`, `docs/compatibility.md`,
  `drydock/skills/wavecheck/SKILL.md`, `drydock/.claude-plugin/plugin.json`.
- **Forbidden:** Reading root `index.html`. Inventing any metric, percentage,
  speed-up, or benchmark. Softening the not-yet-verified column or claiming A2b
  or A3 are verified. Altering the pinned literals below. Putting markup,
  markdown emphasis, angle brackets, or apostrophes inside any gated literal
  (F11). Writing JSX. Declaring a local `SectionMeta` instead of importing it.
- **Implementation sketch:** declare these types, then populate. Literals in
  **bold** are gated downstream and must appear exactly.
  - `import type { SectionMeta } from "@/lib/section"`
  - `interface Piece { name: string; kind: string; invocation: string; detail: string }`
  - `interface EvidenceRow { id: string; label: string; note: string }`
  - `interface TerminalLine { text: string; tone: "dim" | "pass" | "block" }`
  - `interface FaqItem { q: string; a: string }`
  - `export const meta: Record<"problem"|"evidence"|"terminal"|"lifecycle"|"install"|"faq", SectionMeta>`
    — **six** entries, lowercase keys exactly as written. No Hero entry
    (Decision 18).
  - `export const site` — `status` is a **string** containing **`internal pilot`**
    and **`field benchmarks pending`**; `version = "0.3.1"` (F14);
    `selfAuditHref = "../docs/self-audit.md"`; `title` and `description` for
    `layout.tsx`.
  - `export const hero` (Decision 20) — `headline = "Drydock"`;
    `thesis = "NOTHING SAILS UNTIL IT LEAVES THE DOCK"` (from
    `drydock/README.md`); `sub` = one sentence from the root README's
    description: plan-first parallel execution for Claude Code, where the plan is
    the source of truth, subagents execute it in parallel waves with disjoint
    file ownership, a conformance audit gates every wave, and a reconcile loop
    feeds what execution learned back into your docs;
    `waterlineLabel = "WATERLINE -- STATUS: `**`APPROVED (HUMAN-ONLY)`**`"`;
    `badges = ["CLAUDE CODE PLUGIN", "v0.3.1 -- INTERNAL PILOT", "FIELD BENCHMARKS: PENDING"]`.
  - `export const problem` — the collision-and-drift argument using the word
    **`drift`** (from `drydock/README.md`): two subagents editing the same file
    collide; worse, they drift — green tests, clean review, and a diff that
    quietly does things nobody asked for. Drifted code is often good code; it
    just is not the code the plan specified. **No emphasis markup** (F11).
  - `export const evidence: { verified: EvidenceRow[]; notVerified: EvidenceRow[] }`
    — exactly F4's rows; `notVerified` includes id **`A2b`**.
  - `export const terminal: { caption: string; lines: TerminalLine[] }` — caption
    states it illustrates the 2026-08-18 dry-run. Lines, verbatim, uniform
    31-column gutter, `--` not em-dashes, no angle brackets or apostrophes:
    ```
    1. plan integrity ............. PASS
    2. ownership audit ............ BLOCK
    3. forbidden audit ............ PASS
    4. acceptance audit ........... PASS
       test_greeting.py ........... 1 passed
       test_farewell.py ........... 1 passed
    5. deviation reconciliation ... BLOCK
    T1.1.2 report: files_changed [src/farewell.py, tests/test_farewell.py]
    git show T1.1.2: src/greeting.py -- owned by T1.1.1, unreported
    Wavecheck 1.1 -- BLOCK -- 2026-08-18
    Deviations logged: 1 (1 discovered by wavecheck)
    no retries -- route: /drydock:replan or human decision
    ```
    The gated literal is **`Deviations logged: 1 (1 discovered by wavecheck)`**.
  - `export const lifecycle: { pieces: Piece[] }` — exactly six from
    `drydock/README.md`'s table: **`planwright`**, `executor`,
    **`executor-isolated`**, **`wavecheck`**, **`replan`**, **`reconcile`**.
    `executor`'s `kind` is **`agents`** so it is distinguishable from
    `executor-isolated` by substring.
  - `export const install: { commands: string[] }` — exactly two, root-README
    form, `<org>` intact (Q1). Not asserted (F11).
  - `export const faq: FaqItem[]` — planner-authored (Decision 14), questions
    exactly: **`Is this overkill for a one-file change?`** (answer: yes, and then
    do not use it — Drydock earns its keep on multi-file, parallel, and team
    work; a single-wave plan is legitimate and inflating structure is an
    anti-pattern the planner refuses), `How is this different from other planning
    plugins?`, `Does it review code quality?`, `Can the model skip the gates?`,
    `Why the name?`.
- **Acceptance criterion:**
  `cd site && npm run build && npx tsc --noEmit && npm run lint && for s in "internal pilot" "field benchmarks pending" "A2b" "Deviations logged: 1 (1 discovered by wavecheck)" "drift" "one-file change" "APPROVED (HUMAN-ONLY)" "NOTHING SAILS UNTIL IT LEAVES THE DOCK" "agents" "planwright" "executor-isolated" "wavecheck" "replan" "reconcile" "notVerified" "selfAuditHref"; do grep -qF "$s" content/copy.ts || exit 1; done`

### Wave 1.3 — Shell and section registry
> Depends on all four contracts. Creates the stubs that make Phase 2 parallel
> (Decision 8). Single task, so a full build is safe.

#### T1.3.1 — Layout shell, page composition, and seven section stubs
- **Status:** TODO
- **Description:** Build the layout shell, the shared `Section` wrapper, and
  `page.tsx` composing the Hero plus six sections. Ship each as a stub so the
  page builds and each Phase-2 task replaces exactly one file.
- **Files owned:** `site/app/layout.tsx`, `site/app/page.tsx`,
  `site/components/Section.tsx`, `site/components/sections/Hero.tsx`,
  `site/components/sections/Problem.tsx`,
  `site/components/sections/Evidence.tsx`,
  `site/components/sections/Terminal.tsx`,
  `site/components/sections/Lifecycle.tsx`,
  `site/components/sections/Install.tsx`,
  `site/components/sections/Faq.tsx`
- **Depends on:** T1.1.1, T1.1.2, T1.1.3, T1.2.1
- **Model / thinking:** Judgment / extended (Opus)  **Executor:** drydock:executor
- **Context brief:** This plan §1, §6 (F5a, F11), Decisions 8, 18, 19, 20. Read
  `site/lib/section.ts`, `site/lib/motion.ts`, `site/lib/fonts.ts`,
  `site/content/copy.ts`, `site/app/globals.css`.
- **Forbidden:** Reading root `index.html`. Implementing any section's real
  content or animation — stubs stay stubs. **Authoring any user-visible copy**:
  headings, draft marks, and metadata all come from `content/copy.ts`
  (Decision 19). A stub's placeholder text must be the literal `TODO` and
  nothing else. Redefining tokens, variants, or the interface. Adding an eighth
  section. Wrapping `<Hero/>` in `<Section>`.
- **Implementation sketch:**
  - `layout.tsx`: apply the three font variables to `<html>`, import
    `globals.css`, set `metadata` from `site.title` / `site.description`, render
    the blueprint ground and the `site.status` banner.
  - `Section.tsx`: **`"use client"`** (it calls the `useMotionSafe` hook).
    Renders the draft-mark label, `<h2>` heading, and children inside the
    `sectionReveal` wrapper, with **`data-reveal` on the animated element**
    (F5a). Only implementation of scroll reveal; sections must not reimplement
    it.
  - `page.tsx`: `<Hero/>` unwrapped first (Decision 18), then Problem, Evidence,
    Terminal, Lifecycle, Install, FAQ, each passed `meta.<key>` from `copy.ts`.
    **Not owned by any Phase-2 task; must not change again.**
  - Each of the six section stubs: a typed `SectionComponent` rendering its own
    `<Section meta={meta}>` root containing `TODO`. Hero's stub renders a bare
    placeholder with no `Section` wrapper and no meta.
- **Acceptance criterion:**
  `cd site && npm run build && npx tsc --noEmit && npm run lint && grep -qF "internal pilot" out/index.html && grep -q "data-reveal" components/Section.tsx && ! grep -q "Section" components/sections/Hero.tsx`

### Wave 1.4 — Repair: copy inventory and CSS defects
> Added by human-authorised amendment (deviation 25) after T1.R.1 REJECTED.
> Two parallel tasks, disjoint files, neither depending on the other. Criteria are
> scoped per Decision 16 — no project build inside the wave.

#### T1.4.1 — Complete the copy inventory
- **Status:** TODO
- **Description:** Add the strings B1 found missing — the ones three Phase-2 tasks
  must render and are forbidden to author — plus the skip-link string from
  deviation 22 and the title-block strings Wave 1.5 needs. Additive only; no
  existing literal changes.
- **Files owned:** `site/content/copy.ts`
- **Depends on:** T1.R.1
- **Model / thinking:** Standard / default (Sonnet)  **Executor:** drydock:executor
- **Context brief:** T1.R.1's B1 finding and deviation 22 in the Progress log;
  §6 F1a, F11; Decisions 19, 20, 23, 24. Read the existing `site/content/copy.ts`.
- **Forbidden:** Reading root `index.html`. **Changing or removing any existing
  export or literal** — this is purely additive, and downstream tasks already
  build against the current shapes. Apostrophes, em-dashes, markup, or angle
  brackets inside any new literal (F11). Inventing metrics. Writing JSX.
- **Implementation sketch:** add, without disturbing what exists —
  - `evidence.verifiedHeading` / `evidence.notVerifiedHeading` — the two column
    labels §1's "two-column board" requires (`verified`/`notVerified` are keys,
    not labels).
  - `site.selfAuditLinkText` — visible text for the `selfAuditHref` link.
  - `hero.svgAriaLabel` — describes a hull in a cradle with an approved
    waterline; `hero.draftMarks: string[]` — the bow draft-mark labels;
    `hero.keelLabels: string[]` — the wave labels under the keel.
  - `install.copyLabel`, `install.copyAriaLabel`, `install.copiedLabel` — the
    button, its accessible name, and the `aria-live` confirmation.
  - `site.skipLinkText` — e.g. `Skip to content` (deviation 22).
  - `sheet` — the title-block fields Wave 1.5 renders: project name, sheet title,
    sheet number, revision, scale, date. Naval-drawing register, `--` not
    em-dashes.
- **Acceptance criterion:**
  *(typecheck clause corrected to F12a per deviation 27 — the original per-file
  form cannot resolve this file's `@/lib/section` import. The task passes under
  the corrected form; nothing about the work changed.)*
  `cd site && npx eslint content/copy.ts && printf '{"extends":"'"$PWD"'/tsconfig.json","include":[],"files":["'"$PWD"'/content/copy.ts"]}' > /tmp/dd-tc-copy.json && npx tsc --noEmit --project /tmp/dd-tc-copy.json && for s in verifiedHeading notVerifiedHeading selfAuditLinkText svgAriaLabel draftMarks keelLabels copyLabel copyAriaLabel copiedLabel skipLinkText sheet; do grep -q "$s" content/copy.ts || exit 1; done && grep -qF "internal pilot" content/copy.ts && [ "$(grep -c "'" content/copy.ts)" -eq 0 ]`

#### T1.4.2 — SVG reduced-motion restore and grid legibility
- **Status:** TODO
- **Description:** Close B3 — the `[data-reveal]` restore omits the SVG stroke
  channels, so any `pathLength` element is an invisible zero-length dash under
  reduced motion. Also raise the blueprint grid above the threshold of perception
  and widen its pitch (verdict D).
- **Files owned:** `site/app/globals.css`
- **Depends on:** T1.R.1
- **Model / thinking:** Complex / extended (Sonnet)  **Executor:** drydock:executor
- **Context brief:** T1.R.1's B3 finding and verdict D in the Progress log;
  §6 F5a, F6; deviations 12, 14, 21.
- **Forbidden:** Reading root `index.html`. Renaming or removing any of the nine
  contract tokens — five tasks build against those names. Introducing a second
  accent colour. Touching `layout.tsx`, `Section.tsx`, or `lib/`.
- **Implementation sketch:**
  - Extend the existing `[data-reveal]` block inside
    `@media (prefers-reduced-motion: reduce)` with
    `stroke-dasharray: none !important; stroke-dashoffset: 0 !important;`.
    Rationale, measured not assumed: Framer's `pathLength:0` emits
    `stroke-dasharray="0 1"`, which computes to `0px, 1px` — the hull and the
    `APPROVED (HUMAN-ONLY)` waterline would be invisible, permanently so for a
    no-JS visitor since `useMotionSafe` only reaches `NO_MOTION` after hydration.
  - Grid: `--color-line` is 1.73:1 against `--color-dock`, and the grid draws it
    through `color-mix` at 55% and 18%, giving 1.30:1 and 1.07:1. Raise both
    alphas so the major rule is clearly visible and the minor rule is perceptible
    but quiet, and widen the 8px minor pitch so it reads as a drafting grid rather
    than moiré. Judge it as an engineering drawing; state the final ratios in
    your report.
- **Acceptance criterion:**
  `cd site && grep -q "stroke-dasharray" app/globals.css && grep -q "stroke-dashoffset" app/globals.css && awk '/prefers-reduced-motion/,/^}/' app/globals.css | grep -q "stroke-dasharray" && for t in --color-dock --color-panel --color-line --color-ink --color-ink-dim --color-primer --font-display --font-mono --font-body; do grep -q -- "$t:" app/globals.css || exit 1; done`

### Wave 1.5 — Repair: drawing furniture and skip link
> Sits behind Wave 1.4 rather than beside it, because it renders title-block
> strings that T1.4.1 creates. Putting it in the same wave would repeat the
> sideways-dependency defect the pressure tests caught twice (C4, C-1).

#### T1.5.1 — Sheet frame, title block, and skip link
- **Status:** TODO
- **Description:** Give the shell the furniture that makes a drawing read as a
  drawing — sheet frame, title block, revision/scale block, sheet numbering,
  footer — and wire the skip link. Closes verdict D's shell finding and
  deviation 22.
- **Files owned:** `site/app/layout.tsx`, `site/components/Section.tsx`
- **Depends on:** T1.4.1, T1.4.2
- **Model / thinking:** Judgment / extended (Opus)  **Executor:** drydock:executor
- **Context brief:** T1.R.1's verdict D and N1 in the Progress log; §1; Decisions
  8, 18, 19, 23, 24; deviations 22, 23. Read `site/content/copy.ts`,
  `site/lib/section.ts`, `site/lib/motion.ts`, `site/app/globals.css`.
- **Forbidden:** Reading root `index.html`. Authoring any user-visible copy — all
  strings come from `content/copy.ts`. Changing the composition contract in
  deviation 23 (default exports; `Section` owns the `<section>`/id/`data-reveal`/
  container/draft-mark/`<h2>`; reveal config set once; `<main>` in `layout.tsx`).
  Touching `page.tsx` or any file under `components/sections/`. Using
  `useEffect` + `setState`. Adding an `<h1>` — that belongs to Hero
  (Decision 24).
- **Implementation sketch:**
  - `layout.tsx`: wrap the page in a sheet frame (a bordered drawing sheet), and
    render a title block from `sheet` — project, sheet title, sheet number,
    revision, scale, date — in the register of a real drawing's corner block.
    Add the skip link as the first focusable element, using `site.skipLinkText`,
    targeting the `<main>` it already owns.
  - `Section.tsx`: **fix N1** — `{children}` currently follows the `<h2>` with no
    spacing contract, so six parallel executors would each invent the gap. Pin
    one wrapper and one spacing class here, and note it in your report so it can
    be carried into the six section briefs. Optionally give each section a sheet
    number from its `meta`, consistent with the draft-mark idiom.
- **Acceptance criterion:**
  `cd site && npm run build && npx tsc --noEmit && npm run lint && grep -qiF "skip" out/index.html && grep -qF "internal pilot" out/index.html && grep -q "data-reveal" components/Section.tsx && [ "$(grep -o "<h1" out/index.html | wc -l | tr -d ' ')" -eq 0 ]`

### Wave 1.6 — Repair: attribute split, delayed clip variant, focus target
> Added by human-authorised amendment (deviation 36) after T1.R.1's SECOND
> REJECTED verdict. Two parallel tasks, disjoint files. Closes B5 and N15; B2 and
> B4 were closed by orchestrator edits to the briefs and criteria, not by code.

#### T1.6.1 — Split the reveal attribute and add the delayed clip variant
- **Status:** TODO
- **Description:** Close B5 by splitting the reduced-motion restore so a dashed
  stroke keeps its dash pattern, and give the hero timeline a delayed clip variant
  so the dashed waterline can be revealed without `pathLength` and without a
  hand-written delay.
- **Files owned:** `site/app/globals.css`, `site/lib/motion.ts`
- **Depends on:** T1.R.1 (re-run)
- **Model / thinking:** Complex / extended (Sonnet)  **Executor:** drydock:executor
- **Context brief:** T1.R.1's B5 finding in the Progress log; §6 F5, F5a;
  Decisions 23, 25, 26; deviation 17. Read both owned files.
- **Forbidden:** Reading root `index.html`. Renaming or removing any of the nine
  contract tokens, or any of the nine `lib/motion.ts` exports — nine files build
  against those names. Weakening the reduced-motion guarantee for
  `pathLength`-animated elements. Touching `layout.tsx`, `components/`, or
  `content/`.
- **Implementation sketch:**
  - `globals.css`: `[data-reveal]` keeps `opacity`, `transform`, `clip-path`,
    `width`. **Move** `stroke-dasharray: none !important` and
    `stroke-dashoffset: 0 !important` to a new `[data-reveal-path]` rule in the
    same media query. Both selectors live side by side; nothing else changes.
    Rationale, measured: an unqualified `[data-reveal]` strips the author dash
    from Decision 23's overlay, rendering §1's dashed waterline solid under
    reduced motion.
  - `lib/motion.ts`: add **`waterlineReveal`** — a clip/width reveal
    (`CLIP_HIDDEN` → `CLIP_SHOWN`) carrying the hero's beat-3 delay of 1.0s, in
    the same style as the existing variants and using the existing `t()` helper
    and constants. Keep `"hidden"`/`"shown"` as the state names (deviation 13 —
    any other name fails silently). Document in the file header which attribute
    each variant requires: `pathLength` variants → `data-reveal-path`,
    clip/opacity variants → `data-reveal`.
- **Acceptance criterion:**
  `cd site && npx eslint lib/motion.ts && printf '{"extends":"'"$PWD"'/tsconfig.json","include":[],"files":["'"$PWD"'/lib/motion.ts"]}' > /tmp/dd-tc-m.json && npx tsc --noEmit --project /tmp/dd-tc-m.json && grep -q "waterlineReveal" lib/motion.ts && for n in sectionReveal staggerChildren childRise drawLine revealClip revealClipStagger heroSequence useMotionSafe NO_MOTION; do grep -q "$n" lib/motion.ts || exit 1; done && grep -q "data-reveal-path" app/globals.css && awk '/prefers-reduced-motion/,/^}$/' app/globals.css | grep -A6 "data-reveal-path" | grep -q "stroke-dasharray" && ! awk '/\[data-reveal\]/,/}/' app/globals.css | grep -q "stroke-dasharray"`

#### T1.6.2 — Make the skip-link target focusable
- **Status:** TODO
- **Description:** Close N15 — the skip link targets `<main id="content">`, but a
  non-interactive element needs `tabIndex={-1}` or focus does not move to it in
  several browsers, which makes the skip link decorative.
- **Files owned:** `site/app/layout.tsx`
- **Depends on:** T1.R.1 (re-run)
- **Model / thinking:** Mechanical / off (Haiku)  **Executor:** drydock:executor
- **Context brief:** T1.R.1's N15 finding; deviation 29. Read
  `site/app/layout.tsx` only.
- **Forbidden:** Reading root `index.html`. Authoring any user-visible copy.
  Changing anything other than adding the focus affordance. Adding an `<h1>`
  (Decision 24 — that is Hero's). Touching `Section.tsx` or `page.tsx`.
- **Acceptance criterion:**
  `cd site && npm run build && npx tsc --noEmit && npm run lint && grep -qiF "skip" out/index.html && grep -E 'id="content"[^>]*tabindex="-1"|tabindex="-1"[^>]*id="content"' out/index.html`

### Wave 1.R — Quality review

#### T1.R.1 — Fresh-context quality review of Phase 1
- **Status:** TODO
- **Description:** Review the Phase 1 diff for correctness, convention
  consistency, and scope creep, and judge whether the frozen contracts are
  sufficient to build seven parallel sections against.
- **Files owned:** `docs/plans/001-drydock-homepage.md` (Progress log only)
- **Depends on:** T1.3.1 and wavecheck PASS on 1.0, 1.1, 1.2, 1.3
- **Model / thinking:** Judgment / extended (Opus)  **Executor:** drydock:executor
- **Context brief:** the Phase 1 diff, this plan, §7.
- **Forbidden:** Editing any file under `site/`. Re-litigating §7 decisions.
- **Acceptance criterion:** Verdict `APPROVED` or `REJECTED` with specific
  findings appended to the Progress log, committed as
  `drydock(T1.R.1): fresh-context quality review of Phase 1`.

---

## Phase 2: Sections and conformance

**Exit state:** All seven sections render real content with restrained
animation; `npm run verify` passes; reduced motion yields a still, complete,
visible page.

**Phase gate:** `cd site && npm run verify` exits 0; wavecheck PASS on 2.0, 2.1,
2.2, 2.3, 2.4; T2.R.1 APPROVED; **human browser confirmation**; human approval.

### Wave 2.0 — Contracts: the export gate
> Single task. Freezes the executable definition of "done" for all seven sections
> before any is built, and provides the `verify` script that Wave 2.3 and the
> phase gate depend on.

#### T2.0.1 — Assertion harness and `verify` gate
- **Status:** TODO
- **Description:** Write the dependency-free Node script that normalises the
  export, asserts every required literal, rejects over-claim patterns, and
  enforces the motion contract over the section files; wire it into
  `npm run verify`.
- **Files owned:** `site/scripts/assert-copy.mjs`, `site/package.json`
- **Depends on:** T1.3.1
- **Model / thinking:** Judgment / extended (Opus)  **Executor:** drydock:executor
- **Context brief:** This plan §1, §6 (F4, F5, F5a, F11), Decisions 9, 13–15, 20,
  22, **24, 25**, and deviations **18, 20**. Read `site/content/copy.ts`,
  `site/lib/motion.ts`.
  *(Decision 24 added after T1.R.1's second REJECTED verdict — it claimed this
  harness asserted the `<h1>` and no such assertion existed. Deviation 34.)*
- **Forbidden:** Reading root `index.html`. Modifying any component to make an
  assertion pass — a failing assertion is a finding, reported as a deviation.
  Adding a test runner. Asserting on any string containing `<`, `>`, or an
  apostrophe (F11). Changing the `lint` script (T1.0.1 owns its content).
- **Implementation sketch:**
  - Takes an optional file-path argument, defaulting to `out/index.html`, so it
    is testable against fixtures.
  - **Normalise before matching** (F11): strip `<!--…-->`, strip all tags,
    collapse whitespace, then decode entities.
  - Required literals: `APPROVED (HUMAN-ONLY)`, `internal pilot`,
    `field benchmarks pending`, `Deviations logged: 1 (1 discovered by wavecheck)`,
    `A2b`, `drift`, `one-file change`,
    `NOTHING SAILS UNTIL IT LEAVES THE DOCK`, and the six pieces — matching
    `executor` via its `agents` kind cell, not bare substring.
  - **Heading assertions (Decision 24).** On the RAW input, before normalisation:
    exactly ONE `<h1>` must exist, and it must contain `hero.headline`. Zero or
    two `<h1>` elements both fail. This is a structural count on markup, not a
    text-literal match, so F11's ban on asserting strings containing `<` does not
    apply — that ban exists because React splits and escapes *text*, which does
    not affect tag counting.
  - **Counting must ignore the RSC flight payload (deviation 20).** `out/index.html`
    embeds the hydration payload as escaped JSON, so every rendered string appears
    **twice** — measured exactly 2× (`TODO` 14 raw / 7 real for 7 stubs). Strip
    `<script>…</script>` **bodies** first; stripping tags alone does not remove
    them. Normalisation order: strip script bodies → strip comments → strip tags →
    collapse whitespace → decode entities. Without this, every counting assertion
    passes vacuously off the payload — including the `<h1>` count above and the
    `executor` discriminator below.
  - **`executor` vs `executor-isolated` (deviation 18).** Both carry
    `kind: "agents"`, so `agents` proves an agent-kind row exists, not that
    `executor` specifically does. Require **≥ 2 occurrences of `executor`** in the
    normalised text (one bare, one inside `executor-isolated`), which only works
    once the flight payload is stripped.
  - Over-claim blocklist: `/\d+\s*%\s*(faster|fewer|more)/i`,
    `/\d+(\.\d+)?\s*x\s*(faster|speedup)/i`.
  - Motion-contract assertions over **exactly `components/sections/*.tsx`**
    (never `lib/`, which legitimately holds timings): any file importing
    `motion/react` must also import `useMotionSafe`; no file may match
    `/(duration|delay):|duration-[0-9]/`; every file importing `motion/react`
    must contain `data-reveal` (F5a).
  - Exit 1 with a per-assertion report naming what was missing or forbidden.
  - Adds `"verify": "next build && tsc --noEmit && eslint . && node scripts/assert-copy.mjs"`.
- **Acceptance criterion** — a two-fixture self-test, so a script that asserts
  nothing fails:
  `cd site && npx eslint scripts/assert-copy.mjs && node --check scripts/assert-copy.mjs && printf '%s' "<h1>Drydock</h1> APPROVED (HUMAN-ONLY) internal pilot field benchmarks pending Deviations logged: 1 (1 discovered by wavecheck) A2b drift one-file change NOTHING SAILS UNTIL IT LEAVES THE DOCK agents planwright executor executor-isolated wavecheck replan reconcile" > /tmp/dd-ok.txt && printf '%s' "internal pilot" > /tmp/dd-bad.txt && node scripts/assert-copy.mjs /tmp/dd-ok.txt && ! node scripts/assert-copy.mjs /tmp/dd-bad.txt && node -e "process.exit(require('./package.json').scripts.verify?0:1)"`
  *(The good fixture now carries an `<h1>` and both `executor` spellings so the
  heading assertion and the ≥2 `executor` discriminator are themselves exercised;
  the bad fixture omits everything, so a harness that asserts nothing fails.)*

### Wave 2.1 — Signature and structural sections
> Four parallel tasks. Criteria scoped to owned files (Decision 16) with hermetic
> per-file typecheck (F12); no task runs a project build.

#### T2.1.1 — Hero: hull-in-cradle SVG with orchestrated load sequence
- **Status:** TODO
- **Description:** Replace the Hero stub with the signature element: a blueprint
  SVG of a hull resting in a dry-dock cradle with draft marks, and a waterline
  that draws in as a dashed orange line carrying the approved-waterline label,
  as one orchestrated sequence of at most 2s.
- **Files owned:** `site/components/sections/Hero.tsx`
- **Depends on:** T1.3.1, T2.0.1
- **Model / thinking:** Complex / extended (Sonnet)  **Executor:** drydock:executor
- **Context brief:** This plan §1, §6 (F5, F5a, F12), Decisions 5, 9, 18, 20, 22,
  **23, 24, 25, 26**, 17, §10 Checkpointing, and deviations **31, 32**. Read
  `site/lib/motion.ts`, `site/content/copy.ts`, `site/app/globals.css`.
  *(Decisions 23–26 added after T1.R.1's second REJECTED verdict: they were
  recorded in §7 and never propagated here, which is deviation 34.)*
- **Forbidden:** Reading or copying root `index.html` — draw the SVG fresh.
  **Hardcoding any copy — every string comes from `hero` in `content/copy.ts`.**
  Touching `page.tsx`, `Section.tsx`, or any other section. A second accent
  colour. Raster or externally-hosted images. Any timing literal (Decision 22).
  Wrapping itself in `<Section>` (Decision 18).
- **Implementation sketch:**
  - `"use client"`. One `<svg viewBox>`, `role="img"`, `aria-label` describing a
    hull in a cradle with an approved waterline. Geometry as `<path>` / `<line>`
    in token colours.
  - Structure: dock floor, cradle blocks under the keel, hull outline,
    superstructure, bow draft marks, wave labels under the keel.
  - Sequence via `heroSequence`: linework fades → hull draws (`drawLine`,
    `pathLength` 0→1 — correct here, the hull is SOLID) → waterline → label fades.
  - **TRAP — the contract contains two waterline variants and only one is correct
    (deviation 37).** `heroSequence.waterline` still animates `pathLength` and was
    forbidden from being removed, so it survives as a footgun: using it reproduces
    B2 (solid instead of dashed) and B5 (dash stripped under reduced motion) exactly.
    Use `heroSequence.linework`, `heroSequence.hull`, and `heroSequence.label` for
    beats 1, 2 and 4 — **but NOT `heroSequence.waterline`.** Beat 3 is
    `waterlineReveal`. The criterion asserts `heroSequence.waterline` is absent.
  - **The waterline is TWO elements, not one (Decision 23).** `pathLength` is
    implemented by overwriting `stroke-dasharray`, so a dashed line cannot also be
    drawn on with `drawLine` — the finished state would be solid. Instead: a
    dashed overlay `<path>` with an author `stroke-dasharray`, revealed
    left-to-right by **`waterlineReveal`** (Decision 26 — a clip/width variant
    carrying the 1.0s beat-3 delay). Do **not** use `drawLine` or `pathLength` on
    the waterline, and do not hand-write a delay.
  - **Attribute discipline (Decision 25).** Elements animated by `pathLength`
    (the hull) carry **`data-reveal-path`**; elements animated by clip/opacity
    (the dashed overlay, the label, the linework) carry **`data-reveal`** only.
    Putting `data-reveal-path` on the dashed overlay would strip its dash pattern
    under reduced motion, which is exactly the defect B5 found.
  - **Hero renders `hero.headline` as the page's single `<h1>` (Decision 24).**
    It is the only `<h1>` in the document; every section heading is an `<h2>`
    owned by the shell.
  - `hero.waterlineLabel` renders as a real `<text>` node (F5); animation touches
    only opacity.
  - **The trim border means nothing can bleed to the viewport edge** (deviation
    32): `<body>` carries `p-2 sm:p-4` and the page sits inside a
    `border border-line` sheet. Do not use `min-h-screen` or full-bleed
    backgrounds — they overflow the sheet margin (N11).
  - **Do not add a top margin to your root** — the shell owns the gap via
    `<div className="mt-8">` (deviation 31/N1). Use `space-y-6` for rhythm
    between your own sibling blocks.
- **Acceptance criterion:**
  `cd site && npx eslint components/sections/Hero.tsx && printf '{"extends":"'"$PWD"'/tsconfig.json","include":[],"files":["'"$PWD"'/components/sections/Hero.tsx"]}' > /tmp/dd-tc-Hero.json && npx tsc --noEmit --project /tmp/dd-tc-Hero.json && grep -q "hero" components/sections/Hero.tsx && grep -q "heroSequence" components/sections/Hero.tsx && grep -q "waterlineReveal" components/sections/Hero.tsx && grep -q "data-reveal" components/sections/Hero.tsx && grep -q "<h1" components/sections/Hero.tsx && ! grep -q "drawLine.*waterline\|waterline.*drawLine" components/sections/Hero.tsx && ! grep -qF "heroSequence.waterline" components/sections/Hero.tsx && ! grep -qE "(duration|delay):|duration-[0-9]" components/sections/Hero.tsx`
  *(Added after T1.R.1's second verdict: `waterlineReveal` and `<h1>` are now
  asserted, and `drawLine` is barred from co-occurring with the waterline —
  Decisions 23, 24, 26. `drawLine` alone is still permitted, because the hull
  legitimately uses it.)*

#### T2.1.2 — Evidence: verified vs not-yet-verified board
- **Status:** TODO
- **Description:** Replace the Evidence stub with the two-column honesty board
  rendered from `content/copy.ts`, plus the self-audit link.
- **Files owned:** `site/components/sections/Evidence.tsx`
- **Depends on:** T1.3.1, T2.0.1
- **Model / thinking:** Standard / default (Sonnet)  **Executor:** drydock:executor
- **Context brief:** This plan §6 (F4, F5a, F12), Decisions 3, 12, 18, 22, 17,
  §10 Checkpointing. Read `site/lib/section.ts`, `site/lib/motion.ts`,
  `site/content/copy.ts`.
- **Forbidden:** Reading root `index.html`. Hardcoding any copy. Inventing
  metrics. Any timing literal. Touching other sections.
- **Acceptance criterion:**
  `cd site && npx eslint components/sections/Evidence.tsx && printf '{"extends":"'"$PWD"'/tsconfig.json","include":[],"files":["'"$PWD"'/components/sections/Evidence.tsx"]}' > /tmp/dd-tc-Evidence.json && npx tsc --noEmit --project /tmp/dd-tc-Evidence.json && grep -q "notVerified" components/sections/Evidence.tsx && grep -q "selfAuditHref" components/sections/Evidence.tsx && ! grep -qE "(duration|delay):|duration-[0-9]" components/sections/Evidence.tsx`

#### T2.1.3 — Lifecycle: the six pieces as an interactive ladder
- **Status:** TODO
- **Description:** Replace the Lifecycle stub with a keyboard-accessible
  interactive ladder of the six pieces where selecting a rung reveals its detail.
- **Files owned:** `site/components/sections/Lifecycle.tsx`
- **Depends on:** T1.3.1, T2.0.1
- **Model / thinking:** Complex / extended (Sonnet)  **Executor:** drydock:executor
- **Context brief:** This plan §1, §6 (F3, F5, F5a, F12), Decisions 18, 22, 17,
  §10 Checkpointing. Read `site/lib/section.ts`, `site/lib/motion.ts`,
  `site/content/copy.ts`.
- **Forbidden:** Reading root `index.html`. Hardcoding piece copy. Any timing
  literal. Touching other sections. Mouse-only interaction — rungs must be
  focusable, keyboard-operable, and carry `aria-expanded`. Removing detail text
  from the markup when collapsed (F5).
- **Implementation sketch:**
  - `"use client"`. All six rungs' detail text server-rendered; interaction
    toggles visibility only, so copy is in the export in any state.
  - Selected rung marked with the primer accent on the ladder rail.
  - Reduced motion: instant state change, no height animation. `data-reveal` on
    animated elements.
- **Acceptance criterion:**
  `cd site && npx eslint components/sections/Lifecycle.tsx && printf '{"extends":"'"$PWD"'/tsconfig.json","include":[],"files":["'"$PWD"'/components/sections/Lifecycle.tsx"]}' > /tmp/dd-tc-Lifecycle.json && npx tsc --noEmit --project /tmp/dd-tc-Lifecycle.json && grep -q "lifecycle" components/sections/Lifecycle.tsx && grep -q "aria-expanded" components/sections/Lifecycle.tsx && ! grep -qE "(duration|delay):|duration-[0-9]" components/sections/Lifecycle.tsx`

#### T2.1.4 — Problem: the two failure modes
- **Status:** TODO
- **Description:** Replace the Problem stub with the collision-and-drift argument
  rendered from content, relying on the shell's scroll reveal.
- **Files owned:** `site/components/sections/Problem.tsx`
- **Depends on:** T1.3.1, T2.0.1
- **Model / thinking:** Standard / default (Sonnet)  **Executor:** drydock:executor
- **Context brief:** This plan §1, §6 (F11, F12), Decisions 15, 18, 22, 17,
  §10 Checkpointing. Read `site/lib/section.ts`, `site/content/copy.ts`.
- **Forbidden:** Reading root `index.html`. Hardcoding copy. **Wrapping any part
  of the pinned prose in markup** — no `<em>`/`<strong>` inside a gated literal
  (F11). Reimplementing scroll reveal. Any timing literal. Touching other
  sections.
- **Acceptance criterion:**
  `cd site && npx eslint components/sections/Problem.tsx && printf '{"extends":"'"$PWD"'/tsconfig.json","include":[],"files":["'"$PWD"'/components/sections/Problem.tsx"]}' > /tmp/dd-tc-Problem.json && npx tsc --noEmit --project /tmp/dd-tc-Problem.json && grep -q "problem" components/sections/Problem.tsx && ! grep -qE "(duration|delay):|duration-[0-9]" components/sections/Problem.tsx`

### Wave 2.2 — Terminal, install, and questions
> Three parallel tasks, same scoping rules as Wave 2.1.

#### T2.2.1 — Terminal: green tests, blocked wave
- **Status:** TODO
- **Description:** Replace the Terminal stub with the wavecheck transcript from
  `content/copy.ts`, where the verdict lines are revealed sequentially by a
  typing effect over server-rendered text.
- **Files owned:** `site/components/sections/Terminal.tsx`
- **Depends on:** T1.3.1, T2.0.1
- **Model / thinking:** Complex / extended (Sonnet)  **Executor:** drydock:executor
- **Context brief:** This plan §6 (F5, F5a, F11, F12), Decisions 9, 13, 18, 22,
  17, §10 Checkpointing. Read `site/lib/section.ts`, `site/lib/motion.ts`,
  `site/content/copy.ts`.
- **Forbidden:** Reading root `index.html`. **Constructing the typed text in JS —
  the strings must exist in the markup and be revealed by animating clip or width
  only** (Decision 9). Inventing or editing transcript lines; they are pinned in
  `copy.ts`. Presenting the transcript as a captured live session rather than the
  illustration its caption states. Wrapping any transcript line in markup that
  splits it (F11). Any timing literal — use `revealClipStagger(i)` for cadence
  (Decision 22). Touching other sections.
- **Implementation sketch:**
  - `"use client"`. Lines from `terminal.lines`, coloured by `tone` — `pass`
    calm, `block` primer, `dim` muted. Render in a `<pre>` so the 31-column
    gutter survives.
  - Sequential reveal: each line's container animates `clip-path`/`width` 0→100%
    via `revealClipStagger(i)` on scroll into view. `data-reveal` on each.
  - Reduced motion: all lines fully visible immediately.
- **Acceptance criterion:**
  `cd site && npx eslint components/sections/Terminal.tsx && printf '{"extends":"'"$PWD"'/tsconfig.json","include":[],"files":["'"$PWD"'/components/sections/Terminal.tsx"]}' > /tmp/dd-tc-Terminal.json && npx tsc --noEmit --project /tmp/dd-tc-Terminal.json && grep -q "revealClipStagger" components/sections/Terminal.tsx && grep -q "terminal" components/sections/Terminal.tsx && grep -q "data-reveal" components/sections/Terminal.tsx && ! grep -qE "(duration|delay):|duration-[0-9]" components/sections/Terminal.tsx`

#### T2.2.2 — Install: two commands with copy buttons
- **Status:** TODO
- **Description:** Replace the Install stub with the two install commands from
  content, each with a working copy-to-clipboard button and an accessible
  confirmation state.
- **Files owned:** `site/components/sections/Install.tsx`
- **Depends on:** T1.3.1, T2.0.1
- **Model / thinking:** Standard / default (Sonnet)  **Executor:** drydock:executor
- **Context brief:** This plan §1, §6 (F12), Q1, Decisions 18, 22, 17,
  §10 Checkpointing. Read `site/lib/section.ts`, `site/lib/motion.ts`,
  `site/content/copy.ts`.
- **Forbidden:** Reading root `index.html`. Hardcoding the commands — they come
  from `install.commands`. Resolving the `<org>` placeholder (Q1 open). Adding a
  third command. Any timing literal. Touching other sections.
- **Implementation sketch:**
  - `"use client"`. `navigator.clipboard.writeText` with a guarded fallback;
    button carries an `aria-label` and announces copied state via `aria-live`,
    not colour alone.
  - Commands render as real text so they are selectable and greppable without JS.
- **Acceptance criterion:**
  `cd site && npx eslint components/sections/Install.tsx && printf '{"extends":"'"$PWD"'/tsconfig.json","include":[],"files":["'"$PWD"'/components/sections/Install.tsx"]}' > /tmp/dd-tc-Install.json && npx tsc --noEmit --project /tmp/dd-tc-Install.json && grep -q "install" components/sections/Install.tsx && grep -q "aria-live" components/sections/Install.tsx && ! grep -qE "(duration|delay):|duration-[0-9]" components/sections/Install.tsx`

#### T2.2.3 — FAQ: asked and answered
- **Status:** TODO
- **Description:** Replace the FAQ stub with the pinned question-and-answer list
  as a semantic definition list, all answers present in the export.
- **Files owned:** `site/components/sections/Faq.tsx`
- **Depends on:** T1.3.1, T2.0.1
- **Model / thinking:** Standard / default (Sonnet)  **Executor:** drydock:executor
- **Context brief:** This plan §1, §6 (F5, F11, F12), Decisions 14, 18, 22, 17,
  §10 Checkpointing. Read `site/lib/section.ts`, `site/content/copy.ts`.
- **Forbidden:** Reading root `index.html`. Hardcoding copy. Over-claiming.
  JS-only disclosure that removes answers from the export (F5). Splitting a gated
  literal with markup (F11). Any timing literal. Touching other sections.
- **Acceptance criterion:**
  `cd site && npx eslint components/sections/Faq.tsx && printf '{"extends":"'"$PWD"'/tsconfig.json","include":[],"files":["'"$PWD"'/components/sections/Faq.tsx"]}' > /tmp/dd-tc-Faq.json && npx tsc --noEmit --project /tmp/dd-tc-Faq.json && grep -q "faq" components/sections/Faq.tsx && grep -qE "<dl|<dt|<dd" components/sections/Faq.tsx && ! grep -qE "(duration|delay):|duration-[0-9]" components/sections/Faq.tsx`

### Wave 2.3 — Repair: no-JS visibility
> Added by human-authorised amendment (deviation 44) after wavecheck 2.1 found
> that the page renders blank without JavaScript. Placed BEFORE integration so
> T2.3.1 verifies the final tree rather than an intermediate one.

#### T2.3.2 — Restore revealed content for visitors without JavaScript
- **Status:** TODO
- **Description:** Add a `<noscript>` style block that force-restores every
  revealed element, mirroring the reduced-motion rule and preserving the split
  between clip-revealed and path-drawn strokes.
- **Files owned:** `site/app/layout.tsx`
- **Depends on:** T2.2.1, T2.2.2, T2.2.3
- **Model / thinking:** Complex / extended (Sonnet)  **Executor:** drydock:executor
- **Context brief:** deviation 41 in the Deviation Log; §6 F5, F5a; Decision 25.
  Read `site/app/layout.tsx` and the `@media (prefers-reduced-motion: reduce)`
  block in `site/app/globals.css` — the noscript rule must mirror its structure.
- **Forbidden:** Reading root `index.html`. Authoring any user-visible copy.
  Touching `globals.css`, `components/`, `content/`, or `page.tsx`. Adding an
  `<h1>` (Hero owns the only one). Changing the sheet frame, title block, skip
  link, or `<main tabIndex={-1}>`. **Blanket-restoring `stroke-dasharray` on
  `[data-reveal]`** — that is precisely the B5 defect, and it would render the
  dashed waterline solid.
- **Implementation sketch:**
  - Measured problem: the export carries **24 elements with inline `opacity:0`,
    23 of them `data-reveal`**, and no `<noscript>` fallback. With JS the reveal
    animates; under reduced motion the CSS restore fires; **with JS off and
    motion not reduced, nothing restores them** — including the `<h1>`, whose
    text `Drydock` is present in markup but invisible.
  - CSS cannot detect absent JS, so `<noscript><style>…</style></noscript>` in
    `layout.tsx` is the mechanism. Server-rendered, so it lands in the export.
  - **Mirror the split exactly (Decision 25):**
    `[data-reveal],[data-reveal-path]` restore `opacity`, `transform`,
    `clip-path`, `width`; **only** `[data-reveal-path]` additionally restores
    `stroke-dasharray` and `stroke-dashoffset`. Blanketing the stroke properties
    across both would strip the dashed waterline's pattern — the exact defect
    B5 identified and Wave 1.6 fixed.
  - Keep it to one `<noscript>`; no new dependencies; no JS.
- **Acceptance criterion:**
  `cd site && npm run verify && grep -q "<noscript>" out/index.html && node -e "const s=require('fs').readFileSync('app/layout.tsx','utf8');const i=s.indexOf('noscript');if(i<0)process.exit(1);const b=s.slice(i,i+900);process.exit(b.includes('data-reveal')&&b.includes('data-reveal-path')&&b.includes('opacity')?0:1)"`

### Wave 2.4 — Integration
> Single task. Verifies the assembled site after the no-JS repair. Task id
> `T2.3.1` is preserved per the format contract (ids never change once assigned);
> only its wave assignment moved, logged as deviation 44.

#### T2.3.1 — Integration verification of the assembled site
- **Status:** TODO
- **Description:** Run the full gate against the assembled site and record the
  result. This task fixes nothing; it establishes whether seven independently
  built sections satisfy the frozen export contract.
- **Files owned:** `docs/plans/001-drydock-homepage.md` (Progress log only)
- **Depends on:** T2.1.1–T2.1.4, T2.2.1–T2.2.3, **T2.3.2**
- **Model / thinking:** Mechanical / off (Haiku)  **Executor:** drydock:executor
- **Context brief:** This plan §10 (escalation, `T2.3.2+` policy).
- **Forbidden:** Editing anything under `site/`. Fixing a failing assertion — a
  failure is a deviation to record and route per §10, not a file to patch.
- **Acceptance criterion:** `cd site && npm run verify`

### Wave 2.5 — Repair: reduced-motion regressions
> Added by human-authorised amendment (deviation 48) after T2.R.1 REJECTED.
> Three parallel tasks, disjoint files, source-level criteria only — no builds
> inside the wave (Decision 16). Wave 2.6 measures the result in a browser,
> because every finding here is invisible to source text and to `npm run verify`.

#### T2.5.1 — Remove `pathLength` from `NO_MOTION` (closes C1 and C2)
- **Status:** TODO
- **Description:** `NO_MOTION` sets `pathLength: 1` in both states. Under reduced
  motion Framer writes that as `stroke-dasharray`/`stroke-dashoffset` attributes,
  destroying the hero waterline's author dash and stippling the linework.
- **Files owned:** `site/lib/motion.ts`
- **Depends on:** T2.R.1
- **Model / thinking:** Complex / extended (Sonnet)  **Executor:** drydock:executor
- **Context brief:** T2.R.1's C1 and C2 findings in the Progress log; Decisions
  23, 25, 26; deviations 40, 45.
- **Forbidden:** Reading root `index.html`. Removing or renaming any of the ten
  existing exports. Touching `globals.css`, `components/`, `content/`, or
  `layout.tsx`. Removing `pathLength` from `drawLine` or `heroSequence.hull`,
  which use it legitimately on solid strokes.
- **Implementation sketch:** delete `pathLength: 1` from both the `hidden` and
  `shown` states of `NO_MOTION`, and nothing else. Note the corollary T2.R.1
  raised: `pathLength: 1` is **not** what makes the hull visible under reduced
  motion — `[data-reveal-path] { stroke-dasharray: none !important }` does that —
  so removing it should not regress the hull. Verify that reasoning holds and say
  so; if it does not, report a deviation rather than restoring the property.
- **Acceptance criterion:**
  `cd site && npx eslint lib/motion.ts && printf '{"extends":"'"$PWD"'/tsconfig.json","include":[],"files":["'"$PWD"'/lib/motion.ts"]}' > /tmp/dd-tc-m5.json && npx tsc --noEmit --project /tmp/dd-tc-m5.json && node -e "const s=require('fs').readFileSync('lib/motion.ts','utf8');const m=s.match(/export const NO_MOTION[\s\S]*?\n};/);if(!m)process.exit(1);process.exit(m[0].includes('pathLength')?1:0)" && grep -q "pathLength" lib/motion.ts && for n in sectionReveal staggerChildren childRise drawLine revealClip revealClipStagger heroSequence waterlineReveal useMotionSafe NO_MOTION; do grep -q "$n" lib/motion.ts || exit 1; done`

#### T2.5.2 — Complete the `[data-reveal-path]` restore (closes M1)
- **Status:** TODO
- **Description:** `globals.css`'s `[data-reveal-path]` restores only the stroke
  channels, while its `<noscript>` twin in `layout.tsx` also restores
  `opacity`/`transform`/`clip-path`/`width`. CSS attribute selectors are exact, so
  the hull — which carries `data-reveal-path` alone and animates `opacity` as well
  as `pathLength` — is never opacity-restored on the CSS-only path.
- **Files owned:** `site/app/globals.css`
- **Depends on:** T2.R.1
- **Model / thinking:** Standard / default (Sonnet)  **Executor:** drydock:executor
- **Context brief:** T2.R.1's M1 finding; Decision 25; deviations 46, 41. Read the
  `<noscript>` block in `site/app/layout.tsx` — it is the correct mirror, and this
  task makes `globals.css` match it.
- **Forbidden:** Reading root `index.html`. Renaming or removing any of the nine
  design tokens. **Adding `stroke-dasharray` to the `[data-reveal]` rule** — that
  is the B5 defect and it must stay out. Touching `layout.tsx`, `lib/`,
  `components/`, or `content/`.
- **Implementation sketch:** add `opacity: 1 !important`, `transform: none
  !important`, `clip-path: none !important`, `width: auto !important` to the
  existing `[data-reveal-path]` block, so it becomes a superset of `[data-reveal]`
  plus the stroke channels — exactly what the noscript twin already does. Decision
  25's word "adds" was ambiguous and produced these two divergent readings; the
  noscript reading is the correct one.
- **Acceptance criterion:**
  `cd site && awk '/\[data-reveal-path\]/,/}/' app/globals.css | grep -q "opacity: 1" && awk '/\[data-reveal-path\]/,/}/' app/globals.css | grep -q "stroke-dasharray" && ! awk '/\[data-reveal\]/,/}/' app/globals.css | grep -q "stroke-dasharray" && for t in --color-dock --color-panel --color-line --color-ink --color-ink-dim --color-primer --font-display --font-mono --font-body; do grep -q -- "$t:" app/globals.css || exit 1; done`

#### T2.5.3 — Reconcile Lifecycle's no-JS claim (closes M2)
- **Status:** TODO
- **Description:** `Lifecycle.tsx`'s header comment claims no-JS visitors see the
  full content. Measured: closed rungs use `display: none`, `<noscript>` cannot
  restore `display`, the toggles are inert without JS, and five of six details are
  unreachable. Either fulfil the claim or correct it.
- **Files owned:** `site/components/sections/Lifecycle.tsx`
- **Depends on:** T2.R.1
- **Model / thinking:** Standard / default (Sonnet)  **Executor:** drydock:executor
- **Context brief:** T2.R.1's M2 finding; §6 F5; deviation 47.
- **Forbidden:** Reading root `index.html`. Hardcoding copy. Removing detail text
  from the markup (the harness and F5 both depend on it being present). Any timing
  literal. Touching any other file.
- **Implementation sketch:** two honest options — (a) make the disclosure CSS-only
  so it works without JS, or (b) correct the comment to state what is actually
  true. **(b) is the smaller, more honest change** and §1 never required no-JS
  interaction; the repo's argument is that claims trace to evidence, and a comment
  asserting an unmeasured guarantee is the defect. Whichever you choose, the false
  sentence must go. Keep `aria-expanded`, keyboard operability, and all six
  details in the markup.
- **Acceptance criterion:**
  `cd site && npx eslint components/sections/Lifecycle.tsx && printf '{"extends":"'"$PWD"'/tsconfig.json","include":[],"files":["'"$PWD"'/components/sections/Lifecycle.tsx"]}' > /tmp/dd-tc-l5.json && npx tsc --noEmit --project /tmp/dd-tc-l5.json && ! grep -q "no-JS visitors both see the full content" components/sections/Lifecycle.tsx && grep -q "aria-expanded" components/sections/Lifecycle.tsx && grep -q "lifecycle" components/sections/Lifecycle.tsx && ! grep -qE "(duration|delay):|duration-[0-9]" components/sections/Lifecycle.tsx`

### Wave 2.6 — Browser verification under forced reduced motion
> Single task. Every finding in Wave 2.5 is invisible to source text, to
> `npm run verify`, and to twelve wavecheck reports — they were found only by
> measuring computed styles in a real browser. This wave adds that measurement as
> a repeatable check rather than a one-off.

#### T2.6.1 — Reduced-motion measurement harness
- **Status:** TODO
- **Description:** Add a dependency-free Node script that serves the export,
  drives headless Chrome over CDP, and asserts the reduced-motion contract that no
  existing gate can see. Record the measured result.
- **Files owned:** `site/scripts/measure-reduced-motion.mjs`,
  `docs/plans/001-drydock-homepage.md` (Progress log only)
- **Depends on:** T2.5.1, T2.5.2, T2.5.3
- **Model / thinking:** Complex / extended (Sonnet)  **Executor:** drydock:executor
- **Context brief:** T2.R.1's C1, C2, M1 findings and its stated method; §6 F5,
  F5a; Decision 25; deviations 45, 46.
- **Forbidden:** Reading root `index.html`. Modifying anything under `site/`
  except the new script — a failing assertion is a deviation to report, not a file
  to patch. Adding a runtime dependency (`node:*` built-ins, plus Chrome via CDP
  over a WebSocket, only). Wiring this into `npm run verify` (it needs a browser;
  keep the default gate hermetic).
- **Implementation sketch:** serve `out/` on a loopback port (`node:http` is
  enough), launch Chrome headless with `--remote-debugging-port`, then per
  emulation mode read computed styles via CDP. Assert, under
  `prefers-reduced-motion: reduce`: the hero waterline computes a **two-value
  dash** (its author `10 8`, not `1 1` and not `none`); the linework paths compute
  `none`; the hull computes `opacity: 1`. Then with script execution disabled,
  assert **zero** text-bearing elements compute `opacity: 0`. Exit non-zero with a
  per-assertion report naming what was measured versus expected.
- **Acceptance criterion:** `cd site && node scripts/measure-reduced-motion.mjs`

### Wave 2.R — Quality review

#### T2.R.1 — Fresh-context quality review of Phase 2 and the whole site
- **Status:** TODO
- **Description:** Review the Phase 2 diff for correctness, convention drift
  across seven independently built components, animation restraint, whether any
  section reimplemented shared behaviour, and whether the page over-claims
  against `docs/compatibility.md`.
- **Files owned:** `docs/plans/001-drydock-homepage.md` (Progress log only)
- **Depends on:** T2.3.1 and wavecheck PASS on 2.0, 2.1, 2.2, 2.3, 2.4
- **Model / thinking:** Judgment / extended (Opus)  **Executor:** drydock:executor
- **Context brief:** the full `site/` diff, this plan, §7, `docs/compatibility.md`.
- **Forbidden:** Editing anything under `site/`. Re-litigating §7 decisions.
- **Acceptance criterion:** Verdict `APPROVED` or `REJECTED` with specific
  findings appended to the Progress log, committed as
  `drydock(T2.R.1): fresh-context quality review of Phase 2`.

---

## Deviation Log

| # | Task | What deviated | Why | Impact | Recorded |
|---|------|---------------|-----|--------|----------|
| 1 | T1.0.1 | Executor exhausted its turn budget (`maxTurns: 30`, set in `drydock/agents/executor.md`) before making its checkpoint commit. Work was complete and green but left uncommitted; the orchestrator resumed the same agent to commit rather than committing on its behalf | A scaffold task runs `npm install`, a build, a lint pass, and config iteration — 30 turns is not enough for the plan's very first task | None on output. **Two contract findings for reconcile:** (a) `maxTurns: 30` is too low for install/build-shaped tasks; (b) a turn-exhausted executor is indistinguishable from a successful one — the notification reported `completed` with a truncated fragment, no report and no deviation. Only a git check caught it. The orchestrator did NOT commit for the executor, because per-task commit authorship is wavecheck's attribution mechanism (the v0.3.0 self-audit fix) | executor report + orchestrator |
| 2 | T1.0.1 | `create-next-app` emitted `site/AGENTS.md` and `site/CLAUDE.md`, neither on the owns list | Scaffold tool default | None — both deleted before commit, never staged. Confirms M1's concern was real but that the pre-owned list plus deletion handled it | executor report |
| 3 | T1.0.1 | `site/tsconfig.tsbuildinfo` is generated on disk by `tsc`'s incremental mode and is not on the owns list | `tsconfig.json` inherits `"incremental": true` from the scaffold | None — untracked, excluded via `*.tsbuildinfo` added to the owned `site/.gitignore`; verified absent from the commit | executor report |
| 4 | T1.0.1 | `site/.gitignore` has a fourth line (`*.tsbuildinfo`) beyond the sketch's three | Prevents deviation 3 leaking into git | None — hygiene addition inside an owned file | executor report |
| 5 | T1.0.1 | `dev` and `start` scripts were removed, leaving only `build` and `lint` | The orchestrator's task brief said "exactly `build` and `lint`. Nothing else" — an over-constraint by the planner, followed correctly | **Real:** the static export uses absolute `/_next/...` asset paths, so opening `out/index.html` over `file://` 404s every asset. The Phase 2 human browser gate must therefore be performed against a served build — `cd site && npx serve out` — not a double-clicked file. No plan patch made: the gate is satisfiable with a one-off command, and `/drydock:replan` is human-only. Restoring `dev`/`start` is a reconcile follow-up | orchestrator |
| 6 | T1.0.1 | Default `public/*.svg` assets removed; `site/public/` left empty and untracked | `page.tsx` was stripped to a plain heading and no longer referenced them | None — `site/public/**` is owned, so emptying it is in scope | executor report |
| 7 | — (plan defect) | **The plan assigns no owner to the Deviation Log or the Wavecheck reports sections**, yet both are written during execution — the Deviation Log by the orchestrator, the Wavecheck reports by wavecheck itself. Wave 1.0's audit found `docs/plans/001-drydock-homepage.md` modified-uncommitted, which check 2 reads literally as an unattributed change | The format contract mandates both sections be maintained during execution but never puts them in any task's `owns` set | Not a BLOCK: the plan file is the audit's instrument, not its subject, and a literal reading would make it impossible for wavecheck to ever PASS — it must write its own report before emitting a verdict. **Required action:** the orchestrator commits the plan file before Wave 1.1 opens, so the next wave's audit starts from a clean tree. Reconcile should add explicit ownership for these two sections to the format contract | `discovered-by-wavecheck` |
| 9 | — (out-of-plan, human-authorised) | **`maxTurns` raised 30 → 60 in `drydock/agents/executor.md` AND `drydock/agents/executor-isolated.md`**, between wavecheck 1.0 PASS and Wave 1.1 opening. §3 declares `drydock/` read-only for this plan, so this is an out-of-scope change made on explicit human instruction, not by an executor | Deviation 1: T1.0.1 exhausted 30 turns before checkpointing. Wave 1.1 runs three concurrent tasks, two of them Opus-tier and comparably heavy. Both agent files carried the identical limit, so raising only the one that failed would have left the same defect in the sibling | Prevents the failure mode for the rest of this plan. **Unverified caveat:** agent definitions may be loaded at session start, so this may not take effect until a new session — if a Wave 1.1 task truncates at exactly 30 tool uses, that is the confirmation it did not apply. **Root cause not addressed:** the contract puts the checkpoint commit LAST, so any turn exhaustion loses attribution regardless of the ceiling. A contract change making the commit happen as soon as owned files are correct would make exhaustion non-fatal — left for reconcile rather than rewritten mid-execution | orchestrator, on human instruction |
| 10 | T1.1.3 | **`useMotionSafe` does not use the mount-flag idiom the plan's sketch implied.** `useState(false)` + `useEffect(() => setMounted(true), [])` is a hard lint **error** under `eslint-config-next@16.3.1`, which ships the React Compiler rule `react-hooks/set-state-in-effect`. Implemented with `useSyncExternalStore(neverChanges, () => true, () => false)` instead — same semantics (`null` and pre-hydration both count as motion ALLOWED), same `useMotionSafe(): boolean` signature | The idiom the planner assumed is lint-fatal in this repo; the criterion could not pass with it | None on consumers. **Must propagate:** every remaining task that reaches for `useEffect` + `setState` will fail its own scoped criterion. Independently confirmed by wavecheck with an empirical probe file: the rule fires as `error`, not warning. Added to the context brief of all downstream tasks | executor report, confirmed by wavecheck |
| 11 | T1.1.1 | Added beyond the nine contract tokens: a `--text-*` draft-mark scale, `--grid-minor`/`--grid-major`/`--blueprint-grid`, a `blueprint-grid` `@utility`, and a convenience `fontVariables` export in `lib/fonts.ts` | The task description named "palette, type scale, blueprint-grid ground", so the scale and grid are in scope. `fontVariables` (the three `.variable` classNames joined) was not asked for | Judged in-scope except `fontVariables`, which is an additive convenience inside an owned file — not a violation, but it is unrequested surface and a later task is free to ignore it | executor report, assessed by wavecheck |
| 12 | — (F6 hazard, live) | **Tailwind v4 tree-shakes unreferenced `@theme` tokens.** All nine contract tokens are correctly defined in `globals.css`, but `--color-panel` and `--color-ink-dim` have zero references outside their declarations and are therefore **absent from the compiled CSS** in `out/`. Verified by grepping the emitted stylesheet after a clean build | Expected v4 behaviour, not a defect in T1.1.1's work | None yet — they will appear once a section uses them. But this demonstrates F6's silent-failure mode live: **a mistyped token name produces no output and no error.** `@theme static` forces all tokens to emit and would make the nine-token contract verifiable at build time; `globals.css` belongs to a now-closed wave, so that is a follow-up or `/drydock:replan` matter | `discovered-by-wavecheck` |
| 13 | — (contract gap) | The variant state names `"hidden"` and `"shown"` are what make `safe ? sectionReveal : NO_MOTION` a drop-in swap, but they are documented in `lib/motion.ts`'s header rather than enforced by a type. A section writing `initial="hide"` **fails silently** — no lint error, no type error, no build error, just no animation | Variant state names are plain object keys; Framer does not validate them | Same class of silent failure as deviation 12. Mitigation available to the section waves: T2.0.1's harness can assert that every section file using `initial=` uses only `"hidden"`/`"shown"`. Noted for that task's brief | `discovered-by-wavecheck` |
| 14 | T1.1.1 | `Big_Shoulders` carries an `opsz` axis (10–72, default 14) that was not pinned via `axes` | next/font serves the `wght` axis only unless `axes` is passed | Cosmetic and latent: large display headings may render optically wrong. The knob is `axes: ["opsz"]`. Hardware-and-typography calibration of this kind is exactly what a minimal model cannot see from source — flagged for the human browser gate at the end of Phase 2 | executor report |
| 15 | T1.2.1 | Executor read root `README.md`, which the task block's "sanctioned sources" list omitted | **Planner defect:** the same task block required two literals sourced *from* root README — `hero.sub` ("one sentence from root README's description") and `install.commands` ("verbatim from root README"). The brief was internally inconsistent; reading it was the only way to satisfy the spec | None on output — both strings are transcriptions, not inventions, and root `index.html` was never opened. Correctly flagged rather than silently absorbed. Add root `README.md` to F3's sanctioned list at reconcile | executor report |
| 16 | T1.2.1 | `docs/compatibility.md` gives the contract-logic row the id `—` (em-dash); em-dashes are forbidden inside literals, so that row's `id` is `"--"` | F11 bans em-dashes because of export-matching fragility | Cosmetic. Label and status transcribed unchanged | executor report |
| 17 | — (C9 residue) | **Copy shapes the plan never pinned were chosen by the executor, and downstream tasks are now bound to them:** `problem = { lead, modes: {title,body}[], coda }`, and `site` carries `title`/`description` alongside `status`/`version`/`selfAuditHref`. `Piece`, `EvidenceRow`, `TerminalLine`, `FaqItem` are exported so sections can type props without redeclaring | Round 2's C9 was fixed for `evidence`, `terminal`, `lifecycle`, `install`, `faq` — but `problem` and `site` were left to prose | These shapes exist only in the committed file, not in the plan, so **T2.1.4 (Problem) and T1.3.1 (shell/metadata) must be briefed with them explicitly** or they will guess a shape that does not exist. Being done: added to those tasks' context briefs | `discovered-by-wavecheck` |
| 18 | — (M4 fix weaker than intended) | **Both `executor` and `executor-isolated` carry `kind: "agents"`**, faithfully mirroring `drydock/README.md`, which groups them in one table row. So the planned `agents` assertion proves an agent-kind row exists, not that `executor` specifically does — the discriminator M4's fix was meant to provide | The planner assumed only `executor` would carry that kind | In `copy.ts` the two are distinguishable as `name: "executor",` vs `name: "executor-isolated"`. In the compiled export they are not separable by bare substring; the sound check is **counting occurrences of `executor` and requiring ≥ 2**. T2.0.1's harness brief must specify this instead of the `agents` proxy | `discovered-by-wavecheck` |
| 19 | T1.2.1 | `site/app/layout.tsx` exports no `metadata`, so `site.title` / `site.description` are unused so far | `layout.tsx` belongs to T1.3.1, a later wave | None — sequential handoff working as designed. T1.3.1 must wire them | executor report |
| 20 | — (invalidates the fix for 18) | **`out/index.html` contains the RSC flight payload as an escaped JSON string, so every rendered string appears TWICE.** Confirmed by wavecheck: `TODO` occurs 14 times for 7 stubs — 7 inside `<script>` bodies, 7 in real markup. F11's "strip all tags" normalisation does NOT remove script *bodies*, only the tags around them | React Server Components serialise the tree into the HTML for hydration | **Serious.** Every counting assertion in the planned harness passes vacuously — including deviation 18's `executor` ≥ 2 discriminator, which was itself the fix for M4. A section could render nothing and a naive count would still pass off the flight payload. **T2.0.1 must strip `<script>…</script>` bodies before matching or counting**, and F11's normalisation order must become: strip script bodies → strip comments → strip tags → collapse whitespace → decode entities | executor observation, `discovered-by-wavecheck` |
| 21 | T1.3.1 | **New unlogged build warning:** `Failed to find font override values for font 'Big Shoulders'. Skipping generating a fallback font.` Confirmed verbatim by wavecheck in a clean build | `next/font` has no override metrics for the variable `Big Shoulders` family | Warning only, exit 0 — but it means no `size-adjust` fallback metrics for the display face, i.e. **real layout shift on the hero headline until the webfont loads**. Compounds deviation 14 (unpinned `opsz` axis). `lib/fonts.ts` belongs to a closed wave, so this is a follow-up; both belong on the Phase 2 human browser gate's checklist since only an eye catches them | executor report, confirmed by wavecheck |
| 22 | T1.3.1 | **No skip link** — an accessibility basic, deliberately left unclosed | It requires a user-visible string ("Skip to content") that does not exist in `content/copy.ts`, and T1.3.1 is forbidden from authoring copy. `copy.ts` is frozen in a closed wave | Real gap. Correctly refused rather than smuggled in by violating a forbidden item — the executor stopped and reported instead of improvising, which is the contract working. Closing it needs a string added to `copy.ts` → follow-up task or `/drydock:replan`. §1 lists accessibility basics as non-negotiable, so this should not ship unclosed | executor report |
| 23 | T1.3.1 | **Contract facts binding on all seven Phase-2 tasks, decided here because `page.tsx` can never change again:** (a) every component is a **default** export — a Phase-2 task switching to a named export breaks the build; (b) `Section` owns the `<section id={meta.id}>` element, `data-reveal`, the container classes, the draft-mark `<p>`, and the `<h2>` — sections must not add their own section element, id, heading, draft mark, or reveal wrapper, and their content starts as children below the `<h2>`; (c) the reveal config `initial="hidden" whileInView="shown" viewport={{once:true, amount:0.2}}` is set once in `Section.tsx`, and a section stays a server component unless it needs hooks or its own `motion.*` elements; (d) `<main>` lives in `layout.tsx` and `page.tsx` returns a bare fragment; `Hero` has no `id` | The plan specified the composition convention but not these mechanics | None if propagated, breakage if not. **Added to all seven Phase-2 context briefs** | executor report |
| 24 | T1.R.1 | **Reviewer killed by API 529 after authoring its verdict but before checkpointing; resumed twice, failed instantly both times.** The orchestrator committed the verdict on its behalf | Server-side API overload, not a task fault. The full verdict was already written to the Progress log and left uncommitted; leaving it there would dirty the tree and flag on the next wave's ownership audit | **Attribution compromised, and stated rather than hidden:** commit `drydock(T1.R.1)` was made by the orchestrator, not the executor named in it. Acceptable here on grounds that do not generalise — T1.R.1 owns only prose in the Progress log, so there is no code to mis-attribute, unlike T1.0.1 where the orchestrator deliberately refused to commit for the executor. **Second instance of the same contract gap as deviation 1:** an executor that dies after doing the work but before committing looks, from the outside, indistinguishable from one that did nothing. Deviation 1 was turn exhaustion; this is an API error. Reconcile should make the checkpoint commit happen as soon as owned files are correct, which fixes both | orchestrator |
| 25 | — (human-authorised plan amendment) | **Waves 1.4 and 1.5 added to Phase 1, and the Phase 1 exit state and gate amended**, in response to T1.R.1's REJECTED verdict | Four blocking findings all require edits to files owned by closed waves (`content/copy.ts`, `app/globals.css`, `app/layout.tsx`, `components/Section.tsx`). `/drydock:replan` normally owns plan patches but is `disable-model-invocation` (human-only), so the orchestrator amended the plan under explicit human direction instead | Scope confirmed by the human: repair the four blockers AND close the design ceiling (verdict D) in the same reopening, rather than reopening the shell twice. Completed waves stay immutable, the Decision Log stays append-only, and no task id is reused — B1's fix is `T1.4.1`, not a re-run of `T1.2.1`. **Ordering deliberately avoids the sideways-dependency defect that has now appeared twice** (round-1 C4, round-2 C-1): the shell task needs title-block strings from `copy.ts`, so it sits in Wave 1.5 behind Wave 1.4, not beside it | orchestrator, on human instruction |
| 26 | T1.R.1 | **Two commits now carry the identical subject `drydock(T1.R.1): fresh-context quality review of Phase 1`** — `751a6fe` (orchestrator, on the agent's behalf after three API 529s) and `2f33e00` (the agent itself, once the API recovered, amending its N10 row in place and escaping two `\|` characters that would have truncated the N2 cell) | The orchestrator judged the agent unrecoverable after three consecutive 529s and committed for it; a queued resume message then landed successfully much later and the agent, unaware a commit already existed, completed its own contract step | **Ambiguous attribution — exactly what per-task commits exist to prevent.** A wavecheck ownership audit reading `git log` for T1.R.1 finds two commits and cannot tell which is authoritative from the log alone. Net content is correct and non-contradictory: both commits touch only the plan file, `2f33e00` is a 2-line amendment on top, and the N10 retraction now appears twice — once as the reviewer's own in-place strikethrough (canonical, since the author retracting is stronger) and once as the orchestrator annotation at row 25's sibling entry. Nothing is lost; the redundancy is left in place because the Progress log is append-only. **Also correcting the agent's own report, which states the orchestrator "resumed this agent to commit rather than committing on its behalf" — the opposite is true.** Reconcile item: the contract has no rule for who owns the checkpoint when an executor is presumed dead and later revives | orchestrator |
| 27 | T1.4.1 | **F12's hermetic typecheck was broken for every file using the `@/*` alias, and would have failed all seven Phase-2 criteria.** `tsc` with explicit file arguments ignores `tsconfig.json`, so the `paths` map never loads and `@/lib/section` fails TS2307. T1.4.1 reported its own criterion UNVERIFIED, proved the failure predates its edit by reproducing it against the frozen file from `fcf11c1`, and **refused to improvise a `declare module` shim** — citing the forbidden list and contract rule 5 | The planner introduced F12 in rev 3 to answer round 2's C-3, and validated it against three Wave 1.1 files that happen to import only from node_modules. The alias case was never tested | **Plan-wide, caught one wave before it would have fired seven times.** Independently confirmed by wavecheck: project-wide `tsc --noEmit` exits 0 (the code is fine), while the per-file form fails only on the alias. Fixed as F12a — a temp tsconfig that `extends` the project config with `"include": []` and `"files": [target]`. `"include": []` is essential because `include` is inherited through `extends`; measured, its absence pulls 7 sibling files into the graph. The corrected form was verified to resolve aliases, keep the graph to the target's own imports, and still catch an injected type error. All seven Phase-2 criteria rewritten; T1.4.1 re-verified as PASSING under the corrected command, so its work stands. Closed waves 1.1's criteria left as executed — they passed validly for non-alias files, and rewriting what was already verified would falsify the record | executor report, fixed by orchestrator |
| 28 | T1.5.1 | **Title-block cells rendered UNLABELLED.** The brief asked for "a ruled box with labelled cells"; `copy.ts` contains no caption strings (`PROJECT`, `SHEET`, `SCALE`), and inventing them would breach the forbidden "author ANY user-visible copy" rule | The copy inventory completed in T1.4.1 covered the six *values* but not cell captions — the same enumeration gap as B1, one level finer | Cosmetic. The values are self-labelling in the drawing register (`SHEET 1 OF 1`, `NOT TO SCALE`, `REV 0.3.1`), so the block reads correctly. Third consecutive task to refuse rather than improvise; if captions are wanted, a copy task must extend `Sheet` first | executor report |
| 29 | T1.5.1 | Skip link uses an off-screen transform (`-translate-y-24` → `focus:translate-y-0`) instead of the suggested `sr-only focus:not-sr-only` | `not-sr-only` sets `position: static`, which fights `focus:fixed` at equal specificity — the winner depends on Tailwind's utility sort order, which is not a contract | **Better than what was asked for.** Deterministic, and keeps the link in the accessibility tree. Verified: the link is the first focusable element in DOM order (the only element before it is React's empty `<div hidden>` suspense marker, which is not focusable and not in the a11y tree), `href="#content"` matches `<main id="content">`, focus state is primer on dock at 6.54:1 | executor report, verified by wavecheck |
| 30 | T1.5.1 | Per-section sheet numbers skipped (the optional half of the task) | Would require a string not in `copy.ts`, or deriving one, which is still authoring copy | None — not required by any criterion | executor report |
| 31 | — (N1 recurring one level down) | **Section-internal rhythm is still unpinned.** T1.5.1 fixed N1 by pinning the `<h2>` → `children` gap as exactly one wrapper, `<div className="mt-8">`. But the gap BETWEEN a section's own sibling blocks is not fixed by the shell, so six parallel executors will each invent it — `space-y-4` vs `space-y-6` vs per-block margins — and no gate inspects layout | The criterion asked for one wrapper with one class, which is what it got; the level below was out of its scope | Flagged by the executor itself, unprompted. **All six section briefs must name one value** (recommended: `space-y-6` on the section's own top-level wrapper inside `<Section>`), or N1 simply reappears one level down after the review already caught it once | executor report |
| 32 | T1.5.1 | **The sheet frame changes the bleed edge.** `<body>` now carries `p-2 sm:p-4` and the whole page sits inside a `border border-line` div, so nothing inside a section can reach the viewport edge — a full-bleed background or edge-to-edge SVG now stops at the trim line | Inherent to adding a drawing sheet frame, which was the requested fix for verdict D | **Most likely to bite Hero**, whose signature SVG spans the page. Must be in T2.1.1's brief explicitly. Also: `site.selfAuditHref` / `site.selfAuditLinkText` are deliberately not consumed by the footer, left free for Evidence | executor report |
| 33 | T1.R.1 | **Fifth executor stop-before-checkpoint in this plan, and the third on this single task.** Sequence: (a) first instance killed by API 529 after writing its verdict — orchestrator committed for it (row 24); (b) same instance revived later and committed again, producing duplicate attribution (row 26); (c) re-run instance stopped at 35 tool uses under the raised 60 cap, reported `completed`, wrote nothing; (d) resumed instance stalled — watchdog, no progress for 600s — with the fragment "I have everything I need. Writing the verdict and committing immediately", having written nothing. A fresh instance was then spawned with the verified facts front-loaded and a commit-first instruction | Four distinct causes across five stops: turn exhaustion, API error, silent turn-end, watchdog stall. **The common factor is not the cause but the ordering** — the executor contract puts the checkpoint commit LAST, so every failure mode discards attribution for work that was already complete | **The `maxTurns` 30 → 60 raise (row 9) did not help, because the ceiling was never the problem.** All five were caught only by checking `git status`; every one reported in a way indistinguishable from success or produced no report at all. **Reconcile, highest-value plugin change identified by this plan:** move the checkpoint commit to fire as soon as owned files satisfy the criterion, before final verification narration — and give the contract a rule for who owns the checkpoint when an executor is presumed dead and later revives (row 26 has no rule today). Applied as a workaround in the fresh instance's brief rather than by editing the frozen contract mid-execution | orchestrator |
| 34 | — (planner failure) | **Decisions 23 and 24 were recorded in §7 and never propagated into a single task block — the exact failure this plan already named in deviation 17.** T2.1.1's context brief listed Decisions 5, 9, 18, 20, 22, 17 and neither 23 nor 24; T2.0.1's listed 9, 13–15, 20, 22 and not 24. Worse than omission: **T2.1.1's implementation sketch still read "waterline `drawLine` (`pathLength` 0→1, dashed, primer)"** — the literal construction Decision 23 exists to forbid, in the one document the executor is handed. Decision 24 claimed the `<h1>` was "pinned in T2.1.1's brief and asserted by T2.0.1's harness"; neither was true, and the only `<h1>` check in the plan asserted count **0** | The orchestrator wrote both Decisions when closing round-2 findings B2 and B4, treating "fixed by contract" as complete, and did not edit the consuming briefs. Deviation 17 recorded the identical mistake earlier in this same plan and it was repeated anyway | **An executor following its brief would have built precisely the defect B2 found.** Caught by T1.R.1's second run. Closed by orchestrator edits: Decisions 23–26 added to T2.1.1's brief, its sketch rewritten to specify the dashed overlay and bar `drawLine` on the waterline, `waterlineReveal`/`<h1>` added to its criterion, and the heading assertion plus the deviation 18 and 20 fixes written into T2.0.1's sketch and fixture. **Reconcile: a Decision that names a consuming task is not closed until that task's brief cites it — the plan format should require the back-reference** | `discovered-by-wavecheck` (T1.R.1 re-run), fixed by orchestrator |
| 35 | — (repairs collided) | **B5, a new blocker created by fixing B3.** The reduced-motion restore uses an unqualified `[data-reveal]`, so `stroke-dasharray: none !important` reaches every revealed element. Decision 23's dashed overlay must carry `data-reveal` (clip-animated → inline `opacity: 0`), so the dashed waterline renders **solid** under reduced motion, silently losing §1's dashed requirement. Measured in headless Chrome with `--force-prefers-reduced-motion`: the dashed path is restored visible and solid while a control stays dashed. `revert` does not help — SVG presentation attributes cascade at author origin | B3's fix and Decision 23 were each correct in isolation. Nobody checked them against each other | Closed by Decision 25 (split `[data-reveal]` / `[data-reveal-path]`) and Decision 26 (`waterlineReveal`, since `revealClip` is delay 0 and beat 3 needs 1.0s, leaving `revealClipStagger(11)` — a magic index no brief sanctioned — as the only route). Both delivered by Wave 1.6. **Note the structural cause: `app/globals.css` and `lib/motion.ts` are owned by no Phase-2 task**, so this was unfixable inside Phase 2 as scoped and needed a new Phase-1 wave | `discovered-by-wavecheck` (T1.R.1 re-run) |
| 36 | — (human-authorised) | **Wave 1.6 added; the third T1.R.1 re-review deliberately SKIPPED.** The human chose "fix, then proceed without a 3rd review": Wave 1.6's wavecheck gates the code, and the orchestrator verifies B2/B4/B5 closure directly, so Phase 1 reaches the human gate on orchestrator verification rather than a fresh-context review | Two review rounds each cost a long cycle; the remaining fixes are small, mechanical, and individually assertable | **Residual risk, accepted explicitly by the human and recorded with the verifier named:** both prior rounds found real defects that the orchestrator had missed, including two (B2, B4) that were the orchestrator's own un-propagated decisions. Nobody with fresh eyes will confirm this closure. The Phase 2 quality review (T2.R.1) is the next fresh-context look at any of it | orchestrator, on human instruction |
| 37 | T1.6.1 | **The contract now holds two waterline variants and only one is correct — a footgun created by protecting the nine exports.** `heroSequence.waterline` still animates `pathLength`, because T1.6.1 was forbidden from removing any of the nine existing exports. So `waterlineReveal` (correct: clip-based, keeps the dash) sits beside `heroSequence.waterline` (wrong: reproduces B2's solid line and B5's stripped dash), and the hero sketch tells the executor to drive beats 1, 2 and 4 from `heroSequence` | The "do not remove the nine exports" guard was written to protect nine consuming files, and had the side effect of preserving the defective variant next to its replacement | Flagged by the executor itself, unprompted, in its `observations` — it noted the wiring choice was outside its owned files and would fall to a downstream task. **Closed before Phase 2 opens:** T2.1.1's sketch now names the trap explicitly and says which three `heroSequence` beats to use and which one not to, and its criterion asserts `! grep -qF "heroSequence.waterline"`. Reconcile: when a contract fix supersedes an export that cannot be deleted, the plan should mark the superseded one deprecated in the contract file itself, not only in a consuming brief | executor report, closed by orchestrator |
| 38 | T2.0.1 | **Passing an explicit path to `assert-copy.mjs` disables all four motion-contract checks.** Fixture mode is keyed off "an argument was given", which the two-fixture self-test requires — but it means `node scripts/assert-copy.mjs out/index.html`, the natural thing to type, silently drops the section-source checks. Proven by the orchestrator: a probe section violating all four rules produced four named failures in bare mode and **zero** with a path | The criterion needs fixture mode to test the harness against synthetic inputs; the same switch gates the source scan | Mitigated, not eliminated. `npm run verify` uses the **bare** form, and T2.3.1's criterion is `npm run verify`, so the real gate always runs all checks. The script announces `motion contract skipped: fixture mode` on **success** — but not on failure, so a failing path-mode run gives no hint that four checks were skipped. **Standing rule: wavecheck and integration must invoke it bare.** Reconcile: announce the skip on failure too | executor observation, proven by wavecheck |
| 39 | T2.0.1 | **Two required literals are case-sensitive and live in only one place each**, which constrains who may render them: `internal pilot` and `field benchmarks pending` come from `site.status` (lowercase) — the hero badge variant `v0.3.1 -- INTERNAL PILOT` would **not** satisfy the check; `drift` comes from `meta.problem.heading` (lowercase) — the `Drift` mode title alone would not satisfy it | The harness asserts exact literals; `copy.ts` happens to carry the required casing in exactly one export each | Binding on Phase 2: whichever component renders the pilot status must render `site.status` itself, and Problem must render its `meta.heading` (which the shell already does). Three of the fourteen literals (`internal pilot`, `field benchmarks pending`, `drift`) already pass against the stub export because they come from the shell, not from section bodies | executor report |
| 40 | T2.0.1 | **Correct `data-reveal` / `data-reveal-path` pairing is not machine-checkable.** The harness can only see that a motion-importing file contains `data-reveal` as a substring — and `data-reveal-path` contains it — so it cannot verify that `pathLength`-animated elements carry `data-reveal-path` and clip-animated ones carry `data-reveal` only | Attribute-to-variant correctness is a semantic relationship between JSX attributes and variant choice, not a text property | **This is B5's residue: the defect that made the dashed waterline solid under reduced motion cannot be caught by the gate that was built to catch it.** It remains a wavecheck and human read of the diff. Flagged by the executor itself as out of its criteria rather than papered over. Explicitly added to T2.R.1's and the human browser gate's checklist | executor report |
| 41 | — (design gap, no task violated anything) | **Without JavaScript and without reduced motion, the page renders essentially blank.** Measured on the real export: **24 elements carry inline `opacity:0`, 23 of them `data-reveal`**, and there is **no `<noscript>` fallback** (0 matches). The `<h1>` contains `<span data-reveal style="opacity:0;transform:translateY(12px)">Drydock</span>` — text present in the markup, invisible on screen. Three paths, only two covered: JS on → Framer animates to visible ✓; reduced motion → `[data-reveal]` restores ✓; **JS off, motion not reduced → nothing ever restores it ✗** | F5 secured *presence* in the markup so the copy assertions could grep it. F5a secured *visibility* under reduced motion. Neither addressed no-JS, and having two adjacent guarantees made it easy to assume the third was covered | **No Wave 2.1 task violated any criterion or forbidden item** — this is a consequence of the Phase 1 shell and motion contract, so wavecheck 2.1 still PASSES. Fix is one `<noscript><style>` block force-restoring `[data-reveal]`/`[data-reveal-path]`, mirroring the reduced-motion rule. **Structurally the same problem as B5: it belongs in `layout.tsx` or `globals.css`, which no Phase-2 task owns**, so it needs a repair task. Deferred to a single Phase-2 repair rather than a wave of its own — flagged to the human | `discovered-by-wavecheck` |
| 42 | T2.1.1 | Two judgement calls reported rather than absorbed: (a) the `<h1>` is a plain `<h1>` wrapping a `<motion.span data-reveal>` rather than a `<motion.h1>`, because the criterion greps the literal `<h1` and a `<motion.h1>` component reference does not contain that substring; (b) Hero's root is a `<div>`, not a `<header>`, since `layout.tsx` already provides a `<header>` landmark around `site.status` | The criterion's grep shape constrained the JSX, and a second `<header>` would have been a semantic clash the plan never asked for | Both correct. (a) yields exactly one `<h1>` containing `Drydock` — verified in the export — and animates only opacity/transform on the inner span, never text content. (b) avoids nested banner landmarks. Also confirmed: the only occurrence of the string `Section` in `Hero.tsx` is a doc comment explaining its Decision 18 exemption; it imports and renders none (0 matches) | executor report, verified by wavecheck |
| 43 | T2.2.1 | **Terminal is the only section relying on Framer variant-context propagation.** It sets `initial="hidden" whileInView="shown"` once on a `motion.pre` ancestor and lets the per-line `variants={safe ? revealClipStagger(i) : NO_MOTION}` inherit that state from context. Hero and Lifecycle instead set `initial`/`animate` explicitly on every motion element | The staggered reveal needs one shared trigger with per-child cadence, which is what variant propagation is for; the alternative is a hand-managed in-view hook per line | **Silent-failure risk, and the executor flagged it unprompted as outside its owned file:** if `Section.tsx` or any intermediate wrapper's motion setup changes, Terminal's reveal stops firing with no lint error, no type error, no build error and no assertion failure — the twelve lines simply stay clipped. Same species as deviations 12, 13, 18, 20, 27, 40, 41. Added to T2.R.1's checklist and the human browser gate; the lines are all present in the export either way, so the failure would be visual only | executor report |
| 44 | — (human-authorised) | **Wave 2.3 added as a no-JS repair and integration moved to Wave 2.4**, in response to deviation 41. New task `T2.3.2` owns `app/layout.tsx`; integration keeps its id `T2.3.1` per the format contract (ids never change once assigned) with only its wave assignment moved, and now depends on the repair | The human chose to fix before integrating so `T2.3.1` verifies the final tree rather than an intermediate one. The repair cannot share a wave with integration: integration verifies what the repair produces, which would be the sideways-dependency defect this plan has already hit three times (round-1 C4, round-2 C-1, deviation 34) | **Third structural instance of the same gap: `app/layout.tsx` and `app/globals.css` are owned by no Phase-2 task**, so B5, N15 and now the no-JS fix each required a new Phase-1-style repair wave. Reconcile: a plan whose Phase 2 cannot touch its own shell should either give a Phase-2 task ownership of the shell files or state that shell defects are out of phase scope by design |
| 45 | — (B5, third route) | **C1/C2 BLOCKING: `NO_MOTION` sets `pathLength: 1` in both states, so under reduced motion Framer writes `stroke-dasharray`/`stroke-dashoffset`/`pathLength` as attributes** — destroying the hero waterline's author `strokeDasharray="10 8"` (renders SOLID) and, because `stroke-dasharray` is an inherited SVG presentation attribute, stippling the linework `<g>`s' children into dotted stipple. Measured in headless Chrome 151 over CDP on the shipped export: normal motion → `10px, 8px` dashed; reduced motion → `1px, 1px` with `pathLength="1"` → one solid line. None of those attributes appear in `Hero.tsx` | Decisions 23, 25 and 26 all address the **CSS** route to B5 and all work. Nobody re-measured after Hero existed, and the **JavaScript** route was never considered | **B5 arriving through a third door, and invisible to every gate:** the harness greps source text, the CSS is correct, `Hero.tsx` is correct, and `NO_MOTION` reads as a safety net. §1's signature requirement lost for exactly the visitors §1 promises a complete page to. Closed by T2.5.1; the fix is deleting one property from one frozen file | `discovered-by-wavecheck` (T2.R.1) |
| 46 | — (my ambiguous wording) | **M1: `globals.css`'s `[data-reveal-path]` restores only the stroke channels, while its `<noscript>` twin in `layout.tsx` also restores `opacity`/`transform`/`clip-path`/`width`.** CSS attribute selectors are exact, so `[data-reveal]` never matches an element carrying only `data-reveal-path`. `heroSequence.hull` animates `pathLength` **and** `opacity`, so on the CSS-restore-only path (JS blocked, or before hydration) **exactly one element on the page is invisible: the hull**. A reduced-motion visitor sees a dock with no ship, then the hull appears at hydration — a motion event for the user who asked for none | **Decision 25's wording, which I wrote, said a second attribute "adds" the stroke properties.** T2.3.2 read "adds" as *in addition to the full set* and got it right; T1.6.1 read it as *the rule contains only these* and got it wrong. Both are defensible readings of an ambiguous sentence | The two mirrors disagreed for five waves while a comment above the noscript block claimed they were "split the same way". **I had both blocks printed on screen during wavecheck 1.6 and 2.3 and never compared them.** Phase 1's "B3 CLOSED — no channel left unrestored" was true before the attribute split and stopped being true after it. Closed by T2.5.2. Reconcile: state contract rules as complete rule bodies, never as deltas | `discovered-by-wavecheck` (T2.R.1) |
| 47 | T2.1.3 | **M2: `Lifecycle.tsx`'s header comment claims no-JS visitors "see the full content"; measurement contradicts it.** Closed rungs use Tailwind `hidden` (`display: none`), `<noscript>` restores opacity/transform/clip-path/width and **cannot restore `display`**, and the toggle buttons are inert without JS. Measured with script execution disabled: one detail panel is `display: block`, the other **five are `display: none`** | The comment's first half — hidden via CSS, never conditional rendering — is true and load-bearing for the harness. Its second half was inferred from the first rather than measured | Not blocking: §1 never required no-JS interaction, and deviation 41's blank-page defect is genuinely fixed. Major because **a code comment asserts a guarantee that measurement contradicts, in a repo whose entire argument is that claims must trace to evidence.** Closed by T2.5.3, which may either fulfil the claim or correct it — the false sentence has to go either way | `discovered-by-wavecheck` (T2.R.1) |
| 48 | — (human-authorised) | **Waves 2.5 and 2.6 added** after T2.R.1's REJECTED verdict: three parallel source-level fixes, then a browser measurement | The three findings live in `lib/motion.ts`, `app/globals.css` and one section file. The first two are **owned by no Phase-2 task — the fourth instance of that structural gap** (see deviation 44) | Wave 2.6 exists because **C1, C2 and M1 were invisible to source text, to `npm run verify`, and to twelve consecutive wavecheck PASSes.** They were found only by reading computed styles in a real browser, so the repair adds that measurement as a repeatable script rather than trusting it was a one-off. Deliberately NOT wired into `npm run verify`, which must stay hermetic and browser-free |
| 8 | T1.0.1 | **Turbopack resolves its workspace root outside the repository.** Every `next build` emits `⚠ Next.js ignored yarn.lock in /Users/takasivenkatasandeep because it is outside the current Git repository`. A stray `~/yarn.lock` (83 KB, dated 2026-01-09) exists in the home directory; `turbopack.root` is unset in `next.config.ts`. Confirmed to recur on a clean `rm -rf .next out && npm run build` | Next 16 infers the workspace root by walking up for a lockfile and finds one above the repo | Currently a warning, not a failure — the criterion exits 0 and the export is correct. But root inference reaching outside the repo is a latent hazard for a reproducible build, and the executor did not report a warning that appeared in its own build output. `turbopack.root` should be pinned to `site/`; that is a change to `next.config.ts`, owned by T1.0.1 in a closed wave, so it belongs to a follow-up task or `/drydock:replan`, not to this wave | `discovered-by-wavecheck` |

## Wavecheck reports

*Appended by `drydock:wavecheck`, one section per wave.*

### Wavecheck 1.0 — PASS — 2026-08-18

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `format_version: 2` (supported), `status: EXECUTING`, `approved_by: sandeep`. Wave 1.0 exists with exactly one task, T1.0.1. No prior wavecheck report expected: §10 declares Phase 0 takes no wavecheck (T0 is read-and-record with no code diff), so the absence is declared, not a skipped gate. |
| 2. Ownership | PASS | Per-task commit present: `3ef082d drydock(T1.0.1): Scaffold the Next.js static-export app`. `git show --name-only` lists 13 files, all ⊆ T1.0.1's `owns`: `.gitignore`, `README.md`, `app/favicon.ico`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `eslint.config.mjs`, `next-env.d.ts`, `next.config.ts`, `package-lock.json`, `package.json`, `postcss.config.mjs`, `tsconfig.json`. No files outside `site/`. No build artifacts committed — `git ls-files site` matches nothing for `node_modules`, `.next/`, `out/`, or `tsbuildinfo`. No untracked files under `site/`. One uncommitted change existed outside the wave's owned set (`docs/plans/001-…md`, the orchestrator's Deviation Log append) — adjudicated as instrument-not-subject and logged as deviation 7 with a required action. |
| 3. Forbidden | PASS | *No design work:* `globals.css` is exactly `@import "tailwindcss";`; `page.tsx` is a bare `<h1>Drydock</h1>`; `layout.tsx` has no fonts, colours, or metadata. *No basePath/assetPrefix:* 0 matches in `next.config.ts`. *No test runner:* dependency tree contains no vitest/jest/testing-library. *No `verify`/`typecheck` script:* scripts are exactly `build,lint`. *No type-aware ESLint:* config contains neither `projectService` nor `parserOptions`; `globalIgnores(["out/**",".next/**","node_modules/**"])` pinned as specified. *Root `index.html` untouched:* `git diff c664671..3ef082d -- index.html` is empty. |
| 4. Acceptance | PASS | Criterion executed verbatim by the auditor, not taken from the report: `cd site && npm install && npm run build && npx tsc --noEmit && npm run lint && test -f out/index.html && node -e "…projectService\|\|parserOptions…"` → **exit 0**. Build reports `▲ Next.js 16.3.1 (Turbopack)`, `✓ Compiled successfully`, routes `○ /` and `○ /_not-found` prerendered as static content. |
| 5. Deviation reconciliation | PASS | All 5 deviations plus 1 observation in T1.0.1's completion report appear in the Deviation Log as rows 1–6. Two further findings discovered during this audit and logged by wavecheck: row 7 (unowned plan sections) and row 8 (Turbopack root inference reaching outside the repo, warning on every build, unreported by the executor). |

Deviations logged: 8 (2 discovered by wavecheck)

**Verdict: PASS.** Wave 1.1 may start once the required action in deviation 7 is
done — commit the plan file so the next wave's ownership audit begins from a
clean tree.

### Wavecheck 1.1 — PASS — 2026-08-18

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `format_version: 2`, `status: EXECUTING`. Wave 1.1 exists with three tasks. Prior wave 1.0 has a PASS report — no gate skipped. |
| 2. Ownership | PASS | Three per-task commits, each touching only its owned set and disjoint from siblings: `7988f9d drydock(T1.1.1)` → `site/app/globals.css`, `site/lib/fonts.ts`; `af6a20b drydock(T1.1.2)` → `site/lib/section.ts`; `69959fb drydock(T1.1.3)` → `site/lib/motion.ts`. No file appears in two commits. No files outside `site/`. Working tree clean after all three; build artifacts correctly gitignored. **All three commits landed with no `.git/index.lock` collision** — Decision 17's retry was either exercised silently or unnecessary. |
| 3. Forbidden | PASS | *Root `index.html` untouched* across the whole wave (`git diff 0408079..HEAD -- index.html` empty), and all three executors independently confirmed never opening it — the palette is demonstrably fresh (`--color-dock: #061320`, `--color-primer: #ff6a1f`) rather than `index.html`'s values. *Single accent:* only `--color-primer` is warm; the other five are blues/inks. *F6a respected:* font tokens map to `var(--font-src-*)` with fallback stacks, none self-referential. *No `"use client"` in `lib/motion.ts`* (0 matches) — correct, so importing variants does not force a server component client-side. *No spring/bounce/overshoot:* the only `spring|bounce` match is a comment asserting their absence; easing is `easeOut` throughout. *Restraint budget:* `heroSequence` totals 1.95s (label at delay 1.6 + duration 0.35) under the 2s ceiling, all reveals ≤ 0.6s. *No project-wide build or bare typecheck run inside the wave* — verified by the absence of clobbered output and by each report. *No JSX in the three contract files.* |
| 4. Acceptance | PASS | All three criteria executed verbatim by the auditor, not taken from reports. T1.1.1 → exit 0 (eslint + hermetic tsc + nine `<token>:` greps + `prefers-reduced-motion` + `data-reveal` + `--font-src-display` + `Big_Shoulders`). T1.1.2 → exit 0, and the required `import type React from "react"` is present at line 15. T1.1.3 → exit 0, all nine exports present. **Additionally, a full project build was run — safe here because the wave is complete and nothing is concurrent, and explicitly requested by T1.1.1, whose `@theme`/`@utility` CSS had never been compiled by Tailwind inside the wave.** Result: `✓ Compiled successfully`, routes `○ /` and `○ /_not-found` static, project-wide `tsc --noEmit` and `eslint .` both exit 0. Compiled CSS confirmed to carry `--color-dock`, `--color-primer`, `--font-display`, `prefers-reduced-motion`, `data-reveal`, and `blueprint-grid`. |
| 5. Deviation reconciliation | PASS | T1.1.3's single reported deviation logged as row 10 and **independently confirmed** by an empirical probe (`react-hooks/set-state-in-effect` fires as `error`). T1.1.1 reported no deviations but five observations; those with audit relevance logged as rows 11 and 14. Two further findings discovered by this audit: row 12 (Tailwind v4 tree-shakes unreferenced `@theme` tokens — F6's silent-failure mode demonstrated live) and row 13 (variant state names are a documented but unenforced convention that fails silently on a typo). |

Deviations logged: 14 (4 discovered by wavecheck)

**Verdict: PASS.** Wave 1.2 may start. Two findings must be carried into
downstream context briefs rather than left in this report: deviation 10 (the
`useEffect` + `setState` idiom is lint-fatal, so every remaining client component
must avoid it) and deviation 13 (only `"hidden"`/`"shown"` state names work, and a
typo fails silently).

### Wavecheck 1.2 — PASS — 2026-08-18

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `format_version: 2`, `status: EXECUTING`. Wave 1.2 exists with one task. Waves 1.0 and 1.1 both carry PASS reports. |
| 2. Ownership | PASS | `fcf11c1 drydock(T1.2.1): Freeze site content and its types` → `site/content/copy.ts` only. Working tree clean after the executor's own full build; `out/` and `tsconfig.tsbuildinfo` gitignored, no unattributed changes. |
| 3. Forbidden | PASS | *Root `index.html` never opened* (executor states it; no `index.html` diff exists). *No invented metrics:* every note in `evidence` traces to `docs/compatibility.md` or `docs/verification-log.md`; no percentage, speed-up, or benchmark appears. *not-yet-verified column not softened:* A2b reads PENDING with the merge half explicitly unexercised, A3 reads MEASURING with "There are no numbers today, which is why the status still reads field benchmarks pending" — stronger than required. *F11 hygiene verified mechanically:* 0 apostrophes, 0 em-dashes in the whole file; angle brackets appear only in the TS `Record<>` generic and the intended `<org>` placeholder. *No JSX.* *`SectionMeta` imported, not redeclared.* *`meta` has exactly six lowercase keys and no `hero` entry.* |
| 4. Acceptance | PASS | Criterion executed verbatim by the auditor: full `next build`, `tsc --noEmit`, `eslint .`, and all 16 `grep -qF` literals → **exit 0**. |
| 5. Deviation reconciliation | PASS | Both reported deviations logged as rows 15 and 16; the first is a **planner defect** (the brief omitted root `README.md` from sanctioned sources while requiring literals from it) correctly flagged rather than absorbed. Four observations assessed; two logged as wavecheck-discovered findings that change downstream briefs — row 17 (unpinned copy shapes now binding on T2.1.4 and T1.3.1) and row 18 (the `agents` discriminator is weaker than M4 intended; the sound export check is counting `executor` occurrences ≥ 2). Row 19 records the pending `metadata` handoff. |

Deviations logged: 19 (6 discovered by wavecheck)

**Verdict: PASS.** Wave 1.3 may start. Carry rows 17 and 19 into T1.3.1's context
brief (the `problem`/`site` shapes and the `metadata` wiring), and row 18 into
T2.0.1's when Phase 2 opens.

### Wavecheck 1.3 — PASS — 2026-08-18

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `format_version: 2`, `status: EXECUTING`. Wave 1.3 exists with one task. Waves 1.0, 1.1, 1.2 all carry PASS reports. |
| 2. Ownership | PASS | `7f0d91d drydock(T1.3.1)` → exactly the ten owned files (`app/layout.tsx`, `app/page.tsx`, `components/Section.tsx`, and the seven `components/sections/*.tsx`). Nothing else; tree clean afterwards. |
| 3. Forbidden | PASS | *Root `index.html` never opened.* *Stubs stayed stubs:* the export contains exactly 7 `TODO` placeholders in real markup. *No copy authored:* headings, draft marks, and `metadata` all resolve from `content/copy.ts`; `grep` finds no user-visible literal in the ten files. *`<Hero/>` unwrapped and free of the string `Section`* — criterion clause verified. *No `useEffect` + `setState`* — `eslint .` exits 0, and that rule is an error in this repo. *No eighth section.* *Tokens and variants not redefined.* |
| 4. Acceptance | PASS | Criterion executed verbatim: `npm run build && npx tsc --noEmit && npm run lint && grep -qF "internal pilot" out/index.html && grep -q "data-reveal" components/Section.tsx && ! grep -q "Section" components/sections/Hero.tsx` → **exit 0**. Build compiled, 4/4 static pages. Independently confirmed: exactly 6 `data-reveal="true"` elements, each carrying Framer's inline `opacity:0;transform:translateY(24px)` — which demonstrates F5a's rationale rather than asserting it, since CSS cannot override an inline style without `!important`. |
| 5. Deviation reconciliation | PASS | Executor reported no deviations and eight observations — an unusually good ratio of self-flagged findings to claimed cleanliness. Four observations promoted to Deviation Log rows because they are load-bearing: row 20 (RSC flight payload double-counting, which **invalidates the fix for row 18**), row 21 (new font-override build warning → real CLS), row 22 (skip link refused rather than smuggled past a forbidden item), row 23 (four contract facts now binding on all seven Phase-2 tasks). |

Deviations logged: 23 (7 discovered by wavecheck)

**Verdict: PASS.** Phase 1's four waves are complete. T1.R.1 (fresh-context
quality review) may now run, then the Phase 1 human gate.

**Two items must not be lost between here and Phase 2:** row 20 rewrites
T2.0.1's normalisation contract (strip script bodies *before* matching, or every
counting assertion passes off the hydration payload), and row 23's four facts go
into all seven section briefs. Row 22 (skip link) is an accessibility basic that
§1 calls non-negotiable and is currently blocked by a frozen file — it needs a
human decision, not a wave.

### Wavecheck 1.4 — PASS — 2026-08-19

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `format_version: 2`, `status: EXECUTING`. Wave 1.4 exists with two tasks. Waves 1.0–1.3 all carry PASS reports; wave 1.R takes none by design (§10). |
| 2. Ownership | PASS | Two per-task commits, disjoint: `e29686f drydock(T1.4.1)` → `site/content/copy.ts`; `62b8a6f drydock(T1.4.2)` → `site/app/globals.css`. No file in both. Nothing outside `site/`. Tree clean. No `.git/index.lock` collision despite concurrent commits. |
| 3. Forbidden | PASS, with two changes adjudicated as authorised | *T1.4.1 additive-only:* the diff against frozen `fcf11c1` shows exactly one removed line — `export const install: { commands: string[] } = {` — replaced by a multi-line annotation adding `copyLabel`/`copyAriaLabel`/`copiedLabel`. The brief explicitly permitted "widen that export's type annotation rather than casting", so this is authorised, not a violation. **All nine pre-existing exports intact, and the two install command literals verified byte-identical** to the frozen version by diffing extracted literals. Zero apostrophes in the file. Root `index.html` not opened. *T1.4.2:* `--color-line` changed **value** `#1e405b` → `#35688c`, which the brief expressly allowed ("You MAY change their values"); no token **renamed** — all nine names still declared. No second accent: the only new hex in the diff is that blue. Touched nothing outside `globals.css`. |
| 4. Acceptance | PASS | T1.4.2's criterion run verbatim → exit 0; `stroke-dasharray: none !important` and `stroke-dashoffset: 0 !important` confirmed **inside the existing** `[data-reveal]` block in the same media query, no duplicate query. T1.4.1: eslint exit 0, all 11 new exports present, zero apostrophes; the typecheck clause **fails as literally written and passes under F12a** — the criterion was defective, not the work (deviation 27). Criterion text corrected in place with the correction noted. Contrast arithmetic re-computed independently from the WCAG luminance formula rather than accepted: `--color-line` vs ground 1.73:1 → **3.13:1** (claimed 3.13), major rule composited **2.59:1** (claimed 2.60), minor rule **1.39:1** (claimed 1.39), minor pitch 8px → 24px. |
| 5. Deviation reconciliation | PASS | T1.4.1's single deviation logged as row 27 — and it is the most valuable finding of the wave: it caught a plan-wide verification defect that would have failed all seven Phase-2 criteria, reported its own criterion UNVERIFIED rather than DONE, proved the failure predated its edit against `fcf11c1`, and refused to improvise a `declare module` shim, citing its forbidden list and contract rule 5. T1.4.2 reported no deviations; its observations are measurements, verified above. No unlogged deviations found in either diff. |

Deviations logged: 27 (8 discovered by wavecheck)

**Verdict: PASS.** Wave 1.5 may start. Note for T1.5.1: N1's spacing contract is
still open and belongs to it, and it must use the **F12a** typecheck form if it
runs one — its criterion uses the project-wide build, so it is unaffected.

### Wavecheck 1.5 — PASS — 2026-08-19

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `format_version: 2`, `status: EXECUTING`. Wave 1.5 exists with one task. Waves 1.0–1.4 all carry PASS reports. |
| 2. Ownership | PASS | `e14d552 drydock(T1.5.1)` → exactly `site/app/layout.tsx` and `site/components/Section.tsx`. Confirmed it touched neither `app/page.tsx` nor anything under `components/sections/`. Tree clean; build artifacts gitignored. |
| 3. Forbidden | PASS | *No copy authored:* zero inline text nodes in either file; `layout.tsx` imports `{ sheet, site }` from `@/content/copy` and every rendered string traces there. *Composition contract intact:* default export, `<motion.section>` still owns `id`, `data-reveal`, the draft mark and the `<h2>`. *No `<h1>` added* — export still has 0, as Decision 24 requires at this stage. *No `useEffect` + `setState`* — `eslint .` exits 0. *No token renamed.* *Root `index.html` not opened.* |
| 4. Acceptance | PASS | Criterion run verbatim → exit 0. Independently confirmed beyond the criterion: all six `sheet` fields present in the export (`DRYDOCK`, `GENERAL ARRANGEMENT`, `SHEET 1 OF 1`, `REV 0.3.1`, `NOT TO SCALE`, `2026-08-18`); skip link is the first focusable element in DOM order with `href="#content"` matching `<main id="content">`; `Section.tsx` wraps children in exactly one `<div className="mt-8">`. |
| 5. Deviation reconciliation | PASS | All three reported deviations logged as rows 28–30, plus two executor-flagged findings promoted to rows 31 and 32 because they bind on Phase 2. **Audited one imprecision in the report:** it claimed the skip link is "the first element in `<body>`" — the first element is actually React's empty `<div hidden>` suspense marker. Functionally correct (hidden elements are not focusable and not in the a11y tree) but loosely worded, so the precise finding is recorded here rather than inherited. **Also audited a leak N2 predicted:** the skip link uses `transition-transform`, a timing utility outside `lib/motion.ts`. It is in the shell, not a section file, so the Decision 22 ban does not reach it by design — and the reduced-motion block neutralises it via a universal `transition-duration: 0.01ms !important`, verified present in the compiled CSS along with all six restored properties. |

Deviations logged: 32 (8 discovered by wavecheck)

**Verdict: PASS.** Phase 1's six waves are complete. T1.R.1 must now re-run — its
first pass REJECTED, and the Phase 1 gate requires an APPROVED verdict.

**Carry into Phase 2 briefs, from this wave alone:** row 31 (name one internal
rhythm value in all six section briefs, or N1 reappears one level down), row 32
(the trim border means nothing can bleed to the viewport edge — brief Hero
explicitly), and the pinned `mt-8` contract (sections must not add a top margin
to their first child).

### Wavecheck 1.6 — PASS — 2026-08-19

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `format_version: 2`, `status: EXECUTING`. Wave 1.6 exists with two tasks. Waves 1.0–1.5 all carry PASS reports. |
| 2. Ownership | PASS | Two per-task commits, disjoint: `e8fb04b drydock(T1.6.1)` → `site/app/globals.css`, `site/lib/motion.ts`; `241bf7d drydock(T1.6.2)` → `site/app/layout.tsx`. T1.6.1 touched nothing under `layout.tsx`, `components/`, or `content/` (0 matches). No `index.lock` collision. |
| 3. Forbidden | PASS | All nine design tokens and all nine pre-existing `lib/motion.ts` exports intact. Exactly **one** `prefers-reduced-motion` query — no second one added. T1.6.2's diff is a single attribute (`<main id="content">` → `<main id="content" tabIndex={-1}>`), adds no `<h1>` (0), and touched no sibling file. Root `index.html` not opened by either. |
| 4. Acceptance | PASS | Both criteria run verbatim → exit 0. **Verified in the compiled stylesheet, not just the source:** `[data-reveal]` resolves to `opacity:1!important;clip-path:none!important;width:auto!important;transform:none!important` with **no stroke properties**, and `[data-reveal-path]` to `stroke-dasharray:none!important;stroke-dashoffset:0!important`. `<main id="content" tabindex="-1">` present in the export. `waterlineReveal` is `CLIP_HIDDEN → CLIP_SHOWN` with `t(REVEAL, WATERLINE_DELAY)`, `WATERLINE_DELAY = 1.0` as a named constant rather than a bare literal, state names `"hidden"`/`"shown"`. Full gate green: build, `tsc --noEmit`, `eslint .` all exit 0. |
| 5. Deviation reconciliation | PASS | Both tasks reported no deviations. T1.6.1's `observations` surfaced a genuine new hazard — logged as row 37 — that the protected `heroSequence.waterline` survives as a footgun beside its replacement. It flagged that the wiring choice fell outside its owned files rather than reaching into `components/` to fix it. |

Deviations logged: 37 (11 discovered by wavecheck)

**Verdict: PASS.** Phase 1's seven waves are complete.

**Blocker closure, verified by the orchestrator (no third fresh-context review —
human decision, deviation 36):**
- **B1 CLOSED** — T1.R.1 enumerated the inventory against all seven sections and
  found no task blocked for want of a string.
- **B2 CLOSED** — T2.1.1's brief now cites Decisions 23–26; its sketch specifies
  the dashed overlay revealed by `waterlineReveal`, names the
  `heroSequence.waterline` trap, and its criterion asserts `waterlineReveal` is
  present while `drawLine`-near-waterline and `heroSequence.waterline` are absent.
- **B3 CLOSED** — verified in compiled CSS in wavecheck 1.4 and re-verified here
  after the split.
- **B4 CLOSED** — T2.0.1's brief cites Decision 24, its sketch carries the
  exactly-one-`<h1>` assertion, its good fixture contains `<h1>Drydock</h1>` so the
  assertion is itself exercised, and T2.1.1's criterion greps `<h1`.
- **B5 CLOSED** — attribute split verified in compiled CSS above.
- **D CLOSED** — by T1.R.1's own re-assessment.
- Also delivered from earlier findings that had never reached the harness spec:
  deviation 20's flight-payload stripping and deviation 18's `executor` ≥ 2
  discriminator are now written into T2.0.1's sketch with the normalisation order
  spelled out.

### Wavecheck 2.0 — PASS — 2026-08-19

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `format_version: 2`, `status: EXECUTING`. Wave 2.0 exists with one task. All seven Phase 1 waves carry PASS reports; Phase 1's human gate is pending but Wave 2.0 is Phase 2's contracts wave and was opened on explicit human instruction. |
| 2. Ownership | PASS | `bbd08ae drydock(T2.0.1)` → exactly `site/scripts/assert-copy.mjs` and `site/package.json`. Tree clean. |
| 3. Forbidden | PASS | *Zero dependencies:* imports are `node:fs`, `node:path`, `node:url` only. *No component modified* — the real export fails 13 assertions and the script was not weakened to accommodate it. *`lint` script unchanged* (`eslint .`). *No `dev`/`start` scripts added.* *No test runner.* *`lib/` never scanned* — `SECTIONS_DIR` resolves to `components/sections` from the script's own location. *Root `index.html` not opened.* |
| 4. Acceptance | PASS | Two-fixture criterion run verbatim → exit 0. The bad fixture yields **15 individually named failures**, not a bare exit code. `verify` wired exactly as specified. **Independently proven by the auditor rather than accepted:** script-body stripping is real (`TODO` 14 raw → 7 stripped, the measured 2× duplication); and a probe section violating all four motion rules produced four distinct named failures — missing `useMotionSafe`, missing `data-reveal`, a `duration:` timing literal, and `heroSequence.waterline` — confirming each rule fires independently rather than as one lump. Probe removed; tree clean. |
| 5. Deviation reconciliation | PASS | Executor reported no deviations and five observations, three of which were promoted to Deviation Log rows 38–40 because they bind on Phase 2. Row 40 is the notable one: it flagged, unprompted, that the `data-reveal`/`data-reveal-path` pairing its own harness enforces is **not** machine-checkable — B5's residue — rather than implying coverage it does not have. |

Deviations logged: 40 (12 discovered by wavecheck)

**Verdict: PASS.** Wave 2.1 may start — four parallel section tasks. Carry into all
seven section briefs: the `mt-8` spacing contract and `space-y-6` internal rhythm
(deviations 31, 23), the trim border forbidding full-bleed (row 32), default
exports only (row 23), the `heroSequence.waterline` footgun (row 37), and the
case-sensitivity constraints in row 39.

### Wavecheck 2.1 — PASS — 2026-08-19

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `status: EXECUTING`. Wave 2.1 exists with four tasks. Waves 1.0–1.6 and 2.0 all carry PASS reports. |
| 2. Ownership | PASS | Four per-task commits, each touching exactly one file, all disjoint: `5f171ea` → `Hero.tsx`, `ba6a854` → `Evidence.tsx`, `3781034` → `Lifecycle.tsx`, `e4c708f` → `Problem.tsx`. No file in two commits. Tree clean. **No `.git/index.lock` collision across four concurrent commits.** Three executors independently reported seeing siblings' files modified in `git status` and correctly left them unstaged. |
| 3. Forbidden | PASS | *No full-bleed:* zero `min-h-screen`/`w-screen` across all seven section files. *Hero exempt (Decision 18):* imports and renders no `<Section>` (0 matches); its single `Section` string is a doc comment. *Six sections render their own `<Section meta={meta}>`* — Problem, Evidence, Lifecycle each exactly 1. *No timing literals* in any section — all four `(duration|delay):|duration-[0-9]` greps clean. *Server/client split correct:* Problem and Evidence carry no `"use client"`; Lifecycle and Hero do. *No `useEffect`* in Lifecycle despite holding disclosure state. *Lifecycle toggles visibility, not presence* — zero conditional-render patterns, so all six details are in the static markup. *Problem wraps no pinned prose in inline markup*, so the `drift` literal stays an unbroken text node. *Root spacing contract honoured by all three* — every root inside `<Section>` uses `space-y-6` with no top margin; the `mt-1`/`mt-2`/`mt-3` uses are intra-row spacing, not the shell's h2→body gap. |
| 4. Acceptance | PASS | All four criteria run verbatim → exit 0. **`npm run verify` — the real gate, bare form so all four motion checks run — now fails on exactly 2 literals, down from 13, and both belong to sections that do not exist yet:** `Deviations logged: 1 (1 discovered by wavecheck)` (Terminal, T2.2.1) and `one-file change` (FAQ, T2.2.3). The harness is discriminating precisely rather than passing vacuously. Heading contract satisfied: **exactly one `<h1>`**, containing `Drydock`. |
| 5. Deviation reconciliation | PASS | T2.1.2, T2.1.3, T2.1.4 reported no deviations; T2.1.1 reported two judgement calls, logged as row 42 and both verified correct. One finding discovered by this audit and logged as row 41 — the no-JS visibility gap, which no task violated and which belongs to Phase 1's shell. |

**The uncheckable pairing (deviation 40) was read by hand and is CORRECT:** the solid hull carries `data-reveal-path` with `heroSequence.hull` (`pathLength`); the dashed waterline carries `data-reveal` only, with `waterlineReveal` (clip/opacity) and its own `strokeDasharray="10 8"`. Exactly one `data-reveal-path` in the export. This is the pairing B5 required and the harness structurally cannot verify — an auditor's eye was the only check available, and the plan said so in advance.

Deviations logged: 42 (13 discovered by wavecheck)

**Verdict: PASS.** Wave 2.2 may start — Terminal, Install, FAQ. Row 41 (no-JS
blank page) is deferred to a single Phase-2 repair rather than its own wave;
it needs `layout.tsx` or `globals.css`, which no Phase-2 task owns.

### Wavecheck 2.2 — PASS — 2026-08-19

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `status: EXECUTING`. Wave 2.2 exists with three tasks. Waves 1.0–1.6, 2.0 and 2.1 all carry PASS reports. |
| 2. Ownership | PASS | Three per-task commits, each one file, all disjoint: `43ee240` → `Terminal.tsx`, `3fe9fa4` → `Install.tsx`, `781c3f2` → `Faq.tsx`. Tree clean. No `index.lock` collision across three concurrent commits. |
| 3. Forbidden | PASS | Swept across all seven section files: **0** with `min-h-screen`/`w-screen`, **0** with `useEffect`, **0** with timing literals, exactly **6** rendering their own `<Section meta={meta}>` (Hero correctly exempt). `data-reveal-path` appears only in `Hero.tsx` — no other section misuses the path attribute, so no dashed stroke is at risk. Terminal did not invent or edit transcript lines. FAQ used no conditional rendering and no inline markup, so `one-file change` survives as an unbroken text node. Install left `<org>` unresolved and added no third command. Root spacing contract honoured by all three: every root inside `<Section>` uses `space-y-6` with no top margin. |
| 4. Acceptance | PASS | All three criteria run verbatim → exit 0. **`npm run verify` PASSES for the first time: `14 literals, 4x executor, 1 h1, motion contract`** — build, `tsc --noEmit`, `eslint .` and every copy assertion green, with the motion checks running (bare form, not fixture mode). Verified beyond the criteria: **all twelve transcript lines are present in the export verbatim with the 31-column gutter intact**, confirmed by stripping script bodies and tags and matching each line; and the caption renders the literal framing *"illustration, not a captured session: what wavecheck reports for the 2026-08-18 adversarial dry-run"* — the honesty requirement Decision 13 exists for. |
| 5. Deviation reconciliation | PASS | Terminal and FAQ reported no deviations; Install reported none and three observations, all sound — it chose "confirmation persists until the next copy" over importing a reset delay, avoiding both a timing literal and `useEffect`; it added no Framer variant of its own since the shell's reveal already covers entrance; and its clipboard fallback uses the standard dependency-free `execCommand` path for non-secure origins. One observation promoted to row 43: Terminal's reliance on variant-context propagation is a real fragility worth tracking. Also noted, not a violation: FAQ read the committed `Problem.tsx`/`Evidence.tsx` for visual consistency though they were not in its brief — reading a committed sibling is permitted (only *touching* is forbidden) and produced a more coherent result. |

Deviations logged: 43 (13 discovered by wavecheck)

**Verdict: PASS.** All seven sections are built and the full gate is green.

**Remaining in Phase 2:** T2.3.1 integration (its criterion is `npm run verify`,
already passing), the deviation 41 no-JS repair (needs `layout.tsx` or
`globals.css`, owned by no Phase-2 task), then T2.R.1's fresh-context review and
the human browser gate — which must cover the four things no gate can check:
the `data-reveal`/`data-reveal-path` pairing (row 40), Terminal's propagation
fragility (row 43), the unpinned `opsz` axis and missing `size-adjust` metrics
(rows 14, 21), and whether the grid reads as a drafting grid (verdict D).

### Wavecheck 2.3 — PASS — 2026-08-19

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `status: EXECUTING`. Wave 2.3 exists with one task (`T2.3.2`). Waves 1.0–1.6, 2.0, 2.1, 2.2 all carry PASS reports. |
| 2. Ownership | PASS | `2195438 drydock(T2.3.2)` → `site/app/layout.tsx` only. Tree clean. |
| 3. Forbidden | PASS | **The load-bearing prohibition held.** The `<noscript>` CSS mirrors the reduced-motion block's two-rule split exactly: `[data-reveal]` restores `opacity`/`transform`/`clip-path`/`width`; `[data-reveal-path]` restores those **plus** `stroke-dasharray`/`stroke-dashoffset`. Parsed the authored rules and confirmed no stroke property appears under any non-path selector — **B5 was not reintroduced**, so the hero's dashed waterline keeps its `strokeDasharray="10 8"`. The diff is purely additive (one comment, one `<noscript>`); skip link, sheet frame, title block and `<main id="content" tabIndex={-1}>` are byte-identical. No `<h1>` added — export still has exactly 1. Nothing outside `layout.tsx` touched. |
| 4. Acceptance | PASS | Criterion run verbatim → exit 0, with `npm run verify` reporting `14 literals, 4x executor, 1 h1, motion contract`. Verified beyond the criterion: exactly **one** `<noscript>` in the export, positioned at byte 2185 — **before** the first inline `opacity:0` at byte 3329, so the rule is parsed before the elements it restores. Sheet fields, skip link and focus target all still present. |
| 5. Deviation reconciliation | PASS | No deviations reported. Its three observations were all independently reproduced by this audit: the stroke properties are confined to `[data-reveal-path]`, no extra `<h1>` was added, and the change is additive only. |

Deviations logged: 44 (13 discovered by wavecheck)

**Verdict: PASS.** Deviation 41 is closed. Wave 2.4 (integration) may start.

**Note on what remains unverifiable here:** the no-JS path was verified
structurally — the rule exists, is correctly split, and precedes the content it
restores — but **not** by loading the page with JavaScript disabled. That is a
browser check, and it belongs on the human gate's list alongside the four items
already there.

### Wavecheck 2.4 — PASS — 2026-08-19

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `status: EXECUTING`. Wave 2.4 exists with one task (`T2.3.1`, id preserved across its wave move per deviation 44). Waves 1.0–1.6, 2.0–2.3 all carry PASS reports. |
| 2. Ownership | PASS | `6c5cb6a drydock(T2.3.1)` → `docs/plans/001-drydock-homepage.md` only, one Progress-log row appended. **Zero files under `site/` touched** — the constraint that matters for an integration task, since a verifier that edits what it verifies is worthless. Tree clean. |
| 3. Forbidden | PASS | Nothing under `site/` modified; no assertion "fixed"; only the Progress log edited. |
| 4. Acceptance | PASS | `cd site && npm run verify` exit 0. All four stages green: `next build` (745ms), `tsc --noEmit` (1296ms), `eslint .`, `assert-copy`. Final line: `assert-copy: PASS — out/index.html (14 literals, 4x executor, 1 h1, motion contract)`. Re-run independently by the auditor with identical output. |
| 5. Deviation reconciliation | PASS | No deviations. It correctly identified the Turbopack `yarn.lock` warning as pre-existing (deviation 8) rather than reporting it as new, and noted that its independent result matched the orchestrator's prior run exactly — the point of the task being independent execution rather than confirmation. |

Deviations logged: 44 (13 discovered by wavecheck)

**Verdict: PASS.** All nine Phase 2 implementation waves are complete and the
assembled site passes the full gate. T2.R.1 (fresh-context quality review) may now
run, then the Phase 2 human gate.

### Wavecheck 2.5 — PASS — 2026-08-19

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `status: EXECUTING`. Wave 2.5 exists with three tasks. All prior waves carry PASS reports. |
| 2. Ownership | PASS | Three per-task commits, each one file, disjoint: `9243eac` → `lib/motion.ts`, `6986006` → `app/globals.css`, `0e5b22a` → `components/sections/Lifecycle.tsx`. Tree clean. No `index.lock` collision. |
| 3. Forbidden | PASS | T2.5.1's diff is **exactly two deletions** (`pathLength: 1` from each `NO_MOTION` state) and nothing else; all ten `lib/motion.ts` exports intact; `pathLength` still present on `drawLine` and `heroSequence.hull`, which use it legitimately on solid strokes. T2.5.2 kept `[data-reveal]` at **zero** stroke declarations — the B5 guard held — and did not merge the two selectors. T2.5.3 preserved the true half of the comment, all six details in markup, `aria-expanded`, `aria-controls`, real buttons, and added no `useEffect`. No task touched a sibling's file; none read root `index.html`; none ran a project build inside the wave. |
| 4. Acceptance | PASS | All three criteria run verbatim → exit 0, and the full gate still reports `assert-copy: PASS (14 literals, 4x executor, 1 h1, motion contract)`. **Critically, the fixes were then measured in headless Chrome under forced reduced motion — because greps are precisely what missed this defect class through twelve prior wavecheck passes.** Control confirmed first: `matchMedia('(prefers-reduced-motion: reduce)').matches === true`. Results: waterline computes **`10px, 8px`** (C1 closed — was `1px, 1px`, solid); **zero** elements compute `1px, 1px` (C2 closed — the cradle blocks and superstructure no longer stipple); hull computes **`opacity: 1`, `stroke-dasharray: none`** (M1 closed — was invisible on the CSS-only path); and **zero** text-bearing elements compute `opacity: 0`. |
| 5. Deviation reconciliation | PASS | No deviations reported by any of the three. T2.5.1 confirmed the corollary it was asked to check before committing, and added a nuance worth keeping: `NO_MOTION`'s `opacity: 1` is applied by Framer as an inline style regardless of any CSS rule, so hull visibility under reduced motion **with JS** never depended on `pathLength: 1` — M1's defect was specific to the CSS-only path. T2.5.3 chose option (a), correcting the claim rather than rebuilding the disclosure, and justified it: §1 never required no-JS interaction, the blank-page defect is fixed elsewhere, and rewriting a verified-accessible widget carried more risk than the honesty fix warranted. It recorded that the underlying gap is now documented rather than removed. |

Deviations logged: 48 (17 discovered by wavecheck)

**Verdict: PASS.** C1, C2, M1 and M2 are closed and measured. Wave 2.6 may start —
it makes this browser measurement a repeatable script rather than a one-off, since
no other gate in the plan can see this defect class.

**Auditor's note on the plugin, not the plan:** the wavecheck skill instructs
"Append to the plan under §8". In a v2 plan §8 is *Open questions*; the format
contract lists Wavecheck reports at position 14. This report was appended to the
`## Wavecheck reports` section, which is plainly the intent. The stale section
reference in `drydock/skills/wavecheck/SKILL.md` should be corrected at reconcile.

## Progress log

| Date | Task | Result | Notes |
|------|------|--------|-------|
| 2026-08-18 | — | Plan drafted (rev 1) | Round-1 pressure test REJECTED: 9 CRITICAL, 9 MAJOR, 5 MINOR |
| 2026-08-18 | — | Revised (rev 2) | Round-1 fixes applied; 3 scope-creep findings rejected with reasons |
| 2026-08-18 | — | Revised (rev 3) | Round-2 pressure test REJECTED: 3 CRITICAL, 9 MAJOR, 14 MINOR. All confirmed findings fixed; 3 accepted-as-is with reasons (§11). Tasks renumbered per Decision 21 — legitimate while DRAFT and unexecuted |
| 2026-08-18 | — | **APPROVED by sandeep** | Human approval given without a round-3 pressure test — a deliberate choice recorded per §11's note to the approver. Residual risk accepted: rev 3's fixes have not been adversarially reviewed, so Wave 1.0's real toolchain contact is the first check on them |
| 2026-08-18 | — | Status → EXECUTING | Orchestration begun |
| 2026-08-18 | T0 | Baseline confirmed | Head c664671, working tree clean, node v22.23.1, npm 11.18.0, no site/, no package.json |
| 2026-08-18 | T1.R.1 | **REJECTED** | Fresh-context quality review of `git diff c664671..HEAD -- site/` (25 files, ~10 real source files). Phase 1 is well-built work — clean, honest, disciplined, and the deviation log is unusually candid. It is rejected for exactly one reason: **`content/copy.ts` is frozen and does not contain strings that at least three Phase-2 tasks are required to render and forbidden to author.** That is not one bug, it is deviation 22 (the skip link) generalised, and it will fire in three parallel tasks at once, each independently choosing between violating a forbidden item and reporting BLOCKED. Four blocking findings (B1–B4) below, ten non-blocking (N1–N10), and a design verdict (D). Nothing under `site/` was modified. |
| 2026-08-18 | T1.R.1 | **B1 BLOCKING — the copy inventory is incomplete, and it multiplies by three** | F1a says every string a section renders must have a named export in `copy.ts`, "no exceptions". Nobody inventoried the strings the seven sections actually render before freezing it. Missing, per task: **T2.1.2 Evidence** — the two column headings (§1 requires a "two-column verified / not-yet-verified board"; `verified`/`notVerified` are object keys, not labels) and the visible link text for `selfAuditHref` (a link needs text; only the href exists). **T2.1.1 Hero** — the SVG `aria-label` its own sketch mandates, plus the "bow draft marks" and "wave labels under the keel" the sketch requires as drawn text. **T2.2.2 Install** — the copy button label, its `aria-label`, and the copied confirmation its sketch requires via `aria-live`. Both Hero and Evidence carry the hard prohibition "Hardcoding any copy", so those two are structurally blocked, not merely under-specified. Fix before Phase 2: one task owning `copy.ts` that adds the missing strings (and the skip-link string from deviation 22) in a single edit — not seven executors each guessing. |
| 2026-08-18 | T1.R.1 | **B2 BLOCKING — §1's dashed waterline cannot be built with the frozen motion contract** | §1's signature requirement is a waterline that "draws in as a dashed orange line". Traced through the installed `motion-dom` (`dist/es/render/svg/utils/path.mjs`): `pathLength` is implemented by overwriting `stroke-dasharray` with exactly one dash and one gap — `` `${length} ${spacing}` `` with `spacing` defaulting to 1 — and setting `pathLength="1"`. So on any element `drawLine` or `heroSequence.waterline` touches, an author `stroke-dasharray="6 4"` is destroyed every frame, and the finished state is `1 1` on a normalised length, i.e. a **solid** line. Dashed-and-drawing-on are mutually exclusive on one element in this library. `lib/motion.ts` exposes no `pathSpacing` and no dash-compatible variant, `components/sections/*.tsx` may contain no timing literal, and both files are frozen. T2.1.1 therefore has three moves and no guidance: silently drop the dash and fail §1, invent a two-path mask/clip rig, or break the timing ban. It will guess. Decide it in the brief (a dashed overlay path revealed by `revealClip` is the option that needs no frozen-file change) or reopen `lib/motion.ts`. |
| 2026-08-18 | T1.R.1 | **B3 BLOCKING — the F5a restore is incomplete for the one channel the signature element uses** | I tested the specificity claim rather than trusting it: real compiled CSS (`out/_next/static/chunks/1va1t1nxl74fp.css`) + the real inline styles, headless Chrome with `--force-prefers-reduced-motion`. **The claim holds for what it covers** — inline `opacity:0` computes to `1`, inline `transform:translateY(24px)` to `none`, inline `clip-path:inset(0 100% 0 0)` to `none`; control run without the flag keeps `0` / `matrix(1,0,0,1,0,24)` / `inset(...)`. Author `!important` beats the style attribute, as the cascade spec says. **But an SVG path carrying Framer's `pathLength:0` output (`stroke-dasharray="0 1"`, verified above) computes to `0px, 1px` under forced reduced motion** — the `[data-reveal]` block restores `opacity`/`transform`/`clip-path`/`width` and says nothing about `stroke-dasharray`/`stroke-dashoffset`. So every `pathLength` element is a zero-length dash: invisible. That is the hull outline and the waterline labelled `APPROVED (HUMAN-ONLY)` — §1's #1 requirement and the exact "still, complete, and VISIBLE" clause. Latent today (the 6 current `data-reveal` elements are all HTML), detonates at T2.1.1. It is also permanent, not transient, for a no-JS visitor, since `useMotionSafe` only reaches `NO_MOTION` after hydration. Fix is one line inside the existing block in the frozen `globals.css`: `stroke-dasharray:none!important;stroke-dashoffset:0!important`. Same species as deviations 12/13/18/20 — a mistake that produces no error — and it is the one that was still unspotted. |
| 2026-08-18 | T1.R.1 | **B4 BLOCKING — the export has no `<h1>`, and nothing in any contract asks for one** | Verified against `out/index.html`: six `<h2>` elements, zero `<h1>`. Decision 18 correctly says Hero has no `<h2>`, but no contract, brief, or criterion says Hero renders `hero.headline` as `<h1>` — so the document's heading order starts at level 2 and the page has no accessible name, and T2.1.1 decides it unbriefed. Combined with deviation 22's still-open skip link (confirmed: `grep -ci skip out/index.html` = 0), §1's "accessibility basics are non-negotiable" is currently unmet in two places by omission rather than by decision. Both fixes are brief-and-`copy.ts` sized, not architectural. Everything else in a11y checks out and is better than required — measured, not eyeballed: `ink`/`dock` **15.97:1**, `ink-dim`/`dock` **7.31:1** (AAA), `primer`/`dock` **6.54:1**, `ink-dim`/`panel` 6.47:1, `primer`/`panel` 5.79:1, `ink-dim` over the real composited `bg-panel/70` (`#0a1c2d`) 6.74:1. All AA, most AAA, including the 11px `--text-mark` labels. `:focus-visible` gives a 2px primer ring at 6.54:1 against the ground, well past the 3:1 non-text floor. |
| 2026-08-18 | T1.R.1 | **N1–N3 non-blocking: three more silent-failure surfaces, all fixable in a context brief** | **N1** `Section.tsx` renders `{children}` immediately after `<h2 className="mt-4 ...">` with no wrapper and no spacing contract. Six parallel executors will each invent the gap (`mt-6`/`mt-8`/`space-y-4`), and no gate looks at layout — the harness checks literals. Pin one class in the shared brief. **N2** the Decision 22 ban regex `(duration\|delay):\|duration-[0-9]` is asymmetric and porous: it catches `duration-150` but **not `delay-150`**, and misses `transitionDuration:` (capital D), `setTimeout(f, 2000)`, bare `transition-all` / `transition-colors` (Tailwind's 150ms default), `animate-*`, and `ease-*` — each verified by running the regex. Install's copied-state reset and Lifecycle's disclosure are precisely the two places timing will leak outside `lib/motion.ts`. Widen it in T2.0.1. **N3** `@theme` overrides `--font-mono` but leaves `--font-sans` as Tailwind's system stack (confirmed in the emitted `:root`), so a section writing `font-sans` silently gets Helvetica instead of Archivo — no error, wrong font. Also note `--text-note`, `--text-body`, `--text-lead`, `--text-sheet` are currently tree-shaken out of the compiled CSS (deviation 12's species, benign until mistyped) while all nine contract tokens now emit, since `layout.tsx` finally references `panel` and `ink-dim`. |
| 2026-08-18 | T1.R.1 | **N4–N10 non-blocking: dead surface, duplication, and debris** | **N4** `@utility blueprint-grid` compiles to nothing — `grep -c '\.blueprint-grid'` on the emitted CSS is **0** — because `@layer base body` applies `var(--blueprint-grid)` directly and no element uses the class. Unrequested and now provably dead; deviation 11's other flag, `fontVariables`, earned its keep (`layout.tsx` uses it). **N5** `site.version` is consumed by nothing, and `0.3.1` is also baked as a literal into `hero.badges[1]` — a version bump needs two edits. **N6** `site.description` and `hero.sub` are byte-identical: the hero's subhead is the meta description, a 46-word single sentence with four comma-spliced clauses. It is the least dry sentence on a page whose brief is "dry and honest", and it is the second thing a visitor reads. **N7** `evidence.verified[0].id` is `"--"` (deviation 16), so the board will render a row visibly labelled `--`; give it a real id or have Evidence suppress an empty one. **N8** `site/README.md` is unmodified `create-next-app` boilerplate telling the reader to run `npm run dev` / `yarn dev` / `pnpm dev` / `bun dev`, all four removed by deviation 5. **N9** Lifecycle's disclosure has no variant at all; `revealClip` is the only plausible fit and no brief names it. **N10** ~~deviation 8's `yarn.lock` warning did not reproduce~~ — **my claim here was wrong and is retracted.** I read it off a `tail -25` of the build output that had truncated it. The orchestrator re-ran `rm -rf .next out && npm run build` and the Turbopack workspace-root warning reproduced (2 matching lines). **Deviation 8 is live, not stale**, alongside the deviation 21 font-override warning, and `turbopack.root` still wants pinning. The rest of this row stands. |
| 2026-08-18 | T1.R.1 | **D — design verdict against §1: palette good, type idiom excellent, shell thin and now frozen** | **Palette (judged as design, not as a port):** it works. `#061320` is a genuinely deep harbour blue rather than a generic slate, the five cool tokens are one family, `#ff6a1f` is a credible hull-primer rather than a UI orange, and the single-accent rule is honoured — no second warm hue exists in the file. **One real defect, and it is in the brief's central motif:** `--color-line` is **1.73:1** against `dock`, and the grid draws it through `color-mix` at 55% and 18%, giving **1.30:1** and **1.07:1**. The 18% minor rule is below the threshold of perception on most displays, and the 8px minor pitch is dense enough to read as noise or moiré rather than as a drafting grid where it is visible at all. `border-t border-line` is also the only separator between sections, at 1.73:1. The colour is right; the alphas and the pitch are wrong. **Type:** the draft-mark scale is the best idea in the diff — `DRAFT 2M -- THE PROBLEM` with metric increments as section numbers is authentically naval, not a landing-page move, and 11px at 0.18em tracking in IBM Plex Mono is the correct register for it (and it works: the emitted `.text-mark` carries both `--text-mark--line-height` and `--text-mark--letter-spacing`). Scale is sensibly spaced; the only gap is between `title` (max 44px) and `sheet` (max 104px), which is fine for a page with one display headline. **Shell:** this is where it falls short of "reads as an engineering drawing, not a landing-page template". The chrome is a full-bleed status strip plus a centred `max-w-5xl` column with hairline top rules — no sheet frame, no title block, no scale or revision block, no sheet numbering, no footer. Those are the features that make a drawing read as a drawing, and they live in `layout.tsx` and `Section.tsx`, both now frozen and owned by no Phase-2 task. So the shell verdict is already final, and as it stands it is a competent dark landing page with a grid background. Not a contract defect — a design ceiling that has been locked in, and worth a human decision now rather than a regret at the Phase 2 gate. |
| 2026-08-18 | orchestrator | **Correction to T1.R.1's N10 — the only finding of 15 that did not hold** | N10 claimed deviation 8's `yarn.lock` / `turbopack.root` warning "did not reproduce" on a clean build. It does: `rm -rf .next out && npm run build` emits 2 matching lines, re-verified after the review. **Deviation 8 is live, not stale.** The rest of N10 stands (the deviation 21 font-override warning is real and also appears). Recorded as an annotation rather than an edit to the reviewer's row, to keep the Progress log append-only. All four blocking findings and the other non-blocking findings were independently re-verified by the orchestrator and hold: 0 `<h1>` / 6 `<h2>` / 0 skip-link matches in the export; the `[data-reveal]` block restores only `opacity`/`transform`/`clip-path`/`width` with no `stroke-dasharray`; `motion-dom/dist/es/render/svg/utils/path.mjs` drives `pathLength` through `stroke-dasharray`; and the ban regex catches `duration-150` but misses `delay-150`, `transitionDuration:`, `transition-all`, and `setTimeout`. |
| 2026-08-18 | T1.R.1 | **Affirmed, so it is not re-litigated later** | Two things I checked because they are clever enough to be wrong, and they are right. **Deviation 10's replacement idiom is correct:** `useSyncExternalStore(neverChanges, () => true, () => false)` renders the server snapshot through hydration, and React's post-mount store check forces the re-render — no effect, no `set-state-in-effect` violation, no mismatch, and `null` correctly counts as motion-allowed so the export carries all text (F5). **F5a's core mechanism is empirically sound, not just spec-plausible** — see B3 for the Chrome measurement; it is incomplete, not wrong. Also confirmed live: deviation 20's double-count is real and exactly 2x (`TODO` 14 raw / 7 with `<script>` bodies stripped; `internal pilot` 2 / 1), so T2.0.1's normalisation rewrite is mandatory, and stripping script bodies is sufficient. Scope creep is otherwise minimal — the `--text-*` scale and the grid tokens are in T1.1.1's stated remit, and I found nothing in the diff §1 does not want beyond N4, N5, and N8. **Recommended path:** one `copy.ts` task (B1 + skip link), one `globals.css` line (B3), one brief decision on the waterline (B2) and the `<h1>` (B4), then re-review. All four are small; none needs `/drydock:replan` to be a rewrite. |
| 2026-08-19 | T1.R.1 (re-run) | **REJECTED** | Re-review after repair waves 1.4 and 1.5. The repairs themselves are good work: **B1 CLOSED, B3 CLOSED, D CLOSED** (details below), and the mechanical facts re-verified by the orchestrator all hold. It is rejected on **B2 and B4, which were both "fixed by contract" in §7 and then never delivered into a single task block** — the exact failure mode this plan already named in Decision 17 ("stating it only in §10 delivered it to nobody"). T2.1.1's context brief (line 887) lists Decisions 5, 9, 18, 20, 22, 17: **neither 23 nor 24**. T2.0.1's brief (line 845) lists Decisions 9, 13–15, 20, 22: **not 24**, and its implementation sketch contains no `<h1>` assertion. Worse than an omission: **T2.1.1's implementation sketch still reads "waterline `drawLine` (`pathLength` 0→1, dashed, primer)"** — the literal construction Decision 23 exists to forbid, still sitting in the one document the executor is actually handed. An executor following its brief builds precisely the defect B2 found. This is not a code repair; it is three brief edits, one harness assertion, and one CSS-scoping decision. Nothing under `site/` needs to change. |
| 2026-08-19 | T1.R.1 (re-run) | **B1 CLOSED — inventory enumerated task by task against what each of the seven must render** | Enumerated independently rather than accepted from the export count. **Hero** needs headline / thesis / sub / waterlineLabel / badges / svgAriaLabel / draftMarks / keelLabels — its sketch names exactly dock floor, cradle blocks, hull outline, superstructure, bow draft marks, wave labels, waterline label; every text node has an export, the rest is geometry. **Problem** lead / modes[title, body] / coda — present. **Evidence** verifiedHeading / notVerifiedHeading / rows[id, label, note] / selfAuditHref / selfAuditLinkText — present; the two headings and the link text were the actual B1 gap and are both there. **Terminal** caption / lines[text, tone] — present; no prompt or window-chrome string exists, and none is required by the sketch, so rendering output-only is the compliant path. **Lifecycle** pieces[name, kind, invocation, detail] — present, and `kind` is what the harness matches `executor` through. **Install** commands / copyLabel / copyAriaLabel / copiedLabel — present. **FAQ** faq[q, a] — present. No Phase-2 task is blocked for want of a string. |
| 2026-08-19 | T1.R.1 (re-run) | **B2 NOT CLOSED — Decision 23 never reached T2.1.1, and as specified it is not buildable on a bare SVG path** | Three separate problems, in descending certainty. **(1) Delivery, certain:** Decision 23 is absent from T2.1.1's context brief and the sketch it contradicts was never amended, so the executor is told to build the waterline with `drawLine`/`pathLength` — the thing Decision 23 forbids. **(2) No timing channel, certain from the frozen file:** `revealClip` is `t(REVEAL)` = 0.5s at **delay 0**. `heroSequence` schedules the waterline as beat 3 at 1.0s, and its `waterline` variant is `pathLength`-based, so Decision 23 orphans it. A section may not author a delay (Decision 22, grepped), so the only in-contract way to place a clip reveal at ~1.0s is `revealClipStagger(11)` — a magic line index standing in for a hero beat, which the ban regex does not catch and no brief sanctions. T2.1.1 will guess here. **(3) ~~Reference box~~ — RAISED THEN RETRACTED BY MEASUREMENT, recorded so nobody re-raises it.** I reasoned from CSS Masking that `inset()` on an SVG shape resolves against **fill-box**, whose height is **zero** for a horizontal path, so the stroke would never paint and the waterline would be visible only to reduced-motion visitors — an inverted silent failure. **It does not hold.** Measured in headless Chrome on a stroked dashed horizontal `<path>`: with `clip-path: inset(0 0% 0 0)` the line paints identically to the unclipped control, on the element itself and on a wrapping `<g>`; with `inset(0 50% 0 0)` it reveals exactly the left half, so the horizontal percentage resolves against the path's own extent — precisely the left-to-right reveal Decision 23 wants. The mechanism is sound in Chrome; only Chrome was measured. **Clause (3) is withdrawn. B2 stands on (1) and (2), both of which are certain from the plan and the frozen file with no browser needed.** |
| 2026-08-19 | T1.R.1 (re-run) | **B3 CLOSED, but its fix collides with Decision 23 — new blocking finding (B5)** | **B3 itself is closed.** All six restore channels plus the universal zeroing rule sit in one `@media (prefers-reduced-motion: reduce)` block, and they cover every property the frozen `lib/motion.ts` can write: `opacity`, `x`/`y` (via `transform`), `clipPath`, `width`, and `pathLength` (via both `stroke-dasharray` and `stroke-dashoffset`, which is how `motion-dom` implements it). `NO_MOTION` names nothing else. No channel is left unrestored. **B5, new — measured, not reasoned:** in headless Chrome with `--force-prefers-reduced-motion`, a dashed `<path>` carrying `data-reveal` and an inline `opacity:0` plus `clip-path:inset(0 100% 0 0)` is correctly restored to fully visible **and rendered SOLID**, while an identical path without the attribute stays dashed. The restore works and eats the dashes. Mechanically: `stroke-dasharray: none !important` is scoped to `[data-reveal]`, and Decision 23's dashed overlay **must** carry `data-reveal` (it is clip-animated, so Framer writes an inline `opacity: 0` that only the `[data-reveal]` rule can undo, and T2.0.1's harness requires the attribute). So under reduced motion the author's dashed waterline is forced **solid** — §1's "dashed orange line" silently disappears for exactly the visitors §1 promises a complete page to. `revert` does not help: SVG presentation attributes cascade at author origin, so reverting drops the author dasharray too. The fix is a scoping decision — restore the dasharray only on elements that actually animate `pathLength` (e.g. a distinct `data-draw` attribute, or `[data-reveal]:not([data-dash])`) — and **no Phase-2 task owns `app/globals.css`**, so it needs an owner as well as a decision. |
| 2026-08-19 | T1.R.1 (re-run) | **B4 NOT CLOSED — Decision 24 is a promise nothing enforces** | Decision 24 states the `<h1>` is "Pinned in T2.1.1's brief and asserted by T2.0.1's harness". Neither is true of the plan as written. T2.1.1's context brief does not list Decision 24, its description and sketch never mention a heading level, and its acceptance criterion greps for `hero`, `heroSequence`, `data-reveal` and the timing ban — nothing about `<h1>`. T2.0.1's brief does not list Decision 24 either, and its sketch enumerates its required literals, its over-claim blocklist and its three motion assertions with **no heading assertion among them**; T1.3.1's criterion asserts `<h1>` count is **0**, which is the only `h1` check anywhere in the plan and points the wrong way for Phase 2. So the page still ends Phase 2 with no top-level heading unless T2.1.1 independently invents one, which is precisely the unbriefed decision B4 was raised about. I accept the fact pattern the orchestrator gave me (0 `<h1>` / 6 `<h2>` today is correct at this stage); the finding is that nothing downstream changes it. Two-line fix: add Decision 24 to both briefs, and add a required `<h1>` assertion to T2.0.1's sketch and criterion. |
| 2026-08-19 | T1.R.1 (re-run) | **D CLOSED — the shell now reads as a drawing** | I called it "a competent dark landing page with a grid background" and that is no longer a fair description. What changed is structural, not cosmetic: a hairline trim line inset from the sheet edge by `p-2 sm:p-4`, a ruled six-cell title block set bottom-right in two rows of three, the status strip as a header rule, and a grid at real drafting pitch (24px minor inside a 96px major) instead of an 8px moiré. The measured numbers carry it: `--color-line` 1.73:1 → **3.13:1**, major rules **2.59:1**, minor **1.39:1** — a major/minor hierarchy that is now actually perceptible as two weights, which is the thing that makes a grid read as a drafting grid rather than as texture. Combined with the draft-mark scale, the page's furniture is drawing furniture. Two residual notes, neither blocking: the title-block cells are unlabelled (deviation 28 — defensible, since `SHEET 1 OF 1` / `NOT TO SCALE` / `REV 0.3.1` self-label, and authoring captions was forbidden), and section separators are `border-line` at full alpha against major grid rules at 85% of the same token, so a section divider is nearly indistinguishable from a grid line. The signature drawing quality still rests on Hero, which is Phase 2's to earn. |
| 2026-08-19 | T1.R.1 (re-run) | **N11–N16 non-blocking: silent-failure surfaces introduced by the repairs** | Bounded pass over the trim border, title block, skip link, revised grid tokens and eleven new exports only. **N11** `layout.tsx` is absent from every Phase-2 context brief, so no section author will know the body carries a sheet margin (`p-2 sm:p-4`) and a header plus footer inside the trim line. Any `min-h-screen`/`h-screen` in Hero — the natural reflex for a signature element — overflows the viewport by the padding and produces a scrollbar on an empty page. Add `layout.tsx` to T2.1.1's read list. **N12** `install.copyAriaLabel` is a single string for two buttons, so both copy controls get the identical accessible name and a screen-reader user cannot tell them apart; composing it with the command text is the only in-contract escape and no brief says to. **N13** `sheet.date` is a frozen `2026-08-18` that silently ages, and `sheet.revision` duplicates `site.version` — a version bump is now three edits (N5 said two). **N14** `sheet` has no consumer-side check that all six cells are non-empty; an empty string renders as a blank ruled cell that looks deliberate. **N15** the skip link targets `<main id="content">`, which is not focusable — without `tabindex="-1"` on it, focus placement after activation is browser-dependent, and `layout.tsx` is owned by nobody. **N16** `@utility blueprint-grid` is still dead (N4 stands); it is now the only in-contract way a Phase-2 section could apply the grid to a panel, so either brief a use for it or delete it at reconcile. |
| 2026-08-19 | T1.R.1 (re-run) | **Scope note** | Nothing under `site/` was edited; no §7 decision re-litigated; root `index.html` not read. The two blockers plus B5 are all plan-document edits — three context briefs, one acceptance criterion, one harness sketch line, one CSS-scoping decision with an owner assigned. None requires a Phase 1 code change and none needs `/drydock:replan` to be a rewrite. |

| 2026-08-19 | T2.3.1 | Integration verification PASS | HEAD ff61c4a; all four stages exit 0: next build ✓, tsc --noEmit ✓, eslint . ✓, assert-copy ✓. Final line: `assert-copy: PASS — /Users/takasivenkatasandeep/Desktop/drydock-repo/site/out/index.html (14 literals, 4x executor, 1 h1, motion contract)` |
| 2026-08-19 | T2.R.1 | **REJECTED** | Fresh-context review of `git diff c664671..HEAD -- site/`, focused on Phase 2's seven sections plus the shell. **The sections themselves are good work** — honest, consistent across seven independent authors, correctly restrained, and the Evidence board matches `docs/compatibility.md` row for row (details in the affirmations row below). It is rejected on one thing, measured in a real browser rather than reasoned: **B5 is not closed. Under `prefers-reduced-motion: reduce` the hero waterline renders SOLID, not dashed** — §1's signature requirement, lost for exactly the visitors §1 promises a complete page to. The Phase 1 review found this defect via the CSS route, Wave 1.6 fixed the CSS route, and nobody re-measured after Hero existed: there is a **second, independent route to the same defect through `NO_MOTION`**, and it is live in the shipped export. Two blocking findings (C1, C2 — one root cause), two major (M1, M2), five notes. Nothing under `site/` was modified; root `index.html` not read; no §7 decision re-litigated. Method: headless Chrome 151 over CDP against `site/out/` served on localhost, four emulation modes — normal, `prefers-reduced-motion: reduce`, reduced with `Emulation.setScriptExecutionDisabled` (the noscript path), and reduced with `Network.setBlockedURLs ["*.js"]` (the CSS-restore-only path). Computed styles and live attributes read per element, plus screenshots. |
| 2026-08-19 | T2.R.1 | **C1 BLOCKING — the dashed waterline is solid under reduced motion. B5 reopened through `NO_MOTION`, not through the CSS** | Decisions 23, 25 and 26 all exist to keep this one line dashed, and all three address the CSS restore. They work: `[data-reveal]` deliberately does not touch `stroke-dasharray`, so the author's `strokeDasharray="10 8"` survives the cascade. **The dash is destroyed by JavaScript instead.** `NO_MOTION` (lib/motion.ts) sets `pathLength: 1` in **both** its `hidden` and `shown` states. Under reduced motion `useMotionSafe()` returns false, Hero passes `NO_MOTION` to the waterline path, and framer-motion renders `pathLength` on SVG by **writing `stroke-dasharray` / `stroke-dashoffset` / `pathLength` as attributes** — clobbering the author dash exactly as B2 documented for `drawLine`. Measured on the shipped export, same element, same build: **normal motion** — attributes `stroke-dasharray="10 8"`, computed `10px, 8px`, screenshot shows a dashed orange line. **Reduced motion** — attributes rewritten to `stroke-dasharray="1 1" stroke-dashoffset="0" pathLength="1"` (none of which appear in `Hero.tsx`), computed `1px, 1px`, and with `pathLength="1"` a 1-unit dash spans the whole normalised path: screenshot shows one **solid** orange line. This is B2's mechanism and B5's symptom arriving by a third door, and no gate can see it: the harness greps source text, the CSS is correct, `Hero.tsx` is correct, `NO_MOTION` looks like a safety net. Root cause is one property in one frozen file. Note the corollary before fixing it: `pathLength: 1` in `NO_MOTION` is not what makes the hull visible — `[data-reveal-path] { stroke-dasharray: none !important }` already does that — so it may well be removable, but that is a repair task's call to make and verify, not this review's. |
| 2026-08-19 | T2.R.1 | **C2 BLOCKING — same root cause, second visible symptom: the hero linework renders dotted under reduced motion** | Hero applies `NO_MOTION` to five `motion.g` / `motion.line` linework elements. `stroke-dasharray` is an **inherited** SVG presentation attribute, so the `1 1` that `pathLength` writes onto a `<g>` cascades to its children — which have real path lengths of ~110 user units and no `pathLength` of their own, so `1 1` means roughly 55 one-unit dashes. Measured: under reduced motion the three cradle-block paths and the superstructure `rect`/`line` all compute `strokeDasharray: 1px, 1px` where normal motion computes `none`. Screenshots confirm it — the cradle blocks and superstructure render as faint dotted stipple instead of solid blueprint linework, in the one element §1 calls the signature. The hull escapes only because it carries `data-reveal-path` and the CSS forces `none`. So the reduced-motion page is not merely missing the dash: the drawing degrades. Listed separately from C1 because it is a second observable failure, but it is one fix. |
| 2026-08-19 | T2.R.1 | **M1 MAJOR — deviation 40's pairing hazard, ninth instance: `[data-reveal-path]` restores strokes but not opacity, and the hull is the element that needs both** | Checked every animated element in every section, per the task's instruction. All pairings are correct **except one asymmetry in the restore rules themselves.** `heroSequence.hull` animates `pathLength` **and** `opacity`, so it needs both channels restored; Hero correctly gives it `data-reveal-path` alone (its brief and Decision 25's "applied **only** to elements animated via `pathLength`" both say so); but `globals.css`'s `[data-reveal-path]` block sets **only** `stroke-dasharray` and `stroke-dashoffset`. CSS attribute selectors are exact names, so `[data-reveal]` does not match an element carrying only `data-reveal-path`. Result: whenever the CSS restore is the only mechanism, the hull stays `opacity: 0`. Measured with reduced motion forced and `*.js` blocked — the CSS-restore-only path, i.e. reduced motion before hydration completes, or JS enabled but the chunk failing to load: **exactly one element on the page is invisible, and it is the hull path (`op=0`)**, while everything around it (dock floor, cradle, superstructure, labels, dashed waterline) is restored. So a reduced-motion visitor gets a dock with no ship in it, then the hull pops in at hydration — a motion event, for the user who asked for none. The tell that this is a genuine oversight rather than a design choice: **`layout.tsx`'s `<noscript>` twin gets it right**, restoring `opacity`/`transform`/`clip-path`/`width` on `[data-reveal-path]` too (verified: with script execution disabled, nothing on the page is invisible). The two mirrors disagree and the comment above the noscript block claims they are "split the same way". T2.3.2 read Decision 25's "adds" correctly; T1.6.1 read it as "replaces". Phase 1's B3-CLOSED note — "no channel is left unrestored" — was true before the attribute split and stopped being true after it. One line in `globals.css`. |
| 2026-08-19 | T2.R.1 | **M2 MAJOR — deviation 41 traced in a browser: the no-JS restore works, but the no-JS page is not complete** | The `<noscript>` block does what it claims and does it correctly — measured with `Emulation.setScriptExecutionDisabled`: **zero elements invisible**, the `<h1>` span at `opacity: 1`, the hull at `opacity: 1` with `stroke-dasharray: none`, and the waterline still dashed at `10px, 8px`. The B5 trap was avoided exactly as the brief demanded. Deviation 41's core claim is verified. **But the page a JS-disabled visitor sees is still missing content, and `Lifecycle.tsx` states the opposite.** Its header comment reads "hidden via CSS, never via conditional rendering, so the export assertions and no-JS visitors both see the full content". The first half is true and load-bearing for the harness; the second half is false. Closed rungs get Tailwind's `hidden` (`display: none`), the noscript block restores opacity/transform/clip-path/width and cannot restore `display`, and the buttons that would toggle it are inert without JS. Measured in the no-JS run: `lifecycle-detail-planwright` is `display: block`, and the other **five are `display: none`, `visible: false`** — five of the six pieces' detail text is unreachable, which is the section §1 asks to carry the six pieces. Install's copy buttons are also inert, but that one is honestly documented in its own comment ("works with no JS" refers to the selectable `<code>`, which is true). Not blocking on its own: §1 never asked for no-JS, and the blank-page defect deviation 41 raised is genuinely fixed. It is major because a code comment asserts a guarantee that measurement contradicts, in a repo whose whole argument is that claims must trace to evidence. Either fix the disclosure to a CSS-only mechanism (`<details>`, or `hidden` swapped for an `aria-expanded`-driven rule) or correct the comment. |
| 2026-08-19 | T2.R.1 | **Deviation 43 answered: Terminal's reveal does fire. The divergence is a real fragility but not a present defect** | Tested rather than reasoned, because the propagation question is genuinely non-obvious: `motion.pre` carries `initial="hidden" whileInView="shown"` with **no `variants` of its own**, and the twelve `motion.span` children carry `variants={revealClipStagger(i)}` with no `initial`/`animate`. Framer's gesture-variant propagation covers this: measured after scrolling the section into view, **all 12 spans reach `opacity: 1` and `clip-path: inset(0px 0% 0px 0px)`**, in cadence, and the whole page ends with zero invisible text-bearing elements. So the reveal works today and the section is not a defect. The fragility deviation 43 describes is real and I confirm the assessment: nothing — not lint, not `tsc`, not the harness, not wavecheck — would notice if an intermediate wrapper gained its own `animate`, and the failure mode is twelve permanently-clipped lines with a green gate. The cheap hardening is to give the `motion.pre` an explicit `variants` object of its own so the contract is stated rather than inherited, but as it stands the lines are all in the export and all reveal. |
| 2026-08-19 | T2.R.1 | **Affirmed: honesty, Verdict D, and cross-component consistency all pass. These are the parts I tried hardest to break** | **Honesty — the load-bearing question, and the page is clean.** The Evidence board is `docs/compatibility.md` row for row: verified = contract logic, A1, A2, A4; not-yet-verified = A2b (PENDING), A3 (MEASURING) — all six rows present, none promoted, statuses and dates transcribed, and the caveats that would be tempting to drop are kept (A1's "agent self-report against a frontmatter control", A2's "cleanup is the orchestrator job", A3's "there are no numbers today"). The single omission is A1's "`model: opus` selects a tier, not an exact build", which is a nuance, not a claim. `site.status` reads `internal pilot -- field benchmarks pending` and A3 having no numbers is what keeps it true. The Terminal transcript is captioned "An illustration, not a captured session", its five check names and `Wavecheck 1.1 -- BLOCK -- 2026-08-18` verdict line follow the real skill format, its scenario is the documented greeting/farewell dry-run, and `Terminal.tsx`'s own header comment repeats the illustration framing. No invented benchmark exists anywhere: the over-claim regexes pass, and I read all 292 lines of `copy.ts` for numbers that assert rather than describe and found none. The FAQ answers "can the model skip the gates" with "compliance is being measured (A3), not asserted", which is the honest answer and the harder one. **Verdict D — yes, this is now an engineering drawing.** My Phase 1 "competent dark landing page with a grid background" no longer applies, and Hero is what closes it: a hull in a cradle over a dock floor, keel labels, a dashed primer waterline carrying `APPROVED (HUMAN-ONLY)`, inside the trim frame with the status strip above and the six-cell title block below, sections numbered as draft marks in metric increments. The 24/96px grid at 2.59:1 major / 1.39:1 minor reads as two distinct weights on screen — verified in screenshots, not just in numbers. **Consistency across seven independent authors is better than the deviation-31 risk suggested:** all six shelled sections open with exactly one `space-y-6` wrapper (as `div`, `ol`, or `dl`), none adds a top margin, none reimplements the reveal or re-declares a `<section>`/`<h2>`/draft mark, all use `SectionProps` from `lib/section`, and every component is a default export. Server/client split is minimal and correct — Problem, Evidence and FAQ are server components; only Hero, Terminal, Lifecycle, Install and the shell carry `"use client"`, each because it needs hooks or `motion.*`. Palette discipline is absolute: zero hex, `rgb()` or `hsl()` literals in any component, and every colour utility resolves to one of the six tokens with primer the only accent. Heading order is h1 once (Hero) then h2 per section then h3 within Problem and Evidence. Scope creep is negligible — Install's `execCommand` fallback is defensible for a `file://`-openable export, and I found nothing in the diff §1 does not want. |
| 2026-08-19 | T2.R.1 | **N17–N21 non-blocking notes** | **N17** Hero's bow draft marks overlap into an illegible cluster: six labels at `x={140 + i*14}` in 10px mono, where `10M`/`12M` need ~18px, so the screenshot reads `2M 4M 6M 8M 10M12M` as one smear. It is the one place the drawing looks unfinished rather than sparse; the fix is pitch, not copy. **N18** `drawLine` and `revealClip` are now dead exports and `@utility blueprint-grid` is still dead (N4/N16 stand) — three unused contract surfaces, and `drawLine` is the one whose misuse B2 was about, so deleting it at reconcile removes a footgun as well as dead code. **N19** section separators (`border-t border-line`, full alpha) remain nearly indistinguishable from major grid rules (85% of the same token) — my Phase 1 note, unchanged and still cosmetic. **N20** `Evidence` keys its two `Row` lists differently (`row.label` for verified, `row.id` for not-verified) with no reason; harmless, but the asymmetry will read as meaningful to the next editor. **N21** deviation 39's casing constraint is currently satisfied only via the shell: `internal pilot` and `field benchmarks pending` reach the export solely through `site.status` in `layout.tsx`, so a future edit to the header strip silently breaks two harness literals in a file whose author has no reason to know that. |
| 2026-08-19 | T2.R.1 | **Recommended path** | Three edits in two files, then re-measure with reduced motion forced. **C1 + C2:** remove `pathLength: 1` from both `NO_MOTION` states in `site/lib/motion.ts`, then verify in a browser that the waterline stays `10 8` dashed, the linework computes `none`, and the hull still restores — the hull's dash restore must come from `[data-reveal-path]`, which is what that rule is for. **M1:** add `opacity: 1 !important; transform: none !important; clip-path: none !important; width: auto !important` to the `[data-reveal-path]` block in `site/app/globals.css`, matching what `layout.tsx`'s noscript twin already does. **M2:** correct or fulfil `Lifecycle.tsx`'s no-JS claim. Both `lib/motion.ts` and `app/globals.css` are owned by no Phase-2 task — the fourth instance of deviation 44's structural gap — so this needs a repair wave, and the acceptance criterion should be a browser measurement under forced reduced motion, not a grep: every finding here is invisible to source text. Worth stating plainly for the human gate: **the reduced-motion check in §10 is the one that catches C1 and C2, and it catches them instantly** — enable OS reduce motion, load the served export, and look at whether the orange line is dashed. |
| 2026-08-19 | T2.6.1 | **PASS — reduced-motion harness added and run against the post-repair export** | `site/scripts/measure-reduced-motion.mjs` serves `out/` over `node:http` (falls back across a 5-port candidate list on `EADDRINUSE` rather than crashing), launches headless Chrome 151 with `--force-prefers-reduced-motion` and its own `--user-data-dir`, polls `/json/version` (also fell back to a second candidate port when 9222 was already bound by an unrelated Chrome instance in this environment — confirms the fallback path works, not just the happy path), verifies the `matchMedia` control before any other assertion, scrolls to the bottom and back to the top to fire scroll-triggered reveals, then reads computed styles via `Runtime.evaluate` over the CDP websocket. `cd site && node scripts/measure-reduced-motion.mjs` → `PASS — reducedMotion=true, waterline="10px, 8px", stippled=0, hull={"opacity":"1","dasharray":"none"}, invisibleText=0` — all five values match the reference measurements in the task brief exactly (C1's dash is `10px, 8px` not `1px, 1px`/`none`; C2's stippled-element count is `0`; M1's hull is `{opacity:1, dasharray:none}`; zero invisible text-bearing elements). Also exercised the failure paths directly: holding one or all of the candidate HTTP ports produces a one-line message (`all candidate ports in use (...) — free one of them or edit the candidate list`) and exit 1, never an `EADDRINUSE` stack trace; a rerun after a clean exit leaves no bound port and no leftover Chrome process under the script's own temp profile directory. |

## Reconcile report

*Appended once by `drydock:reconcile` at completion.*
