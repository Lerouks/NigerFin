import type { Metadata } from 'next';
import { PricingContent } from './PricingContent';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Tarifs Premium : abonnement mensuel et annuel',
  description:
    'Tarifs NFI Report Premium : 5 000 FCFA/mois, 13 750 FCFA/trim, 50 000 FCFA/an. Paiement Mobile Money ou carte bancaire. Résiliable en ligne.',
  keywords: [
    'tarifs NFI Report',
    'prix abonnement NFI Report',
    's’abonner NFI Report',
    'Premium FCFA',
    'paiement Mobile Money',
  ],
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'Tarifs Premium : abonnement mensuel et annuel',
    description:
      'Choisis le rythme qui te convient. À partir de 5 000 FCFA/mois. Mobile Money (Airtel, Moov) ou Visa, Mastercard, American Express. Résiliable à tout moment.',
    type: 'website',
    url: '/pricing',
  },
};

export default function PricingPage() {
  return <PricingContent />;
}
