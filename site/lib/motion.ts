import { useSyncExternalStore, type RefObject } from "react";
import {
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
  type Transition,
  type Variants,
} from "motion/react";

/**
 * The site's motion contract. Every timing literal lives in this file, which is
 * why `components/sections/*.tsx` may contain none (plan Decision 22).
 *
 * Four rules are baked in here so no section has to remember them:
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
 * 4. Scroll-linked motion degrades here, in TypeScript — not in CSS. The
 *    `[data-reveal]` rule in `app/globals.css` can force `transform: none` on
 *    a revealed element, but a live `MotionValue` keeps writing to that same
 *    transform long after the stylesheet has had its say. So the CSS safety
 *    net has a hole exactly where scroll-linked motion is, and `useDriftY` is
 *    where that branch lives: it consults `useMotionSafe()` itself and returns
 *    a constant-`0` `MotionValue` when motion is not safe. `NO_MOTION` cannot
 *    stand in for it — that is a `Variants` object driving
 *    `opacity`/`x`/`y`/`clipPath`, a different mechanism entirely from a
 *    MotionValue-driven transform.
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
const ANCHOR_REVEAL = 0.45; // per-section visual anchor reveal
const RISE_ANCHOR = 16; // px travelled by an anchor reveal
const ANCHOR_STEP = 0.1; // gap between one section's anchor and the next
const HERO_BEAT = 0.35; // one hero beat's own duration
const HERO_BEAT_BASE = 0.4; // beat 0 starts as heroSequence.linework finishes
const HERO_BEAT_STEP = 0.15; // gap between consecutive hero beats
const DRIFT = 16; // px of scroll-linked travel, +DRIFT entering to -DRIFT leaving

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
 * Per-section cadence for the visual anchors, in the same idiom as
 * `revealClipStagger`: anchor `i` starts at `i * 0.1s` and takes 0.45s, so six
 * anchors are fully in by ~0.95s. Animates `opacity`/`y` only, so the element
 * needs `data-reveal` — not `data-reveal-path`, even when the anchor is
 * linework, because nothing here touches `pathLength`.
 */
export function anchorReveal(i: number): Variants {
  return {
    hidden: { opacity: 0, y: RISE_ANCHOR },
    shown: { opacity: 1, y: 0, transition: t(ANCHOR_REVEAL, i * ANCHOR_STEP) },
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
 * Per-beat reveal for hero beats layered on top of `heroSequence`. Its whole
 * reason to exist is that the timing stays in this file: a hero beat written
 * with an inline `delay:` in `components/sections/*.tsx` is rejected outright
 * by `scripts/assert-copy.mjs`, so a beat gets its cadence from here by index
 * instead.
 *
 * Beat `i` starts at `0.4 + i * 0.15s` and lasts 0.35s, so beats 0-8 all land
 * inside the hero's 2s ceiling (beat 8 finishes at 1.95s, level with
 * `heroSequence.label`). Animates `opacity`/`y`; needs `data-reveal`.
 */
export function heroReveal(i: number): Variants {
  return {
    hidden: { opacity: 0, y: RISE_CHILD },
    shown: {
      opacity: 1,
      y: 0,
      transition: t(HERO_BEAT, HERO_BEAT_BASE + i * HERO_BEAT_STEP),
    },
  };
}

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
    transition: { duration: 0 },
  },
  shown: {
    opacity: 1,
    x: 0,
    y: 0,
    clipPath: "none",
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

/**
 * Scroll-linked drift for layered linework. As `ref`'s element crosses the
 * viewport, scroll progress maps to a `y` of `+16px` (entering) through
 * `-16px` (leaving); hand the result to `style={{ y }}` on a `motion.*`
 * element. No spring, no smoothing — position follows the scrollbar exactly.
 *
 * The reduced-motion branch lives here rather than at the call site, and this
 * is the only place it can live: React forbids calling a hook conditionally,
 * so a consumer handed a bare config would have to write the branch itself,
 * once per element, and `assert-copy.mjs` only checks that the string
 * `useMotionSafe` appears in a file — never that the branch is right. One hook
 * means one branch to audit.
 *
 * Under reduced motion this returns a `MotionValue` pinned at `0`: the element
 * renders at its authored position and nothing ever writes to its transform.
 * The variants swap (`safe ? … : NO_MOTION`) cannot achieve this, and neither
 * can the `[data-reveal]` CSS restore — see rule 4 in the file header.
 *
 * Every hook below still runs on every render, in a fixed order. Only which of
 * the two values is returned changes.
 */
export function useDriftY(ref: RefObject<HTMLElement | null>): MotionValue<number> {
  const safe = useMotionSafe();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const drift = useTransform(scrollYProgress, [0, 1], [DRIFT, -DRIFT]);
  const still = useMotionValue(0);

  return safe ? drift : still;
}
