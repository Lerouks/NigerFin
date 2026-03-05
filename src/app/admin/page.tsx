import type { Metadata } from 'next';
import { AdminDashboard } from './AdminDashboard';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Dashboard administrateur NFI Report.',
};

export default function AdminPage() {
  return <AdminDashboard />;
}
