import type { Metadata } from "next";

import { sheet, site } from "@/content/copy";
import { fontVariables } from "@/lib/fonts";

import "./globals.css";

/** Both strings come from content/copy.ts — this file authors no copy. */
export const metadata: Metadata = {
  title: site.title,
  description: site.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontVariables}>
      {/* Blueprint ground (background + ink + body face) is applied to <body>
          by the base layer in globals.css. The padding is the sheet margin:
          the trim line below is inset from the edge like a drawing's frame. */}
      <body className="p-2 sm:p-4">
        {/* Framer Motion writes the initial state as an inline style (e.g.
            style="opacity:0"), which only runs once JS hydrates. Without JS
            that inline style never gets replaced, so mirror globals.css's
            reduced-motion rule here, split the same way: [data-reveal-path]
            is the only selector that touches stroke-dasharray, because the
            hero waterline (data-reveal only) is a dashed line by design. */}
        <noscript>
          <style>{`
            [data-reveal] {
              opacity: 1 !important;
              transform: none !important;
              clip-path: none !important;
              width: auto !important;
            }

            [data-reveal-path] {
              opacity: 1 !important;
              transform: none !important;
              clip-path: none !important;
              width: auto !important;
              stroke-dasharray: none !important;
              stroke-dashoffset: 0 !important;
            }
          `}</style>
        </noscript>
        {/* Skip link — first focusable element in the document. Parked off
            screen by a transform (not `sr-only`, whose `position: static`
            fights any positioning utility depending on stylesheet order) and
            slid into view on focus, primer-on-dock at 6.54:1. */}
        <a
          href="#content"
          className="fixed top-4 left-4 z-50 -translate-y-24 border border-primer bg-dock px-4 py-2 font-mono text-mark text-primer uppercase transition-transform focus:translate-y-0"
        >
          {site.skipLinkText}
        </a>

        {/* The sheet: one hairline trim line around the whole drawing. */}
        <div className="border border-line">
          <header className="border-b border-line bg-panel/70 px-6 py-2 font-mono text-mark text-ink-dim uppercase">
            {site.status}
          </header>

          <main id="content" tabIndex={-1}>{children}</main>

          {/* Title block. A real sheet carries it bottom-right in a ruled box:
              two rows of three cells, project / title / sheet number over
              scale / date / revision. No cell captions are rendered — every
              on-page string must come from content/copy.ts, which holds no
              caption strings, and the values are self-labelling
              ("SHEET 1 OF 1", "NOT TO SCALE", "REV 0.3.1"). */}
          <footer className="flex justify-end border-t border-line bg-panel/40 px-6 py-6">
            <div className="w-full max-w-xl border border-line font-mono text-mark text-ink-dim uppercase">
              <div className="grid grid-cols-3 divide-x divide-line">
                <div className="px-3 py-2">{sheet.project}</div>
                <div className="px-3 py-2">{sheet.title}</div>
                <div className="px-3 py-2">{sheet.sheetNumber}</div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
                <div className="px-3 py-2">{sheet.scale}</div>
                <div className="px-3 py-2">{sheet.date}</div>
                <div className="px-3 py-2">{sheet.revision}</div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
