import type { Metadata } from 'next';
import { AboutContent } from './AboutContent';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'À propos',
  description: "Découvrez NFI Report, votre source d'information économique et financière de référence pour le Niger et l'Afrique.",
  openGraph: {
    title: 'À propos de NFI Report',
    description: "Découvrez NFI Report, votre source d'information économique et financière de référence pour le Niger et l'Afrique.",
    type: 'website',
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
