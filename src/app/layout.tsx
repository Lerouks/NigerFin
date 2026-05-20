import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { headers } from 'next/headers';
import { Providers } from './providers';
import { MainLayoutShell } from '@/components/MainLayoutShell';
import { ViewTracker } from '@/components/ViewTracker';
import { CookieBanner } from '@/components/CookieBanner';
import { CivilityPrompt } from '@/components/CivilityPrompt';
import { SITE_URL } from '@/lib/config';
import { getFlashBanner } from '@/lib/site-data';
import './globals.css';

const inter = localFont({
  src: [
    {
      path: '../fonts/Inter-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/Inter-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/Inter-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../fonts/Inter-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'NFI Report - Actualités économiques et financières du Niger',
    template: '%s | NFI Report',
  },
  description:
    "Votre source d'informations économiques et financières pour le Niger et l'Afrique de l'Ouest. Articles, analyses, outils financiers et données de marché.",
  keywords: [
    'Niger',
    'économie',
    'finance',
    'BRVM',
    'UEMOA',
    'Afrique',
    'investissement',
    'uranium',
    'FCFA',
  ],
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'NFI Report',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NFI Report - Actualités économiques et financières du Niger',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NewsMediaOrganization',
  name: 'NFI Report',
  alternateName: 'NFI Report - Actualités économiques et financières du Niger',
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  description:
    "Média d'information économique et financière dédié au Niger et à l'Afrique de l'Ouest.",
  inLanguage: 'fr-FR',
  areaServed: ['NE', 'Afrique de l\'Ouest'],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'contact@nfireport.com',
    availableLanguage: ['French'],
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'NFI Report',
  url: SITE_URL,
  inLanguage: 'fr-FR',
  publisher: {
    '@type': 'NewsMediaOrganization',
    name: 'NFI Report',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/articles?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialFlashBanner = await getFlashBanner();
  // Recupere le nonce CSP injecte par src/proxy.ts pour les scripts inline.
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang="fr" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <ViewTracker />
          <MainLayoutShell initialFlashBanner={initialFlashBanner}>{children}</MainLayoutShell>
          <CookieBanner />
          <CivilityPrompt />
        </Providers>
      </body>
    </html>
  );
}
