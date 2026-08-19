"use client";

import { motion } from "motion/react";

import Section from "@/components/Section";
import { terminal } from "@/content/copy";
import { NO_MOTION, revealClipStagger, useMotionSafe } from "@/lib/motion";
import type { SectionProps } from "@/lib/section";

const TONE_CLASS = {
  dim: "text-ink-dim",
  pass: "text-ink",
  block: "text-primer",
} as const;

/**
 * The wavecheck transcript from the 2026-08-18 adversarial dry-run (see
 * `terminal.caption` and docs/self-audit.md) — an illustration, never a
 * captured session. All twelve lines are server-rendered up front; each is
 * only ever revealed via its own clip, in sequence via `revealClipStagger`,
 * never typed character by character. The panel is a framed inset, not a
 * chrome window.
 */
export default function Terminal({ meta }: SectionProps) {
  const safe = useMotionSafe();

  return (
    <Section meta={meta}>
      <div className="space-y-6">
        <p className="text-note text-ink-dim">{terminal.caption}</p>
        <div className="overflow-x-auto border border-line bg-panel p-4 md:p-6">
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
    </Section>
  );
}
