import type { Metadata } from 'next';
import { DynamicLegalPage } from '@/components/DynamicLegalPage';

export const revalidate = 86400;

export const metadata: Metadata = { title: 'Mentions Légales', description: 'Mentions légales de NFI Report : éditeur, hébergeur, propriété intellectuelle et conditions d\'utilisation du site.' };

export default function MentionsLegalesPage() {
  return <DynamicLegalPage slug="mentions-legales" title="Mentions Légales" />;
}
