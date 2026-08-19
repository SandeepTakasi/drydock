import Section from "@/components/Section";
import { problem } from "@/content/copy";
import type { SectionProps } from "@/lib/section";

export default function Problem({ meta }: SectionProps) {
  return (
    <Section meta={meta}>
      <div className="space-y-6">
        <p className="text-lead text-ink">{problem.lead}</p>
        <div className="grid gap-6 border-t border-line pt-6 md:grid-cols-2 md:divide-x md:divide-line">
          {problem.modes.map((mode) => (
            <div key={mode.title} className="md:px-6 md:first:pl-0 md:last:pr-0">
              <h3 className="font-mono text-mark text-ink uppercase">
                {mode.title}
              </h3>
              <p className="mt-3 text-body text-ink-dim">{mode.body}</p>
            </div>
          ))}
        </div>
        <p className="border-t border-line pt-6 text-body text-ink-dim">
          {problem.coda}
        </p>
      </div>
    </Section>
  );
}
