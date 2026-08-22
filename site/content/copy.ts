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
  invocation: string;
  detail: string;
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
  tone: "dim" | "pass" | "block";
}

export interface FaqItem {
  q: string;
  a: string;
}

/** Section shells. Hero is exempt from SectionMeta and has no entry here. */
export const meta: Record<
  "problem" | "lifecycle" | "terminal" | "evidence" | "install" | "faq",
  SectionMeta
> = {
  problem: {
    id: "problem",
    eyebrow: "01 / THE PROBLEM",
    heading: "Parallel agents collide, and then they drift",
  },
  lifecycle: {
    id: "lifecycle",
    eyebrow: "02 / HOW IT WORKS",
    heading: "Six pieces, one contract",
  },
  terminal: {
    id: "terminal",
    eyebrow: "03 / THE GATE",
    heading: "A wave that does not pass",
  },
  evidence: {
    id: "evidence",
    eyebrow: "04 / THE EVIDENCE",
    heading: "What is verified, and what is not",
  },
  install: {
    id: "install",
    eyebrow: "05 / INSTALL",
    heading: "Two commands",
  },
  faq: {
    id: "faq",
    eyebrow: "06 / QUESTIONS",
    heading: "Questions",
  },
};

const VERSION = "0.7.0";

/**
 * Docs live in the repo, not in the export — only `site/out` is deployed. So
 * every link to a doc has to leave for GitHub, which renders markdown anyway.
 *
 * These were once repo-relative (`../docs/self-audit.md`), written when there
 * was no deploy and the only way to read the site was locally beside the repo
 * tree. On GitHub Pages `../` escapes the basePath to the domain root: all four
 * were 404s in production. `assert-copy.mjs` now rejects any `../` href.
 */
const REPO = "https://github.com/TakasiVenkataSandeep-08/drydock";
const BLOB = `${REPO}/blob/main`;

export const site = {
  title: "Drydock -- plan-first parallel execution for Claude Code",
  description:
    "Plan-first parallel execution for Claude Code: a rigorous plan document as the source of truth, subagents executing it in parallel waves with disjoint file ownership, a conformance audit gating every wave, and a reconcile loop that feeds execution learnings back into your docs.",
  status: "open pilot -- field benchmarks pending",
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
  origin: "https://takasivenkatasandeep-08.github.io",
  url: "https://takasivenkatasandeep-08.github.io/drydock/",
  repo: REPO,
};

/** Top-bar navigation. Every href is a section id rendered on this page. */
export const nav: { href: string; label: string }[] = [
  { href: "#problem", label: "Problem" },
  { href: "#lifecycle", label: "How it works" },
  { href: "#evidence", label: "Evidence" },
  { href: "#install", label: "Install" },
];

export const hero = {
  kicker: "CLAUDE CODE PLUGIN",
  headline: "Drydock",
  promise:
    "Subagents that cannot quietly rewrite each other, on a plan that is checked against the diff.",
  thesis: "NOTHING SAILS UNTIL IT LEAVES THE DOCK",
  sub: "A plan document is the source of truth. Subagents execute it in parallel waves with disjoint file ownership. A conformance gate audits every wave against the actual diff, never against what the executors report.",
  badges: [`v${VERSION} -- OPEN PILOT`, "MIT", "PLAN FORMAT v3"],
  ctaPrimary: "Install it",
  wave: {
    label: "WAVE 1.1",
    subLabel: "3 TASKS -- DISJOINT OWNERSHIP",
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
  lead: "Running subagents in parallel has two failure modes, and the second one is the expensive one.",
  modes: [
    {
      index: "01",
      title: "Collision",
      body: "Two subagents editing the same file collide. One write lands on top of the other and the loss is invisible until something downstream breaks.",
    },
    {
      index: "02",
      title: "Drift",
      body: "Worse, they drift: green tests, a clean review, and a diff that quietly does things nobody asked for.",
    },
  ],
  coda: "Drifted code is often good code. It just is not the code the plan specified, and nothing in a quality review is looking for that difference.",
};

export const evidence: { rows: EvidenceRow[] } = {
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
      note: "27 of 28 wave gates invoked at their boundary across 4 pilot plans, with 1 skipped and 26 of 28 recorded before the next wave opened. The skip is the useful part: the following gate refused to open on the missing report, and the retroactive audit then blocked on a real ownership breach, so the recovery path is observed rather than assumed. Every session counted knew it was being observed, so read the figure as a ceiling, not a rate. The sample is 4 plans against the 5 to 10 this row asks for.",
    },
    {
      id: "A5",
      label: "Browser-drive round trip through Playwright MCP",
      status: "PASSED",
      tone: "pass",
      note: "2026-08-22, host 2.1.235, Node v24.14.1, Chromium 151, driven against the static export served at its basePath. Nine capabilities returned live, verified state, and every effect was confirmed by a second measurement rather than by the call not erroring: navigate, accessibility snapshot, a click on a nav link that moved the scroll position and set the hash, a click on an FAQ disclosure that flipped exactly one item, live evaluation of computed styles and custom properties, network recording across a real cross-document navigation (10 requests, all 200, all inside the basePath, no external host), resize at mobile and desktop widths with no horizontal overflow, multi-tab open and close, and a console with zero errors and zero warnings. That closes the earlier limit, when only navigate and screenshot had ever been exercised. Two constraints are stated rather than pending. Availability is per-session and belongs to the environment, not to Drydock: the server was absent in one session and present in another on the same machine, and even the tool namespace moved between them. When the driver does not resolve, seatrial halts with install instructions, which is the designed response. And video evidence is not capturable through this driver at all, since it is fixed when the browser context is created and no video, record or trace tool is exposed, which is what produced the only NO-GO in plan 004. Form fill is untested because this target carries zero forms and zero inputs, measured rather than assumed.",
    },
    {
      id: "A6",
      label: "Ownership enforcement hook fires in a live session",
      status: "PASSED",
      tone: "pass",
      note: "Live as of 2026-08-22, and measured by a session that wrote none of this code: the host does invoke the hook, and a real edit was denied. With a wave armed from plan 004, a write and a valid edit to paths outside the wave's ownership were both refused and left the files untouched, a write and an edit inside it were allowed, and once the wave was closed the same refused write went through — inert again within the one session, because the boundary file is read on every call while the hook itself registers at session start. The decision log held exactly four entries, two denials and two allowances, one per decision the hook actually made. The 12-case logic self-check still passes alongside it. Two ceilings stand, and both were exercised here rather than reasoned about: Bash-mediated writes bypass file-tool hooks entirely, so a shell redirect to the same refused path wrote and left no trace, and paths outside the project directory are not enforced at all. The post-hoc wave audit is the backstop for both, which is why enforcement is claimed as a boundary with stated holes rather than a guarantee.",
    },
    {
      id: "A7",
      label: "seatrial Testing Gate executes end to end",
      status: "OBSERVED, ONE FULL RUN",
      tone: "hold",
      note: "2026-08-20, driven through Playwright MCP against this site's own static export. Six declared cases ran to a verdict sheet: three passed, three failed, and all three failures were the ones the plan designed to fail. One was written against a deliberately false expectation and failed rather than agreeing with it. One named a step the page cannot perform, returned the exact reason string, clicked no substitute element, and halted to ask instead of manufacturing a verdict. The third held its assertion and failed only its video evidence clause, which is a limit of the driver rather than a defect in the site. The summary verdict was NO-GO, because seatrial never writes an override for its own failures; a human recorded one afterwards against that video case, and the underlying failure still stands in the sheet. Read the scope precisely: this is one run against one target. The generated spec files are GENERATED, NOT EXECUTED, since no test runner was added to this repo, and click, form fill, mutation, multi-tab, mobile viewports and non-Chromium engines are all untested.",
    },
  ],
};

export const terminal: {
  caption: string;
  label: string;
  verdict: string;
  lines: TerminalLine[];
} = {
  label: "drydock:wavecheck",
  verdict: "BLOCK",
  caption:
    "An illustration, not a captured session: what wavecheck reports for the 2026-08-18 adversarial dry-run described in docs/self-audit.md.",
  lines: [
    { text: "1. plan integrity ............. PASS", tone: "pass" },
    { text: "2. ownership audit ............ BLOCK", tone: "block" },
    { text: "3. forbidden audit ............ PASS", tone: "pass" },
    { text: "4. acceptance audit ........... PASS", tone: "pass" },
    { text: "   test_greeting.py ........... 1 passed", tone: "pass" },
    { text: "   test_farewell.py ........... 1 passed", tone: "pass" },
    { text: "5. deviation reconciliation ... BLOCK", tone: "block" },
    {
      text: "T1.1.2 report: files_changed [src/farewell.py, tests/test_farewell.py]",
      tone: "dim",
    },
    {
      text: "git show T1.1.2: src/greeting.py -- owned by T1.1.1, unreported",
      tone: "dim",
    },
    { text: "Wavecheck 1.1 -- BLOCK -- 2026-08-18", tone: "block" },
    { text: "Deviations logged: 1 (1 discovered by wavecheck)", tone: "dim" },
    {
      text: "no retries -- route: /drydock:replan or human decision",
      tone: "dim",
    },
  ],
};

export const lifecycle: { flow: string[]; loop: string; pieces: Piece[] } = {
  flow: [
    "planwright",
    "human approves",
    "execute waves",
    "wavecheck",
    "seatrial",
    "reconcile",
  ],
  loop: "on BLOCK: /drydock:replan or a human decision. No retries.",
  pieces: [
    {
      name: "planwright",
      kind: "skill",
      invocation: "model or /drydock:planwright",
      detail:
        "Interrogates the request and writes the plan document: phases, parallel waves, atomic tasks with owned files, and the gates between them.",
    },
    {
      name: "executor",
      kind: "agent",
      invocation: "spawned per task",
      detail:
        "Executes exactly one task block and writes only the files that task owns.",
    },
    {
      name: "executor-isolated",
      kind: "agent",
      invocation: "spawned per task",
      detail:
        "The same contract inside its own git worktree, so same-wave tasks cannot collide on disk.",
    },
    {
      name: "wavecheck",
      kind: "skill",
      invocation: "blocking gate inside every plan",
      detail:
        "Audits the finished wave against the plan, using the actual diff: ownership, forbidden lists, acceptance criteria, deviations. PASS or BLOCK.",
    },
    {
      name: "replan",
      kind: "skill",
      invocation: "human-only (disable-model-invocation)",
      detail:
        "Patches an approved plan after a BLOCK. Completed waves stay immutable, the decision log is append-only, and task ids are never reused.",
    },
    {
      name: "seatrial",
      kind: "skill",
      invocation: "model, or /drydock:seatrial -- after the final wave",
      detail:
        "Drives the plan's written end-to-end cases against the running app through Playwright MCP, captures the declared evidence per case, generates re-runnable spec files, and writes a go/no-go sheet. It halts rather than degrades: no driver, no target, no evidence root, it stops and says so.",
    },
    {
      name: "reconcile",
      kind: "skill",
      invocation: "final step of every plan",
      detail:
        "Turns deviations and failed assumptions into proposed diffs for CLAUDE.md, ADRs and architecture docs. Proposed, never auto-applied.",
    },
  ],
};

export const install: {
  commands: string[];
  scopeNote: string;
  configNote: string;
  copyLabel: string;
  copyAriaLabel: string;
  copiedLabel: string;
} = {
  commands: [
    "/plugin marketplace add TakasiVenkataSandeep-08/drydock",
    "/plugin install drydock@drydock",
  ],
  scopeNote: "Add --scope project to share it with your team.",
  configNote:
    "Configured on enable: where plans live (default docs/plans) and which docs reconcile may propose changes to. Then run /drydock:planwright on something small.",
  copyLabel: "Copy",
  copyAriaLabel: "Copy install command to clipboard",
  copiedLabel: "Copied",
};

export const faq: FaqItem[] = [
  {
    q: "Is this overkill for a one-file change?",
    a: "Yes, and then do not use it. Drydock earns its keep on multi-file changes, parallel execution, and teams. A single-wave plan is legitimate; inflating structure to look thorough is an anti-pattern the planner refuses.",
  },
  {
    q: "How is this different from other planning plugins?",
    a: "The gate audits plan conformance, not code quality: did the wave do exactly what the plan said and nothing else, judged against the actual diff rather than against what the executors claim. From v0.6.0 disjoint file ownership is enforced by a hook that denies writes outside the active wave rather than asking for them to stay inside it, with the audit as the backstop for what a hook cannot see -- see A6 for exactly how far that is verified. Per-task model right-sizing lives in the plan instead of global config. And reconcile closes the loop by turning what execution learned into proposed doc diffs.",
  },
  {
    q: "Does it review code quality?",
    a: "No, deliberately. Wavecheck audits conformance only; a separate fresh-context review runs after it passes.",
  },
  {
    q: "Can the model skip the gates?",
    a: "Honestly: gates are named as blocking instructions in every plan, and compliance is measured (A3), not asserted. The figure is 27 of 28 invoked at their boundary across 4 pilot plans -- and one was skipped. That skip is on the record because the next gate caught it and the retroactive audit found a real ownership breach behind it. Every one of those sessions knew it was being watched, so it is a ceiling rather than a rate. Two things are mechanically absolute. A human flips a plan to APPROVED, and replan cannot be model-invoked.",
  },
  {
    q: "Does anything actually touch a browser?",
    a: "Yes, that is seatrial. A plan can carry a Testing Gate of written end-to-end cases, and seatrial drives them against the running app through Playwright MCP, capturing the evidence each case declares and writing a go/no-go sheet. It refuses in three directions instead of improvising: a step it cannot perform returns 'step not executable' and clicks no substitute element, a missing driver or unreachable target halts with instructions, and it never writes an override for its own failures -- shipping past a known gap stays a human decision, recorded as one. Exercised end to end on this site: six cases, three passes, and three failures that were all the designed ones. The generated spec files are GENERATED, NOT EXECUTED here, because adding a test runner to this repo was declined -- see A7.",
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
  meta: [`v${VERSION}`, "MIT", "2026-08-19"],
  links: [
    { href: REPO, label: "GitHub" },
    { href: `${BLOB}/docs/self-audit.md`, label: "Self-audit" },
    { href: `${BLOB}/docs/compatibility.md`, label: "Compatibility" },
    { href: `${BLOB}/drydock/README.md`, label: "Plugin README" },
    { href: `${BLOB}/docs/plans/001-drydock-homepage.md`, label: "Example plan" },
  ],
};
