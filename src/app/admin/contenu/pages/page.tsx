import type { Metadata } from 'next';
import { LegalSectionsManager } from '../../LegalSectionsManager';

export const metadata: Metadata = {
  title: 'Pages légales · NFI Cockpit',
  description: 'Mentions légales, CGU, confidentialité, cookies.',
  robots: { index: false },
};

export default function ContenuPagesPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 pt-6 pb-6">
      <h1 className="sr-only">Pages légales</h1>
      <LegalSectionsManager />
    </div>
  );
}
