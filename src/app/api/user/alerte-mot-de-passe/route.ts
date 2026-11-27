import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServerSupabaseClient } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendTransactionalEmail } from '@/lib/email';
import { passwordChangedEmail } from '@/lib/email-templates';
import { applyOverridesTo } from '@/lib/emails/overrides';
import { logAuditEvent } from '@/lib/audit';

/**
 * L'alerte « mot de passe changé » après un nouveau mot de passe choisi depuis
 * le lien « mot de passe oublié » (/connexion/nouveau-mot-de-passe), comme
 * celle que « Mon compte » envoie déjà (/api/user/change-password). Si le
 * lecteur n'y est pour rien, il sait que quelqu'un a pris son compte.
 */
export async function POST() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const rl = await checkRateLimit(`alerte-mot-de-passe:${user.id}`, 3, 60 * 60 * 1000);
  if (rl.limited) return NextResponse.json({ ok: true });

  try {
    const nom = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : user.email.split('@')[0];
    const modele = await applyOverridesTo('password_changed', passwordChangedEmail(nom || 'Client'));
    await sendTransactionalEmail({ to: user.email, ...modele, emailType: 'password_changed', userId: user.id });
    await logAuditEvent(user.id, 'password_reset_done', 'user', user.id);
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'alerte-mot-de-passe' }, extra: { userId: user.id } });
  }
  return NextResponse.json({ ok: true });
}
