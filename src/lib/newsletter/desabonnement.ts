import * as Sentry from '@sentry/nextjs';
import { abonnementParJeton } from '@/lib/newsletter/subscribers';

/**
 * Désabonnement de la newsletter avec confirmation (décision de Raouf,
 * 23/11/2026 : « il faut une confirmation »).
 *
 * Le lien d'un mail ne désabonne jamais à lui seul. Il pose le jeton dans un
 * cookie et mène à /newsletter/desabonnement, qui montre l'adresse concernée et
 * demande de confirmer ; seul l'appui sur « Me désabonner » désabonne. Des
 * antivirus et des messageries d'entreprise ouvrent seuls les liens des mails :
 * un désabonnement au simple chargement ferait partir des lecteurs qui n'ont
 * rien demandé. Le jeton ne reste pas dans l'adresse de la page, pour ne pas
 * finir dans l'historique, les outils de mesure ou un lien partagé.
 *
 * Le bouton « Se désabonner » que Gmail ou l'iPhone affichent eux-mêmes
 * (POST en un clic, RFC 8058) reste direct : ils posent déjà la question dans
 * leur propre fenêtre.
 */

export const COOKIE_DESABONNEMENT = 'nfi_desabonnement';
export const CHEMIN_DESABONNEMENT = '/newsletter/desabonnement';
/** Le temps de confirmer, puis de changer d'avis. */
export const DUREE_COOKIE_DESABONNEMENT_S = 60 * 60;

/** Jetons des mails d'aperçu et d'essai : la page se montre, rien n'est enregistré. */
const JETONS_ESSAI = new Set(['DEMO', 'PREVIEW', 'TEST']);
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Adresse montrée sur les pages d'essai. */
export const ADRESSE_ESSAI = 'lecteur@exemple.com';

export function estJetonEssai(jeton: string | null | undefined): jeton is string {
  return typeof jeton === 'string' && JETONS_ESSAI.has(jeton);
}

export function estJetonValide(jeton: string | null | undefined): jeton is string {
  return typeof jeton === 'string' && RE_UUID.test(jeton);
}

/** Jeton utilisable par la page : un vrai jeton ou un jeton d'essai. */
export function jetonUtilisable(jeton: string | null | undefined): string | null {
  return estJetonEssai(jeton) || estJetonValide(jeton) ? jeton : null;
}

/**
 * Adresse à demi masquée, pour que la personne reconnaisse la sienne sans que
 * la page l'affiche en entier : « amadou.diallo@gmail.com » devient
 * « a•••o@gmail.com ».
 */
export function masquerAdresse(email: string): string {
  const at = email.lastIndexOf('@');
  if (at <= 0) return '•••';
  const nom = email.slice(0, at);
  const domaine = email.slice(at + 1);
  const debut = Array.from(nom);
  const visible = debut.length >= 3 ? `${debut[0]}•••${debut[debut.length - 1]}` : `${debut[0]}•••`;
  return `${visible}@${domaine}`;
}

/** Ce que la page montre. */
export type EtatDesabonnement =
  | { etat: 'question'; adresse: string; essai: boolean }
  | { etat: 'fait'; adresse: string; essai: boolean; reabonnable: boolean }
  | { etat: 'reabonne'; adresse: string; essai: boolean }
  | { etat: 'inactif' }
  | { etat: 'sans-lien' }
  | { etat: 'erreur' };

export interface EntreeEtat {
  /** Jeton lu dans le cookie posé par le lien du mail. */
  jeton: string | null | undefined;
  /** Le lien suivi était incomplet ou mal formé. */
  lienInvalide?: boolean;
  /** Dernière action faite sur la page (« fait » ou « reabonne »). */
  apres?: string;
  /** La dernière action a échoué. */
  erreur?: boolean;
}

/**
 * État de la page. Pour un vrai jeton, il vient de la base et non de
 * l'adresse de la page : on ne peut pas afficher « Désabonnement confirmé »
 * en tapant une adresse, seulement après un vrai désabonnement.
 */
export async function lireEtatDesabonnement({ jeton, lienInvalide, apres, erreur }: EntreeEtat): Promise<EtatDesabonnement> {
  if (erreur) return { etat: 'erreur' };
  if (lienInvalide) return { etat: 'inactif' };
  const utilisable = jetonUtilisable(jeton);
  if (!utilisable) return { etat: 'sans-lien' };

  if (estJetonEssai(utilisable)) {
    const adresse = masquerAdresse(ADRESSE_ESSAI);
    if (apres === 'fait') return { etat: 'fait', adresse, essai: true, reabonnable: true };
    if (apres === 'reabonne') return { etat: 'reabonne', adresse, essai: true };
    return { etat: 'question', adresse, essai: true };
  }

  try {
    const abonnement = await abonnementParJeton(utilisable);
    if (!abonnement) return { etat: 'inactif' };
    const adresse = masquerAdresse(abonnement.email);
    if (abonnement.status === 'active') {
      return apres === 'reabonne'
        ? { etat: 'reabonne', adresse, essai: false }
        : { etat: 'question', adresse, essai: false };
    }
    // Désabonnée elle-même, la personne peut revenir ; une adresse en rebond
    // ou qui nous a classés en indésirable, non.
    return { etat: 'fait', adresse, essai: false, reabonnable: abonnement.status === 'unsubscribed' };
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'newsletter-desabonnement-page' } });
    return { etat: 'erreur' };
  }
}
