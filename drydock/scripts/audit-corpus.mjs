#!/usr/bin/env node
// Re-audits every sealed wave of every `format_version: 3` plan in docs/plans/:
// runs `drydock-audit.mjs audit-wave <plan> <wave>` for each wave whose LAST
// `### Wavecheck` heading says PASS. Same command locally and in CI.
//
// WHY ONLY v3. Measured 2026-10-07 from a clean checkout: every sealed v3 wave
// re-audits PASS (attribution is recovered from the sealed report), while plans
// 001-004 (`format_version: 2`) fail 14 of 29 waves for reasons that predate the
// manifest and per-task attribution. A wave whose last verdict is BLOCK is a
// plan state, not a CI failure, so it is skipped.
//
// CEILING. `audit-wave` sees only commits a task claims. A commit made after a
// wave was sealed that no task claims is not seen by this gate.
//
// The heading rule is copied from `drydock-audit.mjs` (WAVECHECK_RE): a comma,
// a hyphen or an em dash before the verdict; the last heading per wave wins.
// Node built-ins only.
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const audit = join(here, "drydock-audit.mjs");
const plansDir = join(here, "..", "..", "docs", "plans");
const HEADING = /^### Wavecheck (\d+)\.(\d+)\b.*?[—,-]\s*(PASS|BLOCK)\b/;

const jobs = [];
for (const f of readdirSync(plansDir).filter((n) => n.endsWith(".md")).sort()) {
  const lines = readFileSync(join(plansDir, f), "utf8").split(/\r?\n/);
  if (!lines.some((l) => /^format_version:\s*3\s*$/.test(l))) continue;
  const last = new Map();
  for (const l of lines) {
    const m = l.match(HEADING);
    if (m) last.set(`${m[1]}.${m[2]}`, m[3]);
  }
  for (const [wave, v] of last) if (v === "PASS") jobs.push({ plan: `docs/plans/${f}`, wave });
}

const failed = [];
for (const { plan, wave } of jobs) {
  const r = spawnSync(process.execPath, [audit, "audit-wave", plan, wave], {
    encoding: "utf8",
    cwd: join(here, "..", ".."),
  });
  const tail = (r.stdout + r.stderr).trim().split(/\r?\n/).pop();
  console.log(`${plan} ${wave}: exit ${r.status} ${tail}`);
  if (r.status !== 0) failed.push(`${plan} ${wave}`);
}

if (failed.length) {
  console.log(`audit-corpus: FAIL, ${failed.length} of ${jobs.length} wave(s): ${failed.join("; ")}`);
  process.exit(1);
}
console.log(`audit-corpus: PASS, ${jobs.length} wave(s) in ${new Set(jobs.map((j) => j.plan)).size} plan(s)`);
