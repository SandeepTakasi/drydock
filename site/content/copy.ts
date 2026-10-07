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
  tone: "dim" | "pass" | "block";
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
}

/** Section shells. Hero is exempt from SectionMeta and has no entry here. */
export const meta: Record<
  | "problem"
  | "lifecycle"
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
    heading: "Parallel agents collide, and then they drift",
  },
  lifecycle: {
    id: "lifecycle",
    eyebrow: "02 / HOW IT WORKS",
    heading: "Plan, run in waves, audit against the diff",
  },
  refuses: {
    id: "refuses",
    eyebrow: "03 / WHAT IT REFUSES",
    heading: "Four things it will not let through",
  },
  limits: {
    id: "limits",
    eyebrow: "04 / LIMITS",
    heading: "What it cannot do, said up front",
  },
  evidence: {
    id: "evidence",
    eyebrow: "THE MATRIX",
    heading: "Every row, with its status and date",
  },
  install: {
    id: "install",
    eyebrow: "05 / INSTALL",
    heading: "Two commands to start",
  },
  faq: {
    id: "faq",
    eyebrow: "06 / QUESTIONS",
    heading: "Questions",
  },
};

const VERSION = "0.18.0";

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
  title: "Drydock: plan-first parallel execution for Claude Code",
  description:
    "A Claude Code plugin that makes the plan the contract: parallel subagents that each own their files, every wave audited against the real diff, and what execution learned fed back into your docs.",
  status: "open pilot, field benchmarks pending",
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
  { href: "/#refuses", label: "What it refuses" },
  { href: "/evidence", label: "Evidence" },
  { href: "/#install", label: "Install" },
];

export const hero = {
  kicker: "CLAUDE CODE PLUGIN",
  headline: "Drydock",
  promise:
    "Agents drift: the tests pass, the review is clean, and the diff still does things nobody asked for.",
  thesis: "NOTHING SAILS UNTIL IT LEAVES THE DOCK",
  sub: "Drydock makes the plan the contract. Subagents build in parallel, each inside the files it owns, and every wave is checked against the real diff, not the agent report, before the next one starts.",
  badges: [`v${VERSION} · OPEN PILOT`, "MIT", "PLAN FORMAT v3"],
  ctaPrimary: "Install it",
  /**
   * Verbatim lines from plan 004's `### Wavecheck 1.1 — BLOCK — 2026-08-20`
   * report. Each `text`, with `**` and backticks stripped and whitespace
   * collapsed, is a substring of the plan file normalised the same way.
   */
  artifact: {
    source: "docs/plans/004-seatrial-e2e-gate.md",
    href: `${BLOB}/docs/plans/004-seatrial-e2e-gate.md`,
    label: "drydock:wavecheck, plan 004",
    verdict: "BLOCK",
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
    ] as TerminalLine[],
    caption:
      "An excerpt of a real wavecheck report, verbatim from plan 004 with lines trimmed, never reworded: every acceptance criterion passed, and the gate still blocked a verdict value the contract does not define.",
  },
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
        "check skill runs in a live session (model-invoked, inside a plan wave)",
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
  ],
  provenance: "This page is not a brochure for something built elsewhere. The site was planned, executed in parallel waves and gated with Drydock itself, across five plans whose deviation logs are in the repo.",
  planHref: `${BLOB}/docs/plans/001-drydock-homepage.md`,
  planLinkText: "Read the plan that built this",
};

export const lifecycle: {
  loop: string;
  steps: { index: string; title: string; body: string }[];
  readmeHref: string;
  readmeLinkText: string;
  pieces: Piece[];
} = {
  steps: [
    {
      index: "01",
      title: "Plan",
      body: "planwright turns your request into a plan: phases, waves of tasks that can run side by side, and the exact files each task may touch. You approve it before anything runs.",
    },
    {
      index: "02",
      title: "Run in parallel waves",
      body: "Subagents run a wave in parallel, each owning different files, or one session runs it in order and says so. While the wave runs, a hook denies file-tool writes outside its boundary.",
    },
    {
      index: "03",
      title: "Audit each wave against the diff",
      body: "wavecheck reads what actually changed in git, not what the agents say they did: ownership, forbidden changes, acceptance criteria, deviations. PASS lets the next wave start. BLOCK stops the plan until you or replan decide.",
    },
  ],
  readmeHref: `${BLOB}/drydock/README.md`,
  readmeLinkText: "Read the plugin README for every piece",
  loop: "on BLOCK, drift, or NO-GO: /drydock:replan or a human decision. No retries.",
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

export const refusals: { lead: string; items: Refusal[] } = {
  lead: "Not mockups. Each message below was pasted from a real run against a scratch repo, and the build checks that its key phrase still exists in the file that prints it.",
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
  ],
};

export const limits: { lead: string; items: string[]; evidenceLinkText: string } = {
  lead: "Better you read these here than find them in your repo.",
  items: [
    "Two ceilings stand, both exercised rather than assumed: Bash-mediated writes bypass file-tool hooks entirely, and paths outside the project directory are not enforced. The wave audit is the backstop.",
    "For work too small for a plan, the check skill audits scope afterwards. With the opt-in guard armed, file-tool edits outside that scope are denied; Bash writes are still only detected.",
    "Gate compliance is measured, not asserted: 28 of 29 wave gates were invoked at their boundary across 5 pilot plans. Every session counted knew it was being observed, so read the figure as a ceiling, not a rate.",
    "Human approval is an instruction the plan format states and a reader upholds. Nothing in the tooling stops a session writing status: APPROVED itself.",
    "It is an open pilot. Every figure on this site comes from pilot plans run in this repo; there are no field benchmarks yet.",
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
    "Then run /drydock:init once so Drydock learns your repo, and /drydock:planwright on something small. Settings on enable: where plans live (default docs/plans), which docs reconcile may propose changes to, and where seatrial writes its specs (default e2e). A repo that gitignores planning files gets them under .drydock/plans instead.",
  requirement:
    "Requires Node 20.17 or newer on PATH, as declared in the plugin manifest and tested on 20, 22 and 24: the ownership hook and the plan audit are Node programs. The hook is inert, by design, whenever no wave is armed.",
  copyLabel: "Copy",
  copyAriaLabel: "Copy install command to clipboard",
  copiedLabel: "Copied",
};

export const faq: FaqItem[] = [
  {
    q: "Is this overkill for a one-file change?",
    a: "Yes, so do not use a plan for it. For a change that small, the check skill audits your scope in a few lines with no plan at all. For mid-sized work there is a small lane: one phase, one wave, one gate, declared as lane: small and held to it by the validator. Ownership, acceptance criteria and both logs stay; only the ceremony goes. Drydock earns its keep on multi-file changes, parallel agents and teams.",
  },
  {
    q: "Who is it for?",
    a: "Anyone using Claude Code on changes that touch several files at once, and especially anyone running subagents in parallel. If you have ever merged a green pull request and then found work in it nobody asked for, this is the problem it is built around.",
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
    q: "My repo forbids tool names in commit messages.",
    a: "Use attribution: manifest. Your commit messages follow your own convention, and each task records which commit is its own in a manifest. The ownership audit works the same either way, because it reads the files a commit touched, not its message.",
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
