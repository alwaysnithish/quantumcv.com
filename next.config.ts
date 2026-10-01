import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: __dirname,
  },
  // @sparticuz/chromium ships a compressed binary that must NOT be
  // processed/relocated by the bundler, or its internal path resolution
  // breaks at runtime on Vercel with "input directory does not exist".
  // See: https://github.com/Sparticuz/chromium#bundler-configuration
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
};

export default nextConfig;
