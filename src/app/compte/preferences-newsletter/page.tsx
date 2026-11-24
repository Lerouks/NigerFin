import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Newsletter',
  robots: { index: false },
};

/**
 * L'abonnement à la newsletter se règle dans « Mon compte ». Cette adresse
 * reste, car le pied de la newsletter y renvoie.
 */
export default function PreferencesNewsletterPage() {
  redirect('/compte#newsletter');
}
