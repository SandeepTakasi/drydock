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
 * Four checks:
 *   1. A row marked PENDING has NO dated entry in the verification log.
 *   2. A row that cites the verification log HAS the entry it cites. Rows whose
 *      evidence is inline (A4) cite nothing and are skipped — the citation is
 *      the trigger, so the check maintains itself as rows are added.
 *   3. Every plan whose Deviation Log records a skipped wave gate is accounted
 *      for in the A3 ledger.
 *   4. Every A3 figure stated in prose — in the ledger, in compatibility.md, on
 *      the site — matches the ledger table's own arithmetic, as does every
 *      restated plan count.
 *
 * Checks 1-3 compare a document against another document. Check 4 exists
 * because the drift that actually happened was a document contradicting
 * ITSELF: appending plan 005 moved the ledger's table and its "Final total" to
 * 28 of 29 across 5 plans while the Status section three screens below kept
 * saying 27 of 28 across 4 — including in the sentence naming "the honest
 * claim" — and compatibility.md's release bullet repeated the stale pair while
 * the site published the new one. Every check here stayed green throughout.
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
// The site restates these figures too, and is the surface a reader actually sees.
const copy = readFileSync(join(HERE, "..", "content", "copy.ts"), "utf8");
// The repo README is the first surface a reader meets, and the one the first
// version of check 4 forgot.
const rootReadme = readFileSync(join(HERE, "..", "..", "README.md"), "utf8");

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
const totals = { waves: 0, invoked: 0, unprompted: 0 };
for (const line of a3.split("\n")) {
  const m = line.match(/^\|\s*(\d{3}-[a-z0-9-]+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/);
  if (!m) continue;
  ledgerPlans.push(m[1]);
  totals.waves += Number(m[2]);
  totals.invoked += Number(m[3]);
  totals.unprompted += Number(m[4]);
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

// --- check 4: every stated A3 figure matches the ledger's own rows ----------
//
// Checks 1-3 compare a document against another document. Nothing compared a
// document against ITSELF, and that is where A3 actually drifted: when plan 005
// was appended, the ledger's table and its "Final total" line moved to 28 of 29
// across 5 plans, while the Status section three screens below kept saying
// 27 of 28 across 4 — three times, including in the sentence that names "the
// honest claim". The release-criteria bullet in compatibility.md repeated the
// stale pair, and the site published the new one. Three surfaces, two numbers,
// and every existing check green, because a row still cited a log entry that
// still existed.
//
// The ledger's table is the arithmetic; the prose only restates it. So the
// prose is derived and compared, everywhere it appears.
const legitimate = new Map([
  [`${totals.invoked}/${totals.waves}`, "gates invoked at their boundary"],
  [`${totals.unprompted}/${totals.waves}`, "gates recorded before the next wave opened"],
  [`${totals.unprompted}/${totals.invoked}`, "unprompted, of the gates invoked"],
]);

// Which total a figure is claiming, taken from the words around it. A pair with
// no keyword is only checked for being one of the legitimate three — the
// keyworded cases are what carry the check, and a bare fraction is too weak a
// signal to pin to a specific total.
const CLAIMS = [
  [/\bunprompted\b/i, () => `${totals.unprompted}/${totals.invoked}`],
  [/\brecorded\b/i, () => `${totals.unprompted}/${totals.waves}`],
  [/\b(boundar|invoked)/i, () => `${totals.invoked}/${totals.waves}`],
  // "That makes 28/29 an upper bound on compliance, not a rate." A figure named
  // as THE compliance number is the headline one, invoked-over-waves. Without
  // this row that sentence carried no keyword at all, fell through to the weak
  // "is it one of the three legitimate pairs" branch, and passed while saying
  // 27/28 — which is a legitimate pair, just not this claim's. It was one of the
  // three lines that actually drifted, so the ceiling was landing on the case
  // the check exists for.
  [/upper bound|\bcompliance\b|\brate\b/i, () => `${totals.invoked}/${totals.waves}`],
];

// WHICH SURFACES. Every document that restates the figure — including the root
// README, which is the FIRST thing a reader sees and was the one surface the
// first version of this check did not read. It sat stale at "27 of 28 … across
// those 4 plans" while all three checked surfaces were correct, because the
// check was built from the list of places drift had been found rather than the
// list of places the figure is stated.
//
// `verification-log.md` is deliberately absent. Its A3 entry reads "22 of 22
// observed gates invoked, 0 skipped … across 3 plans" — a correctly scoped,
// dated record of the 2026-08-19 measurement, closed at three plans. Scanning it
// would fail a true statement. Historical entries are exempt BY FILE, which is
// crude but honest; if a dated record ever moves into one of the files below,
// this check will fail it and the fix is to move it back.
const SURFACES = [
  ["a3-gate-compliance.md", a3],
  ["compatibility.md", compat],
  ["copy.ts", copy],
  ["README.md", rootReadme],
];

// WHOLE DOCUMENT, WHITESPACE-NORMALISED — not line by line. The root README
// writes "27 of 28\nwave gates", with the figure and its noun on either side of
// a line break, so a line-scoped scan sees a number with no keyword and a
// keyword with no number, and matches neither. That blind spot is not
// hypothetical: it is why this check missed the README, and why a hand-written
// `grep` over the repo missed it too. Collapsing whitespace first makes the
// window land on the sentence rather than on the line.
const flat = (t) => t.replace(/\s+/g, " ");

for (const [label, raw] of SURFACES) {
  const text = flat(raw);
  for (const m of text.matchAll(/\b(\d{1,3})\s*(?:of|\/)\s*(\d{1,3})\b/g)) {
    const pair = `${m[1]}/${m[2]}`;
    // A window around THIS figure. One sentence carries several: "28 of 29
    // gates invoked at their boundary, 1 skipped, 27 of 29 recorded before the
    // next wave opened" states two different totals, and classifying by the
    // enclosing block gave both the first keyword it found. The qualifier
    // usually follows the figure ("27 of 29 recorded") but sometimes precedes
    // it ("Unprompted on 27 of 28 invoked"), so both sides are read, and CLAIMS
    // is ordered most-specific first for the overlaps.
    const near = text.slice(Math.max(0, m.index - 40), m.index + 60);
    if (!/\bgates?\b|\bboundar|\binvoked\b|upper bound|\bcompliance\b/i.test(near)) continue;
    const claim = CLAIMS.find(([re]) => re.test(near));
    const expected = claim?.[1]();
    const where = near.trim().slice(0, 120);
    if (expected && pair !== expected) {
      fail(
        `${label}: "${m[0]}" claims ${legitimate.get(expected) ?? expected}, but the A3 ledger's rows ` +
          `total ${expected}. Near: …${where}…`
      );
    } else if (!expected && !legitimate.has(pair)) {
      fail(
        `${label}: "${m[0]}" is not a figure the A3 ledger's rows support ` +
          `(${[...legitimate.keys()].join(", ")}). Near: …${where}…`
      );
    }
  }
}

// The plan count is restated in prose too, and drifted the same way. Words as
// well as digits: `copy.ts` writes "across five plans", which a digit-only
// pattern cannot see. It happens to be correct, which is exactly why it needed
// covering — an unguarded true statement is one edit from an unguarded false one.
const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const COUNT = new RegExp(`\\b(\\d+|${Object.keys(WORDS).join("|")})\\s+(?:pilot\\s+)?plans\\b`, "gi");

for (const [label, raw] of SURFACES) {
  const text = flat(raw);
  for (const m of text.matchAll(COUNT)) {
    const near = text.slice(Math.max(0, m.index - 90), m.index + 90);
    if (!/\bgates?\b|\bboundar|\binvoked\b|\bledger\b|\bA3\b|\bgated\b/i.test(near)) continue;
    // A HISTORICAL count is not drift. The ledger says "Measurement was closed
    // at 3 plans on 2026-08-19, reopened…", which is true and must stay true as
    // the current total grows. The corpus marks these with one idiom — "closed
    // at N", "stopped at N" — and current claims use a different one ("across
    // N plans"). Exempting on the marker rather than on the file is what lets a
    // dated record live inside a checked document; `verification-log.md` is
    // exempt wholesale only because it is nothing but such records.
    if (/\b(?:closed|stopped|reopened)\s+(?:again\s+)?at\s*$/i.test(text.slice(Math.max(0, m.index - 30), m.index))) continue;
    const n = WORDS[m[1].toLowerCase()] ?? Number(m[1]);
    if (n !== ledgerPlans.length) {
      fail(
        `${label}: "${m[0]}" but the A3 ledger holds ${ledgerPlans.length} plan row(s). ` +
          `Near: …${near.trim().slice(0, 120)}…`
      );
    }
  }
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
