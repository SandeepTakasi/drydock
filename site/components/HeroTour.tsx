"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { hero, type TerminalLine, type TourScene } from "@/content/copy";
import {
  NO_MOTION,
  TOUR_DWELL_MS,
  revealClipStagger,
  useMotionSafe,
} from "@/lib/motion";

const TONE: Record<TerminalLine["tone"], string> = {
  dim: "text-ink-dim",
  ink: "text-ink",
  accent: "text-accent",
  pass: "text-pass",
  block: "text-block",
};

const BADGE: Record<TourScene["badgeTone"], string> = {
  accent: "border-accent text-accent",
  pass: "border-pass text-pass",
  block: "border-block text-block",
};

/**
 * The hero tour: five real moments, one per part of the loop, shown as tabs.
 *
 * Every panel is rendered into the export, inactive ones `invisible`, so
 * each `<pre data-excerpt-of>` is checked line by line by assert-copy whether
 * or not it is on screen. The first scene paints statically (no inline
 * opacity before hydration); later scenes replay their lines with the clip
 * reveal from lib/motion. The tour advances every TOUR_DWELL_MS while the
 * pointer is away and focus is outside it (the toggle excepted), until a tab
 * is chosen or Pause is pressed, and never under reduced motion. The tabs
 * follow the ARIA tabs pattern: roving tabindex, arrows, Home and End.
 */
export default function HeroTour() {
  const scenes = hero.tour;
  const motionSafe = useMotionSafe();
  const [active, setActive] = useState(0);
  const [stopped, setStopped] = useState(false);
  // Hover and focus hold the tour separately, so the pointer leaving cannot
  // advance it while keyboard focus is inside a panel about to be hidden.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // Bumped on every scene change; 0 means nothing has changed since paint.
  const [run, setRun] = useState(0);
  const played = run > 0;
  const running = motionSafe && !stopped && !hovered && !focused;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRun((r) => r + 1);
      setActive((i) => (i + 1) % scenes.length);
    }, TOUR_DWELL_MS);
    return () => window.clearInterval(id);
  }, [running, scenes.length]);

  const choose = (i: number) => {
    setStopped(true);
    setRun((r) => r + 1);
    setActive(i);
  };

  // ARIA tabs keyboard contract: arrows move between tabs and choose them,
  // Home and End jump to the ends; only the active tab is in the Tab order.
  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    const last = scenes.length - 1;
    const to =
      e.key === "ArrowRight" ? (i === last ? 0 : i + 1)
      : e.key === "ArrowLeft" ? (i === 0 ? last : i - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (to === null) return;
    e.preventDefault();
    choose(to);
    document.getElementById(`tour-tab-${scenes[to].id}`)?.focus();
  };

  return (
    <div
      className="min-w-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // Focus on the Play/Pause toggle itself does not hold the tour, so a
      // keyboard Play visibly plays.
      onFocus={(e) => setFocused(!(e.target as HTMLElement).dataset.tourToggle)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <p className="mb-3 text-note text-ink-dim">{hero.tourLead}</p>
      <div className="flex items-center justify-between gap-3">
        <div role="tablist" aria-label={hero.tourLabel} className="flex flex-wrap gap-1">
          {scenes.map((scene, i) => (
            <button
              key={scene.id}
              type="button"
              role="tab"
              id={`tour-tab-${scene.id}`}
              aria-selected={i === active}
              aria-controls={`tour-panel-${scene.id}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => choose(i)}
              onKeyDown={(e) => onTabKey(e, i)}
              className={
                "border-b-2 px-2.5 py-2 font-mono text-mark uppercase transition-colors " +
                (i === active
                  ? "border-accent-2 text-ink"
                  : "border-transparent text-ink-dim hover:text-ink")
              }
            >
              {scene.tab}
            </button>
          ))}
        </div>
        {motionSafe ? (
          <button
            type="button"
            data-tour-toggle="true"
            onClick={() => setStopped((s) => !s)}
            aria-label={stopped ? hero.tourPlay : hero.tourPause}
            className="shrink-0 border border-line px-2.5 py-1.5 font-mono text-mark text-ink-dim uppercase transition-colors hover:text-ink"
          >
            {stopped ? hero.tourPlayShort : hero.tourPauseShort}
          </button>
        ) : null}
      </div>

      {/* All panels share one grid cell, so the box is always as tall as the
          tallest scene and nothing below it moves as the tour advances.
          Inactive panels are `invisible`, which also takes them out of the
          accessibility tree and the tab order. */}
      <div className="mt-3 grid">
      {scenes.map((scene, i) => (
        <figure
          key={scene.id}
          id={`tour-panel-${scene.id}`}
          role="tabpanel"
          aria-labelledby={`tour-tab-${scene.id}`}
          aria-hidden={i !== active}
          className={`card-wash border border-line bg-surface [grid-area:1/1] ${i === active ? "" : "invisible"}`}
        >
          <figcaption className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 font-mono text-mark uppercase">
            <span className="text-ink-dim">{scene.label}</span>
            <span
              className={`border px-2 py-1 ${BADGE[scene.badgeTone]}`}
              {...(scene.verdict ? { "data-excerpt-verdict": scene.source } : {})}
            >
              {scene.badge}
            </span>
          </figcaption>
          <div className="px-4 py-5">
            <pre
              data-excerpt-of={scene.source}
              className="font-mono text-note whitespace-pre-wrap break-words"
            >
              {scene.lines.map((line, n) => (
                <motion.span
                  key={`${i === active ? run : "idle"}-${line.text}`}
                  className={`block ${TONE[line.tone]}`}
                  variants={motionSafe && played ? revealClipStagger(n) : NO_MOTION}
                  initial={motionSafe && played && i === active ? "hidden" : false}
                  animate="shown"
                >
                  {line.text}
                </motion.span>
              ))}
            </pre>
          </div>
          <p className="border-t border-line px-4 py-3 text-note text-ink-dim">
            {scene.caption}{" "}
            <a href={scene.href} className="text-accent underline underline-offset-2">
              {scene.source}
            </a>
          </p>
        </figure>
      ))}
      </div>
    </div>
  );
}
