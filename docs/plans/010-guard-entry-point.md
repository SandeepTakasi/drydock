---
plan: 010-guard-entry-point
format_version: 3
status: BLOCKED
isolation: none
enforcement: required
attribution: manifest
lane: small
execution: fleet
created: 2026-10-07
approved_by: Sandeep Takasi
---

# 010 - The guard without a plan: `arm` a check scope, lead the docs with it

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

**Ownership enforcement (arm before the wave):**

```bash
# The REPO copy (D14). It is identical to the installed 0.16.0 at baseline.
node drydock/scripts/drydock-audit.mjs wave-start docs/plans/010-guard-entry-point.md 1.1
# ... the wave's executors run, one at a time (D2) ...
node drydock/scripts/drydock-audit.mjs audit-wave docs/plans/010-guard-entry-point.md 1.1
rm .drydock/wave-owns.json
```

**Orchestrator bookkeeping (CLAUDE.md, plans 005-008):** set `status: EXECUTING`
and this plan's `docs/plans/README.md` row in the commit before `wave-start`;
write this plan file only while no wave is armed, and commit it before
`wave-start`; edit owned files with Write/Edit, never Bash, so the hook leaves
receipts; a review rejection is repaired in a new wave with new task ids.

**Staleness check (before the wave):**
`git diff <baseline SHA>..HEAD -- <wave's owned files>`. Non-empty → re-validate
the wave's tasks against current code and update the baseline SHA and Decision
Log before executing.

## Requirement

Drydock's ownership hook can only be armed from an approved plan, so anyone who
wants prevention must adopt the whole lifecycle. When done: (1) a new
`drydock-audit.mjs arm <intent.md>` arms the existing hook from the same
`/drydock:check` intent file `check` already audits. It refuses a glob that
reaches every directory, and it refuses to replace a boundary that is already
armed. (2) `check` reports whether its scope was armed, and flags an armed
boundary that differs from the intent. (3) The `/drydock:check` skill offers
arming as an opt-in step, and its default stays audit-only. (4) The plugin
README and QUICKSTART lead with this "just the guard" path. Ship as 0.17.0.

## Spec reference

none, requirement is complete. Background: the market review of 2026-10-07 in
the planning session, which recommended keeping this inside the plugin rather
than splitting it out.

## Surgical-scope statement

One new subcommand and a few lines in `check` inside `drydock-audit.mjs`, five
test cases, one optional skill step, one README section, one QUICKSTART section,
one release. No hook change, no new file format, no new dependency, no
`disarm` subcommand.

## Baseline

Recorded by T0 on 2026-10-07, approved by Sandeep Takasi the same day, before the wave was armed.

| Item | Value |
|---|---|
| Commit SHA | `d95b0809cfa41de3350d1042f8d0597888f5b479` (plan 009: Phase 2 gate closed) |
| `node drydock/scripts/drydock-audit.test.mjs` | **GREEN.** `154/154 passed` |
| `node drydock/hooks/enforce-owns.test.mjs` | **GREEN.** `enforce-owns: PASS, 42 cases` |
| `node drydock/hooks/detect-bash-writes.test.mjs` | **GREEN.** `detect-bash-writes: PASS, 21 cases` |
| `node drydock/lib/resolve-target.test.mjs` | **GREEN.** `resolve-target: PASS, 8 cases` |
| `node drydock/scripts/drydock-stats.test.mjs` | **GREEN.** `8/8 passed` |
| `node drydock/scripts/audit-corpus.mjs` | **GREEN.** `audit-corpus: PASS, 23 wave(s) in 5 plan(s)` |
| `node site/scripts/assert-matrix.mjs` | **RED until T0's own row landed:** `assert-matrix: FAIL (1)`, `docs/plans/README.md has no row for 010-guard-entry-point.md`. Green after T0. |
| `cd site && npm run verify` | **RED for the same single reason:** build, `tsc`, `eslint` and `assert-copy: PASS` (26 literals, version matches plugin.json) passed; the chain's last step, `assert-matrix`, failed on the missing row. Green after T0. |

No pre-existing failure is excluded from any criterion. **Pre-existing untracked
files:** `e2e/009-site-016-additions/` (three seatrial-generated specs from plan
009, left uncommitted by the user). No task owns them and none may touch them;
if `audit-wave` reports them, that is this pre-existing state, not a wave write.

## Practices in effect

| Practice | Value | Source |
|---|---|---|
| Testing | Plain-script suites, no framework, `ok   — <name>` lines, non-zero exit on failure | `drydock/scripts/drydock-audit.test.mjs` |
| Runtime | Node ≥ 20.17, built-ins only, no dependencies | `plugin.json` `engines`, `verify.yml` |
| Platforms | Windows and Linux both gate | `verify.yml` |
| Quality gates | the five plugin suites, `assert-matrix`, `validate-plan` over the corpus, `audit-corpus`, `npm run verify` in `site/` | `verify.yml`, CLAUDE.md |
| Commits | one per task, owned files only, then `task-close` (`attribution: manifest`) | CLAUDE.md "Executing a plan here" |
| Execution | fleet, executors spawned one at a time | user, D2 |
| Human gate | release approval signed by Sandeep Takasi, named and dated, before any push | user, D6 |
| Acceptance criteria | run through `cmd.exe` on this machine: no backslashes, character classes, suite stderr suppressed | CLAUDE.md |
| Docs honesty | no site claim for the new feature; `compatibility.md` unchanged | CLAUDE.md "Honesty rule" |
| Tracker | none | plans 005-008 |

## Findings & constraints

- **The hook needs nothing new.** `enforce-owns.mjs` (~258-290) requires only
  `owns`, an array of string globs; `plan`, `wave` and `tasks` are optional, and
  each receipt records `config.plan ?? null` and `config.wave ?? null` (~322).
  `detect-bash-writes.mjs` (~104-119) reads only `owns` as well. A file written
  by `arm` is enforced by the installed hook as it stands.
- **Receipt leakage is the trap.** `audit-wave` selects receipts with
  `e.wave === wave && samePlan(e)`, and `samePlan` treats `e.plan == null` as
  belonging to every plan (`drydock-audit.mjs` ~1450). A receipt from an
  `arm`-written file therefore must never carry a wave id a plan can have. D7
  fixes the wave id to the literal `"check"`.
- **`check`** (`drydock-audit.mjs` ~2101-2143) parses the intent inline: `base`
  from the frontmatter, then `Files owned`, `Forbidden`, `Acceptance criterion`
  as backticked items. Its header says "Writes nothing, arms nothing (plan 008
  D3)". This plan revises that comment, and D3 below supersedes plan 008's D3
  as an opt-in.
- **`waveStart`** (~884-1005) holds the `.gitignore` guard (~952-961) that `arm`
  also needs. Extracting it into a helper that both call is allowed. Every
  `wave-start` message and behaviour stays byte-identical.
- **`unbounded(g)`** (~299) is `g.startsWith("**")`, already the repo's test for
  a glob that leaves its own directory. D5 reuses it.
- **Existing `check` tests** (`drydock-audit.test.mjs` ~1840-1902) build intent
  files with the `intent()` helper and temp repos with `checkRepo()`; the new
  cases reuse both. `enforce-owns.test.mjs` (~96-100) shows how to spawn the
  hook with `CLAUDE_PROJECT_DIR` set.
- **The vocabulary case** "consumers name only vocabulary the format contract
  defines" (`drydock-audit.test.mjs` ~1126) fails on a backticked bare lowercase
  word in a SKILL.md that `plan-format.md` does not define. A bare `` `arm` ``
  in `check/SKILL.md` would fail it. A full command such as
  `` `node .../drydock-audit.mjs arm .drydock/check.md` `` passes, because the
  token pattern excludes `-`, `.` and `/`. T1.1.2's criterion runs the suite.
- **The version string lives in four places:** `drydock/.claude-plugin/plugin.json`,
  `site/content/copy.ts` (`const VERSION`, which `assert-copy` checks against
  `plugin.json`), the root `README.md` status line (`v0.16.0`), and the
  `CHANGELOG.md` heading. Plan 008's deviation 10: a task that assumed a status
  line in `drydock/README.md` found none, so the root README is named
  explicitly here.
- **Learnings pulled** (`learnings` on all nine owned paths): CHANGELOG written
  through Bash left no receipt (plan 005 dev. 1), so file tools only; skill edits
  are unexercised until a release is installed (CLAUDE.md); nothing else applied.
- **Skill edits are unexercisable by this session**, which runs on the
  installed 0.16.0 (D13).

## Decision Log

| # | Question | Decision | Decided by | Rationale |
|---|---|---|---|---|
| D1 | Lane? | `small`: one phase, one wave, one gate, no review wave, no pressure test | planner (assumed, flag if wrong) | Nine files, and only T1.1.1 touches the audit script and its tests, so no two tasks share a file or need a contract wave. |
| D2 | Execution? | fleet, executors spawned one at a time | user | As in plans 006-008. |
| D3 | Does `/drydock:check` arm the hook? | **Opt-in.** The skill offers the `arm` step and runs it only when the user asks for prevention. The default stays audit-only. Supersedes plan 008 D3 as a default plus an option, not a reversal | user | Plan 008's reason still holds for the default: arming interrupts every legitimate scope miss. Consumed by T1.1.2, T1.1.3. |
| D4 | Where does `arm` read its globs? | The `check` intent file, through the same parser `check` uses. No CLI glob arguments | user | The armed boundary and the audited scope come from one file and cannot disagree. This is the derive-don't-type rule `wave-start` follows. Consumed by T1.1.1, T1.1.3. |
| D5 | What is a catch-all glob? | Any owned glob for which `unbounded(g)` is true, i.e. it starts with `**` (`**`, `**/*`, `**/*.ts`). Root-only `*.md` stays allowed | user | A `**`-led glob reaches every directory, and a single `*` does not cross `/`. `{"owns":["**"]}` "enforces nothing while looking exactly like enforcement" (plan-format.md). Consumed by T1.1.1. |
| D6 | Release? | 0.17.0. Phase gate signed by Sandeep Takasi before any push | user | A new subcommand is a minor bump. Consumed by T1.1.4. |
| D7 | What wave id does `arm` write? | The literal `"check"`, with `"plan": null` | planner, measured | `audit-wave` counts a `plan: null` receipt toward every plan whose wave id matches (~1450). Plan wave ids are numeric (`1.1`), so `"check"` can never match one. Consumed by T1.1.1. |
| D8 | A `disarm` subcommand? | No. Disarm is `rm .drydock/wave-owns.json`, as for a plan wave | planner (assumed, flag if wrong) | One documented command already exists. A second one adds a name and saves nothing. Consumed by T1.1.1, T1.1.2, T1.1.3. |
| D9 | "Record who armed it"? | `"source": "arm"` and `"base": "<sha>"` in the file. No user identity | planner (assumed, flag if wrong) | Any session can write any name, so a recorded identity proves nothing. Recording the producing command does mark the file as generated rather than hand-typed. Consumed by T1.1.1. |
| D10 | How does `check` report arming? | It compares the armed file's `owns` (only when `wave` is `"check"`) with the intent's owned globs as sets. Equal prints `check: hook armed for this scope`; different is `FLAG armed boundary differs from intent`. Hook receipts are not counted | planner (assumed, flag if wrong) | `enforcement.log` is append-only and repo-wide, and `"check"` receipts from earlier checks cannot be told apart. The boundary comparison is exact. Consumed by T1.1.1, T1.1.2. |
| D11 | `arm` over an existing boundary? | Refuse (exit 1) whenever `.drydock/wave-owns.json` exists, naming its `plan` and `wave` | planner | Overwriting a plan wave's boundary silently disarms that wave. Consumed by T1.1.1. |
| D12 | Testing Gate? | N/A | planner | See § Testing Gate. |
| D13 | Skill edit unexercised? | Shipped gated on mechanical criteria, stated as unproven in the CHANGELOG and at wavecheck | planner, CLAUDE.md | Sessions load the installed copy. Consumed by T1.1.2, T1.1.4. |
| D14 | Which copy arms the plan's own wave? | The repo copy, `node drydock/scripts/drydock-audit.mjs` | planner | Same as plan 008 D15. `wave-start` is unchanged by this plan, so either copy gives the same boundary. |
| D15 | The `arm` contract (complete rule body) | **Command:** `drydock-audit.mjs arm <intent.md>`. **Reads:** the intent file exactly as `check` does (`base`, `Files owned`). **Exit 3** (could not run), with `check`'s own messages: no `base:`, no owned globs, `base` not a commit. **Exit 1, nothing written**, in this order: (a) `.drydock/wave-owns.json` exists → `arm: refused, a boundary is already armed (plan <plan>, wave <wave>); close it with rm .drydock/wave-owns.json`; (b) any owned glob with `unbounded(g)` → `arm: refused, <glob> reaches every directory; name the directories instead`. **Exit 0:** ensures `.drydock/` is gitignored as `wave-start` does, writes `<root>/.drydock/wave-owns.json` as `{"plan": null, "wave": "check", "source": "arm", "base": "<base as written>", "owns": [<owned globs in intent order>]}` (2-space JSON, trailing newline), then prints `arm: armed <n> glob(s) from <intent path>` and `disarm with:  rm .drydock/wave-owns.json`. **`check` additions:** when `<root>/.drydock/wave-owns.json` exists, parses, and has `wave === "check"`: owns equal as sets → print `check: hook armed for this scope` before the verdict line; otherwise add the flag `FLAG armed boundary differs from intent` (counted in `check: FLAG (<n>)`). An absent file, an unparseable file, or any other `wave` changes nothing in `check`'s output | planner | Pinned because T1.1.2, T1.1.3 and T1.1.4 quote these strings in parallel with T1.1.1 writing them. Consumed by T1.1.1, T1.1.2, T1.1.3, T1.1.4. |

## Open questions

| # | Question | Blocks | Recommended answer |
|---|---|---|---|
| none | | | |

## Out of scope / follow-ups

- Adapters that arm the hook from a GSD or Superpowers plan.
- Splitting the guard into its own plugin.
- `wave-start` refusing to overwrite a `"check"` boundary. This is the mirror of
  D11 and is a real hazard: it silently drops a check's prevention. It is left
  out to keep `waveStart` byte-identical.
- Counting hook receipts per check run (needs a run id in the armed file).
- A `compatibility.md` row and site copy for `arm`, after a live session has run
  it on an installed 0.17.0.
- The comparison run the review recommended (one finished plan re-run without
  Drydock).

## Execution policies

- **Per task:** the acceptance criterion must exit 0, verified by the executor
  and re-run by wavecheck.
- **Per wave:** `drydock:wavecheck` on Wave 1.1 is the single blocking gate
  (`lane: small`).
- **Per phase:** no review wave and no phase review (D1). The phase gate is the
  mechanical gate plus the human release approval.
- **Escalation:** a wavecheck BLOCK on ownership or an unlogged deviation gets no
  retry. Any other repair runs as a new wave with new task ids.
- **Checkpointing:** one commit per task, owned files only, then `task-close`.
- **Human gate:** the Phase 1 gate, named and dated (D6). Nothing is pushed
  before it.
- **Tracker mirroring:** none.

## Testing Gate

N/A, this plan changes a CLI script, its test suite, skill prose and two plugin
docs. The only user-facing surface it touches is the homepage version string,
which `site/scripts/assert-copy.mjs` already asserts against `plugin.json` at
build time. No interactive behaviour changes. The runtime proof for `arm` is
T1.1.1's acceptance criterion, which executes it and the real hook.

## Pressure-test verdict

Not run, `lane: small` (D1). The self-review checklist, `validate-plan --strict`
and `prove-failable` were run instead; results are recorded under *Self-review*
in the Progress log.

## Phase 0: Pre-flight

#### T0 - Baseline verification and plan index row

- **Description:** Record the commit SHA and the verbatim result of every gate
  command in *Baseline*, add this plan's row to `docs/plans/README.md` with
  status matching the frontmatter, set `status: EXECUTING`, and commit both so
  `assert-matrix.mjs` passes and `wave-start` will arm.
- **Files owned:** `docs/plans/README.md` (this plan's *Baseline* and
  frontmatter are also written here, before the wave is armed)
- **Depends on:** none
- **Model / thinking:** Mechanical / off   **Executor:** orchestrator, inline
- **Context brief:** this plan's *Baseline*; `docs/plans/README.md`;
  `site/scripts/assert-matrix.mjs` (the row's status column must equal this
  plan's frontmatter `status:` and moves with it).
- **Acceptance criterion:** `node -e "const fs=require('fs');const p=fs.readFileSync('docs/plans/010-guard-entry-point.md','utf8'),i=fs.readFileSync('docs/plans/README.md','utf8');const m=p.match(/Commit SHA [|] .?([0-9a-f]{7,40})/);if(!m||!i.includes('010-guard-entry-point')||/[|] _pending_/.test(p))process.exit(1);try{require('child_process').execFileSync('node',['site/scripts/assert-matrix.mjs'],{stdio:'ignore'})}catch(e){process.exit(1)}"`

## Phase 1: The guard entry point

**Exit state:** `arm` and `check`'s arming report work in the repo copy, the
skill and docs describe them, and 0.17.0 is cut locally and unpushed.

**Phase gate:** all five plugin suites exit 0 (audit 159/159, enforce-owns 42, detect-bash-writes 21, resolve-target 8, stats 8/8); `validate-plan` over the corpus as CI runs it exits 0; `node drydock/scripts/audit-corpus.mjs` PASS; `cd site && npm run verify` exits 0; human approval of the 0.17.0 release by Sandeep Takasi, named and dated, before any push.

### Wave 1.1 - arm, the skill step, the docs, the release

> The four tasks share no file. T1.1.2, T1.1.3 and T1.1.4 quote the strings
> pinned in D15, not T1.1.1's output.

#### T1.1.1 - drydock-audit.mjs arm, and check's arming report

- **Description:** Add the `arm <intent.md>` subcommand and the `check`
  additions exactly as D15 specifies, sharing one intent parser between `arm`
  and `check`, and add five named cases to the audit suite. Watch each new case
  fail before the code that satisfies it exists.
- **Files owned:** `drydock/scripts/drydock-audit.mjs`,
  `drydock/scripts/drydock-audit.test.mjs`
- **Depends on:** T0
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D4, D5, D7, D8, D9, D10, D11, D15 of this plan;
  `drydock/scripts/drydock-audit.mjs` `check` (~2092-2143), `waveStart`'s
  gitignore guard (~952-961), `unbounded` (~299), the `main` dispatch and usage
  (~2190-2239), `audit-wave`'s receipt filter (~1440-1457, to see why D7
  matters); `drydock/scripts/drydock-audit.test.mjs` `intent()`/`checkRepo()`
  and the `check` cases (~1840-1902); `drydock/hooks/enforce-owns.test.mjs`
  (~90-110) for spawning the hook with `CLAUDE_PROJECT_DIR`.
- **Forbidden:** any change to `drydock/hooks/**`; any change to a
  `wave-start` message or behaviour (extracting the gitignore guard into a shared
  helper is allowed); a `disarm` subcommand; CLI glob arguments; counting
  `enforcement.log` receipts in `check`; any dependency.
- **Implementation sketch:**
  - `readIntent(path) → { base, owned, forbidden, criteria }`, lifted from
    `check`'s body, throwing `check`'s existing three errors. `check` calls it.
  - `arm(path)`: `readIntent` → resolve `base` exactly as `check` does (exit 3
    path) → D15 refusal (a), then (b) → `ensureDrydockIgnored(root)` → write the
    file → print the two lines. Add the usage line
    `drydock-audit.mjs arm <intent.md>   # arm the hook from a check intent file`
    and the dispatch `command === "arm" && rest[0]`.
  - In `check`, after computing the flags from the changed files and before the
    criteria: read `<root>/.drydock/wave-owns.json` with `readJSON`; if
    `wave === "check"`, compare `new Set(owns)` with `new Set(owned)`.
    Invariant: with no `"check"` file present, `check`'s output is unchanged
    line for line. All six existing `check` cases still pass.
  - Update `check`'s header comment ("arms nothing") to say arming is a
    separate, opt-in command (D3).
  - Five cases, these exact names:
    `arm writes a check boundary from the intent file` (the file's JSON equals
    D15's shape, `wave` is `"check"`, exit 0);
    `arm refuses a glob that reaches every directory` (`**/*.ts`, exit 1, no
    file written);
    `arm refuses while a boundary is already armed` (a pre-written
    `{"plan":"009-x","wave":"1.1","owns":["a.txt"]}` stays byte-identical, exit 1);
    `check flags an armed boundary that differs from the intent` (arm, then
    edit the file's `owns`, expect `FLAG armed boundary differs from intent`);
    `the hook enforces a boundary written by arm` (arm `a.txt`, then spawn
    `drydock/hooks/enforce-owns.mjs` with a `Write` to `b.txt` and expect a
    deny, and a `Write` to `a.txt` and expect an allow).
- **Acceptance criterion:** `node -e "let o='';try{o=require('child_process').execFileSync('node',['drydock/scripts/drydock-audit.test.mjs'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch(e){process.exit(1)}const n=['arm writes a check boundary from the intent file','arm refuses a glob that reaches every directory','arm refuses while a boundary is already armed','check flags an armed boundary that differs from the intent','the hook enforces a boundary written by arm'];process.exit(n.every(x=>o.split(String.fromCharCode(10)).some(l=>/^ok /.test(l)&&l.trim().endsWith(x)))&&/159[/]159 passed/.test(o)?0:1)"`

#### T1.1.2 - The check skill offers arming, opt-in

- **Description:** Add one optional step to `drydock/skills/check/SKILL.md`
  between writing the intent file and doing the work. Only when the user asks
  for prevention, run `arm` on the intent file. Then close the boundary after
  the audit, and document `check`'s two new output lines.
- **Files owned:** `drydock/skills/check/SKILL.md`
- **Depends on:** T0
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D3, D8, D10, D13, D15 of this plan;
  `drydock/skills/check/SKILL.md` as it stands; the vocabulary case in
  `drydock/scripts/drydock-audit.test.mjs` (~1126-1190): never write a bare
  backticked lowercase word that `plan-format.md` does not define, so always
  write the full command, e.g.
  `` `node ${CLAUDE_PLUGIN_ROOT}/scripts/drydock-audit.mjs arm .drydock/check.md` ``.
- **Forbidden:** making arming the default; changing the intent file format;
  removing the sentence that says `check` itself prevents nothing (reword it
  instead to say that prevention comes only from the opt-in step); any file
  outside `owns`.
- **Acceptance criterion:** `node -e "const s=require('fs').readFileSync('drydock/skills/check/SKILL.md','utf8');let o='';try{o=require('child_process').execFileSync('node',['drydock/scripts/drydock-audit.test.mjs'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch(e){process.exit(1)}process.exit(s.includes('drydock-audit.mjs arm .drydock/check.md')&&s.includes('rm .drydock/wave-owns.json')&&s.includes('check: hook armed for this scope')&&s.includes('FLAG armed boundary differs from intent')&&/only when the user/i.test(s)&&/ok +. consumers name only vocabulary the format contract defines/.test(o)?0:1)"`

#### T1.1.3 - README and QUICKSTART lead with the guard

- **Description:** Add a short "Just the guard" section to the top of
  `drydock/README.md` and `drydock/QUICKSTART.md`. Each shows the no-plan path
  in commands: write the intent file, `arm` it, work, `check` it, then
  `rm .drydock/wave-owns.json`. Each states the ceilings in one or two lines:
  Bash writes are detected rather than prevented, and catch-all globs are
  refused.
- **Files owned:** `drydock/README.md`, `drydock/QUICKSTART.md`
- **Depends on:** T0
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D3, D4, D5, D8, D15 of this plan; `drydock/README.md`
  (its "What makes it different" ceilings and "The wave lifecycle, in three
  commands" section, whose `DD=` line the new section reuses);
  `drydock/QUICKSTART.md` ("One variable" section for the same `DD`);
  `drydock/skills/check/SKILL.md` Step 2 for the intent file format.
  In README the new `## Just the guard` section goes after the opening
  paragraph and before `## The lifecycle`. In QUICKSTART, `## 0. Just the
  guard` goes before `## 1. Ask for a plan`.
- **Forbidden:** claiming `arm` prevents Bash writes; claiming it was run in a
  live session (D13); editing any other section beyond one cross-link; any file
  outside `owns`.
- **Acceptance criterion:** `node -e "const fs=require('fs');const r=fs.readFileSync('drydock/README.md','utf8'),q=fs.readFileSync('drydock/QUICKSTART.md','utf8');const a=r.indexOf('## Just the guard'),b=r.indexOf('## The lifecycle'),c=q.indexOf('## 0. Just the guard'),d=q.indexOf('## 1. Ask for a plan');const sec=(t,i,j)=>t.slice(i,j);const ok=(t)=>t.includes('arm .drydock/check.md')&&t.includes('check .drydock/check.md')&&t.includes('rm .drydock/wave-owns.json');process.exit(a>0&&b>a&&c>0&&d>c&&ok(sec(r,a,b))&&ok(sec(q,c,d))?0:1)"`

#### T1.1.4 - Cut 0.17.0

- **Description:** Bump the version to 0.17.0 in its four places and write the
  0.17.0 CHANGELOG entry describing `arm`, `check`'s arming report and the
  skill's opt-in step, quoting D15's strings, stating that the skill step is
  unexercised (D13), and ending `Tests: audit 154 to 159, others unchanged.`
- **Files owned:** `drydock/.claude-plugin/plugin.json`, `drydock/CHANGELOG.md`,
  `site/content/copy.ts`, `README.md`
- **Depends on:** T0
- **Model / thinking:** Mechanical / off (Haiku 4.5)   **Executor:** drydock:executor
- **Context brief:** D3, D5, D6, D7, D11, D13, D15 of this plan; the 0.16.0
  entry at the top of `drydock/CHANGELOG.md` for shape and tone;
  `site/content/copy.ts` `const VERSION`; the root `README.md` status line
  (`**Status: open pilot (v0.16.0).**`); `plugin.json` `version`. Edit with
  Write/Edit only (plan 005 deviation 1).
- **Forbidden:** any other edit to `copy.ts` or the root README (no new site
  claim, CLAUDE.md honesty rule); pushing or tagging; any file outside `owns`.
- **Acceptance criterion:** `node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('drydock/.claude-plugin/plugin.json','utf8')).version,c=fs.readFileSync('site/content/copy.ts','utf8'),r=fs.readFileSync('README.md','utf8'),l=fs.readFileSync('drydock/CHANGELOG.md','utf8');const h=(l.match(/^## .*$/m)||[''])[0];process.exit(p==='0.17.0'&&/const VERSION = .0[.]17[.]0.;/.test(c)&&r.includes('(v0.17.0)')&&!r.includes('(v0.16.0)')&&h.startsWith('## 0.17.0')&&l.includes('arm .drydock/check.md')&&l.includes('audit 154 to 159')?0:1)"`

## Deviation Log

| # | Task | What deviated | Why | Impact | Recorded |
|---|---|---|---|---|---|
| 1 | T0 | The Baseline says `e2e/009-site-016-additions/` held **three** specs. It held **five** (`tg1`-`tg5`, all dated 2026-10-07 08:33 IST, before this session). | The planner's `ls` was piped through `head -20` and truncated. | No file changed; the Baseline's count is wrong. The pre-existing state it describes is unchanged. `discovered-by-wavecheck` | 2026-10-07 |
| 2 | — (gate) | `audit-wave 1.1` reports five "Bash writes outside `owns`" and a dirty tree. **Every one is the pre-existing untracked `e2e/009-site-016-additions/` directory**: the files predate the wave by about 2.5 hours, and all five `detected` receipts are stamped on the wave's first Bash command (the orchestrator's staleness check plus `wave-start`, a read-only `git diff` followed by the arming), which wrote nothing there. | The Bash detector attributes to that first command whatever untracked state it has no earlier snapshot for. That is a false positive on pre-existing dirt, and the detector's ceiling list (`detect-bash-writes.mjs` ~40-58) does not name it. | All four task commits stay inside their task's `owns` (the audit's own table). The two FAIL lines are not wave writes, but the audit cannot tell them apart, and the receipts are permanent in `.drydock/enforcement.log`, so a re-audit stays FAIL on error 1 even after the directory is committed or moved. A human decision is required. `discovered-by-wavecheck` | 2026-10-07 |
| 3 | T1.1.2 | The `check` skill's frontmatter `description:` still ends "Detects scope misses after the fact; prevents nothing.", while the body now offers opt-in prevention. | Reported by the executor as an observation. The task block did not name the description, and no forbidden item covers it. | The description is what the host shows when it chooses a skill, so it now understates the skill. This is inside T1.1.2's `owns`, so it can be repaired in a new wave with a new task id. | 2026-10-07 |

## Wavecheck reports

### Wavecheck 1.1, BLOCK, 2026-10-07

Execution: `fleet`. Four `drydock:executor` subagents were spawned one at a time (Sonnet 5.5 ×3, Haiku 4.5 ×1). The auditor did not write the diffs.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `format_version: 3`, status `EXECUTING`, wave 1.1 exists, no prior implementation wave. `validate-plan --strict` PASS at `1bf2841`. |
| 2. Ownership audit | **FAIL** | Installed 0.16.0 `audit-wave 1.1`: `FAIL (2)`. Per-task table below: **every task's commit is inside its `owns`**. Both errors are the pre-existing untracked `e2e/009-site-016-additions/` directory (Deviations 1 and 2), not a wave write. Enforcement ran: `enforcement active: 20 hook decision(s) recorded for wave 1.1 (0 denied)`. |
| 3. Forbidden audit | PASS | T1.1.1: `git diff d95b080..HEAD -- drydock/hooks` is empty. The `wave-start` gitignore message is byte-identical (`ensureDrydockIgnored(root, "wave-start")` prints `${who}: added ...`). The diff adds no `disarm` subcommand, no CLI glob arguments and no receipt counting. T1.1.2: arming is an opt-in step, and the intent format is unchanged. T1.1.3: no claim that Bash writes are prevented, no claim of a live run, and only the two new sections. T1.1.4: one line changes in each of `copy.ts`, the root README and `plugin.json`. |
| 4. Acceptance audit | PASS | All four criteria re-run by the auditor through `spawnSync(..., {shell: true})`: T1.1.1 exit 0 (`159/159 passed`), T1.1.2 exit 0, T1.1.3 exit 0, T1.1.4 exit 0. |
| 5. Deviation reconciliation | PASS (logged) | The executors reported no deviations. Deviation 3 comes from T1.1.2's report; Deviations 1 and 2 were discovered by wavecheck. |

```
| Task | Commit | Files changed | Owns | Outside owns |
| T1.1.1 | a795149 | drydock/scripts/drydock-audit.mjs, drydock/scripts/drydock-audit.test.mjs | same | none |
| T1.1.2 | cc96426 | drydock/skills/check/SKILL.md | same | none |
| T1.1.3 | 0e4e3cd | drydock/QUICKSTART.md, drydock/README.md | same | none |
| T1.1.4 | 28cbceb | README.md, drydock/.claude-plugin/plugin.json, drydock/CHANGELOG.md, site/content/copy.ts | same | none |
note: enforcement active: 20 hook decision(s) recorded for wave 1.1 (0 denied)
audit-wave 1.1: FAIL (2)
  - a Bash command wrote outside this wave's `owns`: e2e/009-site-016-additions/tg1..tg5 (5 files)
  - working tree is not clean after the wave's task commits, 1 uncommitted change(s): e2e/009-site-016-additions/
```

**Remediation (human decision):** (a) record a human override that accepts the two FAIL lines as pre-existing state and re-audit with that override noted; (b) commit or relocate the plan 009 specs, then re-audit (error 2 clears; error 1 does not, because the receipts persist); (c) `/drydock:replan` with a task that fixes the detector's first-command attribution. Nothing has been fixed by the auditor.

Deviations logged: 3 (2 discovered by wavecheck)

## Progress log

| Date | Task | Result | Notes |
|---|---|---|---|
| 2026-10-07 | planning | DRAFT written | **Self-review:** `validate-plan --strict` PASS (5 tasks, 1 wave). `prove-failable` PASS, 5 of 5 fail at baseline, each run through `spawnSync(..., {shell: true})` (cmd.exe) with empty stderr, so none is a syntax error. Pass half: T1.1.3 and T1.1.4 exit 0 against scratch copies edited as their tasks would; T1.1.1 and T1.1.2 match the suite's `ok` lines and `N/N passed` summary, the shape plan 008's criteria passed with. No backslash in any criterion. |
| 2026-10-07 | approval | APPROVED by Sandeep Takasi | Given in session ("approved, execute it"). |
| 2026-10-07 | T0 | PASS | Baseline recorded at `d95b080`, index row added, status EXECUTING. |

## Reconcile report
