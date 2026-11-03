import { guillemets, typographieFr } from '@/lib/typographie-fr';
import {
  compter,
  estTableCorbeille,
  LIBELLE_DEPENDANT,
  listeFr,
  nomDeTable,
  resumerDependants,
  type TableCorbeille,
} from './libelles';

/**
 * Ce que disent les fonctions SQL de la corbeille, en français.
 *
 * Chaque fonction est une transaction : quand la base répond par une erreur
 * portant un code, RIEN n'a été fait, et le message peut l'affirmer. Quand la
 * réponse s'est perdue (aucun code : la connexion a coupé, le délai a expiré),
 * l'opération a pu aboutir comme échouer, et le message le dit au lieu
 * d'affirmer l'un ou l'autre.
 */

export type StatutEchec = 400 | 404 | 409 | 500 | 503;

export interface Echec {
  ok: false;
  statut: StatutEchec;
  motif: string;
  /** Vrai quand l'échec n'était pas prévu : il part vers Sentry. */
  inattendu: boolean;
}

/** Ce que l'appel RPC a rendu, lu sans rien supposer de sa forme. */
export interface ErreurLue {
  /** SQLSTATE ou code PostgREST. Null quand la réponse s'est perdue. */
  code: string | null;
  /** Refus voulu par la corbeille (« slug_pris »), lu dans le message « corbeille:… ». */
  refus: string | null;
  /** Le détail du refus, quand la base en a donné un en JSON. */
  detail: Record<string, unknown>;
  /** Le détail brut (pour Sentry). */
  detailBrut: string | null;
}

function chaine(valeur: unknown): string | null {
  return typeof valeur === 'string' && valeur.trim() ? valeur : null;
}

export function lireErreur(erreur: unknown): ErreurLue {
  const objet = erreur && typeof erreur === 'object' ? (erreur as Record<string, unknown>) : {};
  const code = chaine(objet.code);
  const message = chaine(objet.message) ?? '';
  const detailBrut = chaine(objet.details) ?? chaine(objet.detail);
  let detail: Record<string, unknown> = {};
  if (detailBrut?.startsWith('{')) {
    try {
      const lu: unknown = JSON.parse(detailBrut);
      if (lu && typeof lu === 'object' && !Array.isArray(lu)) detail = lu as Record<string, unknown>;
    } catch {
      // Un détail illisible n'empêche pas de répondre : le message reste juste.
    }
  }
  const refus = message.startsWith('corbeille:') ? message.slice('corbeille:'.length) : null;
  return { code, refus, detail, detailBrut };
}

/** La migration 00032 n'est pas appliquée : ni la table ni les fonctions n'existent. */
export function corbeilleAbsente(lue: ErreurLue): boolean {
  return lue.code === 'PGRST202' || lue.code === 'PGRST205' || lue.code === '42883' || lue.code === '42P01';
}

/** Deux opérations se sont croisées sur les mêmes lignes : réessayer suffit. */
function conflitPassager(lue: ErreurLue): boolean {
  return lue.code === '55P03' || lue.code === '40P01' || lue.code === '40001';
}

function echec(statut: StatutEchec, motif: string, inattendu = false): Echec {
  return { ok: false, statut, motif: typographieFr(motif), inattendu };
}

const PAS_INSTALLEE = 'La corbeille n’est pas encore installée sur la base de données (migration 00032).';

function dateFr(valeur: unknown): string | null {
  const texte = chaine(valeur);
  if (!texte) return null;
  const date = new Date(texte);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Niamey' });
}

/** Pourquoi un contenu n'a pas pu partir à la corbeille. */
export function echecMiseALaCorbeille(lue: ErreurLue): Echec {
  const rien = 'Rien n’a été supprimé.';
  if (lue.code === null) {
    return echec(
      503,
      'La réponse de la base de données s’est perdue : la suppression a peut-être eu lieu. Rechargez la page pour le vérifier avant de recommencer.',
    );
  }
  if (corbeilleAbsente(lue)) return echec(503, `${PAS_INSTALLEE} ${rien}`);
  if (conflitPassager(lue)) {
    return echec(409, `Ce contenu est en cours de modification ailleurs : ${rien.toLowerCase()} Réessayez dans un instant.`);
  }
  switch (lue.refus) {
    case 'introuvable':
      return echec(404, 'Ce contenu est introuvable : il a peut-être déjà été supprimé.');
    case 'deja_dans_la_corbeille':
      return echec(409, 'Ce contenu est déjà dans la corbeille : rien de plus n’a été supprimé.');
    case 'copie_existante': {
      const depuis = dateFr(lue.detail.supprime_le);
      return echec(
        409,
        `Une copie plus ancienne de ce contenu est déjà dans la corbeille${depuis ? `, depuis le ${depuis}` : ''} : ${rien.toLowerCase()} La corbeille ne garde qu’une copie par contenu.`,
      );
    }
    case 'numero_envoye':
      return echec(400, 'Impossible de supprimer un numéro déjà envoyé.');
    case 'envoi_en_cours':
      return echec(409, 'Ce numéro est en cours d’envoi : il ne peut pas être supprimé avant la fin de l’envoi.');
    case 'cascade_inconnue':
      return echec(
        500,
        `${rien} La base de données effacerait avec ce contenu d’autres données, que la corbeille ne sait pas encore garder : la suppression reste bloquée jusqu’à sa mise à jour.`,
        true,
      );
    case 'declencheur_inconnu':
      return echec(
        500,
        `${rien} Un déclencheur ou une règle de la base effacerait ou modifierait, avec ce contenu, d’autres données que la corbeille ne sait pas encore garder : la suppression reste bloquée jusqu’à sa mise à jour.`,
        true,
      );
    default:
      break;
  }
  if (lue.code === '23503') {
    return echec(409, `La base refuse de supprimer ce contenu : d’autres éléments du site s’y rattachent encore. ${rien}`);
  }
  if (lue.code === '23505') return echec(409, 'Ce contenu est déjà dans la corbeille : rien de plus n’a été supprimé.');
  return echec(500, `La suppression a échoué. ${rien}`, true);
}

const CHEMIN_PUBLIC: Partial<Record<TableCorbeille, string>> = {
  articles: '/articles/',
  education_categories: '/education/',
  strategic_enterprises: '/entreprises/',
};

/** Pourquoi une entrée n'a pas pu être remise en place. */
export function echecRestauration(lue: ErreurLue): Echec {
  const rien = 'Rien n’a été remis en place.';
  if (lue.code === null) {
    return echec(
      503,
      'La réponse de la base de données s’est perdue : la restauration a peut-être eu lieu. Rechargez la corbeille pour le vérifier avant de recommencer.',
    );
  }
  if (corbeilleAbsente(lue)) return echec(503, `${PAS_INSTALLEE} ${rien}`);
  if (conflitPassager(lue)) {
    return echec(409, `Ce contenu est en cours de modification ailleurs : ${rien.toLowerCase()} Réessayez dans un instant.`);
  }

  const titre = guillemets(chaine(lue.detail.titre) ?? 'ce contenu');
  const autre = guillemets(chaine(lue.detail.autre) ?? 'un autre contenu');
  const impossible = `Impossible de remettre ${titre} en place`;
  switch (lue.refus) {
    case 'entree_introuvable':
      return echec(
        404,
        'Cet élément n’est plus dans la corbeille : il a peut-être déjà été remis en place, ou supprimé définitivement.',
      );
    case 'id_pris':
      return echec(409, `${impossible} : un contenu portant le même identifiant est déjà sur le site. ${rien}`);
    case 'categorie_absente': {
      const categorie = chaine(lue.detail.categorie);
      if (lue.detail.categorie_en_corbeille === true && categorie) {
        return echec(
          409,
          `${impossible} : sa catégorie ${guillemets(categorie)} est dans la corbeille. Remettez d’abord la catégorie en place, puis cette leçon.`,
        );
      }
      return echec(409, `${impossible} : sa catégorie n’existe plus, et elle n’est plus dans la corbeille.`);
    }
    case 'slug_pris': {
      const table = estTableCorbeille(lue.detail.table) ? lue.detail.table : null;
      const slug = chaine(lue.detail.slug) ?? '';
      const lien = `${(table && CHEMIN_PUBLIC[table]) ?? '/'}${slug}`;
      return echec(
        409,
        `${impossible} : le lien ${guillemets(lien)} est déjà pris par ${autre}. Libérez-le d’abord, en modifiant ou en supprimant ${autre}, puis recommencez.`,
      );
    }
    case 'numero_pris':
      return echec(
        409,
        `${impossible} : le numéro\u00a0${String(lue.detail.numero ?? '')} est déjà pris par ${autre}, et ce numéro a déjà été envoyé, au moins en partie : il ne peut pas changer de numéro.`,
      );
    // Les deux refus suivants disent que le schéma de la base a changé depuis
    // la suppression : il faut un développeur, d'où le signalement à Sentry.
    case 'colonnes_inconnues': {
      const colonnes = (Array.isArray(lue.detail.colonnes) ? lue.detail.colonnes : [])
        .map(chaine)
        .filter((nom): nom is string => nom !== null);
      const perdues =
        colonnes.length > 1
          ? `les colonnes ${listeFr(colonnes.map(guillemets))}`
          : `la colonne ${guillemets(colonnes[0] ?? 'inconnue')}`;
      return echec(
        409,
        `${impossible} : depuis sa suppression, ${nomDeTable(lue.detail.table_touchee)} a perdu ${perdues}, que sa copie remplit encore. ${rien} L’élément reste dans la corbeille, intact : la table doit d’abord être corrigée.`,
        true,
      );
    }
    case 'remise_incomplete': {
      const attendues = nombre(lue.detail.attendues);
      const ecartees = Math.max(attendues - nombre(lue.detail.remises), 0);
      return echec(
        409,
        `${impossible} : ${nomDeTable(lue.detail.table_touchee)} a écarté sans erreur ${compter(ecartees, LIGNE)} sur ${attendues}. ${rien} L’élément reste dans la corbeille, intact : la table doit d’abord être corrigée.`,
        true,
      );
    }
    default:
      break;
  }
  if (lue.code === '23505') {
    return echec(409, `Un contenu portant le même lien, le même numéro ou le même identifiant vient d’apparaître. ${rien} Réessayez.`);
  }
  if (lue.code === '23503') {
    return echec(409, `Un élément dont ce contenu dépend vient de disparaître. ${rien}`);
  }
  return echec(500, `La restauration a échoué. ${rien}`, true);
}

const LIGNE = { un: 'ligne', plusieurs: 'lignes' };

function nombre(valeur: unknown): number {
  return typeof valeur === 'number' && Number.isFinite(valeur) ? valeur : 0;
}

function verbe(n: number, singulier: string, pluriel: string): string {
  return n > 1 ? pluriel : singulier;
}

/** Une remarque de la base (« numero_change »), en une phrase. Null pour un code inconnu. */
export function remarqueEnFrancais(remarque: unknown, titre: string, table: TableCorbeille): string | null {
  if (!remarque || typeof remarque !== 'object') return null;
  const r = remarque as Record<string, unknown>;
  const nom = guillemets(titre);
  const autre = guillemets(chaine(r.autre) ?? 'un autre contenu');
  const n = nombre(r.nombre);
  switch (r.code) {
    case 'a_la_une_retiree':
      return table === 'strategic_enterprises'
        ? `${nom} revient sans être l’entreprise à la une : ${autre} l’est désormais.`
        : `${nom} revient sans être à la une : ${autre} y est désormais.`;
    case 'programme_en_brouillon':
      return `${nom} revient en brouillon : il était programmé. Reprogrammez-le si vous voulez toujours l’envoyer.`;
    case 'envoi_interrompu_en_brouillon':
      return `${nom} revient en brouillon : son envoi était en cours, une partie des abonnés l’a peut-être déjà reçu. Vérifiez-le avant de l’envoyer de nouveau.`;
    case 'numero_change':
      return `${nom} revient sous le numéro\u00a0${nombre(r.nouveau)} : le numéro\u00a0${nombre(r.ancien)} a été repris entre-temps par ${autre}. Son lien change avec lui.`;
    case 'etapes_ecartees':
      return `${compter(n, LIBELLE_DEPENDANT.learning_path_steps)} ${verbe(n, 'ne revient', 'ne reviennent')} pas : ${verbe(n, 'son parcours a', 'leur parcours a')} été supprimé entre-temps.`;
    case 'progressions_ecartees':
      return `${compter(n, LIBELLE_DEPENDANT.user_lesson_progress)} ${verbe(n, 'ne revient', 'ne reviennent')} pas : ${verbe(n, 'le lecteur concerné a supprimé son', 'les lecteurs concernés ont supprimé leur')} compte entre-temps.`;
    case 'abonnes_vides':
      return `${compter(n, LIBELLE_DEPENDANT.newsletter_events)} ${verbe(n, 'revient sans son', 'reviennent sans leur')} abonné, supprimé entre-temps.`;
    default:
      return null;
  }
}

/** « « Bourse » est de nouveau en place, avec 3 leçons et 12 progressions de lecteurs. » */
export function messageRestauration(titre: string, remis: Record<string, unknown>): string {
  const avec = resumerDependants(remis);
  return typographieFr(`${guillemets(titre)} est de nouveau en place${avec ? `, avec ${avec}` : ''}.`);
}

/** Les remarques connues, en français ; un code inconnu n'est jamais affiché tel quel. */
export function remarquesEnFrancais(remarques: unknown, titre: string, table: TableCorbeille): string[] {
  if (!Array.isArray(remarques)) return [];
  return remarques
    .map((remarque) => remarqueEnFrancais(remarque, titre, table))
    .filter((phrase): phrase is string => phrase !== null)
    .map(typographieFr);
}

