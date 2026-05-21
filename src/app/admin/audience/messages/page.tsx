import type { Metadata } from 'next';
import { MessagesManager } from '../../MessagesManager';

export const metadata: Metadata = {
  title: 'Messages · NFI Cockpit',
  description: 'Boîte de réception du formulaire de contact.',
  robots: { index: false },
};

export default function AudienceMessagesPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 pt-6 pb-6">
      <h1 className="sr-only">Messages</h1>
      <MessagesManager />
    </div>
  );
}
