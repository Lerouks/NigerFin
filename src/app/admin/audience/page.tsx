import type { Metadata } from 'next';
import { ModulePlaceholder } from '../ModulePlaceholder';

export const metadata: Metadata = {
  title: 'Audience · NFI Cockpit',
  description: 'Utilisateurs, messages, statistiques et heatmaps.',
  robots: { index: false },
};

export default function AudiencePage() {
  return (
    <ModulePlaceholder
      title="Audience"
      description="Utilisateurs, messages, statistiques avancées et heatmap horaire. Module prévu pour la Phase 2."
      phaseLabel="Phase 2 · à venir"
      legacyTab="users"
    />
  );
}
