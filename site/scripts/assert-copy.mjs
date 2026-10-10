/**
 * Copy + contract assertions for the static export. Node built-ins only.
 *
 *   node scripts/assert-copy.mjs                # asserts out/index.html + out/evidence/index.html + section files
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

// Plan 012 D11: the literal lists split by page. The caveats moved to the
// evidence page with the matrix; everything else stays on home.
const REQUIRED_EVIDENCE = [
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
  "Bash-mediated writes bypass file-tool hooks",
  // A7 ships a browser gate that ran once and generated spec files nobody ran.
  // Both halves have to stay on the page: the run is the claim, and this is the
  // ceiling that would quietly drop off it first.
  // A7's ceiling MOVED on 2026-09-02: the generated specs are now executed in
  // CI and pass, so pinning "GENERATED, NOT EXECUTED" would force the page to
  // understate its own evidence. What it pins instead is the limit that would
  // drop off the page first now that there is a green suite to boast about —
  // one engine. A passing suite on one browser is not a compatibility rate.
  "Chromium only",
  "A2b",
  // Plan 015, A13: the scope-gate row must keep its single-repo caveat.
  "no other repository has used the Action yet",
];

const REQUIRED_HOME = [
  "APPROVED (HUMAN-ONLY)",
  "open pilot",
  "field benchmarks pending",
  // The one install prerequisite. A page that sells enforcement without naming
  // the runtime it needs sells a guarantee the reader may not have. Pinned so it
  // cannot be trimmed away as boilerplate.
  //
  // The FLOOR MOVED at 0.9.0, and this literal is why it had to move here too:
  // it pinned "Node 22 or newer" and so required the page to keep saying it
  // after the code stopped meaning it. The hook no longer calls
  // `path.matchesGlob` (it did not match dotfiles), so the 22 floor and the
  // fail-open-on-old-Node path both went with it; `engines` declares 20.17.0 and
  // CI tests 20, 22 and 24. A required literal is a claim this file is asserting
  // too, and a stale one turns the honesty gate into the thing keeping the page
  // wrong.
  "Node 20.17 or newer",
  "Deviations logged: 6 (3 discovered by wavecheck)",
  // Plan 012 D2: the hero excerpt must carry the row where the gate BLOCKed.
  "5. Deviation reconciliation | BLOCK",
  "drift",
  "one-file change",
  "NOTHING SAILS UNTIL IT LEAVES THE DOCK",
  // the nine lifecycle pieces. seatrial was missing here for two releases:
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
  // See A6 comment above these same literals in REQUIRED_EVIDENCE.
  "outside the project directory are not enforced",
  "Bash-mediated writes bypass file-tool hooks",
  // check and init joined the page in 0.16.0 (init itself shipped in 0.14.0).
  // The two sentence pins below pin check's ceiling now that A12 shows the
  // opt-in guard denying file-tool edits. The Bash half must stay on the page
  // beside it; without it the page could sell a guard that only covers file
  // tools as full enforcement and still go green.
  "/drydock:check",
  "/drydock:init",
  "file-tool edits outside that scope are denied",
  "Bash writes are still only detected.",
  // Plan 015: the hero promise.
  "Your agents build what you approved",
  // Plan 015: the planner entry command stays visible on the page.
  "/drydock:planwright",
  // Plan 015: scope-gate audits files, not lines.
  "It checks files, not lines",
  // Plan 015: the CI note must keep naming the trigger it refuses.
  "never pull_request_target",
  // Plan 015: the Superpowers path stays labelled unobserved.
  "not yet observed in a live session",
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

// Fixture mode (an argument) treats the argument as home only.
const pages = [{ label: "home", raw, text, required: REQUIRED_HOME, home: true }];
if (checkRepoSources) {
  const evPath = resolve(process.cwd(), "out/evidence/index.html");
  let evRaw;
  try {
    evRaw = readFileSync(evPath, "utf8");
  } catch (err) {
    console.error(`assert-copy: cannot read ${evPath}: ${err.message}`);
    process.exit(1);
  }
  pages.push({ label: "evidence", raw: evRaw, text: normalise(evRaw), required: REQUIRED_EVIDENCE, home: false });
}

let executors = 0;
for (const page of pages) {
  // --- required literals ---------------------------------------------------
  for (const lit of page.required) {
    if (!page.text.includes(lit)) fail(`${page.label}: missing required literal: ${JSON.stringify(lit)}`);
  }

  // --- the `executor` discriminator (home) ---------------------------------
  // `executor` and `executor-isolated` share kind "agents", and a substring
  // match on "executor" is also satisfied by "executor-isolated" alone. Two
  // occurrences is what proves both rows rendered.
  if (page.home) {
    executors = (page.text.match(/executor/g) ?? []).length;
    if (executors < 2) {
      fail(
        `expected >= 2 occurrences of "executor" (one bare, one in "executor-isolated"), found ${executors}`
      );
    }
  }

  // --- over-claim blocklist ------------------------------------------------
  for (const re of OVER_CLAIM) {
    const hit = page.text.match(re);
    if (hit) fail(`${page.label}: forbidden over-claim: ${JSON.stringify(hit[0])} matched ${re}`);
  }

  // --- heading contract (Decision 24), on the RAW markup -------------------
  const h1Opens = (page.raw.match(/<h1[\s/>]/gi) ?? []).length;
  if (h1Opens !== 1) {
    fail(`${page.label}: heading contract: expected exactly one <h1>, found ${h1Opens}`);
  } else {
    const pair = page.raw.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    if (!pair) fail(`${page.label}: heading contract: <h1> has no closing tag`);
    else if (page.home && !inner(pair[1]).includes("Drydock")) {
      fail(
        `heading contract: <h1> must contain "Drydock", got ${JSON.stringify(inner(pair[1]))}`
      );
    }
  }
}

// --- excerpt + pin checks, on home's script-stripped markup -----------------
// Scripts are stripped first: the RSC payload repeats every string and a
// mutation of the markup would otherwise be masked (or faked) by it.
const REPO_ROOT = join(HERE, "..", "..");
const markup = raw.replace(SCRIPT, " ").replace(COMMENT, "");
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? decode(m[1]) : undefined;
};
/** Every element whose opening tag carries `name`: [{ open, body }]. */
const elementsWith = (name) =>
  [...markup.matchAll(new RegExp(`<([a-zA-Z0-9]+)\\b[^>]*\\s${name}="[^"]*"[^>]*>([\\s\\S]*?)</\\1>`, "g"))].map(
    (m) => ({ open: m[0].slice(0, m[0].indexOf(">") + 1), body: m[2] })
  );
const readRepo = (rel, what) => {
  try {
    return readFileSync(resolve(REPO_ROOT, rel), "utf8");
  } catch (err) {
    fail(`${what}: cannot read repo file ${JSON.stringify(rel)}: ${err.message}`);
    return undefined;
  }
};
const flat = (s) => s.replace(/\*\*|`/g, "").replace(/\s+/g, " ").trim();

let excerptLines = 0;
const verdictOf = new Map();
const excerpts = elementsWith("data-excerpt-of");
for (const { open, body } of excerpts) {
  const p = attr(open, "data-excerpt-of");
  const src = readRepo(p, "excerpt");
  if (src === undefined) continue;
  // A plan, or the verification log the evidence rows cite (the hero tour
  // quotes both). Nothing else: an excerpt must come from a record.
  if (p.includes("..") || !(p.startsWith("docs/plans/") || p === "docs/verification-log.md")) {
    fail(`excerpt: data-excerpt-of must be a docs/plans/ path or docs/verification-log.md, got ${JSON.stringify(p)}`);
  }
  const source = flat(src);
  const lines = [...body.matchAll(/<span\b[^>]*>([\s\S]*?)<\/span>/g)].map((m) => flat(inner(m[1])));
  excerptLines += lines.length;
  if (lines.length < 6) fail(`excerpt: expected >= 6 lines, found ${lines.length} in ${p}`);
  if (lines.some((l) => l === "")) fail(`excerpt: an empty line in the excerpt of ${p}`);
  // Bind to ONE section: the first line must be a `##` to `####` heading, and
  // every line must be found in order inside that section only, which runs to
  // the next heading of the same or a higher level. Matching against the whole
  // file let a PASS re-audit of the same wave vouch for a BLOCK excerpt.
  const esc = (lines[0] ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const head = lines[0] ? new RegExp(`(?:^| )(#{2,4}) ${esc}`).exec(source) : null;
  if (!head) {
    fail(`excerpt: first line ${JSON.stringify(lines[0])} is not a "##" to "####" heading in ${p}`);
    continue;
  }
  const level = head[1].length;
  const at = head.index + head[0].indexOf("#");
  const nextHead = new RegExp(` #{1,${level}} `, "g");
  nextHead.lastIndex = at + level + 1;
  const next = nextHead.exec(source);
  const report = source.slice(at, next ? next.index : undefined);
  let pos = level + 1;
  for (const line of lines) {
    const j = line === "" ? -1 : report.indexOf(line, pos);
    if (j === -1) {
      fail(`excerpt: line ${JSON.stringify(line)} is not in order inside the report ${JSON.stringify(lines[0])} of ${p}`);
      continue;
    }
    pos = j + line.length;
  }
  verdictOf.set(p, lines[0].match(/\b(PASS|BLOCK)\b/)?.[1]);
}
// The figcaption badge sits outside the checked <pre>: bind it to the report too.
const badges = elementsWith("data-excerpt-verdict");
if (badges.length !== 1) {
  fail(`excerpt: expected exactly 1 data-excerpt-verdict element, found ${badges.length}`);
} else {
  const bp = attr(badges[0].open, "data-excerpt-verdict");
  const text = decode(inner(badges[0].body)).trim();
  if (!verdictOf.has(bp)) {
    fail(`excerpt: data-excerpt-verdict ${JSON.stringify(bp)} matches no data-excerpt-of`);
  } else if (text !== verdictOf.get(bp)) {
    fail(`excerpt: verdict badge reads ${JSON.stringify(text)} but the bound report heading says ${JSON.stringify(verdictOf.get(bp))}`);
  }
}
// The hero tour: five scenes, one per part of the loop. Losing one would
// leave a capability on the page with nothing real behind it.
if (checkRepoSources && excerpts.length !== 5) {
  fail(`excerpt: expected the 5 hero tour scenes, found ${excerpts.length} data-excerpt-of element(s)`);
}
if (excerpts.length < 1 || excerptLines < 1) {
  fail(`excerpt: expected >= 1 data-excerpt-of element with >= 1 line, found ${excerpts.length} element(s), ${excerptLines} line(s)`);
}

const pins = elementsWith("data-pin");
for (const { open, body } of pins) {
  const s = attr(open, "data-source");
  const x = attr(open, "data-pin");
  if (!s || !x) {
    fail(`pin: element has data-pin without data-source (or vice versa): ${open}`);
    continue;
  }
  if (!(s.startsWith("drydock/") || s.startsWith("scope-gate/")) || s.includes("..")) {
    fail(`pin: data-source must be a drydock/ or scope-gate/ path, got ${JSON.stringify(s)}`);
  }
  const src = readRepo(s, "pin");
  if (src !== undefined && !src.includes(x)) fail(`pin: ${JSON.stringify(x)} is not in ${s}`);
  if (!inner(body).includes(x)) fail(`pin: rendered text does not contain ${JSON.stringify(x)} (source ${s})`);
}
if (pins.length !== 5) fail(`pin: expected exactly 5 data-pin elements on home, found ${pins.length}`);

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
const ESCAPING = pages.flatMap((p) => p.raw.match(/href="\.\.\/[^"]*"/g) ?? []);
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
  `assert-copy: PASS — ${target} (${pages.map((p) => `${p.label}: ${p.required.length} literals`).join(", ")}; ${executors}x executor, 1 h1 per page, ${excerpts.length} excerpt (${excerptLines} lines), ${pins.length} pins${
    checkMotion ? ", motion contract, version matches plugin.json" : ", evidence page and motion contract skipped: fixture mode"
  })`
);
