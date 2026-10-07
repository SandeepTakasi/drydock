---
plan: 013-guard-beside-any-planner
format_version: 3
status: DONE
isolation: none
enforcement: required
attribution: manifest
lane: small
execution: fleet
created: 2026-10-07
approved_by: Sandeep Takasi
---

# 013 - The guard works beside any planner

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
node drydock/scripts/drydock-audit.mjs wave-start docs/plans/013-guard-beside-any-planner.md 1.1
# ... the wave's executors run, one at a time (D5) ...
node drydock/scripts/drydock-audit.mjs audit-wave docs/plans/013-guard-beside-any-planner.md 1.1
rm .drydock/wave-owns.json
```

**Orchestrator bookkeeping (CLAUDE.md, plans 005-012):** set `status:
EXECUTING` and this plan's `docs/plans/README.md` row in the commit before
`wave-start`. Write this plan file only while no wave is armed, and commit it
before `wave-start`. Edit owned files with Write/Edit, never Bash. Paste
`audit-wave`'s rows and its `enforcement active: ...` sentence **verbatim**
into the wavecheck report, but never its `### audit-wave` heading line (plan
012 deviation 10). Before any push, run `audit-corpus` from a detached
worktree with an empty `CLAUDE_CONFIG_DIR`.

**Staleness check (before the wave):**
`git diff <baseline SHA>..HEAD -- <wave's owned files>`. Non-empty only from
T0's own commit is a handoff, not drift. Anything else → re-validate and update
the baseline and Decision Log.

## Requirement

The ownership guard (`arm` plus `check`, shipped in 0.17.0) needs no Drydock
plan, but nothing tells a user of another planner how to use it, `wave-start`
silently erases an armed guard, `arm` has never been observed in a live
session, and the homepage still says check "prevents nothing". When done:
`arm` has a live-session row (A12) and A10's gaps are closed by a real run;
`wave-start` refuses to overwrite a `"check"` boundary; the `/drydock:check`
skill tells the model to read another planner's task and propose the owned
list for the user to confirm, with no format parser; the plugin README and
QUICKSTART carry a "with another planner" recipe that states the Bash ceiling;
the homepage Limits line, its pinned literal and the evidence page say what the
opt-in guard prevents, backed by A12; and the plugin ships as 0.18.0.

## Spec reference

None. The requirement is complete. The design (no format parser; the model
reads the other planner's task; the user confirms; the audit is the net) was
agreed in conversation on 2026-10-07 and is D6.

## Surgical-scope statement

One refusal in `waveStart` with two suite cases, one sub-step in the check
skill, one recipe in two docs, two evidence rows, one homepage sentence with
its two pinned literals, one release. No change to `arm`, `check`, the hook,
the plan format or any other skill.

## Baseline

_Filled by T0, 2026-10-07._

| Item | Value |
|---|---|
| Commit SHA | `eaa60fa` |
| Installed plugin version (no VERSION DRIFT) | 0.17.1 at `6fae4de`; `validate-plan` PASS, no VERSION DRIFT |
| `node drydock/scripts/drydock-audit.test.mjs` | 159/159 at planning (2026-10-07) |
| Other suites | enforce-owns 42, detect-bash-writes 24, resolve-target 8, stats 8, all PASS at planning |
| `cd site && npm run verify` | PASS once this plan's README row exists (assert-copy home 21, evidence 7; assert-matrix 12 rows); the run before the row failed assert-matrix on that row only |
| `node drydock/scripts/drydock-audit.mjs prove-failable docs/plans/013-guard-beside-any-planner.md` | PASS, 7 of 7 criteria fail at baseline (re-run after the live-run record was written) |

## Practices in effect

| Practice | Value | Source |
|---|---|---|
| Honesty | `docs/compatibility.md` is the source of truth; nothing is claimed live that no live session ran; the homepage changes only after A12 exists | CLAUDE.md "Honesty rule" |
| Quality gates | the five plugin suites (`verify.yml` lines 58-62), `cd site && npm run verify`, `audit-corpus` before push | `verify.yml`, CLAUDE.md |
| Commits | one per task, owned files only, then `task-close` (`attribution: manifest`) | CLAUDE.md |
| Execution | fleet, executors spawned one at a time | D5 |
| Human gate | release and push approved by name and date; a push touching `site/**` deploys | ADR 0003 |
| Acceptance criteria | run through `cmd.exe` here and `/bin/sh` in CI: no backslashes, `new RegExp` and `String.fromCharCode` instead | CLAUDE.md |
| Copy style | no em dash and no apostrophe in a new on-page string | plan 001 F11 |
| Pinned prose | every new skill, doc, release-note and page sentence is given verbatim in its task; wavecheck compares byte for byte | CLAUDE.md "Pin release-note prose" |
| Host profile | none (`drydock.config.yaml` absent); practices taken from CLAUDE.md and the 2026-10-07 interview | |
| Tracker | none | plans 005-012 |

## Findings & constraints

- **`wave-start` overwrites unconditionally.** `waveStart` writes
  `.drydock/wave-owns.json` with no existence check
  (`drydock/scripts/drydock-audit.mjs`, the `writeFileSync(configPath, ...)`
  near line 985), so arming a wave silently replaces a guard `arm` wrote. Plan
  010 called this "a real hazard" and deferred it. `arm` already refuses the
  mirror case (`arm: refused, a boundary is already armed (plan <p>, wave <w>);
  close it with rm .drydock/wave-owns.json`).
- **A boundary `arm` wrote is recognisable.** It is
  `{ plan: null, wave: "check", source: "arm", base, owns }`; `check` already
  keys on `wave === "check"` (D10 of plan 010).
- **The hook honours an `arm` boundary in the suite** (case "the hook enforces
  a boundary written by arm": `b:2 a:0`), but no live session has armed with
  `arm`. `compatibility.md` has no row for it. A6 proved live registration for
  plan waves on 2026-08-22.
- **A10's gaps, measured today.** A10 says "Not shown: the slash command, or
  `check` on unplanned, unarmed work". This session ran the installed 0.17.1
  `drydock:check` model-invoked on unplanned, unarmed work twice on 2026-10-07
  (`045408c` piece summaries, `ea14506` homepage revamp), both
  `check: PASS`. A FLAG on such work and the slash command remain unshown.
- **Skill edits are session-cached** (CLAUDE.md). T1.1.2's new step cannot be
  exercised by any session until 0.18.0 is installed and a session restarts. It
  ships gated on mechanical criteria and says so (D11).
- **Superpowers' task shape, read 2026-10-07** from the installed
  `superpowers` 6.3.0 `skills/writing-plans/SKILL.md`: each task carries
  `**Files:**` with `- Create:`, `- Modify:` (optionally `path:123-145`) and
  `- Test:` lines. No GSD plugin is installed here; GSD is not named anywhere
  this plan writes (D6).
- **The pinned check literal.** `site/scripts/assert-copy.mjs` `REQUIRED_HOME`
  pins `It detects after the fact and prevents nothing.` with a comment saying
  why; `site/content/copy.ts` `limits.items[1]` carries it. The A10 evidence row
  note on the site also says "check itself prevents nothing".
- **Version places:** `drydock/.claude-plugin/plugin.json`, `site/content/copy.ts`
  `const VERSION`, the root `README.md` status line `(v0.17.1)`,
  `drydock/CHANGELOG.md`. `assert-copy` fails when `copy.ts` and `plugin.json`
  disagree, so `npm run verify` is red between T1.1.5 and T1.1.6 (D12).
- **Learnings run** on `drydock-audit.mjs`, `check/SKILL.md`, `QUICKSTART.md`,
  `compatibility.md`, `assert-copy.mjs`, `CHANGELOG.md`. Applied: skill edits
  are session-cached (CLAUDE.md); CHANGELOG through Bash leaves no receipt
  (plan 005 deviation 1); compatibility.md is the source of truth (CLAUDE.md);
  fixture mode disables motion and version checks (plan 001 deviation 38);
  release prose must be pinned (CLAUDE.md, plan 011).

**T0 live-run record** _(filled by T0; the pinned row texts below are what
T1.1.4 and T1.1.5 copy byte for byte)_

Run 2026-10-07, host `2.1.292 (Claude Code)`, Node v24.14.1, installed
drydock 0.17.1 at `6fae4de`, repo at `eaa60fa`, no plan wave armed. Every step
behaved as the protocol requires. Two observations beyond it:

- The uncommitted README row (T0's own bookkeeping) is outside the probe's
  scope, so step 1 and step 5 FLAG it too. For the two armed audits in steps 2
  and 3 it was set aside with `git stash push -- docs/plans/README.md` and
  restored with `git stash pop` straight after, so those audits measure the
  probe alone.
- **Out of scope, recorded only:** the Bash write detector fired live. While
  armed, `.drydock/enforcement.log` gained `"decision":"detected"`,
  `"mechanism":"bash-tree"` receipts for `tmp-a12/bash.txt` (and for the stash
  touching the README). Row A9 says live registration was "ATTEMPTED AND
  NEGATIVE"; this plan does not change A9 (Out of scope, follow-up).

**Pinned A12 compatibility row** (T1.1.4, after A11):

~~~~
| A12 | `arm` guard (ownership hook armed from a check intent file, no plan) fires in a live session | PASSED | 2026-10-07, host 2.1.292, Node v24.14.1, installed 0.17.1 at `6fae4de`. In this repo with no plan wave armed, `arm .drydock/check.md` (owns `tmp-a12/ok.txt`) wrote a `"check"` boundary. A Write to `tmp-a12/stray.txt` was denied by the live hook (`Drydock ownership violation: wave check does not own tmp-a12/stray.txt.`) and the file stayed absent; an Edit to the owned file was allowed; `check` printed `check: hook armed for this scope` and PASS; after `rm .drydock/wave-owns.json` the same Write went through. **Ceiling, observed:** a Bash write to `tmp-a12/bash.txt` landed while armed and `check` FLAGged it. The session wrote none of `arm`'s code (plan 010 did). See [verification-log.md](verification-log.md#a12--arm-guard-in-a-live-session). |
~~~~

**Pinned A10 compatibility row** (T1.1.4, replaces the current A10 row):

~~~~
| A10 | `check` skill (scope audit without a plan) runs in a live session | OBSERVED FLAG THEN PASS | 2026-10-07, host 2.1.292, Node v24.14.1. First run: the installed 0.16.0 skill, model-invoked inside a subagent and an armed plan wave, FLAGged an untracked probe (`check: FLAG (1)`, exit 1), then reported `check: PASS` (exit 0) once the probe was deleted. Later the same day, on the installed 0.17.1, that run's gaps were shown: typed by the user as the slash command `/drydock:check` on unplanned, unarmed work, it FLAGged three files outside scope (`check: FLAG (3)`, exit 1) and stopped to ask rather than fixing them; and model-invoked on unplanned, unarmed site work it reported `check: PASS` twice (`045408c`, `ea14506`). **Not shown:** `check` on a repo other than this one, or run by a user who did not write the plugin. See [verification-log.md](verification-log.md#a10--check-skill-in-a-live-session), and the A12 entry for the later runs. |
~~~~

**Pinned A12 verification-log entry** (T1.1.4, appended at the end of the file):

~~~~
## A12 — arm guard in a live session

**Date:** 2026-10-07
**Host version:** `claude --version` → `2.1.292 (Claude Code)`
**Node:** v24.14.1
**Installed plugin:** drydock 0.17.1 at `6fae4de`
**Repo SHA at run time:** `eaa60fa` (plan 013 approved), working tree carrying only plan 013's uncommitted README row

**What this entry claims.** With no plan wave armed, `drydock-audit.mjs arm`
turned a check intent file into a live boundary: the host's PreToolUse hook
denied a Write outside it and left the file absent, allowed an Edit inside it,
and let the same Write through once the boundary was removed. `check` reported
the armed scope. A Bash write was not prevented and `check` flagged it.

**What this entry does not claim.** One session, one repo, one owned path. The
session that ran it is the plugin author's working session, though it wrote
none of `arm`'s code (plan 010 did). Steps 2 and 3 set plan 013's uncommitted
README row aside with `git stash` so the audit measured the probe alone.

### Method and raw output

Intent `.drydock/check.md`: `base: eaa60fa491db0ffc491e81a6a58472e29b8249aa`,
**Files owned:** `tmp-a12/ok.txt`. Commands ran the installed script,
`node C:/Users/91891/.claude/plugins/cache/drydock/drydock/0.17.1/scripts/drydock-audit.mjs`.

1. Unarmed. Write `tmp-a12/ok.txt` and `tmp-a12/stray.txt`, then `check`
   (exit 1):

       FLAG outside scope: docs/plans/README.md
       FLAG outside scope: tmp-a12/stray.txt
       check: FLAG (2)

2. Deleted `stray.txt`, then `arm .drydock/check.md` (exit 0):

       arm: armed 1 glob(s) from .drydock/check.md
       disarm with:  rm .drydock/wave-owns.json

   Write `tmp-a12/stray.txt` was refused by the live hook:

       Drydock ownership violation: wave check does not own tmp-a12/stray.txt.
       Owned by this wave: tmp-a12/ok.txt

   `ls tmp-a12/` then listed only `ok.txt`. Receipt:
   `"wave":"check","decision":"deny","path":"tmp-a12/stray.txt","mechanism":"file-tool"`.
   An Edit to `tmp-a12/ok.txt` was allowed (receipt `"decision":"allow"`).
   `check`, README set aside (exit 0):

       check: hook armed for this scope
       check: PASS (1 file(s), 0 criteria)

3. Still armed, Bash `echo ... > tmp-a12/bash.txt` landed. `check`, README set
   aside (exit 1):

       FLAG outside scope: tmp-a12/bash.txt
       check: hook armed for this scope
       check: FLAG (1)

4. `rm .drydock/wave-owns.json`; the same Write to `tmp-a12/stray.txt`
   succeeded.

5. The user typed `/drydock:check scope: only tmp-a12/ok.txt. Goal: plan 013
   T0, A10 slash-command run. No arming, audit only.` The skill loaded, wrote
   the intent file and ran the audit (exit 1):

       FLAG outside scope: docs/plans/README.md
       FLAG outside scope: tmp-a12/bash.txt
       FLAG outside scope: tmp-a12/stray.txt
       check: FLAG (3)

   It reported the FLAGs and asked the user how to proceed, changing nothing.

6. `tmp-a12/` and the intent file deleted.

### Verdict

PASSED for the claim above. This is the first live session to arm the hook
without a plan; A6 remains the evidence for plan waves.
~~~~

**Pinned site A12 evidence row** (T1.1.5, `evidence.rows`, after A11):

~~~~
    {
      id: "A12",
      label: "arm guard (ownership hook armed from a check intent file, no plan) fires in a live session",
      status: "PASSED",
      tone: "pass",
      note: "2026-10-07, installed 0.17.1. With no plan wave armed, arm wrote a check boundary from an intent file owning one path. A Write outside it was denied by the live hook and the file stayed absent; an edit to the owned path was allowed; check reported the hook armed and passed; disarming let the same Write through. The ceiling was observed too: a Bash write landed while armed and check flagged it afterwards.",
    },
~~~~

**Pinned site A10 evidence row** (T1.1.5, replaces the A10 `status` and `note`; `id`, `label` and `tone` unchanged):

~~~~
      status: "OBSERVED FLAG THEN PASS",
      note: "2026-10-07. Inside an armed plan wave the audit flagged an untracked probe, then passed once it was deleted. Later the same day the open gaps were shown: typed as the slash command on unplanned, unarmed work it flagged three files outside scope and stopped to ask, and model-invoked on unplanned site work it passed twice. Not shown: a repo other than this one, or a user who did not write the plugin.",
~~~~

## Decision Log

| # | Question | Decision | Decided by | Rationale |
|---|---|---|---|---|
| 1 | Should `arm` take a plain file list? | No. The check intent file is that list | user | Plan 010 D4: `arm` and `check` share one parser so the armed boundary and the audited scope cannot disagree; a second input path breaks that |
| 2 | Lane? | `small`: one phase, one wave, one gate, no review wave, no pressure test | user | Six disjoint tasks, ~13 files, one implementation wave |
| 3 | Close A10's slash-command gap? | Yes: the user types `/drydock:check` once during T0 | user | A model cannot invoke a slash command |
| 4 | Testing Gate? | N/A | user | The only rendered changes are one sentence and one evidence row, both pinned in the export by `assert-copy` |
| 5 | Fleet or solo? | Fleet, executors spawned one at a time | planner (assumed, flag if wrong) | Same as plan 012; a cut-off leaves committed work (CLAUDE.md) |
| 6 | How does Drydock follow another planner's format? | It does not parse it. The check skill tells the model to read the other planner's task, copy the paths it creates, modifies or tests into **Files owned**, show the list and wait for confirmation. GSD is not named | user (conversation, 2026-10-07) | A parser chases a format Drydock does not control; the audit flags a missed path, so a misreading is caught, not trusted |
| 7 | What does `wave-start` refuse? | Only a boundary with `wave: "check"`. A leftover plan-wave boundary is still replaced, as today | planner | Exactly plan 010's deferred hazard; widening it changes how every plan's waves hand off |
| 8 | Where and on what is `arm` proven live? | In T0, in this repo, on the installed 0.17.1. `arm` is not changed by this plan, so the proof holds for 0.18.0. This session wrote none of `arm`'s code (plan 010 did) | planner | The hook reads the project directory's `.drydock/wave-owns.json`, so a scratch repo would not exercise the live registration |
| 9 | Who writes the evidence texts? | T0 writes the A12 and A10 compatibility rows, the A12 verification-log entry and the site A12/A10 notes into *T0 live-run record*, from its own outputs, before `wave-start`. T1.1.4 and T1.1.5 copy them byte for byte. If T0 does not observe a live denial, the plan stops BLOCKED and no claim changes | planner | Two parallel tasks must not each paraphrase one observation |
| 10 | New Limits sentence | `For work too small for a plan, the check skill audits scope afterwards. With the opt-in guard armed, file-tool edits outside that scope are denied; Bash writes are still only detected.` Pins: `file-tool edits outside that scope are denied` and `Bash writes are still only detected.` | planner; human approves at the gate | States what A12 shows and keeps the Bash ceiling pinned beside it |
| 11 | Does the homepage mention other planners? | No, not in this plan. The skill step and recipe ship unexercised; a page mention waits for a session on an installed 0.18.0 to run them | planner | Honesty rule: nothing claimed live that no live session ran |
| 12 | Who bumps `copy.ts` VERSION? | T1.1.5 (it owns `copy.ts`); T1.1.6 bumps the other three places. T1.1.5's criterion runs `assert-copy` in fixture mode, which skips the version check; full `npm run verify` runs at the gate | planner | One owner per file in a fleet wave |
| 13 | Version? | 0.18.0 | planner | New skill behaviour and a new refusal: minor |

## Open questions

None.

## Out of scope / follow-ups

- A homepage mention of using the guard beside another planner, after a session on an installed 0.18.0 runs the new skill step on a real Superpowers task (D11).
- GSD, by name or by format.
- Bash-write prevention (A9).
- `wave-start` refusing to replace a leftover plan-wave boundary.
- Site leftovers: the `__next.evidence.__PAGE__.txt` 404, the badge text decoded twice in `assert-copy`, the evidence page `<h1>` size.
- Plan 012's reconcile, and older unapplied reconcile proposals (plans 006, 008).

## Execution policies

- **Per task:** the acceptance criterion exits 0, verified by the executor and re-run by wavecheck through `spawnSync(..., {shell: true})`.
- **Per wave:** `drydock:wavecheck` is the blocking gate. For T1.1.2, T1.1.3, T1.1.4, T1.1.5 and T1.1.6, wavecheck compares every pinned text byte for byte against its task block or the *T0 live-run record*.
- **Escalation:** wavecheck BLOCKs on ownership or unlogged deviations get no retries; a failed criterion may be retried once by a fresh executor, then a human.
- **Checkpointing:** one commit per task, owned files only, then `task-close`.
- **Testing Gate:** N/A (D4).
- **Human gate:** Phase 1, after wavecheck 1.1 PASS, the five suites, `npm run verify` and `audit-corpus` PASS, named and dated. **Do not push or install before it closes.** After it closes: push, `claude plugin marketplace update drydock && claude plugin update drydock@drydock`, restart.
- **Tracker mirroring:** none.

## Testing Gate

N/A, the only rendered changes are one Limits sentence and one evidence row, and `assert-copy` pins both in the built export (D4). No layout, navigation or interaction changes.

## Pressure-test verdict

N/A: `lane: small` takes no adversarial pressure test (D2). The planner re-opened every file the briefs name and ran every criterion before presenting.

## Phase 0: Pre-flight

#### T0 - Baseline, the live guard run, and the plan index row

- **Description:** Record the SHA, installed version and gate results in *Baseline*, run `prove-failable`, and add this plan's README row. Then run the live protocol below in this repo on the installed 0.17.1, record every output verbatim in *T0 live-run record*, and write the pinned texts there (D8, D9). Commit, then set status EXECUTING with its README row before `wave-start`.
- **Live protocol:** (1) unarmed: an intent owning `tmp-a12/ok.txt`; Write `tmp-a12/ok.txt` and `tmp-a12/stray.txt`; `check` must FLAG `tmp-a12/stray.txt` outside scope. (2) delete `stray.txt`, `arm` the intent; Write `tmp-a12/stray.txt` must be denied by the live hook with the file absent afterwards; Write to `ok.txt` must be allowed; `check` must print `check: hook armed for this scope` and PASS. (3) while armed, a Bash write to `tmp-a12/bash.txt` lands and `check` FLAGs it (the ceiling, observed). (4) `rm .drydock/wave-owns.json`; the same Write to `stray.txt` is now allowed. (5) the user types `/drydock:check` with a stated scope (D3). (6) delete `tmp-a12/` and the intent file. Any step not behaving as stated → status BLOCKED, stop.
- **Files owned:** `docs/plans/README.md` (this plan's *Baseline* and *T0 live-run record* are written here too, before any wave is armed)
- **Depends on:** none
- **Model / thinking:** Judgment / extended   **Executor:** orchestrator, inline
- **Context brief:** this plan's Baseline, Findings, D3, D8, D9; `drydock/skills/check/SKILL.md`; `docs/compatibility.md` A6 and A10 rows for shape; `docs/verification-log.md` A10 entry for shape.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');const r=c.spawnSync('node',['drydock/scripts/drydock-audit.mjs','validate-plan','docs/plans/013-guard-beside-any-planner.md'],{encoding:'utf8'});const o=(r.stdout||'')+(r.stderr||'');const t=fs.readFileSync('docs/plans/013-guard-beside-any-planner.md','utf8');const i=fs.readFileSync('docs/plans/README.md','utf8');process.exit(r.status===0&&!o.includes('VERSION DRIFT')&&new RegExp('Commit SHA [|] .?[0-9a-f]{7,40}').test(t)&&t.includes('| A12 |')&&!fs.existsSync('tmp-a12')&&i.includes('013-guard-beside-any-planner')?0:1)"`

## Phase 1: The guard beside any planner, 0.18.0

**Exit state:** `wave-start` refuses over a check boundary; the check skill and both docs carry the other-planner step; A12 exists and A10 is updated; the homepage Limits line states the opt-in prevention with its Bash ceiling; 0.18.0 is cut; every suite, `npm run verify` and `audit-corpus` PASS.

**Phase gate: CLOSED, approved by Sandeep Takasi - 2026-10-07.** Criteria were wavecheck 1.1 PASS, the five plugin suites PASS, `cd site && npm run verify` PASS, `audit-corpus` PASS from a clean worktree, and the release approved by a named human before any push or install.

### Wave 1.1 - Refusal, skill step, recipe, evidence, page, release

#### T1.1.1 - wave-start refuses to overwrite a check boundary

- **Description:** In `waveStart`, before anything is written (before `ensureDrydockIgnored`), read `.drydock/wave-owns.json`; when it parses and has `wave === "check"`, print exactly `wave-start: refused, a check boundary is armed (arm, base <base>); close it with rm .drydock/wave-owns.json, then re-run wave-start` to stderr, with `<base>` the file's `base` (or `?`), and exit 1. Add two suite cases.
- **Files owned:** `drydock/scripts/drydock-audit.mjs`, `drydock/scripts/drydock-audit.test.mjs`
- **Depends on:** T0
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D7; Findings bullets 1-2; `drydock/scripts/drydock-audit.mjs` `waveStart` (from `function waveStart` to its end) and `arm`; `drydock/scripts/drydock-audit.test.mjs` the `twoWaveRepo`/`bareRepo` helpers, the wave-start cases and the arm cases (`OWNS_FILE`, `intent`, `checkRepo`).
- **Implementation sketch:** reuse `readJSON`. Case `wave-start refuses to overwrite a check boundary`: a committed one-wave plan repo, a pre-written `{"plan":null,"wave":"check","source":"arm","base":"abc1234","owns":["x.txt"]}`; `wave-start` exits 1, the file is byte-identical, stderr has the message with `abc1234`, and output has no `wave-start: armed`. Case `wave-start still replaces a leftover plan-wave boundary`: a pre-written `{"plan":"009-x","wave":"1.1","owns":["a.txt"]}`; `wave-start` arms and the file now names this plan.
- **Forbidden:** changing `arm`, `check`, `readIntent`, any other refusal, or any existing case; refusing over a non-check boundary.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');const r=c.spawnSync(process.execPath,['drydock/scripts/drydock-audit.test.mjs'],{encoding:'utf8'});const s=fs.readFileSync('drydock/scripts/drydock-audit.mjs','utf8'),t=fs.readFileSync('drydock/scripts/drydock-audit.test.mjs','utf8');process.exit(r.status===0&&(r.stdout||'').includes('161/161 passed')&&s.includes('wave-start: refused, a check boundary is armed (arm, base ')&&t.includes('wave-start refuses to overwrite a check boundary')&&t.includes('wave-start still replaces a leftover plan-wave boundary')?0:1)"`

#### T1.1.2 - The check skill reads another planner's task

- **Description:** In `drydock/skills/check/SKILL.md`, insert the text below, exactly, as a new subsection at the end of `## Step 2: write the intent file` (after the paragraph ending `do not guess wide.`, before `## Step 3`). Change nothing else.
- **Pinned text (verbatim):**

  ```
  ### If the work comes from another planner

  When another planning tool wrote the task (for example a Superpowers
  `writing-plans` task, or a ticket), read that task and copy every path it
  says it will create, modify or test into **Files owned**. A Superpowers task
  lists them under `**Files:**` as `Create:`, `Modify:` and `Test:` lines; drop
  any `:123-145` line range from a path. Do not write a parser or a script for
  this: the format belongs to the other tool and changes without notice, so
  read it each time.

  Show the user the list and wait for confirmation before Step 3. A path you
  missed is not prevented, but Step 5 flags it as outside scope, so the
  confirmation is the first net and the audit is the second.
  ```

- **Files owned:** `drydock/skills/check/SKILL.md`
- **Depends on:** T0
- **Model / thinking:** Mechanical / off (Haiku 4.5)   **Executor:** drydock:executor
- **Context brief:** D6, D11; `drydock/skills/check/SKILL.md`.
- **Forbidden:** any other edit to the skill, its frontmatter included; naming GSD.
- **Acceptance criterion:** `node -e "const s=require('fs').readFileSync('drydock/skills/check/SKILL.md','utf8');const h=s.indexOf('### If the work comes from another planner');process.exit(h>s.indexOf('## Step 2')&&h<s.indexOf('## Step 3')&&s.includes('Do not write a parser or a script for')&&s.includes('confirmation is the first net and the audit is the second.')&&!s.includes('GSD')?0:1)"`

#### T1.1.3 - The "with another planner" recipe in the README and QUICKSTART

- **Description:** Insert the text below, exactly, in `drydock/README.md` directly after the `Ceilings:` paragraph of `## Just the guard`, and in `drydock/QUICKSTART.md` at the end of `## 0. Just the guard`. Change nothing else.
- **Pinned text (verbatim, both files):**

  ```
  ### With another planner

  Keep your planner. Before its task runs, `/drydock:check` reads that task (for
  example a Superpowers `writing-plans` task and its `**Files:**` block),
  proposes the owned list for you to confirm, and can arm it. Afterwards `check`
  audits the diff against the same list. Nothing parses the other tool's
  format: the skill reads it each time, and the audit flags any path it missed.
  Bash writes are detected, not prevented. New in 0.18.0 and not yet run by a
  live session.
  ```

- **Files owned:** `drydock/README.md`, `drydock/QUICKSTART.md`
- **Depends on:** T0
- **Model / thinking:** Mechanical / off (Haiku 4.5)   **Executor:** drydock:executor
- **Context brief:** D6, D11; `drydock/README.md` `## Just the guard`; `drydock/QUICKSTART.md` `## 0. Just the guard`.
- **Forbidden:** any other edit to either file; naming GSD.
- **Acceptance criterion:** `node -e "const fs=require('fs');const a=fs.readFileSync('drydock/README.md','utf8'),b=fs.readFileSync('drydock/QUICKSTART.md','utf8');const ok=x=>x.includes('### With another planner')&&x.includes('Nothing parses the other tool')&&x.includes('New in 0.18.0 and not yet run by a')&&!x.includes('GSD');process.exit(ok(a)&&ok(b)&&a.indexOf('### With another planner')>a.indexOf('## Just the guard')&&a.indexOf('### With another planner')<a.indexOf('## The lifecycle')?0:1)"`

#### T1.1.4 - A12 and the updated A10 in the compatibility matrix and log

- **Description:** Add the A12 row after A11 in `docs/compatibility.md`, replace the A10 row, and append the A12 entry to `docs/verification-log.md`, each copied byte for byte from *T0 live-run record*. Change nothing else.
- **Files owned:** `docs/compatibility.md`, `docs/verification-log.md`
- **Depends on:** T0
- **Model / thinking:** Mechanical / off (Haiku 4.5)   **Executor:** drydock:executor
- **Context brief:** D8, D9; *T0 live-run record* of this plan; `docs/compatibility.md`; the tail of `docs/verification-log.md`; CLAUDE.md "Honesty rule for site copy".
- **Forbidden:** editing any other row or entry; promoting any row; text not in *T0 live-run record*.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');const m=fs.readFileSync('docs/compatibility.md','utf8'),v=fs.readFileSync('docs/verification-log.md','utf8');const r=c.spawnSync(process.execPath,['scripts/assert-matrix.mjs'],{cwd:'site',encoding:'utf8'});process.exit(r.status===0&&m.includes('| A12 |')&&new RegExp('^## A12 ','m').test(v)?0:1)"`

#### T1.1.5 - The homepage states what the armed guard prevents

- **Description:** In `site/content/copy.ts`, replace `limits.items[1]` with the D10 sentence, set `const VERSION = "0.18.0"`, add the A12 evidence row after A11 and replace the A10 row's `status` and `note`, copied byte for byte from *T0 live-run record*. In `site/scripts/assert-copy.mjs`, replace the pinned literal `"It detects after the fact and prevents nothing."` in `REQUIRED_HOME` with the two D10 pins, and rewrite the comment above it to say they pin check's ceiling under A12.
- **Files owned:** `site/content/copy.ts`, `site/scripts/assert-copy.mjs`
- **Depends on:** T0
- **Model / thinking:** Standard / default (Sonnet 5.5)   **Executor:** drydock:executor
- **Context brief:** D9, D10, D12; *T0 live-run record*; `site/content/copy.ts` `limits`, `evidence.rows`, `VERSION`; `site/scripts/assert-copy.mjs` `REQUIRED_HOME` and its comments; CLAUDE.md "Honesty rule for site copy" and "`out/index.html` contains the RSC flight payload".
- **Forbidden:** any other string or check; an em dash or apostrophe in a new string; `npm run verify` is expected red until T1.1.6 bumps `plugin.json` (D12), so do not "fix" the version check.
- **Acceptance criterion:** `node -e "const c=require('child_process'),fs=require('fs');try{c.execSync('npx next build',{cwd:'site',stdio:'ignore'})}catch(e){process.exit(1)}const r=c.spawnSync(process.execPath,['scripts/assert-copy.mjs','out/index.html'],{cwd:'site',encoding:'utf8'});const s=fs.readFileSync('site/content/copy.ts','utf8'),a=fs.readFileSync('site/scripts/assert-copy.mjs','utf8'),e=fs.readFileSync('site/out/evidence/index.html','utf8');const n=['file-tool edits outside that scope are denied','Bash writes are still only detected.'];process.exit(r.status===0&&n.every(x=>s.includes(x)&&a.includes(x))&&!s.includes('It detects after the fact and prevents nothing.')&&!a.includes('It detects after the fact and prevents nothing.')&&s.includes('const VERSION = '+String.fromCharCode(34)+'0.18.0')&&e.includes('A12')?0:1)"`

#### T1.1.6 - Cut 0.18.0

- **Description:** Set the version to 0.18.0 in `drydock/.claude-plugin/plugin.json` and the root `README.md` status line, and add the entry below at the top of `drydock/CHANGELOG.md`, exactly, with `<date>` the execution date as `YYYY-MM-DD`.
- **Pinned text (verbatim):**

  ```
  ## 0.18.0: <date>

  **`wave-start` no longer silently replaces a guard armed with `arm`.** With a `"check"` boundary in `.drydock/wave-owns.json` it refuses (exit 1, the file untouched): `wave-start: refused, a check boundary is armed (arm, base <base>); close it with rm .drydock/wave-owns.json, then re-run wave-start`. Until now it overwrote the file and the guard's prevention vanished without a message. A leftover plan-wave boundary is still replaced, as before.

  **The `/drydock:check` skill reads another planner's task.** When the work comes from another planning tool, the skill copies the paths that task says it will create, modify or test into the intent file, shows the list, and waits for confirmation before arming. A Superpowers `writing-plans` task lists them under `**Files:**`. Nothing parses the other tool's format, so a change to it needs no Drydock release, and the audit afterwards still flags a path the model missed. The plugin README and QUICKSTART carry the recipe.

  **`arm` is now observed in a live session (A12).** A Write outside an armed check boundary was denied by the live hook and the file left absent; a Bash write landed and `check` flagged it, the ceiling observed rather than assumed. The homepage now says what the armed guard prevents, beside that ceiling.

  **Unexercised, stated plainly.** The skill's new step has not been run by any session, because sessions load the installed plugin copy. It is gated only on mechanical criteria until a session on an installed 0.18.0 runs it.

  Tests: audit 159 to 161, others unchanged.
  ```

- **Files owned:** `drydock/.claude-plugin/plugin.json`, `drydock/CHANGELOG.md`, `README.md`
- **Depends on:** T0
- **Model / thinking:** Mechanical / off (Haiku 4.5)   **Executor:** drydock:executor
- **Context brief:** D12, D13; the 0.17.1 entry atop `drydock/CHANGELOG.md` for shape; the root `README.md` status line `(v0.17.1)`.
- **Forbidden:** any other edit; pushing, tagging or installing.
- **Acceptance criterion:** `node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('drydock/.claude-plugin/plugin.json','utf8')).version,r=fs.readFileSync('README.md','utf8'),l=fs.readFileSync('drydock/CHANGELOG.md','utf8');const h=(l.match(new RegExp('^## .*$','m'))||[''])[0];process.exit(p==='0.18.0'&&r.includes('(v0.18.0)')&&!r.includes('(v0.17.1)')&&h.startsWith('## 0.18.0: 2026-')&&l.includes('wave-start: refused, a check boundary is armed')&&l.includes('Tests: audit 159 to 161, others unchanged.')?0:1)"`

## Deviation Log

| # | Task | What deviated | Why | Impact | Recorded |
|---|---|---|---|---|---|
| 1 | T1.1.1 | The case `wave-start still replaces a leftover plan-wave boundary` asserts `wave-start: armed` and that the old plan name `009-x` is gone, rather than that the file names this plan | Executor choice | Equivalent in effect: the boundary was rewritten by this arming. Suite 161/161 | executor report |
| 2 | T1.1.3 | The commit trailer reads `Co-Authored-By: Claude Haiku 4.5` instead of the trailer the brief gave | The executor used its own model identity | None under `attribution: manifest`; the subject and owned files are as specified | executor report |
| 3 | T1.1.5 | The comment above the new pins is the executor's own wording (the task gave its content, not its text), and the two pins now sit after `/drydock:init` in `REQUIRED_HOME` | The comment was not pinned | Comment reads as specified (A12, the Bash half must stay); order inside the list has no effect on the check | executor report |
| 4 | T0 (plan defect) | The site A10 evidence row keeps its old `label`, `check skill runs in a live session (model-invoked, inside a plan wave)`, which its updated note now contradicts (slash command, unplanned work). T0's pinned spec said `id`, `label` and `tone` unchanged | Planner oversight when pinning the A10 site texts | A label narrower than its note: an understatement, not an over-claim. Fixed at the gate on the user's instruction, outside the sealed wave, as a `drydock:check`-audited one-line change in `a014d24`: the label now reads `check skill (scope audit without a plan) runs in a live session`, matching `docs/compatibility.md` | discovered-by-wavecheck |

## Wavecheck reports

### Wavecheck 1.1 - PASS - 2026-10-07

`execution: fleet`: each task was written by its own spawned `drydock:executor` (Sonnet 5.5 for T1.1.1 and T1.1.5, Haiku 4.5 for the rest), one at a time; this audit is by the orchestrator, which wrote none of the wave's diff. T0 (the live run and the pinned texts) was the orchestrator's own work, so the byte comparisons below check copying, not the truth of what T0 recorded.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Plan integrity | PASS | `status: EXECUTING` (set in `13cd34e` before `wave-start`); wave 1.1 is the only implementation wave; T0 criterion exit 0. Staleness: no owned file changed between `eaa60fa` and `wave-start` |
| 2. Ownership audit | PASS | `audit-wave 1.1: PASS` (6 tasks, 6 commits, attribution: manifest); 16 hook decisions recorded, so enforcement ran; no Bash write outside `owns`. The run printed VERSION DRIFT (repo script 0.18.0 after T1.1.6, installed 0.17.1): expected until the post-gate install (Execution policies) |
| 3. Forbidden audit | PASS | T1.1.1 (`3bd5178`): additions only (13 lines in `waveStart`, before `ensureDrydockIgnored`; 2 cases); `arm`, `check`, `readIntent` and existing cases untouched; refuses only `wave === "check"`. T1.1.2, T1.1.3: no other line changed; no `GSD`. T1.1.4: three table lines changed in `compatibility.md` (A10 replaced, A12 added), one entry appended to the log; no promotion. T1.1.5: `limits.items[1]`, `VERSION`, A10 `status`/`note`, A12 row, and the pin swap with its comment; no em dash or apostrophe in the new strings. T1.1.6: version in two places, one CHANGELOG entry |
| 4. Acceptance audit | PASS | All six criteria re-run through `spawnSync(crit, {shell: true})` (cmd.exe): T1.1.1 0, T1.1.2 0, T1.1.3 0, T1.1.4 0, T1.1.5 0, T1.1.6 0. Pinned texts compared byte for byte (line endings normalised): the T1.1.2 skill subsection, the T1.1.3 recipe in both files, the A12 and A10 compatibility rows, the A12 log entry, the site A12 row, both site A10 lines, the CHANGELOG entry: all MATCH. Suites: audit 161/161, enforce-owns 42, detect-bash-writes 24, resolve-target 8, stats 8. `npm run verify` PASS (home 22 literals, evidence 7; 13 matrix rows) |
| 5. Deviation reconciliation | PASS | Executor-reported deviations logged as 1-3; one plan defect discovered here, logged as 4, non-blocking (an understatement), carried to the gate |

| Task | Commit | Files changed | Owns | Outside owns |
|------|--------|---------------|------|--------------|
| T1.1.1 | `3bd5178` | `drydock/scripts/drydock-audit.mjs`<br>`drydock/scripts/drydock-audit.test.mjs` | `drydock/scripts/drydock-audit.mjs`<br>`drydock/scripts/drydock-audit.test.mjs` | none |
| T1.1.2 | `78929d6` | `drydock/skills/check/SKILL.md` | `drydock/skills/check/SKILL.md` | none |
| T1.1.3 | `e91936b` | `drydock/QUICKSTART.md`<br>`drydock/README.md` | `drydock/README.md`<br>`drydock/QUICKSTART.md` | none |
| T1.1.4 | `577d07e` | `docs/compatibility.md`<br>`docs/verification-log.md` | `docs/compatibility.md`<br>`docs/verification-log.md` | none |
| T1.1.5 | `fa94c3b` | `site/content/copy.ts`<br>`site/scripts/assert-copy.mjs` | `site/content/copy.ts`<br>`site/scripts/assert-copy.mjs` | none |
| T1.1.6 | `e0847c1` | `README.md`<br>`drydock/.claude-plugin/plugin.json`<br>`drydock/CHANGELOG.md` | `drydock/.claude-plugin/plugin.json`<br>`drydock/CHANGELOG.md`<br>`README.md` | none |

  note: enforcement active: 16 hook decision(s) recorded for wave 1.1 (0 denied)

Deviations logged: 4 (1 discovered by wavecheck)

## Progress log

| Date | Task | Result | Notes |
|---|---|---|---|
| 2026-10-07 | T0 | PASS | Baseline, README row, live guard run (steps 1-6 as specified; slash command typed by the user), pinned texts written; status EXECUTING |
| 2026-10-07 | T1.1.1-T1.1.6 | PASS | `3bd5178`, `78929d6`, `e91936b`, `577d07e`, `fa94c3b`, `e0847c1`; wavecheck 1.1 PASS |
| 2026-10-07 | Phase 1 gate | CLOSED | Approved by Sandeep Takasi; deviation 4 fixed in `a014d24`; status DONE; pushed; installed 0.18.0 |

## Reconcile report
