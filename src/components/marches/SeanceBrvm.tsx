import { lireSeanceComplete, SYMBOLE_BOA_NIGER, type ActionBrvm, type SeanceComplete } from '@/lib/brvm-seances';
import { dateLongueFr } from '@/lib/cours-du-jour';

/**
 * « La séance de la BRVM » (page Marchés, 25/11/2026) : les quatre grands
 * indices, les plus fortes hausses et baisses, BOA Niger, et toutes les actions
 * cotées, tels que la BRVM les publie après la clôture. La séance est relevée
 * chaque soir de séance par /api/cron/releve-brvm ; plus vieille que dix jours,
 * elle n'est plus affichée.
 */

const NB = ' ';
const MOINS = '−';
const JOUR_MS = 86_400_000;

/** Les indices montrés, dans cet ordre, sous un nom lisible. */
const INDICES: { nom: RegExp; libelle: string }[] = [
  { nom: /^BRVM\s*-\s*COMPOSITE$/i, libelle: 'BRVM Composite' },
  { nom: /^BRVM-30$/i, libelle: 'BRVM 30' },
  { nom: /^BRVM\s*-\s*PRESTIGE$/i, libelle: 'BRVM Prestige' },
  { nom: /^BRVM\s*-\s*PRINCIPAL$/i, libelle: 'BRVM Principal' },
];

const nombre = (valeur: number, decimales: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(valeur);

/** Un montant en FCFA en milliards, sans décimale au-delà de cent milliards. */
function milliards(fcfa: number): string {
  const m = fcfa / 1e9;
  return `${nombre(m, m >= 100 ? 0 : 1)}${NB}milliards de${NB}FCFA`;
}

function Variation({ valeur, className = '' }: { valeur: number; className?: string }) {
  if (Math.abs(valeur) < 0.005) return <span className={`whitespace-nowrap text-gray-500 ${className}`}>inchangé</span>;
  const hausse = valeur > 0;
  return (
    <span className={`whitespace-nowrap font-semibold tabular-nums ${hausse ? 'text-emerald-700' : 'text-red-700'} ${className}`}>
      <span aria-hidden="true">{hausse ? '▲' : '▼'} </span>
      <span className="sr-only">{hausse ? 'En hausse de' : 'En baisse de'} </span>
      {`${hausse ? '+' : MOINS}${nombre(Math.abs(valeur), 2)}${NB}%`}
    </span>
  );
}

/** Les cinq plus fortes hausses et baisses de la séance (une action inchangée n'y figure pas). */
export function palmares(actions: ActionBrvm[]): { hausses: ActionBrvm[]; baisses: ActionBrvm[] } {
  const tri = [...actions].sort((a, b) => b.variation - a.variation || a.symbole.localeCompare(b.symbole));
  return {
    hausses: tri.filter((a) => a.variation > 0).slice(0, 5),
    baisses: tri.filter((a) => a.variation < 0).reverse().slice(0, 5),
  };
}

/** Un palmarès en tableau : symbole et société, clôture, variation (des données, pas des phrases). */
function ListeActions({ titre, actions }: { titre: string; actions: ActionBrvm[] }) {
  if (actions.length === 0) return null;
  return (
    <div>
      <h3 className="text-[14px] font-semibold text-[#111]">{titre}</h3>
      <table className="mt-2 w-full text-[14px]">
        <caption className="sr-only">{titre} de la séance : clôture en FCFA et variation</caption>
        <tbody className="divide-y divide-black/6">
          {actions.map((a) => (
            <tr key={a.symbole}>
              <th scope="row" className="py-2 pr-3 text-left font-normal">
                <span className="font-semibold text-[#111]">{a.symbole}</span>
                <span className="block text-[12px] leading-snug text-gray-500">{a.nom}</span>
              </th>
              <td className="py-2 pr-3 text-right align-top tabular-nums text-[#111]">{nombre(a.cloture, 0)}</td>
              <td className="py-2 text-right align-top text-[13px]">
                <Variation valeur={a.variation} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TableauSeance({ seance }: { seance: SeanceComplete }) {
  const indices = INDICES.map((i) => ({ ...i, valeur: seance.indices.find((x) => i.nom.test(x.nom)) }))
    .filter((i) => i.valeur)
    .map((i) => ({ libelle: i.libelle, ...i.valeur! }));
  const { hausses, baisses } = palmares(seance.actions);
  const boan = seance.actions.find((a) => a.symbole === SYMBOLE_BOA_NIGER);
  const actions = [...seance.actions].sort((a, b) => a.symbole.localeCompare(b.symbole));

  return (
    <section aria-labelledby="brvm-titre" className="rounded-xl border border-black/10 bg-white px-4 py-5 sm:px-6 sm:py-6">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="brvm-titre" className="text-[18px] sm:text-[19px] font-bold tracking-tight text-[#111]">
          La séance de la BRVM
        </h2>
        <p className="text-[13px] text-gray-500">séance du {dateLongueFr(seance.date)}</p>
      </header>

      {indices.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-y-5 lg:grid-cols-4">
          {indices.map((i, index) => (
            <div
              key={i.libelle}
              className={`min-w-0 border-black/8 pr-2 ${index % 2 === 0 ? 'pl-0' : 'border-l pl-3'} ${
                index % 4 === 0 ? 'lg:border-l-0 lg:pl-0' : 'lg:border-l lg:pl-4'
              }`}
            >
              <p className="whitespace-nowrap text-[13px] text-gray-500">{i.libelle}</p>
              <p className="mt-1 text-[19px] min-[360px]:text-[21px] font-bold leading-tight tracking-tight tabular-nums text-[#111]">
                {nombre(i.cloture, 2)}
              </p>
              <p className="mt-0.5 text-[13px]">
                <Variation valeur={i.variation} />
              </p>
              {i.variationAnnee !== null ? (
                <p className="text-[12px] text-gray-500">
                  <span className="whitespace-nowrap">{`${i.variationAnnee >= 0 ? '+' : MOINS}${nombre(Math.abs(i.variationAnnee), 2)}${NB}%`}</span>{' '}
                  <span className="whitespace-nowrap">depuis janvier</span>
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {seance.capitalisationActions || seance.valeurTransactions ? (
        <dl className="mt-6 grid grid-cols-1 gap-3 border-t border-black/8 pt-4 text-[14px] sm:grid-cols-2">
          {seance.capitalisationActions ? (
            <div>
              <dt className="text-[13px] text-gray-500">Capitalisation des actions</dt>
              <dd className="font-semibold tabular-nums text-[#111]">{milliards(seance.capitalisationActions)}</dd>
            </div>
          ) : null}
          {seance.valeurTransactions ? (
            <div>
              <dt className="text-[13px] text-gray-500">Échangé pendant la séance</dt>
              <dd className="font-semibold tabular-nums text-[#111]">{milliards(seance.valeurTransactions)}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {boan ? (
        <div className="mt-6 rounded-lg bg-gray-50 px-4 py-3">
          <p className="text-[14px] font-semibold text-[#111]">{`Bank${NB}of${NB}Africa${NB}Niger`}</p>
          <p className="text-[13px] text-gray-500">la seule société nigérienne cotée</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
            <span className="text-[19px] font-bold tabular-nums text-[#111]">{`${nombre(boan.cloture, 0)}${NB}FCFA`}</span>
            <span className="text-[13px]">
              <Variation valeur={boan.variation} />
            </span>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <ListeActions titre="Plus fortes hausses" actions={hausses} />
        <ListeActions titre="Plus fortes baisses" actions={baisses} />
      </div>

      <details className="group mt-6 border-t border-black/8 pt-4">
        <summary className="cursor-pointer list-none text-[14px] font-semibold text-[#111] [&::-webkit-details-marker]:hidden">
          <span className="underline-offset-4 group-hover:underline">{`Les ${actions.length} actions cotées`}</span>
          <span aria-hidden="true" className="ml-1 inline-block transition-transform group-open:rotate-90">›</span>
        </summary>
        <table className="mt-3 w-full text-[13px]">
          <caption className="sr-only">Cours de clôture et variation de chaque action cotée à la BRVM</caption>
          <thead>
            <tr className="border-b border-black/10 text-left text-[12px] text-gray-500">
              <th scope="col" className="py-2 pr-3 font-medium">Action</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Clôture (FCFA)</th>
              <th scope="col" className="py-2 text-right font-medium">Sur la séance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/6">
            {actions.map((a) => (
              <tr key={a.symbole} className={a.symbole === SYMBOLE_BOA_NIGER ? 'bg-gray-50' : undefined}>
                <th scope="row" className="py-2 pr-3 text-left font-normal">
                  <span className="font-semibold text-[#111]">{a.symbole}</span>
                  <span className="block text-[11.5px] leading-snug text-gray-500">{a.nom}</span>
                </th>
                <td className="py-2 pr-3 text-right tabular-nums text-[#111]">{nombre(a.cloture, 0)}</td>
                <td className="py-2 text-right">
                  <Variation valeur={a.variation} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <p className="mt-5 text-[13px] text-gray-500">
        Cours de clôture publiés par la{' '}
        <a href="https://www.brvm.org/fr/cours-actions/0" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#111]">
          BRVM
        </a>
        .
      </p>
    </section>
  );
}

export async function SeanceBrvm({ aujourdhui = new Date() }: { aujourdhui?: Date }) {
  const seance = await lireSeanceComplete().catch(() => null);
  if (!seance) return null;
  if (Date.parse(aujourdhui.toISOString().slice(0, 10)) - Date.parse(seance.date) > 10 * JOUR_MS) return null;
  return <TableauSeance seance={seance} />;
}
