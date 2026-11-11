const isDev = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const config = {
  // Pages are static files (out/). /api/* is a Cloudflare Pages Function (functions/api).
  ...(isDev ? {} : { output: 'export' }),
  reactStrictMode: true,
  // The repo's root ESLint config covers this app (pnpm lint).
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  // The shop uses the registry components straight from ../../registry/src.
  experimental: { externalDir: true },
  // In dev, scripts/dev-api.ts stands in for the Pages Function.
  ...(isDev && {
    rewrites: async () => [
      { source: '/api/:path*', destination: 'http://localhost:8788/api/:path*' },
    ],
  }),
};

export default config;
