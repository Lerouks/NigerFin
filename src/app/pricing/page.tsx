import type { Metadata } from 'next';
import { PricingContent } from './PricingContent';

export const metadata: Metadata = {
  title: 'Abonnements',
  description: 'Choisissez le plan NFI Report adapté à vos besoins. Accédez aux articles premium, analyses et outils financiers.',
};

export default function PricingPage() {
  return <PricingContent />;
}
