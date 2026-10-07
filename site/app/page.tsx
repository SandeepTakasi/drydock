import Faq from "@/components/sections/Faq";
import Hero from "@/components/sections/Hero";
import Install from "@/components/sections/Install";
import Lifecycle from "@/components/sections/Lifecycle";
import Limits from "@/components/sections/Limits";
import Problem from "@/components/sections/Problem";
import Refusals from "@/components/sections/Refusals";
import { meta } from "@/content/copy";

/**
 * Page composition. The order is the argument: the failure mode, then the
 * mechanism, then the gate's refusals, then what it does not do, then install.
 * The evidence matrix lives at /evidence.
 *
 * `<Hero />` is unwrapped and takes no props — it is not a section shell.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Problem meta={meta.problem} />
      <Lifecycle meta={meta.lifecycle} />
      <Refusals meta={meta.refuses} />
      <Limits meta={meta.limits} />
      <Install meta={meta.install} />
      <Faq meta={meta.faq} />
    </>
  );
}
