import type { Metadata } from 'next';
import { StatsManager } from '../../StatsManager';

export const metadata: Metadata = {
  title: 'Statistiques · NFI Cockpit',
  description: 'Top articles, top pages, vues quotidiennes sur 30 jours.',
  robots: { index: false },
};

export default function AudienceStatistiquesPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 pt-6 pb-6">
      <h1 className="sr-only">Statistiques avancées</h1>
      <StatsManager />
    </div>
  );
}
