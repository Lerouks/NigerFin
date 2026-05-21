import type { Metadata } from 'next';
import { UsersTabWrapper } from './UsersTabWrapper';

export const metadata: Metadata = {
  title: 'Utilisateurs · NFI Cockpit',
  description: 'Gestion des comptes lecteurs et premium.',
  robots: { index: false },
};

export default function AudienceUtilisateursPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 pt-6 pb-6">
      <h1 className="sr-only">Utilisateurs</h1>
      <UsersTabWrapper />
    </div>
  );
}
