import Section from "@/components/Section";
import { evidence, site } from "@/content/copy";
import type { EvidenceRow } from "@/content/copy";
import type { SectionProps } from "@/lib/section";

/**
 * A single row of the schedule table: mono id, label, and the note that backs
 * it up. The contract-logic row's id is the literal "--" (a placeholder, not
 * a real id) and renders with no visible id rather than a stray dash.
 */
function Row({ row, accent }: { row: EvidenceRow; accent?: boolean }) {
  return (
    <div className="border-t border-line py-3 first:border-t-0 first:pt-0">
      <div className="flex items-baseline gap-3">
        {row.id !== "--" && (
          <span
            className={`font-mono text-mark ${accent ? "text-primer" : "text-ink-dim"}`}
          >
            {row.id}
          </span>
        )}
        <span className="text-body">{row.label}</span>
      </div>
      <p className="mt-1 text-note text-ink-dim">{row.note}</p>
    </div>
  );
}

export default function Evidence({ meta }: SectionProps) {
  return (
    <Section meta={meta}>
      <div className="space-y-6">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="font-mono text-mark text-ink">
              {evidence.verifiedHeading}
            </h3>
            <div className="mt-3">
              {evidence.verified.map((row) => (
                <Row key={row.label} row={row} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-mono text-mark text-primer">
              {evidence.notVerifiedHeading}
            </h3>
            <div className="mt-3">
              {evidence.notVerified.map((row) => (
                <Row key={row.id} row={row} accent />
              ))}
            </div>
          </div>
        </div>
        <p className="text-note text-ink-dim">
          <a href={site.selfAuditHref} className="text-primer underline underline-offset-2">
            {site.selfAuditLinkText}
          </a>
        </p>
      </div>
    </Section>
  );
}
