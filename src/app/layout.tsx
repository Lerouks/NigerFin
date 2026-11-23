import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Playfair_Display } from 'next/font/google';
import { headers } from 'next/headers';
import { Providers } from './providers';
import { MainLayoutShell } from '@/components/MainLayoutShell';
import { ViewTracker } from '@/components/ViewTracker';
import { CookieBanner } from '@/components/CookieBanner';
import { CivilityPrompt } from '@/components/CivilityPrompt';
import { NOM_DU_SITE, SITE_URL, TITRE_DU_SITE } from '@/lib/config';
import { getFlashBanner, getSiteFeatures } from '@/lib/site-data';
import { isAdminViewer } from '@/lib/viewer';
import { PAGE_ATTENTE, estPageOuverte } from '@/lib/pre-lancement';
import { ComingSoon } from '@/components/coming-soon/ComingSoon';
import './globals.css';

// Inter en police variable (toutes les graisses de 100 à 900 dans un seul
// fichier de 48 Ko, sous-ensemble latin de @fontsource-variable/inter 5.2.5).
// Les quatre fichiers fixes d'avant (96 Ko) s'arrêtaient au gras 700 : les
// titres en extra-gras et en black du site s'affichaient en gras simple.
const inter = localFont({
  src: '../fonts/Inter-Variable.woff2',
  weight: '100 900',
  style: 'normal',
  variable: '--font-inter',
  display: 'swap',
});

// Serif de marque (charte NFI) : réservée au wordmark et au slogan/citation.
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
    default: TITRE_DU_SITE,
    template: `%s | ${NOM_DU_SITE}`,
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
  // Icône d'onglet (23/11/2026) : un rond noir parfait, sans bord, comme une
  // photo de profil, avec la pyramide argentée du logo officiel. Le fond noir
  // est indispensable : le logo est argenté, il disparaîtrait sur la barre
  // d'onglets claire de Safari. Traits épaissis à 16 et 32 pixels pour rester
  // lisibles. favicon.ico contient 16, 32 et 48 pixels. « ?v=2 » change
  // l'adresse pour que Safari, qui garde longtemps ses icônes, prenne la
  // nouvelle. L'icône iPhone reste carrée : iOS arrondit lui-même ses coins.
  icons: {
    icon: [
      { url: '/favicon.ico?v=2', sizes: '16x16 32x32 48x48' },
      { url: '/icone-32.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/icone-192.png?v=2', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: NOM_DU_SITE,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: TITRE_DU_SITE,
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
  name: NOM_DU_SITE,
  alternateName: TITRE_DU_SITE,
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
  name: NOM_DU_SITE,
  url: SITE_URL,
  inLanguage: 'fr-FR',
  publisher: {
    '@type': 'NewsMediaOrganization',
    name: NOM_DU_SITE,
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

  // Mode pré-lancement. La porte elle-même est tenue par src/proxy.ts : toute
  // page fermée y est réécrite vers la page d'attente, navigations internes
  // comprises. Ici, on ne choisit que l'habillage, et il ne dépend que du
  // lecteur, jamais de la page : un layout racine n'est pas réexécuté lors
  // d'une navigation interne, donc un habillage choisi selon la page resterait
  // collé à la suivante (c'est par là que « Retour à l'accueil », depuis la
  // politique de confidentialité, ouvrait tout le site jusqu'au 23/11/2026).
  // - visiteur : aucun menu du site ; la page d'attente occupe l'écran et les
  //   pages ouvertes (légales, connexion, désabonnement) portent leur propre
  //   habillage (HabillagePreLancement) ;
  // - admin, ou site lancé : le site complet.
  const { prelaunchEnabled } = await getSiteFeatures();
  const visiteur = prelaunchEnabled && !(await isAdminViewer());
  // Filet de sécurité si le proxy laissait passer une page fermée (panne,
  // erreur de configuration) : la page d'attente la remplace.
  const pageFermee = visiteur && pathname !== PAGE_ATTENTE && !estPageOuverte(pathname);
  // La page d'attente s'affiche toujours seule, y compris pour un admin qui
  // ouvre /attente pour la regarder.
  const sansMenu = visiteur || pathname === PAGE_ATTENTE;

  const initialFlashBanner = sansMenu
    ? { enabled: false as const, items: [] }
    : await getFlashBanner();

  return (
    <html lang="fr" dir="ltr" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
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
        {pageFermee ? (
          <ComingSoon />
        ) : sansMenu ? (
          <Providers>{children}</Providers>
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
