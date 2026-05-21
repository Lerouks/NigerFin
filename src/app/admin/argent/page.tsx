import type { Metadata } from 'next';
import { ModulePlaceholder } from '../ModulePlaceholder';

export const metadata: Metadata = {
  title: 'Argent · NFI Cockpit',
  description: 'MRR, ARR, paiements, tarifs, paywall et simulateur d\'impact.',
  robots: { index: false },
};

export default function ArgentPage() {
  return (
    <ModulePlaceholder
      title="Argent"
      description="MRR, ARR, transactions iPayMoney en direct, tarifs et simulateur d'impact des prix. Module prévu pour la Phase 2."
      phaseLabel="Phase 2 · à venir"
      legacyTab="payments"
    />
  );
}
