import type { Metadata } from 'next';
import { PremiumContent } from './PremiumContent';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Devenir Premium - NFI Report',
  description:
    'La connaissance, votre meilleur capital. Pour les jeunes qui veulent savoir, agir et investir en Afrique de l\u2019Ouest. Newsletters, articles, outils et analyses Premium.',
  openGraph: {
    title: 'NFI Report Premium - La connaissance, votre meilleur capital',
    description:
      'Newsletters exclusives, articles Premium illimités, outils financiers avancés et téléchargement PDF des analyses. \u00c0 partir de 5 000 FCFA/mois.',
    type: 'website',
  },
};

export default function PremiumPage() {
  return <PremiumContent />;
}
