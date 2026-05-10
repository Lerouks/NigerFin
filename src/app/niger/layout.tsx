import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: {
    template: '%s | Niger | NFI Report',
    default: 'Niger : économie, entreprises et chiffres clés',
  },
  description: 'Tout savoir sur le Niger : profil économique, chiffres clés, régions, ressources naturelles et les entreprises stratégiques du pays.',
  keywords: ['Niger', 'économie Niger', 'entreprises Niger', 'SOMAÏR', 'COMINAK', 'NIGELEC', 'SONIBANK', 'SONIDEP', 'BAGRI', 'SOPAMIN', 'Niger Telecoms', 'uranium Niger', 'Afrique de l\'Ouest', 'UEMOA'],
  alternates: { canonical: `${SITE_URL}/niger` },
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

export default function NigerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
