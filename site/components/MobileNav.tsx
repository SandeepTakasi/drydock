"use client";

import { useRef } from "react";
import { nav } from "@/content/copy";

/**
 * The section links below `md`, where the header's inline nav is hidden.
 *
 * A native `<details>`, like the FAQ: keyboard accessible, no library, no
 * portal, no focus trap to get wrong. The one thing `<details>` does not do by
 * itself is close after you pick something, and the header is `sticky`, so an
 * open menu would ride down the page covering the section it just jumped to.
 * A ref that drops the `open` attribute fixes that in one line -- no state, no
 * effect, and so nothing for `react-hooks/set-state-in-effect` to reject.
 */
export default function MobileNav() {
  const ref = useRef<HTMLDetailsElement>(null);

  return (
    <details ref={ref} className="relative md:hidden">
      <summary className="flex cursor-pointer list-none items-center border border-line px-2.5 py-1.5 font-mono text-mark text-ink-dim uppercase transition-colors marker:content-none hover:text-ink">
        Menu
      </summary>
      <ul className="absolute right-0 z-50 mt-2 flex w-44 flex-col border border-line bg-surface">
        {nav.map((item) => (
          <li key={item.href} className="border-b border-line last:border-b-0">
            <a
              href={item.href}
              onClick={() => ref.current?.removeAttribute("open")}
              className="block px-4 py-3 font-mono text-mark text-ink-dim uppercase transition-colors hover:text-ink"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
