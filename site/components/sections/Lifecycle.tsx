"use client";

import { motion } from "motion/react";

import Section from "@/components/Section";
import { hero, lifecycle } from "@/content/copy";
import {
  NO_MOTION,
  heroSequence,
  useMotionSafe,
  waterlineReveal,
} from "@/lib/motion";
import type { SectionProps } from "@/lib/section";

/**
 * The loop: three numbered steps (what you type, what you get), then the wave
 * diagram, the line on what a BLOCK does, then the plugin's pieces folded
 * into a closed native `<details>` (name, kind, one-line summary, invocation),
 * with a link out to the plugin README for the full description of each.
 *
 * The wave diagram moved here from the hero (plan 012, D3). Two SVG contracts
 * travel with it because `scripts/measure-reduced-motion.mjs` asserts them
 * document-wide (C1/M1), and they carry real meaning:
 *
 * - The convergence rail is the ONLY `pathLength`-drawn element, so it takes
 *   `heroSequence.hull` and `data-reveal-path`.
 * - The gate line is dashed with its own `strokeDasharray="10 8"` and must be
 *   the document's ONLY such path. `pathLength` overwrites `stroke-dasharray`,
 *   so it is revealed by `waterlineReveal` (clip/opacity) with `data-reveal`,
 *   never by a `pathLength` beat.
 *
 * The section is below the fold, so both paths reveal on `whileInView` (once)
 * instead of the hero's load-time `animate`. `preserveAspectRatio="none"` lets
 * the rail stretch to any card width while its lane centres stay on the thirds
 * of the grid above; `vector-effect="non-scaling-stroke"` keeps the hairlines
 * crisp under that stretch.
 */
export default function Lifecycle({ meta }: SectionProps) {
  const safe = useMotionSafe();
  const rail = safe ? heroSequence.hull : NO_MOTION;
  const gate = safe ? waterlineReveal : NO_MOTION;
  const { wave } = hero;

  return (
    <Section meta={meta}>
      <ol className="grid gap-px bg-line md:grid-cols-3">
        {lifecycle.steps.map((step) => (
          <li key={step.index} className="min-w-0 bg-surface px-6 py-7">
            <p className="font-mono text-mark text-accent uppercase">
              {step.index}
            </p>
            <h3 className="mt-3 font-display text-lead text-ink">
              {step.title}
            </h3>
            <p className="mt-3 text-note text-ink-dim">{step.body}</p>
            {step.command ? (
              <div className="mt-4">
                <p className="font-mono text-mark text-ink-dim uppercase">
                  {lifecycle.commandLabel}
                </p>
                <code className="mt-1 block overflow-x-auto border border-line px-3 py-2 font-mono text-note whitespace-pre-wrap text-ink">
                  {step.command}
                </code>
              </div>
            ) : null}
            <p className="mt-4 text-note text-ink">
              <span className="mr-2 font-mono text-mark text-ink-dim uppercase">
                {lifecycle.outcomeLabel}
              </span>
              {step.outcome}
            </p>
          </li>
        ))}
      </ol>

      {/* The wave: three task lanes, one rail, one gate. */}
      <div className="mt-12 border border-line bg-surface">
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
            whileInView="shown"
            viewport={{ once: true }}
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
            whileInView="shown"
            viewport={{ once: true }}
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
      </div>
      <p className="mt-4 text-note text-ink-dim">{lifecycle.loop}</p>

      <details className="group mt-12">
        <summary className="flex cursor-pointer list-none items-center gap-3 font-mono text-mark text-accent uppercase marker:content-none [&::-webkit-details-marker]:hidden hover:underline">
          <span aria-hidden="true" className="group-open:hidden">
            +
          </span>
          <span aria-hidden="true" className="hidden group-open:inline">
            -
          </span>
          {lifecycle.piecesSummary}
        </summary>
        <ul className="mt-6 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {lifecycle.pieces.map((piece) => (
            <li key={piece.name} className="bg-surface px-6 py-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-body text-ink">
                  {piece.name}
                </span>
                <span className="border border-line px-2 py-0.5 font-mono text-mark text-ink-dim uppercase">
                  {piece.kind}
                </span>
              </div>
              <p data-piece-summary className="mt-2 text-note text-ink-dim">
                {piece.summary}
              </p>
              <p className="mt-2 font-mono text-mark text-accent">
                {piece.invocation}
              </p>
            </li>
          ))}
        </ul>
      </details>
      <p className="mt-6">
        <a
          href={lifecycle.readmeHref}
          className="font-mono text-mark text-accent uppercase underline-offset-4 hover:underline"
        >
          {lifecycle.readmeLinkText}
        </a>
      </p>
    </Section>
  );
}
