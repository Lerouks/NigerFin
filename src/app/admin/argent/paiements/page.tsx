'use client';

import { PaymentsTab } from '../../PaymentsTab';

export default function ArgentPaiementsPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 pt-6 pb-6">
      <h1 className="sr-only">Paiements</h1>
      <PaymentsTab onStatsRefresh={() => {}} />
    </div>
  );
}
