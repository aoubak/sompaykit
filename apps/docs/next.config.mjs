import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  // Static files only (out/), served by Cloudflare Pages. No server, no functions.
  output: 'export',
  reactStrictMode: true,
  // The repo's root ESLint config covers this app (pnpm lint).
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  // Live previews import the registry components straight from ../../registry/src.
  experimental: { externalDir: true },
};

export default withMDX(config);
