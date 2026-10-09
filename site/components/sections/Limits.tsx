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
        {limits.points.map((p) => (
          <li key={p.lead} className="flex max-w-3xl gap-4 text-body">
            <span
              aria-hidden="true"
              className="mt-[0.6em] h-1.5 w-1.5 shrink-0 bg-accent"
            />
            <span className="text-ink-dim">
              <strong className="font-medium text-ink">{p.lead}</strong>{" "}
              {p.detail}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-12 max-w-3xl">
        {/* prefetch={false}: the /evidence prefetch 404s; see app/layout.tsx */}
        <Link href="/evidence" prefetch={false} className="text-accent hover:underline">
          {limits.evidenceLinkText}
        </Link>
      </p>
    </Section>
  );
}
