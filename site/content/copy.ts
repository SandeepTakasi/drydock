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
    heading: "Seven pieces, one contract",
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

const VERSION = "0.8.4";

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
  title: "Drydock -- plan-first parallel execution for Claude Code",
  description:
    "Plan-first execution for Claude Code: a rigorous plan document as the source of truth, subagents executing it in parallel waves with disjoint file ownership -- or one session executing it in sequence and saying so -- a conformance audit gating every wave, and a reconcile loop that feeds execution learnings back into your docs.",
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
  origin: "https://sandeeptakasi.github.io",
  url: "https://sandeeptakasi.github.io/drydock/",
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
    "A plan that is checked against the diff -- run in parallel by subagents, or alone by one session.",
  thesis: "NOTHING SAILS UNTIL IT LEAVES THE DOCK",
  sub: "A plan document is the source of truth. Subagents run it in parallel waves with disjoint file ownership, or one session runs it in sequence and says so. Either way the gate audits the wave against the actual diff, never against what the executor reports.",
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
      note: "Run twice, 2026-08-20 and 2026-08-26, twelve commits apart, with identical verdicts: six cases, three passes, and three failures that the plan designed to fail -- a false expectation, an unperformable step that halted to ask rather than improvise, and a video clause this driver cannot satisfy. Both sheets closed NO-GO; seatrial writes no override for its own failures. The second run also halted on stale cases and on an unreachable target, and wrote nothing at all when the driver dropped mid-suite. Specs are GENERATED, NOT EXECUTED.",
    },
  ],
  provenance: "This page is not a brochure for something built elsewhere. The site was planned, executed in parallel waves and gated with Drydock itself, across five plans whose deviation logs are in the repo.",
  planHref: `${BLOB}/docs/plans/001-drydock-homepage.md`,
  planLinkText: "Read the plan that built this",
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
  loop: "on BLOCK, drift, or NO-GO: /drydock:replan or a human decision. No retries.",
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
        "Drives the plan's written end-to-end cases through a real browser, captures the evidence each one declares, and writes a go/no-go sheet. Halts rather than degrades.",
    },
    {
      name: "drydock-audit.mjs",
      kind: "script",
      invocation: "run by the skills, and by you",
      detail:
        "The mechanical half: validate-plan checks a plan for defects a reader cannot eyeball, wave-start derives the ownership boundary from the plan, task-close records which commit belongs to which task, audit-wave proves the diff stayed inside it, plan-status derives plan state from the gates.",
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
  requirement: string;
  copyLabel: string;
  copyAriaLabel: string;
  copiedLabel: string;
} = {
  commands: [
    "/plugin marketplace add SandeepTakasi/drydock",
    "/plugin install drydock@drydock",
  ],
  scopeNote: "Add --scope project to share it with your team.",
  configNote:
    "Configured on enable: where plans live (default docs/plans), which docs reconcile may propose changes to, and where seatrial writes its generated specs (default e2e). If your repo forbids committing planning artifacts and gitignores that path, plans fall back to .drydock/plans and the plan says so in one fixed line rather than arguing its own case. Then run /drydock:planwright on something small.",
  requirement:
    "Requires Node 22 or newer on PATH -- the ownership hook and the plan audit are Node programs. On anything older the hook exits 0 with a message and ownership is not enforced.",
  copyLabel: "Copy",
  copyAriaLabel: "Copy install command to clipboard",
  copiedLabel: "Copied",
};

export const faq: FaqItem[] = [
  {
    q: "Is this overkill for a one-file change?",
    a: "Yes, and then do not use it. Drydock earns its keep on multi-file changes, parallel execution, and teams. For everything in between there is a small lane: one phase, one wave, one gate, no separate quality-review wave and no pressure test, declared as lane: small in the plan header and held to it by the validator. What scales with risk stays -- ownership, acceptance criteria, both logs. Only what scales with cost is dropped. Inflating structure to look thorough is an anti-pattern the planner refuses.",
  },
  {
    q: "How is this different from other planning plugins?",
    a: "The gate audits plan conformance, not code quality: did the wave do exactly what the plan said and nothing else, judged against the actual diff rather than against what the executors claim. From v0.6.0 disjoint file ownership is enforced rather than requested: wave-start generates the boundary from the plan, a hook denies every write outside it until the wave closes, and outside a wave it is inert. The audit is the backstop for what a hook cannot see -- see A6. Per-task model right-sizing lives in the plan instead of global config. And reconcile closes the loop by turning what execution learned into proposed doc diffs.",
  },
  {
    q: "What if I do not run subagents at all?",
    a: "Then say so, and the plan stops pretending otherwise. execution: solo in the header means the orchestrating session runs the tasks itself, which is what happens under a standing rule against spawning agents. It relaxes no gate, no ownership boundary and no acceptance criterion -- it removes a claim the plan was making falsely, and states once that the session writing the diff is the session auditing it, rather than logging that as a deviation on every wave. Same-wave dependencies also become legal, because the prohibition exists for simultaneity that solo does not have.",
  },
  {
    q: "My repo forbids tool names in commit messages.",
    a: "Then attribution comes from a manifest instead. Attribution used to be a commit-subject match, which made a house style the one thing that could block every wave with no way out but a hand-written table. With attribution: manifest the subject follows your convention and the task records which commit is its own; the ownership audit is unchanged, because it reads the files a commit touched, not its text. The same applies to plans themselves: a repo that gitignores the plans directory gets them under .drydock/plans instead.",
  },
  {
    q: "Does it review code quality?",
    a: "No, deliberately. Wavecheck audits conformance only; a separate fresh-context review runs after it passes.",
  },
  {
    q: "Can the model skip the gates?",
    a: "Honestly: gates are named as blocking instructions in every plan, and compliance is measured (A3), not asserted. The figure is 28 of 29 invoked at their boundary across 5 pilot plans -- and one was skipped. That skip is on the record because the next gate caught it and the retroactive audit found a real ownership breach behind it. Every one of those sessions knew it was being watched, so it is a ceiling rather than a rate. Two things are mechanically absolute. A human flips a plan to APPROVED, and replan cannot be model-invoked.",
  },
  {
    q: "Does anything actually touch a browser?",
    a: "Yes -- that is seatrial. A plan can carry a Testing Gate of end-to-end cases written before the code, and seatrial drives them through Playwright MCP, capturing each case's declared evidence into a go/no-go sheet. It refuses rather than improvises: a step it cannot perform is reported, not worked around; a missing driver halts; and it never overrides its own failures. Run end to end on this site: six cases, three passes, three designed failures. The specs it writes are GENERATED, NOT EXECUTED here -- see A7.",
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
  meta: [`v${VERSION}`, "MIT", "2026-09-01"],
  links: [
    { href: REPO, label: "GitHub" },
    { href: `${BLOB}/docs/self-audit.md`, label: "Self-audit" },
    { href: `${BLOB}/docs/compatibility.md`, label: "Compatibility" },
    { href: `${BLOB}/drydock/README.md`, label: "Plugin README" },
    { href: `${BLOB}/docs/plans/001-drydock-homepage.md`, label: "Example plan" },
  ],
};
