import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion - NFI Report',
  description: 'Connectez-vous à votre compte NFI Report pour accéder aux analyses économiques, articles premium et outils financiers.',
  robots: { index: false },
};

export default function ConnexionLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="sr-only">Connexion à NFI Report</h1>
      {children}
    </>
  );
}
