import type { Metadata } from 'next';
import { AdminDashboard } from '../AdminDashboard';

export const metadata: Metadata = {
  title: 'Ancien tableau de bord administrateur',
  description: 'Ancien tableau de bord administrateur NFI Report (en cours de migration).',
  robots: { index: false },
};

export default function AdminLegacyPage() {
  return (
    <>
      <h1 className="sr-only">Ancien tableau de bord administrateur</h1>
      <AdminDashboard />
    </>
  );
}
