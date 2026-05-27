import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion - NFI Report',
  description: 'Connectez-vous à votre compte NFI Report pour accéder aux analyses économiques, articles premium et outils financiers.',
  robots: { index: false },
};

export default function ConnexionLayout({ children }: { children: React.ReactNode }) {
  // Le H1 visible vit dans page.tsx (variantes Connexion / Mot de passe oublie /
  // Email envoye selon l'etat du formulaire). Le layout ne doit PAS dupliquer
  // un H1 sr-only, sinon WCAG signale "2 H1 par page" (audit QA 2026-05-27).
  return <>{children}</>;
}
