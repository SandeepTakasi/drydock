import { useSyncExternalStore } from "react";
import { useReducedMotion, type Transition, type Variants } from "motion/react";

/**
 * The site's motion contract. Every timing literal lives in this file, which is
 * why `components/sections/*.tsx` may contain none (plan Decision 22).
 *
 * Three rules are baked in here so no section has to remember them:
 *
 * 1. Animation drives only `opacity`, `clipPath`, `width`, `transform`
 *    (x / y / scale) and SVG `pathLength` — never text content. All copy is
 *    server-rendered and merely revealed, so it survives the static export and
 *    the copy assertions (F5).
 *
 * 2. Every element one of these variants is applied to MUST also carry a bare
 *    `data-reveal` attribute. Framer writes the `initial` state as an inline
 *    `style="opacity:0"`, which a `prefers-reduced-motion` media block cannot
 *    override; the `[data-reveal] { …!important }` rule in `app/globals.css`
 *    is what force-restores those elements (F5a).
 *
 *    Which attribute which variant needs: variants animating SVG
 *    `pathLength` (`drawLine`, `heroSequence.hull`) require `data-reveal-path`
 *    — that is the rule that restores `stroke-dasharray` / `stroke-dashoffset`
 *    for dashed strokes. Every other variant (clip/opacity/transform,
 *    including `waterlineReveal`) requires `data-reveal` only. Putting
 *    `data-reveal-path` on a non-pathLength element, or `data-reveal` alone on
 *    a dashed pathLength element, is wrong — get this from this file, not by
 *    copying a neighboring component.
 *
 * 3. Restraint: every reveal is <= 600ms, `heroSequence` totals <= 2s, easing is
 *    standard (`easeOut`) with no spring, bounce, or overshoot. This site reads
 *    as an engineering drawing.
 *
 * Every variant set uses exactly two state names — `"hidden"` and `"shown"` —
 * so `NO_MOTION` is a drop-in swap for any of them.
 */

const EASE = "easeOut";

const REVEAL = 0.5; // section / child reveal
const RISE = 24; // px travelled by a section reveal
const RISE_CHILD = 12; // px travelled by a child reveal
const STAGGER = 0.08; // gap between staggered siblings
const LINE_DRAW = 0.6; // SVG stroke draw
const LINE_STEP = 0.09; // gap between transcript lines (the typing illusion)
const LINE_REVEAL = 0.25; // per-transcript-line clip reveal
const WATERLINE_DELAY = 1.0; // hero beat 3 — matches heroSequence.waterline's delay

const t = (duration: number, delay = 0): Transition => ({
  duration,
  delay,
  ease: EASE,
});

/** Scroll-triggered section entrance. Applied by the shared `Section` shell only. */
export const sectionReveal: Variants = {
  hidden: { opacity: 0, y: RISE },
  shown: { opacity: 1, y: 0, transition: t(REVEAL) },
};

/** Parent that staggers its children; pair with `childRise` on each child. */
export const staggerChildren: Variants = {
  hidden: {},
  shown: { transition: { delayChildren: STAGGER, staggerChildren: STAGGER } },
};

/** Child counterpart to `staggerChildren`. */
export const childRise: Variants = {
  hidden: { opacity: 0, y: RISE_CHILD },
  shown: { opacity: 1, y: 0, transition: t(REVEAL) },
};

/** SVG stroke draw — put on a `motion.path` with a stroke, e.g. the waterline. */
export const drawLine: Variants = {
  hidden: { pathLength: 0 },
  shown: { pathLength: 1, transition: t(LINE_DRAW) },
};

const CLIP_HIDDEN = { clipPath: "inset(0 100% 0 0)", opacity: 0 };
const CLIP_SHOWN = { clipPath: "inset(0 0% 0 0)", opacity: 1 };

/** Left-to-right clip reveal for text that is already in the markup (F5). */
export const revealClip: Variants = {
  hidden: CLIP_HIDDEN,
  shown: { ...CLIP_SHOWN, transition: t(REVEAL) },
};

/**
 * Per-line cadence for a transcript that must reveal sequentially — the typing
 * illusion without touching the text. Line `i` starts at `i * 0.09s`, so a
 * ~12-line block finishes inside ~1.3s.
 */
export function revealClipStagger(i: number): Variants {
  return {
    hidden: CLIP_HIDDEN,
    shown: { ...CLIP_SHOWN, transition: t(LINE_REVEAL, i * LINE_STEP) },
  };
}

/**
 * Clip reveal for the hero's dashed waterline overlay, carrying the same
 * beat-3 delay as `heroSequence.waterline` (1.0s) so the two line up. Unlike
 * `heroSequence.waterline` (which animates `pathLength` and needs
 * `data-reveal-path`), this animates `clipPath`/`opacity` and needs
 * `data-reveal` only.
 */
export const waterlineReveal: Variants = {
  hidden: CLIP_HIDDEN,
  shown: { ...CLIP_SHOWN, transition: t(REVEAL, WATERLINE_DELAY) },
};

/**
 * The hero's four-beat load sequence: linework fades in, the hull draws, the
 * waterline draws, the label fades in last. Beats are separate variant sets so
 * the hero applies one per element with `initial="hidden" animate="shown"`.
 *
 * Budget, in seconds: linework 0→0.4, hull 0.3→0.9, waterline 1.0→1.6,
 * label 1.6→1.95. Total 1.95s, inside the 2s ceiling.
 */
export const heroSequence = {
  linework: {
    hidden: { opacity: 0 },
    shown: { opacity: 1, transition: t(0.4) },
  },
  hull: {
    hidden: { pathLength: 0, opacity: 0 },
    shown: { pathLength: 1, opacity: 1, transition: t(LINE_DRAW, 0.3) },
  },
  waterline: {
    hidden: { pathLength: 0 },
    shown: { pathLength: 1, transition: t(LINE_DRAW, 1.0) },
  },
  label: {
    hidden: { opacity: 0 },
    shown: { opacity: 1, transition: t(0.35, 1.6) },
  },
} satisfies Record<string, Variants>;

/**
 * Reduced-motion stand-in: both states are the finished, fully visible target at
 * zero duration. Consumers swap the variant object
 * (`safe ? sectionReveal : NO_MOTION`) instead of branching their JSX.
 */
export const NO_MOTION: Variants = {
  hidden: {
    opacity: 1,
    x: 0,
    y: 0,
    clipPath: "none",
    pathLength: 1,
    transition: { duration: 0 },
  },
  shown: {
    opacity: 1,
    x: 0,
    y: 0,
    clipPath: "none",
    pathLength: 1,
    transition: { duration: 0 },
  },
};

const neverChanges = () => () => {};
const hydrated = () => true;
const notHydratedYet = () => false;

/**
 * True when it is safe to animate. `useReducedMotion()` returns
 * `boolean | null` — `null` during the static export — and `null` counts as
 * motion allowed so the exported HTML carries the pre-animation state with all
 * text present (F5, F8); `data-reveal` is what makes that state visible to a
 * reduced-motion visitor (F5a).
 *
 * The real value is only consulted once hydration is done. `useReducedMotion()`
 * reads the media query synchronously on the first client render, so a
 * reduced-motion visitor would get `true` where the server rendered `null` — a
 * hydration mismatch. `useSyncExternalStore` renders the server snapshot
 * (`false`) through hydration and re-renders with the client snapshot after,
 * which is the supported way to defer a value past hydration without an effect.
 */
export function useMotionSafe(): boolean {
  const reduced = useReducedMotion();
  const isHydrated = useSyncExternalStore(neverChanges, hydrated, notHydratedYet);

  return isHydrated ? reduced !== true : true;
}
