import { IBM_Plex_Mono, Inter } from "next/font/google";

/**
 * Font source variables are deliberately named `--font-src-*`, NOT the same as
 * the `@theme` tokens in app/globals.css (`--font-display` etc). A theme token
 * defined as `var()` of its own name is self-referential and silently dropped.
 *
 * One sans family serves both the display and body tokens. Inter is a variable
 * font with real `size-adjust` fallback metrics, which is why it replaced
 * Big_Shoulders: that face had none, and an unpinned `opsz` axis, so the hero
 * headline shifted on every load and every build printed a warning about it.
 */
export const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-src-sans",
});

// Labels, code, transcripts. Not a variable font: weights must be listed.
export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-src-mono",
});

/** Convenience for the <html> className in app/layout.tsx. */
export const fontVariables = `${sans.variable} ${mono.variable}`;
