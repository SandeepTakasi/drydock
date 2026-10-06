/**
 * Self-check for the path resolver extracted from the ownership hook.
 *
 *   node drydock/lib/resolve-target.test.mjs
 *
 * Every case but the last uses a FAKE `fsImpl` -- the whole reason this walk
 * moved into its own module is that the fallback path (`realpathSync.native`
 * throwing, `realpathSync` succeeding) is not reproducible on this machine
 * and can only be exercised by injection. See resolve-target.mjs for the
 * three behaviours this module must get right that the old inline version
 * did not have to prove: the native-then-JS fallback, one resolver used for
 * both root and target, and NO textual normalization of the raw target
 * (`path.resolve`/`path.join` would collapse a `..` before a symlink in the
 * chain ever gets a chance to redirect it -- plan 007's Linux repro).
 */

import { realpathWithFallback, resolveTarget } from "./resolve-target.mjs";
import { mkdtempSync, mkdirSync, symlinkSync, realpathSync, rmSync } from "node:fs";
import { join, sep } from "node:path";
import { tmpdir } from "node:os";

let total = 0;
let failed = 0;
const report = (name, ok, detail) => {
  total++;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name.padEnd(42)} ${detail ?? ""}`);
};

const enoent = (p) => Object.assign(new Error(`ENOENT: ${p}`), { code: "ENOENT" });

// --- realpathWithFallback ---------------------------------------------------

{
  // fallback-native-throws: native throws, JS returns a path; the result is
  // the JS path.
  const calls = [];
  const fake = {
    realpathSync: Object.assign(
      (p) => {
        calls.push(p);
        return "/resolved/by-js";
      },
      {
        native: () => {
          throw new Error("native realpath unavailable");
        },
      }
    ),
  };
  const result = realpathWithFallback("/some/path", fake);
  report(
    "fallback-native-throws",
    result === "/resolved/by-js" && calls[0] === "/some/path",
    `result=${JSON.stringify(result)}`
  );
}

// --- resolveTarget: denial on an unresolvable existing segment -------------

{
  // dangling-denied: both realpaths throw, lstat succeeds; resolveTarget
  // throws "exists but does not resolve".
  const fake = {
    realpathSync: Object.assign(
      () => {
        throw new Error("js realpath fails too");
      },
      {
        native: () => {
          throw new Error("native realpath fails");
        },
      }
    ),
    lstatSync: () => ({ isSymbolicLink: () => true }), // segment exists, just won't resolve
  };
  let threw = null;
  try {
    resolveTarget("/repo", "dangle.txt", fake);
  } catch (e) {
    threw = e;
  }
  report(
    "dangling-denied",
    threw !== null && /exists but does not resolve/.test(threw.message),
    `message=${JSON.stringify(threw?.message)}`
  );
}

// --- resolveTarget: climbs past a genuinely absent leaf ---------------------

{
  // absent-climbs: ENOENT at the leaf, an ancestor resolves; result is that
  // ancestor plus the skipped segments. `resolveTarget` joins root and
  // target with a bare `path.sep`, so the ancestor it will probe is
  // "/repo" + sep + "site" -- computed the same way here rather than
  // hardcoding a separator this case does not control.
  const ancestor = "/repo" + sep + "site";
  const fake = {
    realpathSync: Object.assign(
      (p) => {
        if (p === ancestor) return "/real/site"; // the ancestor that resolves
        throw new Error("does not resolve: " + p);
      },
      { native: () => { throw new Error("native unavailable"); } }
    ),
    lstatSync: () => {
      throw enoent("leaf or ancestor, both absent below the resolving one");
    },
  };
  const result = resolveTarget("/repo", "site/new.ts", fake);
  report(
    "absent-climbs",
    result === join("/real/site", "new.ts"),
    `result=${JSON.stringify(result)}`
  );
}

// --- resolveTarget: the raw target is never textually normalized -----------

{
  // relative-dotdot-unnormalised: a relative target containing a `..`
  // segment. The fake records the FIRST string passed to realpath and the
  // case asserts it still contains the `..` segment -- i.e. it was not
  // collapsed by path.resolve/path.join before ever reaching a resolver.
  const seen = [];
  const fake = {
    realpathSync: Object.assign(
      (p) => {
        seen.push(p);
        throw new Error("never resolves: " + p);
      },
      { native: (p) => { seen.push(p); throw new Error("native never resolves: " + p); } }
    ),
    lstatSync: (p) => {
      throw enoent(p); // nothing exists anywhere in the chain
    },
  };
  try {
    resolveTarget("/repo", "docs/esc/../site/x.ts", fake);
  } catch {
    // root-fixed-point territory; irrelevant here, only the first probe matters
  }
  report(
    "relative-dotdot-unnormalised",
    seen.length > 0 && seen[0].includes(".."),
    `first probe=${JSON.stringify(seen[0])}`
  );
}

// --- resolveTarget: terminates when nothing in the chain exists ------------

{
  // root-fixed-point: nothing in the chain exists; the walk terminates and
  // returns the joined path instead of looping forever.
  const fake = {
    realpathSync: Object.assign(
      () => {
        throw new Error("nothing resolves");
      },
      { native: () => { throw new Error("nothing resolves natively"); } }
    ),
    lstatSync: (p) => {
      throw enoent(p); // every segment, including the eventual root, is absent
    },
  };
  const result = resolveTarget("/repo", "a/b/c.ts", fake);
  report(
    "root-fixed-point",
    result === join("/", "repo", "a", "b", "c.ts"),
    `result=${JSON.stringify(result)}`
  );
}

// --- resolveTarget: an unexpected lstat error is fail-closed too -----------

{
  // other-lstat-error: lstat fails with something other than ENOENT/ENOTDIR;
  // it is rethrown rather than being treated as "absent, keep climbing".
  const fake = {
    realpathSync: Object.assign(
      () => {
        throw new Error("does not resolve");
      },
      { native: () => { throw new Error("does not resolve natively"); } }
    ),
    lstatSync: (p) => {
      throw Object.assign(new Error(`EACCES: permission denied, lstat '${p}'`), { code: "EACCES" });
    },
  };
  let threw = null;
  try {
    resolveTarget("/repo", "locked.txt", fake);
  } catch (e) {
    threw = e;
  }
  report(
    "other-lstat-error",
    threw !== null && threw.code === "EACCES",
    `code=${threw?.code}`
  );
}

// --- resolveTarget: the default fs argument works against a real disk ------

// `realpathSync.native`, NOT the JS `realpathSync`, and the distinction is the
// whole reason this comment exists. The two disagree on Windows 8.3 short names:
// JS keeps `REPRO8~2`, native expands it to the long directory name. The module
// under test resolves through `realpathWithFallback`, which tries `native`
// first, so a fixture normalised with the JS version describes the same
// directory by a different name and the assertion below can never match. It
// passed on this machine and on ubuntu because neither has a short component in
// `tmpdir`; it failed on every windows-latest runner, whose temp path is
// `C:\Users\RUNNER~1\AppData\Local\Temp`. Measured 2026-10-06, CI run 46. This
// is plan 007's decision D5 ("one resolver for both sides, or the comparison is
// meaningless") applied to the fixture rather than the hook.
{
  const dir = realpathSync.native(mkdtempSync(join(tmpdir(), "resolve-target-real-")));
  mkdirSync(join(dir, "inner"), { recursive: true });
  let result;
  let ok = true;
  try {
    result = resolveTarget(dir, join("inner", "new-file.txt")); // no fsImpl: real fs
  } catch {
    ok = false;
  }
  report(
    "real-fs-default-argument",
    ok && result === join(dir, "inner", "new-file.txt"),
    `result=${JSON.stringify(result)}`
  );
  rmSync(dir, { recursive: true, force: true });
}

// A second real-fs case, only run where symlinks are cheap to create (this
// self-check must not require elevated privileges to pass on Windows CI, so
// it tolerates symlinkSync failing and just skips rather than failing the
// suite).
{
  const dir = realpathSync.native(mkdtempSync(join(tmpdir(), "resolve-target-real-link-")));
  mkdirSync(join(dir, "site"), { recursive: true });
  let linked = true;
  // skip-only-on-link-failure: this try covers ONLY link creation. A box
  // without symlink privilege (e.g. Windows without Developer Mode) throws
  // EPERM here, which is a legitimate skip. resolveTarget and the assertion
  // below run OUTSIDE this try, so once the link exists, any throw from the
  // resolver itself is an uncaught FAIL, never swallowed into a skip.
  try {
    symlinkSync(join(dir, "site"), join(dir, "docs-link"), "junction");
  } catch (e) {
    report("real-fs-resolves-through-symlink", true, `skipped: ${e.message}`);
    linked = false;
  }
  if (linked) {
    const result = resolveTarget(dir, join("docs-link", "x.ts"));
    report(
      "real-fs-resolves-through-symlink",
      result === join(dir, "site", "x.ts"),
      `result=${JSON.stringify(result)}`
    );
  }
  rmSync(dir, { recursive: true, force: true });
}

console.log(failed === 0 ? `\nresolve-target: PASS, ${total} cases` : `\nresolve-target: FAIL, ${failed} of ${total} case(s)`);
process.exit(failed ? 1 : 0);
