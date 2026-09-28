import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/auth/v1/:path*',
        destination: 'http://mp.asgardpy.click:9999/:path*',
      },
      {
        source: '/rest/v1/:path*',
        destination: 'http://mp.asgardpy.click:3001/:path*',
      },
    ];
  },
};

export default nextConfig;
