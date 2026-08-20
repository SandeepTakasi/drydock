"use client";

import { motion } from "motion/react";

import { hero, install, site } from "@/content/copy";
import {
  NO_MOTION,
  heroReveal,
  heroSequence,
  useMotionSafe,
  waterlineReveal,
} from "@/lib/motion";

/**
 * The page's opening element. The visual argument is the product itself: one
 * wave, three tasks owning three separate files, converging into a single gate
 * that a human has to approve. That replaced the hull drawing, which said
 * "ships" but said nothing about what the plugin does.
 *
 * Exempt from the `Section` shell (plan Decision 18): no eyebrow, no `<h2>`,
 * no `meta` prop. The title block is a staged load sequence (`heroReveal`
 * beats, `initial`/`animate`), not a scroll reveal (`whileInView`).
 *
 * Two SVG contracts survive the redesign because
 * `scripts/measure-reduced-motion.mjs` asserts them, and they carry real
 * meaning here rather than being kept alive for the harness:
 *
 * - The convergence rail is the ONLY `pathLength`-drawn element, so it takes
 *   `heroSequence.hull` and `data-reveal-path` (M1).
 * - The gate line is dashed with its own `strokeDasharray="10 8"` and must be
 *   the document's ONLY such path (C1). `pathLength` overwrites
 *   `stroke-dasharray`, so a dashed stroke can never be the thing that draws
 *   on: it is revealed left-to-right by `waterlineReveal` (clip/opacity) with
 *   `data-reveal`, never by a `pathLength` beat.
 *
 * `preserveAspectRatio="none"` lets the rail stretch to any card width while
 * its lane centres stay locked to the thirds of the grid above it;
 * `vector-effect="non-scaling-stroke"` keeps the strokes hairline-crisp under
 * that stretch.
 *
 * No scroll-linked drift anywhere: nothing on this page moves with the
 * scrollbar, so the harness's D1/D2 assertions are vacuous by design.
 */
export default function Hero() {
  const safe = useMotionSafe();
  const beat = (i: number) => (safe ? heroReveal(i) : NO_MOTION);
  const rail = safe ? heroSequence.hull : NO_MOTION;
  const gate = safe ? waterlineReveal : NO_MOTION;
  const { wave } = hero;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pt-16 pb-20 sm:px-10 sm:pt-24">
      <motion.ul
        data-reveal
        variants={beat(0)}
        initial="hidden"
        animate="shown"
        className="flex flex-wrap items-center gap-2 font-mono text-mark uppercase"
      >
        <li className="border border-accent px-2 py-1 text-accent">
          {hero.kicker}
        </li>
        {hero.badges.map((badge) => (
          <li key={badge} className="border border-line px-2 py-1 text-ink-dim">
            {badge}
          </li>
        ))}
      </motion.ul>

      <h1 className="mt-10 font-display text-display font-semibold text-ink">
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
        className="mt-6 max-w-3xl font-display text-promise text-ink"
      >
        {hero.promise}
      </motion.p>

      <motion.p
        data-reveal
        variants={beat(3)}
        initial="hidden"
        animate="shown"
        className="mt-6 max-w-2xl text-lead text-ink-dim"
      >
        {hero.sub}
      </motion.p>

      <motion.div
        data-reveal
        variants={beat(4)}
        initial="hidden"
        animate="shown"
        className="mt-10 flex flex-wrap items-center gap-3"
      >
        <a
          href="#install"
          className="bg-accent px-4 py-2 font-mono text-mark text-ground uppercase transition-opacity hover:opacity-90"
        >
          {hero.ctaPrimary}
        </a>
        <a
          href={site.selfAuditHref}
          className="border border-line px-4 py-2 font-mono text-mark text-ink-dim uppercase transition-colors hover:border-line-strong hover:text-ink"
        >
          {site.selfAuditLinkText}
        </a>
        <code className="ml-auto hidden font-mono text-note text-ink-dim lg:block">
          {install.commands[0]}
        </code>
      </motion.div>

      <motion.div
        data-reveal
        variants={beat(5)}
        initial="hidden"
        animate="shown"
        className="mt-16 flex items-center gap-4"
      >
        <span className="h-px w-8 shrink-0 bg-line-strong" />
        <span className="font-mono text-mark text-accent uppercase">
          {hero.thesis}
        </span>
        <span className="h-px flex-1 bg-line" />
      </motion.div>

      {/* The wave: three task lanes, one rail, one gate. */}
      <motion.div
        data-reveal
        variants={beat(6)}
        initial="hidden"
        animate="shown"
        className="mt-8 border border-line bg-surface"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 font-mono text-mark uppercase sm:px-6">
          <span className="text-accent">{wave.label}</span>
          <span className="text-ink-dim">{wave.subLabel}</span>
        </div>

        <ul className="grid gap-px bg-line sm:grid-cols-3">
          {wave.tasks.map((task) => (
            <li key={task.id} className="bg-surface px-4 py-5 sm:px-6">
              <div className="flex items-baseline justify-between gap-3 font-mono text-mark uppercase">
                <span className="text-ink">{task.id}</span>
                <span className="text-accent">{task.model}</span>
              </div>
              <p className="mt-5 font-mono text-mark text-ink-dim uppercase">
                {wave.ownsLabel}
              </p>
              <p className="mt-1 font-mono text-note break-all text-ink">
                {task.owns}
              </p>
            </li>
          ))}
        </ul>

        <svg
          viewBox="0 0 960 96"
          preserveAspectRatio="none"
          role="img"
          aria-label={wave.diagramAriaLabel}
          className="block h-20 w-full"
        >
          {/* Convergence rail: three lanes into one trunk. The only
              pathLength-drawn element on the page. */}
          <motion.path
            data-reveal-path
            variants={rail}
            initial="hidden"
            animate="shown"
            d="M160 0 L160 24 L480 24 M480 0 L480 24 M800 0 L800 24 L480 24 M480 24 L480 72"
            fill="none"
            stroke="var(--color-line-strong)"
            strokeWidth="var(--stroke-rule)"
            vectorEffect="non-scaling-stroke"
          />

          {/* The gate line: dashed, its own stroke-dasharray, revealed by
              clip/opacity (never pathLength: see the file header). */}
          <motion.path
            data-reveal
            variants={gate}
            initial="hidden"
            animate="shown"
            d="M0 88 L960 88"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="var(--stroke-rule)"
            strokeDasharray="10 8"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 font-mono text-mark uppercase sm:px-6">
          <span className="text-ink">{wave.gate.name}</span>
          <span className="border border-pass px-2 py-1 text-pass">
            {wave.gate.verdict}
          </span>
          <span className="text-ink-dim sm:ml-auto">{wave.gate.approval}</span>
        </div>

        <p className="border-t border-line px-4 py-3 text-note text-ink-dim sm:px-6">
          {wave.caption}
        </p>
      </motion.div>
    </div>
  );
}
