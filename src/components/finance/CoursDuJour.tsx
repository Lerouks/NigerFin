import { getCoursDuJour, type Cours, type PointDeCours } from '@/lib/cours-du-jour';
import { paragrapheFr } from '@/lib/typographie-fr';

/**
 * « Les cours du jour », en tête de la page Finance (maquette validée le
 * 24/11/2026). Six tuiles : euro, dollar, naira, BRVM Composite, or et Brent.
 * Une tuile dont la source est en panne disparaît ; le bloc entier disparaît
 * s'il ne reste que l'euro.
 */

const NB = '\u00a0';
const MOINS = '\u2212';

const nombre = (valeur: number, decimales: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(valeur);

const dateLongue = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

const dateCourte = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' });

/** Bordure de séparation : jamais sur la première tuile d'une rangée (2, 3 puis 6 colonnes). */
function separation(index: number): string {
  return [
    index % 2 === 0 ? 'border-l-0 pl-0' : 'border-l pl-3',
    index % 3 === 0 ? 'sm:border-l-0 sm:pl-0' : 'sm:border-l sm:pl-4',
    index === 0 ? 'lg:border-l-0 lg:pl-0' : 'lg:border-l lg:pl-4',
  ].join(' ');
}

const COLONNES_LARGES: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
};

function LigneVariation({ cours }: { cours: Cours }) {
  if (cours.mention) {
    return <p className="mt-0.5 text-[13px] text-gray-500">{cours.mention}</p>;
  }
  const v = cours.variation;
  if (v === null) return null;
  if (Math.abs(v) < 0.005) {
    return <p className="mt-0.5 text-[13px] text-gray-500">inchangé</p>;
  }
  const hausse = v > 0;
  return (
    <p className={`mt-0.5 text-[13px] font-semibold tabular-nums ${hausse ? 'text-emerald-700' : 'text-red-700'}`}>
      <span aria-hidden="true">{hausse ? '▲' : '▼'} </span>
      <span className="sr-only">{hausse ? 'En hausse de' : 'En baisse de'} </span>
      {`${hausse ? '+' : MOINS}${nombre(Math.abs(v), 2)}${NB}%`}
    </p>
  );
}

/** Courbe d'un mois, à l'échelle du temps ; le dernier point est marqué. */
function Courbe({ serie, description }: { serie: PointDeCours[]; description?: string }) {
  if (serie.length < 2) {
    // L'euro ne bouge pas : un filet pointillé à la place de la courbe.
    return <div aria-hidden="true" className="mt-3 h-8 mr-1 border-b border-dashed border-gray-300" />;
  }
  const L = 100;
  const H = 30;
  const MARGE = 3;
  const t0 = Date.parse(serie[0]!.date);
  const t1 = Date.parse(serie.at(-1)!.date);
  const valeurs = serie.map((p) => p.valeur);
  const min = Math.min(...valeurs);
  const max = Math.max(...valeurs);
  const x = (date: string) => (t1 === t0 ? L : ((Date.parse(date) - t0) / (t1 - t0)) * L);
  const y = (v: number) => (max === min ? H / 2 : MARGE + (1 - (v - min) / (max - min)) * (H - 2 * MARGE));
  const trace = serie.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(2)} ${y(p.valeur).toFixed(2)}`).join(' ');
  const dernier = serie.at(-1)!;
  return (
    <div className="relative mt-3 mr-1 h-8" role="img" aria-label={description}>
      <svg viewBox={`0 0 ${L} ${H}`} preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
        <path
          d={trace}
          fill="none"
          stroke="#6b7280"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        aria-hidden="true"
        className="absolute h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#111] ring-2 ring-white"
        style={{ left: '100%', top: `${((y(dernier.valeur) / H) * 100).toFixed(2)}%` }}
      />
    </div>
  );
}

function phraseDesSources(cours: Cours[]): string {
  const cles = new Set(cours.map((c) => c.cle));
  const sources = [
    cles.has('dollar') && 'Banque centrale européenne pour le dollar',
    cles.has('naira') && 'cours indicatif du marché pour le naira',
    cles.has('brvm') && 'clôture de la BRVM pour le Composite',
    cles.has('or') && 'COMEX pour l’or, converti avec le dollar du jour',
    cles.has('brent') && 'NYMEX pour le Brent',
  ].filter((s): s is string => Boolean(s));
  const liste =
    sources.length > 1 ? `${sources.slice(0, -1).join(', ')} et ${sources.at(-1)}` : (sources[0] ?? '');
  return `L’euro vaut 655,957${NB}FCFA, une parité fixe. Sources${NB}: ${liste}.`;
}

export async function CoursDuJour() {
  const cours = await getCoursDuJour();
  if (cours.length < 2) return null;

  const dates = cours.map((c) => c.date).filter((d): d is string => Boolean(d)).sort();
  const plusRecente = dates.at(-1)!;

  return (
    <section aria-labelledby="cours-du-jour-titre" className="rounded-xl border border-black/10 bg-white px-4 py-5 sm:px-6 sm:py-6">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="cours-du-jour-titre" className="text-[18px] sm:text-[19px] font-bold tracking-tight text-[#111]">
          Les cours du jour
        </h2>
        <p className="text-[13px] text-gray-500">{dateLongue(plusRecente)}</p>
      </header>

      <div className={`mt-5 grid grid-cols-2 gap-y-6 sm:grid-cols-3 ${COLONNES_LARGES[cours.length] ?? 'lg:grid-cols-6'}`}>
        {cours.map((c, index) => (
          <div key={c.cle} className={`min-w-0 border-black/8 pr-2 sm:pr-3 ${separation(index)}`}>
            <p className="whitespace-nowrap text-[13px] text-gray-500">{c.libelle}</p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-1">
              <span className="text-[19px] min-[360px]:text-[21px] sm:text-[23px] font-bold leading-tight tracking-tight tabular-nums text-[#111]">
                {nombre(c.valeur, c.decimales)}
              </span>
              <span className="text-[13px] text-gray-500">{c.unite}</span>
            </p>
            <LigneVariation cours={c} />
            {c.date && c.date < plusRecente ? (
              <p className="text-[12px] text-gray-400">au {dateCourte(c.date)}</p>
            ) : null}
            <Courbe serie={c.serie} description={c.descriptionCourbe} />
          </div>
        ))}
      </div>

      <p className="mt-5 border-t border-black/8 pt-4 text-[12px] leading-relaxed text-gray-500">
        {paragrapheFr(phraseDesSources(cours))}
      </p>
    </section>
  );
}
