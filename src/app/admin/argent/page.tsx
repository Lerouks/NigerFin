import type { Metadata } from 'next';
import { ArgentView } from './ArgentView';

export const metadata: Metadata = {
  title: 'Argent · NFI Cockpit',
  description: 'MRR, ARR, transactions iPayMoney, tarifs et paywall en direct.',
  robots: { index: false },
};

export default function ArgentPage() {
  return <ArgentView />;
}
