import Section from "@/components/Section";
import { faq } from "@/content/copy";
import type { SectionProps } from "@/lib/section";

/**
 * Native `<details>` disclosures: keyboard accessible, findable by in-page
 * search, and open/close with no JavaScript and no state. The first item is
 * open so the section never reads as an empty list of questions.
 */
export default function Faq({ meta }: SectionProps) {
  return (
    <div>
      <Section meta={meta}>
        <ul className="grid gap-px bg-line">
          {faq.map((item, i) => (
            <li key={item.q} className="bg-surface">
              <details open={i === 0} className="group">
                <summary className="flex cursor-pointer list-none items-baseline gap-4 px-6 py-5 text-body text-ink marker:content-none sm:px-8">
                  <span
                    aria-hidden="true"
                    className="font-mono text-mark text-accent group-open:text-ink-dim"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1">{item.q}</span>
                </summary>
                <p className="max-w-3xl px-6 pb-6 text-note text-ink-dim sm:px-8 sm:pl-16">
                  {item.a}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
