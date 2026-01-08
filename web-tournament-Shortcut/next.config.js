// next.config.js
module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'discord.com', 'cdn.discordapp.com'],
    unoptimized: true,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },
  swcMinify: true,
  poweredByHeader: false,
  
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    localeDetection: true,  // Détection automatique de la langue
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  experimental: {
    // Allow dynamic page rendering in production for better hydration
    optimizeCss: true,
    scrollRestoration: true,
    legacyBrowsers: false,
    browsersListForSwc: true,
  },
  
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    
    return config;
  },
  
  // Disable React strict mode if needed for production
  // This can help with hydration issues, but is not a long-term solution
  // reactStrictMode: process.env.NODE_ENV !== 'production',
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'production' 
              ? "default-src 'self' https:; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://cdn.discordapp.com; font-src 'self' data:; connect-src 'self' https:; upgrade-insecure-requests;"
              : ""
          }
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          }
        ]
      }
    ]
  },
  
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/index',
        permanent: true,
      },
      // Redirection HTTP vers HTTPS (comme couche supplémentaire en plus de Cloudflare)
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http'
          }
        ],
        destination: 'https://:host/:path*',
        permanent: true
      }
    ]
  }
}