# scope-gate

A GitHub Action that fails a pull request whose diff leaves the scope declared
in the issue it closes. The scope is written in the issue body before the work,
in the same format as `drydock:check`.

Status: dogfooded on this repo, **not yet run live** (row A13 in
`docs/compatibility.md` is PENDING). No release or tag exists; reference
`@main` or a commit SHA.

## Issue format

Write this in the issue body before opening the PR:

```markdown
- **Files owned:** `src/widget/**`, `docs/widget.md`
- **Forbidden:** `src/widget/legacy/**`
- **Acceptance criterion:** `npm test`, `node scripts/lint-widget.mjs`
```

- `Files owned` globs: every changed file must match one.
- `Forbidden` globs (optional): no changed file may match one.
- `Acceptance criterion` (optional): each backticked command must exit 0.

## Workflow

```yaml
name: scope-gate

on:
  pull_request:
    types: [opened, edited, synchronize, reopened]

permissions:
  contents: read
  issues: read
  pull-requests: read

jobs:
  scope-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v5
        with:
          node-version: 22
      - uses: SandeepTakasi/drydock/scope-gate@main
```

`fetch-depth: 0` is required so the PR's base SHA is present. To make scopes
opt-in, add your own `if:` to the job.

## What it enforces (and fails closed on)

- The PR body must link exactly one issue with a closing keyword (`closes #12`,
  `fixes #12`, `resolves #12`, case-insensitive). None, several, or a number
  that is itself a PR fails.
- The issue author's `author_association` must be `OWNER`, `MEMBER` or
  `COLLABORATOR`. A stranger's issue on a public repo must not be able to put
  acceptance commands into your CI.
- The issue must have been created before the PR was opened.
- Then it audits the diff from the PR's base SHA, runs the criteria, and fails
  with a file annotation on every out-of-scope or forbidden file and a message
  for every failing criterion.

## Why `pull_request`, never `pull_request_target`

Acceptance criteria run code from the repository in CI. `pull_request` gives a
fork PR no secrets and a read-only token. `pull_request_target` would hand both
to code the PR author controls. Do not switch it.

## Ceilings

- Edits to the issue after the PR opened are not detected; only the creation
  time is compared.
- Issue edits do not re-run the gate; push, edit the PR, or reopen it.
- Scope is file-level, so drift inside an owned file passes.
- Criteria run repository code in CI.
- A trusted insider can still scope their own work as wide as they like.
