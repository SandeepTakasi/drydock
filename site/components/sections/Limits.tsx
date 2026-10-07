import Link from "next/link";

import Section from "@/components/Section";
import { limits } from "@/content/copy";
import type { SectionProps } from "@/lib/section";

/**
 * Limits section: what the mechanism cannot see. Renders the lead text,
 * a list of known limitations, and a link to the evidence page.
 */
export default function Limits({ meta }: SectionProps) {
  return (
    <Section meta={meta}>
      <p className="max-w-3xl text-lead text-ink">{limits.lead}</p>
      <ul className="mt-12 space-y-6">
        {limits.items.map((item) => (
          <li key={item} className="max-w-3xl text-body text-ink-dim">
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-12 max-w-3xl">
        <Link href="/evidence" className="text-accent hover:underline">
          {limits.evidenceLinkText}
        </Link>
      </p>
    </Section>
  );
}
