// "What it refuses": the section lead, then four refusals. Each shows its title,
// body, the command line, and the verbatim output in a <pre> that carries
// data-source and data-pin. The output scrolls inside its own box.
import Section from "@/components/Section";
import { refusals } from "@/content/copy";
import type { SectionProps } from "@/lib/section";

export default function Refusals({ meta }: SectionProps) {
  return (
    <Section meta={meta}>
      <p className="max-w-3xl text-lead text-ink">{refusals.lead}</p>
      <ul className="mt-12 grid gap-px bg-line md:grid-cols-2">
        {refusals.items.map((item) => (
          <li key={item.title} className="min-w-0 bg-surface px-6 py-8 sm:px-8">
            <h3 className="font-mono text-mark uppercase text-ink">
              {item.title}
            </h3>
            <p className="mt-5 text-body text-ink-dim">{item.body}</p>
            <p className="mt-5 overflow-x-auto font-mono text-mark text-accent">
              <span aria-hidden="true">$ </span>
              {item.command}
            </p>
            <div className="mt-3 overflow-x-auto bg-ground px-4 py-3">
              <pre
                data-source={item.source}
                data-pin={item.pin}
                className="font-mono text-mark text-ink"
              >
                {item.output}
              </pre>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
