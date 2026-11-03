import type { Metadata } from 'next';
import { CorbeilleManager } from '@/app/admin/CorbeilleManager';

export const metadata: Metadata = {
  title: 'Corbeille · NFI Cockpit',
  description: 'Remettre en place, pendant 30 jours, un contenu supprimé par erreur.',
  robots: { index: false },
};

export default function ContenuCorbeillePage() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 pt-6 pb-6">
      <h1 className="sr-only">Corbeille</h1>
      <CorbeilleManager />
    </div>
  );
}
