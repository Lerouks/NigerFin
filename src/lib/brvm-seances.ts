import { createServiceClient } from '@/lib/supabase';

/**
 * Historique des séances du BRVM Composite, tenu par le site lui-même.
 *
 * La BRVM ne publie aucun historique : sa page des indices ne montre que la
 * dernière séance (brvm.org/fr/indices/status/0, lisible en HTML sans script).
 * Une tâche planifiée (/api/cron/releve-brvm, chaque jour ouvré après la
 * clôture) lit cette page et ajoute la séance du jour à l'historique, rangé
 * dans api_cache (source « brvm_seances ») : aucune table à créer.
 *
 * L'historique a été amorcé le 24/11/2026 avec les séances archivées par le
 * Veilleur NFI depuis le 26/08/2026. Seules les séances fermées (cours
 * définitifs) sont enregistrées.
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
const SOURCE_CACHE = 'brvm_seances';
const CLE_CACHE = 'composite';
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
 * Ajoute une séance lue à l'historique. Ne garde que des cours définitifs
 * (séance fermée) ; une séance déjà connue est remplacée, jamais doublée.
 */
export function ajouterSeance(seances: SeanceBrvm[], lecture: LectureIndicesBrvm): SeanceBrvm[] {
  if (lecture.statut !== 'fermee' || !lecture.date || !lecture.composite) return seances;
  const nouvelle: SeanceBrvm = { date: lecture.date, ...lecture.composite };
  return [...seances.filter((s) => s.date !== nouvelle.date), nouvelle]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-SEANCES_GARDEES);
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
export async function lireSeancesBrvm(): Promise<SeanceBrvm[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('api_cache')
    .select('data')
    .eq('source', SOURCE_CACHE)
    .eq('key', CLE_CACHE)
    .maybeSingle();
  if (error || !data) return [];
  const seances = (data.data as { seances?: unknown[] } | null)?.seances ?? [];
  return seances.filter(estSeance).sort((a, b) => a.date.localeCompare(b.date));
}

export async function enregistrerSeancesBrvm(seances: SeanceBrvm[]): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Client Supabase indisponible');
  const maintenant = new Date().toISOString();
  const { error } = await supabase.from('api_cache').upsert(
    {
      source: SOURCE_CACHE,
      key: CLE_CACHE,
      data: { seances } as unknown as Record<string, unknown>,
      fetched_at: maintenant,
      // L'historique ne périme jamais : c'est une archive, pas un cache.
      expires_at: '2100-01-01T00:00:00.000Z',
      updated_at: maintenant,
    },
    { onConflict: 'source,key' },
  );
  if (error) throw new Error(`Enregistrement des séances BRVM : ${error.message}`);
}
