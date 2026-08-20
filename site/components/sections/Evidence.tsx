import Section from "@/components/Section";
import { evidence, site } from "@/content/copy";
import type { EvidenceRow } from "@/content/copy";
import type { SectionProps } from "@/lib/section";

const TONE_CLASS = {
  pass: "border-pass text-pass",
  hold: "border-hold text-hold",
} as const;

/**
 * One matrix, every row carrying its own verdict pill, so the honest row reads
 * as loudly as the passing ones. `docs/compatibility.md` is the source of
 * truth for every status here; A3 must never render as PASSED.
 *
 * The contract-logic row's id is the literal "--" (a placeholder, not a real
 * id) and renders with no visible id rather than a stray dash.
 */
function Row({ row }: { row: EvidenceRow }) {
  return (
    <li className="bg-surface px-6 py-6 sm:px-8">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-3">
        <span className="min-w-8 font-mono text-mark text-ink-dim">
          {row.id === "--" ? "" : row.id}
        </span>
        <h3 className="max-w-xl flex-1 text-body text-ink">{row.label}</h3>
        <span
          className={`border px-2 py-1 font-mono text-mark uppercase ${TONE_CLASS[row.tone]}`}
        >
          {row.status}
        </span>
      </div>
      <p className="mt-4 max-w-3xl text-note text-ink-dim sm:ml-12">
        {row.note}
      </p>
    </li>
  );
}

export default function Evidence({ meta }: SectionProps) {
  return (
    <Section meta={meta}>
      <ul className="grid gap-px bg-line">
        {evidence.rows.map((row) => (
          <Row key={row.label} row={row} />
        ))}
      </ul>
      <p className="mt-8">
        <a
          href={site.selfAuditHref}
          className="font-mono text-mark text-accent uppercase underline underline-offset-4"
        >
          {site.selfAuditLinkText}
        </a>
      </p>
    </Section>
  );
}
