"use client";

import { motion } from "motion/react";

import { hero } from "@/content/copy";
import {
  NO_MOTION,
  childRise,
  heroSequence,
  staggerChildren,
  useMotionSafe,
  waterlineReveal,
} from "@/lib/motion";

/**
 * The page's opening element: a hull resting in a dry-dock cradle, drawn as a
 * blueprint, with a dashed waterline that reads "APPROVED (HUMAN-ONLY)" — the
 * visual argument that nothing here ships without a human sign-off.
 *
 * Exempt from the `Section` shell (plan Decision 18): no draft mark, no
 * `<h2>`, no `meta` prop. This is a load sequence (`initial`/`animate`), not a
 * scroll reveal (`whileInView`).
 *
 * The waterline is two elements on purpose: `pathLength` overwrites
 * `stroke-dasharray`, so a dashed stroke cannot also be the thing that draws
 * on. The hull (solid) uses `heroSequence.hull` + `data-reveal-path`. The
 * waterline (dashed, own `strokeDasharray`) is revealed left-to-right by
 * `waterlineReveal` (clip/opacity) + `data-reveal` — never the `waterline`
 * beat on the hero sequence object, which still animates `pathLength` and
 * would strip the dash under `prefers-reduced-motion`.
 */
export default function Hero() {
  const safe = useMotionSafe();

  const stagger = safe ? staggerChildren : NO_MOTION;
  const rise = safe ? childRise : NO_MOTION;
  const linework = safe ? heroSequence.linework : NO_MOTION;
  const hull = safe ? heroSequence.hull : NO_MOTION;
  const waterline = safe ? waterlineReveal : NO_MOTION;
  const label = safe ? heroSequence.label : NO_MOTION;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pt-16 pb-12 space-y-6">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="shown"
        className="space-y-3"
      >
        <motion.p
          data-reveal
          variants={rise}
          className="font-mono text-mark text-primer uppercase"
        >
          {hero.thesis}
        </motion.p>
        <h1 className="font-display text-sheet">
          <motion.span data-reveal variants={rise} className="block">
            {hero.headline}
          </motion.span>
        </h1>
        <motion.p
          data-reveal
          variants={rise}
          className="max-w-2xl text-lead text-ink-dim"
        >
          {hero.sub}
        </motion.p>
        <motion.ul
          data-reveal
          variants={rise}
          className="flex flex-wrap gap-x-4 gap-y-2 font-mono text-mark text-ink-dim uppercase"
        >
          {hero.badges.map((badge) => (
            <li key={badge} className="border border-line px-2 py-1">
              {badge}
            </li>
          ))}
        </motion.ul>
      </motion.div>

      <svg
        viewBox="0 0 960 420"
        role="img"
        aria-label={hero.svgAriaLabel}
        className="h-auto w-full"
      >
        {/* Dock floor */}
        <motion.line
          data-reveal
          variants={linework}
          initial="hidden"
          animate="shown"
          x1="40"
          y1="360"
          x2="920"
          y2="360"
          stroke="var(--color-line)"
          strokeWidth="2"
        />

        {/* Cradle blocks under the keel */}
        <motion.g
          data-reveal
          variants={linework}
          initial="hidden"
          animate="shown"
          stroke="var(--color-line)"
          strokeWidth="2"
          fill="none"
        >
          <path d="M220 360 L220 330 L260 330 L260 360" />
          <path d="M420 360 L420 330 L460 330 L460 360" />
          <path d="M620 360 L620 330 L660 330 L660 360" />
        </motion.g>

        {/* Hull outline — the only pathLength-drawn element */}
        <motion.path
          data-reveal-path
          variants={hull}
          initial="hidden"
          animate="shown"
          d="M120 300 C120 260 180 230 300 225 L660 225 C780 230 840 260 840 300 C840 330 780 340 660 340 L300 340 C180 340 120 330 120 300 Z"
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="3"
        />

        {/* Superstructure */}
        <motion.g
          data-reveal
          variants={linework}
          initial="hidden"
          animate="shown"
          stroke="var(--color-line)"
          strokeWidth="2"
          fill="none"
        >
          <rect x="420" y="185" width="120" height="40" />
          <line x1="460" y1="185" x2="460" y2="150" />
        </motion.g>

        {/* Bow draft marks */}
        <motion.g
          data-reveal
          variants={linework}
          initial="hidden"
          animate="shown"
          fill="var(--color-line)"
          fontFamily="var(--font-mono)"
          fontSize="10"
        >
          {hero.draftMarks.map((mark, i) => (
            <text key={mark} x={140 + i * 14} y={315 - i * 4}>
              {mark}
            </text>
          ))}
        </motion.g>

        {/* Wave labels under the keel */}
        <motion.g
          data-reveal
          variants={linework}
          initial="hidden"
          animate="shown"
          fill="var(--color-line)"
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="1.5"
        >
          {hero.keelLabels.map((text, i) => (
            <text key={text} x={280 + i * 200} y="382" textAnchor="middle">
              {text}
            </text>
          ))}
        </motion.g>

        {/* Waterline — dashed, own stroke-dasharray, revealed by clip/opacity
            (never pathLength: see the file header comment). */}
        <motion.path
          data-reveal
          variants={waterline}
          initial="hidden"
          animate="shown"
          d="M60 270 L900 270"
          fill="none"
          stroke="var(--color-primer)"
          strokeWidth="2"
          strokeDasharray="10 8"
        />

        <motion.text
          data-reveal
          variants={label}
          initial="hidden"
          animate="shown"
          x="60"
          y="252"
          fill="var(--color-primer)"
          fontFamily="var(--font-mono)"
          fontSize="12"
          letterSpacing="1.5"
        >
          {hero.waterlineLabel}
        </motion.text>
      </svg>
    </div>
  );
}
