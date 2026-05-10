import type { Metadata } from 'next';
import { AdminDashboard } from './AdminDashboard';

export const metadata: Metadata = {
  title: 'Tableau de bord administrateur',
  description: 'Tableau de bord administrateur NFI Report : gestion des articles, abonnements et utilisateurs.',
  robots: { index: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
