import type { Metadata } from 'next';
import { NigerPageContent } from './NigerPageContent';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'Niger : présentation et entreprises stratégiques',
  description: 'Découvrez le Niger : profil économique, chiffres clés, régions, ressources naturelles et entreprises stratégiques du pays.',
  openGraph: {
    title: 'Niger : présentation et entreprises stratégiques',
    description: 'Découvrez le Niger : profil économique, chiffres clés, régions, ressources naturelles et entreprises stratégiques du pays.',
    type: 'website',
  },
};

export default function NigerPage() {
  return <NigerPageContent />;
}
