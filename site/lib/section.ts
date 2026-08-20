/**
 * Section component interface and composition convention.
 *
 * Composition model:
 * - Each section component renders its OWN `<Section meta={meta}>` root;
 *   the shared `Section` shell component takes `SectionShellProps`.
 * - `app/page.tsx` renders bare `<Problem meta={...} />` — it does NOT wrap
 *   sections itself.
 * - **Hero is exempt**: it is NOT a `SectionComponent`, takes no props,
 *   has no `SectionMeta`, no eyebrow and no `<h2>`. `page.tsx` renders
 *   `<Hero />` unwrapped. Hero is the page's opening element with a load
 *   sequence, not a scroll-revealed section.
 */

import type React from "react";

export interface SectionMeta {
  id: string;
  eyebrow: string;
  heading: string;
}

export interface SectionProps {
  meta: SectionMeta;
}

export interface SectionShellProps {
  meta: SectionMeta;
  children: React.ReactNode;
}

export type SectionComponent = React.FC<SectionProps>;
