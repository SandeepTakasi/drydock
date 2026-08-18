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
Per-file `npx tsc --noEmit --strict --jsx react-jsx --module esnext
--moduleResolution bundler --esModuleInterop --skipLibCheck --target es2022
<file>` compiles only that file's own import graph and is safe. Without this,
a `.ts` file using `React.FC` with no React import passes ESLint, passes
wavecheck, and blocks a later task that does not own it.

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
variants, and all copy are frozen and imported by the shell.

**Phase gate:** `cd site && npm run build && npx tsc --noEmit && npm run lint`
exits 0; wavecheck PASS on 1.0, 1.1, 1.2, 1.3; T1.R.1 APPROVED; human approval.

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
2.2, 2.3; T2.R.1 APPROVED; **human browser confirmation**; human approval.

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
  22. Read `site/content/copy.ts`, `site/lib/motion.ts`.
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
  `cd site && npx eslint scripts/assert-copy.mjs && node --check scripts/assert-copy.mjs && printf '%s' "APPROVED (HUMAN-ONLY) internal pilot field benchmarks pending Deviations logged: 1 (1 discovered by wavecheck) A2b drift one-file change NOTHING SAILS UNTIL IT LEAVES THE DOCK agents planwright executor-isolated wavecheck replan reconcile" > /tmp/dd-ok.txt && printf '%s' "internal pilot" > /tmp/dd-bad.txt && node scripts/assert-copy.mjs /tmp/dd-ok.txt && ! node scripts/assert-copy.mjs /tmp/dd-bad.txt && node -e "process.exit(require('./package.json').scripts.verify?0:1)"`

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
  17, §10 Checkpointing. Read `site/lib/motion.ts`, `site/content/copy.ts`,
  `site/app/globals.css`.
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
  - Sequence via `heroSequence`: linework fades → hull draws → waterline
    `drawLine` (`pathLength` 0→1, dashed, primer) → label fades.
  - `hero.waterlineLabel` renders as a real `<text>` node (F5); animation touches
    only opacity. `data-reveal` on every animated element (F5a).
- **Acceptance criterion:**
  `cd site && npx eslint components/sections/Hero.tsx && npx tsc --noEmit --strict --jsx react-jsx --module esnext --moduleResolution bundler --esModuleInterop --skipLibCheck --target es2022 components/sections/Hero.tsx && grep -q "hero" components/sections/Hero.tsx && grep -q "heroSequence" components/sections/Hero.tsx && grep -q "data-reveal" components/sections/Hero.tsx && ! grep -qE "(duration|delay):|duration-[0-9]" components/sections/Hero.tsx`

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
  `cd site && npx eslint components/sections/Evidence.tsx && npx tsc --noEmit --strict --jsx react-jsx --module esnext --moduleResolution bundler --esModuleInterop --skipLibCheck --target es2022 components/sections/Evidence.tsx && grep -q "notVerified" components/sections/Evidence.tsx && grep -q "selfAuditHref" components/sections/Evidence.tsx && ! grep -qE "(duration|delay):|duration-[0-9]" components/sections/Evidence.tsx`

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
  `cd site && npx eslint components/sections/Lifecycle.tsx && npx tsc --noEmit --strict --jsx react-jsx --module esnext --moduleResolution bundler --esModuleInterop --skipLibCheck --target es2022 components/sections/Lifecycle.tsx && grep -q "lifecycle" components/sections/Lifecycle.tsx && grep -q "aria-expanded" components/sections/Lifecycle.tsx && ! grep -qE "(duration|delay):|duration-[0-9]" components/sections/Lifecycle.tsx`

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
  `cd site && npx eslint components/sections/Problem.tsx && npx tsc --noEmit --strict --jsx react-jsx --module esnext --moduleResolution bundler --esModuleInterop --skipLibCheck --target es2022 components/sections/Problem.tsx && grep -q "problem" components/sections/Problem.tsx && ! grep -qE "(duration|delay):|duration-[0-9]" components/sections/Problem.tsx`

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
  `cd site && npx eslint components/sections/Terminal.tsx && npx tsc --noEmit --strict --jsx react-jsx --module esnext --moduleResolution bundler --esModuleInterop --skipLibCheck --target es2022 components/sections/Terminal.tsx && grep -q "revealClipStagger" components/sections/Terminal.tsx && grep -q "terminal" components/sections/Terminal.tsx && grep -q "data-reveal" components/sections/Terminal.tsx && ! grep -qE "(duration|delay):|duration-[0-9]" components/sections/Terminal.tsx`

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
  `cd site && npx eslint components/sections/Install.tsx && npx tsc --noEmit --strict --jsx react-jsx --module esnext --moduleResolution bundler --esModuleInterop --skipLibCheck --target es2022 components/sections/Install.tsx && grep -q "install" components/sections/Install.tsx && grep -q "aria-live" components/sections/Install.tsx && ! grep -qE "(duration|delay):|duration-[0-9]" components/sections/Install.tsx`

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
  `cd site && npx eslint components/sections/Faq.tsx && npx tsc --noEmit --strict --jsx react-jsx --module esnext --moduleResolution bundler --esModuleInterop --skipLibCheck --target es2022 components/sections/Faq.tsx && grep -q "faq" components/sections/Faq.tsx && grep -qE "<dl|<dt|<dd" components/sections/Faq.tsx && ! grep -qE "(duration|delay):|duration-[0-9]" components/sections/Faq.tsx`

### Wave 2.3 — Integration
> Single task. First point at which a full build is safe, because nothing is
> concurrent (Decision 16).

#### T2.3.1 — Integration verification of the assembled site
- **Status:** TODO
- **Description:** Run the full gate against the assembled site and record the
  result. This task fixes nothing; it establishes whether seven independently
  built sections satisfy the frozen export contract.
- **Files owned:** `docs/plans/001-drydock-homepage.md` (Progress log only)
- **Depends on:** T2.1.1–T2.1.4, T2.2.1–T2.2.3
- **Model / thinking:** Mechanical / off (Haiku)  **Executor:** drydock:executor
- **Context brief:** This plan §10 (escalation, `T2.3.2+` policy).
- **Forbidden:** Editing anything under `site/`. Fixing a failing assertion — a
  failure is a deviation to record and route per §10, not a file to patch.
- **Acceptance criterion:** `cd site && npm run verify`

### Wave 2.R — Quality review

#### T2.R.1 — Fresh-context quality review of Phase 2 and the whole site
- **Status:** TODO
- **Description:** Review the Phase 2 diff for correctness, convention drift
  across seven independently built components, animation restraint, whether any
  section reimplemented shared behaviour, and whether the page over-claims
  against `docs/compatibility.md`.
- **Files owned:** `docs/plans/001-drydock-homepage.md` (Progress log only)
- **Depends on:** T2.3.1 and wavecheck PASS on 2.0, 2.1, 2.2, 2.3
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

## Reconcile report

*Appended once by `drydock:reconcile` at completion.*
