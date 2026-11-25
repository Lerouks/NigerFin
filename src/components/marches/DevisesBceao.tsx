import { PAGE_COURS_BCEAO, coursBceaoSurPeriode, type CoursBceao } from '@/lib/bceao';
import { PARITE_EURO_FCFA, dateLongueFr } from '@/lib/cours-du-jour';

/**
 * « Le franc CFA face aux devises » (page Marchés, 25/11/2026) : les cours de
 * référence que la BCEAO publie chaque jour ouvré, pour les devises qui
 * comptent dans les échanges du Niger. La variation se compare au jour publié
 * précédent. Sans cours de la BCEAO de moins de dix jours, le bloc disparaît.
 */

const NB = ' ';
const MOINS = '−';
const JOUR_MS = 86_400_000;

/** Nom de la devise chez la BCEAO, nom affiché, et nombre d'unités par ligne. */
const DEVISES: { nom: string; libelle: string; unites: number }[] = [
  { nom: 'Dollar us', libelle: 'Dollar américain', unites: 1 },
  { nom: 'Yuan chinois', libelle: 'Yuan chinois', unites: 1 },
  { nom: 'Livre sterling', libelle: 'Livre sterling', unites: 1 },
  { nom: 'Franc suisse', libelle: 'Franc suisse', unites: 1 },
  { nom: 'Dollar canadien', libelle: 'Dollar canadien', unites: 1 },
  { nom: 'Ryal Saudien', libelle: 'Riyal saoudien', unites: 1 },
  { nom: 'Rand sud-africain', libelle: 'Rand sud-africain', unites: 1 },
  { nom: 'Nouvelle livre turque', libelle: 'Livre turque', unites: 1 },
  { nom: 'Roupie Indienne', libelle: 'Roupie indienne', unites: 1 },
  { nom: 'Yen japonais', libelle: `100${NB}yens japonais`, unites: 100 },
];

const nombre = (valeur: number, decimales: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(valeur);

export interface LigneDevise {
  libelle: string;
  valeur: number;
  /** Variation en % depuis le jour publié précédent ; null sans jour précédent. */
  variation: number | null;
}

/** Les lignes du tableau, euro en tête ; vide sans cours récent. */
export function lignesDevises(jours: CoursBceao[]): LigneDevise[] {
  const dernier = jours.at(-1);
  const precedent = jours.at(-2);
  if (!dernier) return [];
  const lignes: LigneDevise[] = [{ libelle: 'Euro', valeur: PARITE_EURO_FCFA, variation: null }];
  for (const d of DEVISES) {
    const valeur = dernier.devises[d.nom];
    if (valeur === undefined) continue;
    const avant = precedent?.devises[d.nom];
    lignes.push({
      libelle: d.libelle,
      valeur: valeur * d.unites,
      variation: avant ? ((valeur - avant) / avant) * 100 : null,
    });
  }
  return lignes;
}

function Variation({ valeur }: { valeur: number | null }) {
  if (valeur === null) return <span className="text-gray-500">parité fixe</span>;
  if (Math.abs(valeur) < 0.005) return <span className="text-gray-500">inchangé</span>;
  const hausse = valeur > 0;
  return (
    <span className={`whitespace-nowrap font-semibold ${hausse ? 'text-emerald-700' : 'text-red-700'}`}>
      <span aria-hidden="true">{hausse ? '▲' : '▼'} </span>
      <span className="sr-only">{hausse ? 'En hausse de' : 'En baisse de'} </span>
      {`${hausse ? '+' : MOINS}${nombre(Math.abs(valeur), 2)}${NB}%`}
    </span>
  );
}

export async function DevisesBceao({ aujourdhui = new Date() }: { aujourdhui?: Date }) {
  const jours = await coursBceaoSurPeriode(aujourdhui, 14).catch(() => [] as CoursBceao[]);
  const dernier = jours.at(-1);
  if (!dernier || Date.parse(aujourdhui.toISOString().slice(0, 10)) - Date.parse(dernier.date) > 10 * JOUR_MS) {
    return null;
  }
  const lignes = lignesDevises(jours);

  return (
    <section aria-labelledby="devises-titre" className="rounded-xl border border-black/10 bg-white px-4 py-5 sm:px-6 sm:py-6">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="devises-titre" className="text-[18px] sm:text-[19px] font-bold tracking-tight text-[#111]">
          Le franc CFA face aux devises
        </h2>
        <p className="text-[13px] text-gray-500">cours du {dateLongueFr(dernier.date)}</p>
      </header>
      <table className="mt-4 w-full text-[14px]">
        <caption className="sr-only">
          Valeur en francs CFA d’une unité de chaque devise, cours de référence de la BCEAO
        </caption>
        <thead>
          <tr className="border-b border-black/10 text-left text-[12px] text-gray-500">
            <th scope="col" className="py-2 pr-3 font-medium">Devise</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">En FCFA</th>
            <th scope="col" className="py-2 text-right font-medium">Sur un jour</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/6">
          {lignes.map((l) => (
            <tr key={l.libelle}>
              <th scope="row" className="py-2.5 pr-3 text-left font-medium text-[#111]">{l.libelle}</th>
              <td className="py-2.5 pr-3 text-right tabular-nums text-[#111]">{nombre(l.valeur, l.libelle === 'Euro' ? 3 : 2)}</td>
              <td className="py-2.5 text-right text-[13px] tabular-nums">
                <Variation valeur={l.variation} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-[13px] text-gray-500">
        Cours de référence publiés par la{' '}
        <a href={PAGE_COURS_BCEAO} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#111]">
          BCEAO
        </a>
        .
      </p>
    </section>
  );
}
