import type { SupabaseClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/nextjs';
import { logAuditEvent } from '@/lib/audit';
import {
  revaliderArticles,
  revaliderEducation,
  revaliderEntreprises,
  revaliderPagesLegales,
} from '@/lib/revalidation-contenus';
import { typographieFr } from '@/lib/typographie-fr';
import { isValidUUID } from '@/lib/validation';
import { DUREE_CONSERVATION_JOURS, estTableCorbeille, type TableCorbeille } from './libelles';
import {
  corbeilleAbsente,
  echecMiseALaCorbeille,
  echecRestauration,
  lireErreur,
  messageRestauration,
  remarquesEnFrancais,
  type Echec,
  type ErreurLue,
} from './messages';

/**
 * Corbeille des contenus supprimés.
 *
 * Tout le travail se fait dans la base, par les fonctions de la migration
 * 00032 : chacune est une transaction, qui aboutit en entier ou ne laisse
 * aucune trace. Ce fichier ne fait que les appeler avec la clé de service,
 * traduire leur réponse en français, rafraîchir les pages du site et tenir le
 * journal. Aucun composant client ne l'importe : l'écran n'importe que
 * libelles.ts.
 */

export { DUREE_CONSERVATION_JOURS, estTableCorbeille, type TableCorbeille };
export type { Echec };

export type ResultatMiseALaCorbeille =
  | { ok: true; idCorbeille: string; titre: string; resume: Record<string, number> }
  | Echec;

export type ResultatRestauration =
  | {
      ok: true;
      table: TableCorbeille;
      titre: string;
      message: string;
      remarques: string[];
    }
  | Echec;

export interface EntreeListee {
  id: string;
  table_origine: string;
  id_origine: string;
  titre: string;
  supprime_le: string;
  resume_dependants: Record<string, number>;
}

export type ResultatListe =
  | { ok: true; entrees: EntreeListee[]; total: number }
  | Echec;

function objet(valeur: unknown): Record<string, unknown> {
  return valeur && typeof valeur === 'object' && !Array.isArray(valeur) ? (valeur as Record<string, unknown>) : {};
}

function texte(valeur: unknown): string | null {
  return typeof valeur === 'string' && valeur.trim() ? valeur : null;
}

function compteurs(valeur: unknown): Record<string, number> {
  const resultat: Record<string, number> = {};
  for (const [cle, nombre] of Object.entries(objet(valeur))) {
    if (typeof nombre === 'number' && Number.isFinite(nombre)) resultat[cle] = nombre;
  }
  return resultat;
}

function signaler(contexte: string, lue: ErreurLue | null, extra?: Record<string, unknown>, erreur?: unknown): void {
  Sentry.captureException(erreur ?? new Error(`corbeille : ${lue?.refus ?? lue?.code ?? 'réponse inattendue'}`), {
    tags: { context: contexte },
    extra: { code: lue?.code ?? null, refus: lue?.refus ?? null, detail: lue?.detailBrut ?? null, ...extra },
  });
}

/**
 * Rafraîchit les pages du contenu, à la suppression comme à la restauration :
 * un contenu remis en place réapparaît exactement là d'où il était parti. Une
 * panne du cache ne fait pas croire que l'opération a échoué : la base, elle,
 * a bien changé.
 */
function revalider(table: TableCorbeille, slug: string | null): void {
  try {
    switch (table) {
      case 'articles':
        revaliderArticles(slug);
        break;
      case 'education_lessons':
      case 'education_categories':
        revaliderEducation();
        break;
      case 'strategic_enterprises':
        revaliderEntreprises(slug);
        break;
      case 'legal_sections':
        revaliderPagesLegales();
        break;
      case 'newsletter_issues':
        // Seuls les numéros envoyés sont publics, et un numéro envoyé ne peut
        // pas être supprimé : rien à rafraîchir.
        break;
    }
  } catch (erreur) {
    signaler('corbeille-revalidation', null, { table }, erreur);
  }
}

/** Trace au journal d'audit. Un journal en panne ne bloque jamais l'action, déjà faite. */
async function journaliser(
  parQui: string,
  action: string,
  table: string,
  id: string,
  details: Record<string, unknown>,
): Promise<void> {
  try {
    await logAuditEvent(parQui, action, table, id, details);
  } catch (erreur) {
    signaler('corbeille-journal', null, { action, table }, erreur);
  }
}

/** Met un contenu à la corbeille, avec ce que la base efface avec lui. */
export async function mettreALaCorbeille(
  service: SupabaseClient,
  table: TableCorbeille,
  id: string,
  parQui: string,
): Promise<ResultatMiseALaCorbeille> {
  const { data, error } = await service.rpc('corbeille_mettre', { p_table: table, p_id: id, p_par: parQui });
  if (error) {
    const lue = lireErreur(error);
    const resultat = echecMiseALaCorbeille(lue);
    if (resultat.inattendu) signaler('corbeille-mise', lue, { table });
    return resultat;
  }
  const reponse = objet(data);
  const idCorbeille = texte(reponse.id_corbeille);
  if (!idCorbeille) {
    // La transaction a abouti (aucune erreur), mais sa réponse est illisible.
    signaler('corbeille-mise', null, { table, reponse: typeof data });
    return {
      ok: false,
      statut: 500,
      inattendu: true,
      motif: typographieFr('Le contenu est parti à la corbeille, mais la réponse de la base est illisible. Rechargez la page.'),
    };
  }
  const titre = texte(reponse.titre) ?? 'Sans titre';
  const resume = compteurs(reponse.resume);
  revalider(table, texte(reponse.slug));
  await journaliser(parQui, 'corbeille.mise', table, id, { titre, idCorbeille, dependants: resume });
  return { ok: true, idCorbeille, titre, resume };
}

/** Remet en place une entrée de la corbeille, avec tout ce qui en dépend, ou rien. */
export async function restaurerDepuisCorbeille(
  service: SupabaseClient,
  idEntree: string,
  parQui: string,
): Promise<ResultatRestauration> {
  const { data, error } = await service.rpc('corbeille_restaurer', { p_entree: idEntree });
  if (error) {
    const lue = lireErreur(error);
    const resultat = echecRestauration(lue);
    if (resultat.inattendu) signaler('corbeille-restauration', lue, { idEntree });
    return resultat;
  }
  const reponse = objet(data);
  const table = reponse.table;
  if (!estTableCorbeille(table)) {
    signaler('corbeille-restauration', null, { idEntree, reponse: typeof data });
    return {
      ok: false,
      statut: 500,
      inattendu: true,
      motif: typographieFr('Le contenu est revenu, mais la réponse de la base est illisible. Rechargez la page.'),
    };
  }
  const titre = texte(reponse.titre) ?? 'Sans titre';
  const idOrigine = texte(reponse.id_origine) ?? '';
  revalider(table, texte(reponse.slug));
  await journaliser(parQui, 'corbeille.restauration', table, idOrigine, { titre, idCorbeille: idEntree });
  return {
    ok: true,
    table,
    titre,
    message: messageRestauration(titre, compteurs(reponse.remis)),
    remarques: remarquesEnFrancais(reponse.remarques, titre, table),
  };
}

/**
 * Vide une entrée : le contenu et ce qui l'accompagnait sont perdus pour de
 * bon. D'où la trace au journal : qui a vidé quoi, et quand.
 */
export async function supprimerDefinitivement(
  service: SupabaseClient,
  idEntree: string,
  parQui: string,
): Promise<{ ok: true } | Echec> {
  const { data, error } = await service
    .from('contenus_supprimes')
    .delete()
    .eq('id', idEntree)
    .select('table_origine, id_origine, titre');
  if (error) {
    const lue = lireErreur(error);
    if (lue.code === null) {
      return {
        ok: false,
        statut: 503,
        inattendu: false,
        motif: typographieFr(
          'La réponse de la base de données s’est perdue : l’élément a peut-être été supprimé. Rechargez la corbeille pour le vérifier.',
        ),
      };
    }
    if (corbeilleAbsente(lue)) {
      return {
        ok: false,
        statut: 503,
        inattendu: false,
        motif: typographieFr('La corbeille n’est pas encore installée sur la base de données (migration 00032).'),
      };
    }
    signaler('corbeille-suppression-definitive', lue, { idEntree });
    return {
      ok: false,
      statut: 500,
      inattendu: true,
      motif: typographieFr('La suppression définitive a échoué : l’élément est toujours dans la corbeille.'),
    };
  }
  const supprimee = objet(Array.isArray(data) ? data[0] : null);
  if (!texte(supprimee.table_origine)) {
    return {
      ok: false,
      statut: 404,
      inattendu: false,
      motif: typographieFr('Cet élément n’est plus dans la corbeille : il a peut-être déjà été remis en place, ou supprimé définitivement.'),
    };
  }
  await journaliser(
    parQui,
    'corbeille.suppression_definitive',
    String(supprimee.table_origine),
    String(supprimee.id_origine ?? ''),
    { titre: supprimee.titre ?? null, idCorbeille: idEntree },
  );
  return { ok: true };
}

/** Au-delà, l'écran dit combien d'entrées il ne montre pas. */
export const LIMITE_LISTE = 200;

/** Les entrées, les plus récentes d'abord, sans leur contenu : un article premium retiré ne circule pas. */
export async function listerLaCorbeille(service: SupabaseClient): Promise<ResultatListe> {
  const { data, error, count } = await service
    .from('contenus_supprimes')
    .select('id, table_origine, id_origine, titre, supprime_le, resume_dependants', { count: 'exact' })
    .order('supprime_le', { ascending: false })
    .limit(LIMITE_LISTE);
  if (error) {
    const lue = lireErreur(error);
    if (corbeilleAbsente(lue)) {
      return {
        ok: false,
        statut: 503,
        inattendu: false,
        motif: typographieFr('La corbeille n’est pas encore installée sur la base de données (migration 00032).'),
      };
    }
    signaler('corbeille-liste', lue);
    return { ok: false, statut: 500, inattendu: true, motif: typographieFr('La corbeille n’a pas pu être lue.') };
  }
  const entrees = ((data ?? []) as unknown[]).map((ligne): EntreeListee => {
    const l = objet(ligne);
    return {
      id: String(l.id ?? ''),
      table_origine: String(l.table_origine ?? ''),
      id_origine: String(l.id_origine ?? ''),
      titre: texte(l.titre) ?? 'Sans titre',
      supprime_le: String(l.supprime_le ?? ''),
      resume_dependants: compteurs(l.resume_dependants),
    };
  });
  return { ok: true, entrees, total: typeof count === 'number' ? count : entrees.length };
}

/**
 * Un lecteur supprime son compte : ses lignes quittent aussi la corbeille, en
 * une instruction SQL. Sans cela, sa progression y survivrait au compte, alors
 * que le message qu'il reçoit lui assure que tout a été effacé.
 */
export async function retirerLecteurDeLaCorbeille(
  service: SupabaseClient,
  lecteur: string,
): Promise<{ ok: boolean; entrees: number }> {
  if (!isValidUUID(lecteur)) return { ok: true, entrees: 0 };
  const { data, error } = await service.rpc('corbeille_retirer_lecteur', { p_user: lecteur });
  if (error) {
    const lue = lireErreur(error);
    // Corbeille pas encore installée : il n'y a aucune copie à retirer.
    if (corbeilleAbsente(lue)) return { ok: true, entrees: 0 };
    signaler('corbeille-retrait-lecteur', lue);
    return { ok: false, entrees: 0 };
  }
  const entrees = objet(data).entrees;
  return { ok: true, entrees: typeof entrees === 'number' ? entrees : 0 };
}

/**
 * Supprime pour de bon les entrées de plus de trente jours, et les lignes des
 * lecteurs dont le compte n'existe plus. Appelée chaque nuit par la tâche
 * planifiée des abonnements, et à chaque ouverture de la corbeille. Ne lève
 * jamais : une purge en panne ne doit bloquer ni la liste ni la tâche.
 *
 * Le journal du serveur garde ce qui est parti : type de contenu,
 * identifiant, date de mise à la corbeille, nombre de lignes liées. Ni titre
 * ni contenu : aucune donnée de personne.
 */
export async function purgerLaCorbeille(
  service: SupabaseClient,
  origine: 'tache-planifiee' | 'liste',
): Promise<{ ok: boolean; purgees: number; lecteursRetires: number }> {
  const { data, error } = await service.rpc('corbeille_purger', { p_jours: DUREE_CONSERVATION_JOURS });
  if (error) {
    const lue = lireErreur(error);
    if (!corbeilleAbsente(lue)) signaler('corbeille-purge', lue, { origine });
    return { ok: corbeilleAbsente(lue), purgees: 0, lecteursRetires: 0 };
  }
  const reponse = objet(data);
  const purgees = Array.isArray(reponse.purgees) ? reponse.purgees : [];
  const lecteursRetires = typeof reponse.lecteurs_retires === 'number' ? reponse.lecteurs_retires : 0;
  if (origine === 'tache-planifiee' || purgees.length > 0 || lecteursRetires > 0) {
    console.info(
      '[corbeille] purge',
      JSON.stringify({
        origine,
        duree_jours: DUREE_CONSERVATION_JOURS,
        entrees_supprimees: purgees.length,
        lecteurs_retires: lecteursRetires,
        detail: purgees.map((p) => {
          const e = objet(p);
          return { table: e.table, id_origine: e.id_origine, supprime_le: e.supprime_le, dependants: e.dependants };
        }),
      }),
    );
  }
  return { ok: true, purgees: purgees.length, lecteursRetires };
}
