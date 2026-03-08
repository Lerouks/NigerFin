import type { Metadata } from 'next';
import { PricingContent } from './PricingContent';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'S\u2019abonner — NFI Report',
  description: 'Accédez à une analyse économique complète. Abonnement Premium pour un accès illimité aux articles, analyses et outils.',
};

export default function PricingPage() {
  return <PricingContent />;
}
