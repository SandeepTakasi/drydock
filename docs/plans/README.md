# Plans

Every plan Drydock has executed, kept as written. These are execution records,
not documentation samples — the Decision Logs, Deviation Logs and wavecheck
reports are the parts worth reading, and they are the parts a tidied-up example
would have lost.

| Plan | What it built | Status |
|---|---|---|
| [001-drydock-homepage](001-drydock-homepage.md) | The `site/` homepage, 28 tasks across 14 waves | RECONCILED |
| [002-design-system-modernisation](002-design-system-modernisation.md) | Design-token and typography pass | DONE |
| [003-hero-revamp](003-hero-revamp.md) | Hero section rebuild | DONE |
| [004-seatrial-e2e-gate](004-seatrial-e2e-gate.md) | The `seatrial` browser gate (v0.5.0) | RECONCILED |
| [005-small-lane-and-solo-mode](005-small-lane-and-solo-mode.md) | The `lane: small` / `execution: solo` short-form track (v0.8.0) | RECONCILED |
| [006-external-review-repairs](006-external-review-repairs.md) | The nine repairs an outside review and this plan's own gate found (v0.15.0) | RECONCILED |
| [007-deferred-hardening](007-deferred-hardening.md) | The seven items plan 006 deferred, hook path resolution hardened (v0.15.1) | RECONCILED |
| [008-stats-gates-check-learnings](008-stats-gates-check-learnings.md) | Token split per plan, the wave-order lock, `check`, and past learnings for planwright (v0.16.0) | RECONCILED |
| [009-site-016-additions](009-site-016-additions.md) | The homepage learns 0.16.0's `check`, learnings step, wave lock and CI re-audit, claiming only what ran | DONE |
| [010-guard-entry-point](010-guard-entry-point.md) | `arm`: the ownership hook armed from a `check` intent file, no plan needed; docs lead with it (v0.17.0) | RECONCILED |
| [011-stale-bash-snapshot](011-stale-bash-snapshot.md) | The Bash detector's snapshot is bound to the arming that wrote it, so a stale one is never diffed (v0.17.1) | RECONCILED |
| [012-homepage-restructure](012-homepage-restructure.md) | The homepage leads with the drift problem, quotes a real BLOCK and four real refusals, and moves the evidence matrix to its own page | DONE |
| [013-guard-beside-any-planner](013-guard-beside-any-planner.md) | The guard beside any planner: `wave-start` stops erasing an armed guard, the check skill reads another planner's task, `arm` observed live (v0.18.0) | DONE |
| [014-scope-gate-action](014-scope-gate-action.md) | `scope-gate`: a GitHub Action that fails a PR whose diff leaves the scope its linked issue declared first | RECONCILED |

Plan 001 also has a [field case study](../case-study-001-homepage.md) written
against it, including the parts that reflect badly on the tool.

## One of these fails the validator, on purpose

```
validate-plan: FAIL (1) — docs/plans/004-seatrial-e2e-gate.md
```

**That is a real defect, and the tool is right.** Plan 004 places `T2.1.2` in the
same wave as `T2.1.1`, which it depends on: `T2.1.2` generates spec files from
the run `T2.1.1` performs, and the two were placed side by side anyway. Same-wave
tasks are declared to run in parallel, so the dependency cannot hold. It stays
because **execution history is not a draft** — rewriting a finished plan to make
a tool go green would destroy the evidence and teach the opposite lesson. It is
accepted and recorded as that plan's deviation 15, and it is the shape
`execution: solo` was invented for in v0.8.0: a plan written today would declare
solo and validate clean.

### It used to say *two*, and the second one was the tool's fault

Until v0.8.10 this file reported plan 001 failing the same way — `T2.3.1`
depends on `T2.3.2`, apparently in wave 2.3. It does not. Deviation 44 moved
integration into a new `### Wave 2.4` and kept the id `T2.3.1`, exactly as the
format contract requires (ids never change once assigned; only the wave
assignment moves). The validator was reading each task's wave off its **id**, so
a correctly-moved task looked like a cycle. The plan followed the contract; the
checker did not implement it.

Both halves are worth keeping. `validate-plan` found a genuine defect on its
first run in v0.6.0 that a wavecheck, a fresh-context quality review and an
adversarial pressure test had all read past — the argument for checking plans
with a program rather than only with a reader. And it reported a second one that
was its own bug, which is the argument for not treating a program's verdict as
beyond question either.

## Running the tools against them

```bash
node drydock/scripts/drydock-audit.mjs validate-plan docs/plans/002-design-system-modernisation.md
node drydock/scripts/drydock-audit.mjs audit-wave   docs/plans/004-seatrial-e2e-gate.md 2.0
```

The `audit-wave` command above is also a fixture: it reports the ownership breach
that plan 004 actually committed at `5a32ac9` (deviation 13), where a checkpoint
commit staged a file outside its task's `owns`.

Plans 001–004 predate `format_version: 3` and carry no `enforcement:` key, so
they default to `none` and are not held to the enforcement-log check added in
v0.7.0. Nothing about them changed when that check landed.
