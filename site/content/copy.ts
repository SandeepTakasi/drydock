/**
 * Frozen site content. EVERY on-page string lives here.
 *
 * Downstream section components import from this module and must not
 * hardcode copy. Factual claims are transcribed from (and only from):
 * drydock/README.md, docs/self-audit.md, docs/compatibility.md,
 * drydock/skills/wavecheck/SKILL.md, drydock/.claude-plugin/plugin.json.
 *
 * No metric, percentage or benchmark is invented here: none is published yet.
 */

import type { SectionMeta } from "@/lib/section";

export interface Piece {
  name: string;
  kind: string;
  invocation: string;
  detail: string;
}

export interface EvidenceRow {
  id: string;
  label: string;
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

/** Title-block fields for the sheet frame the shell renders (Wave 1.5). */
export interface Sheet {
  project: string;
  title: string;
  sheetNumber: string;
  revision: string;
  scale: string;
  date: string;
}

/** Section shells. Hero is exempt from SectionMeta and has no entry here. */
export const meta: Record<
  "problem" | "evidence" | "terminal" | "lifecycle" | "install" | "faq",
  SectionMeta
> = {
  problem: {
    id: "problem",
    draftMark: "DRAFT 2M -- THE PROBLEM",
    heading: "Parallel agents collide, and then they drift",
  },
  evidence: {
    id: "evidence",
    draftMark: "DRAFT 4M -- THE EVIDENCE",
    heading: "What is verified, and what is not",
  },
  terminal: {
    id: "terminal",
    draftMark: "DRAFT 6M -- THE GATE",
    heading: "A wave that does not pass",
  },
  lifecycle: {
    id: "lifecycle",
    draftMark: "DRAFT 8M -- THE LIFECYCLE",
    heading: "Six pieces, one contract",
  },
  install: {
    id: "install",
    draftMark: "DRAFT 10M -- INSTALL",
    heading: "Install",
  },
  faq: {
    id: "faq",
    draftMark: "DRAFT 12M -- QUESTIONS",
    heading: "Questions",
  },
};

const VERSION = "0.4.1";

export const site = {
  title: "Drydock -- plan-first parallel execution for Claude Code",
  description:
    "Plan-first parallel execution for Claude Code: a rigorous plan document as the source of truth, subagents executing it in parallel waves with disjoint file ownership, a conformance audit gating every wave, and a reconcile loop that feeds execution learnings back into your docs.",
  status: "internal pilot -- field benchmarks pending",
  version: VERSION,
  selfAuditHref: "../docs/self-audit.md",
  selfAuditLinkText: "Read the self-audit",
  skipLinkText: "Skip to content",
};

export const hero = {
  headline: "Drydock",
  thesis: "NOTHING SAILS UNTIL IT LEAVES THE DOCK",
  sub: "Plan-first parallel execution for Claude Code: a rigorous plan document as the source of truth, subagents executing it in parallel waves with disjoint file ownership, a conformance audit gating every wave, and a reconcile loop that feeds execution learnings back into your docs.",
  waterlineLabel: "WATERLINE -- STATUS: APPROVED (HUMAN-ONLY)",
  badges: [
    "CLAUDE CODE PLUGIN",
    `v${VERSION} -- INTERNAL PILOT`,
    "FIELD BENCHMARKS: PENDING",
  ],
  svgAriaLabel:
    "Line drawing of a hull resting in a dry-dock cradle, with the waterline labelled approved",
  draftMarks: ["2M", "4M", "6M", "8M", "10M", "12M"],
  keelLabels: ["WAVE 1.1", "WAVE 1.2", "WAVE 1.3"],
};

export const problem = {
  lead: "Running subagents in parallel has two failure modes, and the second one is the expensive one.",
  modes: [
    {
      title: "Collision",
      body: "Two subagents editing the same file collide. One write lands on top of the other and the loss is invisible until something downstream breaks.",
    },
    {
      title: "Drift",
      body: "Worse, they drift: green tests, a clean review, and a diff that quietly does things nobody asked for.",
    },
  ],
  coda: "Drifted code is often good code. It just is not the code the plan specified, and nothing in a quality review is looking for that difference.",
};

export const evidence: {
  verifiedHeading: string;
  notVerifiedHeading: string;
  verified: EvidenceRow[];
  notVerified: EvidenceRow[];
} = {
  verifiedHeading: "VERIFIED",
  notVerifiedHeading: "NOT YET VERIFIED",
  verified: [
    {
      id: "--",
      label: "Contract logic (audit soundness, BLOCK path, attribution)",
      note: "VERIFIED. Adversarial dry-run: the ownership audit caught a rogue executor that edited a sibling task file and reported no deviations, while every test stayed green. The same dry-run exposed a real attribution defect, fixed in v0.3.0.",
    },
    {
      id: "A1",
      label:
        "Per-task model override at spawn (param vs agent frontmatter precedence)",
      note: "PASSED, 2026-08-18, host 2.1.234. The spawn param beat the agent frontmatter across 4 spawns in 2 independent runs. Evidence is agent self-report against a frontmatter control. Still untested: agent-teams mode, which Drydock does not use.",
    },
    {
      id: "A2",
      label: "isolation: worktree agent spawning",
      note: "PASSED, 2026-08-18, host 2.1.234, git 2.51.0. Worktree created on its own branch, checkpoint commit in contract format touching only the owned file, main tree left unmerged. A worktree holding changes is not auto-removed: cleanup is the orchestrator job.",
    },
    {
      id: "A2b",
      label: "Post-wavecheck worktree merge procedure",
      note: "PASSED, 2026-08-19. Disjoint worktrees merge conflict-free in task-id order and the integration smoke passes; a rogue edit colliding with a sibling conflicts, and aborting restores the target branch with the compliant work intact. Verified mechanically rather than agent-driven. One limitation, measured: a clean merge is not evidence of ownership compliance, because a non-colliding unowned edit merges silently. The ownership audit is the only defence there.",
    },
    {
      id: "A4",
      label: "claude plugin validate --strict",
      note: "PASSED, 2026-08-18, including the disable-model-invocation and isolation frontmatter.",
    },
  ],
  notVerified: [
    {
      id: "A3",
      label:
        "Orchestrator gate compliance (wavecheck invoked unprompted between waves)",
      note: "MEASURING. Tracked across the first 5 to 10 pilot plans; results will be published when they exist. There are no numbers today, which is why the status still reads field benchmarks pending.",
    },
  ],
};

export const terminal: { caption: string; lines: TerminalLine[] } = {
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

export const lifecycle: { pieces: Piece[] } = {
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
      kind: "agents",
      invocation: "spawned per task by the orchestrating session",
      detail:
        "Executes exactly one task block and writes only the files that task owns.",
    },
    {
      name: "executor-isolated",
      kind: "agents",
      invocation: "spawned per task by the orchestrating session",
      detail:
        "The same contract inside its own git worktree, so same-wave tasks cannot collide on disk.",
    },
    {
      name: "wavecheck",
      kind: "skill",
      invocation: "named as a blocking gate inside every plan",
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
  copyLabel: string;
  copyAriaLabel: string;
  copiedLabel: string;
} = {
  commands: [
    "/plugin marketplace add <org>/drydock",
    "/plugin install drydock@drydock",
  ],
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
    a: "The gate audits plan conformance, not code quality: did the wave do exactly what the plan said and nothing else, judged against the actual diff rather than against what the executors claim. Disjoint file ownership is a first-class constraint, optionally enforced by git worktrees. Per-task model right-sizing lives in the plan instead of global config. And reconcile closes the loop by turning what execution learned into proposed doc diffs.",
  },
  {
    q: "Does it review code quality?",
    a: "No, deliberately. Wavecheck audits conformance only; a separate fresh-context review runs after it passes.",
  },
  {
    q: "Can the model skip the gates?",
    a: "Honestly: gates are named as blocking instructions in every plan, and compliance is being measured (A3), not asserted. Two things are mechanically absolute. A human flips a plan to APPROVED, and replan cannot be model-invoked.",
  },
  {
    q: "Why the name?",
    a: "A drydock is where ships get built and inspected, out of the water, before anyone trusts them at sea. Nothing sails until it leaves the dock.",
  },
];

export const sheet: Sheet = {
  project: "DRYDOCK",
  title: "GENERAL ARRANGEMENT",
  sheetNumber: "SHEET 1 OF 1",
  revision: `REV ${VERSION}`,
  scale: "NOT TO SCALE",
  date: "2026-08-18",
};
