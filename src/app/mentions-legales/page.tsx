import type { Metadata } from 'next';
import { DynamicLegalPage } from '@/components/DynamicLegalPage';

export const metadata: Metadata = { title: 'Mentions Légales' };

export default function MentionsLegalesPage() {
  return <DynamicLegalPage slug="mentions-legales" title="Mentions Légales" />;
}
