import Evidence from "@/components/sections/Evidence";
import Faq from "@/components/sections/Faq";
import Hero from "@/components/sections/Hero";
import Install from "@/components/sections/Install";
import Lifecycle from "@/components/sections/Lifecycle";
import Problem from "@/components/sections/Problem";
import Terminal from "@/components/sections/Terminal";
import { meta } from "@/content/copy";

/**
 * Page composition. The order is the argument: the failure mode, then the
 * mechanism, then the gate refusing a wave, then what is and is not verified,
 * then install.
 *
 * `<Hero />` is unwrapped and takes no props — it is not a section shell.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Problem meta={meta.problem} />
      <Lifecycle meta={meta.lifecycle} />
      <Terminal meta={meta.terminal} />
      <Evidence meta={meta.evidence} />
      <Install meta={meta.install} />
      <Faq meta={meta.faq} />
    </>
  );
}
