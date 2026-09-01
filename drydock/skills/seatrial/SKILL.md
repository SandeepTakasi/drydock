---
name: seatrial
description: Execute a Drydock plan's Testing Gate — drive its written end-to-end cases against the running app through Playwright MCP, capture the declared evidence per case, generate re-runnable Playwright spec files, and emit a go/no-go verdict sheet fit for QA handoff. Invoke after the final wave passes wavecheck, or whenever the user asks to run the Testing Gate, run the E2E cases, or produce a go/no-go for a plan.
---

# Seatrial

A ship leaves the drydock and goes to sea under supervision before anyone trusts
it with cargo. That trial is what you run.

You execute what is written. You do not decide what should have been written, you
do not improve a case whose steps are awkward, and you do not find another way to
reach the same screen. A step you cannot perform exactly as written is a failure
with a reason — never a substitution. The value of this gate is that its cases
were fixed before the code existed; a verifier that adapts them at run time hands
back a result about the app it wished it were testing.

You are also not a code reviewer, not a bug finder, and not an auditor of the
plan. `drydock:wavecheck` audits conformance per wave; Wave x.R reviews quality;
you answer one question, once, at the end: **do the written cases still hold in a
real browser, and what is the evidence?**

Contract: `${CLAUDE_PLUGIN_ROOT}/skills/planwright/reference/plan-format.md`,
section *Testing Gate section*. The generated-spec directory comes from plugin
config `e2e_dir` (default `e2e`). The evidence root is **not** configurable: it is
the literal path the contract freezes, so this skill and `drydock:reconcile`
cannot drift apart about where a verdict lives.

## Inputs

- A plan path. A subset of case ids may be passed as a **diagnostic** while
  someone is iterating on a failure — and a subset run **writes no verdict sheet
  at all**. A gate run is every case in the section or it is a HALT.

  There is no partial verdict, deliberately. The gate rule already holds that a
  case which cannot be run is neither a pass nor a skip; a suite that was only
  partly run is the same shape of thing, and inventing a fourth summary value for
  it would leave `drydock:reconcile` — which branches on exactly missing, NO-GO,
  GO-WITH-OVERRIDES and GO — with no rule, so a plan could be closed on a run
  that verified some of it. Overwriting a real sheet with a partial one is worse
  still, which is why nothing is written.
- The running app. You do not start it, build it, migrate it, or seed it. If it
  is not up, that is a HALT, not a task.

## Preflight — every failure here is a HALT, never a skip

Run in order. On any failure, stop and ask. Do not proceed with the rest of the
suite "to get partial signal": a gate that degrades under pressure is worth
nothing at the moment it matters, and a half-run sheet reads to a later human
exactly like a full one.

1. **The gate exists.** The plan has a `## Testing Gate` section, its
   `format_version` is supported, and its status is `EXECUTING` or later. If the
   section reads `N/A — <reason>`, there is nothing to run: say so and stop, with
   no sheet written. An absent section on a plan that touches a UI is a planning
   defect — report it, do not invent cases.
2. **The gate is not stale.** `git diff <baseline SHA>..HEAD -- <paths the target
   is built from>`. Non-empty means the cases were written against a target that
   has since moved. HALT and ask whether to re-validate the cases or replan —
   the same mechanism and the same refusal planwright prescribes per wave. Testing
   fixed cases against a moved target produces confident nonsense.
3. **Playwright MCP is available.** Confirm the browser tools actually resolve.
   If they do not, HALT with install instructions and **stop**:

   > Playwright MCP is published as `@playwright/mcp`; its README carries the
   > current invocation, typically of the form
   > `claude mcp add playwright npx @playwright/mcp@latest`. Install it, restart
   > the session so the tools register, then re-invoke this skill.

   **Do not fall back to another driver.** Not raw CDP, not `curl`, not `fetch`,
   not a headless-Chrome screenshot flag, not reading the built HTML off disk.
   Those answer different questions than "does this work in a browser", and a
   sheet that does not say which driver produced it is unusable as evidence.
4. **The environment is resolved now, not trusted from the plan.** The `Target`
   and `Browser` header fields were written when the plan was written. They are
   claims about an environment that has had every opportunity to move since, and
   a mismatch here produces failures that describe your harness rather than the
   software — the most expensive kind of red, because it looks like a defect.
   Resolve all three and reconcile each against what the plan says:

   - **Origin.** The repo's own dev configuration is the fact; the plan's port is
     the claim. Read it from the config (`package.json` scripts, a compose file,
     a framework config) rather than from the gate header. If the two disagree,
     HALT and print both — do not silently prefer either. A plan naming a port
     the repo no longer uses is a stale gate, which is step 2's problem wearing
     different clothes.
   - **Identity — a reachable URL is not evidence of the right app.** This is the
     failure worth naming, because nothing else in this preflight can see it: a
     dev server left running from a **different checkout** answers on that port
     cheerfully, and every case then runs against software nobody is testing. The
     suite produces a full sheet, passes or fails on the wrong build, and says
     nothing is wrong. So assert one thing that must be true of *this* build
     before the first case runs — the commit SHA if the app exposes it, otherwise
     a string the current source produces and the previous one does not. If you
     cannot establish it, HALT and say so. "It answered" is not identity.
   - **Driver.** What actually resolved in step 3 is the fact. If the gate's
     `Browser` field names something else, HALT: the run would produce a
     different kind of evidence than the plan promised, which is how a case ends
     up substituting a DOM transcript for the screenshot its `expected` clause
     asked for — and a substituted artifact is not the declared evidence.

   Everything resolved here goes into the sheet's Environment row **with how it
   was resolved**. A base URL with no provenance is indistinguishable from a
   guess that happened to answer.
5. **Every route the cases name exists.** Collect the routes the steps navigate
   to and check them against the application's actual route table — or against
   the running app — before any case executes. A route the application does not
   have is a **plan defect and a HALT, never a FAIL**: reporting it as a failure
   blames the software for a slug the plan invented. Name the case and the route.
   This is the same rule the evidence-type contract already applies at plan time,
   moved to the moment the truth is knowable.
6. **The evidence root is writable.** `.drydock/testing/<plan-id>/`. If it cannot
   be created, HALT — a case whose evidence cannot be written is not a passing
   case, because the declared evidence is part of the expected result.
7. **Auth is settled.** If the gate's header declares an auth approach, perform
   it once before the first case. If it declares `none`, proceed. If it declares
   nothing at all, HALT and ask rather than guessing that the target is public.

## Executing a case

Cases run in declared order, and a failure does not stop the suite — every case
gets a verdict, because a sheet showing one failure and five unknowns cannot be
triaged. Only a HALT condition stops a run.

For each case:

1. **Check its preconditions.** A false precondition is a HALT for that case, not
   a FAIL: the case never ran, and recording it as failed blames the app for the
   harness.
2. **Perform the steps exactly as written**, in order, through Playwright MCP.
   Prefer role-, label- and text-based locators, in that order, because they are
   what the written step names; reach for a CSS or test-id selector only when the
   step itself names one.
3. **A step that cannot be performed as written is verdict FAIL with reason
   exactly `step not executable`.** Record which step, and what you looked for.
   Then judge, and say which you judged:
   - **Looks like an app defect** — the element should exist and does not, the
     flow is broken, a navigation 404s. Record the FAIL and continue.
   - **Looks like a plan defect** — the step names a control, route or concept the
     application has no notion of, or the case contradicts itself. Record the
     FAIL **and HALT and ask.** A gate quietly failing every case because the
     cases describe a different product is worse than no gate: it manufactures a
     NO-GO that nobody can act on.
   Improvising a substitute step, or reporting PASS because "nothing broke", are
   contract breaches, not pragmatism.
4. **Evaluate the `Then` clauses against what the browser actually shows**, not
   against what the step intended. Record **actual vs expected** verbatim for
   every non-PASS, and for a PASS whose evidence is a measurement.
5. **Honour a declared inversion.** A case whose `expected` says it must fail is
   PASS-when-it-fails: if it passes, that is a failure of the gate, and the sheet
   must say so in those words rather than logging a quiet green.
6. **Capture the declared evidence** — exactly the declared type, into
   `.drydock/testing/<plan-id>/<case-id>/`:
   - `screenshot` — at the moment the `Then` clause is evaluated, not at the end
     of the case.
   - `video` — the whole case. If the driver produced no video, the case FAILs on
     its evidence clause even when its assertions held. The declared evidence
     type is part of the case, not a preference.
   - `network assertion` — the recorded request/response table the claim rests
     on, saved as a file. A screenshot is not evidence for a network claim.
   Evidence missing or written outside the declared path is a FAIL on the
   evidence clause. Say which.

## Repeatable spec files

After the live run, write one Playwright spec per case into `<e2e_dir>` so the
suite can be re-run without an agent. Configure `video: 'retain-on-failure'`.

- Generate from what you actually did, not from the prose you were given: the
  locators that worked, the assertions as evaluated.
- **Never add a dependency.** If `@playwright/test` is absent, write the specs
  anyway and ask the user whether to add it. Do not touch any `package.json`,
  lockfile, or CI config on your own initiative.
- If the runner is absent or the specs were not executed, label them in the sheet
  exactly `GENERATED, NOT EXECUTED`. Do not call them passing, green, verified or
  CI-ready. An unrun test file is a hypothesis.
- If the runner is present, run the generated specs once and record whether they
  agree with the live verdicts. Disagreement is a finding worth more than either
  result alone — report it, do not average it.

## The verdict sheet

Write `.drydock/testing/<plan-id>/verdict.md` — the path the format contract
freezes and `drydock:reconcile` reads. Write it only after every case in the
section has a verdict; a diagnostic subset run writes nothing. Shape:

```
GO | NO-GO | GO-WITH-OVERRIDES

## Environment
| Base URL | Resolved from | Browser | Driver | Commit SHA | Run at |
Identity: <what you asserted to prove this is the build under test, and its result>

## Cases
| ID | Title | Severity | Verdict | Actual vs expected | Evidence |

## Overrides
| Case | Reason | Decided by |          (omit when empty)

## QA handoff
Covered: ...
Not covered: ...
```

Apply the gate rule from the format contract exactly: any blocker FAIL is
**NO-GO**; a major FAIL is **GO-WITH-OVERRIDES** only with a recorded override
naming case, reason and decider, and **NO-GO** without one; a minor FAIL is
recorded only; everything passing is **GO**. You never write an override
yourself — a human decides it and you transcribe it.

The QA handoff note states what was covered **and what was not**: which flows,
viewports, browsers, and pages were never touched. Understate coverage. The
reader is deciding whether to ship on the strength of this page.

## Anti-goals

- **Do not claim more than a browser saw.** A `GO` is evidence about the paths
  these cases exercised, at one commit, in one browser. It is not proof that the
  app is correct, not proof that other defects are absent, and not a substitute
  for review. Say this in the sheet, not just here.
- **Do not edit the plan to make a case pass.** The cases are the specification;
  changing them at run time is the one thing that voids the gate. If a case is
  genuinely wrong, that is a HALT and a `/drydock:replan`, not an edit.
- **Do not fix the app.** You are a verifier. A verifier who repairs the thing
  under test destroys its own evidence — the same reason wavecheck may not fix
  what it audits.
- **No mechanical enforcement.** You do not install hooks and you do not block
  anyone's tooling. This gate is prose, like every other gate in Drydock: it
  works because a human reads the sheet.
- **Do not commit evidence.** Artifacts live under the gitignored evidence root.
  If the user wants them in version control, they ask; screenshots and video in
  a repo's history are permanent.

## Cost discipline

One browser session for the whole suite unless a case's preconditions require a
fresh one. Do not re-navigate between assertions on the same page. Do not
screenshot steps whose evidence type is not `screenshot`. Do not read source
files to "understand" a case — the case is the specification, and the app's
behaviour is the only other input you need.
