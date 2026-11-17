import type { NextConfig } from "next";

/**
 * Project site: https://walkerykfc1991.github.io/SelfIntro/
 * basePath must match the repository name. Dev and the static export
 * both use it, so asset URLs match GitHub Pages.
 */
const basePath = "/SelfIntro";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  generateBuildId: () => "walker-yip",
};

export default nextConfig;
