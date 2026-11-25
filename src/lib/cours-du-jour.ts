import { unstable_cache } from 'next/cache';
import { coursBceaoSurPeriode, encadreBceao } from '@/lib/bceao';
import { lireSeancesBrvm, type SeanceBrvm } from '@/lib/brvm-seances';
import { serieNairaCbn } from '@/lib/cbn';

/**
 * « Les cours du jour » de la page Finance (24/11/2026, maquette validée par
 * Raouf). Règle : chaque cours vient d'une source réelle et datée. Une source
 * en panne retire sa tuile ; le site n'affiche jamais un chiffre inventé, ni un
 * cours de plus de dix jours.
 *
 * Sources officielles depuis le 25/11/2026 (choix fait en autonomie, à la
 * demande de Raouf de « réfléchir à d'où viennent les chiffres ») :
 * - Euro : parité fixe du franc CFA, 655,957 FCFA.
 * - Dollar : cours de référence publié chaque jour par la BCEAO (bceao.ts). En
 *   secours seulement, celui de la Banque centrale européenne converti par la
 *   parité fixe : c'est le même chiffre, la BCEAO le calcule ainsi.
 * - Naira : cours officiel de la Banque centrale du Nigeria (cbn.ts). Il
 *   remplace un cours « indicatif » de source inconnue, 2 % trop haut.
 * - BRVM Composite et BOA Niger (seule société nigérienne cotée) : séances
 *   relevées par le site chaque soir de séance (voir brvm-seances.ts).
 * - Or et Brent : cours de New York (COMEX, NYMEX) lus chez Yahoo Finance ; l'or
 *   est converti en FCFA le gramme avec le dollar du même jour. Aucune source
 *   officielle ne les publie gratuitement chaque jour.
 * - Taux directeur de la BCEAO : lu sur la page d'accueil de la BCEAO, avec sa
 *   date d'entrée en vigueur.
 *
 * Chaque tuile porte le texte de sa source : le bouton « Sources » dit toujours
 * d'où vient le chiffre affiché, secours compris.
 */

export const PARITE_EURO_FCFA = 655.957;
const GRAMMES_PAR_ONCE = 31.1034768;
const DELAI_MS = 8000;
const JOUR_MS = 86_400_000;
/** Au-delà, un cours n'est plus « du jour » : sa tuile disparaît. */
const AGE_MAX_JOURS = 10;
/** Profondeur des courbes. */
const PROFONDEUR_JOURS = 31;

export interface PointDeCours {
  /** AAAA-MM-JJ */
  date: string;
  valeur: number;
}

type CleCours = 'euro' | 'dollar' | 'naira' | 'brvm' | 'boan' | 'or' | 'brent' | 'taux';

export interface Cours {
  cle: CleCours;
  libelle: string;
  valeur: number;
  unite: string;
  decimales: number;
  /** Date du dernier cours ; null pour l'euro, dont la parité ne bouge pas. */
  date: string | null;
  /** Variation en % depuis le cours précédent ; null si sans objet. */
  variation: number | null;
  /** Points de la courbe, du plus ancien au plus récent ; vide pour l'euro. */
  serie: PointDeCours[];
  /** Ce que dit la ligne sous le chiffre quand il n'y a pas de variation. */
  mention?: string;
  /** Ce que mesure la courbe, pour les lecteurs d'écran. */
  descriptionCourbe?: string;
  /** D'où vient le chiffre, en une phrase (bouton « Sources »). */
  source: string;
}

// ─── Calculs (purs, testés) ──────────────────────────────────────────────────

const dateIso = (d: Date) => d.toISOString().slice(0, 10);

export function variationPourcent(serie: PointDeCours[]): number | null {
  if (serie.length < 2) return null;
  const avant = serie[serie.length - 2]!.valeur;
  const apres = serie[serie.length - 1]!.valeur;
  return avant ? ((apres - avant) / avant) * 100 : null;
}

/** Les points des 31 derniers jours avant le dernier point. */
export function dernierMois(serie: PointDeCours[]): PointDeCours[] {
  const dernier = serie.at(-1);
  if (!dernier) return [];
  const limite = dateIso(new Date(Date.parse(dernier.date) - PROFONDEUR_JOURS * JOUR_MS));
  return serie.filter((p) => p.date >= limite);
}

/** Âge en jours d'un cours daté, à la date donnée. */
export function ageEnJours(date: string, aujourdhui: Date): number {
  return Math.floor((Date.parse(dateIso(aujourdhui)) - Date.parse(date)) / JOUR_MS);
}

/** Taux de la BCE (dollars pour un euro) en FCFA pour un dollar. */
export function dollarEnFcfa(taux: Record<string, { USD?: number }>): PointDeCours[] {
  return Object.entries(taux)
    .filter(([, t]) => typeof t.USD === 'number' && t.USD > 0)
    .map(([date, t]) => ({ date, valeur: PARITE_EURO_FCFA / t.USD! }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Dernier point connu à une date donnée (ou avant). */
export function pointA(serie: PointDeCours[], date: string): PointDeCours | undefined {
  let trouve: PointDeCours | undefined;
  for (const p of serie) {
    if (p.date <= date) trouve = p;
    else break;
  }
  return trouve ?? serie[0];
}

/** Or en dollars l'once, converti en FCFA le gramme avec le dollar du même jour. */
export function orEnFcfaLeGramme(or: PointDeCours[], dollar: PointDeCours[]): PointDeCours[] {
  return or
    .map((p) => {
      const usd = pointA(dollar, p.date);
      return usd ? { date: p.date, valeur: (p.valeur * usd.valeur) / GRAMMES_PAR_ONCE } : null;
    })
    .filter((p): p is PointDeCours => p !== null);
}

interface ReponseYahoo {
  chart?: {
    result?: Array<{
      meta?: { gmtoffset?: number };
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }>;
  };
}

/** Clôtures quotidiennes d'un graphique Yahoo, datées à l'heure de la place. */
export function pointsYahoo(json: ReponseYahoo): PointDeCours[] {
  const r = json.chart?.result?.[0];
  const horodatages = r?.timestamp ?? [];
  const clotures = r?.indicators?.quote?.[0]?.close ?? [];
  const decalage = r?.meta?.gmtoffset ?? 0;
  const parDate = new Map<string, number>();
  horodatages.forEach((t, i) => {
    const valeur = clotures[i];
    if (typeof valeur === 'number' && Number.isFinite(valeur) && valeur > 0) {
      parDate.set(dateIso(new Date((t + decalage) * 1000)), valeur);
    }
  });
  return [...parDate].map(([date, valeur]) => ({ date, valeur })).sort((a, b) => a.date.localeCompare(b.date));
}

function seancesEnPoints(seances: SeanceBrvm[]): PointDeCours[] {
  return seances.map((s) => ({ date: s.date, valeur: s.cloture }));
}

// ─── Sources (une erreur n'est jamais mise en cache) ─────────────────────────

async function lireJson<T>(url: string, entetes?: Record<string, string>): Promise<T> {
  const reponse = await fetch(url, {
    headers: entetes,
    signal: AbortSignal.timeout(DELAI_MS),
    cache: 'no-store',
  });
  if (!reponse.ok) throw new Error(`${new URL(url).host} : réponse ${reponse.status}`);
  return (await reponse.json()) as T;
}

const serieDollar = unstable_cache(
  async (): Promise<PointDeCours[]> => {
    const debut = dateIso(new Date(Date.now() - 45 * JOUR_MS));
    const json = await lireJson<{ rates?: Record<string, { USD?: number }> }>(
      `https://api.frankfurter.dev/v1/${debut}..?base=EUR&symbols=USD`,
    );
    const serie = dollarEnFcfa(json.rates ?? {});
    if (serie.length < 2) throw new Error('BCE : série du dollar trop courte');
    return serie;
  },
  ['cours-dollar-bce-v1'],
  { revalidate: 3600, tags: ['cours-du-jour'] },
);

function serieYahoo(symbole: string) {
  return unstable_cache(
    async (): Promise<PointDeCours[]> => {
      const json = await lireJson<ReponseYahoo>(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbole)}?range=1mo&interval=1d`,
        { 'User-Agent': 'Mozilla/5.0' },
      );
      const serie = pointsYahoo(json);
      if (serie.length < 2) throw new Error(`Yahoo ${symbole} : série trop courte`);
      return serie;
    },
    [`cours-yahoo-${symbole}-v1`],
    { revalidate: 3600, tags: ['cours-du-jour'] },
  );
}
const serieOrUsd = serieYahoo('GC=F');
const serieBrent = serieYahoo('BZ=F');

const seancesBrvm = unstable_cache(
  async (): Promise<SeanceBrvm[]> => {
    const seances = await lireSeancesBrvm('composite');
    if (seances.length < 2) throw new Error('BRVM : historique vide');
    return seances;
  },
  ['cours-brvm-seances-v1'],
  { revalidate: 3600, tags: ['cours-du-jour', 'brvm-seances'] },
);

const seancesBoaNiger = unstable_cache(
  async (): Promise<SeanceBrvm[]> => {
    const seances = await lireSeancesBrvm('boan');
    if (seances.length < 2) throw new Error('BOA Niger : historique vide');
    return seances;
  },
  ['cours-boan-seances-v1'],
  { revalidate: 3600, tags: ['cours-du-jour', 'brvm-seances'] },
);

async function essayer<T>(source: () => Promise<T>): Promise<T | null> {
  try {
    return await source();
  } catch (erreur) {
    console.error('[cours-du-jour]', erreur instanceof Error ? erreur.message : erreur);
    return null;
  }
}

// ─── Assemblage ──────────────────────────────────────────────────────────────

const nombre = (valeur: number, decimales: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(valeur);

const NB = '\u00a0';

/** Les textes du bouton « Sources », un par cours (l'insécable garde ensemble ce qui ne doit pas se couper). */
export const SOURCES = {
  euro: `Parité fixe : 1 euro vaut 655,957${NB}FCFA.`,
  dollarBceao: 'Cours de référence publié chaque jour par la BCEAO.',
  dollarBce: 'Cours de référence de la Banque centrale européenne, converti en FCFA par la parité fixe.',
  naira: 'Cours officiel publié chaque jour par la Banque centrale du Nigeria.',
  // « de chaque séance. » restait seul en dernière ligne à 360 px et sur ordinateur (mesuré le 25/11/2026).
  brvm: `Cours de clôture publié par la BRVM à${NB}la${NB}fin${NB}de${NB}chaque${NB}séance.`,
  // Le nom de la banque ne se coupe jamais : « Bank of » seul en fin de ligne.
  boan: `Cours de clôture de Bank${NB}of${NB}Africa${NB}Niger, la seule société nigérienne cotée à la BRVM, publié chaque soir de séance.`,
  or: 'Cours de l’or à New York (COMEX), converti en FCFA le gramme avec le dollar du jour.',
  brent: 'Cours du Brent à New York (NYMEX), en dollars le baril.',
  taux: (depuis: string) => `Principal taux directeur de la BCEAO, en vigueur depuis le ${dateLongueFr(depuis)}.`,
} as const;

const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** « 2026-03-16 » en « 16 mars 2026 » (le 1er du mois s'écrit « 1er »). */
export function dateLongueFr(iso: string): string {
  const [annee, mois, jour] = iso.split('-').map(Number);
  return `${jour === 1 ? '1er' : jour}${NB}${MOIS_FR[mois! - 1]}${NB}${annee}`;
}

/** « 2026-03-16 » en « mars 2026 ». */
function moisFr(iso: string): string {
  const [annee, mois] = iso.split('-').map(Number);
  return `${MOIS_FR[mois! - 1]}${NB}${annee}`;
}

function tuile(
  base: Pick<Cours, 'cle' | 'libelle' | 'unite' | 'decimales' | 'source'>,
  serie: PointDeCours[] | null,
  aujourdhui: Date,
  variation?: number | null,
): Cours | null {
  const dernier = serie?.at(-1);
  if (!serie || !dernier || ageEnJours(dernier.date, aujourdhui) > AGE_MAX_JOURS) return null;
  const courbe = dernierMois(serie);
  const premier = courbe[0]!;
  return {
    ...base,
    valeur: dernier.valeur,
    date: dernier.date,
    variation: variation !== undefined ? variation : variationPourcent(serie),
    serie: courbe,
    descriptionCourbe: `${base.libelle} sur un mois : de ${nombre(premier.valeur, base.decimales)} à ${nombre(dernier.valeur, base.decimales)} ${base.unite}`,
  };
}

/** Le dollar de la BCEAO, jour par jour ; vide si elle ne répond pas. */
async function serieDollarBceao(aujourdhui: Date): Promise<PointDeCours[]> {
  const jours = await coursBceaoSurPeriode(aujourdhui, PROFONDEUR_JOURS + 3);
  return jours
    .map((j) => ({ date: j.date, valeur: j.devises['Dollar us'] ?? NaN }))
    .filter((p) => Number.isFinite(p.valeur) && p.valeur > 0);
}

export async function getCoursDuJour(aujourdhui = new Date()): Promise<Cours[]> {
  const [dollarBceao, dollarBce, naira, brvm, boan, orUsd, brent, encadre] = await Promise.all([
    essayer(() => serieDollarBceao(aujourdhui)),
    essayer(serieDollar),
    essayer(serieNairaCbn),
    essayer(seancesBrvm),
    essayer(seancesBoaNiger),
    essayer(serieOrUsd),
    essayer(serieBrent),
    essayer(encadreBceao),
  ]);

  // La BCEAO d'abord ; la BCE seulement si la BCEAO ne donne pas de cours récent.
  const bceaoUtilisable =
    !!dollarBceao && dollarBceao.length >= 2 && ageEnJours(dollarBceao.at(-1)!.date, aujourdhui) <= AGE_MAX_JOURS;
  const dollar = bceaoUtilisable ? dollarBceao : dollarBce;
  const taux = encadre?.taux ?? null;

  const tuiles: Array<Cours | null> = [
    tuile(
      { cle: 'dollar', libelle: 'Dollar', unite: 'FCFA', decimales: 0, source: bceaoUtilisable ? SOURCES.dollarBceao : SOURCES.dollarBce },
      dollar,
      aujourdhui,
    ),
    tuile({ cle: 'naira', libelle: '100 nairas', unite: 'FCFA', decimales: 2, source: SOURCES.naira }, naira, aujourdhui),
    tuile(
      { cle: 'brvm', libelle: 'BRVM Composite', unite: 'points', decimales: 2, source: SOURCES.brvm },
      brvm ? seancesEnPoints(brvm) : null,
      aujourdhui,
      // La variation publiée par la BRVM, plutôt qu'un calcul sur un historique
      // qui peut avoir des trous.
      brvm?.at(-1)?.variation ?? null,
    ),
    tuile(
      { cle: 'boan', libelle: 'BOA Niger', unite: 'FCFA', decimales: 0, source: SOURCES.boan },
      boan ? seancesEnPoints(boan) : null,
      aujourdhui,
      boan?.at(-1)?.variation ?? null,
    ),
    tuile(
      { cle: 'or', libelle: 'Or, le gramme', unite: 'FCFA', decimales: 0, source: SOURCES.or },
      orUsd && dollar ? orEnFcfaLeGramme(orUsd, dollar) : null,
      aujourdhui,
    ),
    tuile({ cle: 'brent', libelle: 'Brent, le baril', unite: 'dollars', decimales: 2, source: SOURCES.brent }, brent, aujourdhui),
    // L'euro et le taux directeur ferment la rangée : ils ne bougent pas chaque
    // jour, ils n'ont ni courbe ni variation.
    {
      cle: 'euro',
      libelle: 'Euro',
      valeur: PARITE_EURO_FCFA,
      unite: 'FCFA',
      decimales: 3,
      date: null,
      variation: null,
      serie: [],
      mention: 'parité fixe',
      source: SOURCES.euro,
    },
    taux
      ? {
          cle: 'taux',
          libelle: 'Taux BCEAO',
          valeur: taux.principal,
          unite: '%',
          decimales: 2,
          date: null,
          variation: null,
          serie: [],
          mention: `depuis ${moisFr(taux.depuis)}`,
          source: SOURCES.taux(taux.depuis),
        }
      : null,
  ];
  return tuiles.filter((t): t is Cours => t !== null);
}
