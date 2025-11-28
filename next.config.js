/**
 * Next.js Configuration
 * 
 * Optimized for production deployment on Vercel.
 * Uses Turbopack (default in Next.js 16) for faster builds.
 * 
 * Note: Webpack configuration removed - Turbopack handles Node.js module
 * fallbacks (fs, net, tls) automatically for client-side code.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  
  // Note: Buffer deprecation warnings from dependencies (qrcode, otplib, bcryptjs)
  // are handled by using the latest versions of these packages.
  // The warnings are non-blocking and don't affect functionality.
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  
  // Experimental features for better performance
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
  
  // Note: Turbopack (default in Next.js 16) automatically handles:
  // - Node.js module fallbacks (fs, net, tls) for client-side code
  // - Bundle optimization
  // - Tree shaking
  // No custom webpack or turbopack config needed
};

module.exports = nextConfig;
