import { hero, install, site } from "@/content/copy";

const TONE_CLASS = {
  dim: "text-ink-dim",
  pass: "text-pass",
  block: "text-block",
} as const;

/**
 * The page's opening element, a server component with no entrance animation:
 * the LCP text paints at full opacity on first byte.
 *
 * Left column: badges, the plain `<h1>`, the promise, the sub line, both
 * install commands (visible at every width, an extra copy of the `#install`
 * section's), and the two CTAs. At `lg` a mono block sits beside it rendering
 * `hero.artifact`, a real wavecheck BLOCK excerpt from plan 004. Each line is
 * one `<span>` holding exactly `line.text`; the `<pre>` names its source file
 * in `data-excerpt-of` so assert-copy can check every line against that plan.
 * Below both, the thesis band.
 *
 * Exempt from the `Section` shell (plan 001 Decision 18): no eyebrow, no
 * `<h2>`. The wave diagram now lives in the loop section.
 */
export default function Hero() {
  const { artifact } = hero;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pt-16 pb-20 sm:px-10 sm:pt-24">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0">
          <ul className="flex flex-wrap items-center gap-2 font-mono text-mark uppercase">
            <li className="border border-accent px-2 py-1 text-accent">
              {hero.kicker}
            </li>
            {hero.badges.map((badge) => (
              <li
                key={badge}
                className="border border-line px-2 py-1 text-ink-dim"
              >
                {badge}
              </li>
            ))}
          </ul>

          <h1 className="mt-8 font-display text-display font-semibold text-ink">
            {hero.headline}
          </h1>

          <p className="mt-6 max-w-3xl font-display text-promise text-ink">
            {hero.promise}
          </p>

          <p className="mt-6 max-w-2xl text-lead text-ink-dim">{hero.sub}</p>

          <div className="mt-8 flex flex-col gap-2 border border-line bg-surface px-4 py-3">
            {install.commands.map((cmd) => (
              <code
                key={cmd}
                className="font-mono text-note break-all text-ink"
              >
                {cmd}
              </code>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="#install"
              className="bg-accent px-4 py-2 font-mono text-mark text-ground uppercase transition-opacity hover:opacity-90"
            >
              {hero.ctaPrimary}
            </a>
            <a
              href={site.selfAuditHref}
              className="border border-line px-4 py-2 font-mono text-mark text-ink-dim uppercase transition-colors hover:border-line-strong hover:text-ink"
            >
              {site.selfAuditLinkText}
            </a>
          </div>
        </div>

        <figure className="min-w-0 border border-line bg-surface">
          <figcaption className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 font-mono text-mark uppercase">
            <span className="text-ink-dim">{artifact.label}</span>
            <span className="border border-block px-2 py-1 text-block">
              {artifact.verdict}
            </span>
          </figcaption>
          <div className="overflow-x-auto px-4 py-5">
            <pre
              data-excerpt-of={artifact.source}
              className="font-mono text-note whitespace-pre"
            >
              {artifact.lines.map((line) => (
                <span
                  key={line.text}
                  className={`block ${TONE_CLASS[line.tone]}`}
                >
                  {line.text}
                </span>
              ))}
            </pre>
          </div>
          <p className="border-t border-line px-4 py-3 text-note text-ink-dim">
            {artifact.caption}{" "}
            <a
              href={artifact.href}
              className="text-accent underline underline-offset-2"
            >
              {artifact.source}
            </a>
          </p>
        </figure>
      </div>

      <div className="mt-16 flex items-center gap-4">
        <span className="h-px w-8 shrink-0 bg-line-strong" />
        <span className="font-mono text-mark text-accent uppercase">
          {hero.thesis}
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}
