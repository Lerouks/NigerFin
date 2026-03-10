import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion - NFI Report',
  description: 'Connectez-vous à votre compte NFI Report pour accéder aux analyses économiques, articles premium et outils financiers.',
};

export default function ConnexionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
