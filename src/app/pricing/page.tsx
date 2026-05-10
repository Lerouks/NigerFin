import type { Metadata } from 'next';
import { PricingContent } from './PricingContent';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Tarifs Premium : abonnement mensuel et annuel',
  description:
    'Tarifs NFI Report Premium: mensuel 5 000 FCFA, trimestriel 13 750 FCFA, annuel 50 000 FCFA. Paiement Mobile Money (Airtel, Moov) ou Visa, Mastercard, American Express. Résiliable en ligne à tout moment.',
  keywords: [
    'tarifs NFI Report',
    'prix abonnement NFI Report',
    's\u2019abonner NFI Report',
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
