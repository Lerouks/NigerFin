import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Providers } from './providers';
import { MainLayoutShell } from '@/components/MainLayoutShell';
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

const playfair = localFont({
  src: [
    {
      path: '../fonts/PlayfairDisplay-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/PlayfairDisplay-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://nfireport.com'),
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
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <MainLayoutShell>{children}</MainLayoutShell>
        </Providers>
      </body>
    </html>
  );
}
