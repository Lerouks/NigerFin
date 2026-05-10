import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Créer un compte - NFI Report',
  description: 'Inscrivez-vous gratuitement sur NFI Report pour suivre l\'actualité économique et financière du Niger et de l\'Afrique.',
  robots: { index: false },
};

export default function InscriptionLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="sr-only">Créer un compte NFI Report</h1>
      {children}
    </>
  );
}
