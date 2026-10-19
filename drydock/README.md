# Drydock

Ships get built here. Nothing sails until it leaves the dock.

Drydock keeps an AI agent inside the files you said it may touch. A
`PreToolUse` hook **denies** any Write/Edit outside a declared set of globs, a
second hook **detects** shell writes it cannot block, and an audit checks the
final diff against the same list. Use the guard on its own, beside any planner,
or with Drydock's own plans when the work is big enough to split into waves.

## 1. The guard (start here)

No plan needed. `/drydock:check` writes the intent file, arms the guard, and
audits the result for you. By hand:

```bash
# The install dir is not on PATH. In a checkout of this repo, DD=drydock.
DD=$(ls -d ~/.claude/plugins/cache/drydock/drydock/*/ | sort -V | tail -1)
# .drydock/check.md: base: <commit sha>, Files owned: `src/**`-style globs
node "$DD/scripts/drydock-audit.mjs" arm .drydock/check.md    # Write/Edit outside the globs are denied
# ...work...
node "$DD/scripts/drydock-audit.mjs" check .drydock/check.md  # audit the diff against the same file
rm .drydock/wave-owns.json                                    # disarm
```

**With another planner:** keep it. Before its task runs, `/drydock:check` reads
that task (for example a Superpowers `**Files:**` block), proposes the owned
list for you to confirm, and can arm it. Nothing parses the other tool's format;
the audit flags any path the skill missed.

**On pull requests:** the `scope-gate` Action fails a PR that changes files
outside the scope declared in its linked issue. See
[`scope-gate/README.md`](../scope-gate/README.md).

### What the guard does not do

- **Shell writes are detected, not prevented.** `sed -i`, `>` and
  `git checkout` never reach a file-tool hook. A `PostToolUse` hook records
  what each Bash command changed, and the audit fails on any change outside
  scope. Gitignored writes, write-then-restore inside one command, and
  backgrounded commands escape it; concurrent Bash can be misattributed.
- **It is wave-level, not per-task.** The hook reads one owned set at a time.
- **It is inert unless `.drydock/wave-owns.json` exists.** That is the default
  state and the escape hatch.
- **Catch-all globs are refused.** Anything starting with `**`: name the
  directories.

## 2. Plans, when the work is big

For multi-file work that should be split across parallel subagents:

```
planwright ──► [human approves] ──► execute waves ──► wavecheck ──► (final) wavecheck closes the plan
                                         ▲                │
                                         └── /replan ◄────┘  (on BLOCK or drift)
```

| Piece | Kind | Invocation |
|-------|------|-----------|
| `check` | skill | `/drydock:check`: the guard, no plan |
| `planwright` | skill | `/drydock:planwright`: writes the plan (and the repo profile on first run) |
| `executor` / `executor-isolated` | agents | spawned per task by the orchestrating session |
| `wavecheck` | skill | gate after every wave; after the last, it runs the Testing Gate and proposes doc fixes |
| `replan` | skill | **human-only**: patches a plan, never regenerates it |

- **Disjoint ownership per wave.** `wave-start` arms the guard from the plan;
  no file is owned by two tasks in one wave. Same-wave tasks can also run in
  separate git worktrees (`isolation: worktree`).
- **Plan-conformance auditing, not code review.** Wavecheck asks one question:
  did the wave do exactly what the plan said and nothing else? It judges from
  per-task commits and executed acceptance criteria, never from what executors
  claim. `audit-wave` prints the SHAs and file lists it derived.
- **The plan is checked by a program.** `validate-plan` catches duplicate task
  ids, same-wave ownership collisions, same-wave dependencies, and Testing Gate
  defects; `prove-failable` errors on any criterion that already passes before
  its task runs.
- **A small lane, and an offer to skip the plan.** `lane: small` is one phase,
  one wave, one gate. `execution: solo` drops subagents. Below about five units
  of work planwright offers to just do the task.
- **The Testing Gate is written before the code.** UI-touching plans carry
  end-to-end cases from the start; a final-wave task writes them as Playwright
  specs and the closing wavecheck runs them. A browser verdict is evidence about
  the paths tested, not proof other defects are absent.
- **Closing proposes, never applies.** The final wavecheck turns deviations and
  failed assumptions into proposed diffs to `CLAUDE.md`, ADRs and architecture
  docs. A human applies them.

Arming a wave by hand:

```bash
node "$DD/scripts/drydock-audit.mjs" wave-start docs/plans/005-x.md 2.1   # arm the hook
node "$DD/scripts/drydock-audit.mjs" audit-wave  docs/plans/005-x.md 2.1  # audit afterwards
rm .drydock/wave-owns.json                                                # close the wave
```

`wave-start` refuses a plan that fails `validate-plan` or has uncommitted
changes, and adds `.drydock/` to `.git/info/exclude` if nothing ignores it. Never write
`.drydock/wave-owns.json` by hand.

**A plan document is executed, not merely read.** `prove-failable` and
wavecheck run each criterion's backticked command through your shell. Read a
plan you did not write before you gate on it.

## Requirements

**Node >= 20.17** on PATH (CI tests 20, 22 and 24), and a host that runs
`PreToolUse` hooks, or the guard silently does nothing. Check the hook before
relying on it; this runs in a temp directory:

```bash
node "$DD/hooks/enforce-owns.test.mjs"
```

## Install

```
/plugin marketplace add SandeepTakasi/drydock
/plugin install drydock@drydock
```

Add `--scope project` to share it with your team. Settings: `plans_dir`
(default `docs/plans`; falls back to `.drydock/plans/` if gitignored),
`docs_targets` (what the closing wavecheck may propose changes to), `e2e_dir`
(where Testing Gate specs go, default `e2e`).

**[QUICKSTART.md](QUICKSTART.md)** walks one small change end to end in about
15 minutes. Evidence for every claim above, including what is not yet shown, is
in [compatibility](../docs/compatibility.md). MIT licensed; semver, with
[CHANGELOG.md](CHANGELOG.md).

## The spine

Everything interoperates through one contract:
`skills/planwright/reference/plan-format.md`. Change it → bump
`format_version` → update every consumer.

## Deliberate non-goals

- Code-quality review (wavecheck audits conformance only)
- Spec authoring (specs feed *into* planwright)
- Auto-editing any documentation, ever
