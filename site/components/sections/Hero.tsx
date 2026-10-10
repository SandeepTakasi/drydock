import HeroTour from "@/components/HeroTour";
import { hero, install, site } from "@/content/copy";

/**
 * The page's opening element, a server component with no entrance animation:
 * the LCP text paints at full opacity on first byte.
 *
 * Left column: one quiet meta line, the plain `<h1>`, the promise, the sub
 * line, both install commands (from `lg` up only, one scrollable line each),
 * and the CTAs. Beside it at `lg` (below it on narrower screens) sits
 * `HeroTour`: five real moments from the repo as tabs, each line checked by
 * assert-copy against the plan or verification-log section it quotes.
 * Below both, the thesis band.
 *
 * Exempt from the `Section` shell (plan 001 Decision 18): no eyebrow, no
 * `<h2>`. The wave diagram now lives in the loop section.
 */
export default function Hero() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 pt-16 pb-20 sm:px-10 sm:pt-24">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0">
          <p className="flex flex-wrap gap-x-2 font-mono text-mark text-ink-dim uppercase">
            {hero.meta.split(" · ").map((item, i) => (
              <span key={item} className="whitespace-nowrap">
                {i > 0 ? "· " : ""}
                {item}
              </span>
            ))}
          </p>

          <h1 className="mt-6 font-display text-display font-semibold brand-text">
            {hero.headline}
          </h1>

          <p className="mt-6 max-w-3xl font-display text-promise text-ink">
            {hero.promise}
          </p>

          <p className="mt-6 max-w-2xl text-lead text-ink-dim">{hero.sub}</p>

          <div className="mt-8 hidden flex-col gap-2 border border-line bg-surface px-4 py-3 lg:flex">
            {install.commands.map((cmd) => (
              <code
                key={cmd}
                className="overflow-x-auto font-mono text-note whitespace-nowrap text-ink"
              >
                {cmd}
              </code>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="#install"
              className="brand-fill px-4 py-2 font-mono text-mark text-ground uppercase transition-opacity hover:opacity-90"
            >
              {hero.ctaPrimary}
            </a>
            <a
              href={site.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-line px-4 py-2 font-mono text-mark text-ink-dim uppercase transition-colors hover:border-line-strong hover:text-ink"
            >
              {hero.ctaSecondary}
            </a>
            <a
              href={site.selfAuditHref}
              className="py-2 text-note text-ink-dim underline underline-offset-2 transition-colors hover:text-ink"
            >
              {site.selfAuditLinkText}
            </a>
          </div>
        </div>

        <HeroTour />
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
