"use client";

import { motion } from "motion/react";

import Section from "@/components/Section";
import { terminal } from "@/content/copy";
import { NO_MOTION, revealClipStagger, useMotionSafe } from "@/lib/motion";
import type { SectionProps } from "@/lib/section";

const TONE_CLASS = {
  dim: "text-ink-dim",
  pass: "text-pass",
  block: "text-block",
} as const;

/**
 * The wavecheck transcript from the 2026-08-18 adversarial dry-run (see
 * `terminal.caption` and docs/self-audit.md) — an illustration, never a
 * captured session. All twelve lines are server-rendered up front; each is
 * only ever revealed via its own clip, in sequence via `revealClipStagger`,
 * never typed character by character.
 */
export default function Terminal({ meta }: SectionProps) {
  const safe = useMotionSafe();

  return (
    <Section meta={meta}>
      <div className="border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 font-mono text-mark uppercase sm:px-6">
          <span className="text-ink-dim">{terminal.label}</span>
          <span className="border border-block px-2 py-1 text-block">
            {terminal.verdict}
          </span>
        </div>
        <div className="overflow-x-auto px-4 py-5 sm:px-6">
          <motion.pre
            initial="hidden"
            whileInView="shown"
            viewport={{ once: true, amount: 0.3 }}
            className="font-mono text-note whitespace-pre"
          >
            {terminal.lines.map((line, i) => (
              <motion.span
                key={line.text}
                data-reveal
                variants={safe ? revealClipStagger(i) : NO_MOTION}
                className={`block ${TONE_CLASS[line.tone]}`}
              >
                {line.text}
              </motion.span>
            ))}
          </motion.pre>
        </div>
      </div>
      <p className="mt-4 max-w-3xl text-note text-ink-dim">
        {terminal.caption}
      </p>
    </Section>
  );
}
