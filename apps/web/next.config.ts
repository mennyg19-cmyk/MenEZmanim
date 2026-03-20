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
};

export default nextConfig;
