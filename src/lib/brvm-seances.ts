import { createServiceClient } from '@/lib/supabase';

/**
 * Historiques des séances de la BRVM tenus par le site lui-même : le BRVM
 * Composite et BOA Niger (BOAN), seule société nigérienne cotée.
 *
 * La BRVM ne publie aucun historique : ses pages ne montrent que la dernière
 * séance (indices : brvm.org/fr/indices/status/0, actions :
 * brvm.org/fr/cours-actions/0, lisibles en HTML sans script). Une tâche
 * planifiée (/api/cron/releve-brvm, chaque jour ouvré après la clôture) lit
 * ces pages et ajoute la séance du jour aux historiques, rangés dans api_cache
 * (source « brvm_seances », clés « composite » et « boan ») : aucune table à
 * créer.
 *
 * Historiques amorcés avec les séances archivées par le Veilleur NFI depuis le
 * 26/08/2026 (Composite le 24/11/2026, BOA Niger le 25/11/2026). Seules les
 * séances fermées (cours définitifs) sont enregistrées.
 */

export interface SeanceBrvm {
  /** Jour de la séance, AAAA-MM-JJ. */
  date: string;
  precedent: number;
  cloture: number;
  /** Variation de la séance en %, telle que la BRVM la publie. */
  variation: number;
}

export interface LectureIndicesBrvm {
  statut: 'fermee' | 'ouverte' | 'inconnu';
  /** Jour de la séance affichée, AAAA-MM-JJ, lu dans l'en-tête de la page. */
  date: string | null;
  composite: Omit<SeanceBrvm, 'date'> | null;
}

export const URL_INDICES_BRVM = 'https://www.brvm.org/fr/indices/status/0';
export const URL_COURS_ACTIONS_BRVM = 'https://www.brvm.org/fr/cours-actions/0';
/** Bank of Africa Niger, seule société nigérienne cotée à la BRVM. */
export const SYMBOLE_BOA_NIGER = 'BOAN';
/** Clé de chaque historique dans api_cache. */
export type HistoriqueBrvm = 'composite' | 'boan';
const SOURCE_CACHE = 'brvm_seances';
/** Environ un an de séances. */
const SEANCES_GARDEES = 260;

const MOIS: Record<string, number> = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12,
};

const sansAccent = (texte: string) =>
  texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function decoder(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&eacute;/g, 'é')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

/** « 1 234,56 » ou « -0,94 » (signe moins typographique compris) en nombre ; null sinon. */
export function nombreFr(texte: string): number | null {
  const propre = texte.replace(/[\s\u00a0\u202f%]/g, '').replace('\u2212', '-').replace(',', '.');
  if (!/^[-+]?\d+(\.\d+)?$/.test(propre)) return null;
  return Number(propre);
}

/** Lit la page des indices de la BRVM : statut et date de la séance, ligne du BRVM Composite. */
export function analyserIndicesBrvm(html: string): LectureIndicesBrvm {
  const texte = decoder(html);
  const statut = /s[ée]ance\s+ferm[ée]e/i.test(texte)
    ? 'fermee'
    : /s[ée]ance\s+ouverte/i.test(texte)
      ? 'ouverte'
      : 'inconnu';

  // En-tête de séance : « Mardi, 24 novembre, 2026 - 15:52 ».
  let date: string | null = null;
  const entete = html.match(/class="header-seance"[^>]*>([^<]+)</i);
  if (entete) {
    const m = sansAccent(decoder(entete[1]!)).match(/(\d{1,2})\s+([a-z]+),?\s+(\d{4})/);
    const mois = m ? MOIS[m[2]!] : undefined;
    if (m && mois) {
      date = `${m[3]}-${String(mois).padStart(2, '0')}-${m[1]!.padStart(2, '0')}`;
    }
  }

  for (const ligne of html.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
    const cellules = (ligne.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) ?? []).map(decoder);
    // « BRVM - COMPOSITE » seul : pas « BRVM - COMPOSITE TOTAL RETURN ».
    if (cellules.length >= 4 && /^BRVM\s*-?\s*COMPOSITE$/i.test(cellules[0]!)) {
      const precedent = nombreFr(cellules[1]!);
      const cloture = nombreFr(cellules[2]!);
      const variation = nombreFr(cellules[3]!);
      if (precedent && cloture && variation !== null) {
        return { statut, date, composite: { precedent, cloture, variation } };
      }
    }
  }
  return { statut, date, composite: null };
}

/**
 * Lit la ligne d'une action dans la page des cours de la BRVM : cours de la
 * veille, clôture et variation du jour. Une action sans échange garde le cours
 * de la veille en clôture, avec 0 % de variation : c'est ainsi que la BRVM
 * l'affiche.
 */
export function analyserCoursActionBrvm(html: string, symbole: string): Omit<SeanceBrvm, 'date'> | null {
  for (const ligne of html.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
    const cellules = (ligne.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) ?? []).map(decoder);
    // Symbole, Nom, Volume, Cours veille, Cours ouverture, Cours clôture, Variation (%).
    if (cellules.length >= 7 && cellules[0] === symbole) {
      const precedent = nombreFr(cellules[3]!);
      const cloture = nombreFr(cellules[5]!);
      const variation = nombreFr(cellules[6]!);
      if (precedent && cloture && variation !== null) return { precedent, cloture, variation };
    }
  }
  return null;
}

function inserer(seances: SeanceBrvm[], nouvelle: SeanceBrvm): SeanceBrvm[] {
  return [...seances.filter((s) => s.date !== nouvelle.date), nouvelle]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-SEANCES_GARDEES);
}

/**
 * Ajoute une séance lue à l'historique. Ne garde que des cours définitifs
 * (séance fermée) ; une séance déjà connue est remplacée, jamais doublée.
 *
 * Un jour férié, la page de la BRVM affiche la date du jour au-dessus des
 * chiffres de la dernière séance : mêmes « fermeture précédente » et
 * « fermeture » que la séance déjà enregistrée. Ce n'est pas une nouvelle
 * séance, elle n'est pas ajoutée (une vraie séance part toujours de la clôture
 * de la précédente).
 */
export function ajouterSeance(seances: SeanceBrvm[], lecture: LectureIndicesBrvm): SeanceBrvm[] {
  if (lecture.statut !== 'fermee' || !lecture.date || !lecture.composite) return seances;
  const derniere = seances.at(-1);
  if (
    derniere &&
    derniere.date !== lecture.date &&
    derniere.precedent === lecture.composite.precedent &&
    derniere.cloture === lecture.composite.cloture
  ) {
    return seances;
  }
  return inserer(seances, { date: lecture.date, ...lecture.composite });
}

/**
 * Ajoute la séance d'une action, datée par la séance du Composite relevée au
 * même moment : la page des actions n'affiche que l'heure de consultation, et
 * une action peu échangée peut garder le même cours plusieurs jours.
 */
export function ajouterSeanceAction(
  seances: SeanceBrvm[],
  date: string,
  valeurs: Omit<SeanceBrvm, 'date'>,
): SeanceBrvm[] {
  return inserer(seances, { date, ...valeurs });
}

function estSeance(valeur: unknown): valeur is SeanceBrvm {
  const s = valeur as SeanceBrvm;
  return (
    !!s &&
    typeof s.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(s.date) &&
    [s.precedent, s.cloture, s.variation].every((n) => typeof n === 'number' && Number.isFinite(n))
  );
}

/** Historique enregistré, du plus ancien au plus récent ; vide si la base ne répond pas. */
export async function lireSeancesBrvm(historique: HistoriqueBrvm = 'composite'): Promise<SeanceBrvm[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('api_cache')
    .select('data')
    .eq('source', SOURCE_CACHE)
    .eq('key', historique)
    .maybeSingle();
  if (error || !data) return [];
  const seances = (data.data as { seances?: unknown[] } | null)?.seances ?? [];
  return seances.filter(estSeance).sort((a, b) => a.date.localeCompare(b.date));
}

export async function enregistrerSeancesBrvm(
  seances: SeanceBrvm[],
  historique: HistoriqueBrvm = 'composite',
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Client Supabase indisponible');
  const maintenant = new Date().toISOString();
  const { error } = await supabase.from('api_cache').upsert(
    {
      source: SOURCE_CACHE,
      key: historique,
      data: { seances } as unknown as Record<string, unknown>,
      fetched_at: maintenant,
      // L'historique ne périme jamais : c'est une archive, pas un cache.
      expires_at: '2100-01-01T00:00:00.000Z',
      updated_at: maintenant,
    },
    { onConflict: 'source,key' },
  );
  if (error) throw new Error(`Enregistrement des séances BRVM (${historique}) : ${error.message}`);
}

// ─── Séance complète (page Marchés, 25/11/2026) ──────────────────────────────

export interface IndiceBrvm {
  nom: string;
  precedent: number;
  cloture: number;
  /** Variation de la séance, en %. */
  variation: number;
  /** Variation depuis le 31 décembre, en % ; null si la BRVM ne la donne pas. */
  variationAnnee: number | null;
}

export interface ActionBrvm {
  symbole: string;
  /** Nom tel que la BRVM l'écrit (en capitales). */
  nom: string;
  cloture: number;
  variation: number;
  /** Nombre de titres échangés pendant la séance. */
  volume: number | null;
}

export interface SeanceComplete {
  /** Jour de la séance, AAAA-MM-JJ (celui du Composite). */
  date: string;
  indices: IndiceBrvm[];
  actions: ActionBrvm[];
  /** Capitalisation des actions, en FCFA. */
  capitalisationActions: number | null;
  /** Valeur des transactions de la séance, en FCFA. */
  valeurTransactions: number | null;
}

/** « 18 226 419 319 289 FCFA » en nombre ; null sinon. */
function montantFcfa(texte: string): number | null {
  return nombreFr(texte.replace(/FCFA/i, ''));
}

/** Tous les indices de la page des indices (« BRVM - COMPOSITE », « BRVM-30 »…), dans l'ordre de la page. */
export function analyserTousLesIndices(html: string): IndiceBrvm[] {
  const sortie: IndiceBrvm[] = [];
  for (const ligne of html.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
    const cellules = (ligne.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) ?? []).map(decoder);
    // Nom, Fermeture précédente, Fermeture, Variation (%), Variation 31 décembre (%).
    if (cellules.length >= 4 && /^BRVM/i.test(cellules[0]!)) {
      const precedent = nombreFr(cellules[1]!);
      const cloture = nombreFr(cellules[2]!);
      const variation = nombreFr(cellules[3]!);
      if (precedent && cloture && variation !== null && !sortie.some((i) => i.nom === cellules[0])) {
        sortie.push({
          nom: cellules[0]!,
          precedent,
          cloture,
          variation,
          variationAnnee: cellules[4] ? nombreFr(cellules[4]) : null,
        });
      }
    }
  }
  return sortie;
}

/** Capitalisation des actions et valeur des transactions (« Activités du marché »). */
export function analyserActiviteMarche(html: string): Pick<SeanceComplete, 'capitalisationActions' | 'valeurTransactions'> {
  let capitalisationActions: number | null = null;
  let valeurTransactions: number | null = null;
  for (const ligne of html.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
    const cellules = (ligne.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) ?? []).map(decoder);
    if (cellules.length < 2) continue;
    if (/^Capitalisation Actions$/i.test(cellules[0]!)) capitalisationActions = montantFcfa(cellules[1]!);
    if (/^Valeur des transactions$/i.test(cellules[0]!)) valeurTransactions = montantFcfa(cellules[1]!);
  }
  return { capitalisationActions, valeurTransactions };
}

/** Toutes les actions de la page des cours, dans l'ordre de la page. */
export function analyserToutesLesActions(html: string): ActionBrvm[] {
  const sortie: ActionBrvm[] = [];
  for (const ligne of html.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
    const cellules = (ligne.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) ?? []).map(decoder);
    // Symbole, Nom, Volume, Cours veille, Cours ouverture, Cours clôture, Variation (%).
    if (cellules.length >= 7 && /^[A-Z]{3,6}$/.test(cellules[0]!)) {
      const cloture = nombreFr(cellules[5]!);
      const variation = nombreFr(cellules[6]!);
      if (cloture && variation !== null && !sortie.some((a) => a.symbole === cellules[0])) {
        sortie.push({ symbole: cellules[0]!, nom: cellules[1]!, cloture, variation, volume: nombreFr(cellules[2]!) });
      }
    }
  }
  return sortie;
}

/**
 * La séance complète, datée par le Composite : null si la page des actions
 * manque ou si l'une des deux pages est illisible (moins de dix actions).
 */
export function construireSeanceComplete(
  date: string,
  pageIndices: string,
  pageActions: string | null,
): SeanceComplete | null {
  if (!pageActions) return null;
  const actions = analyserToutesLesActions(pageActions);
  const indices = analyserTousLesIndices(pageIndices);
  if (actions.length < 10 || indices.length === 0) return null;
  return { date, indices, actions, ...analyserActiviteMarche(pageIndices) };
}

function estSeanceComplete(valeur: unknown): valeur is SeanceComplete {
  const s = valeur as SeanceComplete;
  return !!s && typeof s.date === 'string' && Array.isArray(s.indices) && Array.isArray(s.actions) && s.actions.length > 0;
}

/** La dernière séance complète enregistrée ; null si aucune ou si la base ne répond pas. */
export async function lireSeanceComplete(): Promise<SeanceComplete | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('api_cache')
    .select('data')
    .eq('source', SOURCE_CACHE)
    .eq('key', 'seance_complete')
    .maybeSingle();
  if (error || !data) return null;
  return estSeanceComplete(data.data) ? data.data : null;
}

export async function enregistrerSeanceComplete(seance: SeanceComplete): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Client Supabase indisponible');
  const maintenant = new Date().toISOString();
  const { error } = await supabase.from('api_cache').upsert(
    {
      source: SOURCE_CACHE,
      key: 'seance_complete',
      data: seance as unknown as Record<string, unknown>,
      fetched_at: maintenant,
      expires_at: '2100-01-01T00:00:00.000Z',
      updated_at: maintenant,
    },
    { onConflict: 'source,key' },
  );
  if (error) throw new Error(`Enregistrement de la séance complète de la BRVM : ${error.message}`);
}
