# Changelog

## 0.8.11 — 2026-09-02

**Four defects in code shipped hours earlier the same day, found by a second
review pass over it.** Every one is a check that looked stronger than it was.

- **The root `README.md` still published the stale A3 figure** — "Four plans",
  "27 of 28 … across those 4 plans" — while all three surfaces `assert-matrix`
  checks were correct. The gate had been built from *the list of places drift had
  been found* rather than *the list of places the figure is stated*, and the most
  public surface in the repo was not on it. Corrected, and `README.md` is now
  checked.
- **Check 4 scanned line by line, and the README wraps.** Its figure and the word
  "gates" sit either side of a line break, so a line-scoped scan sees a number
  with no keyword and a keyword with no number, and matches neither — which is
  why the check missed it *and* why a hand-written `grep` over the repo missed it
  too. It now scans whole documents with whitespace collapsed.
  `verification-log.md` stays exempt by file (it is nothing but dated records);
  a historical count *inside* a checked file — "Measurement was closed at 3 plans
  on 2026-08-19" — is exempted by its idiom instead, so a dated record can live
  in a checked document.
- **The sealed-record fallback read the FIRST wavecheck report for a wave;
  `derivePlanState` has always read the LAST.** A re-audit is an ordinary heading
  and supersedes what came before, so on a re-audited wave the fallback recovered
  the superseded table and then failed the wave with *"history moved under the
  manifest (amend, rebase or drop)"* — a confident false cause for a history that
  had not moved. Same failure class as the "the hook never ran here" diagnosis
  fixed in 0.8.7. Two readers of the same headings must not disagree about which
  one counts. The unreachable-sha error now also names the source that actually
  supplied the sha rather than always blaming the manifest.
- **`globsOverlap` reported every leading-wildcard glob as colliding with
  everything.** An empty fixed prefix meant "matches everywhere", because
  `x.startsWith("")` is true — so `*.md` vs `docs/**` failed `--strict` on two
  file sets that cannot intersect. Measured against `path.matchesGlob` rather
  than assumed: `*` does not cross `/`, `**` does. So `**/*.test.ts` vs `src/**`,
  also reported, is **correct** and still reports. Only the single-`*` case was
  wrong.
- **Check 4's plan count was digit-only**, so `copy.ts`'s "across five plans" was
  invisible to it. Correct today, which is exactly why it needed covering: an
  unguarded true statement is one edit from an unguarded false one.

Four tests added, each proven failable by reverting its fix and watching the
suite drop. Worth recording that the first two revert attempts silently no-opped
and the suite stayed green — a test that passes both ways proves nothing, and
the only way to know is to confirm the revert actually applied.

## 0.8.10 — 2026-09-02

**One of the two "same-wave dependency" defects was the validator's, not the
plan's.** Both were going to be logged as accepted. Reading them first showed
they are different failures, and only one is a failure of a plan.

- **A task's wave now comes from the `### Wave` heading it sits under, with the
  id as fallback.** The format contract says ids NEVER change once assigned
  while a wave assignment may move, so the two are allowed to diverge and the
  heading is the one that says where a task runs. Plan 001 is exactly that case:
  deviation 44 moved integration into a new `### Wave 2.4 — Integration` and
  kept the id `T2.3.1`, citing the rule. Deriving the wave from the id put
  T2.3.1 back beside the repair task `T2.3.2` it depends on and reported a
  same-wave dependency **the document does not contain** — the dependency points
  from wave 2.4 to wave 2.3, which is correct. The plan followed the contract;
  the parser did not implement it. Ownership disjointness follows the heading
  too, so a moved task no longer collides with the wave it left.
- Plan 004's is real and stays reported: `T2.1.2` depends on `T2.1.1` and both
  sit under one `### Wave 2.1` heading. It is **logged as an accepted deviation
  (15) in the plan** rather than repaired — the tasks ran in the order the
  dependency states, both criteria passed, and editing a closed record to
  satisfy a validator written afterwards would make the plan describe an
  execution that did not happen. It is the shape `execution: solo` was invented
  for in v0.8.0, so it stays a permanent `--strict` failure on that one line, as
  the record of why the key exists.

Three tests, including the one that matters: two tasks left under a single
heading must still report, so the fix cannot blanket-excuse the defect.

## 0.8.9 — 2026-09-02

**The A3 compliance figure was published two different ways, and the gate built
to stop that could not see it.** Appending plan 005 moved the ledger's table and
its "Final total" line to **28 of 29 gates across 5 plans**. The Status section
three screens below kept saying **27 of 28 across 4** — three times, including
in the sentence that names *"the honest claim"* — and `compatibility.md`'s
release-criteria bullet repeated the stale pair while the site published the new
one. Three surfaces, two numbers, every check green.

Green because checks 1–3 of `assert-matrix.mjs` compare a document against
*another* document: a row against the verification log, a plan's logged skips
against the ledger. Nothing compared a document against **itself**, which is
where this drifted. That is the same failure this script's own header describes
— "the record of what is proven stopped tracking what was proven" — recurring
one layer up, in the file named as the source of truth.

- **The ledger's table is now the arithmetic and the prose is derived from it.**
  Check 4 sums the rows (29 waves, 28 invoked, 27 unprompted, 1 skipped) and
  compares every `N of M` stated anywhere in `a3-gate-compliance.md`,
  `compatibility.md` and `site/content/copy.ts`, plus every restated plan count.
  Figures are classified by the words around each one, not per line — a single
  sentence states two different totals, and classifying by line gave both the
  first keyword it found.
- **Proven failable on all five drift shapes**, each reintroduced and caught:
  the boundary figure, the bare `27/28`, the plan count, the recorded figure,
  and the unprompted figure.
- **The stale prose is corrected, and its argument is not.** The Status section
  still concludes PUBLISHED-not-PASSED; what changed is that the reason is now
  stated accurately. The sample reached 5 against a bar of 5–10 — on its least
  independent instance, since one session planned, executed and audited plan
  005. So the count moved and the bar was not cleared, and **the half that is
  missing is independence, not sample size**. Saying "still short of 5" would
  have been false; calling 5 a pass would have contradicted the argument this
  ledger has made since it opened.

A note on the first version of check 4: the bare `27/28` in *"That makes 27/28 an
upper bound on compliance"* carries no keyword, fell through to a weak "is this
one of the legitimate pairs" branch, and passed — 27/28 is legitimate, just not
for that claim. The ceiling was landing on one of the three lines that actually
drifted, so it was tightened rather than documented.

## 0.8.8 — 2026-09-02

**Three checks in `validate-plan` asserted more than they tested.** Each one
read as a guarantee and was satisfiable by a plan that violated it. Found by
running the validator against synthetic plans built to break it, which is not
something the corpus in this repo would ever have surfaced.

- **Same-wave ownership compared glob STRINGS, not the file sets they
  describe.** Only a byte-identical duplicate collided, so `site/**` in one task
  and `site/content/copy.ts` in a sibling passed `--strict` clean — while both
  tasks could write the same file. That is the exact defect class the plugin
  exists to prevent, missed by the check whose own message says it cannot
  happen, and it is worse downstream: `wave-start` unions a wave's globs into
  one boundary, so the hook permits both writes and only the post-hoc audit can
  catch it — and only if the two tasks happen to touch the same file. Overlap is
  now computed: a literal path against a glob via `matchesGlob`, glob against
  glob by fixed directory prefix. Deliberately biased toward reporting; a false
  overlap costs one line in a plan review, a missed one costs two agents writing
  the same file. Ceiling stated in a `ponytail:` comment — this is prefix
  comparison, not set intersection, and shapes like `src/*.ts` vs `src/a*` are
  out of its reach.
- **Testing Gate fields were counted across the whole section.** A case needed
  the word `evidence` to appear as often as there were cases — so one
  well-formed case writing each field twice paid for a second case declaring
  nothing at all, and `--strict` passed it. Fields are now required **per case
  block**. This also settles a message that had been wrong since it was written:
  it always said "all seven fields" while the list held five. The missing two
  are `id` and `title`, both carried by the case heading, and the error now says
  so instead of naming a number nothing checked.
- **The `video` check rejected plans for refusing video.** `video` is
  uncapturable through the supported driver (A5), so a case declaring it fails
  its evidence clause on every run — plan 004's only NO-GO, still caught. But
  the test was a bare word scan over the section, so
  `evidence: screenshot only (no video — the driver cannot capture it)` was
  reported as *declaring* video. Its sibling `rival`-driver check already
  carried a negation guard for precisely this, because writing what a thing is
  NOT is how this corpus documents a constraint; the `video` check never got
  one. Now scoped to evidence declarations and negation-aware within them, and
  the error quotes the offending line.

No plan in the corpus changes verdict: 001–004 fail on exactly what they failed
on before, 005 still passes, and plan 004's TG4 is still the NO-GO it was
written to be. Eleven tests added, each one failing against the old check.

## 0.8.7 — 2026-09-01

**A closed wave's verdict could not be re-derived, and the tool blamed the wrong
cause for it.** `.drydock/` is gitignored — correctly, since Testing Gate
evidence is binary and committing it to history is permanent — so a wave's
receipts do not survive a clean. Plan 005 read `status: RECONCILED` behind a
PASS report; re-running its own gate afterwards gave **FAIL (7)**: six tasks
"unattributed" and an `enforcement: required` breach, entirely because the
artifacts were gone.

Worse than the failure was the explanation. The three-way diagnosis added in
0.8.4 has no branch for *"the evidence was discarded after the wave closed"*, so
it picked the nearest one and stated, of a wave whose own report records the
hook **denying a write**, that *"the hook never ran here"*. A diagnosis that
cannot say "I do not know" will confidently say something false instead.

Nothing needed building. Wavecheck already pastes the audit's evidence table
into the plan, and the plan is committed — the task→commit lookup that
`attribution.jsonl` held is in git, beside the code it describes.

- **Attribution is recovered from the sealed wavecheck report** when the live
  manifest is gone. Plan 005 re-audits **PASS** again.
- **That recovery is not a rubber stamp, and the distinction is the whole
  point.** The report supplies only the *lookup*; every file set is still
  re-derived with `git show` and re-compared against the plan's `owns`. A sealed
  row naming a commit that broke its boundary still FAILs — there is a test that
  fails if it ever stops doing so. Stated ceiling: the report is hand-editable
  where the manifest is tool-written.
- **The enforcement receipt is treated as strictly weaker, because it is.** A
  count in a document is a **record** that the hook ran, never a **receipt** of
  it: the hook wrote the log, a human wrote the report. So this is a note, not a
  pass — and not an error either, since the claim was met while it was checkable
  and no re-run can ever restore the file. Failing a wave forever over a deleted
  temp file would make `enforcement: required` mean "audited within one session".
- **An unsealed wave with no log still gets the original three-way diagnosis.**
  Recovery is not an escape hatch for a wave that was never gated.

If you want the strong claim rather than the on-record one, re-run the gate
before `.drydock/` is cleaned. That is now the only difference between them.

## 0.8.6 — 2026-09-01

**The plugin being run and the plugin in the repo were four releases apart, and
nothing said so.** The host loads skills from the installed plugin
(`~/.claude/plugins/cache/…/<version>/`), never from a working tree. On
2026-09-01 that install was **0.7.0, pinned at `d7de845` since 2026-08-22**,
while the repo was at 0.8.4 — so every 0.8.x change had been exercised by no
session at all, and plan 005 was executed by skills with no notion of the
`lane` and `execution` keys it declares.

It was not a cosmetic gap. Run against plan 005, the two copies **disagree about
the plan**: 0.7.0 does not know `execution: solo`, so it reports four same-wave
dependency errors and FAILS a plan 0.8.x correctly PASSES. Two verdicts, both
looking authoritative, opposite conclusions, and no line of output anywhere
naming the cause.

- **Every verdict now carries the version and path that produced it.**
  `validate-plan` and `audit-wave` print `drydock-audit.mjs vX.Y.Z — <path>`
  above the verdict, on FAIL as well as PASS. A wavecheck report pastes that
  output verbatim, so which program judged the wave travels with the judgment
  instead of depending on whoever remembers what they had installed.
- **A mismatch is stated outright.** When the running script is not the
  installed copy and the versions differ, the output says `VERSION DRIFT`, names
  both, and gives the reconciling command. A normal install runs this script
  from the cache — its own path *is* the install path — so it prints one quiet
  provenance line and nothing more. The warning only fires where the hazard is
  real.
- Best-effort throughout, and silent on every failure: no install record, a host
  keeping config elsewhere, unreadable JSON. Bookkeeping must never change a
  verdict — the same posture as the enforcement hook's receipt writer.

**Known ceiling, stated because the check looks stronger than it is:** it
compares **versions**. Editing the plugin without bumping produces two different
programs reporting the same version, and this is blind to it. That is an
argument for the release discipline, not for hashing the tree.

## 0.8.5 — 2026-09-01

**`${CLAUDE_PLUGIN_ROOT}` is substituted by the host, and only where the host
loads the text itself.** Measured this release: invoking `drydock:wavecheck`
returns its `audit-wave` line with a real absolute path already in it, so every
command a skill hands you runs as given. The host substitutes nothing in a file
read from disk, and `$CLAUDE_PLUGIN_ROOT` is **empty** in the shell — so the
placeholder is correct in a skill body, an agent definition and `hooks.json`,
and is a live defect anywhere else.

It was live in exactly one place. `plan-format.md` — a reference file, read as
data, byte for byte — printed `node ${CLAUDE_PLUGIN_ROOT}/scripts/drydock-audit.mjs
wave-start` in a fenced block. Copied out, that runs `node /scripts/…` and dies
`MODULE_NOT_FOUND`. It was invisible because it looked like every other command
in the corpus and the three other mentions in the same file already wrote the
script bare.

- **The reference file now names the script bare**, as it already did in three
  other places, and says once where the runnable path comes from.
- **`drydock/README.md` writes `$DD/scripts/…`** and defines it, instead of a
  relative `scripts/…` that resolves for nobody, and `$DD/hooks/…` for the hook
  self-check instead of a repo-only `drydock/hooks/…` path.
- **A test enforces the rule** rather than the convention being remembered:
  `drydock-audit.test.mjs` walks the plugin and fails if the placeholder appears
  inside a fenced block in any file the host does not substitute. Scoped to
  fences on purpose — the prose explaining the mechanism has to be able to name
  it. Proven failable: reintroducing the old line drops the suite to 52/53.

**Not fixed here, and worth stating:** `agents/executor.md` uses the placeholder
for its `task-close` command. Agent definitions are loaded by the host the same
way skills are, so it is very likely substituted too — but that was not measured,
only reasoned, and the test allows `agents/` on that reasoning. It is the one
placeholder in the plugin whose expansion is assumed rather than observed.

## 0.8.4 — 2026-09-01

**"Enforcement can only BLOCK on its own absence"**
([#3](https://github.com/SandeepTakasi/drydock/issues/3)). It cannot, and the
reason it read that way is that nothing said the second layer existed. Ownership
has two, answering different questions:

- The hook **prevents** a write at the tool boundary. It sees `Write`/`Edit`, and
  is blind to Bash (`sed -i`, a heredoc, `>`) and to paths outside the project.
- `audit-wave` **detects** a violation from each task's commit and the working
  tree, and **never consults the hook**. It therefore catches precisely what the
  hook is blind to — after the fact rather than before.

So a wave with an empty log ran without *prevention*, not without *auditing*.
The issue's proposed fix — relocate ownership validation to a wave-close `git
diff` check — describes what `audit-wave` has done since v0.3.0; what was
missing was saying so.

- **An empty enforcement log is now diagnosed, not listed.** Three causes, and
  they are not the same finding: no log file at all (the hook never ran here —
  never armed, host does not register `PreToolUse`, or Node < 22), a log holding
  decisions for *other* waves (the hook is alive and this wave's writes went
  around it, which is what Bash does), and an empty log (armed, never invoked).
  The tool holds the evidence for all three, so it decides. The old message
  listed them and asked the reader to pick, ending "if that is what happened, say
  so" — prose-compliance of exactly the kind `wave-start` and `task-close` were
  built to delete.
- **The BLOCK now says what it is.** "Prevention did not run for this wave.
  Detection did — check 2 audited every task commit against its `owns`
  regardless — so read this as an unmet claim, not an unaudited wave."
- **Every audit states which layer verified ownership**, so a green gate can
  never be read as "the hook was watching" and an empty log can never be read as
  "nothing checked this".
- **`enforcement: required` is documented as a receipt check, not a coverage
  guarantee**, in both the plugin README and the format contract — the issue's
  second ask, and the honest framing.

Five new cases (52 total), each driving a real repo through the three log states.
Proven failable: flattening the diagnosis fails three.

**On the issue's evidence.** It reports 35 hook decisions with zero denies. That
is no longer true of this repo: plan 005's wave 1.0 recorded 13 decisions with
**one deny**, refusing an edit to the plan document while the wave was armed. The
mechanism has now been observed refusing real work, unprompted, in a session that
did not write it.

## 0.8.3 — 2026-09-01

**`plans_dir` defaulted to a path some repos forbid, and every plan then argued
its own case for living elsewhere**
([#6](https://github.com/SandeepTakasi/drydock/issues/6)). House rules against
committing tool or planning artifacts make `docs/plans/` uncommittable; the plan
went somewhere else and carried a hand-written paragraph justifying it. The
reasoning came out different in every plan, so a reader had to reconstruct why
the file sat where it sat. The defect is the improvisation, not the default.

- **`drydock-audit.mjs resolve-plans-dir [<preferred>]`** reports the directory,
  whether the repo will carry the file, and **one fixed sentence** for the plan
  to quote verbatim under its title. Same answer every time, generated rather
  than argued. planwright runs it instead of writing its own justification.
- **The fallback is `.drydock/plans/`, inside the repo but gitignored** — not an
  out-of-repo directory as the issue proposed. A repo that forbids *committing*
  an artifact has not forbidden *having* one, `.drydock/` is already where every
  execution artifact lives (`wave-owns.json`, `enforcement.log`,
  `attribution.jsonl`), and it keeps plan paths relative, which every other
  subcommand takes as an argument. An out-of-repo directory would also collide
  between two checkouts of the same repo. The cost is stated in the sentence
  itself: `git clean -xdf` removes it.
- **The ignore probe asks about a file, not the directory** — and this is the
  part that matters. A `docs/plans/` ignore pattern is directory-only, so
  `git check-ignore docs/plans` on a directory that does not exist yet reports
  **not ignored**: the first implementation would have passed happily in exactly
  the repos the feature exists for. Probing `docs/plans/000-probe.md` is also the
  real question — can a plan be committed here?

Five new cases (47 total), each driving a real repo whose `.gitignore` forbids
the plans directory. Proven failable: neutering the fallback fails three. The
directory-vs-file probe bug was found by those cases, not by review.

**Unexercised:** the planwright half is skill prose and session-cached. The
resolver is tested; the instruction to call it is not.

## 0.8.2 — 2026-09-01

**A gate froze its environment at planning time and then tested whatever
answered** ([#7](https://github.com/SandeepTakasi/drydock/issues/7)). Port,
route and driver were written when the plan was written, and each drifts. The
resulting failures describe the harness rather than the software — the most
expensive kind of red, because it looks like a defect. This is the rule
`planwright` already applies to evidence types, moved to the rest of the
environment and to the moment the truth is knowable.

- **`seatrial` preflight step 4 resolves the environment instead of trusting
  it.** The origin comes from the repo's own dev config, not the gate header —
  the config is the fact, the plan's port is a claim — and a disagreement is a
  HALT printing both rather than a silent preference for either.
- **A reachable URL is not evidence of the right app, and this is the failure
  worth naming.** Nothing in the old preflight could see it: a dev server left
  running from a **different checkout** answers on that port cheerfully, every
  case runs against software nobody is testing, and the sheet comes out full and
  confident. Preflight now asserts one thing that must be true of *this* build —
  the commit SHA if the app exposes it, otherwise a string the current source
  produces and the previous one does not. Cannot establish it, HALT: "it
  answered" is not identity.
- **New step 5: every route the cases name must exist**, checked before any case
  runs. A route the application does not have is a **plan defect and a HALT,
  never a FAIL** — reporting it as a failure blames the software for a slug the
  plan invented.
- **The driver is reconciled too.** What resolves at run time is the fact; a gate
  naming something else is a HALT, because the run would produce a different kind
  of evidence than the plan promised. That is how a case ends up substituting a
  DOM transcript for the screenshot its `expected` clause asked for.
- **`validate-plan --strict` catches the driver mismatch at plan time**, the same
  shape as the existing `video` rule one field over. Guarded on the gate not also
  naming Playwright, so "Playwright MCP (not Puppeteer)" — the way this repo
  habitually writes what a thing is *not* — does not trip it.
- **The verdict sheet's Environment row records provenance**, not just values: a
  base URL with no provenance is indistinguishable from a guess that happened to
  answer. Plus an `Identity:` line stating what was asserted and its result.

Three new cases (42 total). Proven failable: neutering the driver check fails
one, and both guard cases hold.

**Unexercised, and stated rather than implied:** the `seatrial` and `planwright`
changes are skill prose, which is session-cached. The validator half is tested;
the preflight half is not, and cannot be from the session that wrote it. It
stays unproven until a later session runs a Testing Gate.

## 0.8.1 — 2026-09-01

**`plan-status` and `reconcile` disagreed about what a closed plan is**
([#9](https://github.com/SandeepTakasi/drydock/issues/9)). `reconcile` refuses to
close a plan whose human phase gate is unsigned; `plan-status` insisted that same
plan should already read `DONE`. Found by plan 005 tripping over it (deviation
4) — a defect 0.7.3 introduced and 0.8.0's own execution then walked into.

- **An unsigned human phase gate is now a legitimate reason to read
  `EXECUTING`.** The derivation equated *every wave has a PASS report* with *the
  plan is finished*; a plan waiting on a signature is neither. For the whole
  window between the last wave passing and the human signing, `validate-plan`
  used to FAIL a correctly-stated plan — and the pressure that creates is to set
  `DONE` to make the tool green, which records a sign-off nobody gave. That is
  the exact over-claim `reconcile`'s human-gate refusal exists to prevent.
- **The rule only ever WIDENS what a status may say; it never adds a failure.**
  Deliberate, and load-bearing: plans 001–003 declare human approval in prose
  that predates the frozen `CLOSED, approved by <name> — <date>` form, and 004's
  phase 1 uses an older closed form, so a narrowing rule would have retroactively
  failed all four. All five plans in the repo report PASS before and after.
- **A phase gate is read as a block, not a line.** Plan 005 declared "plus human
  sign-off" three lines below the `**Phase gate:**` marker and plan 001's "human
  approval" sits on the second — a single-line test misses the very thing it is
  looking for.
- **`--write` still refuses to close such a plan**, unchanged: `DONE` and
  `RECONCILED` remain the tool's to decline and `reconcile`'s to decide.

Six new cases (39 total). Proven failable: neutering the gate check fails three.
The strongest evidence is not a fixture — the commit that originally exhibited
the bug (`a57ed19~1`, plan 005 before its signature) now reports PASS with the
reason naming the unsigned gate.

## 0.8.0 — 2026-09-01

**Two field reports, one cause: the plan format assumed a fleet of parallel
executors, and solo or sequential runs paid for machinery they never used.**
Minor bump rather than patch — the plan format gains two keys
([#4](https://github.com/SandeepTakasi/drydock/issues/4),
[#1](https://github.com/SandeepTakasi/drydock/issues/1)).

- **`lane: small | full`, default `full`.** The small lane is one phase, one
  wave, one gate, no `Wave x.R` quality review and no pressure test. What scales
  with *risk* stays — ownership, acceptance criteria, both logs, the Testing
  Gate; only what scales with *cost* goes. `validate-plan` holds a `lane: small`
  plan to one implementation wave and no review wave, so the key is a commitment
  rather than a label. Escalate to `full` for genuine concurrency, not for size
  alone: the report that prompted this measured ~20 five-check gates for one
  feature with no parallel critical path.
- **`execution: solo | fleet`, default `fleet`.** Solo says the orchestrating
  session runs the tasks itself. Every plan executed under a standing no-agents
  rule used to open with the same Deviation 1 — *"tasks executed in-session by
  the orchestrator"* — because the plan asserted a fleet and then caveated it,
  every wave. It is now a header fact stated once. `solo` relaxes no gate, no
  ownership boundary and no acceptance criterion.
- **The same-wave dependency rule is now fleet-only, and that is the
  load-bearing change.** It exists because *simultaneous* tasks cannot depend on
  each other; solo runs a wave in sequence, so a same-wave dependency is
  execution order rather than a contradiction. A dependency on a *later* wave
  stays an error in both modes — that one is impossible however tasks are run.
  Plans 001–004 omit the key, default to `fleet`, and 001 and 004 still FAIL on
  exactly the same-wave dependency `docs/plans/README.md` documents.
- **The RED/implementation wave split is gone, and it was never actually
  stated.** Two lines ordered a test task before an implementation task *within*
  a wave — precisely the same-wave dependency the validator rejects — which left
  wave-splitting as the only valid reading, turning every parallel wave into a
  sequential pair. The failing test and the code that satisfies it now belong in
  one task, or two sequential tasks under `solo`. A wave boundary is a
  synchronisation point with a five-check gate attached; red/green does not need
  one.
- **The practices interview asks whether executors will actually be spawned** —
  a yes/no about intent. The nearest existing question asked how many concurrent
  subagents the user could orchestrate, which is capacity, so a plan could
  assume a fleet it was never going to get.

Nine new cases (33 total). Proven failable: neutering the solo exemption fails
two of them.

**Dogfooded.** Plan 005 is itself `lane: small`, `execution: solo` — one wave,
seven tasks, one gate — and it did not pass `validate-plan` until its own
T1.0.2 landed. That was the task's acceptance criterion: *this plan validates,
and 001 still does not.*

## 0.7.3 — 2026-09-01

**A plan had five surfaces claiming to hold its state and maintained two of
them.** Frontmatter `status:`, per-task `Status:`, the Progress log, the
wavecheck reports, the Deviation Log — and in the field every executed plan sat
at `EXECUTING` forever while per-task `Status:` was wrong in 40 of 40 cases. A
reader who trusted the first three was misled, and closure never happened
because nothing forced it. Only one of the five is written by a *gate* rather
than by whoever remembered: the wavecheck reports. So they become the ground
truth and the rest is derived or deleted
([#5](https://github.com/SandeepTakasi/drydock/issues/5)).

- **`drydock-audit.mjs plan-status [--write] <plan>` derives the status from the
  plan's own wavecheck reports.** A wave's LAST verdict stands, so a BLOCK
  re-audited to PASS closes correctly; review waves (`x.R`) are excluded, as
  they are in the A3 ledger. `validate-plan` now FAILs on a status the reports
  contradict and `audit-wave` notes one at the wave boundary — so a plan cannot
  quietly sit at `EXECUTING` after its last wave passed, or claim `DONE` over a
  `BLOCK`. Run against this repo's four plans, all four derive to exactly the
  status they already carried.
- **`--write` sets only what the reports prove, and `DONE` vs `RECONCILED` is
  not one of those things.** Closing a plan is `drydock:reconcile`'s call; an
  automatic `DONE` would overwrite a `RECONCILED` that reconcile earned. Note
  the two questions are kept apart deliberately: what a status may legitimately
  *say* is permissive, because a plan can sit at `BLOCKED` for a reason no
  wavecheck reports — plan 004 was BLOCKED on an open question with every wave
  green — while what `--write` may *set* is a single unambiguous value or
  nothing.
- **The per-task `Status:` field is deleted from the plan format.** Nothing ever
  maintained it: every mechanism that knows a task finished — the wavecheck
  report, the Progress log, the checkpoint commit — writes somewhere else. A
  field that is always stale is worse than an absent one, because it reads like
  state. Plans 001–004 keep theirs; execution history is not a draft.
- **`wavecheck` runs `plan-status --write` as part of its verdict step**, rather
  than being told in prose to remember. Same reasoning as `wave-start` in 0.7.0
  and `task-close` in 0.7.2: state a model has to remember to write is state
  that will not be written.

Inherited limit, stated rather than discovered later: this derives status from
report headings, so it shares the ceiling `docs/a3-gate-compliance.md` already
documents — a retroactively written report is an ordinary heading, so it can
tell you a wave has **no** report and never that a gate was **skipped** at its
boundary. Status is what it answers; gate compliance is not.

Eleven new cases. Proven failable: neutering the check fails six of them.

## 0.7.2 — 2026-09-01

**A repo's own commit policy could make Drydock unusable, and the part doing the
damage was carrying no weight.** Attribution found a task's work by matching the
commit subject `drydock(<task-id>): …` — but the ownership check is
`git show --name-only` against the task's `owns`, so the subject was a lookup
key and nothing more. It was also the only part of the contract a host
repository's rules could reject, and rejecting it BLOCKed every wave, with no
way out but a hand-written attribution table and a human escalation each time.

- **`attribution: commit-prefix | manifest` in the plan header**
  ([#2](https://github.com/SandeepTakasi/drydock/issues/2)). Under `manifest`,
  wavecheck reads `.drydock/attribution.jsonl` instead of the commit subject, so
  the subject follows the host repo's own convention and Drydock stops arguing
  with it. **The default is `commit-prefix`, not `manifest`** as the issue
  proposed: defaulting the other way would retroactively break plans 001–004,
  including the `audit-wave 004 2.0` invocation `docs/plans/README.md` documents
  as a live fixture. planwright writes `manifest` on new plans — the same shape
  as `enforcement: required` in 0.7.0.
- **`drydock-audit.mjs task-close <plan> <task-id>` writes the manifest, and the
  executor never does.** The entry is derived from `HEAD` — sha and file list
  come from the commit itself, so the manifest cannot disagree with what it
  names. A manifest an executor types by hand would be the same
  prose-compliance that `wave-start` deleted in 0.7.0, where the hook was armed
  only if somebody remembered to arm it. `task-close` also warns immediately
  when the commit holds a file outside the task's `owns`, at the point it is
  still cheap to fix rather than at the wave gate.
- **Two entries for one task is ambiguity, not last-wins**, reported exactly as
  two commits sharing a subject already were. And a manifest can name a sha that
  history has since dropped — amend, rebase, drop — which the commit-prefix path
  cannot do, because it reads the log it matches against. An unreachable sha is
  an error naming it, never a silent skip.
- **The ownership check did not move.** Same `git show --name-only`, same stray
  computation, same cross-task collision detection, same table. The mode decides
  only how a task's commits are *found*. **Neither mode removes the per-task
  commit**: attributing from a combined working-tree diff cannot tell which task
  touched a file — the defect the 2026-08-18 dry-run found, and the reason
  per-task commits became mandatory in v0.3.0. `manifest` replaces the subject
  convention, not the commit.
- **`validate-plan` rejects an unknown `attribution:` value** rather than
  falling through to the default, and rejects `manifest` on `format_version: 2`
  where the key does not exist. A typo that silently keeps the old behaviour is
  the failure shape 0.7.1 had just finished paying for.

Worktree mode is untouched: it attributes from per-worktree
`git diff --name-only` and never parsed the subject, so `attribution:` does not
apply there and `executor-isolated` now says so.

Nine new cases in `drydock/scripts/drydock-audit.test.mjs`, each driving a real
throwaway git repo through the CLI. Proven failable: forcing the mode back to
`commit-prefix` fails five of them, including the headline case where a commit
subject like `fix(parser): …` is attributed through the manifest.

## 0.7.1 — 2026-09-01

One parser bug, and the reason it survived four plans: **a truncated ownership
list raises no error anywhere.** It looks exactly like a shorter list.

- **Multi-line `Files owned:` lists no longer parse truncated**
  ([#8](https://github.com/SandeepTakasi/drydock/issues/8)). `parsePlan` read
  only the bullet's first line, so a wrapped list lost every path below it. In
  this repo's own plan 001, `T1.0.1` parsed **2 of its 14 owned files** —
  `wave-start` would have armed the hook against 2 files and denied the task
  writes to the other 12, and `audit-wave` would have reported 11 phantom
  violations on a commit that was entirely compliant (`3ef082d`). Two more tasks
  were truncated the same way. The fix consumes indented continuation lines
  until a blank line, a new bullet or a heading closes the block, covering both
  shapes the corpus uses — a wrapped comma list and a nested sub-list.
- **`validate-plan --strict` now reports a block it could not fully read.** The
  same `Files owned:` block is also read loosely — every line up to the next
  labelled bullet, indentation ignored — and a count mismatch is an error naming
  how many files the boundary would be short by. This is the part that matters
  more than the fix: the failure mode here was silence, so the guard has to be a
  check that a *future* unreadable shape trips, not a wider regex. A read-only
  task (`Files owned: — (read-only)`) legitimately parses zero paths and does
  not trip it.
- **`drydock/scripts/drydock-audit.test.mjs`** — four cases, no framework,
  asserting through the real CLI. Proven failable: reverting the parse makes the
  first case fail, and the old code reports `PASS` on a plan with a genuine
  same-wave ownership collision hiding on a continuation line.

No behaviour change to `seatrial`, `reconcile` or `replan`, and no plan in
`docs/plans/` changed status: 002 and 003 still PASS, 001 and 004 still FAIL on
exactly their one documented same-wave dependency.

## 0.7.0 — 2026-08-22

**0.6.0 shipped a claim its mechanism did not fully support.** An external review
of the released state found three ways ownership enforcement could silently not
happen, all the same shape — nothing noticed. This release makes non-enforcement
detectable, which is the difference between a claim and a guarantee.

- **`wave-start` generates the ownership boundary from the plan.** Nothing
  created `.drydock/wave-owns.json` in 0.6.0; the only instruction to write it
  was a sentence in the format contract, so the hook was armed only if a model
  remembered to arm it — the same prose-compliance the hook exists to replace,
  and this repo's own A3 row records an orchestrator forgetting a gate. Deriving
  the config from the plan also deletes a second defect rather than checking for
  it: a hand-typed `{"owns":["**"]}` enforced nothing while looking exactly like
  enforcement, and a derived boundary cannot exceed its plan.
- **The hook leaves a receipt, and the audit demands it.** Every decision, allow
  and deny alike, is appended to `.drydock/enforcement.log`. `audit-wave` now
  answers *did enforcement actually run for this wave* rather than *was a config
  present* — a question a hook that never executed also satisfies. A hook that
  was never armed, never registered by the host, or that bailed on an old Node
  all leave the same trace: nothing. It also compares the enforced boundary
  against the plan's, catching a stale or hand-widened config.
- **Node < 22 no longer fails open silently.** The hook imported `matchesGlob`
  as a *named* export, so on older Node it was a parse-time SyntaxError — exit 1,
  not exit 2, therefore not a deny. Writes proceeded with an error on every edit.
  A named import cannot be guarded, which is precisely why this shipped
  undetected; it is now a default import with a capability check that exits 0
  with one clear message. Still fail-open, deliberately — wedging every edit in
  someone's repo over a runtime version is worse — but the missing receipt now
  makes it visible to the audit.
- **Plan format v3**: optional `enforcement: required | none`, default `none`.
  wavecheck BLOCKs an unenforced wave only when the plan claims enforcement, so
  plans 001–004 audit exactly as before. v2 and v3 are both supported; the bump
  retires nothing. planwright writes `required` on new plans.
- **`docs/plans/README.md`** explains why two of the four reference plans FAIL
  `validate-plan`. They are real defects the validator found on its first run,
  missed by three layers of review, and they stay unedited because execution
  history is not a draft. Without that page a new reader reasonably concludes the
  tool is broken, when it is the tool's best demonstration.
- **A worked wave lifecycle in the plugin README** — arm, run, audit, close. The
  mechanism was described twice and never shown.
- Hook self-check is now 12 cases, adding the receipt on both paths and the
  old-Node fail-open. The latter needed `spawnSync`: the case is expected to
  succeed, and `execFileSync` only surfaces stderr on failure, so the assertion
  would have been blind exactly when the behaviour was correct.

A6 does not move. It still needs a session that did not write the hook to watch
it deny a real edit, and the site literals that force its caveat stay required.

## 0.6.0 — 2026-08-21

The first release that ships **code**. Every prior version enforced its contract
with prose, and the field record showed prose not holding: plan 004 logged an
ownership breach whose stated cause was that the work ran inline, where no
instruction binds, and a wave gate that was skipped because "continue" read as
authorisation. v0.5.1 answered both with four more refusals. This release
answers them with three programs, and states what they cannot do.

**Implemented directly rather than as a plan 005** — by this plugin's own new
size guidance the change sits in the short-form band, and dogfooding a plan whose
subject is enforcement would have cost more than it taught. Logged here because
the alternative was to not say it.

- **Ownership is enforced by a `PreToolUse` hook** (`hooks/enforce-owns.mjs`).
  Reads `.drydock/wave-owns.json`, denies any Write/Edit/NotebookEdit to a path
  no task in the active wave owns. Wave-level, because hook input exposes no
  subagent identity and a wave runs N executors at once. **Inert when the file is
  absent** — the normal state of a repo, and the escape hatch that makes `deny`
  safe. **Fails closed when the file is present but unparseable**, because a
  broken enforcement control must not become no enforcement. **Ceilings: Bash
  writes bypass file-tool hooks entirely**, and paths outside the project
  directory are not enforced. `hooks/enforce-owns.test.mjs` covers ten cases,
  including both Windows path separators.
- **`scripts/drydock-audit.mjs`**, two subcommands, no dependencies.
  `validate-plan [--strict]` gives planwright's own output the runnable criterion
  it demands of every task it writes. `audit-wave` computes wavecheck's ownership
  audit from per-task commits and **prints the SHAs and file lists it derived** —
  never a bare verdict, because a wrong script is more dangerous than a wrong
  model when it looks authoritative. Lenient by default so it does not red-flag
  plans written before it existed; `--strict` for newly authored plans.
- **Found on its first run, in this repo's own plans:** two plans place a task in
  the same wave as a task it depends on, so those waves cannot run in parallel as
  declared (001 T2.3.1→T2.3.2, 004 T2.1.2→T2.1.1). Neither was caught by a
  wavecheck, a quality review, or an adversarial pressure test.
- **Found by the audit and worth a contract fix later:** the checkpoint subject
  `drydock(<task-id>): …` carries no plan id, and task ids repeat across plans —
  `drydock(T2.0.1)` matches a commit in two different plans here. `audit-wave`
  scopes its search to the plan's recorded Baseline SHA and says so when a plan
  records none.
- **planwright right-sizes its own ceremony.** Under ~5 files it advises against
  planning at all rather than refusing; ~5–15 takes a short form with no pressure
  test and no phase review; over ~15 is the full workflow. Thresholds are marked
  assumed, not measured.
- **planwright will not declare `video` evidence**, now checked mechanically in
  `--strict` rather than only asked for in prose (v0.5.1).
- **The orchestrator writes and deletes `.drydock/wave-owns.json`** around each
  wave; the format contract carries the shape and the warning that a stale file
  blocks the next unrelated edit.
- **Honesty matrix drift now fails a gate.** `site/scripts/assert-matrix.mjs`
  joins `npm run verify`: a PENDING row may not have evidence in the verification
  log, a row citing the log must have it, and a plan logging a skipped gate must
  be accounted for in the A3 ledger. Written before the fix and **observed failing
  on three real drifts**, then made green: A5 moved PENDING → OBSERVED, and A3
  moved 22/22 across 3 plans → 27/28 across 4, with the skip stated.
- **First cost figure published** — [docs/cost-001.md](../docs/cost-001.md).
  Includes the number it could not capture (token spend was never instrumented)
  and says so, because the economy claim is otherwise unevidenced.

## 0.5.1 — 2026-08-21

Guardrails harvested from plan 004's own execution. Every item here is a
refusal or a check that plan wanted and did not have — applied from
[its reconcile report](../docs/plans/004-seatrial-e2e-gate.md), which proposed
them rather than applying them itself.

- **`reconcile` refuses to close a plan whose human phase gate is unsigned.**
  Previously its ladder read the verdict sheet and wave-PASS status only, so a
  plan with all waves PASS and a properly attributed `GO-WITH-OVERRIDES` sheet
  would close with nobody having signed the phase gate. Plan 004 reached exactly
  that state; only the orchestrating session holding back by hand stopped it.
- **The format contract freezes how a closed phase gate is recorded** —
  `**Phase gate: CLOSED, approved by <name> — <date>.**` — so the refusal above
  has something unambiguous to read, and no skill infers a human's approval from
  surrounding prose.
- **`planwright` will not declare an evidence type the driver cannot capture.**
  Confirm the capability in the authoring session; default to `screenshot` or
  `network assertion` otherwise. `video` is a per-`BrowserContext` setting fixed
  at creation, so a Playwright MCP server started without video saving cannot
  produce it by any call — plan 004's only NO-GO came from a case declaring it
  on paper, a red that described the harness rather than the software.
- **`planwright`'s self-review checklist now requires every acceptance criterion
  to have been RUN before its task block is frozen** — both that it can fail and
  that it can *pass*. Three criteria in plan 004 broke this way: one unpassable
  whatever the repo state, one already satisfied before its task began, one
  grepping a heading level the target file never uses.
- **The orchestrator contract states what survives when executors cannot be
  spawned**: log it as a deviation before the wave opens, stage only owned files
  by hand, and tell wavecheck the diff is self-authored. Inline execution caused
  four of plan 004's fourteen deviations, including its one real ownership
  breach.

No behaviour changes to `seatrial`, `wavecheck` or `replan`.

## 0.5.0 — 2026-08-20

Adds a browser-based E2E verification gate. Planned with planwright and executed
under its own gates ([plan 004](../docs/plans/004-seatrial-e2e-gate.md)), which
is also where every defect below was caught.

- **Plan format: new required section `## Testing Gate` at position 11.**
  Written end-to-end cases, authored at plan time, each with an id, title,
  preconditions, Given/When/Then steps, an expected result, exactly one declared
  evidence type (`screenshot` | `video` | `network assertion`) and a severity
  (`blocker` | `major` | `minor`). The gate rule is prose: any blocker FAIL is
  NO-GO, a major FAIL needs a recorded human override naming case, reason and
  decider, a minor FAIL is recorded only, and a case that **cannot** be run is
  neither a pass nor a skip but a HALT. Plans with no user-facing surface write
  `N/A — <reason>`; a bare "N/A" is not valid.
- **No `format_version` bump, deliberately.** The rule this project set itself
  says a new required section forces one — but the section is N/A-able, and
  bumping to 3 would make every consumer refuse plans 001–003, which are v2, in
  exchange for nothing a reader gains. Consumers keep accepting v2.
- **New skill `seatrial`.** Executes the gate through Playwright MCP, captures
  the declared evidence per case under `.drydock/testing/<plan-id>/<case-id>/`,
  generates re-runnable `.spec.ts` files, and writes the go/no-go sheet at
  `.drydock/testing/<plan-id>/verdict.md`. Model-invocable, like wavecheck,
  because plans name it as a gate.
  - **It halts rather than degrades.** MCP absent → stop with install
    instructions, and explicitly no fallback to raw CDP, `curl`, `fetch` or a
    headless screenshot flag: those answer a different question than "does this
    work in a browser". Gate stale against the baseline SHA → stop. Step not
    performable as written → FAIL with reason `step not executable`, plus a HALT
    when it reads as a plan defect rather than an app defect. False precondition
    → HALT for that case, not FAIL, because recording it as failed blames the app
    for the harness.
  - **A subset run writes no sheet.** There is no partial verdict: reconcile
    branches on exactly missing / NO-GO / GO-WITH-OVERRIDES / GO, so a fourth
    value would leave it with no rule and a plan could close on a run that
    verified part of it. This shipped wrong first — an earlier draft returned
    `PARTIAL`, wavecheck BLOCKed the wave for it, and the fix narrowed the skill
    rather than widening the contract.
  - Unrun generated specs are labelled `GENERATED, NOT EXECUTED`. No dependency
    is ever added unasked.
- **reconcile refuses to close an unverified plan.** If the plan declares a
  Testing Gate that is not `N/A`, reconcile reads the frozen verdict path and
  refuses when it is missing or NO-GO; `GO-WITH-OVERRIDES` proceeds only when
  every failed major case carries an override naming its decider. Same shape as
  the existing "any wave lacks a PASS" refusal. Reconcile does not run the gate:
  it is a closer, not a verifier.
- **planwright interviews for it, and its checklist enforces it.** Step 1 asks
  for base URL plus start command, auth approach, evidence retention and
  severities when a browser-drivable surface exists; step 6 writes the section;
  the self-review checklist fails an absent section on a UI-touching plan or a
  bare "N/A", and requires at least one designed-to-fail case — a gate nobody has
  watched fail is not known to work.
- **Two stale section citations corrected**, and both told to locate their
  section by name rather than by ordinal: wavecheck 14 → 15, reconcile 16 → 17.
  Release 0.4.0 already fixed these once; counting is the defect, not the count.
- **`plugin.json`** gains `e2e_dir` (default `e2e`), following the `plans_dir`
  shape. It does **not** gain a configurable evidence root: an earlier draft did,
  and the phase's quality review rejected it, because the contract calls that root
  frozen so seatrial and reconcile cannot disagree about where a verdict lives. A
  relocatable root reintroduced exactly that drift — the draft skill had already
  split into two forms inside one file.

**Not verified, and not claimed to be.** The gate has never been executed. A new
compatibility row **A5 — Playwright MCP availability** is registered as PENDING:
the MCP was absent from the session that built this, so plan 004's Phase 2 is
BLOCKED on it rather than assuming it works. No screenshot, video or verdict
sheet has been produced by this release, and the row does not move without a
dated verification-log entry.

Deliberately NOT changed, having been considered and rejected:

- **A hook that blocks a wave until a verdict exists.** Every Drydock gate is
  prose that a human reads; a mechanical gate would be a different product.
- **Adding `@playwright/test` to this repo.** seatrial generates spec files and
  asks before touching any `package.json`. A generated suite nobody has run is
  not a re-runnable suite, and labelling it as one would be the over-claim the
  honesty rule forbids.
- **Giving wavecheck any Testing Gate duty.** It audits waves; the gate runs
  after the final wave.

## 0.4.1 — 2026-08-19

- **plan-format: worktree merge procedure gains step 2a.** A2b verified the
  procedure works, and found that its wording invited a false inference: step 2
  said conflicts indicate a defect, which reads as though conflict-freeness
  indicates compliance. It does not. A rogue edit conflicts only if a sibling
  touched the same file; a non-colliding unowned edit merges cleanly and lands
  silently — measured. Step 2a states the one-way implication, names the
  ownership audit as the only defence, and explains why step 1's ordering is
  load-bearing. Steps 1 and 3 annotated with the same run's evidence.
- No `format_version` bump: this adds no required section, field, or task-block
  shape, so no consumer would refuse an existing v2 plan. Bumping would force
  every skill to reject every existing plan over a wording fix.

## 0.4.0 — 2026-08-19

Field-driven fixes from the first full pilot plan (001-drydock-homepage: 2 phases,
16 waves, 14 wavecheck PASSes, 49 deviations). Each change below traces to an
observed failure, not to speculation.

- **executor / executor-isolated: checkpoint ordering is now a stated rule.**
  Seven executors across one plan finished verified work and lost its attribution
  by stopping before committing — turn exhaustion, a transient API error, a
  silent turn-end, a stalled stream. Raising `maxTurns` 30 → 60 did not help,
  because the ceiling was never the cause. The contract now says: commit the
  moment the owned files satisfy the criterion, before the completion report, and
  explains that finished-but-uncommitted work is indistinguishable from no work.
  Adds a rule for a presumed-dead executor that revives with a commit already
  present (two commits sharing a task-id subject destroyed attribution once).
- **wavecheck: corrected a stale section reference.** It instructed appending
  reports "under §8"; in a v2 plan §8 is *Open questions* and Wavecheck reports
  are position 14. Now references the section by name.
- **reconcile: same bug, same fix.** It said "append as §9"; §9 is *Out of scope /
  follow-ups* and the Reconcile report is position 16.
- **planwright: three new self-review checklist items**, each from a defect that
  reached execution — a Decision must be cited in its consuming task's brief to
  count as closed; contract rules must be written as complete rule bodies rather
  than deltas; and acceptance criteria must be provably failable, with gates for
  text-invisible defects verified by deliberately introducing the defect.

Deliberately NOT changed, having been considered and rejected:

- Widening `reconcile`'s `docs_targets` to reach plugin files. It is already
  user-configurable; the default excluding plugin paths is correct for the repos
  Drydock is installed into.
- Requiring a phase to own its shell/config files. Shell defects are discovered
  unpredictably; appended repair waves are the correct mechanism and worked four
  times under gate. Owning files a phase does not need to change would violate
  surgical scope.
- No `format_version` bump: the checklist additions are planwright-side
  validations, not new required fields in the plan format.

## 0.2.0 — 2026-08-18

- Merged the team's production planwright skill as the flagship (Wave-0 contracts, T0 baseline, context briefs, 4-tier rubric, escalation ladder, SHA staleness check, adversarial pressure-test, practices interview bank).
- Plan format contract v2: team template + Drydock execution contract unified (task IDs T<p>.<w>.<n>, statuses DRAFT/APPROVED/EXECUTING/BLOCKED/DONE/RECONCILED).
- Review split formalized: wavecheck = conformance audit (gate), Wave x.R = quality review (post-PASS); no retries on contract breaches.
- Added VERIFICATION.md pre-flight checklist and minimal worktree merge procedure.

## 0.1.0 — 2026-08-18

Initial internal release.

## 0.3.0 — 2026-08-18

- Dry-run-driven fix: per-task checkpoint commits mandatory in default mode; wavecheck attributes ownership per commit, BLOCKs when commits are missing; executor report gains checkpoint_commit field.
- VERIFICATION.md updated with dry-run evidence and A4 pass.

## 0.3.1 — 2026-08-18

- VERIFICATION.md graduated out of the plugin into repo docs/: evidence → docs/self-audit.md, runtime checklist → docs/compatibility.md. Installs stay lean; the repo keeps the story.
