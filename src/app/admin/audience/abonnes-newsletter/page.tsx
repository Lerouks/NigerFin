import type { Metadata } from 'next';
import { NewsletterSubscribersView } from './NewsletterSubscribersView';

export const metadata: Metadata = {
  title: 'Abonnés newsletter · NFI Cockpit',
  description: 'Liste, filtres, export et gestion des abonnés à la newsletter NFI Report.',
  robots: { index: false },
};

export const dynamic = 'force-dynamic';

export default function NewsletterSubscribersPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 pt-6 pb-6">
      <h1 className="sr-only">Abonnés newsletter</h1>
      <NewsletterSubscribersView />
    </div>
  );
}
