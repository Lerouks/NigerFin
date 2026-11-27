import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import { envoyerBienvenueSiNouveau } from '@/lib/auth/bienvenue';
import { changerNewsletterDuCompte } from '@/lib/newsletter/compte';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Juste après la confirmation de l'adresse (code à 6 chiffres, lien du mail ou
 * Google) : le mail de bienvenue, une seule fois, et l'abonnement à la
 * newsletter si la personne a coché la case en s'inscrivant (le choix est
 * gardé dans les données du compte, user_metadata.newsletter).
 *
 * L'abonnement attend la confirmation : une adresse mal tapée ne reçoit rien.
 * Il se fait sans mail de bienvenue de la newsletter, la personne vient de
 * recevoir celui du compte. Le drapeau app_metadata.newsletter_choix_traite
 * empêche de réabonner quelqu'un qui s'est désabonné depuis.
 */
export async function POST() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  if (!user.email || !user.email_confirmed_at) return NextResponse.json({ ok: true });

  const rl = await checkRateLimit(`bienvenue:${user.id}`, 10, 60 * 60 * 1000);
  if (rl.limited) return NextResponse.json({ ok: true });

  const nomComplet = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : undefined;
  try {
    await envoyerBienvenueSiNouveau(user.id, user.email, nomComplet);
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'welcome-email' }, extra: { userId: user.id } });
  }

  if (user.user_metadata?.newsletter === true && user.app_metadata?.newsletter_choix_traite !== true) {
    const service = createServiceClient();
    if (service) {
      try {
        const { data } = await service.auth.admin.getUserById(user.id);
        const appMetadata = data?.user?.app_metadata ?? user.app_metadata;
        if (appMetadata?.newsletter_choix_traite !== true) {
          await service.auth.admin.updateUserById(user.id, {
            app_metadata: { ...appMetadata, newsletter_choix_traite: true },
          });
          await changerNewsletterDuCompte({ email: user.email, userId: user.id, recevoir: true });
        }
      } catch (err) {
        Sentry.captureException(err, { tags: { context: 'inscription-newsletter' }, extra: { userId: user.id } });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
