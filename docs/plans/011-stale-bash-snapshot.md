---
plan: 011-stale-bash-snapshot
format_version: 3
status: EXECUTING
isolation: none
enforcement: required
attribution: manifest
lane: small
execution: fleet
created: 2026-10-07
approved_by: Sandeep Takasi
---

# 011 - The Bash detector's snapshot belongs to one arming

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
rm -f .drydock/bash-tree.json   # D10: the INSTALLED hook still has this bug
node drydock/scripts/drydock-audit.mjs wave-start docs/plans/011-stale-bash-snapshot.md 1.1
# ... the wave's executors run, one at a time (D2) ...
node drydock/scripts/drydock-audit.mjs audit-wave docs/plans/011-stale-bash-snapshot.md 1.1
rm .drydock/wave-owns.json
```

**Orchestrator bookkeeping (CLAUDE.md, plans 005-010):** before T0, commit
`e2e/009-site-016-additions/` as its own plan 009 commit (D8). Set `status:
EXECUTING` and this plan's `docs/plans/README.md` row in the commit before
`wave-start`. Write this plan file only while no wave is armed, and commit it
before `wave-start`. Edit owned files with Write/Edit, never Bash. Paste
`audit-wave`'s table **verbatim** into every wavecheck report, a re-audit
included (CLAUDE.md, plan 010 R1). Before any push, run `audit-corpus` from a
detached worktree with an empty `CLAUDE_CONFIG_DIR`.

**Staleness check (before the wave):**
`git diff <baseline SHA>..HEAD -- <wave's owned files>`. Non-empty → re-validate
the wave's tasks against current code and update the baseline SHA and Decision
Log before executing.

## Requirement

The Bash write detector (`drydock/hooks/detect-bash-writes.mjs`) diffs each
command against `.drydock/bash-tree.json`, and that snapshot outlives the wave
that wrote it. Closing a wave removes `wave-owns.json` and leaves the snapshot
behind. The next armed wave therefore reports everything that changed between
the two arming sessions as written by its own first Bash command. When done: a
snapshot is used only by the arming that wrote it. A snapshot from any other
arming, or in the old shape, is discarded and re-seeded, with a receipt that
says so. CLAUDE.md's workaround note (plan 010 R2), which states a wrong cause,
is deleted. Ship as 0.17.1.

## Spec reference

none, requirement is complete. Source: plan 010 Deviation 2 and Reconcile Q1,
whose diagnosis this plan corrects (see Findings).

## Surgical-scope statement

A key on the snapshot and three test cases in the detector, one CLAUDE.md
bullet deleted, one patch release. `drydock-audit.mjs`, `wave-start`, `arm` and
the file-tool hook are untouched.

## Baseline

Recorded by T0 on 2026-10-07, after the D8 commit, approved by Sandeep Takasi the same day.

| Item | Value |
|---|---|
| Commit SHA | `5e1fa6c4f85cb9b16a3611a2f3f19ae7567cc036` (D8: plan 009's five seatrial specs committed) |
| `node drydock/scripts/drydock-audit.test.mjs` | **GREEN.** `159/159 passed` |
| `node drydock/hooks/enforce-owns.test.mjs` | **GREEN.** `enforce-owns: PASS, 42 cases` |
| `node drydock/hooks/detect-bash-writes.test.mjs` | **GREEN.** `detect-bash-writes: PASS, 21 cases` |
| `node drydock/lib/resolve-target.test.mjs` | **GREEN.** `resolve-target: PASS, 8 cases` |
| `node drydock/scripts/drydock-stats.test.mjs` | **GREEN.** `8/8 passed` |
| `audit-corpus` (clean worktree, empty `CLAUDE_CONFIG_DIR`) | **GREEN.** `audit-corpus: PASS, 25 wave(s) in 6 plan(s)` |
| `cd site && npm run verify` | **RED for one reason only:** build, `tsc`, `eslint` and `assert-copy: PASS` all passed; `assert-matrix: FAIL (1)`, no row for this plan. Green after T0. |

No pre-existing failure is excluded. The working tree is clean apart from this plan file.

## Practices in effect

| Practice | Value | Source |
|---|---|---|
| Testing | Plain-script suites, no framework; the detector suite prints `ok  ` / `FAIL` lines and `detect-bash-writes: PASS, <n> cases` | `drydock/hooks/detect-bash-writes.test.mjs` |
| Runtime | Node ≥ 20.17, built-ins only | `plugin.json` `engines` |
| Platforms | Windows and Linux both gate; the detector suite never shells out (its own note, ~68-80) | `verify.yml`, test file |
| Quality gates | the five plugin suites, `validate-plan` over the corpus, `audit-corpus`, `npm run verify` | `verify.yml`, CLAUDE.md |
| Commits | one per task, owned files only, then `task-close` | CLAUDE.md |
| Execution | fleet, one at a time | user, D2 |
| Human gate | release approval signed by Sandeep Takasi before any push | user, D9 |
| Acceptance criteria | run through `cmd.exe`: no backslashes, suite stderr suppressed | CLAUDE.md |
| Docs honesty | no site claim; `compatibility.md` unchanged | CLAUDE.md |

## Findings & constraints

- **The root cause is a stale snapshot, not a missing one. This corrects plan
  010.** With no snapshot, the detector already seeds and records `observed`
  with "first Bash command of the wave, snapshot seeded, nothing to diff
  against" (`detect-bash-writes.mjs` ~239-245). Measured in
  `.drydock/enforcement.log`: plan 009's last Bash receipt was at 02:53Z, and
  its seatrial specs were written at about 03:03Z, after that wave closed.
  Plan 010's first Bash command (05:42Z) has **zero** `seeded` receipts and
  five `detected` ones, all for those specs. It diffed against plan 009's
  snapshot. Wave 1.2 did not re-report them because 1.1's last snapshot
  already contained them. That is consistent with this cause and does not
  support the "first command" one. Plan 010's Deviation 2, its Q1, its
  wavecheck 1.2 sentence and CLAUDE.md's R2 bullet all state the wrong cause.
  The plan record stays as written (execution history is not a draft); this
  plan's T1.1.2 deletes the CLAUDE.md bullet.
- **The snapshot today** is a flat object `{ "<rel path>": "<size>:<mtimeNs>" }`
  at `.drydock/bash-tree.json`, rolled forward (replaced) after every command
  (~228-237). An array-shaped one from an older version is already treated as
  missing (~219-223), and this plan extends that compat path.
- **`wave-owns.json` is rewritten on every arming** by `wave-start` and `arm`,
  so its `mtimeNs` changes even when the same wave is re-armed with identical
  content. Content alone cannot tell two armings apart (D4).
- **`audit-wave` never parses a receipt's `detail`** (it splits on `mechanism`
  and `decision` only), so a new detail string is free (checked: no `seeded` or
  `.detail` match in `drydock-audit.mjs`).
- **The detector suite** builds repos with `mkrepo(name, {armed, owns})`, fires
  the hook with `fire(dir, command)`, reads `receipts(dir)`, and seeds with
  `seed(dir)`. Mutations are made from Node, never a shell (~68-80). There are
  21 cases now. The case "the first command of a wave says it seeded" (~240)
  must keep passing unchanged.
- **This session's hooks are the installed 0.16.0**, which carries the bug. The
  plan's own wave would hit it through the snapshot plan 010 left in
  `.drydock/`, so the arming block deletes `.drydock/bash-tree.json` first
  (D10). The fix itself is exercised by the suite and not by a live session
  (D12).
- **Learnings pulled** (`learnings` on both detector files): only plan 010's
  Deviation 2, which this plan corrects.

## Decision Log

| # | Question | Decision | Decided by | Rationale |
|---|---|---|---|---|
| D1 | Lane? | `small` | planner (assumed, flag if wrong) | Seven files, three tasks, no shared file. Plan 010 R3: a BLOCK repair would force `lane: full`. |
| D2 | Execution? | fleet, executors one at a time | user | As in plans 006-010. |
| D3 | Fix shape? | The hook keys its snapshot to the arming that wrote it. No change to `wave-start` or `arm` | user | Covers every way `wave-owns.json` gets written, in one file. Consumed by T1.1.1. |
| D4 | What identifies an arming? | `"<plan>|<wave>|<mtimeNs of .drydock/wave-owns.json>"`, with `plan`/`wave` from the parsed config (`null` written as the empty string) and `mtimeNs` from `statSync(configPath, { bigint: true })` | planner (assumed, flag if wrong) | Re-arming the same wave rewrites the file with identical content, so only the mtime distinguishes the armings. `plan`/`wave` make the key readable in the snapshot. Consumed by T1.1.1. |
| D5 | Snapshot shape? | `{ "armed": "<key>", "paths": { "<rel>": "<size>:<mtimeNs>" } }`. Anything else (the old flat object, an array, corrupt JSON) is treated as **missing** | planner | The safe direction: after an upgrade, one first command per wave goes undiffed (an existing, stated ceiling), and nothing stale is ever diffed. Consumed by T1.1.1. |
| D6 | Receipt text (complete rule body) | No usable snapshot at all: `observed`, detail unchanged, `first Bash command of the wave, snapshot seeded, nothing to diff against`. A well-shaped snapshot whose `armed` differs from the current key: `observed`, detail `snapshot from an earlier arming discarded, snapshot seeded, nothing to diff against`. In both cases the new snapshot is written with the current key, and nothing is diffed. A matching key diffs exactly as today | planner | Diagnosable from the log alone. The word `seeded` stays in both, so the existing first-command case keeps passing. Consumed by T1.1.1, T1.1.3. |
| D7 | CLAUDE.md's R2 bullet? | Delete it whole | user | Its cause is wrong, and once this ships pre-existing untracked files no longer trip the detector. Consumed by T1.1.2. |
| D8 | The untracked plan 009 specs? | The orchestrator commits `e2e/009-site-016-additions/` as one plan 009 commit before T0 | user | Earlier plans committed their seatrial specs. It gives a clean tree and no override. |
| D9 | Release? | 0.17.1, Phase 1 gate signed by Sandeep Takasi before any push | user | A bug fix is a patch. Consumed by T1.1.3. |
| D10 | Protect this plan's own wave? | Delete `.drydock/bash-tree.json` immediately before `wave-start` | planner, measured | The running hook is the installed 0.16.0, which would diff against plan 010's leftover snapshot. |
| D11 | Testing Gate? | N/A | planner | See § Testing Gate. |
| D12 | Live proof? | None in this session; the suite exercises the hook process end to end | planner, CLAUDE.md | Hooks load from the installed plugin. A session on an installed 0.17.1 is the first live run. |
| D13 | Which copy arms? | The repo copy | planner | `wave-start` is unchanged by this plan. |

## Open questions

| # | Question | Blocks | Recommended answer |
|---|---|---|---|
| none | | | |

## Out of scope / follow-ups

- Snapshotting at arm time so that even a wave's first Bash command is diffed
  (closes the "seeded, nothing to diff against" ceiling). It needs the
  git-status/identity code shared with `drydock-audit.mjs`.
- Correcting plan 010's Deviation 2 and Q1 text. That is history, and this plan's Findings carry the correction.
- Removing the snapshot when a wave closes. Closing is a bare `rm`, not a command the tool owns.

## Execution policies

- **Per task:** the acceptance criterion must exit 0, verified by the executor
  and re-run by wavecheck.
- **Per wave:** `drydock:wavecheck` on Wave 1.1 is the single gate.
- **Per phase:** no review wave and no phase review (`lane: small`).
- **Escalation:** a BLOCK on ownership or an unlogged deviation gets no retry.
  A repair runs as a new wave with new task ids, which moves the plan to
  `lane: full` (CLAUDE.md).
- **Checkpointing:** one commit per task, owned files only, then `task-close`.
- **Human gate:** the Phase 1 gate, named and dated (D9).
- **Tracker mirroring:** none.

## Testing Gate

N/A, this plan changes a PostToolUse hook, its test suite, one CLAUDE.md
bullet and the version string. The only user-facing surface is the homepage
version literal, which `assert-copy.mjs` checks against `plugin.json` at build
time. The hook's behaviour is proved by T1.1.1's suite, which spawns the real
hook process.

## Pressure-test verdict

Not run, `lane: small` (D1). The self-review checklist, `validate-plan --strict`
and `prove-failable` were run instead (Progress log).

## Phase 0: Pre-flight

#### T0 - Baseline verification and plan index row

- **Description:** After the D8 commit, record the commit SHA and the verbatim
  result of every gate command in *Baseline*, add this plan's row to
  `docs/plans/README.md`, set `status: EXECUTING`, and commit both.
- **Files owned:** `docs/plans/README.md` (this plan's *Baseline* and
  frontmatter are also written here, before the wave is armed)
- **Depends on:** none
- **Model / thinking:** Mechanical / off   **Executor:** orchestrator, inline
- **Context brief:** this plan's *Baseline*; `docs/plans/README.md`;
  `site/scripts/assert-matrix.mjs`.
- **Acceptance criterion:** `node -e "const fs=require('fs');const p=fs.readFileSync('docs/plans/011-stale-bash-snapshot.md','utf8'),i=fs.readFileSync('docs/plans/README.md','utf8');const m=p.match(/Commit SHA [|] .?([0-9a-f]{7,40})/);if(!m||!i.includes('011-stale-bash-snapshot')||/[|] _pending_/.test(p))process.exit(1);try{require('child_process').execFileSync('node',['site/scripts/assert-matrix.mjs'],{stdio:'ignore'})}catch(e){process.exit(1)}"`

## Phase 1: Snapshot keyed to its arming

**Exit state:** the detector never diffs against another arming's snapshot,
CLAUDE.md no longer carries R2, and 0.17.1 is cut locally and unpushed.

**Phase gate:** all five plugin suites exit 0 (audit 159/159, enforce-owns 42, detect-bash-writes 24, resolve-target 8, stats 8/8); `validate-plan` over the corpus as CI runs it exits 0; `audit-corpus` PASS from a clean worktree with an empty `CLAUDE_CONFIG_DIR`; `cd site && npm run verify` exits 0; human approval of the 0.17.1 release by Sandeep Takasi, named and dated, before any push.

### Wave 1.1 - The keyed snapshot, the CLAUDE.md deletion, the release

> The three tasks share no file. T1.1.3 quotes D6's strings, not T1.1.1's output.

#### T1.1.1 - The detector discards a snapshot from another arming

- **Description:** Tag the snapshot with the arming key (D4) in the shape D5
  defines. Treat a snapshot whose key differs, or whose shape is anything else,
  as missing, with the receipts D6 specifies. Add three named cases to the
  detector suite, and watch each fail before the code exists.
- **Files owned:** `drydock/hooks/detect-bash-writes.mjs`,
  `drydock/hooks/detect-bash-writes.test.mjs`
- **Depends on:** T0
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D3, D4, D5, D6 of this plan; this plan's Findings (first
  two bullets); `drydock/hooks/detect-bash-writes.mjs` in full (259 lines),
  especially the snapshot read/roll-forward/seed block (~205-247) and the
  CEILINGS docblock (~39-64); `drydock/hooks/detect-bash-writes.test.mjs`
  helpers (~35-80) and the "first command of a wave says it seeded" case (~240).
- **Forbidden:** any file outside `owns`; changing `record()`'s receipt fields
  or the `mechanism` value; diffing against a snapshot whose key does not
  match; making the hook exit non-zero; any shell call in the tests (the suite
  never shells out); touching `drydock-audit.mjs` or `enforce-owns.mjs`.
- **Implementation sketch:**
  - `armingKey` is the string `<plan>|<wave>|<mtimeNs>`, built from
    `config.plan ?? ""`, `config.wave ?? ""` and
    `statSync(configPath, { bigint: true }).mtimeNs`, and computed after the
    config parses. If `statSync` throws, use `null`: no key
    matches it, so the hook re-seeds, which is the safe direction.
  - Read: `raw && raw.armed && raw.paths && typeof raw.paths === "object" && !Array.isArray(raw.paths)`
    → `staleKey = raw.armed !== armingKey`, and `before = staleKey ? null : raw.paths`.
    Any other shape → `before = null`, `staleKey = false`.
  - Write: `{ armed: armingKey, paths: afterSnap }`, still before any diff
    (the existing roll-forward ordering stays).
  - Seed branch: the detail is chosen by `staleKey` per D6.
  - Add a CEILINGS line stating that a snapshot is bound to one arming, and
    why (plan 011).
  - Three cases, these exact names:
    `a snapshot from an earlier arming is discarded, not diffed`: seed under
    one arming. Then create an unowned untracked `site/between.txt` from Node,
    rewrite `wave-owns.json` with a different `wave`, and fire `true`. Expect no
    `detected` receipt, and one `observed` whose detail matches `/earlier arming/`.
    `re-arming the same wave discards the snapshot too`: as above, but rewrite
    `wave-owns.json` with identical content. Make sure its mtime changes: wait
    until `statSync(...,{bigint:true}).mtimeNs` differs, or set it with
    `utimesSync`. Same expectation.
    `an old flat snapshot is treated as missing`: write a flat
    `{"site/x.txt":"1:1"}` to `.drydock/bash-tree.json`, then create
    `site/x.txt` and fire `true`. Expect no `detected`, and one `observed`
    whose detail matches `/first Bash command/`.
- **Acceptance criterion:** `node -e "let o='';try{o=require('child_process').execFileSync('node',['drydock/hooks/detect-bash-writes.test.mjs'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch(e){process.exit(1)}const n=['a snapshot from an earlier arming is discarded, not diffed','re-arming the same wave discards the snapshot too','an old flat snapshot is treated as missing'];const ls=o.split(String.fromCharCode(10));process.exit(n.every(x=>ls.some(l=>l.startsWith('ok ')&&l.includes(x)))&&o.includes('detect-bash-writes: PASS, 24 cases')?0:1)"`

#### T1.1.2 - Delete CLAUDE.md's stale-cause note

- **Description:** Delete the whole bullet in `CLAUDE.md` that begins
  `- **Start a wave from a tree with no untracked files.**` (seven lines,
  ending `the detector's ceiling list does not name it yet.`). Leave the
  bullets above and below it unchanged.
- **Files owned:** `CLAUDE.md`
- **Depends on:** T0
- **Model / thinking:** Mechanical / off (Haiku 4.5)   **Executor:** drydock:executor
- **Context brief:** D7 and the first Findings bullet of this plan; `CLAUDE.md`
  section "Executing a plan here".
- **Forbidden:** any other edit to `CLAUDE.md`; any file outside `owns`.
- **Acceptance criterion:** `node -e "const s=require('fs').readFileSync('CLAUDE.md','utf8');process.exit(!s.includes('Start a wave from a tree with no untracked files')&&!s.includes('ceiling list does not name it yet')&&s.includes('Per task: edit (file tool)')&&s.includes('sealed wave still re-audits')?0:1)"`

#### T1.1.3 - Cut 0.17.1

- **Description:** Bump the version to 0.17.1 in its four places, and write the
  0.17.1 CHANGELOG entry. It states the stale-snapshot cause and the fix,
  quoting D6's new detail string. It states plainly that 0.17.0's plan 010
  named the wrong cause, and that the fix has not run in a live session (D12).
  It ends `Tests: detect-bash-writes 21 to 24, others unchanged.`
- **Files owned:** `drydock/.claude-plugin/plugin.json`, `drydock/CHANGELOG.md`,
  `site/content/copy.ts`, `README.md`
- **Depends on:** T0
- **Model / thinking:** Mechanical / off (Haiku 4.5)   **Executor:** drydock:executor
- **Context brief:** D4, D5, D6, D9, D12 and the first Findings bullet of this
  plan; the 0.17.0 entry atop `drydock/CHANGELOG.md` for shape; `copy.ts`
  `const VERSION`; the root `README.md` status line (`(v0.17.0)`).
- **Forbidden:** any other edit to `copy.ts` or the root README; pushing or
  tagging; any file outside `owns`.
- **Acceptance criterion:** `node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('drydock/.claude-plugin/plugin.json','utf8')).version,c=fs.readFileSync('site/content/copy.ts','utf8'),r=fs.readFileSync('README.md','utf8'),l=fs.readFileSync('drydock/CHANGELOG.md','utf8');const h=(l.match(/^## .*$/m)||[''])[0];process.exit(p==='0.17.1'&&/const VERSION = .0[.]17[.]1.;/.test(c)&&r.includes('(v0.17.1)')&&!r.includes('(v0.17.0)')&&h.startsWith('## 0.17.1')&&l.includes('snapshot from an earlier arming discarded')&&l.includes('detect-bash-writes 21 to 24')?0:1)"`

## Deviation Log

| # | Task | What deviated | Why | Impact | Recorded |
|---|---|---|---|---|---|

## Wavecheck reports

## Progress log

| Date | Task | Result | Notes |
|---|---|---|---|
| 2026-10-07 | planning | DRAFT written | **Self-review:** `validate-plan --strict` PASS (4 tasks, 1 wave). `prove-failable` PASS, 4 of 4 fail at baseline, each run through `spawnSync(..., {shell: true})` with empty stderr (no syntax error). No backslash anywhere in the plan. Pass half: T1.1.2 and T1.1.3 are string checks against files whose current text was read; T1.1.1 matches the suite's `ok  ` prefix and its `detect-bash-writes: PASS, <n> cases` summary, both read from the test file. Every Decision naming a task is cited in that task's brief. |
| 2026-10-07 | approval | APPROVED by Sandeep Takasi | Given in session ("approved, execute it"). |
| 2026-10-07 | D8 | plan 009 specs committed | `5e1fa6c`. |
| 2026-10-07 | T0 | PASS | Baseline at `5e1fa6c`, index row added, status EXECUTING. |

## Reconcile report
