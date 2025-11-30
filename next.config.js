/**
 * Next.js Configuration
 * 
 * Optimized for production deployment on Vercel.
 * Uses Turbopack (default in Next.js 16) for faster builds.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  
  // Buffer deprecation warnings from dependencies (qrcode, otplib) are suppressed
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60, // Cache optimized images for 60 seconds
  },
  
  // Server components optimizations
  serverExternalPackages: ['@prisma/client', 'bcrypt'],
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react', '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities', 'framer-motion'],
  },
  
  // PWA and mobile optimizations
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
    ];
  },
  
  // Turbopack (default in Next.js 16) handles module fallbacks and optimizations
};

module.exports = nextConfig;
