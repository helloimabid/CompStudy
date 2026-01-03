import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* SEO Optimizations */
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Generate sitemap and robots.txt
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ],
      },
    ];
  },

  // Improve SEO with trailing slash consistency
  trailingSlash: false,
  
  // Enable compression
  compress: true,
};

export default nextConfig;
