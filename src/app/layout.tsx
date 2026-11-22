import type { Metadata, Viewport } from 'next';
import { Montserrat, Playfair_Display } from 'next/font/google';
import { headers } from 'next/headers';
import { Providers } from './providers';
import { MainLayoutShell } from '@/components/MainLayoutShell';
import { ViewTracker } from '@/components/ViewTracker';
import { CookieBanner } from '@/components/CookieBanner';
import { CivilityPrompt } from '@/components/CivilityPrompt';
import { SITE_URL } from '@/lib/config';
import { getFlashBanner, getSiteFeatures } from '@/lib/site-data';
import { isAdminViewer } from '@/lib/viewer';
import { ComingSoon } from '@/components/coming-soon/ComingSoon';
import { PrelaunchShell } from '@/components/coming-soon/PrelaunchShell';
import './globals.css';

// Police des textes (charte NFI, décision de la direction du 22/11/2026) :
// Montserrat partout, comme sur nos visuels. Police variable (graisses 100 à
// 900), auto-hébergée par next/font au build (aucune requête externe au
// runtime, compatible CSP).
const montserrat = Montserrat({
  subsets: ['latin'],
  style: ['normal'],
  variable: '--font-montserrat',
  display: 'swap',
});

// Serif de marque (charte NFI) : réservée au mot « NFI REPORT » et au slogan.
// Auto-hébergée par next/font au build (aucune requête externe au runtime, compatible CSP).
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '700'],
  style: ['normal'],
  variable: '--font-playfair',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const baseMetadata: Metadata = {
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

export async function generateMetadata(): Promise<Metadata> {
  const { prelaunchEnabled } = await getSiteFeatures();
  // En pré-lancement, tout le site passe en noindex : Googlebot est anonyme,
  // il voit donc la page « Prochainement ». Retour à l'indexation au lancement.
  // `follow` reste vrai dans les deux cas : « noindex, follow » laisse Google
  // parcourir les liens et apprendre l'architecture du site pendant l'attente,
  // sans rien publier dans ses résultats. Un `nofollow` ferait perdre ce temps.
  return {
    ...baseMetadata,
    robots: { index: !prelaunchEnabled, follow: true },
  };
}

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
  const headerList = await headers();
  // Recupere le nonce CSP injecte par src/proxy.ts pour les scripts inline.
  const nonce = headerList.get('x-nonce') ?? undefined;
  const pathname = headerList.get('x-pathname') ?? '/';

  // Mode pré-lancement : le public voit « Prochainement », les admins connectés
  // voient le site complet. On laisse toujours passer /connexion, /auth et /admin
  // pour que l'admin puisse se connecter puis basculer le mode.
  // On laisse aussi passer les pages légales et le désabonnement : la page
  // d'attente collecte déjà des adresses, donc qui la donne doit pouvoir lire
  // qui la collecte, et qui veut sortir doit pouvoir sortir.
  const { prelaunchEnabled } = await getSiteFeatures();
  let showComingSoon = false;
  // Visiteur non admin sur une page restée ouverte (légales, connexion,
  // désabonnement) : il la voit sans le menu du site, pour ne pas « entrer »
  // dans le site depuis la page d'attente.
  let prelaunchVisitor = false;
  if (prelaunchEnabled) {
    const isBypassPath =
      pathname === '/connexion' ||
      pathname.startsWith('/connexion/') ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/admin') ||
      pathname === '/mentions-legales' ||
      pathname === '/confidentialite' ||
      pathname === '/cgu' ||
      pathname === '/cookies' ||
      pathname.startsWith('/newsletter/desabonnement');
    const admin = await isAdminViewer();
    if (!isBypassPath) {
      showComingSoon = !admin;
    } else if (!admin && !pathname.startsWith('/admin')) {
      prelaunchVisitor = true;
    }
  }

  const initialFlashBanner = showComingSoon
    ? { enabled: false as const, items: [] }
    : await getFlashBanner();

  return (
    <html lang="fr" dir="ltr" className={`${montserrat.variable} ${playfair.variable}`} suppressHydrationWarning>
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
        {showComingSoon ? (
          <ComingSoon />
        ) : prelaunchVisitor ? (
          <Providers>
            <PrelaunchShell>{children}</PrelaunchShell>
          </Providers>
        ) : (
          <Providers>
            <ViewTracker />
            <MainLayoutShell initialFlashBanner={initialFlashBanner}>{children}</MainLayoutShell>
            <CookieBanner />
            <CivilityPrompt />
          </Providers>
        )}
      </body>
    </html>
  );
}
