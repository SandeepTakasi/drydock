/**
 * Path resolution for the ownership hook, extracted so it can be tested by
 * injecting a fake filesystem. Reproduces `resolveAncestry`/`realOr` from
 * `drydock/hooks/enforce-owns.mjs` (see plan 007's findings), plus three
 * changes over that inline version:
 *
 *  1. `realpathWithFallback` falls back to the JS `realpathSync` when
 *     `realpathSync.native` throws, instead of silently returning the
 *     original (unresolved) path. `realpath.native` is suspected -- not
 *     reproducible on this machine -- to fail categorically on some volumes
 *     (SMB shares, RAM disks, virtual filesystems) where the JS
 *     implementation still works. Untestable against the real filesystem
 *     here, which is exactly why the walk moved into an injectable module.
 *  2. The root and the target are resolved through the SAME resolver,
 *     because `realpathSync.native` and the JS `realpathSync` can disagree:
 *     measured with a Windows `subst` drive `Q:`, `native("Q:\\inner")`
 *     returns the underlying `C:\...` target while the JS version returns
 *     `Q:\inner` unchanged.
 *  3. A relative target is joined to the root with a bare string
 *     concatenation -- NEVER `path.resolve`/`path.join` on the raw target.
 *     Measured on Linux (node:20-slim): with `docs/esc -> ../site`, the
 *     relative target `docs/esc/../site/x.ts` was ALLOWED because
 *     `path.resolve` collapses the `..` textually before the kernel ever
 *     gets to follow the symlink, landing the write in `site/` instead of
 *     denying it. The absolute form was correctly denied. So the raw target
 *     keeps its `..` all the way down, and each ancestor is resolved one
 *     existing segment at a time -- the same climb `resolveAncestry` did.
 *
 * Node built-ins only. No `process.exit`, no stdin, no logging: this module
 * only resolves a path, or throws.
 */

import fs from "node:fs";
import path from "node:path";

/**
 * Resolve `p` with the native realpath, falling back to the JS
 * implementation when the native one throws. If the JS implementation also
 * throws, that error propagates (not the native one -- the native failure is
 * exactly the case this fallback exists to route around).
 */
export function realpathWithFallback(p, fsImpl = fs) {
  try {
    return fsImpl.realpathSync.native(p);
  } catch {
    return fsImpl.realpathSync(p);
  }
}

/**
 * Resolve `target` (relative or absolute) against `root` to the real,
 * symlink-resolved path of its deepest existing ancestor, with whatever
 * trailing segments do not exist yet re-appended lexically. Always returns
 * an absolute string; never returns a relative path.
 */
export function resolveTarget(root, target, fsImpl = fs) {
  const absolute = path.isAbsolute(target) ? target : root + path.sep + target;

  const skipped = [];
  let current = absolute;
  for (;;) {
    try {
      const real = realpathWithFallback(current, fsImpl);
      return skipped.length ? path.join(real, ...skipped) : real;
    } catch {
      let missing = false;
      try {
        fsImpl.lstatSync(current);
      } catch (lerr) {
        if (lerr.code === "ENOENT" || lerr.code === "ENOTDIR") missing = true;
        else throw lerr; // some other lstat failure: fail closed, do not climb past it
      }
      if (!missing) {
        // lstat succeeded where realpath just failed: this segment exists but
        // does not resolve (a dangling symlink/junction, a loop, or another
        // unreadable entry).
        throw new Error(`exists but does not resolve: ${current}`);
      }
    }
    const parent = path.dirname(current);
    if (parent === current) return skipped.length ? path.join(current, ...skipped) : current; // nothing in the chain exists
    skipped.unshift(path.basename(current));
    current = parent;
  }
}
