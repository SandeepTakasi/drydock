/**
 * Honesty-matrix assertions. Node built-ins only.
 *
 *   node scripts/assert-matrix.mjs
 *
 * `docs/compatibility.md` is the source of truth for every verification claim
 * the site makes (see the honesty rule in CLAUDE.md). Nothing checked that the
 * matrix itself still matched the evidence, and it drifted across two releases:
 * A5 read PENDING / "Not yet observed once" after seatrial had run end to end,
 * and the A3 ledger read "0 skipped" after plan 004 logged deviation 11.
 * Both are the same failure — the record of what is proven stopped tracking
 * what was proven — and both are invisible to `assert-copy`, which only checks
 * that the required caveats appear on the page.
 *
 * Exits 1 with one line per failure naming exactly what drifted.
 *
 * Three checks:
 *   1. A row marked PENDING has NO dated entry in the verification log.
 *   2. A row that cites the verification log HAS the entry it cites. Rows whose
 *      evidence is inline (A4) cite nothing and are skipped — the citation is
 *      the trigger, so the check maintains itself as rows are added.
 *   3. Every plan whose Deviation Log records a skipped wave gate is accounted
 *      for in the A3 ledger.
 *
 * KNOWN CEILING on check 3: it matches prose. There is no structured marker
 * for "a gate was skipped", so it looks for how the corpus actually phrases it
 * ("wavecheck ... was not run", "gate was skipped") inside the Deviation Log
 * section only — scoping matters, since wavecheck report tables quote the same
 * words. It therefore catches a skip somebody LOGGED. A skip nobody logged is
 * invisible to any check that reads this repo, which is an argument for the
 * ownership hook, not for a cleverer grep. Going forward, tagging skipped-gate
 * deviations with a literal marker would make this structural.
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = join(HERE, "..", "..", "docs");
const PLANS = join(DOCS, "plans");

const failures = [];
const fail = (msg) => failures.push(msg);

const compat = readFileSync(join(DOCS, "compatibility.md"), "utf8");
const vlog = readFileSync(join(DOCS, "verification-log.md"), "utf8");
const a3 = readFileSync(join(DOCS, "a3-gate-compliance.md"), "utf8");

// --- parse the compatibility matrix ----------------------------------------
// | A1 | property | STATUS | notes |   — the id column may be an em dash for
// rows that track something with no compatibility id; those carry no claim
// about the log and are skipped.
const rows = [];
for (const line of compat.split("\n")) {
  const m = line.match(/^\|\s*([A-Za-z0-9]+)\s*\|([^|]*)\|\s*([^|]*?)\s*\|(.*)\|\s*$/);
  if (!m) continue;
  const [, id, property, status, notes] = m;
  if (id === "Property" || /^-+$/.test(id)) continue; // header / separator
  rows.push({ id, property: property.trim(), status, notes });
}

if (rows.length === 0) fail("parsed zero rows from compatibility.md — the table shape changed");

// A verification-log entry for <id> is a top-level heading naming it:
//   ## A5 — ...        ## A1 (replication) — ...
const hasLogEntry = (id) =>
  new RegExp(`^## ${id}\\b`, "m").test(vlog);

// --- check 1: PENDING must not already have evidence ------------------------
// Exact match on the whole status cell, not a substring. A row reading
// "LOGIC VERIFIED — live registration PENDING" is claiming partial evidence and
// correctly cites the log; only a bare PENDING claims none, and only that claim
// is contradicted by an entry existing.
for (const row of rows) {
  if (row.status.trim().toUpperCase() !== "PENDING") continue;
  if (hasLogEntry(row.id)) {
    fail(
      `${row.id} is marked ${row.status.trim()} in compatibility.md but ` +
        `verification-log.md already carries a "## ${row.id}" entry. The matrix ` +
        `is understating its own evidence — move the row or delete the entry.`
    );
  }
}

// --- check 2: a cited entry must exist --------------------------------------
for (const row of rows) {
  if (!/verification-log\.md#/.test(row.notes)) continue;
  if (!hasLogEntry(row.id)) {
    fail(
      `${row.id} cites verification-log.md but no "## ${row.id}" entry exists there. ` +
        `A row may not point at evidence that is not written down.`
    );
  }
}

// --- check 3: logged gate skips are accounted for in the A3 ledger ----------
// Scope to the Deviation Log section: wavecheck report tables quote the same
// language when they explain what they found, and counting those would make
// every audited skip look like two.
const SKIP = /wavecheck[\s\S]{0,120}?(was not run|gate was skipped|gate skipped)/i;

const skipsByPlan = new Map();
for (const file of readdirSync(PLANS).filter((f) => f.endsWith(".md"))) {
  const text = readFileSync(join(PLANS, file), "utf8");
  const start = text.search(/^## (?:\d+\.\s*)?Deviation Log\b/m);
  if (start === -1) continue;
  const rest = text.slice(start + 1);
  const end = rest.search(/^## /m);
  const section = end === -1 ? rest : rest.slice(0, end);

  const n = section
    .split("\n")
    .filter((l) => l.startsWith("|") && SKIP.test(l)).length;
  if (n > 0) skipsByPlan.set(file.replace(/\.md$/, ""), n);
}

// The ledger is | Plan | Waves | Invoked | Unprompted | Skipped | Notes |
let ledgerSkipped = 0;
const ledgerPlans = [];
for (const line of a3.split("\n")) {
  const m = line.match(/^\|\s*(\d{3}-[a-z0-9-]+)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|\s*(\d+)\s*\|/);
  if (!m) continue;
  ledgerPlans.push(m[1]);
  ledgerSkipped += Number(m[5]);
}

if (ledgerPlans.length === 0) fail("parsed zero plan rows from the A3 ledger — its table shape changed");

let loggedSkips = 0;
for (const [plan, n] of skipsByPlan) {
  loggedSkips += n;
  if (!ledgerPlans.includes(plan)) {
    fail(
      `${plan} logs ${n} skipped wave gate(s) in its Deviation Log but has no row ` +
        `in the A3 ledger (a3-gate-compliance.md). A3's published totals do not ` +
        `cover this plan.`
    );
  }
}

if (ledgerSkipped < loggedSkips) {
  fail(
    `A3 ledger totals ${ledgerSkipped} skipped gate(s); the plans log ${loggedSkips}. ` +
      `The published compliance number is higher than the record supports.`
  );
}

// --- report ----------------------------------------------------------------
if (failures.length > 0) {
  console.error(`assert-matrix: FAIL (${failures.length})`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(
  `assert-matrix: PASS — ${rows.length} matrix rows, ${ledgerPlans.length} A3 ledger plans, ` +
    `${loggedSkips} logged gate skip(s) accounted for`
);
