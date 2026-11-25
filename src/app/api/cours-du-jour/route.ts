import { NextResponse } from 'next/server';
import { getCoursDuJour } from '@/lib/cours-du-jour';

/**
 * Les cours du jour, pour l'encadré de l'accueil et des articles (25/11/2026).
 * Ce sont exactement les chiffres de la page Finance : un seul circuit, une
 * seule source par cours, plus jamais deux prix du Brent sur deux pages.
 * Pendant le pré-lancement, la porte du site répond 404 à un visiteur.
 */
export const revalidate = 3600;

export async function GET() {
  const cours = await getCoursDuJour();
  return NextResponse.json(
    {
      cours: cours.map(({ cle, libelle, valeur, unite, decimales, date, variation, mention }) => ({
        cle,
        libelle,
        valeur,
        unite,
        decimales,
        date,
        variation,
        mention: mention ?? null,
      })),
    },
    { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } },
  );
}
