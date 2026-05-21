import type { Metadata } from 'next';
import { AudienceView } from './AudienceView';

export const metadata: Metadata = {
  title: 'Audience · NFI Cockpit',
  description:
    'Utilisateurs, messages, statistiques avancées et funnel de conversion.',
  robots: { index: false },
};

export default function AudiencePage() {
  return <AudienceView />;
}
