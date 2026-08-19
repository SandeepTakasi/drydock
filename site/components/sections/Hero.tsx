"use client";

import { motion } from "motion/react";

import { hero } from "@/content/copy";
import {
  NO_MOTION,
  heroReveal,
  heroSequence,
  useMotionSafe,
  waterlineReveal,
} from "@/lib/motion";

/**
 * The page's opening element, at display scale: a hull resting in a dry-dock
 * cradle, drawn as a blueprint, with a dashed waterline reading "APPROVED
 * (HUMAN-ONLY)" — the visual argument that nothing here ships without a
 * human sign-off.
 *
 * Exempt from the `Section` shell (plan Decision 18): no draft mark, no
 * `<h2>`, no `meta` prop. The title block above the drawing is a staged load
 * sequence (`heroReveal` beats, `initial`/`animate`), not a scroll reveal
 * (`whileInView`). The drawing itself keeps its own four-beat
 * `heroSequence` (linework, hull, waterline, label). The cradle, deckhouse
 * and annotations render at their authored coordinates, rigidly joined to
 * the dock floor (`y=360`) and hull deck line (`y=225`) — no scroll-linked
 * drift.
 *
 * The waterline is two elements on purpose: `pathLength` overwrites
 * `stroke-dasharray`, so a dashed stroke cannot also be the thing that draws
 * on. The hull (solid) uses `heroSequence.hull` + `data-reveal-path`. The
 * waterline (dashed, own `strokeDasharray`) is revealed left-to-right by
 * `waterlineReveal` (clip/opacity) + `data-reveal` — never the `waterline`
 * beat on the hero sequence object, which still animates `pathLength` and
 * would strip the dash under `prefers-reduced-motion`.
 *
 * Depth comes from two stacked planes (dock ground -> `bg-raised` drafting
 * board) and stroke weight (`--stroke-hair|rule|heavy`), never a shadow,
 * blur or glass.
 */
export default function Hero() {
  const safe = useMotionSafe();
  const beat = (i: number) => (safe ? heroReveal(i) : NO_MOTION);
  const linework = safe ? heroSequence.linework : NO_MOTION;
  const hull = safe ? heroSequence.hull : NO_MOTION;
  const waterline = safe ? waterlineReveal : NO_MOTION;
  const label = safe ? heroSequence.label : NO_MOTION;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 px-6 pt-20 pb-12 sm:pt-28">
      <div className="space-y-4">
        <motion.p
          data-reveal
          variants={beat(0)}
          initial="hidden"
          animate="shown"
          className="font-mono text-mark text-primer uppercase"
        >
          {hero.thesis}
        </motion.p>

        <h1 className="font-display text-hero">
          <motion.span
            data-reveal
            variants={beat(1)}
            initial="hidden"
            animate="shown"
            className="block"
          >
            {hero.headline}
          </motion.span>
        </h1>

        <motion.p
          data-reveal
          variants={beat(2)}
          initial="hidden"
          animate="shown"
          className="max-w-2xl text-lead text-ink-dim"
        >
          {hero.sub}
        </motion.p>

        <ul className="flex flex-wrap gap-x-4 gap-y-2 font-mono text-mark text-ink-dim uppercase">
          {hero.badges.map((badge, i) => (
            <motion.li
              key={badge}
              data-reveal
              variants={beat(3 + i)}
              initial="hidden"
              animate="shown"
              className="border border-line bg-raised px-2 py-1"
            >
              {badge}
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="border border-line bg-raised p-4 sm:p-8">
        <svg
          viewBox="0 0 960 420"
          role="img"
          aria-label={hero.svgAriaLabel}
          className="h-auto w-full"
        >
          {/* Dock floor — the fixed reference plane; does not drift. */}
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
            strokeWidth="var(--stroke-hair)"
          />

          {/* Cradle, deckhouse and annotations, at authored coordinates —
              rigidly joined to the fixed hull and dock floor. */}
          <motion.g data-reveal variants={linework} initial="hidden" animate="shown">
            <g stroke="var(--color-line)" strokeWidth="var(--stroke-rule)" fill="none">
              <path d="M220 360 L220 330 L260 330 L260 360" />
              <path d="M420 360 L420 330 L460 330 L460 360" />
              <path d="M620 360 L620 330 L660 330 L660 360" />
            </g>
            <g stroke="var(--color-line)" strokeWidth="var(--stroke-rule)" fill="none">
              <rect x="420" y="185" width="120" height="40" />
              <line x1="460" y1="185" x2="460" y2="150" />
            </g>
            <g fill="var(--color-line)" fontFamily="var(--font-mono)" fontSize="10">
              {hero.draftMarks.map((mark, i) => (
                <text key={mark} x={140 + i * 20} y={315 - i * 4}>
                  {mark}
                </text>
              ))}
            </g>
            <g
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
            </g>
          </motion.g>

          {/* Hull outline — the only pathLength-drawn element. */}
          <motion.path
            data-reveal-path
            variants={hull}
            initial="hidden"
            animate="shown"
            d="M120 300 C120 260 180 230 300 225 L660 225 C780 230 840 260 840 300 C840 330 780 340 660 340 L300 340 C180 340 120 330 120 300 Z"
            fill="none"
            stroke="var(--color-line)"
            strokeWidth="var(--stroke-heavy)"
          />

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
            strokeWidth="var(--stroke-rule)"
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
    </div>
  );
}
