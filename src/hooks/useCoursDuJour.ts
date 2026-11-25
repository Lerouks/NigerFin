'use client';

import useSWR from 'swr';

/** Un cours tel que le sert /api/cours-du-jour : les chiffres de la page Finance, sans la courbe. */
export interface CoursLeger {
  cle: string;
  libelle: string;
  valeur: number;
  unite: string;
  decimales: number;
  /** Date du cours, AAAA-MM-JJ ; null pour l'euro et le taux directeur. */
  date: string | null;
  variation: number | null;
  mention: string | null;
}

const lire = async (url: string): Promise<CoursLeger[]> => {
  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error(`Cours du jour : réponse ${reponse.status}`);
  return ((await reponse.json()) as { cours?: CoursLeger[] }).cours ?? [];
};

/**
 * Les cours du jour pour les encadrés de l'accueil et des articles (25/11/2026).
 * Ils changent une fois par jour : pas de relecture toutes les minutes comme
 * l'ancien encadré « Marchés ».
 */
export function useCoursDuJour() {
  const { data, error, isLoading } = useSWR<CoursLeger[]>('/api/cours-du-jour', lire, {
    revalidateOnFocus: false,
    dedupingInterval: 10 * 60_000,
    errorRetryCount: 2,
    keepPreviousData: true,
  });
  return { cours: data ?? [], isLoading, error: error ?? null };
}
