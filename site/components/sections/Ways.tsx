// "Where it fits": the lead, three cards (title, command chip that wraps at spaces, body,
// optional link), then the planner note. No motion.
import Section from "@/components/Section";
import { ways } from "@/content/copy";
import type { SectionProps } from "@/lib/section";

export default function Ways({ meta }: SectionProps) {
  return (
    <Section meta={meta}>
      <p className="max-w-3xl text-lead text-ink">{ways.lead}</p>
      <ul className="mt-12 grid gap-px bg-line md:grid-cols-3">
        {ways.items.map((item) => (
          <li
            key={item.title}
            className="card-wash flex min-w-0 flex-col bg-surface px-6 py-8 sm:px-8"
          >
            <h3 className="font-mono text-mark uppercase text-ink">
              {item.title}
            </h3>
            <code className="mt-5 block overflow-x-auto whitespace-pre-wrap bg-ground px-4 py-3 font-mono text-mark text-accent">
              {item.command}
            </code>
            <p className="mt-5 text-body text-ink-dim">{item.body}</p>
            {item.href && item.linkText ? (
              <p className="mt-auto pt-5 text-mark">
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  {item.linkText}
                </a>
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-8 max-w-3xl border-l border-line pl-4 text-body text-ink-dim">
        {ways.plannerNote}
      </p>
    </Section>
  );
}
