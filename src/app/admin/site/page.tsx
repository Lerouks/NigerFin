import type { Metadata } from 'next';
import { ModulePlaceholder } from '../ModulePlaceholder';

export const metadata: Metadata = {
  title: 'Site · NFI Cockpit',
  description: 'Santé du site, cron jobs, journal d\'audit, données référentielles.',
  robots: { index: false },
};

export default function SitePage() {
  return (
    <ModulePlaceholder
      title="Site"
      description="Santé du site, statut API, cron jobs, journal d'audit, marchés BRVM, fiches entreprises et présentation Niger. Module prévu pour la Phase 3."
      phaseLabel="Phase 3 · à venir"
      legacyTab="market"
    />
  );
}
