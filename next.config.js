const { withSentryConfig } = require('@sentry/nextjs');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  // Masque l'entete `x-powered-by: Next.js` (information disclosure mineure).
  poweredByHeader: false,
  transpilePackages: [
    'react-markdown',
    'rehype-raw',
    'hast-util-raw',
    'hast-util-from-parse5',
    'hast-util-to-parse5',
    'vfile',
    'unist-util-visit',
    'dompurify',
  ],
  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Trim deviceSizes/imageSizes : reduit l'explosion combinatoire du cache
    // image Vercel. 4 breakpoints couvrent 95% du parc mobile/tablet/desktop/wide.
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [16, 64, 128, 384],
    qualities: [75, 85, 90],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/niger/entreprises-strategiques',
        destination: '/entreprises',
        permanent: true,
      },
      {
        source: '/niger/presentation',
        destination: '/niger',
        permanent: true,
      },
    ];
  },
  async headers() {
    // La CSP est maintenant generee dynamiquement avec un nonce par requete
    // dans src/proxy.ts (middleware). Voir la fonction buildCspHeader.
    // Cette configuration ne gere plus que les headers statiques sans nonce.
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, follow',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // NB : ne PAS ajouter de directive `push`. `push` n'existe pas dans
            // la spec Permissions-Policy, les navigateurs la rejettent
            // ("Unrecognized feature: 'push'"). Le Web Push du Cockpit admin ne
            // depend pas de cet en-tete (il repose sur le service worker + la
            // permission de notification + HTTPS, same-origin par defaut).
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Content-Security-Policy gere dynamiquement avec un nonce par
          // requete dans src/proxy.ts (middleware) pour CSP nonce-based.
        ],
      },
    ];
  },
};

module.exports = withSentryConfig(withBundleAnalyzer(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  webpack: {
    treeshake: { removeDebugLogging: true },
  },
});
