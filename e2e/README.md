# Generated E2E specs — plan 004 Testing Gate

**GENERATED, NOT EXECUTED.** `@playwright/test` is not installed in this repo
and seatrial is forbidden from adding it. These files are a hypothesis about
repeatability, not a passing suite. Nothing here has been run by a test runner.

Generated from the live seatrial run of `docs/plans/004-seatrial-e2e-gate.md` at
commit `5a32ac9`. Every selector here was resolved against the live DOM and
matched what the spec asserts; the assertions are the ones as evaluated. Two
precision caveats, stated rather than glossed: the selectors were confirmed
through `browser_evaluate` against the real document, not through Playwright's
own locator engine, so the `filter({ hasText })` wrappers are unexercised; and
TG2's locator is a **correction** — the first guess written from the
accessibility snapshot (`header > div > div`) matched **zero** elements, because
the pill is a `span`. It was caught only by re-checking against the DOM. That is
the exact failure mode of generating specs from prose instead of from the run.

**Re-run 2026-08-26 at commit `05627d1`.** The whole gate was executed again
against the same target after 12 commits had moved `site/`; preflight HALTed on
that staleness and continued only on a human re-validation. Every case returned
the same verdict as the first run, and every locator below resolved to the same
element with the same measured value -- 13 same-origin requests all 200, the
mark still 256x256, the pill still `open pilot -- field benchmarks pending`, and
still zero test ids on the page. **Nothing in these spec files changed**, which
is the useful part: regenerating from a second run reproduced them exactly.

Still GENERATED, NOT EXECUTED -- no runner was installed for either run.

The live verdicts are in `.drydock/testing/004-seatrial-e2e-gate/verdict.md`
(gitignored).

## To run them, if you decide to

```bash
# 1. the target these specs expect (CLAUDE.md's recipe)
cd <repo root>
npm --prefix site run build
mkdir -p /tmp/dd && ln -sfn "$PWD/site/out" /tmp/dd/drydock
(cd /tmp/dd && python3 -m http.server 5173)

# 2. the runner — a real dependency decision, ~300 MB of browser binaries
npm i -D @playwright/test && npx playwright install chromium
npx playwright test e2e/
```

No `playwright.config.ts` is generated: each spec sets
`video: 'retain-on-failure'` itself via `test.use`, and writing a config for a
runner nobody has installed is scaffolding for a decision not yet taken. The
target URL is inlined per spec rather than hidden in a `baseURL`.

## Two specs are meant to fail

`tg2` and `tg3` carry `test.fail()`. Their cases were designed unsatisfiable so
the gate could be caught agreeing with a false expectation — a green run on
either is a gate defect, not a success. `test.fail()` encodes that inversion
mechanically: the runner reports them as passing **because** their bodies throw.
