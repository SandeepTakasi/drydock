/**
 * Token usage per Drydock plan, from the host's session transcripts.
 * Node built-ins only. Reads the plan and the projects dir; writes nothing.
 *
 *   node drydock-stats.mjs <plan.md> [--projects <dir>]
 *
 * Exit codes: 0 report printed, 1 no transcript mentions the plan, 2 usage,
 * 3 could not run.
 *
 * HOW A PLAN'S TOKENS ARE FOUND. No transcript field names a plan, so a main
 * session counts (bucket `orchestration`) when its text contains the plan slug,
 * and a subagent counts only when ITS OWN transcript contains the slug
 * (`execution` for drydock:executor, else `other subagents`). One row per main
 * session names every other plan it mentions, so a shared session is visible.
 *
 * USAGE IS DEDUPLICATED GLOBALLY. A request writes several usage lines (stream
 * partials, the later always larger) and resumed/forked sessions copy history
 * into other files. Keyed on `requestId` across every counted file, keeping the
 * max of each field. A line with no `requestId` counts individually.
 */

import { readFileSync, readdirSync, existsSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve, basename } from "node:path";
import { homedir } from "node:os";

const FIELDS = ["input_tokens", "cache_creation_input_tokens", "cache_read_input_tokens", "output_tokens"];
const BUCKETS = ["orchestration", "execution", "other subagents"];

function die(code, msg) {
  console.error(msg);
  process.exit(code);
}

const args = process.argv.slice(2);
let planArg = null;
let projectsArg = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--projects") projectsArg = args[++i];
  else if (!planArg) planArg = args[i];
  else planArg = null, i = args.length;
}
if (!planArg || (args.includes("--projects") && !projectsArg)) {
  die(2, "usage: drydock-stats.mjs <plan.md> [--projects <dir>]");
}

let planText, planDir, slug, projectsDir;
try {
  const planPath = resolve(planArg);
  planText = readFileSync(planPath, "utf8");
  planDir = dirname(planPath);
  slug = (/^plan:[ \t]*(\S+)/m.exec(planText.split(/^---\s*$/m)[1] || "") || [])[1]
    || basename(planPath, ".md");
  if (projectsArg) {
    projectsDir = resolve(projectsArg);
  } else {
    const top = execFileSync("git", ["-C", planDir, "rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
    const root = realpathSync.native(top);
    projectsDir = join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude"), "projects", root.replace(/[^A-Za-z0-9]/g, "-"));
  }
} catch (e) {
  die(3, `drydock-stats: could not run: ${e.code === "ENOENT" ? "no such file: " + (e.path || planArg) : e.message}`);
}

const read = (p) => { try { return readFileSync(p, "utf8"); } catch { return null; } };

// ---- collect counted files, in a fixed order (main sessions, then subagents)
const mains = [];
const subs = [];
let entries = [];
try { entries = readdirSync(projectsDir, { withFileTypes: true }); } catch { /* absent dir = nothing found */ }
entries.sort((a, b) => (a.name < b.name ? -1 : 1));
for (const e of entries) {
  if (e.isFile() && e.name.endsWith(".jsonl")) {
    const text = read(join(projectsDir, e.name));
    if (text !== null && text.includes(slug)) mains.push({ id: e.name.slice(0, -6), text, bucket: "orchestration" });
  } else if (e.isDirectory()) {
    const sd = join(projectsDir, e.name, "subagents");
    let files = [];
    try { files = readdirSync(sd).filter((f) => /^agent-.*\.jsonl$/.test(f)).sort(); } catch { continue; }
    for (const f of files) {
      const text = read(join(sd, f));
      if (text === null || !text.includes(slug)) continue;
      let type = "";
      try { type = String(JSON.parse(read(join(sd, f.replace(/\.jsonl$/, ".meta.json"))) || "").agentType || ""); } catch { /* other subagents */ }
      subs.push({ id: f, text, bucket: type.startsWith("drydock:executor") ? "execution" : "other subagents" });
    }
  }
}
if (!mains.length) {
  console.log(`drydock-stats: no transcript in ${projectsDir} mentions ${slug}`);
  process.exit(1);
}

// ---- usage, deduplicated globally on requestId, max per field
const byId = new Map(); // requestId -> {u, file}
const loose = []; // lines with no requestId
for (const file of [...mains, ...subs]) {
  for (const line of file.text.split("\n")) {
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    const usage = o && o.message && o.message.usage;
    if (!usage || typeof usage !== "object") continue;
    const u = FIELDS.map((k) => Number(usage[k]) || 0);
    if (typeof o.requestId !== "string" || !o.requestId) { loose.push({ u, file }); continue; }
    const have = byId.get(o.requestId);
    if (!have) byId.set(o.requestId, { u, file });
    else have.u = have.u.map((v, i) => Math.max(v, u[i]));
  }
}

const sum = (a) => a.reduce((x, y) => x + y, 0);
const per = (pred) => {
  const t = [0, 0, 0, 0];
  for (const { u, file } of [...byId.values(), ...loose]) if (pred(file)) u.forEach((v, i) => (t[i] += v));
  return t;
};

const rows = BUCKETS.map((b) => [b, per((f) => f.bucket === b)]);
const total = sum(rows.flatMap(([, t]) => t));
const over = sum([...rows[0][1], ...rows[2][1]]);

const pad = (s, n) => String(s).padEnd(n);
console.log(`${pad("bucket", 16)}${pad("input", 12)}${pad("cache_create", 14)}${pad("cache_read", 14)}${pad("output", 12)}total`);
for (const [b, t] of rows) console.log(pad(b, 16) + t.map((v, i) => pad(v, [12, 14, 14, 12][i])).join("") + sum(t));
console.log(`overhead: ${total ? ((100 * over) / total).toFixed(1) : "0.0"}% (orchestration + other subagents) of ${total} tokens across ${mains.length} session(s)`);
for (const m of mains) {
  const others = [...new Set(m.text.match(/[0-9]{3}-[a-z0-9-]+/g) || [])]
    .filter((s) => s !== slug && existsSync(join(planDir, s + ".md")));
  console.log(`${m.id}  ${sum(per((f) => f === m))}  also mentions: ${others.length ? others.join(", ") : "none"}`);
}
console.log(`a session that mentions ${slug} is counted whole, including unrelated work in it; tokens, not cost`);
