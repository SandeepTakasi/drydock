/**
 * Glob matching for ownership globs. Node built-ins only, no dependencies.
 *
 * This replaced `path.matchesGlob`, which was wrong here in two ways. It does
 * not match dotfiles: `matchesGlob("src/.env", "src/**")` is false, so a task
 * owning `src/**` could not own `src/.env`, `.eslintrc` or `.storybook/*`, and
 * the hook denied writes to files the plan said the task owned. And it is Node
 * >= 20.17 only, which put a runtime floor on the whole plugin for one function.
 * Fifteen lines of regex removes both problems.
 *
 * Supported, which is all an `owns` glob has ever used:
 *   **   any number of path segments
 *   *    any run of characters within one segment
 *   ?    one character within one segment
 *
 * Everything else is matched literally.
 */

const escape = (s) => s.replace(/[.+^${}()|[\]\\]/g, "\\$&");

const toRegExp = (glob) => {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        // `**/` spans zero or more segments, so `a/**/b` matches `a/b`.
        if (glob[i + 2] === "/") { out += "(?:.*/)?"; i += 2; } else { out += ".*"; i += 1; }
      } else {
        out += "[^/]*";
      }
    } else if (c === "?") {
      out += "[^/]";
    } else {
      out += escape(c);
    }
  }
  return new RegExp(`^${out}$`);
};

/** True when `rel` (repo-relative, POSIX separators) is inside `globs`. */
export const matchesOwns = (rel, globs) =>
  globs.some((glob) => rel === glob || toRegExp(glob).test(rel));

export { toRegExp as globToRegExp };
