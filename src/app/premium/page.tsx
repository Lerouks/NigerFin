import type { Metadata } from 'next';
import { PremiumContent } from './PremiumContent';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Devenir Premium : analyses et outils exclusifs',
  description:
    'Newsletters, articles et outils financiers exclusifs pour décider et investir en Afrique de l’Ouest. À partir de 5 000 FCFA/mois.',
  keywords: [
    'NFI Report Premium',
    'abonnement NFI Report',
    'newsletter économique Afrique',
    'analyses financières Niger',
    'éducation financière Afrique de l’Ouest',
  ],
  alternates: {
    canonical: '/premium',
  },
  openGraph: {
    title: 'NFI Report Premium - La connaissance, votre meilleur capital',
    description:
      'Newsletters exclusives, articles Premium illimités, outils financiers avancés et téléchargement PDF des analyses. À partir de 5 000 FCFA/mois.',
    type: 'website',
    url: '/premium',
  },
};

export default function PremiumPage() {
  return <PremiumContent />;
}
