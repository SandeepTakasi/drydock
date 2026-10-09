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
 * Copy button with its own state, so every command and the CI snippet copy
 * independently. The confirmed "Copied" state is left in place until the next
 * click rather than reset on a timer, so no timing literal is needed in this
 * file (plan Decision 22 keeps those in lib/motion).
 */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={async () => setCopied(await copyToClipboard(text))}
        className={
          "shrink-0 border px-3 py-1.5 font-mono text-mark uppercase transition-colors " +
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
    </>
  );
}

/**
 * Three numbered steps; each command is a real selectable <code> element
 * (works with no JS) on one scrolling line, plus a copy button.
 */
export default function Install({ meta }: SectionProps) {
  return (
    <Section meta={meta}>
      <ol className="grid gap-px border border-line bg-line">
        {install.steps.map((step) => (
          <li key={step.index} className="min-w-0 bg-surface px-4 py-6 sm:px-6">
            <div className="flex items-baseline gap-4">
              <span
                aria-hidden="true"
                className="font-mono text-mark text-accent"
              >
                {step.index}
              </span>
              <h3 className="text-body font-semibold text-ink">{step.title}</h3>
            </div>
            <p className="mt-2 max-w-3xl text-note text-ink-dim sm:pl-10">
              {step.body}
            </p>
            <div className="mt-4 grid gap-3 sm:pl-10">
              {step.commands.map((cmd) => (
                <div
                  key={cmd}
                  className="flex min-w-0 items-center gap-3 border border-line px-3 py-2"
                >
                  <span aria-hidden="true" className="font-mono text-accent">
                    $
                  </span>
                  <code className="min-w-0 flex-1 overflow-x-auto font-mono text-body whitespace-pre-wrap text-ink">
                    {cmd}
                  </code>
                  <CopyButton
                    text={cmd}
                    label={`${install.copyAriaLabel}: ${cmd}`}
                  />
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-6 font-mono text-mark text-ink-dim uppercase">
        {install.scopeNote}
      </p>
      <p className="mt-4 max-w-3xl text-note text-ink-dim">
        {install.configNote}
      </p>
      <p className="mt-4 max-w-3xl text-note text-ink-dim">
        {install.requirement}
      </p>
      <details className="group mt-8 border border-line bg-surface">
        <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 px-4 py-4 font-mono text-mark text-accent uppercase marker:content-none [&::-webkit-details-marker]:hidden sm:px-6">
          <span>{install.ciSummary}</span>
          <span aria-hidden="true" className="group-open:hidden">
            +
          </span>
          <span aria-hidden="true" className="hidden group-open:inline">
            -
          </span>
        </summary>
        <div className="border-t border-line px-4 py-4 sm:px-6">
          <p className="max-w-3xl text-note text-ink-dim">{install.ci.note}</p>
          <div className="mt-4 flex items-start gap-3">
            <pre className="min-w-0 flex-1 overflow-x-auto border border-line p-3 font-mono text-note text-ink">
              {install.ci.snippet}
            </pre>
            <CopyButton
              text={install.ci.snippet}
              label={install.ci.copyAriaLabel}
            />
          </div>
        </div>
      </details>
    </Section>
  );
}
