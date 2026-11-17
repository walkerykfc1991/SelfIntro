import { execFileSync } from "node:child_process";
import type { NextConfig } from "next";

/**
 * Project site: https://walkerykfc1991.github.io/SelfIntro/
 * basePath must match the repository name. Dev and the static export
 * both use it, so asset URLs match GitHub Pages.
 */
const basePath = "/SelfIntro";
const sourceStamp = execFileSync(process.execPath, ["scripts/source-stamp.mjs"], {
  encoding: "utf8",
}).trim();

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  generateBuildId: () => "walker-yip",
  env: {
    NEXT_PUBLIC_SOURCE_STAMP: sourceStamp,
  },
};

export default nextConfig;
