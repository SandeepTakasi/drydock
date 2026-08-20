import Section from "@/components/Section";
import { problem } from "@/content/copy";
import type { SectionProps } from "@/lib/section";

export default function Problem({ meta }: SectionProps) {
  return (
    <Section meta={meta}>
      <p className="max-w-3xl text-lead text-ink">{problem.lead}</p>
      <ul className="mt-12 grid gap-px bg-line md:grid-cols-2">
        {problem.modes.map((mode) => (
          <li key={mode.title} className="bg-surface px-6 py-8 sm:px-8">
            <div className="flex items-baseline gap-3 font-mono text-mark uppercase">
              <span className="text-accent">{mode.index}</span>
              <span className="text-ink">{mode.title}</span>
            </div>
            <p className="mt-5 text-body text-ink-dim">{mode.body}</p>
          </li>
        ))}
      </ul>
      <p className="mt-12 max-w-3xl border-l-2 border-accent pl-6 text-body text-ink">
        {problem.coda}
      </p>
    </Section>
  );
}
