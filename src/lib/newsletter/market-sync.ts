import type { MarketRow } from '@/emails/components/MarketTable';
import { getCoursDuJour, type Cours } from '@/lib/cours-du-jour';

/**
 * Le tableau « Marchés » de la newsletter Premium, quand un numéro active
 * autoSync : exactement les cours du jour du site (page Finance), mêmes
 * sources officielles, mêmes chiffres (25/11/2026).
 *
 * Il lisait l'ancienne table market_data : un cours absent (BRVM Composite et
 * uranium, vides depuis juillet) y devenait « 0,00 » par la conversion
 * Number(null), un chiffre inventé dans un courriel. Un cours sans source
 * récente n'apparaît plus du tout, comme sur le site.
 */

const nombre = (valeur: number, decimales: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(valeur);

/** Les lignes du tableau : tous les cours du jour sauf le taux directeur, qui n'est pas un prix de marché. */
export function lignesNewsletter(cours: Cours[]): MarketRow[] {
  return cours
    .filter((c) => c.cle !== 'taux')
    .map((c) => ({
      label: c.libelle,
      value: nombre(c.valeur, c.decimales),
      unit: c.unite,
      // 0 s'affiche « fixe » dans le tableau : c'est le cas de l'euro.
      changePercent: c.variation ?? 0,
      spark: c.serie.length >= 2 ? c.serie.slice(-7).map((p) => p.valeur) : undefined,
    }));
}

/** Les sources des cours affichés, sans doublon, dans l'ordre des lignes. */
export function sourcesNewsletter(cours: Cours[]): string {
  const noms = cours
    .filter((c) => c.cle !== 'taux' && c.cle !== 'euro')
    .map((c) => {
      if (c.cle === 'dollar') return c.source.includes('BCEAO') ? 'BCEAO' : 'Banque centrale européenne';
      if (c.cle === 'naira') return 'Banque centrale du Nigeria';
      if (c.cle === 'brvm' || c.cle === 'boan') return 'BRVM';
      return 'COMEX et NYMEX (New York)';
    });
  return [...new Set(noms)].join(', ');
}

export async function getLiveMarketRows(): Promise<MarketRow[]> {
  return lignesNewsletter(await getCoursDuJour());
}

export async function getMarketSourceLine(): Promise<string> {
  return sourcesNewsletter(await getCoursDuJour());
}
