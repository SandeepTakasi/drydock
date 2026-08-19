import Section from "@/components/Section";
import { faq } from "@/content/copy";
import type { SectionProps } from "@/lib/section";

export default function Faq({ meta }: SectionProps) {
  return (
    <Section meta={meta}>
      <dl className="space-y-6">
        {faq.map((item) => (
          <div
            key={item.q}
            className="border-t border-line pt-6 first:border-t-0 first:pt-0"
          >
            <dt className="font-mono text-mark text-ink uppercase">{item.q}</dt>
            <dd className="mt-3 text-body text-ink-dim">{item.a}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
