"use client";

import { motion } from "motion/react";

import { NO_MOTION, sectionReveal, useMotionSafe } from "@/lib/motion";
import type { SectionShellProps } from "@/lib/section";

/**
 * The shared section shell: eyebrow, heading, children, and the site's ONLY
 * scroll reveal. Section components render their own `<Section meta={meta}>`
 * root and must not reimplement the reveal.
 *
 * `data-reveal` is required on the animated element so the reduced-motion rule
 * in app/globals.css can force-restore Framer's inline `opacity: 0`.
 *
 * Spacing contract: the shell owns the gap between the `<h2>` and `children`
 * (`mt-10` on the wrapper below). Sections pass their body content with no
 * leading margin of their own.
 */
export default function Section({ meta, children }: SectionShellProps) {
  const variants = useMotionSafe() ? sectionReveal : NO_MOTION;

  return (
    <motion.section
      id={meta.id}
      data-reveal
      variants={variants}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.2 }}
      className="border-t border-line"
    >
      <div className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-20 sm:px-10 sm:py-24">
        <p className="font-mono text-mark text-accent uppercase">
          {meta.eyebrow}
        </p>
        <h2 className="mt-5 max-w-3xl font-display text-title text-ink">
          {meta.heading}
        </h2>
        {/* The heading-to-body gap is pinned HERE, once, as `mt-10`. Section
            components must not add their own top margin to their first child. */}
        <div className="mt-10">{children}</div>
      </div>
    </motion.section>
  );
}
