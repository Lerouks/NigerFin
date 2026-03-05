import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Providers } from './providers';
import { MainLayoutShell } from '@/components/MainLayoutShell';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
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
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'NFI Report',
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
