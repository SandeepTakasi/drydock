/**
 * Frozen site content. EVERY on-page string lives here.
 *
 * Downstream section components import from this module and must not
 * hardcode copy. Factual claims are transcribed from (and only from):
 * drydock/README.md, docs/self-audit.md, docs/compatibility.md,
 * drydock/skills/wavecheck/SKILL.md, drydock/.claude-plugin/plugin.json.
 *
 * No metric, percentage or benchmark is invented here: none is published yet.
 *
 * Two conventions carried over from plan 001 (F11): no apostrophes and no
 * em-dashes in any string. `scripts/assert-copy.mjs` normalises tags to
 * spaces, so a required literal must never be split across markup.
 */

import type { SectionMeta } from "@/lib/section";

export interface Piece {
  name: string;
  kind: string;
  summary: string;
  invocation: string;
}

/** One row of the evidence matrix. `tone` picks the status pill colour. */
export interface EvidenceRow {
  id: string;
  label: string;
  status: string;
  tone: "pass" | "hold";
  note: string;
}

export interface TerminalLine {
  text: string;
  tone: "dim" | "ink" | "accent" | "pass" | "block";
}

/**
 * One hero tour scene. `lines` are verbatim from `source`: the first is the
 * heading of the section they come from, and assert-copy checks every line in
 * order inside that section. Exactly one scene sets `verdict`, which binds its
 * badge to the heading's PASS or BLOCK.
 */
export interface TourScene {
  id: string;
  tab: string;
  label: string;
  badge: string;
  badgeTone: "accent" | "pass" | "block";
  verdict?: true;
  source: string;
  href: string;
  lines: TerminalLine[];
  caption: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

/**
 * One refusal, pasted from a real run. `source` is the repo-relative file that
 * emits it and `pin` a static fragment of the message that must appear both in
 * that file and in `output`. `output` is verbatim: whole lines may be dropped,
 * characters in kept lines never altered.
 */
export interface Refusal {
  title: string;
  body: string;
  command: string;
  source: string;
  pin: string;
  output: string;
  href?: string;
  hrefLabel?: string;
}

/** Section shells. Hero is exempt from SectionMeta and has no entry here. */
export const meta: Record<
  | "problem"
  | "lifecycle"
  | "ways"
  | "refuses"
  | "limits"
  | "evidence"
  | "install"
  | "faq",
  SectionMeta
> = {
  problem: {
    id: "problem",
    eyebrow: "01 / THE PROBLEM",
    heading: "Parallel agents collide, then they drift",
  },
  lifecycle: {
    id: "lifecycle",
    eyebrow: "02 / HOW IT WORKS",
    heading: "Plan it, build it in waves, check every wave",
  },
  ways: {
    id: "ways",
    eyebrow: "03 / WHERE IT FITS",
    heading: "Three ways in, from one change to every pull request",
  },
  refuses: {
    id: "refuses",
    eyebrow: "04 / WHAT IT CATCHES",
    heading: "Five things it will not let through",
  },
  limits: {
    id: "limits",
    eyebrow: "05 / LIMITS",
    heading: "What it does not do",
  },
  evidence: {
    id: "evidence",
    eyebrow: "THE MATRIX",
    heading: "Every row, with its status and date",
  },
  install: {
    id: "install",
    eyebrow: "06 / GET STARTED",
    heading: "Start in three steps",
  },
  faq: {
    id: "faq",
    eyebrow: "07 / QUESTIONS",
    heading: "Questions people ask",
  },
};

const VERSION = "0.19.0";

/**
 * Docs live in the repo, not in the export — only `site/out` is deployed. So
 * every link to a doc has to leave for GitHub, which renders markdown anyway.
 *
 * These were once repo-relative (`../docs/self-audit.md`), written when there
 * was no deploy and the only way to read the site was locally beside the repo
 * tree. On GitHub Pages `../` escapes the basePath to the domain root: all four
 * were 404s in production. `assert-copy.mjs` now rejects any `../` href.
 */
const REPO = "https://github.com/SandeepTakasi/drydock";
const BLOB = `${REPO}/blob/main`;

export const site = {
  title: "Drydock: parallel Claude Code agents, checked against the plan",
  description:
    "A Claude Code plugin: plan a change, let agents build it in parallel inside the files each one owns, and get every wave audited against the real git diff before the next one starts.",
  githubLabel: "GitHub",
  version: VERSION,
  selfAuditHref: `${BLOB}/docs/self-audit.md`,
  selfAuditLinkText: "Read the self-audit",
  skipLinkText: "Skip to content",
  wordmark: "Drydock",
  /**
   * `origin` is the bare host, `url` the full page address. They are separate
   * on purpose: Next prepends `basePath` to every metadata-relative asset, so a
   * `metadataBase` that already contains `/drydock` emits
   * `/drydock/drydock/opengraph-image.png` — measured, and a 404 on every share.
   * metadataBase takes `origin`; anything absolute (og:url) takes `url`.
   */
  origin: "https://sandeeptakasi.github.io",
  url: "https://sandeeptakasi.github.io/drydock/",
  repo: REPO,
};

/** Top-bar navigation. Home sections as `/#id`, the evidence page as a route. */
export const nav: { href: string; label: string }[] = [
  { href: "/#lifecycle", label: "How it works" },
  { href: "/#ways", label: "Where it fits" },
  { href: "/#refuses", label: "What it catches" },
  { href: "/evidence", label: "Evidence" },
  { href: "/#install", label: "Get started" },
];

export const hero = {
  meta: `Claude Code plugin · v${VERSION} · open pilot · MIT`,
  headline: "Drydock",
  promise: "Your agents build what you approved. Drydock checks that they did.",
  thesis: "NOTHING SAILS UNTIL IT LEAVES THE DOCK",
  sub: "Plan a change, let Claude Code agents build it in parallel, each inside the files it owns, and get every wave audited against the real git diff before the next one starts. Collisions and edits outside the plan get caught at the gate, not found in your repo.",
  ctaPrimary: "Get started",
  ctaSecondary: "Star on GitHub",
  tourLead:
    "Five real moments from this repo, one per part of the loop. Every line is copied from the record it links to.",
  tourLabel: "Drydock tour",
  tourPause: "Pause the tour",
  tourPlay: "Play the tour",
  tourPauseShort: "Pause",
  tourPlayShort: "Play",
  /**
   * The hero tour. Each `text`, with `**` and backticks stripped and
   * whitespace collapsed, is a substring of its `source` normalised the same
   * way, in order, inside the section its first line heads. Lines may be
   * trimmed, never reworded. Proven against the real files by
   * scripts/assert-copy.excerpt.test.mjs.
   */
  tour: [
    {
      id: "plan",
      tab: "Plan",
      label: "drydock:planwright, plan 014",
      badge: "PLAN",
      badgeTone: "accent",
      source: "docs/plans/014-scope-gate-action.md",
      href: `${BLOB}/docs/plans/014-scope-gate-action.md`,
      lines: [
        { text: "T1.1.1 - gate.mjs and its test", tone: "accent" },
        { text: "- Files owned: scope-gate/gate.mjs, scope-gate/gate.test.mjs", tone: "ink" },
        { text: "- Depends on: T0", tone: "dim" },
        { text: "- Model / thinking: Complex / extended (Sonnet 5.5) Executor: drydock:executor", tone: "dim" },
        { text: "- Forbidden: editing drydock-audit.mjs or any file outside owns", tone: "block" },
        { text: "- Acceptance criterion: node -e", tone: "ink" },
      ],
      caption:
        "planwright splits a change into tasks, each with the files it may touch, what it must not do, and a command that proves it is done.",
    },
    {
      id: "guard",
      tab: "Guard",
      label: "live hook, run A12",
      badge: "DENIED",
      badgeTone: "block",
      source: "docs/verification-log.md",
      href: `${BLOB}/docs/verification-log.md#a12--arm-guard-in-a-live-session`,
      lines: [
        { text: "A12 — arm guard in a live session", tone: "dim" },
        { text: "arm: armed 1 glob(s) from .drydock/check.md", tone: "ink" },
        { text: "Drydock ownership violation: wave check does not own tmp-a12/stray.txt.", tone: "block" },
        { text: "Owned by this wave: tmp-a12/ok.txt", tone: "dim" },
        { text: "check: PASS (1 file(s), 0 criteria)", tone: "pass" },
        { text: "FLAG outside scope: tmp-a12/bash.txt", tone: "block" },
        { text: "check: FLAG (1)", tone: "block" },
      ],
      caption:
        "With the guard armed, the live hook refused a write outside the scope. A Bash write is not prevented: it landed, and the audit flagged it.",
    },
    {
      id: "audit",
      tab: "Audit",
      label: "drydock:wavecheck, plan 004",
      badge: "BLOCK",
      badgeTone: "block",
      verdict: true,
      source: "docs/plans/004-seatrial-e2e-gate.md",
      href: `${BLOB}/docs/plans/004-seatrial-e2e-gate.md`,
      lines: [
      { text: "Wavecheck 1.1 — BLOCK — 2026-08-20", tone: "block" },
      { text: "| 1. Plan integrity | PASS |", tone: "pass" },
      { text: "| 2. Ownership audit | PASS |", tone: "pass" },
      { text: "| 3. Forbidden audit | PASS |", tone: "pass" },
      { text: "| 4. Acceptance audit | PASS |", tone: "pass" },
      { text: "| 5. Deviation reconciliation | BLOCK |", tone: "block" },
      {
        text: "T1.1.5 invented a fourth verdict value PARTIAL that the format contract does not define",
        tone: "dim",
      },
      {
        text: "Nothing was fixed by this audit. An auditor who edits the code under audit is no auditor.",
        tone: "dim",
      },
      { text: "Deviations logged: 6 (3 discovered by wavecheck)", tone: "dim" },
      { text: "Verdict: BLOCK. Wave 1.2 must not start.", tone: "block" },
      ],
      caption:
        "Four checks passed, one did not, and the next wave was not allowed to start: the gate blocked a verdict value the plan format does not define.",
    },
    {
      id: "ci",
      tab: "CI",
      label: "scope-gate, run A13",
      badge: "FLAG",
      badgeTone: "block",
      source: "docs/verification-log.md",
      href: `${BLOB}/docs/verification-log.md#a13--scope-gate-action-on-real-pull-requests`,
      lines: [
        { text: "A13 — scope-gate Action on real pull requests", tone: "dim" },
        { text: "- Files owned: scope-gate-probe/**", tone: "ink" },
        { text: "- Acceptance criterion: node scope-gate/gate.test.mjs", tone: "ink" },
        { text: "check: PASS (1 file(s), 1 criteria)", tone: "pass" },
        { text: "FLAG outside scope: stray-probe.txt", tone: "block" },
        { text: "check: FLAG (1)", tone: "block" },
        { text: "Check-run annotation: stray-probe.txt: outside the scope declared in #25.", tone: "block" },
      ],
      caption:
        "In CI, a pull request inside the scope its issue declared passed, and one adding an unowned file failed with that file named.",
    },
    {
      id: "reconcile",
      tab: "Reconcile",
      label: "drydock:reconcile, plan 015",
      badge: "PROPOSED",
      badgeTone: "accent",
      source: "docs/plans/015-release-019-site.md",
      href: `${BLOB}/docs/plans/015-release-019-site.md`,
      lines: [
        { text: "Proposals", tone: "dim" },
        { text: "Proposal R1 | target: CLAUDE.md | kind: addition", tone: "accent" },
        { text: "Finding: 375px horizontal page scroll shipped through four PASS wave gates", tone: "ink" },
        { text: "Confidence: high", tone: "dim" },
        { text: "+- whitespace-nowrap inside a grid or flex child widens the page.", tone: "pass" },
        { text: "Proposal R2 | target: CLAUDE.md | kind: correction", tone: "accent" },
        { text: "Proposal R3 | target: CLAUDE.md | kind: addition", tone: "accent" },
      ],
      caption:
        "When a plan closes, reconcile turns what went wrong into proposed fixes to your docs. They are applied only when you approve them.",
    },
  ] satisfies TourScene[],
  wave: {
    label: "WAVE 1.1",
    subLabel: "3 TASKS · DISJOINT OWNERSHIP",
    caption:
      "Illustration, not a captured run: one wave, three tasks owning three separate files, one gate, one human approval.",
    diagramAriaLabel:
      "Three parallel task lanes converging into a single gate line below them",
    ownsLabel: "OWNS",
    tasks: [
      { id: "T1.1.1", model: "haiku", owns: "content/copy.ts" },
      { id: "T1.1.2", model: "sonnet", owns: "lib/motion.ts" },
      { id: "T1.1.3", model: "opus", owns: "components/Hero.tsx" },
    ],
    gate: {
      name: "wavecheck 1.1",
      verdict: "PASS",
      approval: "STATUS: APPROVED (HUMAN-ONLY)",
    },
  },
};

export const problem = {
  lead: "Running subagents in parallel fails in two ways. The first is loud. The second is quiet, and it is the expensive one.",
  modes: [
    {
      index: "01",
      title: "Collision",
      body: "Two agents edit the same file. One write lands on top of the other, and nobody notices until something downstream breaks.",
    },
    {
      index: "02",
      title: "Drift",
      body: "Each agent does something reasonable: a helpful refactor, a renamed export, a fix while it was nearby. Every check stays green, and the change you shipped is no longer the change you planned.",
    },
  ],
  coda: "Drifted code is often good code. It is just not the code the plan asked for, and a quality review is not looking for that difference. Drydock is.",
};

export const evidence: {
  rows: EvidenceRow[];
  provenance: string;
  planHref: string;
  planLinkText: string;
} = {
  rows: [
    {
      id: "--",
      label: "Contract logic (audit soundness, BLOCK path, attribution)",
      status: "VERIFIED",
      tone: "pass",
      note: "Adversarial dry-run: the ownership audit caught a rogue executor that edited a sibling task file and reported no deviations, while every test stayed green. The same dry-run exposed a real attribution defect, fixed in v0.3.0.",
    },
    {
      id: "A1",
      label:
        "Per-task model override at spawn (param vs agent frontmatter precedence)",
      status: "PASSED",
      tone: "pass",
      note: "2026-08-18, host 2.1.234. The spawn param beat the agent frontmatter across 4 spawns in 2 independent runs. Evidence is agent self-report against a frontmatter control. Still untested: agent-teams mode, which Drydock does not use.",
    },
    {
      id: "A2",
      label: "isolation: worktree agent spawning",
      status: "PASSED",
      tone: "pass",
      note: "2026-08-18, host 2.1.234, git 2.51.0. Worktree created on its own branch, checkpoint commit in contract format touching only the owned file, main tree left unmerged. A worktree holding changes is not auto-removed: cleanup is the orchestrator job.",
    },
    {
      id: "A2b",
      label: "Post-wavecheck worktree merge procedure",
      status: "PASSED",
      tone: "pass",
      note: "2026-08-19. Disjoint worktrees merge conflict-free in task-id order and the integration smoke passes; a rogue edit colliding with a sibling conflicts, and aborting restores the target branch with the compliant work intact. Verified mechanically rather than agent-driven. One limitation, measured: a clean merge is not evidence of ownership compliance, because a non-colliding unowned edit merges silently. The ownership audit is the only defence there.",
    },
    {
      id: "A4",
      label: "claude plugin validate --strict",
      status: "PASSED",
      tone: "pass",
      note: "2026-08-18, including the disable-model-invocation and isolation frontmatter.",
    },
    {
      id: "A3",
      label:
        "Orchestrator gate compliance (wavecheck invoked unprompted between waves)",
      status: "PUBLISHED, NOT PASSED",
      tone: "hold",
      note: "28 of 29 wave gates invoked at their boundary across 5 pilot plans, with 1 skipped and 27 of 29 recorded before the next wave opened. The skip is the useful part: the following gate refused to open on the missing report, and the retroactive audit then blocked on a real ownership breach, so the recovery path is observed rather than assumed. Every session counted knew it was being observed, so read the figure as a ceiling, not a rate. The sample now touches the bottom of the 5 to 10 this row asks for, on its weakest instance: one session planned, executed and audited the fifth plan, so the count moved and what it is evidence of did not.",
    },
    {
      id: "A5",
      label: "Browser-drive round trip through Playwright MCP",
      status: "PASSED",
      tone: "pass",
      note: "2026-08-22, driven against this site's own export served at its basePath. Nine driver capabilities returned live state, each confirmed by a second measurement rather than by the call not erroring: navigation, snapshot, clicks that moved the page, style evaluation, network recording, resize, tabs, console. Two constraints stand. Availability is per-session and belongs to the environment rather than to Drydock, and seatrial halts with instructions when the driver is missing. Video evidence cannot be captured through this driver at all.",
    },
    {
      id: "A6",
      label: "Ownership enforcement hook fires in a live session",
      status: "PASSED",
      tone: "pass",
      note: "Verified live on 2026-08-22 by a session that wrote none of this code. A write and a real edit to unowned paths were both refused, files untouched; writes inside the boundary were allowed and logged; closing the wave let the same refused write through. Two ceilings stand, both exercised rather than assumed: Bash-mediated writes bypass file-tool hooks entirely, and paths outside the project directory are not enforced. The wave audit is the backstop.",
    },
    {
      id: "A7",
      label: "seatrial Testing Gate executes end to end",
      status: "OBSERVED, TWO FULL RUNS",
      tone: "hold",
      note: "Run twice, 2026-08-20 and 2026-08-26, twelve commits apart, with identical verdicts: six cases, three passes, and three failures that the plan designed to fail: a false expectation, an unperformable step that halted to ask rather than improvise, and a video clause this driver cannot satisfy. Both sheets closed NO-GO; seatrial writes no override for its own failures. The second run also halted on stale cases and on an unreachable target, and wrote nothing at all when the driver dropped mid-suite. The specs it generated now run in CI and pass: Chromium only, one viewport, first executed 2026-09-02.",
    },
    {
      id: "A10",
      label:
        "check skill (scope audit without a plan) runs in a live session",
      status: "OBSERVED FLAG THEN PASS",
      tone: "hold",
      note: "2026-10-07. Inside an armed plan wave the audit flagged an untracked probe, then passed once it was deleted. Later the same day the open gaps were shown: typed as the slash command on unplanned, unarmed work it flagged three files outside scope and stopped to ask, and model-invoked on unplanned site work it passed twice. Not shown: a repo other than this one, or a user who did not write the plugin.",
    },
    {
      id: "A11",
      label:
        "planwright runs its learnings step in a live session (stopped after Step 2)",
      status: "OBSERVED PARTIAL",
      tone: "hold",
      note: "2026-10-07. In Step 2 the skill ran the learnings call on two concrete paths and carried the hits it printed into its findings text. Not shown: Steps 3 to 6, since the run stopped after Step 2 on supplied interview answers and wrote no plan, nor the slash command or a real user.",
    },
    {
      id: "A12",
      label: "arm guard (ownership hook armed from a check intent file, no plan) fires in a live session",
      status: "PASSED",
      tone: "pass",
      note: "2026-10-07, installed 0.17.1. With no plan wave armed, arm wrote a check boundary from an intent file owning one path. A Write outside it was denied by the live hook and the file stayed absent; an edit to the owned path was allowed; check reported the hook armed and passed; disarming let the same Write through. The ceiling was observed too: a Bash write landed while armed and check flagged it afterwards.",
    },
    {
      id: "A13",
      label:
        "scope-gate Action fails a PR outside the scope declared in its linked issue, on GitHub-hosted runners",
      status: "PASSED",
      tone: "pass",
      note: "2026-10-09, on GitHub-hosted runners. Issue #25 declared a scope; a pull request inside it passed, and a pull request adding a file outside it failed, naming that file. The refusals for untrusted authors, missing or extra links, late issues and linked pull requests, a forbidden glob and a failing criterion are proven by the test suite, not yet live. The issue and both pull requests were opened by the owner account, and no other repository has used the Action yet.",
    },
  ],
  provenance: "This page is not a brochure for something built elsewhere. The site was planned, executed in parallel waves and gated with Drydock itself, across five plans whose deviation logs are in the repo.",
  planHref: `${BLOB}/docs/plans/001-drydock-homepage.md`,
  planLinkText: "Read the plan that built this",
};

export const lifecycle: {
  loop: string;
  commandLabel: string;
  outcomeLabel: string;
  piecesSummary: string;
  steps: {
    index: string;
    title: string;
    body: string;
    command?: string;
    outcome: string;
  }[];
  readmeHref: string;
  readmeLinkText: string;
  pieces: Piece[];
} = {
  commandLabel: "You type",
  outcomeLabel: "You get",
  piecesSummary: "All nine pieces of the plugin",
  steps: [
    {
      index: "01",
      title: "Plan the change",
      body: "planwright interviews you, reads the code the change touches, and writes a plan: tasks grouped into waves, the exact files each task may touch, and a command that proves each task is done. Nothing runs until you approve it.",
      command: "/drydock:planwright add rate limiting to the API",
      outcome: "A plan file in docs/plans, waiting for your approval.",
    },
    {
      index: "02",
      title: "Build in parallel waves",
      body: "Agents take one task each and work side by side. Each may only write the files its task owns: while the wave runs, a hook denies file-tool edits to other files in the project.",
      outcome: "One commit per task, each inside its own files.",
    },
    {
      index: "03",
      title: "Check every wave against the diff",
      body: "wavecheck reads what actually changed in git, not what the agents say they did: the right files, the checks passing, nothing extra. PASS opens the next wave. BLOCK stops the plan and says why.",
      outcome: "PASS or BLOCK, written into the plan with its evidence.",
    },
  ],
  readmeHref: `${BLOB}/drydock/README.md`,
  readmeLinkText: "Read the plugin README for every piece",
  loop: "On a BLOCK nothing retries on its own: you decide, or /drydock:replan repairs the plan.",
  pieces: [
    {
      name: "init",
      kind: "skill",
      summary: "Learns your repo before the first plan: its quality gates, test framework, commit style and CI. Asks only what it cannot detect, then saves a profile every later plan follows.",
      invocation: "model or /drydock:init (once per repo)",
    },
    {
      name: "planwright",
      kind: "skill",
      summary: "Interviews you on your practices, maps the code the change touches and pulls lessons from past plans. Then splits the work into parallel waves, picks the right model for each task, and pressure-tests the plan before you approve it.",
      invocation: "model or /drydock:planwright",
    },
    {
      name: "executor",
      kind: "agent",
      summary: "Takes one task and nothing more: writes only the files it owns, checks every acceptance criterion itself, and reports a deviation instead of working around it.",
      invocation: "spawned per task, or in-session when solo",
    },
    {
      name: "executor-isolated",
      kind: "agent",
      summary: "The executor contract in its own git worktree, so tasks running side by side never share a checkout.",
      invocation: "spawned per task",
    },
    {
      name: "wavecheck",
      kind: "skill",
      summary: "Audits each finished wave against the real diff, not what the agents report: file ownership, forbidden changes, acceptance criteria, deviations. PASS or BLOCK, and the next wave waits on a PASS.",
      invocation: "blocking gate inside every plan",
    },
    {
      name: "replan",
      kind: "skill",
      summary: "Repairs a blocked or stale plan: re-checks its decisions against the current code and patches only what broke. Finished waves and their reports stay untouched.",
      invocation: "human-only (disable-model-invocation)",
    },
    {
      name: "seatrial",
      kind: "skill",
      summary: "Runs the end-to-end cases written into the plan in a real browser, captures the evidence each case asks for, and hands QA re-runnable Playwright specs and a go/no-go sheet.",
      invocation: "model, or /drydock:seatrial (after the final wave)",
    },
    {
      name: "reconcile",
      kind: "skill",
      summary: "Closes the loop: compares what the plan assumed with what execution found, and proposes edits to CLAUDE.md, ADRs and docs. Proposed for you to apply, never applied for you.",
      invocation: "final step of every plan",
    },
    {
      name: "check",
      kind: "skill",
      summary: "For changes too small to plan: state the scope in a few lines, do the work, and get an audit of every file and criterion that strayed outside it.",
      invocation: "model or /drydock:check (no plan)",
    },
  ],
};

export const ways: {
  lead: string;
  items: {
    title: string;
    command: string;
    body: string;
    href?: string;
    linkText?: string;
  }[];
  plannerNote: string;
} = {
  lead: "Drydock is not only for big plans. Pick the size of the change.",
  items: [
    {
      title: "A change across many files",
      command: "/drydock:planwright <your change>",
      body: "The full loop: a plan you approve, agents in parallel waves, a gate after every wave, and a reconcile step that turns what went wrong into proposed doc fixes.",
    },
    {
      title: "A small change, no plan",
      command: "/drydock:check",
      body: "Say in a few lines which files the change may touch, do the work, and get an audit of every file and check that strayed. Arm the optional guard and file-tool edits outside the scope are denied as you go.",
    },
    {
      title: "Every pull request",
      command: "uses: SandeepTakasi/drydock/scope-gate@v0.19.0",
      body: "A GitHub Action that reads the scope from the issue a pull request closes and fails the check on any file outside it. A scope written by someone outside the repo is refused, a path proven by tests and not yet seen live.",
      href: `${BLOB}/scope-gate/README.md`,
      linkText: "Read the scope-gate README",
    },
  ],
  plannerNote:
    "Already plan with another tool, such as Superpowers? Keep it. The check skill can take the file list from that task and audit the work against it. That path shipped in 0.18.0 and is not yet observed in a live session.",
};

export const refusals: { lead: string; items: Refusal[] } = {
  lead: "Real output, not mockups. Each message is copied from an actual run, four against a scratch repo and one from a pull request on this repo, and the build checks that each key phrase still exists in the code that prints it.",
  items: [
    // `node drydock/scripts/drydock-audit.mjs validate-plan plan.md` in a scratch
    // dir; plan.md is a format_version 3 plan whose T1.0.1 and T1.0.2 (wave 1.0)
    // both own `a.txt`. Dropped: the version line (absolute local path).
    {
      title: "Two tasks, one file",
      body: "Before any agent is spawned, the validator rejects a plan whose same-wave tasks own the same file.",
      command: "node drydock-audit.mjs validate-plan plan.md",
      source: "drydock/scripts/drydock-audit.mjs", pin: "same-wave ownership must be disjoint",
      output:
        "validate-plan: FAIL (1), plan.md\n  - wave 1.0: `a.txt` is owned by both T1.0.1 and T1.0.2, same-wave ownership must be disjoint",
    },
    // `node drydock/scripts/drydock-audit.mjs audit-wave plan.md 1.0` in a scratch
    // git repo: T1.0.1 owns `a.txt` but its commit also adds `stray.txt`; T1.0.2
    // owns and commits `b.txt`; both recorded with task-close (attribution:
    // manifest). Dropped: git CRLF warnings, the table, notes, the version line.
    {
      title: "A file nobody owned",
      body: "After the wave, the audit reads each task commit from git and fails any task whose diff touched a file outside its owns, whatever the executor reported.",
      command: "node drydock-audit.mjs audit-wave plan.md 1.0",
      source: "drydock/scripts/drydock-audit.mjs", pin: "which is outside its",
      output:
        "audit-wave 1.0: FAIL (1), plan.md\n  - task T1.0.1: commit ab46abe changes `stray.txt`, which is outside its `owns` (`a.txt`)",
    },
    // `node drydock/hooks/enforce-owns.mjs` with CLAUDE_PROJECT_DIR set to a
    // scratch dir holding .drydock/wave-owns.json =
    // {"plan":"900-fixture","wave":"1.0","owns":["a.txt"]}, fed on stdin
    // {"tool_name":"Write","cwd":<dir>,"tool_input":{"file_path":<dir>/b.txt,"content":"x"}}.
    // Exit 2; `output` is the deny reason (systemMessage). b.txt was not written.
    {
      title: "A write outside the boundary",
      body: "While a wave is armed, the hook denies a file-tool write to any path the wave does not own, and the file is left untouched.",
      command: "Write b.txt (wave 1.0 owns a.txt)",
      source: "drydock/hooks/enforce-owns.mjs", pin: "does not own",
      output:
        "Drydock ownership violation: 900-fixture wave 1.0 does not own b.txt.\nOwned by this wave: a.txt\nIf correct implementation needs this file, that is a deviation, report it rather than widening your own boundary. Stale? delete .drydock/wave-owns.json",
    },
    // `node drydock/scripts/drydock-audit.mjs wave-start plan.md 1.1` in a scratch
    // git repo with plan.md committed: tasks T1.0.1, T1.0.2 (wave 1.0) and
    // T1.1.1 (wave 1.1), and no wavecheck report at all. Nothing dropped.
    {
      title: "A skipped gate",
      body: "The next wave cannot be armed while the one before it has no PASS wavecheck report.",
      command: "node drydock-audit.mjs wave-start plan.md 1.1",
      source: "drydock/scripts/drydock-audit.mjs", pin: "has no PASS wavecheck report",
      output:
        "wave-start: wave 1.0 has no PASS wavecheck report (none), so wave 1.1 cannot be armed.\n  Run drydock:wavecheck on wave 1.0 (after a BLOCK and a replan, a re-audit heading whose PASS supersedes the BLOCK), commit the report, then re-arm.",
    },
    // Run 37884214325 of the scope-gate workflow, pull request #27, which closes
    // issue #25 (scope `scope-gate-probe/**`) but adds `stray-probe.txt`. Lines 1
    // and 2 of `output` are the two `check` lines of the run log; line 3 is the
    // check-run annotation as the GitHub check-runs API returns it (path: message).
    {
      title: "A pull request outside its issue",
      body: "In CI, scope-gate reads the scope from the issue a pull request closes, audits the diff from its base, and fails the check naming every file outside that scope.",
      command: "pull request #27 (issue #25 owns scope-gate-probe/**)",
      source: "scope-gate/gate.mjs", pin: "outside the scope declared in",
      output:
        "FLAG outside scope: stray-probe.txt\ncheck: FLAG (1)\nstray-probe.txt: outside the scope declared in #25",
      href: "https://github.com/SandeepTakasi/drydock/actions/runs/37884214325",
      hrefLabel: "See the run",
    },
  ],
};

export const limits: {
  lead: string;
  points: { lead: string; detail: string }[];
  evidenceLinkText: string;
} = {
  lead: "Better you read these here than find them in your repo.",
  points: [
    {
      lead: "Bash can write around the hook.",
      detail:
        "Two ceilings stand, both exercised rather than assumed: Bash-mediated writes bypass file-tool hooks entirely, and paths outside the project directory are not enforced. The wave audit is the backstop.",
    },
    {
      lead: "Small changes are audited, and only optionally guarded.",
      detail:
        "For work too small for a plan, the check skill audits scope afterwards. With the opt-in guard armed, file-tool edits outside that scope are denied; Bash writes are still only detected.",
    },
    {
      lead: "Gate compliance is measured, not promised.",
      detail:
        "28 of 29 wave gates were invoked at their boundary across 5 pilot plans. Every session counted knew it was being observed, so read the figure as a ceiling, not a rate.",
    },
    {
      lead: "Approval is a human job.",
      detail:
        "Human approval is an instruction the plan format states and a reader upholds. Nothing in the tooling stops a session writing status: APPROVED itself.",
    },
    {
      lead: "It is an open pilot, field benchmarks pending.",
      detail:
        "Every figure on this site comes from pilot plans run in this repo; there are no field benchmarks yet.",
    },
  ],
  evidenceLinkText: "See the full evidence matrix",
};

export const evidencePage: {
  title: string;
  description: string;
  heading: string;
  lead: string;
  homeLinkText: string;
} = {
  title: "Evidence: what Drydock has verified",
  description:
    "Every verification claim Drydock makes, with its status and date, kept in sync with docs/compatibility.md.",
  heading: "What is verified, and what is not",
  lead: "Each row mirrors docs/compatibility.md, the source of truth. A row that has not passed says so.",
  homeLinkText: "Back to the homepage",
};

const INSTALL_COMMANDS = [
  "/plugin marketplace add SandeepTakasi/drydock",
  "/plugin install drydock@drydock",
];

export const install: {
  commands: string[];
  steps: { index: string; title: string; body: string; commands: string[] }[];
  ciSummary: string;
  ci: { note: string; copyAriaLabel: string; snippet: string };
  scopeNote: string;
  configNote: string;
  requirement: string;
  copyLabel: string;
  copyAriaLabel: string;
  copiedLabel: string;
} = {
  commands: INSTALL_COMMANDS,
  steps: [
    {
      index: "01",
      title: "Install the plugin",
      body: "In Claude Code, add the marketplace, then install.",
      commands: INSTALL_COMMANDS,
    },
    {
      index: "02",
      title: "Teach it your repo",
      body: "Run this once. Drydock detects your quality gates, test framework, commit style and CI, asks only what it cannot detect, and saves a profile every plan follows.",
      commands: ["/drydock:init"],
    },
    {
      index: "03",
      title: "Plan your first change",
      body: "Start with something small. For a quick fix, skip the plan and run /drydock:check instead.",
      commands: ["/drydock:planwright <describe your change>"],
    },
  ],
  ciSummary: "Optional: gate pull requests in CI",
  ci: {
    note: "This workflow checks every pull request against the scope declared in the issue it closes. It runs on pull_request with read-only permissions, never pull_request_target, because acceptance commands run code from the pull request.",
    copyAriaLabel: "Copy the workflow to clipboard",
    snippet: [
      "name: scope-gate",
      "",
      "on:",
      "  pull_request:",
      "    types: [opened, edited, synchronize, reopened]",
      "",
      "permissions:",
      "  contents: read",
      "  issues: read",
      "  pull-requests: read",
      "",
      "jobs:",
      "  scope-gate:",
      "    runs-on: ubuntu-latest",
      "    steps:",
      "      - uses: actions/checkout@v5",
      "        with:",
      "          fetch-depth: 0",
      "      - uses: actions/setup-node@v5",
      "        with:",
      "          node-version: 22",
      "      - uses: SandeepTakasi/drydock/scope-gate@v0.19.0",
    ].join("\n"),
  },
  scopeNote: "Add --scope project to the install to share it with your team.",
  configNote:
    "Settings on enable: where plans live (default docs/plans), which docs reconcile may propose changes to, and where seatrial writes its specs (default e2e).",
  requirement:
    "Requires Node 20.17 or newer on PATH, as declared in the plugin manifest and tested on 20, 22 and 24: the ownership hook and the plan audit are Node programs. The hook is inert, by design, whenever no wave is armed.",
  copyLabel: "Copy",
  copyAriaLabel: "Copy install command to clipboard",
  copiedLabel: "Copied",
};

export const faq: FaqItem[] = [
  {
    q: "Who is it for?",
    a: "Anyone using Claude Code on changes that touch several files at once, and especially anyone running subagents in parallel. If you have ever merged a green pull request and then found work in it nobody asked for, this is the problem it is built around.",
  },
  {
    q: "Is this overkill for a one-file change?",
    a: "Yes, so do not use a plan for it. For a change that small, the check skill audits your scope in a few lines with no plan at all. For mid-sized work there is a small lane: one phase, one wave, one gate, declared as lane: small and held to it by the validator. Ownership, acceptance criteria and both logs stay; only the ceremony goes. Drydock earns its keep on multi-file changes, parallel agents and teams.",
  },
  {
    q: "Does it cost more tokens?",
    a: "Yes. Planning, the audit after every wave and reconcile all run on top of the build itself. In exchange, a mistake is caught at the wave that made it instead of in review. The reconcile report of every plan prints its token split between orchestration and execution, counting each session whole, so you can see the cost on your own work rather than take a number from this page.",
  },
  {
    q: "Can I keep my current planner?",
    a: "Yes. If a tool such as Superpowers already writes your plan, run /drydock:check on its task: the skill copies the files that task says it will touch into a scope and audits the work against it, and the optional guard denies file-tool edits outside it. That path shipped in 0.18.0 and is not yet observed in a live session.",
  },
  {
    q: "Can it check pull requests?",
    a: "Yes, with the scope-gate Action. Write the owned files and acceptance commands in an issue, then close that issue from the pull request. The check fails when the pull request links no issue or more than one, when the issue was opened after the pull request or by someone who is not an owner, member or collaborator, or when any changed file is outside the scope. The out-of-scope failure was observed on this repo; the refusals are proven by the test suite and not yet seen live. It checks files, not lines, and edits to the issue after the pull request opened are not detected (see the scope-gate README).",
  },
  {
    q: "How is this different from other planning plugins?",
    a: "A plan is only worth what the result has to answer to. Drydock checks the result against it: did the wave do exactly what the plan said and nothing else, judged from the actual diff rather than from what the agents claim. File ownership is enforced, not requested: while a wave runs, a hook denies file-tool writes outside its boundary, and the audit catches what a hook cannot see, such as Bash writes (see A6). Each task names the model it needs, and reconcile turns what execution learned into proposed doc changes.",
  },
  {
    q: "What if I do not run subagents at all?",
    a: "Then say so in the plan header with execution: solo, and one session runs the tasks in order. Every gate, ownership boundary and acceptance criterion still applies. The plan states once that the session writing the code is also the one auditing it, so a reader knows how much weight the audit carries.",
  },
  {
    q: "Does it review code quality?",
    a: "No, on purpose. wavecheck answers one question: did the wave do what the plan said. Code quality is judged by a separate fresh-context review after it passes, so the two never blur together.",
  },
  {
    q: "Can the model skip the gates?",
    a: "Sometimes, and that is measured rather than promised away. Across 5 pilot plans, 28 of 29 wave gates were invoked at their boundary and one was skipped. The next gate refused to open without the missing report, and the audit that followed found a real ownership breach behind the skip. Every session counted knew it was being watched, so treat that as a ceiling, not a rate. Two things are mechanical: wave-start will not open a wave whose predecessor has no PASS, and a model cannot invoke replan at all. Human approval is not mechanical: nothing in the tooling stops a session marking its own plan APPROVED.",
  },
  {
    q: "Does anything actually touch a browser?",
    a: "Yes, through seatrial. A plan can carry end-to-end cases written before the code, and seatrial drives them in a real browser through Playwright MCP, saving the evidence each case asks for into a go/no-go sheet. It reports a step it cannot perform rather than improvising one, halts when the driver is missing, and never overrides its own failures. The specs it generated for this site run in CI and pass, Chromium only (see A7).",
  },
  {
    q: "My repo forbids tool names in commit messages.",
    a: "Use attribution: manifest. Your commit messages follow your own convention, and each task records which commit is its own in a manifest. The ownership audit works the same either way, because it reads the files a commit touched, not its message.",
  },
  {
    q: "Why the name?",
    a: "A drydock is where ships get built and inspected, out of the water, before anyone trusts them at sea. Nothing sails until it leaves the dock.",
  },
];

export const footer: {
  tagline: string;
  meta: string[];
  links: { href: string; label: string }[];
} = {
  tagline: "Nothing sails until it leaves the dock.",
  meta: [`v${VERSION}`, "MIT"],
  links: [
    { href: REPO, label: "GitHub" },
    { href: `${BLOB}/docs/self-audit.md`, label: "Self-audit" },
    { href: `${BLOB}/docs/compatibility.md`, label: "Compatibility" },
    { href: `${BLOB}/drydock/README.md`, label: "Plugin README" },
    { href: `${BLOB}/drydock/CHANGELOG.md`, label: "Changelog" },
    { href: `${BLOB}/docs/plans/001-drydock-homepage.md`, label: "Example plan" },
  ],
};
