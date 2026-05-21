import type { Metadata } from 'next';
import { PricingTab } from '../../PricingTab';

export const metadata: Metadata = {
  title: 'Tarifs · NFI Cockpit',
  description: 'Configuration des tarifs Premium et cycles de facturation.',
  robots: { index: false },
};

export default function ArgentTarifsPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 pt-6 pb-6">
      <h1 className="sr-only">Tarifs</h1>
      <PricingTab />
    </div>
  );
}
