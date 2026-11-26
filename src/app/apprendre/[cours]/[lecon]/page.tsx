import { notFound, permanentRedirect } from 'next/navigation';
import { adresseDuThemeRegroupe } from '@/lib/apprendre/anciens-cours';
import { getCours } from '@/lib/apprendre/donnees';

interface Props {
  params: Promise<{ cours: string; lecon: string }>;
}

/**
 * Ancienne adresse d'une leçon. Depuis le 26/11/2026, une leçon s'ouvre dans la
 * page de son cours : on y renvoie, leçon dépliée (#leçon), même quand son
 * thème a été regroupé avec un autre. Un thème retiré mène à Apprendre.
 */
export default async function AncienneLecon({ params }: Props) {
  const { cours, lecon } = await params;
  const trouve = (await getCours()).find((c) => c.lecons.some((l) => l.slug === lecon));
  if (trouve) permanentRedirect(`${trouve.href}#${lecon}`);
  const adresse = adresseDuThemeRegroupe(cours);
  if (adresse) permanentRedirect(adresse);
  notFound();
}
