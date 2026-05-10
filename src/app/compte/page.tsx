import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AccountDashboard } from './AccountDashboard';

export const metadata: Metadata = {
  title: 'Mon compte : abonnement et préférences',
  description: 'Gérez votre abonnement Premium, vos préférences newsletter, vos factures et votre profil NFI Report.',
  robots: { index: false },
};

export default function ComptePage() {
  return (
    <>
      <h1 className="sr-only">Mon compte NFI Report</h1>
      <Suspense>
        <AccountDashboard />
      </Suspense>
    </>
  );
}
