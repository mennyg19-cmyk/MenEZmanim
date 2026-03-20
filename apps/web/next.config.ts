import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@zmanim-app/core', '@zmanim-app/db', '@zmanim-app/ui'],
  turbopack: {
    root: path.resolve(__dirname, '..', '..'),
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
