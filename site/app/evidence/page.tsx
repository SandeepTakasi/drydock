import type { Metadata } from "next";
import Link from "next/link";
import Evidence from "@/components/sections/Evidence";
import { evidencePage, meta } from "@/content/copy";

/**
 * The /evidence route: a header in the site container (one h1, the lead, a
 * link home), then the full evidence matrix. `metadataBase` is inherited from
 * the root layout and must stay basePath-free.
 */
export const metadata: Metadata = {
  title: evidencePage.title,
  description: evidencePage.description,
};

export default function EvidencePage() {
  return (
    <>
      <header className="mx-auto w-full max-w-6xl px-6 pt-16 sm:px-10">
        <h1 className="font-display text-display font-semibold text-ink">
          {evidencePage.heading}
        </h1>
        <p className="mt-6 max-w-3xl text-lead text-ink-dim">
          {evidencePage.lead}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-accent underline underline-offset-2"
        >
          {evidencePage.homeLinkText}
        </Link>
      </header>
      <Evidence meta={meta.evidence} />
    </>
  );
}
