import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SITE_URL } from '@/lib/config';
import { NigerPageContent } from './NigerPageContent';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Niger : présentation, économie et entreprises stratégiques',
  description: 'Tout savoir sur le Niger : profil économique, chiffres clés, PIB, population, régions, ressources naturelles (uranium, pétrole, or) et les entreprises stratégiques du pays (SOMAÏR, COMINAK, NIGELEC, SONIBANK, SONIDEP, BAGRI, SOPAMIN, Niger Telecoms).',
  keywords: ['Niger', 'économie Niger', 'entreprises Niger', 'SOMAÏR', 'COMINAK', 'NIGELEC', 'SONIBANK', 'SONIDEP', 'BAGRI', 'SOPAMIN', 'Niger Telecoms', 'uranium Niger', 'PIB Niger', 'Afrique de l\'Ouest', 'UEMOA'],
  alternates: {
    canonical: `${SITE_URL}/niger`,
  },
  openGraph: {
    title: 'Niger : présentation, économie et entreprises stratégiques',
    description: 'Profil économique complet du Niger : chiffres clés, régions, ressources naturelles et les 8 entreprises stratégiques du pays.',
    type: 'website',
    url: `${SITE_URL}/niger`,
    siteName: 'NFI Report',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Niger : présentation, économie et entreprises stratégiques',
    description: 'Profil économique complet du Niger et ses entreprises stratégiques.',
  },
};

export default function NigerPage() {
  return (
    <Suspense>
      <NigerPageContent />
    </Suspense>
  );
}
