import type { Metadata } from "next";
import Link from "next/link";
import Evidence from "@/components/sections/Evidence";
import { evidencePage, meta } from "@/content/copy";

/**
 * The /evidence route: one h1, the lead, a link home, then the full evidence
 * matrix. `metadataBase` is inherited from the root layout and must stay
 * basePath-free.
 */
export const metadata: Metadata = {
  title: evidencePage.title,
  description: evidencePage.description,
};

export default function EvidencePage() {
  return (
    <>
      <header>
        <h1>{evidencePage.heading}</h1>
        <p>{evidencePage.lead}</p>
        <Link href="/">{evidencePage.homeLinkText}</Link>
      </header>
      <Evidence meta={meta.evidence} />
    </>
  );
}
