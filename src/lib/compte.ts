/**
 * Ce que « Mon compte » affiche, calculé sans réseau ni React pour être testé :
 * l'état de l'abonnement, les montants et les dates à la française.
 *
 * Typographie : espace fine insécable (U+202F) entre les milliers, espace
 * insécable (U+00A0) avant « FCFA » et à l'intérieur d'une date, pour qu'un
 * montant ou une date ne se coupe jamais en fin de ligne.
 */

import type { User } from '@supabase/supabase-js';
import type { EtatNewsletterCompte } from '@/lib/newsletter/compte';

const FINE = '\u202F';
const INSECABLE = '\u00A0';
const JOUR_MS = 86_400_000;

/** « 50 000 FCFA », jamais coupé. */
export function montantFcfa(montant: number): string {
  const entier = Math.round(montant).toString().replace(/\B(?=(\d{3})+(?!\d))/g, FINE);
  return `${entier}${INSECABLE}FCFA`;
}

/** « 10 mars 2027 » à l'heure de Niamey, « 1er » pour le premier du mois, null si la date manque. */
export function dateFr(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const texte = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Niamey' });
  return texte.replace(/^1 /, '1er ').replace(/ /g, INSECABLE);
}

/** Jours restants jusqu'à la fin, arrondis au jour supérieur ; 0 si c'est passé, null si inconnu. */
export function joursRestants(finIso: string | null | undefined, maintenant: number): number | null {
  if (!finIso) return null;
  const fin = new Date(finIso).getTime();
  if (Number.isNaN(fin)) return null;
  const reste = fin - maintenant;
  return reste > 0 ? Math.ceil(reste / JOUR_MS) : 0;
}

/**
 * « +227 90 00 00 00 » : un numéro du Niger se lit par paires, soudées par des
 * espaces insécables. Les autres pays ont leurs propres découpages : leur numéro
 * reste tel qu'il a été saisi.
 */
export function telephoneLisible(numero: string): string {
  const net = numero.replace(/\s+/g, '');
  const m = /^(\+227)(\d{8})$/.exec(net);
  if (!m) return numero;
  return [m[1], ...m[2]!.match(/\d{2}/g)!].join(INSECABLE);
}

/** « Formule annuelle » pour un cycle de facturation, « Premium » s'il est inconnu. */
export function nomDeFormule(cycle: string | null | undefined): string {
  switch (cycle) {
    case 'monthly': return 'Formule mensuelle';
    case 'quarterly': return 'Formule trimestrielle';
    case 'yearly': return 'Formule annuelle';
    default: return 'Premium';
  }
}

/** « un an » pour une ligne de facture, chaîne vide si le cycle est inconnu. */
export function dureeDeFormule(cycle: string | null | undefined): string {
  switch (cycle) {
    case 'monthly': return 'un mois';
    case 'quarterly': return 'trois mois';
    case 'yearly': return 'un an';
    default: return '';
  }
}

export interface AbonnementLu {
  status: string;
  billing_cycle: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  price_amount: number | null;
}

export interface ProfilLu {
  civility?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  subscription_start?: string | null;
  subscription_end?: string | null;
  billing_cycle?: string | null;
}

export type EtatAbonnement =
  | { type: 'admin' }
  | {
      type: 'premium';
      formule: string;
      montant: string | null;
      fin: string | null;
      /** La fin brute, pour le conseil de renouvellement. */
      finIso: string | null;
      jours: number | null;
      /** Part du temps qui reste, de 0 à 1, null si la durée est inconnue. */
      partRestante: number | null;
      /** Sept jours ou moins : on propose de renouveler, les jours restants s'ajoutent (periodePayee). */
      bientotFini: boolean;
    }
  | { type: 'lecteur'; ancienneFin: string | null };

/**
 * L'état à afficher. Premium se juge sur le rôle, comme partout sur le site
 * (access-control) ; les dates viennent du profil, mis à jour à chaque
 * paiement, puis de la ligne d'abonnement.
 */
export function etatAbonnement(entree: {
  role: string | null | undefined;
  abonnement: AbonnementLu | null;
  profil: ProfilLu | null;
  maintenant: number;
}): EtatAbonnement {
  const { role, abonnement, profil, maintenant } = entree;
  if (role === 'admin') return { type: 'admin' };
  if (role === 'premium') {
    const finIso = profil?.subscription_end || abonnement?.current_period_end || null;
    const debutIso = abonnement?.current_period_start || profil?.subscription_start || null;
    const jours = joursRestants(finIso, maintenant);
    const debut = debutIso ? new Date(debutIso).getTime() : NaN;
    const fin = finIso ? new Date(finIso).getTime() : NaN;
    const duree = fin - debut;
    const partRestante = Number.isFinite(duree) && duree > 0 && jours !== null
      ? Math.min(1, Math.max(0, (fin - maintenant) / duree))
      : null;
    const montant = abonnement?.price_amount && abonnement.price_amount > 0 ? montantFcfa(abonnement.price_amount) : null;
    return {
      type: 'premium',
      formule: nomDeFormule(abonnement?.billing_cycle ?? profil?.billing_cycle),
      montant,
      fin: dateFr(finIso),
      finIso,
      jours,
      partRestante,
      bientotFini: jours !== null && jours <= 7,
    };
  }
  const ancienneFin = abonnement && abonnement.status !== 'active' ? dateFr(abonnement.current_period_end) : null;
  return { type: 'lecteur', ancienneFin };
}

/** « Bonjour M. Barkiré, », sinon le prénom, sinon « Bonjour, ». */
export function salutation(profil: ProfilLu | null): string {
  const civilite = profil?.civility?.trim();
  const nom = profil?.last_name?.trim();
  const prenom = profil?.first_name?.trim();
  if (civilite && nom) return `Bonjour ${civilite}${INSECABLE}${nom},`;
  if (prenom) return `Bonjour ${prenom},`;
  if (nom) return `Bonjour ${nom},`;
  return 'Bonjour,';
}

/** « M. Raouf Barkiré », la civilité soudée au prénom. */
export function nomComplet(profil: ProfilLu | null): string | null {
  const morceaux = [profil?.first_name?.trim(), profil?.last_name?.trim()].filter(Boolean).join(' ');
  if (!morceaux) return null;
  const civilite = profil?.civility?.trim();
  return civilite ? `${civilite}${INSECABLE}${morceaux}` : morceaux;
}

/**
 * Ce que « Mon compte » affiche en plus du profil : l'abonnement, les
 * factures, la façon de se connecter et l'abonnement à la newsletter.
 */

export interface FactureDuCompte {
  id: string;
  invoice_number: string;
  amount_xof: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  billing_cycle: string | null;
  pdf: boolean;
}

export interface ConnexionDuCompte {
  /** Le compte a un mot de passe (inscription par e-mail, ou mot de passe créé depuis « Mon compte »). */
  motDePasse: boolean;
  google: boolean;
}

export interface ResumeDuCompte {
  subscription: {
    tier: string;
    status: string;
    billing_cycle: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    price_amount: number | null;
  } | null;
  /** null quand la lecture a échoué : la page le dit au lieu d'afficher « aucune facture ». */
  invoices: FactureDuCompte[] | null;
  connexion: ConnexionDuCompte;
  /** null quand l'adresse du compte n'est pas confirmée ou que la lecture a échoué. */
  newsletter: EtatNewsletterCompte | null;
}

export function connexionDuCompte(user: { identities?: User['identities']; app_metadata?: User['app_metadata'] }): ConnexionDuCompte {
  const fournisseurs = (user.identities ?? []).map((i) => i.provider);
  return {
    motDePasse: fournisseurs.includes('email') || user.app_metadata?.mot_de_passe_cree === true,
    google: fournisseurs.includes('google'),
  };
}
