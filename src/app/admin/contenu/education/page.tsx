import type { Metadata } from 'next';
import { EducationManager } from '../../EducationManager';

export const metadata: Metadata = {
  title: 'Éducation · NFI Cockpit',
  description: 'Parcours, catégories et leçons financières.',
  robots: { index: false },
};

export default function ContenuEducationPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 pt-6 pb-6">
      <h1 className="sr-only">Éducation</h1>
      <EducationManager />
    </div>
  );
}
