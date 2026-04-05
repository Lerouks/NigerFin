import type { Metadata } from 'next';
import { ApiStatusDashboard } from './ApiStatusDashboard';

export const metadata: Metadata = {
  title: 'Statut des API, Admin',
  description: 'Monitoring du statut des sources de données en temps réel.',
  robots: { index: false, follow: false },
};

export default function ApiStatusPage() {
  return <ApiStatusDashboard />;
}
