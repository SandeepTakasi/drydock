import type { Metadata } from "next";

import { site } from "@/content/copy";
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
          by the base layer in globals.css. */}
      <body>
        <header className="border-b border-line bg-panel/70 px-6 py-2 font-mono text-mark text-ink-dim uppercase">
          {site.status}
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
