'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';
import { reabonnerParJeton, unsubscribeBy } from '@/lib/newsletter/subscribers';
import {
  CHEMIN_DESABONNEMENT,
  COOKIE_DESABONNEMENT,
  estJetonEssai,
  jetonUtilisable,
} from '@/lib/newsletter/desabonnement';

/** Jeton posé par le lien du mail ; jamais pris dans le formulaire. */
async function jetonDuLien(): Promise<string | null> {
  return jetonUtilisable((await cookies()).get(COOKIE_DESABONNEMENT)?.value);
}

/**
 * « Me désabonner » : la confirmation demandée par Raouf (23/11/2026). Seul
 * cet appui désabonne ; le lien du mail ne fait que mener à la question.
 */
export async function seDesabonner(): Promise<void> {
  const jeton = await jetonDuLien();
  if (!jeton) redirect(CHEMIN_DESABONNEMENT);
  if (estJetonEssai(jeton)) redirect(`${CHEMIN_DESABONNEMENT}?apres=fait`);

  let reussi = true;
  try {
    await unsubscribeBy('unsubscribe_token', jeton);
  } catch (err) {
    reussi = false;
    Sentry.captureException(err, { tags: { context: 'newsletter-desabonnement' } });
  }
  redirect(reussi ? `${CHEMIN_DESABONNEMENT}?apres=fait` : `${CHEMIN_DESABONNEMENT}?erreur=1`);
}

/** « Me réabonner » : pour la personne qui s'est trompée ou change d'avis. */
export async function seReabonner(): Promise<void> {
  const jeton = await jetonDuLien();
  if (!jeton) redirect(CHEMIN_DESABONNEMENT);
  if (estJetonEssai(jeton)) redirect(`${CHEMIN_DESABONNEMENT}?apres=reabonne`);

  let reussi = true;
  try {
    await reabonnerParJeton(jeton);
  } catch (err) {
    reussi = false;
    Sentry.captureException(err, { tags: { context: 'newsletter-reabonnement' } });
  }
  redirect(reussi ? `${CHEMIN_DESABONNEMENT}?apres=reabonne` : `${CHEMIN_DESABONNEMENT}?erreur=1`);
}
