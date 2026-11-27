import { redirect } from 'next/navigation';

/**
 * L'ancienne page « Complétez votre profil » est remplacée par l'écran de
 * bienvenue (27/11/2026). Les anciens liens y mènent encore.
 */
export default async function CompleterProfilPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const suite = typeof params.suite === 'string' ? params.suite : null;
  redirect(suite ? `/inscription/bienvenue?suite=${encodeURIComponent(suite)}` : '/inscription/bienvenue');
}
