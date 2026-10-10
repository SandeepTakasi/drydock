"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { nav } from "@/content/copy";

/**
 * The header's inline section links (from `md` up), with the one for the
 * section in the middle of the viewport marked current. An
 * IntersectionObserver watches every section on the page; its callback
 * sets the state, so nothing runs synchronously in the effect body. On the
 * evidence route the Evidence link is current instead.
 *
 * prefetch={false}: next@16's static export writes the /evidence segment
 * prefetch as `__next.evidence/__PAGE__.txt` but the client requests
 * `__next.evidence.__PAGE__.txt`, so every prefetch 404s in the console.
 */
export default function NavLinks() {
  const pathname = usePathname();
  const [section, setSection] = useState<string | null>(null);

  useEffect(() => {
    // Every section, not only the linked ones: reaching one with no link
    // (problem, limits, FAQ) clears the highlight instead of leaving a stale one.
    const targets = [...document.querySelectorAll<HTMLElement>("main section[id]")];
    if (targets.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setSection(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {nav.map((item) => {
        const id = item.href.split("#")[1];
        // Pages serves /evidence as /evidence/, so compare without the slash.
        const current = id ? id === section : pathname.replace(/[/]$/, "") === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            aria-current={current ? "location" : undefined}
            className={
              "hidden border-b py-1.5 font-mono text-mark uppercase transition-colors md:inline-block " +
              (current
                ? "border-accent-2 text-ink"
                : "border-transparent text-ink-dim hover:text-ink")
            }
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
