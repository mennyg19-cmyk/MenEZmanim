import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@zmanim-app/core', '@zmanim-app/db', '@zmanim-app/ui'],
  turbopack: {
    root: path.resolve(__dirname, '..', '..'),
  },
};

export default nextConfig;
