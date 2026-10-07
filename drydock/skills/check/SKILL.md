---
name: check
description: Lightweight scope check for small work that needs no plan and no waves. Record the current commit, write a short intent file (owned globs, optional forbidden globs, optional acceptance commands) to .drydock/check.md, do the work, then run drydock-audit.mjs check and report its output verbatim. Detects scope misses after the fact; prevents nothing. Use when the user says "drydock check", "check my scope", or wants a quick scope audit without a plan.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# check: a scope audit without a plan

For small work where a plan is overkill. You state the intent in a few lines,
do the work, and an audit afterwards says whether you stayed inside it.

## What check does not do

- It **prevents nothing.** The ownership hook is not armed. A scope miss lands
  on disk first and is detected afterwards.
- A FLAG is **reported, never auto-fixed.** Do not revert, delete or amend to
  make a FLAG go away. Show it to the user and let them decide.
- It writes nothing and commits nothing.

## Step 1: record the base

Run `git rev-parse HEAD` and keep the full SHA.

## Step 2: write the intent file

From the user's 3-5 line statement of the work, use the Write tool to create
`.drydock/check.md` in exactly this format:

```
---
base: <full or short commit SHA>
---
- **Goal:** <one line, informational>
- **Files owned:** `<glob>`, `<glob>`
- **Forbidden:** `<glob>`            (optional)
- **Acceptance criterion:** `<command>`   (one or more backticked commands, optional)
```

A field's value is every backticked item from its bullet up to the next line
starting `- **`. Line endings may be LF or CRLF.

Criteria run through the platform shell: `cmd.exe` on Windows, `/bin/sh`
elsewhere, so a criterion must work in both. Avoid backslash escapes (cmd.exe
mangles them) and quote anything containing parentheses (sh). Good shapes:
`exit 1`, `node --test`, `node -e "..."`.

The `.drydock/` directory is excluded from the changed set, so this file is
never flagged itself. Confirm the owned globs with the user if the statement is
ambiguous; do not guess wide.

## Step 3: do the work

Proceed directly. No plan document, no waves, no subagents. Stay inside the
owned globs and away from the forbidden ones.

## Step 4: run the audit

```
node ${CLAUDE_PLUGIN_ROOT}/scripts/drydock-audit.mjs check .drydock/check.md
```

It compares files changed since the base (renames count as a delete plus an
add) and untracked files against the intent, then runs each criterion. Output:

- `FLAG outside scope: <file>` for a file no owned glob matches.
- `FLAG forbidden: <file>` for a file matching a forbidden glob (that file gets
  only this line).
- `FLAG criterion exited <code>: <cmd>` for a failing criterion.
- Last line `check: PASS (...)` with exit 0, or `check: FLAG (<n>)` with exit 1.
- Exit 3 with a one-line reason when the base cannot be resolved or no owned
  globs were given. Fix the intent file and re-run.

## Step 5: report

Paste the audit output **verbatim**, then stop. If it says FLAG, name each
flagged file and ask the user how to proceed. Do not fix anything on your own.
