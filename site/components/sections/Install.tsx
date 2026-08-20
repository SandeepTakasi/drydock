"use client";

import { useState } from "react";

import Section from "@/components/Section";
import { install } from "@/content/copy";
import type { SectionProps } from "@/lib/section";

/**
 * Copies `text` to the clipboard. `navigator.clipboard` is absent on
 * non-secure origins, and this is a static export that may be opened over
 * `file://`, so a legacy `document.execCommand("copy")` fallback covers that
 * case. Returns whether the copy actually happened.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy fallback below.
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    return true;
  } catch {
    return false;
  }
}

/**
 * Two install commands, each a real selectable/copyable <code> element (works
 * with no JS) plus a copy button. The confirmed "Copied" state is left in
 * place until the next copy rather than reset on a timer, so no timing
 * literal is needed in this file (plan Decision 22 keeps those in lib/motion).
 */
export default function Install({ meta }: SectionProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  return (
    <Section meta={meta}>
      <div className="border border-line bg-surface">
        {install.commands.map((cmd, i) => {
          const copied = copiedIndex === i;
          return (
            <div
              key={cmd}
              className="flex flex-wrap items-center justify-between gap-3 border-line px-4 py-4 not-first:border-t sm:px-6"
            >
              <code className="font-mono text-body break-all text-ink">
                <span aria-hidden="true" className="mr-3 text-accent">
                  $
                </span>
                {cmd}
              </code>
              <button
                type="button"
                aria-label={`${install.copyAriaLabel}: ${cmd}`}
                onClick={async () => {
                  const ok = await copyToClipboard(cmd);
                  setCopiedIndex(ok ? i : null);
                }}
                className={
                  "shrink-0 border px-3 py-1 font-mono text-mark uppercase transition-colors " +
                  (copied
                    ? "border-pass text-pass"
                    : "border-line text-ink-dim hover:border-line-strong hover:text-ink")
                }
              >
                {copied ? install.copiedLabel : install.copyLabel}
              </button>
              <span aria-live="polite" className="sr-only">
                {copied ? install.copiedLabel : ""}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-6 font-mono text-mark text-ink-dim uppercase">
        {install.scopeNote}
      </p>
      <p className="mt-4 max-w-3xl text-note text-ink-dim">
        {install.configNote}
      </p>
    </Section>
  );
}
