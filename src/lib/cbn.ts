import { unstable_cache } from 'next/cache';
import type { PointDeCours } from '@/lib/cours-du-jour';

/**
 * Le cours officiel du naira contre le franc CFA, publié chaque jour ouvré par
 * la Banque centrale du Nigeria (vérifié le 25/11/2026). Le fichier qui sert
 * les graphiques de sa page « Exchange Rates » donne environ un mois de cours
 * pour treize devises, dont « CFA », en 32 Ko, sans clé ni compte.
 *
 * « centralrate » est le nombre de nairas pour un franc CFA : 100 nairas
 * valent donc 100 / centralrate FCFA (43,12 FCFA le 25/11/2026). C'est la même
 * valeur, à quelques centimes près, que le croisement des cours du dollar des
 * deux banques centrales, et elle remplace un cours « indicatif » de source
 * inconnue qui affichait 44 FCFA ce jour-là.
 */

export const URL_CBN = 'https://www.cbn.gov.ng/api/GetAllExchangeRatesGRAPH';
export const PAGE_CBN = 'https://www.cbn.gov.ng/rates/ExchRateByCurrency.html';

export interface LigneCbn {
  currency?: string;
  ratedate?: string;
  centralrate?: string | number;
}

/** Les cours « CFA » de la Banque centrale du Nigeria, en FCFA pour 100 nairas, du plus ancien au plus récent. */
export function nairaEnFcfa(lignes: LigneCbn[]): PointDeCours[] {
  const parDate = new Map<string, number>();
  for (const l of Array.isArray(lignes) ? lignes : []) {
    const central = Number(l.centralrate);
    const date = String(l.ratedate ?? '').slice(0, 10);
    if (l.currency?.trim().toUpperCase() === 'CFA' && /^\d{4}-\d{2}-\d{2}$/.test(date) && central > 0) {
      parDate.set(date, 100 / central);
    }
  }
  return [...parDate].map(([date, valeur]) => ({ date, valeur })).sort((a, b) => a.date.localeCompare(b.date));
}

export const serieNairaCbn = unstable_cache(
  async (): Promise<PointDeCours[]> => {
    const reponse = await fetch(URL_CBN, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!reponse.ok) throw new Error(`Banque centrale du Nigeria : réponse ${reponse.status}`);
    const serie = nairaEnFcfa((await reponse.json()) as LigneCbn[]);
    if (serie.length < 2) throw new Error('Banque centrale du Nigeria : série du naira trop courte');
    return serie;
  },
  ['cours-naira-cbn-v1'],
  { revalidate: 3600, tags: ['cours-du-jour'] },
);
