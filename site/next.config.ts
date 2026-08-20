import type { NextConfig } from "next";

/**
 * GitHub Pages serves a project site from `<user>.github.io/<repo>`, so every
 * emitted asset path has to carry the repo name. This is the ONE place that
 * decides it.
 *
 * Deploying anywhere that serves from a domain root instead (a custom domain,
 * or a `<user>.github.io` repo) means setting this to an empty string — and
 * nothing else. `scripts/measure-reduced-motion.mjs` strips the prefix when it
 * is present, so it keeps working either way.
 */
const BASE_PATH = "/drydock";

const nextConfig: NextConfig = {
  output: "export",
  basePath: BASE_PATH,
  images: { unoptimized: true },
};

export default nextConfig;
