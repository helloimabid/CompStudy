import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* SEO Optimizations */
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Optimize image quality for smaller file sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Experimental features for modern JavaScript
  experimental: {
    // Optimize package imports for smaller bundles
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
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

  // Redirects for SEO pages (old URLs to new /tools/ URLs)
  async redirects() {
    // List of SEO page slugs that moved to /tools/
    const seoSlugs = [
      'pomodoro-timer',
      'pomodoro-timer-online',
      'aesthetic-pomodoro-timer',
      'pomodoro',
      'pomofocus',
      'timer',
      '25-minute-timer',
      'study-timer',
      'stopwatch',
      'stop-watch',
      'online-stopwatch',
    ];

    return seoSlugs.map((slug) => ({
      source: `/${slug}`,
      destination: `/tools/${slug}`,
      permanent: true, // 301 redirect for SEO
    }));
  },

  // Improve SEO with trailing slash consistency
  trailingSlash: false,
  
  // Enable compression
  compress: true,
};

export default nextConfig;
