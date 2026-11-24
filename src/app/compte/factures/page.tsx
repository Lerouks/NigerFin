import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Mes factures',
  robots: { index: false },
};

/**
 * Les factures vivent désormais dans « Mon compte ». Cette adresse reste, car
 * le mail de chaque facture y renvoie.
 */
export default function FacturesPage() {
  redirect('/compte#factures');
}
