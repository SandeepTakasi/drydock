import { Archivo, Big_Shoulders, IBM_Plex_Mono } from "next/font/google";

/**
 * Font source variables are deliberately named `--font-src-*`, NOT the same as
 * the `@theme` tokens in app/globals.css (`--font-display` etc). A theme token
 * defined as `var()` of its own name is self-referential and silently dropped.
 */

// Condensed industrial display face. Variable weight axis (100-900) -> no `weight`.
export const display = Big_Shoulders({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-src-display",
});

// Labels, code, draft marks. Not a variable font: weights must be listed.
export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-src-mono",
});

export const body = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-src-body",
});

/** Convenience for the <html> className in app/layout.tsx. */
export const fontVariables = `${display.variable} ${mono.variable} ${body.variable}`;
