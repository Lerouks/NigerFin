import { getBillingOption, type BillingCycle } from '@/config/pricing';

/**
 * La période qu'achète un paiement Premium. Le paiement est unique, sans
 * renouvellement automatique : un abonné qui repaie avant la fin de son accès
 * ne doit perdre aucun jour. La durée achetée s'ajoute donc à la fin en cours
 * quand l'accès court encore. Avant ce calcul, la nouvelle fin partait du jour
 * du paiement, et les jours restants disparaissaient.
 *
 * Un accès coupé (expiré, désactivé par l'administration) ne se prolonge pas :
 * la période part alors du paiement.
 */

/** Ce que le profil dit de l'accès Premium au moment du paiement. */
export interface AccesEnCours {
  subscription_status?: string | null;
  subscription_end?: string | null;
}

export interface PeriodePayee {
  /** Début de la période payée : la fin de l'accès en cours s'il court encore, sinon le paiement. */
  debut: Date;
  /** Nouvelle fin d'accès. */
  fin: Date;
  /** Le paiement prolonge un accès qui court encore. */
  prolonge: boolean;
}

export function periodePayee(
  cycle: BillingCycle,
  acces: AccesEnCours | null | undefined,
  maintenant: Date = new Date(),
): PeriodePayee {
  const { durationMonths } = getBillingOption(cycle);
  const finEnCours =
    acces?.subscription_status === 'active' && acces.subscription_end
      ? new Date(acces.subscription_end).getTime()
      : NaN;
  const prolonge = Number.isFinite(finEnCours) && finEnCours > maintenant.getTime();
  const debut = new Date(prolonge ? finEnCours : maintenant.getTime());
  const fin = new Date(debut.getTime());
  fin.setMonth(fin.getMonth() + durationMonths);
  return { debut, fin, prolonge };
}
