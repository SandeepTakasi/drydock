import type { Metadata } from "next";
import Image from "next/image";

import mark from "@/assets/drydock-mark.png";

import { footer, nav, site } from "@/content/copy";
import { fontVariables } from "@/lib/fonts";

import "./globals.css";

/**
 * Every string here comes from content/copy.ts — this file authors no copy.
 *
 * `metadataBase` is what lets Next emit absolute `og:`/`twitter:` URLs; without
 * it the social tags resolve against nothing and the build warns. It has to
 * include the basePath, because that is where the page actually lives.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.origin),
  title: site.title,
  description: site.description,
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.wordmark,
    title: site.title,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fontVariables} scroll-smooth`}>
      {/* Ground, ink and body face are applied to <body> by the base layer in
          globals.css. No sheet margin: the page runs edge to edge and every
          band constrains its own content instead. */}
      <body>
        {/* Framer Motion writes the initial state as an inline style (e.g.
            style="opacity:0"), which only runs once JS hydrates. Without JS
            that inline style never gets replaced, so mirror globals.css's
            reduced-motion rule here, split the same way: [data-reveal-path]
            is the only selector that touches stroke-dasharray, because the
            gate line (data-reveal only) is a dashed stroke by design. */}
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
            slid into view on focus. */}
        <a
          href="#content"
          className="fixed top-4 left-4 z-50 -translate-y-24 border border-accent bg-ground px-4 py-2 font-mono text-mark text-accent uppercase transition-transform focus:translate-y-0"
        >
          {site.skipLinkText}
        </a>

        <header className="sticky top-0 z-40 border-b border-line bg-ground">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-6 sm:px-10">
            <a
              href="#content"
              className="flex shrink-0 items-center gap-2.5 font-display text-body font-semibold tracking-tight text-ink"
            >
              {/* A STATIC IMPORT, not a string src. Measured: `next/image`
                  does NOT prepend `basePath` to a string src -- it emitted
                  "/drydock-mark.png", which 404s on a project site. A static
                  import resolves through /_next/static/media/, and _next URLs
                  do carry the basePath, so nothing here hardcodes "/drydock".
                  It is content-hashed too, and ships once rather than twice.

                  alt is empty on purpose: the wordmark beside it says
                  "Drydock", so announcing the mark too would just repeat it. */}
              <Image
                src={mark}
                alt=""
                width={26}
                height={26}
                priority
                className="h-[26px] w-[26px]"
              />
              {site.wordmark}
            </a>
            <span className="hidden border border-line px-2 py-1 font-mono text-mark text-ink-dim uppercase sm:inline-block">
              {site.status}
            </span>
            <nav className="ml-auto flex items-center gap-5">
              {nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="hidden font-mono text-mark text-ink-dim uppercase transition-colors hover:text-ink md:inline-block"
                >
                  {item.label}
                </a>
              ))}
              <span className="font-mono text-mark text-accent uppercase">
                v{site.version}
              </span>
            </nav>
          </div>
        </header>

        <main id="content" tabIndex={-1}>
          {children}
        </main>

        <footer className="border-t border-line">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:px-10 md:flex-row md:items-center md:justify-between">
            <p className="max-w-sm text-note text-ink-dim">{footer.tagline}</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {footer.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="font-mono text-mark text-ink-dim uppercase transition-colors hover:text-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <ul className="flex gap-x-4 font-mono text-mark text-ink-dim uppercase">
              {footer.meta.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </footer>
      </body>
    </html>
  );
}
