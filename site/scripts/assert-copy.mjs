/**
 * Copy + contract assertions for the static export. Node built-ins only.
 *
 *   node scripts/assert-copy.mjs                # asserts out/index.html + section files
 *   node scripts/assert-copy.mjs some/file.html # copy assertions only (fixture mode)
 *
 * Exits 1 with one line per failure naming exactly what was missing or forbidden.
 *
 * Normalisation order is load-bearing. `out/index.html` embeds the RSC
 * hydration payload as escaped JSON inside <script> bodies, so every rendered
 * string appears twice. Stripping tags alone leaves those bodies behind and
 * every counting assertion then passes vacuously off the payload — hence
 * step 1 strips script BODIES, not just script tags.
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SECTIONS_DIR = join(HERE, "..", "components", "sections");

const REQUIRED = [
  "APPROVED (HUMAN-ONLY)",
  "internal pilot",
  "field benchmarks pending",
  "Deviations logged: 1 (1 discovered by wavecheck)",
  "A2b",
  "drift",
  "one-file change",
  "NOTHING SAILS UNTIL IT LEAVES THE DOCK",
  // the six lifecycle pieces
  "planwright",
  "executor",
  "executor-isolated",
  "wavecheck",
  "replan",
  "reconcile",
];

/** The site must never claim a benchmark it does not have. */
const OVER_CLAIM = [
  /\d+\s*%\s*(faster|fewer|more)/i,
  /\d+(\.\d+)?\s*x\s*(faster|speedup)/i,
];

const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

const decode = (s) =>
  s.replace(/&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g, (whole, ent) => {
    if (ent[0] !== "#") return NAMED[ent.toLowerCase()] ?? whole;
    const hex = ent[1] === "x" || ent[1] === "X";
    const code = parseInt(hex ? ent.slice(2) : ent.slice(1), hex ? 16 : 10);
    return Number.isNaN(code) ? whole : String.fromCodePoint(code);
  });

const SCRIPT = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
const COMMENT = /<!--[\s\S]*?-->/g;
const TAG = /<[^>]*>/g;

/** 1. script bodies, 2. comments, 3. tags, 4. whitespace, 5. entities. */
const normalise = (html) =>
  decode(
    html
      .replace(SCRIPT, " ")
      .replace(COMMENT, " ")
      .replace(TAG, " ")
      .replace(/\s+/g, " ")
  ).trim();

/** Inner text of a markup fragment; tags drop without inserting a space, so
 *  `<h1><span>Dry</span>dock</h1>` still reads as one word. */
const inner = (html) =>
  decode(html.replace(COMMENT, "").replace(TAG, "").replace(/\s+/g, " ")).trim();

const failures = [];
const fail = (msg) => failures.push(msg);

const arg = process.argv[2];
const target = resolve(process.cwd(), arg ?? "out/index.html");
// An explicit path means a fixture: assert copy only, not the section sources.
const checkMotion = arg === undefined;

let raw;
try {
  raw = readFileSync(target, "utf8");
} catch (err) {
  console.error(`assert-copy: cannot read ${target}: ${err.message}`);
  process.exit(1);
}

const text = normalise(raw);

// --- required literals -----------------------------------------------------
for (const lit of REQUIRED) {
  if (!text.includes(lit)) fail(`missing required literal: ${JSON.stringify(lit)}`);
}

// --- the `executor` discriminator ------------------------------------------
// `executor` and `executor-isolated` share kind "agents", and a substring match
// on "executor" is also satisfied by "executor-isolated" alone. Two occurrences
// is what proves both rows rendered.
const executors = (text.match(/executor/g) ?? []).length;
if (executors < 2) {
  fail(
    `expected >= 2 occurrences of "executor" (one bare, one in "executor-isolated"), found ${executors}`
  );
}

// --- over-claim blocklist --------------------------------------------------
for (const re of OVER_CLAIM) {
  const hit = text.match(re);
  if (hit) fail(`forbidden over-claim: ${JSON.stringify(hit[0])} matched ${re}`);
}

// --- heading contract (Decision 24), on the RAW markup ---------------------
const h1Opens = (raw.match(/<h1[\s/>]/gi) ?? []).length;
if (h1Opens !== 1) {
  fail(`heading contract: expected exactly one <h1>, found ${h1Opens}`);
} else {
  const pair = raw.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (!pair) fail("heading contract: <h1> has no closing tag");
  else if (!inner(pair[1]).includes("Drydock")) {
    fail(
      `heading contract: <h1> must contain "Drydock", got ${JSON.stringify(inner(pair[1]))}`
    );
  }
}

// --- motion contract, over components/sections/*.tsx only ------------------
// lib/motion.ts legitimately holds every timing literal, so it is never scanned.
if (checkMotion) {
  let files = [];
  try {
    files = readdirSync(SECTIONS_DIR).filter((n) => n.endsWith(".tsx"));
  } catch (err) {
    fail(`motion contract: cannot read ${SECTIONS_DIR}: ${err.message}`);
  }
  if (checkMotion && files.length === 0) fail(`motion contract: no .tsx files in ${SECTIONS_DIR}`);

  for (const name of files) {
    const src = readFileSync(join(SECTIONS_DIR, name), "utf8");
    const usesMotion = /from\s*["']motion\/react["']/.test(src);

    if (usesMotion && !src.includes("useMotionSafe")) {
      fail(`${name}: imports motion/react without useMotionSafe`);
    }
    if (usesMotion && !src.includes("data-reveal")) {
      fail(`${name}: imports motion/react but carries no data-reveal attribute`);
    }
    const timing = src.match(/(duration|delay):|duration-[0-9]|delay-[0-9]/);
    if (timing) {
      fail(`${name}: timing literal ${JSON.stringify(timing[0])} — all timing lives in lib/motion.ts`);
    }
    if (src.includes("heroSequence.waterline")) {
      fail(`${name}: uses heroSequence.waterline (animates pathLength) — use waterlineReveal`);
    }
  }
}

// --- report ----------------------------------------------------------------
if (failures.length > 0) {
  console.error(`assert-copy: FAIL (${failures.length}) — ${target}`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(
  `assert-copy: PASS — ${target} (${REQUIRED.length} literals, ${executors}x executor, 1 h1${
    checkMotion ? ", motion contract" : ", motion contract skipped: fixture mode"
  })`
);
