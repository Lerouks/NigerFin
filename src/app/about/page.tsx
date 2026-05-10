import type { Metadata } from 'next';
import { AboutHero } from './AboutHero';
import { AboutContent } from './AboutContent';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'À propos : notre mission et notre équipe',
  description: "Découvrez la mission, les valeurs et les fondateurs de NFI Report, source d'information économique et financière du Niger et de l'Afrique.",
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'À propos : notre mission et notre équipe',
    description: "Découvrez NFI Report, votre source d'information économique et financière de référence pour le Niger et l'Afrique.",
    type: 'website',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <AboutHero />
      <AboutContent />
    </div>
  );
}
