/**
 * Self-check for `validate-plan`'s ownership parsing. No framework, no fixtures
 * directory — plans are written to a temp dir and the real CLI is run on them.
 *
 *   node drydock/scripts/drydock-audit.test.mjs
 *
 * Exits 0 when every case behaves, 1 naming the ones that did not.
 *
 * Every case here fails against the pre-issue-#8 parser, which read only the
 * first line of a `Files owned:` bullet. That is the point: a truncated
 * ownership list raises no error anywhere — it just looks like a shorter list —
 * so the only way to catch a regression is to assert on a path that lives on a
 * continuation line and would otherwise vanish.
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const CLI = fileURLToPath(new URL("./drydock-audit.mjs", import.meta.url));
const DIR = mkdtempSync(join(tmpdir(), "drydock-audit-"));

const head = `---
plan: 900-fixture
format_version: 3
status: EXECUTING
---
`;

const validate = (name, body, strict = false) => {
  const file = join(DIR, `${name}.md`);
  writeFileSync(file, head + body);
  const args = strict ? ["validate-plan", "--strict", file] : ["validate-plan", file];
  const r = spawnSync("node", [CLI, ...args], { encoding: "utf8" });
  return `${r.stdout}${r.stderr}`;
};

// A wrapped list: `site/app/page.tsx` sits on the SECOND line, and a sibling in
// the same wave claims it. The collision is only visible if the continuation
// line was read.
const wrapped = (siblingOwns) => `
#### T1.0.1 — wrapped owner
- **Files owned:** \`site/lib/a.ts\`, \`site/lib/b.ts\`,
  \`site/app/page.tsx\`, \`site/lib/c.ts\`
- **Acceptance criterion:** \`true\` exits 0.

#### T1.0.2 — sibling
- **Files owned:** ${siblingOwns}
- **Acceptance criterion:** \`true\` exits 0.
`;

// A shape the parser deliberately does not consume: a blank line closes the
// bullet, so the sub-list below it is out of reach. `--strict` must say so
// rather than quietly enforcing 1 file out of 3.
const unreadable = `
#### T1.0.1 — blank line before the list
- **Files owned:** \`site/lib/a.ts\`

  - \`site/lib/b.ts\`
  - \`site/lib/c.ts\`
- **Acceptance criterion:** \`true\` exits 0.
`;

// The legitimate empty case — read-only tasks declare no files at all. It must
// not trip the count check.
const readOnly = `
#### T0 — baseline
- **Files owned:** — (read-only; writes §4 of this plan only)
- **Acceptance criterion:** \`true\` exits 0.
`;

const cases = [
  ["continuation-line path is parsed",
    () => validate("collide", wrapped("`site/app/page.tsx`")),
    (out) => out.includes("`site/app/page.tsx` is owned by both T1.0.1 and T1.0.2")],

  ["a clean wrapped list still passes",
    () => validate("clean", wrapped("`site/lib/d.ts`")),
    (out) => out.includes("validate-plan: PASS")],

  ["an unconsumable shape is reported, not dropped",
    () => validate("unreadable", unreadable, true),
    (out) => out.includes("block holds 3 backticked path(s) but 1 parsed")],

  ["a read-only task does not trip the count check",
    () => validate("readonly", readOnly, true),
    (out) => !out.includes("block holds")],
];

let failed = 0;
for (const [name, run, ok] of cases) {
  const out = run();
  if (ok(out)) {
    console.log(`ok   — ${name}`);
  } else {
    failed++;
    console.log(`FAIL — ${name}\n${out.split("\n").map((l) => `       ${l}`).join("\n")}`);
  }
}

console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed ? 1 : 0);
