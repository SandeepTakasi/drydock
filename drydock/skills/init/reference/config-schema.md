# Drydock host profile — `drydock.config.yaml`

One file per repository, written by `drydock:init`, read by `planwright`.

Checked by `drydock-audit.mjs validate-config <path>`.

## What this file is, and is not

It holds **defaults**, never facts. A plan may override any value; `planwright`
records the override in that plan's Decision Log. A profile that silently shapes
plans it no longer describes is drift. An override that is written down is not.

Every value carries **provenance** — `discovered` with the source, or `stated`
with a date — so a reader can tell what was measured from what was asserted.

## Shape

```yaml
config_version: 1
created: 2026-09-20

execution:
  # THE load-bearing key. `solo` when executor subagents will not actually be
  # spawned: a standing rule against unprompted agents, a host without
  # subagents, or a user who runs the tasks themselves.
  mode: solo                      # solo | fleet
  max_concurrent: 1               # only meaningful under fleet
  opus_in_budget: false
  provenance: stated 2026-09-20

gates:
  # Commands, not names. `prove-failable` runs these, so a name that is not a
  # runnable command is worse than an absent one.
  test: npm test
  lint: npm run lint
  build: npm run build
  typecheck: tsc --noEmit
  ci: .github/workflows/verify.yml
  framework: vitest
  provenance: discovered package.json

testing:
  approach: test-with             # test-first | test-with | none
  note: ""                        # required when approach is none
  provenance: stated 2026-09-20

vcs:
  default_branch: main
  commit_convention: conventional # conventional | ticket-prefix | free
  attribution: manifest           # manifest | commit-prefix
  provenance: discovered git log

gates_human:
  # A phase gate with no name is a refusal to close the plan.
  signer: priya
  provenance: stated 2026-09-20

paths:
  plans_dir: docs/plans
  docs_targets: [CLAUDE.md, docs/decisions, docs/architecture.md]
  drydock_ignored: true
  provenance: discovered resolve-plans-dir

browser:
  present: true
  base_url: http://localhost:3000
  start_command: npm run dev
  provenance: stated 2026-09-20

tracker:
  mirror: none                    # none | clickup | jira | github
  provenance: stated 2026-09-20
```

## Rules the validator enforces

| Rule | Why |
|---|---|
| `config_version` present and supported | the same contract discipline `format_version` carries for plans |
| `execution.mode` is `solo` or `fleet` | a typo must not fall through to a default, which is how `attribution: manfiest` would have looked armed |
| `vcs.attribution` is `manifest` or `commit-prefix` | same |
| `testing.approach` is one of the three | same |
| `testing.note` non-empty when approach is `none` | "no tests" is a decision that needs a reason on the record |
| `browser.base_url` and `start_command` present when `browser.present` | a Testing Gate cannot be driven against a target nobody named |
| `gates_human.signer` non-empty | unsigned gates are why plans never close |
| every section carries `provenance` | a value with no source is an assertion wearing a measurement's clothes |

Warnings, not errors, because a repo may legitimately have none of these:

- no runnable command in `gates`
- `paths.drydock_ignored` false
- `execution.mode: fleet` with `max_concurrent: 1`

## Versioning

`config_version` starts at 1. Adding an optional key with a back-compatible
default does not bump it. Removing a key, or changing what an existing value
means, does — and then `validate-config` refuses the old version rather than
reading it wrong.
