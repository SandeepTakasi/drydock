// The excerpt check, proven both ways. Injects excerpts into the built home
// page and runs assert-copy on it in fixture mode: real lines quoted from their
// section must pass, and a reordered, invented, cross-section or unrecorded
// excerpt must fail. The PASS set is the hero tour's scenes, so this also
// proves every tour line is verbatim before the page uses it.
//
//   node site/scripts/assert-copy.excerpt.test.mjs   (builds site/out if absent)
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOME = join(SITE, "out", "index.html");
if (!existsSync(HOME)) spawnSync("npx next build", { cwd: SITE, shell: true, stdio: "ignore" });
const base = readFileSync(HOME, "utf8");

const LOG = "docs/verification-log.md";
const SCENES = {
  plan: ["docs/plans/014-scope-gate-action.md", [
    "T1.1.1 - gate.mjs and its test",
    "- Files owned: scope-gate/gate.mjs, scope-gate/gate.test.mjs",
    "- Depends on: T0",
    "- Model / thinking: Complex / extended (Sonnet 5.5) Executor: drydock:executor",
    "- Forbidden: editing drydock-audit.mjs or any file outside owns",
    "- Acceptance criterion: node -e",
  ]],
  guard: [LOG, [
    "A12 — arm guard in a live session",
    "arm: armed 1 glob(s) from .drydock/check.md",
    "Drydock ownership violation: wave check does not own tmp-a12/stray.txt.",
    "Owned by this wave: tmp-a12/ok.txt",
    "check: PASS (1 file(s), 0 criteria)",
    "FLAG outside scope: tmp-a12/bash.txt",
    "check: FLAG (1)",
  ]],
  ci: [LOG, [
    "A13 — scope-gate Action on real pull requests",
    "- Files owned: scope-gate-probe/**",
    "- Acceptance criterion: node scope-gate/gate.test.mjs",
    "check: PASS (1 file(s), 1 criteria)",
    "FLAG outside scope: stray-probe.txt",
    "check: FLAG (1)",
    "Check-run annotation: stray-probe.txt: outside the scope declared in #25.",
  ]],
  reconcile: ["docs/plans/015-release-019-site.md", [
    "Proposals",
    "Proposal R1 | target: CLAUDE.md | kind: addition",
    "Finding: 375px horizontal page scroll shipped through four PASS wave gates",
    "Confidence: high",
    "+- whitespace-nowrap inside a grid or flex child widens the page.",
    "Proposal R2 | target: CLAUDE.md | kind: correction",
    "Proposal R3 | target: CLAUDE.md | kind: addition",
  ]],
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const pre = (src, lines) =>
  `<pre data-excerpt-of="${src}">${lines.map((l) => `<span>${esc(l)}</span>`).join("")}</pre>`;
const dir = mkdtempSync(join(tmpdir(), "excerpt-"));
const run = (name, blocks) => {
  const f = join(dir, `${name}.html`);
  writeFileSync(f, base.replace("</main>", `${blocks.join("")}</main>`));
  const r = spawnSync(process.execPath, [join(SITE, "scripts", "assert-copy.mjs"), f], { encoding: "utf8" });
  return { status: r.status, err: r.stderr };
};

const g = SCENES.guard[1];
const cases = [
  ["all tour scenes pass", 0, Object.values(SCENES).map(([s, l]) => pre(s, l))],
  ["reordered lines fail", 1, [pre(LOG, [g[0], g[2], g[1], ...g.slice(3)])]],
  ["an invented line fails", 1, [pre(LOG, [...g.slice(0, 6), "check: PASS (0 file(s), 0 criteria)"])]],
  ["a line from another section fails", 1, [pre(LOG, [...g.slice(0, 6), "FLAG outside scope: stray-probe.txt"])]],
  ["an unrecorded source fails", 1, [pre("docs/compatibility.md", g)]],
  ["a non-heading first line fails", 1, [pre(LOG, g.slice(1))]],
];

let failed = 0;
for (const [name, want, blocks] of cases) {
  const { status, err } = run(name.replace(/\W+/g, "-"), blocks);
  const ok = status === want;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name} (exit ${status}, want ${want})${ok || want ? "" : "\n" + err}`);
}
console.log(failed ? `FAIL, ${failed} of ${cases.length} cases` : `PASS, ${cases.length} cases`);
process.exit(failed ? 1 : 0);
