import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Créer un compte — NFI Report',
  description: 'Inscrivez-vous gratuitement sur NFI Report pour suivre l\'actualité économique et financière du Niger et de l\'Afrique.',
};

export default function InscriptionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
