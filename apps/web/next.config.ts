import type { NextConfig } from 'next';
import path from 'path';

/** Monorepo root (repo root), not apps/web — required for correct NFT when using workspaces. */
const monorepoRoot = path.resolve(__dirname, '..', '..');

const nextConfig: NextConfig = {
  /** Turso/libSQL: keep nested `hrana-client` resolution on the server filesystem (avoid broken Turbopack bundles). */
  serverExternalPackages: [
    '@prisma/adapter-libsql',
    '@libsql/client',
    '@libsql/hrana-client',
    'libsql',
  ],
  /**
   * Trace files from the repo root so `@zmanim-app/*` workspace packages resolve on Vercel.
   * Without this, dynamic routes can 404 in production while static pages & APIs still work.
   */
  outputFileTracingRoot: monorepoRoot,
  /**
   * `standalone` is for Docker/self-host. On Vercel it fights the platform bundle and can
   * drop App Router lambdas for dynamic pages. Keep standalone for local `node server.js` flows.
   */
  ...(process.env.VERCEL ? {} : { output: 'standalone' as const }),
  transpilePackages: ['@zmanim-app/core', '@zmanim-app/ui', '@zmanim-app/db'],
  turbopack: {
    root: monorepoRoot,
  },
  /** Legacy /demo/:id only — do not redirect all /:a/:b or /login/sso-callback would break. */
  async redirects() {
    return [
      {
        source: '/demo/:screenId',
        destination: '/show/demo/:screenId',
        permanent: true,
      },
    ];
  },
  /**
   * Stop Vercel edge from caching stale 404s (logs: /login, /show/demo/1 with cache HIT + 404).
   */
  async headers() {
    const noStore = [
      {
        key: 'Cache-Control',
        value: 'private, no-cache, no-store, max-age=0, must-revalidate',
      },
    ];
    return [
      { source: '/api/:path*', headers: noStore },
      { source: '/login', headers: noStore },
      { source: '/login/:path*', headers: noStore },
      { source: '/register', headers: noStore },
      { source: '/register/:path*', headers: noStore },
      { source: '/show/:path*', headers: noStore },
      { source: '/admin', headers: noStore },
      { source: '/admin/:path*', headers: noStore },
    ];
  },
};

export default nextConfig;
