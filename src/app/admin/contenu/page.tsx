import type { Metadata } from 'next';
import { ModulePlaceholder } from '../ModulePlaceholder';

export const metadata: Metadata = {
  title: 'Contenu — NFI Cockpit',
  description: 'Articles, commentaires, newsletter, flash info, éducation.',
  robots: { index: false },
};

export default function ContenuPage() {
  return (
    <ModulePlaceholder
      title="Contenu"
      description="Articles, commentaires, newsletter, flash info, éducation et pages légales en un seul endroit. Module en cours de finalisation."
      phaseLabel="Phase 1 — en cours"
      legacyTab="articles"
    />
  );
}
