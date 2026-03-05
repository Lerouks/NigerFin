import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PaymentContent } from './PaymentContent';

export const metadata: Metadata = {
  title: 'Paiement - NFI Report',
  description: 'Finalisez votre abonnement NFI Report via Nita ou Amana Transfert d\'Argent.',
};

export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentContent />
    </Suspense>
  );
}
