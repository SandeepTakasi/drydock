import Evidence from "@/components/sections/Evidence";
import Faq from "@/components/sections/Faq";
import Hero from "@/components/sections/Hero";
import Install from "@/components/sections/Install";
import Lifecycle from "@/components/sections/Lifecycle";
import Problem from "@/components/sections/Problem";
import Terminal from "@/components/sections/Terminal";
import { meta } from "@/content/copy";

/**
 * Page composition. Every seam the seven Phase-2 section tasks need is wired
 * here already: this file is owned by no Phase-2 task and must not change again.
 *
 * `<Hero />` is unwrapped and takes no props — it is not a section shell.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Problem meta={meta.problem} />
      <Evidence meta={meta.evidence} />
      <Terminal meta={meta.terminal} />
      <Lifecycle meta={meta.lifecycle} />
      <Install meta={meta.install} />
      <Faq meta={meta.faq} />
    </>
  );
}
