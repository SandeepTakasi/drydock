---
plan: 012-homepage-restructure
format_version: 3
status: EXECUTING
isolation: none
enforcement: required
attribution: manifest
lane: full
execution: fleet
created: 2026-10-07
approved_by: Sandeep Takasi
---

# 012 - The homepage leads with the problem and shows real gate output

**Plan location:** `docs/plans/`, committed with the repo.

> **Execution protocol.** Spawn each task in the current wave as its declared
> executor agent (`drydock:executor`, or `drydock:executor-isolated` when the
> header says `isolation: worktree`) with its declared model and thinking
> budget, passing ONLY the task's context brief. Before starting any wave, run
> the staleness check below. Wait for all tasks in the wave, then invoke the
> `drydock:wavecheck` skill with this plan path and the wave id. Do not begin
> the wave's quality-review task, or the next wave, until wavecheck reports
> PASS. On BLOCK, set status BLOCKED and stop, do not self-repair; the paths
> out are `/drydock:replan` or a human decision. Quality-review rejections
> follow the escalation policy (max 2 retries → tier up → human); wavecheck
> BLOCKs on ownership violations or unlogged deviations get NO retries. When
> the final wave and phase gate pass, invoke `drydock:reconcile`.
>
> **If you cannot spawn executors**, a standing instruction against unprompted
> agents, agents unavailable, that is a deviation to log **before the wave
> opens**, not after it closes, and it does not become permission to skip the
> wave gate. Two obligations survive intact: stage **only** the task's owned
> files in its checkpoint commit (a spawned executor gets this for free; by hand
> it is the first thing to slip), and tell wavecheck the diff is self-authored,
> because its forbidden audit is weakened when the auditor wrote the code and it
> must say so rather than imply independence it does not have.

**Ownership enforcement (arm before every wave):**

```bash
node drydock/scripts/drydock-audit.mjs wave-start docs/plans/012-homepage-restructure.md <wave>
# ... the wave's executors run ...
node drydock/scripts/drydock-audit.mjs audit-wave docs/plans/012-homepage-restructure.md <wave>
rm .drydock/wave-owns.json
```

**Orchestrator bookkeeping (CLAUDE.md):** set `status: EXECUTING` and this
plan's `docs/plans/README.md` row in the commit before the first `wave-start`;
write this plan file only while no wave is armed, and commit it before the next
`wave-start`; spawn executors **one at a time** (D1); repair a review rejection
in a new wave with new task ids; edit owned files with Write/Edit, never Bash.
Paste the audit's `enforcement active: ...` sentence and its per-task table into
every wavecheck report **verbatim**. Write the closed gate exactly as
`**Phase gate: CLOSED, approved by <name> - <date>.**`.

**Staleness check (before every wave):**
`git diff <baseline SHA>..HEAD -- <wave's owned files> site/content/copy.ts`.
Non-empty only from this plan's own earlier task commits is a handoff, not
drift. Anything else → re-validate and update the baseline and Decision Log.

## Requirement

The homepage at `site/` explains the plugin's mechanism before its value, puts
nine evidence rows of ~100 words each on the landing page, shows only
illustrated (not captured) gate output, and ships its hero hidden (`opacity:0`
inline) until JavaScript runs. When done: the hero leads with the drift problem,
shows a verbatim excerpt of a real wavecheck BLOCK from `docs/plans/`, and has
both install commands visible without scrolling at 1280x800, with no hidden
first paint. The page order is hero, problem, the loop in three steps, what it
refuses (four real refusal messages, each mechanically traced to the source that
emits it), honest limits, install, FAQ. The full evidence matrix lives on its
own page, `/drydock/evidence/`, still synced to `docs/compatibility.md` and
still enforced by `assert-copy`.

## Spec reference

None. The requirement is complete. The structural model is the QA-Pilot
homepage (<https://sandeeptakasi.github.io/qa-pilot/>): claim-first hero with
an artifact beside it, install above the fold, a refusals section quoting gate
output, a short honest-limits section, reference material off the landing page.
Its visual skin is explicitly NOT the spec: Drydock keeps its own tokens and
typography.

## Surgical-scope statement

Rewrite `copy.ts` strings, reshape `Hero` and `Lifecycle`, add two small
sections and one route, point the nav at routes, delete `Terminal`, and teach
`assert-copy` to read two pages. No token, font, motion-library or plugin
change, no plugin version bump.

## Baseline

_Filled by T0, 2026-10-07._

| Item | Value |
|---|---|
| Commit SHA | `15570df` |
| Installed plugin version (no VERSION DRIFT) | 0.17.1 at `6fae4de`; `validate-plan` PASS (11 tasks, 5 waves), no VERSION DRIFT |
| `cd site && npm run verify` | PASS (assert-copy 26 literals, 5x executor, 1 h1, motion contract; assert-matrix 12 rows) once this plan's README row exists; the first run, before the row, failed assert-matrix on exactly that missing row |
| `cd site && node scripts/measure-reduced-motion.mjs` | PASS (waterline "10px, 8px", hull opacity 1 dasharray none, invisibleText=0, drift 0/0) |
| `node drydock/scripts/drydock-audit.mjs prove-failable docs/plans/012-homepage-restructure.md` | PASS, 11 of 11 criteria fail at baseline |

## Practices in effect

| Practice | Value | Source |
|---|---|---|
| Honesty | `compatibility.md` is the source of truth for every verification claim; no row promoted; no benchmark; nothing on the page presented as captured unless it is verbatim from the repo | CLAUDE.md "Honesty rule" |
| Quality gates | `npm run verify` in `site/` (build, tsc, eslint, assert-copy, assert-matrix); `measure-reduced-motion.mjs` as the browser-only step | CLAUDE.md, `verify.yml` |
| Commits | one per task, owned files only, then `task-close` (`attribution: manifest`) | CLAUDE.md |
| Execution | fleet, executors one at a time | user, D1 |
| Human gate | the rendered page, approved by name and date, before any push (a push touching `site/**` deploys) | user; ADR 0003 |
| Acceptance criteria | run through `cmd.exe` here, `/bin/sh` in CI: no backslashes, character classes, `String.fromCharCode` for quotes | CLAUDE.md |
| Copy style | no em dash inside any new on-page string | plan 001 deviation 16 |
| Tracker | none | plans 005-011 |

## Findings & constraints

- **Hero first paint is hidden, measured.** The live export's `<h1>` reads
  `<span data-reveal="true" class="block" style="opacity:0;transform:translateY(12px)">Drydock</span>`;
  27 elements carry inline `opacity:0`. `layout.tsx`'s `<noscript>` restores
  them for no-JS visitors (plan 001 deviations 41/44), so the cost is a blank
  hero until hydration for everyone else. D6.
- **The suspected low-contrast text is not real.** `--color-ink-dim` `#98a2ae`
  on `--color-surface` `#0e1013` is ≈7.5:1. The dim screenshot caught
  `Section`'s scroll reveal mid-fade. D5: no fix.
- **Plan 009 is DONE, not unexecuted** (`docs/plans/README.md`). Nothing to
  reconcile with it. Its five specs in `e2e/009-site-016-additions/` assert the
  nine-card grid and `#evidence` on the home page; CI copies only top-level
  `e2e/*.spec.ts` (`verify.yml` line 178), so they are not gated and will go
  stale (Out of scope).
- **CI's top-level specs constrain the page:** exactly one `<h1>` containing
  `Drydock` (tg1), an `#install` section whose first `code`/`pre` is the first
  install command (tg4), `header a img` (tg6), the header pilot pill (tg2). All
  survive this plan unchanged.
- **`measure-reduced-motion.mjs` pins the wave diagram:** exactly one
  `svg path[data-reveal][stroke-dasharray="10 8"]` (C1) and a
  `[data-reveal-path]` with opacity 1 and dasharray none (M1). Its selectors are
  document-wide, so the diagram may move sections; it may not be deleted or
  duplicated (D3).
- **`assert-copy.mjs` reads only `out/index.html`** and pins 22 literals, six of
  which live in evidence rows (A2b, A3 x3, A6, A7) and one in `Terminal`
  (`Deviations logged: 1 (1 discovered by wavecheck)`). Moving the matrix
  without splitting the list fails the gate (D11).
- **Hero contract (plan 001 deviation 42):** the `<h1>` is a plain `<h1>`, and
  `assert-copy`'s heading contract greps it. Keep it plain.
- **Static export, no `trailingSlash`:** a new route would emit
  `out/evidence.html`, which `python -m http.server` (CLAUDE.md's serve recipe
  and this plan's Testing Gate target) does not serve at `/drydock/evidence`.
  D8 sets `trailingSlash: true`.
- **Nav hrefs are bare fragments** (`#problem` ...) rendered by plain `<a>` in
  `layout.tsx` and `MobileNav.tsx`; on a second page they would point at that
  page. `basePath` must stay single-sourced in `next.config.ts` (CLAUDE.md), so
  links go through `next/link` (D9).
- **Real artifacts available.** `docs/plans/004-seatrial-e2e-gate.md` line 1154,
  `### Wavecheck 1.1 — BLOCK — 2026-08-20`: every test green, wavecheck blocked
  an executor that invented a `PARTIAL` verdict the contract does not define;
  it closes `Deviations logged: 6 (3 discovered by wavecheck)` (D2).
- **Refusal pins verified present** (2026-10-07): `same-wave ownership must be
  disjoint` and `which is outside its` and `has no PASS wavecheck report` in
  `drydock/scripts/drydock-audit.mjs`; `does not own` in
  `drydock/hooks/enforce-owns.mjs`.
- **Learnings run** on `copy.ts`, `page.tsx`, `Hero.tsx`, `Lifecycle.tsx`,
  `Evidence.tsx`, `Terminal.tsx`, `assert-copy.mjs`, `layout.tsx`. Relevant
  hits: CLAUDE.md "never link a doc with `../`" and "`out/index.html` carries the
  RSC payload, strip script bodies"; plan 001 deviation 38 (an explicit path
  disables `assert-copy`'s motion checks, fixture mode); plan 001 deviation 47
  (a component comment must describe what renders); plan 003 deviation 10
  (stale harness docblocks). Carried into the briefs below.

## Decision Log

| # | Question | Decision | Decided by | Rationale |
|---|---|---|---|---|
| 1 | Fleet or solo? | Fleet, executors spawned one at a time | user | Auditor did not write the diff; one at a time so a cut-off leaves committed work (CLAUDE.md) |
| 2 | Which real report beside the hero? | Plan 004 wavecheck 1.1 BLOCK, verbatim lines only, mechanically checked against the plan file by `assert-copy` (T1.3.1); must include the `5. Deviation reconciliation` row and `Deviations logged: 6 (3 discovered by wavecheck)` | user | Green tests, contract breach caught: the drift story itself |
| 3 | Fate of the hero wave diagram? | Moves into the loop section (`Lifecycle.tsx`) with both SVG contracts intact; `Hero.tsx` loses it | user | Illustrates the loop; C1/M1 stay green untouched |
| 4 | Keep the FAQ? | Yes, unchanged, after install | user | Holds the required `one-file change` literal; zero work |
| 5 | Fix low-contrast text? | No | planner (measured) | ≈7.5:1; the observation was a mid-fade screenshot |
| 6 | How to fix the hidden hero? | `Hero.tsx` has no entrance animation and no `motion` import; it becomes a server component | planner (assumed, flag if wrong) | Smallest fix; the LCP element must not start at `opacity:0` |
| 7 | Reconcile with plan 009? | Nothing to do; it is DONE | planner (fact) | `docs/plans/README.md` |
| 8 | How is the evidence page served by a plain static server? | `trailingSlash: true` in `next.config.ts`, so it exports `out/evidence/index.html`; `BASE_PATH` untouched | planner (assumed, flag if wrong) | Works on Pages and on `python -m http.server` |
| 9 | How do nav links work from two pages without hardcoding `/drydock`? | `copy.ts` nav hrefs become `/#lifecycle`, `/#refuses`, `/evidence`, `/#install`; `layout.tsx` and `MobileNav.tsx` render them with `next/link`; the wordmark links to `/` | planner | `next/link` applies `basePath`; single source preserved |
| 10 | How is a refusal message proved real? | Each is captured by running the real command against a scratch fixture and pasted verbatim (whole lines may be dropped, characters in kept lines never altered; a line with an absolute local path or username is dropped). Each carries `source` (repo-relative emitting file) and `pin` (a static fragment); `assert-copy` checks the pin is in the source file AND in the rendered output | planner | Makes "real output" a failable claim, not prose |
| 11 | Which literals pin which page? | `REQUIRED_HOME` and `REQUIRED_EVIDENCE`, listed exactly in T1.3.1 | planner | The caveats move with the matrix; the home page still carries its own limits |
| 12 | `npm run verify` between waves? | Expected red from Wave 1.1 until T1.3.1 lands (pinned literals move); task criteria use `next build` plus targeted checks; nothing is pushed in between | planner | Splitting the literal move across waves is unavoidable under fleet |
| 13 | Lane? | `full`: contract → parallel sections → integration → gate script is four forced sequential waves | planner | Real concurrency in Wave 1.1 (six disjoint tasks) |
| 14 | Version bump? | None; site only | planner | `plugin.json` unchanged, so the version-drift check is unaffected |
| 15 | Loop section id? | Keeps `id="lifecycle"` | planner (assumed, flag if wrong) | Fewer moving anchors; nothing external links it |
| 16 | Who writes the copy? | T1.0.1 drafts it; the human approves the wording at the phase gate | user | The gate is "approve the rendered page" |
| 17 | Pressure test by a spawned agent? | Done inline by the planner with fresh eyes (re-opened every claimed file) | planner | The session runs under a no-unrequested-agents rule; the skill permits the inline pass |

## Open questions

None.

## Out of scope / follow-ups

- A real recorded session (GIF/video) of `/drydock:planwright` through a BLOCK. The strongest remaining gap; needs a capture tool this repo does not have.
- Retiring or rewriting the five stale `e2e/009-site-016-additions/` specs.
- Per-component reference pages on the site (the README on GitHub is the link target for now).
- Search, docs navigation, a QA-Pilot-style docs shell.

## Execution policies

- **Per task:** the acceptance criterion exits 0, verified by the executor and re-run by wavecheck through `spawnSync(..., {shell: true})`.
- **Per wave:** `drydock:wavecheck` is the blocking gate. Wavecheck 1.0 additionally reads each `hero.artifact.lines[].text` and confirms it is a verbatim substring of `docs/plans/004-seatrial-e2e-gate.md` once `**` and backticks are stripped from both (T1.3.1 automates this later).
- **Per phase:** Wave 1.R, a fresh-context Judgment-tier review after wavecheck 1.3 PASS; APPROVED required.
- **Escalation:** review rejections: max 2 retries, each as a new wave with new task ids, then one tier up, then a human. Wavecheck BLOCKs on ownership or unlogged deviations: no retries.
- **Checkpointing:** one commit per task, owned files only, then `task-close`.
- **Testing Gate:** `drydock:seatrial` after Wave 1.R APPROVED.
- **Human gate:** Phase 1, after seatrial GO and `measure-reduced-motion.mjs` PASS, named and dated. **Do not push before it closes.**
- **Tracker mirroring:** none.

## Testing Gate

| Field | Value |
|---|---|
| Target | `http://localhost:5173/drydock/`: `cd site && npm run build`, then serve a directory whose `drydock` entry points at `site/out` (on Windows a junction, `mklink /J`), with `python -m http.server 5173` from that directory |
| Auth | none: a static public page |
| Browser | Chromium through Playwright MCP |
| Commit SHA | recorded by seatrial at run time |
| Evidence root | `.drydock/testing/012-homepage-restructure/<case-id>/` |

**TG1 - The hero is visible on first paint, install above the fold**

- **preconditions:** Target served; Wave 1.3 committed.
- **steps:** Given a 1280x800 viewport, When the page is opened and a screenshot is taken immediately after the `load` event with no scroll, Then the `<h1>`, the promise line and both install commands (`/plugin marketplace add SandeepTakasi/drydock`, `/plugin install drydock@drydock`) are visible and each has a bounding box bottom of at most 800.
- **expected:** All four visible in the first viewport; screenshot saved.
- **evidence:** screenshot
- **severity:** blocker

**TG2 - The hero artifact is the plan 004 BLOCK, labelled as such**

- **preconditions:** As TG1.
- **steps:** Given a 1280x800 viewport, When the page is opened, Then the hero shows a block carrying `BLOCK`, the line `Deviations logged: 6 (3 discovered by wavecheck)`, and a caption naming plan 004 with a link whose href contains `docs/plans/004-seatrial-e2e-gate.md`.
- **expected:** All three present; screenshot saved.
- **evidence:** screenshot
- **severity:** blocker

**TG3 - What it refuses shows four refusals with their output**

- **preconditions:** As TG1.
- **steps:** Given a 1280x900 viewport, When the page is scrolled to `#refuses`, Then four refusal items are rendered, each with a title and an output block, and the output blocks contain `same-wave ownership must be disjoint`, `which is outside its`, `does not own` and `has no PASS wavecheck report` respectively.
- **expected:** Four items, each pin visible; screenshot saved.
- **evidence:** screenshot
- **severity:** blocker

**TG4 - The evidence page is reachable and links home**

- **preconditions:** As TG1.
- **steps:** Given a 1280x900 viewport, When the header nav item `Evidence` is clicked, Then the URL path is `/drydock/evidence/`, the page's only `<h1>` is visible and the A3 row shows `PUBLISHED, NOT PASSED`; When the header nav item `Install` is then clicked, Then the URL path is `/drydock/` and `#install` is in view.
- **expected:** Both navigations land; screenshots of the evidence page and of `#install` saved.
- **evidence:** screenshot
- **severity:** blocker

**TG5 - At phone width the home page does not scroll sideways**

- **preconditions:** As TG1.
- **steps:** Given a 375x812 viewport, When the page is opened and scrolled from top to bottom, Then `document.documentElement.scrollWidth` is never greater than `window.innerWidth`.
- **expected:** No horizontal overflow (the artifact and refusal outputs scroll inside their own boxes); screenshot of the hero saved.
- **evidence:** screenshot
- **severity:** major

**TG6 - Designed to fail: the wave diagram is in the hero**

- **preconditions:** As TG1.
- **steps:** Given a 1280x800 viewport, When the page is opened with no scroll, Then the three task lanes `T1.1.1`, `T1.1.2`, `T1.1.3` are visible in the first viewport.
- **expected:** **This case is designed to FAIL** (D3 moved the diagram to the loop section). Its correct verdict is FAIL; a PASS verdict on TG6 is a failure of the gate and of D3. Screenshot of the first viewport saved.
- **evidence:** screenshot
- **severity:** minor

## Pressure-test verdict

_Inline pass by the planner (D17), 2026-10-07: APPROVED after fixes._ Every
path named in a brief was re-opened. Findings fixed before presenting:
(1) the nav criterion originally asserted no `#` href in the header, which the
`#content` skip link would break, now asserts the target hrefs only;
(2) `assert-copy` and page integration originally shared a wave though the
script's criterion needs the integrated export, now Wave 1.3;
(3) a `python -m http.server` target cannot serve `evidence.html` at
`/drydock/evidence`, hence D8;
(4) refusal outputs could have leaked a local username through the audit's
version banner, hence the drop-whole-lines rule in D10;
(5) Refusals and Limits are not rendered until Wave 1.2, so their criteria
type-check and lint the file alone (CLAUDE.md temp-tsconfig recipe) rather than
grepping an export that cannot contain them yet.

## Phase 0: Pre-flight

#### T0 - Baseline and plan index row

- **Description:** Run the quality gates on the untouched tree, record the SHA,
  installed version and results in *Baseline*, run `prove-failable` on this plan
  and record it, and add this plan's row to `docs/plans/README.md`. If
  `prove-failable` reports any criterion already exiting 0, stop and report.
- **Files owned:** `docs/plans/README.md` (the *Baseline* section of this plan is also written here, before any wave is armed)
- **Depends on:** none
- **Model / thinking:** Mechanical / off   **Executor:** orchestrator, inline
- **Context brief:** this plan's *Baseline*; `docs/plans/README.md`; CLAUDE.md "Executing a plan here".
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');const r=c.spawnSync('node',['drydock/scripts/drydock-audit.mjs','validate-plan','docs/plans/012-homepage-restructure.md'],{encoding:'utf8'});const o=(r.stdout||'')+(r.stderr||'');const t=fs.readFileSync('docs/plans/012-homepage-restructure.md','utf8');const i=fs.readFileSync('docs/plans/README.md','utf8');process.exit(r.status===0&&!o.includes('VERSION DRIFT')&&/Commit SHA [|] .?[0-9a-f]{7,40}/.test(t)&&i.includes('012-homepage-restructure')?0:1)"`

## Phase 1: The page

**Exit state:** the home page renders hero, problem, loop, refuses, limits,
install, FAQ; `/drydock/evidence/` renders the full matrix; `npm run verify` and
`measure-reduced-motion.mjs` pass; seatrial GO.

**Phase gate:** `cd site && npm run verify` PASS, `cd site && node scripts/measure-reduced-motion.mjs` PASS, Wave 1.R APPROVED, seatrial GO, and the rendered page approved by a named human before any push.

### Wave 1.0 - Contracts

#### T1.0.1 - All new copy and its shapes in copy.ts

- **Description:** Add every string and type the new page needs to
  `site/content/copy.ts`, capturing the four refusal outputs from real runs,
  without removing anything an unchanged component still imports.
- **Files owned:** `site/content/copy.ts`
- **Depends on:** T0
- **Model / thinking:** Judgment / extended (Opus 5.5)   **Executor:** drydock:executor
- **Context brief:** this plan's Requirement, Findings, D2, D3, D6, D9, D10, D15, D16; `site/content/copy.ts`;
  `docs/plans/004-seatrial-e2e-gate.md` lines 1154-1194 (the excerpt source);
  `drydock/scripts/drydock-audit.mjs` (`validate-plan`, `audit-wave`, `wave-start`);
  `drydock/hooks/enforce-owns.mjs` and `drydock/hooks/enforce-owns.test.mjs` (how to drive the hook with stdin JSON);
  `docs/compatibility.md` (no claim beyond it); CLAUDE.md "Honesty rule for site copy" and "Acceptance criteria run through the PLATFORM shell".
- **Implementation sketch (the contract every Wave 1.1 task builds against; write it exactly):**
  - `export interface Refusal { title: string; body: string; command: string; source: string; pin: string; output: string; }`. In every object literal, `source` and `pin` are adjacent and in that order, double-quoted.
  - `hero` keeps `kicker`, `headline: "Drydock"`, `thesis`, `badges`, `ctaPrimary`, `wave` (now consumed by `Lifecycle`). It rewrites `promise` (one sentence leading with drift: green tests, clean review, a diff nobody asked for) and `sub` (two sentences at most: plan as source of truth; each wave audited against the actual diff). It adds `installLabel: string` and `artifact: { source: "docs/plans/004-seatrial-e2e-gate.md"; href: string /* `${BLOB}/docs/plans/004-seatrial-e2e-gate.md` */; label: string; verdict: "BLOCK"; lines: TerminalLine[]; caption: string }`. `lines` are 6 to 12 verbatim lines from the plan 004 report (D2), and must include the `5. Deviation reconciliation` row and `Deviations logged: 6 (3 discovered by wavecheck)`. `caption` says it is an excerpt of a real report and names plan 004.
  - `lifecycle` adds `steps: { index: string; title: string; body: string }[]` (exactly 3: plan, parallel waves, each wave audited against the diff), `readmeHref: \`${BLOB}/drydock/README.md\``, `readmeLinkText`. `pieces` and `detail` stay for now (removed in T1.2.1).
  - `export const refusals: { lead: string; items: Refusal[] }`, exactly 4 items in this order. 1: `validate-plan`, pin `same-wave ownership must be disjoint`, source `drydock/scripts/drydock-audit.mjs`. 2: `audit-wave`, pin `which is outside its`, same source. 3: the ownership hook, pin `does not own`, source `drydock/hooks/enforce-owns.mjs`. 4: `wave-start`, pin `has no PASS wavecheck report`, source `drydock/scripts/drydock-audit.mjs`. `output` is what the run printed, captured per D10 (for the hook, its deny reason string). Above each item, a `//` comment names the exact command and fixture used.
  - `export const limits: { lead: string; items: string[]; evidenceLinkText: string }`, 3 to 5 items. The items must contain verbatim the sentences holding `Bash-mediated writes bypass file-tool hooks`, `outside the project directory are not enforced` and `It detects after the fact and prevents nothing.`, plus the A3 caveat that the gate-compliance figure is a ceiling.
  - `export const evidencePage: { title: string; description: string; heading: string; lead: string; homeLinkText: string }`.
  - `meta` adds `refuses` (`id: "refuses"`) and `limits` (`id: "limits"`), widening its key type. Home eyebrows renumber `01` problem, `02` lifecycle (heading names the loop, not "Nine pieces"), `03` refuses, `04` limits, `05` install, `06` faq. `meta.evidence` stays for the evidence page, and `meta.terminal` stays until T1.2.1.
  - `nav` becomes exactly `[{ href: "/#lifecycle", label: "How it works" }, { href: "/#refuses", label: "What it refuses" }, { href: "/evidence", label: "Evidence" }, { href: "/#install", label: "Install" }]`.
- **Forbidden:** changing any `evidence.rows` entry or `evidence.provenance` (assert-matrix check 4 reads them); removing `terminal`, `meta.terminal`, `Piece.detail` or any export a current component imports; an em dash in a new authored string (verbatim excerpt and output lines are exempt and keep theirs); editing any captured output character; any claim not in `docs/compatibility.md`; writing any file outside `copy.ts` except scratch fixtures outside the repo.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');try{c.execSync('npx tsc --noEmit',{cwd:'site',stdio:'ignore'})}catch(e){process.exit(1)}const s=fs.readFileSync('site/content/copy.ts','utf8');const q=String.fromCharCode(34);const re=new RegExp('source: '+q+'([^'+q+']+)'+q+',[^'+q+']*pin: '+q+'([^'+q+']+)'+q,'g');const ps=[...s.matchAll(re)];const ok=ps.length===4&&ps.every(m=>fs.readFileSync(m[1],'utf8').includes(m[2]));process.exit(ok&&['export const refusals','export const limits','export const evidencePage','docs/plans/004-seatrial-e2e-gate.md','Deviations logged: 6 (3 discovered by wavecheck)','Bash-mediated writes bypass file-tool hooks','href: '+q+'/evidence'+q,'href: '+q+'/#refuses'+q].every(k=>s.includes(k))?0:1)"`

### Wave 1.1 - Sections, route, nav

> Six disjoint tasks against the frozen T1.0.1 contract. `npm run verify` is
> expected red until T1.3.1 (D12); each criterion builds and checks its own
> output.

#### T1.1.1 - Hero: claim, real artifact, install above the fold, no hidden paint

- **Description:** Rebuild `Hero.tsx` as a server component with no `motion` import: text column (badges, plain `<h1>`, promise, sub, both install commands, CTAs) beside, at `lg`, a mono block rendering `hero.artifact`, plus the thesis band. Remove the wave diagram.
- **Files owned:** `site/components/sections/Hero.tsx`
- **Depends on:** T1.0.1
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D2, D3, D6; `site/components/sections/Hero.tsx`; `site/components/sections/Terminal.tsx` (the line-tone rendering to reuse); `site/content/copy.ts` `hero`, `install`; plan 001 deviation 42 (plain `<h1>`); CLAUDE.md "Tailwind v4 is CSS-first" and "A `--color-*` token can silently shadow".
- **Implementation sketch:** The artifact `<pre>` carries `data-excerpt-of={hero.artifact.source}`, and each line is one `<span className="block ...">` holding exactly `line.text` with no other children (T1.3.1 parses these). The `<pre>` sits in an `overflow-x-auto` box so a long line never widens the page. The caption links `hero.artifact.href`. Install commands render as `<code>` lines visible at all widths. The header comment describes what now renders (plan 001 deviation 47).
- **Forbidden:** any `motion` import, `initial=` or `data-reveal` in this file; any SVG; editing `copy.ts`; more than one `<h1>`.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');try{c.execSync('npx next build',{cwd:'site',stdio:'ignore'})}catch(e){process.exit(1)}const q=String.fromCharCode(34);const raw=fs.readFileSync('site/out/index.html','utf8').replace(new RegExp('<script[^>]*>[^]*?</script>','g'),'');const a=raw.indexOf('<h1'),b=raw.indexOf('</h1>',a);const h=raw.slice(a,b);const p=raw.indexOf('id='+q+'problem'+q);const src=fs.readFileSync('site/components/sections/Hero.tsx','utf8');const i1=raw.indexOf('/plugin marketplace add SandeepTakasi/drydock'),i2=raw.indexOf('/plugin install drydock@drydock');process.exit(a>-1&&!h.includes('opacity:0')&&raw.includes('data-excerpt-of='+q+'docs/plans/004-seatrial-e2e-gate.md'+q)&&p>-1&&i1>-1&&i1<p&&i2>-1&&i2<p&&!src.includes('motion/react')&&!src.includes('strokeDasharray')?0:1)"`

#### T1.1.2 - The loop: three steps, the wave diagram, nine names linked out

- **Description:** Rebuild `Lifecycle.tsx` as the loop section: the three `lifecycle.steps`, the wave diagram moved from `Hero.tsx` with both SVG contracts intact, then the nine pieces as a compact list (name, kind, invocation, no detail) with a link to `lifecycle.readmeHref`.
- **Files owned:** `site/components/sections/Lifecycle.tsx`
- **Depends on:** T1.0.1
- **Model / thinking:** Complex / extended (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D3, D15; `site/components/sections/Hero.tsx` at the baseline SHA (`git show <baseline>:site/components/sections/Hero.tsx`, the diagram block and its header comment on the two SVG contracts); `site/components/sections/Lifecycle.tsx`; `site/lib/motion.ts` header rules 1-2; `site/scripts/measure-reduced-motion.mjs` C1/M1 (lines ~360-475); `site/content/copy.ts` `hero.wave`, `lifecycle`.
- **Implementation sketch:** `"use client"`; `useMotionSafe()`; the rail `motion.path` keeps `data-reveal-path` and `heroSequence.hull`, the gate `motion.path` keeps `data-reveal`, `waterlineReveal`, `strokeDasharray="10 8"`. Both switch from `animate="shown"` to `whileInView="shown"` with `viewport={{ once: true }}`, since the section is below the fold. It is still the document's only dashed path and only `data-reveal-path`. Every animated element carries `data-reveal`, and there are no timing literals (assert-copy's motion contract). The steps are an `<ol>`.
- **Forbidden:** changing the SVG geometry, viewBox, dash value or stroke tokens; rendering `piece.detail`; editing `copy.ts` or `lib/motion.ts`.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');try{c.execSync('npx next build',{cwd:'site',stdio:'ignore'})}catch(e){process.exit(1)}const q=String.fromCharCode(34);const raw=fs.readFileSync('site/out/index.html','utf8').replace(new RegExp('<script[^>]*>[^]*?</script>','g'),'');const a=raw.indexOf('id='+q+'lifecycle'+q);const e=raw.indexOf('<section',a+1);const sec=raw.slice(a,e>-1?e:raw.length);const src=fs.readFileSync('site/components/sections/Lifecycle.tsx','utf8');process.exit(a>-1&&sec.includes('stroke-dasharray='+q+'10 8'+q)&&sec.includes('data-reveal-path')&&sec.includes('APPROVED (HUMAN-ONLY)')&&sec.includes('drydock/README.md')&&!src.includes('piece.detail')?0:1)"`

#### T1.1.3 - What it refuses

- **Description:** Create `Refusals.tsx`, a server component in the `Section` shell rendering `refusals.lead` and, per item, title, body, the command line and the output in a `<pre>` carrying `data-source={item.source}` and `data-pin={item.pin}`.
- **Files owned:** `site/components/sections/Refusals.tsx`
- **Depends on:** T1.0.1
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D10; `site/components/Section.tsx` (spacing contract: no top margin on the first child); `site/components/sections/Problem.tsx` (a server section to mirror); `site/lib/section.ts` (`SectionProps`); `site/content/copy.ts` `refusals`, `meta.refuses`; CLAUDE.md "Per-file typecheck must go through a temp tsconfig".
- **Implementation sketch:** default export `Refusals({ meta }: SectionProps)`. The output `<pre>` holds `item.output` as its only text, inside an `overflow-x-auto` box. Pass/block colouring is not inferred from the text.
- **Forbidden:** a `motion` import; editing `copy.ts` or `page.tsx`.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs'),os=require('os'),p=require('path');const r=p.resolve('site');const t=p.join(os.tmpdir(),'dd012-refusals.json');fs.writeFileSync(t,JSON.stringify({extends:p.join(r,'tsconfig.json'),include:[],files:[p.join(r,'components','sections','Refusals.tsx')]}));try{c.execSync('npx tsc --noEmit --project '+JSON.stringify(t),{cwd:'site',stdio:'ignore'});c.execSync('npx eslint components/sections/Refusals.tsx',{cwd:'site',stdio:'ignore'})}catch(e){process.exit(1)}const s=fs.readFileSync('site/components/sections/Refusals.tsx','utf8');process.exit(s.includes('data-source=')&&s.includes('data-pin=')&&s.includes('refusals')&&s.includes('<Section')&&!s.includes('motion/react')?0:1)"`

#### T1.1.4 - Honest limits

- **Description:** Create `Limits.tsx`, a server component in the `Section` shell rendering `limits.lead`, `limits.items` as a `<ul>`, and a link to the evidence page (`next/link`, `href="/evidence"`) with `limits.evidenceLinkText`.
- **Files owned:** `site/components/sections/Limits.tsx`
- **Depends on:** T1.0.1
- **Model / thinking:** Mechanical / off (Haiku 4.5)   **Executor:** drydock:executor
- **Context brief:** D9; `site/components/sections/Problem.tsx`; `site/components/Section.tsx`; `site/lib/section.ts`; `site/content/copy.ts` `limits`, `meta.limits`; CLAUDE.md "Per-file typecheck must go through a temp tsconfig".
- **Forbidden:** a `motion` import; a plain `<a href="/evidence">` (it would miss `basePath`); editing `copy.ts`.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs'),os=require('os'),p=require('path');const r=p.resolve('site');const t=p.join(os.tmpdir(),'dd012-limits.json');fs.writeFileSync(t,JSON.stringify({extends:p.join(r,'tsconfig.json'),include:[],files:[p.join(r,'components','sections','Limits.tsx')]}));try{c.execSync('npx tsc --noEmit --project '+JSON.stringify(t),{cwd:'site',stdio:'ignore'});c.execSync('npx eslint components/sections/Limits.tsx',{cwd:'site',stdio:'ignore'})}catch(e){process.exit(1)}const s=fs.readFileSync('site/components/sections/Limits.tsx','utf8');process.exit(s.includes('next/link')&&s.includes('limits.items')&&s.includes('<Section')&&!s.includes('motion/react')?0:1)"`

#### T1.1.5 - The evidence page and its export path

- **Description:** Create the `/evidence` route rendering one `<h1>` (`evidencePage.heading`), the lead, a `next/link` home, and `<Evidence meta={meta.evidence} />`, with `metadata` from `evidencePage`. Set `trailingSlash: true` in `next.config.ts`.
- **Files owned:** `site/app/evidence/page.tsx`, `site/next.config.ts`
- **Depends on:** T1.0.1
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D8, D9, D11; `site/app/page.tsx`; `site/app/layout.tsx` (how `metadata` is set; `metadataBase` must not carry the basePath, CLAUDE.md); `site/components/sections/Evidence.tsx`; `site/next.config.ts`; `site/content/copy.ts` `evidencePage`, `meta.evidence`.
- **Forbidden:** changing `BASE_PATH` or anything else in `next.config.ts`; editing `Evidence.tsx` or `copy.ts`; a second `<h1>`.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');try{c.execSync('npx next build',{cwd:'site',stdio:'ignore'})}catch(e){process.exit(1)}const q=String.fromCharCode(34);const f='site/out/evidence/index.html';if(!fs.existsSync(f))process.exit(1);const raw=fs.readFileSync(f,'utf8').replace(new RegExp('<script[^>]*>[^]*?</script>','g'),'');const n=raw.split('<h1').length-1;const cfg=fs.readFileSync('site/next.config.ts','utf8');process.exit(n===1&&raw.includes('PUBLISHED, NOT PASSED')&&raw.includes('id='+q+'evidence'+q)&&cfg.includes('trailingSlash: true')&&cfg.includes('const BASE_PATH = '+q+'/drydock'+q)?0:1)"`

#### T1.1.6 - Nav that works from both pages

- **Description:** Render the header nav items, the wordmark (`href="/"`) and `MobileNav`'s items with `next/link`, so `/#install` and `/evidence` resolve under `basePath` from either page.
- **Files owned:** `site/app/layout.tsx`, `site/components/MobileNav.tsx`
- **Depends on:** T1.0.1
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D9; `site/app/layout.tsx` (header, ~lines 85-128; the skip link `#content` stays a plain `<a>`); `site/components/MobileNav.tsx` (it closes the menu on navigation, so keep that behaviour); `site/content/copy.ts` `nav`; e2e `tg6` (`header a img` must still match the wordmark).
- **Forbidden:** hardcoding `/drydock` anywhere; changing the skip link, `metadata`, fonts or the `<noscript>` block; editing `copy.ts`.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');try{c.execSync('npx next build',{cwd:'site',stdio:'ignore'})}catch(e){process.exit(1)}const q=String.fromCharCode(34);const raw=fs.readFileSync('site/out/index.html','utf8').replace(new RegExp('<script[^>]*>[^]*?</script>','g'),'');const h=raw.slice(raw.indexOf('<header'),raw.indexOf('</header>'));const m=fs.readFileSync('site/components/MobileNav.tsx','utf8');process.exit(new RegExp('href='+q+'/drydock/?#install'+q).test(h)&&new RegExp('href='+q+'/drydock/evidence/?'+q).test(h)&&m.includes('next/link')&&fs.readFileSync('site/app/layout.tsx','utf8').includes('next/link')?0:1)"`

### Wave 1.2 - Integration

#### T1.2.1 - Compose the page, retire Terminal and dead copy

- **Description:** Set `page.tsx` to Hero, Problem, Lifecycle, Refusals, Limits, Install, Faq. Delete `Terminal.tsx`, and remove from `copy.ts` what nothing renders any more: `terminal`, `meta.terminal`, `Piece.detail` and the `detail` strings.
- **Files owned:** `site/app/page.tsx`, `site/components/sections/Terminal.tsx`, `site/content/copy.ts`
- **Depends on:** T1.1.1, T1.1.2, T1.1.3, T1.1.4, T1.1.5, T1.1.6
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D3, D4, D12; `site/app/page.tsx` (update its header comment to the new argument order); `site/content/copy.ts`; `grep -rn "terminal\|detail\|TerminalLine" site/components site/app` before deleting anything (`TerminalLine` stays: `hero.artifact` uses it).
- **Forbidden:** touching `evidence.*`, `hero.*`, `refusals`, `limits` strings; adding sections; deleting `Evidence.tsx`.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');try{c.execSync('npx next build',{cwd:'site',stdio:'ignore'});c.execSync('npx tsc --noEmit',{cwd:'site',stdio:'ignore'});c.execSync('npx eslint .',{cwd:'site',stdio:'ignore'})}catch(e){process.exit(1)}const q=String.fromCharCode(34);const raw=fs.readFileSync('site/out/index.html','utf8').replace(new RegExp('<script[^>]*>[^]*?</script>','g'),'');const ix=['problem','lifecycle','refuses','limits','install','faq'].map(i=>raw.indexOf('id='+q+i+q));const asc=ix.every((v,k)=>v>-1&&(k===0||v>ix[k-1]));const s=fs.readFileSync('site/content/copy.ts','utf8');process.exit(asc&&!raw.includes('id='+q+'evidence'+q)&&!raw.includes('id='+q+'terminal'+q)&&raw.split('data-pin=').length-1===4&&!fs.existsSync('site/components/sections/Terminal.tsx')&&!s.includes('export const terminal')?0:1)"`

### Wave 1.3 - The gate learns two pages

#### T1.3.1 - assert-copy reads both pages and proves excerpts and pins

- **Description:** Extend `assert-copy.mjs` to assert two pages with split
  literal lists, and to verify the hero excerpt and the refusal pins against
  the repo files they claim to come from.
- **Files owned:** `site/scripts/assert-copy.mjs`
- **Depends on:** T1.2.1
- **Model / thinking:** Complex / extended (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D2, D10, D11; `site/scripts/assert-copy.mjs` in full (normalisation order, fixture mode, plan 001 deviation 38); CLAUDE.md "`out/index.html` contains the RSC flight payload" and "Never link a doc with a repo-relative `../` href"; the built `site/out/index.html` and `site/out/evidence/index.html`.
- **Implementation sketch (complete rule bodies):**
  - **Pages.** Default mode reads `out/index.html` (home) and `out/evidence/index.html` (evidence). Fixture mode (an argument given) treats the argument as home only and skips the evidence page, the motion contract and the version check, as today.
  - **`REQUIRED_HOME`** = the current list minus `"Nine pieces"`, `"Deviations logged: 1 (1 discovered by wavecheck)"`, `"PUBLISHED, NOT PASSED"`, `"ceiling, not a rate"`, `"1 skipped"`, `"Chromium only"` and `"A2b"`, plus `"Deviations logged: 6 (3 discovered by wavecheck)"`. Every comment on a kept literal stays; a moved literal's comment moves with it.
  - **`REQUIRED_EVIDENCE`** = `"PUBLISHED, NOT PASSED"`, `"ceiling, not a rate"`, `"1 skipped"`, `"Chromium only"`, `"A2b"`, `"outside the project directory are not enforced"`, `"Bash-mediated writes bypass file-tool hooks"`.
  - **Headings.** Each page has exactly one `<h1>`, and home's contains `Drydock`. Over-claim and relative-escape run on both pages. The `executor` discriminator runs on home.
  - **Excerpt check (both modes).** For every element carrying `data-excerpt-of="P"` in home's raw markup, read repo-root-relative `P` (fail if missing). Each `<span ...>` line inside that element, inner text decoded, has `**` and backticks stripped and whitespace collapsed, and must be a substring of P normalised the same way. At least one excerpt with at least one line must exist. Failure messages contain the word `excerpt`.
  - **Pin check (both modes).** For every element with `data-source="S"` and `data-pin="X"`: repo-relative `S` exists and contains `X`, and the element's decoded inner text contains `X`. Exactly 4 such elements on home. Failure messages contain the word `pin`.
  - The PASS line reports both pages and the excerpt and pin counts.
- **Forbidden:** weakening or deleting any existing check; reading `copy.ts`; a dependency.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs'),os=require('os'),p=require('path');try{c.execSync('npm run verify',{cwd:'site',stdio:'ignore'})}catch(e){process.exit(1)}const h=fs.readFileSync('site/out/index.html','utf8');const run=(name,body)=>{const f=p.join(os.tmpdir(),name);fs.writeFileSync(f,body);return c.spawnSync('node',['scripts/assert-copy.mjs',f],{cwd:'site',encoding:'utf8'})};const r0=run('dd012-ok.html',h);const r1=run('dd012-pin.html',h.split('does not own').join('does-not-own'));const r2=run('dd012-exc.html',h.split('Deviation reconciliation').join('Deviation reconcilation'));process.exit(r0.status===0&&r1.status===1&&(r1.stderr||'').includes('pin')&&r2.status===1&&(r2.stderr||'').includes('excerpt')?0:1)"`

### Wave 1.R - Quality review

#### T1.R.1 - Fresh-context review of the page against the evidence

- **Description:** After wavecheck 1.3 PASS, review the Phase 1 diff and the
  built pages: every claim traces to `compatibility.md` or a verbatim repo
  artifact, the hero reads as the drift problem, nothing renders hidden on first
  paint, the SVG contracts hold, the new gate checks can fail. Record
  `## Wave 1.R verdict, APPROVED|REJECTED, <date>`.
- **Files owned:** none (the verdict is written by the orchestrator)
- **Depends on:** T1.3.1
- **Model / thinking:** Judgment / extended (Opus 5.5)   **Executor:** general-purpose reviewer, fresh context
- **Context brief:** `git diff <baseline SHA>..HEAD -- site/`; this plan's Requirement, Decision Log, task blocks and Testing Gate; CLAUDE.md "Honesty rule for site copy"; `docs/compatibility.md`.
- **Acceptance criterion:** `node -e "const s=require('fs').readFileSync('docs/plans/012-homepage-restructure.md','utf8');process.exit(/^## Wave 1[.]R verdict, APPROVED/m.test(s)?0:1)"`

## Deviation Log

| # | Task | What deviated | Why | Impact | Recorded |
|---|---|---|---|---|---|
| 1 | T1.0.1 | `hero` has no explicit type, so `hero.artifact.source` and `verdict` infer as `string`, not the literal types the sketch shows; `lines` is cast `as TerminalLine[]` | Executor kept `hero` inferred like the rest of the object | None: consumers read the values, and the literal is pinned by T1.1.1's and T1.3.1's checks | executor report |
| 2 | T1.0.1 | Refusal 3's `output` is the hook's `systemMessage` | The hook emits no separate `permissionDecisionReason`; the systemMessage is its deny reason | None: pin `does not own` is in both the source and the output | executor report |
| 3 | T1.0.1 | Hero excerpt lines 2-6 are the first two cells of the plan 004 table rows (the Evidence cell is cut), line 7 starts mid-sentence inside row 5's Evidence cell, and line 10 omits that line's trailing `Plan status set to BLOCKED.` | Fits 10 lines in the hero; each line still passes this plan's operational test (normalised substring of the plan 004 file, Execution policies, D2) | Characters are verbatim but not every kept line is a whole source line. Not blocking under the plan's mechanical definition; flagged for the human at the Phase 1 gate (D16), who may require whole lines | discovered-by-wavecheck |
| 4 | T1.1.2 | `lifecycle.flow` is no longer rendered by `Lifecycle.tsx`, and T1.2.1's removal list does not name it, so it stays in `copy.ts` as unrendered copy | The task's description lists steps, diagram and the nine-name list; the flow strip has no place in it | Dead copy only; no pinned literal lives in it (checked against `assert-copy.mjs` REQUIRED). Left for the review or a follow-up rather than widening T1.2.1 | executor report |

## Wavecheck reports

### Wavecheck 1.0 - PASS - 2026-10-07

`execution: fleet`: T1.0.1 was written by a spawned `drydock:executor` (Opus 5.5); this audit is by the orchestrator, which did not write the diff.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `status: EXECUTING` (set in `160e92b` before `wave-start`); wave 1.0 exists; no prior wave; `validate-plan` PASS, no VERSION DRIFT (0.17.1) |
| 2. Ownership audit | PASS | `audit-wave 1.0: PASS` (1 task, 1 commit, attribution: manifest). Table and enforcement sentence pasted verbatim below. Hook decisions were recorded, so enforcement ran; no Bash write landed outside `owns` |
| 3. Forbidden audit | PASS | `git diff 15570df..3bb4c78`: no `evidence.rows` or `evidence.provenance` hunk; `terminal`, `meta.terminal`, `Piece.detail` and the nine `detail` strings still present; the only added em dashes are the verbatim excerpt line `Wavecheck 1.1 — BLOCK — 2026-08-20` and a comment quoting it; no local path or username in any `output`; limits claims trace to compatibility.md A3 (28 of 29, 5 pilot plans, ceiling) and to evidence-row notes already on the page; only `copy.ts` changed |
| 4. Acceptance audit | PASS | T1.0.1 criterion re-run through `spawnSync(crit, {shell: true})` (cmd.exe): exit 0. Wave 1.0 extra check: all 10 `hero.artifact.lines[].text`, `**` and backticks stripped and whitespace collapsed, are substrings of `docs/plans/004-seatrial-e2e-gate.md` normalised the same way (10 of 10) |
| 5. Deviation reconciliation | PASS | Executor reported 2 deviations, logged as 1 and 2. One discovered here, logged as 3 (excerpt lines are verbatim fragments, not whole lines), non-blocking under the plan's operational definition and carried to the human gate |

### audit-wave 1.0, docs/plans/012-homepage-restructure.md

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.0.1 | `3bb4c78` | `site/content/copy.ts` | `site/content/copy.ts` | none |

  note: enforcement active: 4 hook decision(s) recorded for wave 1.0 (0 denied)

Deviations logged: 3 (1 discovered by wavecheck)

### Wavecheck 1.1 - PASS - 2026-10-07

`execution: fleet`: each task was written by its own spawned `drydock:executor` (Sonnet 5.5 for T1.1.1-T1.1.3, T1.1.5, T1.1.6; Haiku 4.5 for T1.1.4), one at a time; this audit is by the orchestrator, which wrote none of the diff.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `status: EXECUTING`; wave 1.1 exists; wave 1.0 has a PASS report (`e9af5d4`). Staleness check: `git diff 15570df..HEAD` over the wave's owned files and `copy.ts` shows only T1.0.1's `3bb4c78`, a handoff |
| 2. Ownership audit | PASS | `audit-wave 1.1: PASS` (6 tasks, 6 commits, attribution: manifest); 13 hook decisions recorded, so enforcement ran; no Bash write landed outside `owns`. Table and enforcement sentence below |
| 3. Forbidden audit | PASS | Hero.tsx: no `motion`, `initial=`, `data-reveal`, `<svg>`; one `<h1>`. Lifecycle.tsx: both `d` strings, `viewBox="0 0 960 96"`, `strokeDasharray="10 8"`, `var(--color-line-strong)`/`var(--color-accent)`, `var(--stroke-rule)` identical to `15570df:Hero.tsx`; only `animate` became `whileInView` + `viewport={{ once: true }}`; no `piece.detail`. Refusals.tsx, Limits.tsx: no `motion` import; Limits uses `next/link`. `next.config.ts`: the single added line is `trailingSlash: true`. layout.tsx: skip link `href="#content"` (line 79), `metadata`, fonts and `<noscript>` untouched; the wordmark (previously `<a href="#content">`) and nav items became `<Link>`; no `/drydock` literal outside comments. No task touched `copy.ts` |
| 4. Acceptance audit | PASS | All six criteria re-run through `spawnSync(crit, {shell: true})` (cmd.exe): T1.1.1 0, T1.1.2 0, T1.1.3 0, T1.1.4 0, T1.1.5 0, T1.1.6 0. Extra: `measure-reduced-motion.mjs` PASS (waterline "10px, 8px", hull opacity 1 dasharray none, invisibleText=0), so C1/M1 survive the move. `npm run verify` not run: red by design until T1.3.1 (D12) |
| 5. Deviation reconciliation | PASS | One reported deviation-shaped observation logged as 4. T1.1.2's mid-task criterion failure on a comment containing `piece.detail` was fixed before its commit, inside its own file: not a deviation. Note for Wave 1.R, not a conformance finding: T1.1.5's evidence page renders its `<h1>`, lead and home link as unstyled markup outside any container |

### audit-wave 1.1, docs/plans/012-homepage-restructure.md

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.1.1 | `7edc8af` | `site/components/sections/Hero.tsx` | `site/components/sections/Hero.tsx` | none |
| T1.1.2 | `e686060` | `site/components/sections/Lifecycle.tsx` | `site/components/sections/Lifecycle.tsx` | none |
| T1.1.3 | `ef0ee13` | `site/components/sections/Refusals.tsx` | `site/components/sections/Refusals.tsx` | none |
| T1.1.4 | `53d2a95` | `site/components/sections/Limits.tsx` | `site/components/sections/Limits.tsx` | none |
| T1.1.5 | `73a0ad2` | `site/app/evidence/page.tsx`<br>`site/next.config.ts` | `site/app/evidence/page.tsx`<br>`site/next.config.ts` | none |
| T1.1.6 | `f2c1f62` | `site/app/layout.tsx`<br>`site/components/MobileNav.tsx` | `site/app/layout.tsx`<br>`site/components/MobileNav.tsx` | none |

  note: enforcement active: 13 hook decision(s) recorded for wave 1.1 (0 denied)

Deviations logged: 4 (1 discovered by wavecheck)

### Wavecheck 1.2 - PASS - 2026-10-07

`execution: fleet`: T1.2.1 was written by a spawned `drydock:executor` (Sonnet 5.5); this audit is by the orchestrator, which wrote none of the diff.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `status: EXECUTING`; wave 1.2 exists; waves 1.0 and 1.1 have PASS reports (`0099d11`). Staleness: the only commit on the owned paths since `15570df` is T1.0.1's `3bb4c78`, a handoff |
| 2. Ownership audit | PASS | `audit-wave 1.2: PASS` (1 task, 1 commit, attribution: manifest); 1 hook decision recorded, so enforcement ran; the `Terminal.tsx` deletion went through `git rm` (Bash) and is inside `owns`; no Bash write outside it. Table and enforcement sentence below |
| 3. Forbidden audit | PASS | `git diff 3bb4c78..642363f -- site/content/copy.ts` adds no line; its five hunks remove `Piece.detail`, `meta.terminal` and its key, the `terminal` export (lines 330-365, which follow `evidence` and are not inside it) and the nine `detail` strings. No `evidence.*`, `hero.*`, `refusals` or `limits` line changed. `Evidence.tsx` exists; `page.tsx` adds no section beyond the seven named |
| 4. Acceptance audit | PASS | T1.2.1 criterion re-run through `spawnSync(crit, {shell: true})` (cmd.exe): exit 0 (build, `tsc --noEmit`, `eslint .`, section order problem < lifecycle < refuses < limits < install < faq, no `id="evidence"`/`id="terminal"`, 4 `data-pin=`, Terminal.tsx gone). `npm run verify` not run: red by design until T1.3.1 (D12) |
| 5. Deviation reconciliation | PASS | Executor reported none. Its observation that `meta.evidence` still reads `04 / THE EVIDENCE`, duplicating limits' `04`, concerns a string T1.2.1 was forbidden to touch and that the evidence page may render; carried to Wave 1.R, not a conformance finding |

### audit-wave 1.2, docs/plans/012-homepage-restructure.md

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.2.1 | `642363f` | `site/app/page.tsx`<br>`site/components/sections/Terminal.tsx`<br>`site/content/copy.ts` | `site/app/page.tsx`<br>`site/components/sections/Terminal.tsx`<br>`site/content/copy.ts` | none |

  note: enforcement active: 1 hook decision(s) recorded for wave 1.2 (0 denied)

Deviations logged: 4 (1 discovered by wavecheck)

## Progress log

| Date | Task | Result | Notes |
|---|---|---|---|
| 2026-10-07 | T0 | PASS | Baseline filled, README row added, status EXECUTING |
| 2026-10-07 | T1.0.1 | PASS | `3bb4c78`; wavecheck 1.0 PASS |
| 2026-10-07 | T1.1.1-T1.1.6 | PASS | `7edc8af`, `e686060`, `ef0ee13`, `53d2a95`, `73a0ad2`, `f2c1f62`; wavecheck 1.1 PASS |
| 2026-10-07 | T1.2.1 | PASS | `642363f`; wavecheck 1.2 PASS |

## Reconcile report
