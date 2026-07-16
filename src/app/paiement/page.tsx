import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PaymentContent } from './PaymentContent';

export const metadata: Metadata = {
  title: 'Paiement - NFI Report',
  description: 'Finalisez votre abonnement NFI Report par Mobile Money ou carte bancaire, en toute sécurité.',
  robots: { index: false },
};

export default function PaymentPage() {
  return (
    <>
      <h1 className="sr-only">Paiement de votre abonnement Premium</h1>
      <Suspense>
        <PaymentContent />
      </Suspense>
    </>
  );
}
