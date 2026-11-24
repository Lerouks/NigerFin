import * as Sentry from '@sentry/nextjs';
import { createServiceClient } from '@/lib/supabase';
import { normalizeEmail } from '@/lib/validation';
import { recoitLaNewsletter, unsubscribeBy, upsertNewsletterSubscriber } from '@/lib/newsletter/subscribers';

/**
 * L'interrupteur « Recevoir la newsletter » de « Mon compte ». Il lit et
 * change la vraie source de vérité, newsletter_subscribers, par l'adresse
 * confirmée du compte. Il remplace les cinq préférences d'avant
 * (newsletter_preferences), que l'envoi ne lisait pas.
 *
 * Une adresse de la seule liste d'attente ne reçoit pas la newsletter et ne
 * quitte jamais la liste d'attente (décisions de Raouf du 23/11/2026) :
 * couper l'interrupteur ne la touche pas, l'allumer l'abonne vraiment.
 */

/** Source enregistrée pour un abonnement pris depuis « Mon compte ». */
export const SOURCE_COMPTE = 'compte';

export interface EtatNewsletterCompte {
  /** L'adresse reçoit la newsletter. */
  recoit: boolean;
  /** L'adresse a rebondi ou nous a classés en indésirable : on ne la réabonne pas d'ici. */
  bloquee: boolean;
}

interface LigneAbonne {
  id: string;
  status: string;
  source: string | null;
}

export function etatDepuisLigne(ligne: LigneAbonne | null): EtatNewsletterCompte {
  if (!ligne) return { recoit: false, bloquee: false };
  return {
    recoit: ligne.status === 'active' && recoitLaNewsletter(ligne.source),
    bloquee: ligne.status === 'bounced' || ligne.status === 'complained',
  };
}

async function lireLigne(email: string): Promise<LigneAbonne | null> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Supabase service client unavailable');
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('id, status, source')
    .eq('email', normalizeEmail(email))
    .maybeSingle();
  if (error) throw new Error(`Failed to lookup subscriber: ${error.message}`);
  return (data as LigneAbonne | null) ?? null;
}

export async function etatNewsletterDuCompte(email: string): Promise<EtatNewsletterCompte> {
  return etatDepuisLigne(await lireLigne(email));
}

export interface ResultatChangement {
  etat: EtatNewsletterCompte;
  /** Id de la ligne quand l'abonnement vient d'être pris ou repris : le mail de bienvenue part alors. */
  bienvenuePour: string | null;
}

export async function changerNewsletterDuCompte(entree: {
  email: string;
  userId: string;
  recevoir: boolean;
}): Promise<ResultatChangement> {
  const email = normalizeEmail(entree.email);
  if (entree.recevoir) {
    const resultat = await upsertNewsletterSubscriber({ email, source: SOURCE_COMPTE, userId: entree.userId });
    const etat = await etatNewsletterDuCompte(email);
    const supabase = createServiceClient();
    if (etat.recoit && supabase) {
      // Le drapeau du profil suit l'abonnement (le formulaire de l'accueil le lit).
      // Un échec ne défait pas l'abonnement : il est signalé, sans l'adresse.
      const { error } = await supabase
        .from('user_profiles')
        .update({ newsletter_subscribed: true, updated_at: new Date().toISOString() })
        .eq('id', entree.userId);
      if (error) {
        Sentry.captureException(new Error('compte: drapeau newsletter du profil non mis à jour'), {
          tags: { context: 'compte-newsletter-drapeau' },
          extra: { userId: entree.userId, code: error.code },
        });
      }
    }
    return { etat, bienvenuePour: etat.recoit && (resultat.isNew || resultat.reactivated) ? resultat.id : null };
  }

  const ligne = await lireLigne(email);
  if (ligne && ligne.status === 'active' && recoitLaNewsletter(ligne.source)) {
    // Désabonne et remet le drapeau du profil à faux.
    await unsubscribeBy('email', email);
  }
  return { etat: await etatNewsletterDuCompte(email), bienvenuePour: null };
}
