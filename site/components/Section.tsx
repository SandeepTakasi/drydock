"use client";

import { motion } from "motion/react";

import { NO_MOTION, sectionReveal, useMotionSafe } from "@/lib/motion";
import type { SectionShellProps } from "@/lib/section";

/**
 * The shared section shell: draft mark, heading, children, and the site's ONLY
 * scroll reveal. Section components render their own `<Section meta={meta}>`
 * root and must not reimplement the reveal.
 *
 * `data-reveal` is required on the animated element so the reduced-motion rule
 * in app/globals.css can force-restore Framer's inline `opacity: 0`.
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
      className="mx-auto w-full max-w-5xl scroll-mt-12 border-t border-line px-6 py-20"
    >
      <p className="font-mono text-mark text-primer uppercase">
        {meta.draftMark}
      </p>
      <h2 className="mt-4 font-display text-title">{meta.heading}</h2>
      {children}
    </motion.section>
  );
}
