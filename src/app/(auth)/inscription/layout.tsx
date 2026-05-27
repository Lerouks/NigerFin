import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Créer un compte - NFI Report',
  description: 'Inscrivez-vous gratuitement sur NFI Report pour suivre l\'actualité économique et financière du Niger et de l\'Afrique.',
  robots: { index: false },
};

export default function InscriptionLayout({ children }: { children: React.ReactNode }) {
  // Le H1 visible vit dans page.tsx (Compte existant / Verifiez votre email /
  // Creer un compte selon l'etat). Le layout ne doit PAS dupliquer un H1
  // sr-only, sinon WCAG signale "2 H1 par page" (audit QA 2026-05-27).
  return <>{children}</>;
}
