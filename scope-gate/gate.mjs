#!/usr/bin/env node
/**
 * scope-gate: fail a pull request whose diff leaves the scope declared in the
 * issue it closes. A thin wrapper: read the event, fetch the issue, refuse
 * untrusted scope, write an intent file (base: = the PR's base SHA) and hand it
 * to `drydock-audit.mjs check`. Node built-ins only.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

// D5: closing keyword + #n. Zero or several distinct numbers fail closed.
export function linkedIssue(body) {
  const nums = new Set(
    [...(body ?? "").matchAll(/\b(?:close[sd]?|fix(?:es|ed)?|resolve[sd]?)\s+#(\d+)/gi)].map((m) => Number(m[1])),
  );
  if (nums.size === 0) throw new Error("no linked issue (the PR body needs `Closes #<n>`)");
  if (nums.size > 1) throw new Error(`links ${nums.size} issues, exactly one is required`);
  return [...nums][0];
}

// D2
export const trusted = (assoc) => ["OWNER", "MEMBER", "COLLABORATOR"].includes(assoc);

export const intentFrom = (issueBody, baseSha) => `---\nbase: ${baseSha}\n---\n${issueBody ?? ""}\n`;

export function refusals({ pr, issue }) {
  const out = [];
  if (issue.pull_request) out.push(`#${issue.number} is a pull request, not an issue`);
  if (!trusted(issue.author_association)) {
    out.push(`issue #${issue.number} author is ${issue.author_association}, not OWNER, MEMBER or COLLABORATOR`);
  }
  // D3 ceiling: body edits after the PR opened are not detected.
  if (Date.parse(issue.created_at) > Date.parse(pr.created_at)) {
    out.push(`issue #${issue.number} was created after the PR`);
  }
  return out;
}

const refuse = (why) => {
  console.log(`::error::scope-gate: ${why}`);
  process.exit(1);
};

async function main() {
  const env = process.env;
  const pr = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, "utf8")).pull_request;
  if (!pr) {
    console.error("scope-gate: not a pull_request event");
    process.exit(2);
  }

  let n;
  try { n = linkedIssue(pr.body); } catch (e) { refuse(e.message); }

  const res = await fetch(`${env.GITHUB_API_URL}/repos/${env.GITHUB_REPOSITORY}/issues/${n}`, {
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
  });
  if (res.status !== 200) refuse(`could not read issue #${n} (HTTP ${res.status})`);
  const issue = await res.json();

  const why = refusals({ pr, issue });
  if (why.length) refuse(why.join("; "));

  // Outside the workspace, so the intent file is never part of the diff.
  const file = join(env.RUNNER_TEMP, "scope-gate-intent.md");
  writeFileSync(file, intentFrom(issue.body, pr.base.sha));

  const r = spawnSync(
    process.execPath,
    [resolve(HERE, "..", "drydock", "scripts", "drydock-audit.mjs"), "check", file],
    { cwd: env.GITHUB_WORKSPACE, encoding: "utf8", maxBuffer: 64 << 20 },
  );
  process.stdout.write(r.stdout ?? "");
  process.stderr.write(r.stderr ?? "");
  for (const line of (r.stdout ?? "").split(/\r?\n/)) {
    const m = /^FLAG (?:outside scope|forbidden): (.+)$/.exec(line);
    if (m) console.log(`::error file=${m[1]}::outside the scope declared in #${n}`);
  }
  process.exit(r.status ?? 1);
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  main().catch((e) => {
    console.log(`::error::scope-gate: ${e.message}`);
    process.exit(1);
  });
}
