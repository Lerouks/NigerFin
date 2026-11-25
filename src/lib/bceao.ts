import { unstable_cache } from 'next/cache';

/**
 * Ce que la BCEAO publie elle-même sur son site, lu sans clé ni compte
 * (vérifié le 25/11/2026) :
 *
 * - les cours de référence des devises contre le franc CFA, jour par jour.
 *   L'adresse est celle qui sert le sélecteur de date de la page « Cours de
 *   référence » : un fragment HTML de 4 Ko par jour ouvré, rien le samedi, le
 *   dimanche ni les jours fériés ;
 * - ses taux directeurs et les grands indicateurs de l'UEMOA, en encadré sur sa
 *   page d'accueil.
 *
 * Un jour passé ne change plus : il est gardé une semaine en cache, et seuls
 * les trois derniers jours sont relus chaque heure. La BCEAO reçoit donc une
 * à trois requêtes par heure, pas trente.
 */

export const PAGE_COURS_BCEAO =
  'https://www.bceao.int/fr/cours/cours-de-reference-des-principales-devises-contre-franc-cfa';
const URL_COURS_DU_JOUR = 'https://www.bceao.int/fr/cours/get_all_reference_by_date';
export const URL_ACCUEIL_BCEAO = 'https://www.bceao.int/fr';

const DELAI_MS = 8000;
const JOUR_MS = 86_400_000;
const MOIS: Record<string, number> = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12,
};

// ─── Lecture (pure, testée) ──────────────────────────────────────────────────

const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function texte(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;|&#8217;/g, '’')
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&agrave;/g, 'à')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

/** « 1.935,7360 », « 598,3400 », « 148 380 » ou « -3,2 » en nombre ; null sinon. */
export function nombreBceao(brut: string): number | null {
  const propre = brut.replace(/[\s  ]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  if (!/^[-+]?\d+(\.\d+)?$/.test(propre)) return null;
  return Number(propre);
}

/** « 24 Novembre 2026 » ou « 16 mars 2026 » en AAAA-MM-JJ ; null sinon. */
export function dateBceao(brut: string): string | null {
  const m = sansAccent(brut).match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  const mois = m ? MOIS[m[2]!] : undefined;
  if (!m || !mois) return null;
  return `${m[3]}-${String(mois).padStart(2, '0')}-${m[1]!.padStart(2, '0')}`;
}

export interface CoursBceao {
  /** Jour des cours, AAAA-MM-JJ, lu dans le titre du tableau. */
  date: string;
  /** Nom de la devise tel que la BCEAO l'écrit, et sa valeur en FCFA pour une unité. */
  devises: Record<string, number>;
}

/** Lit le tableau d'un jour ; null un jour sans cours (week-end, jour férié, jour pas encore publié). */
export function analyserCoursBceao(html: string): CoursBceao | null {
  const titre = texte(html).match(/Cours des devises du\s+\S+\s+(\d{1,2}\s+\S+\s+\d{4})/i);
  const date = titre ? dateBceao(titre[1]!) : null;
  if (!date) return null;
  const devises: Record<string, number> = {};
  for (const ligne of html.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
    const cellules = (ligne.match(/<td[\s\S]*?<\/td>/gi) ?? []).map(texte);
    if (cellules.length >= 2) {
      const valeur = nombreBceao(cellules[1]!);
      if (cellules[0] && valeur !== null && valeur > 0) devises[cellules[0]] = valeur;
    }
  }
  return Object.keys(devises).length > 0 ? { date, devises } : null;
}

export interface TauxDirecteurs {
  /** Taux minimum de soumission aux appels d'offres, le principal taux directeur, en %. */
  principal: number;
  /** Taux du guichet de prêt marginal, en %. */
  pretMarginal: number | null;
  /** Date d'entrée en vigueur, AAAA-MM-JJ. */
  depuis: string;
}

export interface IndicateursUemoa {
  /** Date de mise à jour annoncée par la BCEAO, AAAA-MM-JJ. */
  miseAJour: string | null;
  /** Année des estimations (PIB, croissance, soldes). */
  anneeEstimations: number | null;
  pibMilliards: number | null;
  croissance: number | null;
  soldeBudgetaire: number | null;
  inflation: { valeur: number; annee: number } | null;
}

export interface EncadreBceao {
  taux: TauxDirecteurs | null;
  uemoa: IndicateursUemoa;
}

/** Lit l'encadré « Principaux indicateurs » et « Taux directeurs » de la page d'accueil. */
export function analyserEncadreBceao(html: string): EncadreBceao {
  const t = texte(html);
  const pourcent = (re: RegExp) => {
    const m = t.match(re);
    return m ? nombreBceao(m[1]!) : null;
  };
  const principal = pourcent(/Taux minimum de soumission\s*:\s*(-?[\d,]+)\s*%/i);
  const pretMarginal = pourcent(/guichet de pr[êe]t marginal\s*:\s*(-?[\d,]+)\s*%/i);
  const depuisBrut = t.match(/Effectifs? depuis le\s+(\d{1,2}\s+\S+\s+\d{4})/i);
  const depuis = depuisBrut ? dateBceao(depuisBrut[1]!) : null;

  const miseAJourBrut = t.match(/Date de mise à jour\s*:\s*(\d{1,2}\s+\S+\s+\d{4})/i);
  const estimations = t.match(/estimations\s+(\d{4})/i);
  const pib = t.match(/PIB\s*:\s*([\d\s  .,]+?)\s*Mds/i);
  const inflation = t.match(/Taux d.inflation\s*:\s*(-?[\d,]+)\s*%\s*\((\d{4})\)/i);
  const valeurInflation = inflation ? nombreBceao(inflation[1]!) : null;

  return {
    taux: principal !== null && depuis ? { principal, pretMarginal, depuis } : null,
    uemoa: {
      miseAJour: miseAJourBrut ? dateBceao(miseAJourBrut[1]!) : null,
      anneeEstimations: estimations ? Number(estimations[1]) : null,
      pibMilliards: pib ? nombreBceao(pib[1]!) : null,
      croissance: pourcent(/Taux de croissance\s*:\s*(-?[\d,]+)\s*%/i),
      soldeBudgetaire: pourcent(/Solde budg[ée]taire\/PIB[^:]*:\s*(-?[\d,]+)\s*%/i),
      inflation: valeurInflation !== null && inflation ? { valeur: valeurInflation, annee: Number(inflation[2]) } : null,
    },
  };
}

/** Jours ouvrés (lundi à vendredi) des `jours` derniers jours, du plus ancien au plus récent. */
export function joursOuvres(aujourdhui: Date, jours: number): string[] {
  const sortie: string[] = [];
  const base = Date.parse(aujourdhui.toISOString().slice(0, 10));
  for (let i = jours; i >= 0; i -= 1) {
    const d = new Date(base - i * JOUR_MS);
    const jour = d.getUTCDay();
    if (jour !== 0 && jour !== 6) sortie.push(d.toISOString().slice(0, 10));
  }
  return sortie;
}

// ─── Sources (une erreur n'est jamais mise en cache) ─────────────────────────

async function lirePage(url: string): Promise<string> {
  const reponse = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'fr' },
    signal: AbortSignal.timeout(DELAI_MS),
    cache: 'no-store',
  });
  if (!reponse.ok) throw new Error(`BCEAO : réponse ${reponse.status}`);
  return reponse.text();
}

/** Cours d'un jour, gardé une heure s'il est récent, une semaine sinon. */
function coursDuJourBceao(date: string, recent: boolean): Promise<CoursBceao | null> {
  return unstable_cache(
    async () => analyserCoursBceao(await lirePage(`${URL_COURS_DU_JOUR}?dateJour=${date}`)),
    ['bceao-cours-jour-v1', date],
    { revalidate: recent ? 3600 : 7 * 86_400, tags: ['cours-du-jour'] },
  )();
}

/**
 * Les cours de référence de la BCEAO sur `jours` jours, du plus ancien au plus
 * récent. Les jours illisibles sont sautés ; une série vide veut dire que la
 * BCEAO ne répond pas.
 */
export async function coursBceaoSurPeriode(aujourdhui: Date, jours: number): Promise<CoursBceao[]> {
  const dates = joursOuvres(aujourdhui, jours);
  const limiteRecente = new Date(Date.parse(aujourdhui.toISOString().slice(0, 10)) - 3 * JOUR_MS)
    .toISOString()
    .slice(0, 10);
  const parDate = new Map<string, CoursBceao>();
  // Huit requêtes à la fois au plus, pour ne pas assaillir le site de la BCEAO
  // quand le cache est vide (premier affichage après une mise en ligne).
  for (let i = 0; i < dates.length; i += 8) {
    const lot = dates.slice(i, i + 8);
    const lectures = await Promise.allSettled(lot.map((d) => coursDuJourBceao(d, d >= limiteRecente)));
    for (const l of lectures) {
      if (l.status === 'fulfilled' && l.value) parDate.set(l.value.date, l.value);
    }
  }
  return [...parDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** L'encadré de la page d'accueil (taux directeurs, indicateurs de l'UEMOA), relu toutes les six heures. */
export const encadreBceao = unstable_cache(
  async (): Promise<EncadreBceao> => {
    const encadre = analyserEncadreBceao(await lirePage(URL_ACCUEIL_BCEAO));
    if (!encadre.taux) throw new Error('BCEAO : taux directeurs introuvables sur la page d’accueil');
    return encadre;
  },
  ['bceao-encadre-v1'],
  { revalidate: 6 * 3600, tags: ['cours-du-jour'] },
);
