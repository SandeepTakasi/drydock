/**
 * Plain-script suite for drydock-stats.mjs. Fixtures live in os.tmpdir and are
 * removed at the end. Run: node drydock-stats.test.mjs
 */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "drydock-stats.mjs");
const TMP = mkdtempSync(join(tmpdir(), "drydock-stats-"));
let n = 0;

const SLUG = "008-x";
// one usage line; fields in order input, cache_create, cache_read, output
const u = (id, i, c, r, o) =>
  JSON.stringify({ ...(id ? { requestId: id } : {}), message: { usage: { input_tokens: i, cache_creation_input_tokens: c, cache_read_input_tokens: r, output_tokens: o } } });
const mention = (s = SLUG) => JSON.stringify({ type: "user", message: { content: `working on ${s}` } });

// files: relative path under projects/ -> array of lines (or raw string)
function run(files, extra = []) {
  const dir = join(TMP, `f${n++}`);
  mkdirSync(join(dir, "plans"), { recursive: true });
  writeFileSync(join(dir, "plans", `${SLUG}.md`), `---\nplan: ${SLUG}\n---\n`);
  writeFileSync(join(dir, "plans", "009-other.md"), "---\nplan: 009-other\n---\n");
  for (const [rel, body] of Object.entries(files)) {
    const p = join(dir, "projects", rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, Array.isArray(body) ? body.join("\n") + "\n" : body);
  }
  mkdirSync(join(dir, "projects"), { recursive: true });
  const r = spawnSync(process.execPath, [CLI, join(dir, "plans", `${SLUG}.md`), "--projects", join(dir, "projects"), ...extra], { encoding: "utf8" });
  return { code: r.status, out: r.stdout + r.stderr };
}
// numbers on the row for a bucket: [input, cache_create, cache_read, output, total]
const row = (out, bucket) => {
  const l = out.split("\n").find((x) => x.startsWith(bucket));
  return l ? l.slice(bucket.length).match(/\d+/g).map(Number) : null;
};
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const cases = [
  ["counts a requestId once", () => {
    const r = run({ "s.jsonl": [mention(), u("A", 1, 2, 3, 4), u("A", 1, 2, 3, 4)] });
    return eq(row(r.out, "orchestration"), [1, 2, 3, 4, 10]);
  }],
  ["keeps the final usage of a request", () => {
    // partial then final (larger), and the larger line first in another id
    const r = run({ "s.jsonl": [mention(), u("A", 10, 20, 30, 5), u("A", 10, 20, 30, 50), u("B", 1, 1, 1, 9), u("B", 1, 1, 1, 2)] });
    return eq(row(r.out, "orchestration"), [11, 21, 31, 59, 122]);
  }],
  ["counts a request shared by two session files once", () => {
    const r = run({
      "a.jsonl": [mention(), u("B", 1, 2, 3, 4), u("C", 100, 0, 0, 7)],
      "b.jsonl": [mention(), u("B", 1, 2, 3, 4)],
    });
    return eq(row(r.out, "orchestration"), [101, 2, 3, 11, 117]) && r.out.includes("across 2 session(s)");
  }],
  ["splits executor subagents into execution", () => {
    const meta = (t) => JSON.stringify({ agentType: t });
    const r = run({
      "s.jsonl": [mention(), u("A", 1, 1, 1, 1)],
      "s/subagents/agent-1.jsonl": [mention(), u("E", 5, 5, 5, 5)],
      "s/subagents/agent-1.meta.json": meta("drydock:executor"),
      "s/subagents/agent-2.jsonl": [mention(), u("F", 2, 2, 2, 2)],
      "s/subagents/agent-2.meta.json": meta("general-purpose"),
      "s/subagents/agent-3.jsonl": [mention(), u("G", 1, 0, 0, 0)], // no meta
    });
    // total 4 + 20 + 8 + 1 = 33; overhead (4 + 9) / 33 = 39.4%
    return eq(row(r.out, "orchestration"), [1, 1, 1, 1, 4]) && eq(row(r.out, "execution"), [5, 5, 5, 5, 20])
      && eq(row(r.out, "other subagents"), [3, 2, 2, 2, 9]) && r.out.includes("overhead: 39.4% (orchestration + other subagents) of 33 tokens");
  }],
  ["ignores a subagent that never mentions the plan", () => {
    const r = run({
      "s.jsonl": [mention(), u("A", 1, 1, 1, 1)],
      "s/subagents/agent-1.jsonl": [u("E", 900, 900, 900, 900)],
      "s/subagents/agent-1.meta.json": JSON.stringify({ agentType: "drydock:executor" }),
    });
    return eq(row(r.out, "execution"), [0, 0, 0, 0, 0]) && r.out.includes("of 4 tokens");
  }],
  ["ignores sessions that never mention the plan", () => {
    const r = run({
      "a.jsonl": [mention(), u("A", 1, 1, 1, 1)],
      "b.jsonl": [u("Z", 900, 900, 900, 900)],
    });
    return eq(row(r.out, "orchestration"), [1, 1, 1, 1, 4]) && r.out.includes("across 1 session(s)") && !r.out.includes("b  ");
  }],
  ["names other plans a session mentions", () => {
    const r = run({
      "a.jsonl": [mention(), mention("009-other"), mention("010-no-such-plan"), u("A", 1, 1, 1, 1)],
      "b.jsonl": [mention(), u("B", 2, 2, 2, 2)],
    });
    const l = (id) => r.out.split("\n").find((x) => x.startsWith(id + "  "));
    return l("a") === "a  4  also mentions: 009-other" && l("b") === "b  8  also mentions: none";
  }],
  ["exits 1 when no session mentions the plan", () => {
    const r = run({ "a.jsonl": [u("A", 1, 1, 1, 1)] });
    return r.code === 1 && r.out.includes(`mentions ${SLUG}`);
  }],
];

let failed = 0;
for (const [name, fn] of cases) {
  let pass = false;
  try { pass = fn(); } catch (e) { console.log(`       ${e.message}`); }
  if (pass) console.log(`ok   — ${name}`);
  else { failed++; console.log(`FAIL — ${name}`); }
}
rmSync(TMP, { recursive: true, force: true });
console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed ? 1 : 0);
