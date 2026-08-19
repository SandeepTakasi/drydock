"use client";

import { useState } from "react";
import { motion } from "motion/react";

import Section from "@/components/Section";
import { lifecycle } from "@/content/copy";
import { NO_MOTION, childRise, useMotionSafe } from "@/lib/motion";
import type { SectionProps } from "@/lib/section";

/**
 * The six pieces of the Drydock lifecycle as an interactive ladder: each rung
 * is a real button that toggles the visibility of its own detail panel below
 * it. All six details stay in the static markup regardless of which rung is
 * open (hidden via CSS, never via conditional rendering) so the export
 * assertions and screen readers see the full content. The closed state uses
 * `hidden` (display: none), so the disclosure itself still requires
 * JavaScript to open/close a rung.
 */
export default function Lifecycle({ meta }: SectionProps) {
  const [openIndex, setOpenIndex] = useState(0);
  const safe = useMotionSafe();
  const variants = safe ? childRise : NO_MOTION;

  return (
    <Section meta={meta}>
      <ol className="space-y-6 border-l border-line pl-6">
        {lifecycle.pieces.map((piece, i) => {
          const open = openIndex === i;
          const panelId = `lifecycle-detail-${piece.name}`;
          return (
            <li key={piece.name} className="relative">
              <span
                aria-hidden="true"
                className={
                  "absolute top-2 -left-[29px] h-2.5 w-2.5 rounded-full border " +
                  (open
                    ? "border-primer bg-primer"
                    : "border-line bg-dock")
                }
              />
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? -1 : i)}
                className={
                  "flex w-full flex-wrap items-baseline gap-x-3 gap-y-1 text-left " +
                  (open ? "text-primer" : "text-ink")
                }
              >
                <span className="font-mono text-body">{piece.name}</span>
                <span className="font-mono text-mark text-ink-dim uppercase">
                  {piece.kind}
                </span>
                <span className="font-mono text-mark text-ink-dim">
                  {piece.invocation}
                </span>
              </button>
              <motion.div
                id={panelId}
                data-reveal
                variants={variants}
                initial="hidden"
                animate={open ? "shown" : "hidden"}
                aria-hidden={!open}
                className={
                  "mt-2 max-w-prose text-note text-ink-dim " +
                  (open ? "" : "hidden")
                }
              >
                <p>{piece.detail}</p>
              </motion.div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
