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
const PLUGIN_JSON = join(HERE, "..", "..", "drydock", ".claude-plugin", "plugin.json");
const README = join(HERE, "..", "..", "README.md");

const REQUIRED = [
  "APPROVED (HUMAN-ONLY)",
  "open pilot",
  "field benchmarks pending",
  // A3 is the one row that must never quietly graduate. Before these two
  // literals were required, the page could have promoted it to PASSED and the
  // gate would still have gone green: nothing checked that the caveat was
  // present, only that the claims were. Both strings live in A3's evidence row.
  "PUBLISHED, NOT PASSED",
  "ceiling, not a rate",
  // A3 publishes a skipped gate as of v0.6.0. Promoting the page back to a
  // spotless count would be the same silent graduation these literals exist to
  // stop, so the skip is required to appear.
  "1 skipped",
  // A6 is the plugin's headline claim -- ownership ENFORCED rather than
  // requested -- and as of 2026-08-22 it is observed live: the host invokes the
  // hook and a real edit was denied. What the literals guard moved with it. The
  // old pair pinned the "not yet observed" caveat, and keeping them would now
  // force the page to understate its own evidence. These pin what is still NOT
  // true, which is where an enforcement claim rots next: a hook that stops file
  // tools and nothing else. Drop them and the page can read as a guarantee.
  "outside the project directory are not enforced",
  // A7 ships a browser gate that ran once and generated spec files nobody ran.
  // Both halves have to stay on the page: the run is the claim, and this is the
  // ceiling that would quietly drop off it first.
  // A7's ceiling MOVED on 2026-09-02: the generated specs are now executed in
  // CI and pass, so pinning "GENERATED, NOT EXECUTED" would force the page to
  // understate its own evidence. What it pins instead is the limit that would
  // drop off the page first now that there is a green suite to boast about —
  // one engine. A passing suite on one browser is not a compatibility rate.
  "Chromium only",
  // The one install prerequisite. Below Node 22 the ownership hook exits 0 and
  // enforces nothing, so a page that sells enforcement without naming the
  // version sells a guarantee the reader may not have. Pinned so it cannot be
  // trimmed away as boilerplate.
  "Node 22 or newer",
  "Bash-mediated writes bypass file-tool hooks",
  "Deviations logged: 1 (1 discovered by wavecheck)",
  "A2b",
  "drift",
  "one-file change",
  "NOTHING SAILS UNTIL IT LEAVES THE DOCK",
  // the seven lifecycle pieces. seatrial was missing here for two releases:
  // it shipped in v0.6.0 and the page never learned about it, so the flow strip
  // sold five steps for a six-step product. The literal list is what stops a
  // piece going quiet, and it can only do that for pieces somebody added to it.
  "planwright",
  "executor",
  "executor-isolated",
  "wavecheck",
  "replan",
  "seatrial",
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
// Same condition, named for the other thing it gates: checks that read repo
// files rather than the export are meaningless against an arbitrary fixture.
const checkRepoSources = arg === undefined;

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

// --- version drift, against plugin.json ------------------------------------
// The plugin version is hand-copied into content/copy.ts and README.md, so it
// drifts silently every release: 0.4.1 stayed on the live badge after the
// plugin went to 0.5.0, surviving a wave gate, a phase gate, a browser gate
// and a deploy, because the version was never one of the required literals.
// plugin.json is the single source of truth — everything else must agree.
if (checkRepoSources) {
  let pluginVersion;
  try {
    pluginVersion = JSON.parse(readFileSync(PLUGIN_JSON, "utf8")).version;
  } catch (err) {
    fail(`version drift: cannot read ${PLUGIN_JSON}: ${err.message}`);
  }
  if (pluginVersion !== undefined) {
    if (!/^\d+\.\d+\.\d+$/.test(pluginVersion)) {
      fail(`version drift: plugin.json version ${JSON.stringify(pluginVersion)} is not x.y.z`);
    }
    // Only presence is required. Older versions are legitimately cited as
    // history ("fixed in v0.3.0"), so an exhaustive match would forbid prose.
    if (!text.includes(`v${pluginVersion}`)) {
      fail(
        `version drift: the export does not render "v${pluginVersion}" — ` +
          `plugin.json says ${pluginVersion}, so VERSION in content/copy.ts is stale`
      );
    }
    let readme;
    try {
      readme = readFileSync(README, "utf8");
    } catch (err) {
      fail(`version drift: cannot read ${README}: ${err.message}`);
    }
    if (readme !== undefined && !readme.includes(`v${pluginVersion}`)) {
      fail(
        `version drift: README.md does not mention "v${pluginVersion}" — ` +
          `it carries the status line and drifted with copy.ts last time`
      );
    }
  }
}

// --- no relative-escape links ----------------------------------------------
// `href="../docs/…"` reads fine in a repo tree and 404s in production: on a
// Pages project site `../` climbs out of the basePath to the domain root, and
// docs/ is not deployed at all. Four such links shipped live before this check
// existed. Docs must be linked absolutely, on GitHub.
const ESCAPING = raw.match(/href="\.\.\/[^"]*"/g) ?? [];
for (const hit of [...new Set(ESCAPING)]) {
  fail(
    `relative-escape link: ${hit} climbs out of the basePath and 404s in ` +
      `production. Link docs absolutely (see REPO/BLOB in content/copy.ts).`
  );
}

// --- report ----------------------------------------------------------------
if (failures.length > 0) {
  console.error(`assert-copy: FAIL (${failures.length}) — ${target}`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(
  `assert-copy: PASS — ${target} (${REQUIRED.length} literals, ${executors}x executor, 1 h1${
    checkMotion ? ", motion contract, version matches plugin.json" : ", motion contract skipped: fixture mode"
  })`
);
