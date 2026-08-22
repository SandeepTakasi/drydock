import Section from "@/components/Section";
import { lifecycle } from "@/content/copy";
import type { SectionProps } from "@/lib/section";

/**
 * The seven pieces as a flow strip plus a card grid. Every detail is always
 * rendered: the old version hid five of six behind a disclosure that needed
 * JavaScript to open, which cost a click per piece and bought nothing.
 * Seven pieces do not divide by two or three, so the last card spans the row
 * rather than leaving dead cells beside it -- the grid gap paints the page
 * background, and an orphan reads as a missing card rather than a full set.
 * No state, no motion, so this stays a server component.
 */
export default function Lifecycle({ meta }: SectionProps) {
  return (
    <Section meta={meta}>
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-mark uppercase">
        {lifecycle.flow.map((step, i) => (
          <li key={step} className="flex items-center gap-3">
            {i > 0 && (
              <span aria-hidden="true" className="text-line-strong">
                /
              </span>
            )}
            <span className={i === 3 ? "text-accent" : "text-ink-dim"}>
              {step}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-note text-ink-dim">{lifecycle.loop}</p>

      <ul className="mt-12 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
        {lifecycle.pieces.map((piece) => (
          <li key={piece.name} className="bg-surface px-6 py-7 last:col-span-full">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="font-mono text-body text-ink">{piece.name}</h3>
              <span className="border border-line px-2 py-0.5 font-mono text-mark text-ink-dim uppercase">
                {piece.kind}
              </span>
            </div>
            <p className="mt-2 font-mono text-mark text-accent">
              {piece.invocation}
            </p>
            <p className="mt-4 max-w-[68ch] text-note text-ink-dim">{piece.detail}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
