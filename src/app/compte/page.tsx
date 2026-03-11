import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AccountDashboard } from './AccountDashboard';

export const metadata: Metadata = {
  title: 'Mon compte',
  description: 'Gérez votre abonnement, vos préférences et votre profil NFI Report.',
};

export default function ComptePage() {
  return (
    <Suspense>
      <AccountDashboard />
    </Suspense>
  );
}
