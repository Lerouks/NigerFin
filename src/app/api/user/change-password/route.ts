import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { sendTransactionalEmail } from '@/lib/email';
import { passwordChangedEmail } from '@/lib/email-templates';
import { applyOverridesTo } from '@/lib/emails/overrides';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import * as Sentry from '@sentry/nextjs';
import { createServiceClient } from '@/lib/supabase';
import { erreurMotDePasse } from '@/lib/mot-de-passe';
import { connexionDuCompte } from '@/lib/compte';

/**
 * Un compte sans mot de passe (ouvert avec Google) en crée un sans « mot de
 * passe actuel », qu'il n'a pas. Pour qu'une session volée ne suffise pas, la
 * connexion doit dater de moins de 15 minutes : sinon, on demande de se
 * reconnecter avec Google d'abord.
 */
const CREATION_FENETRE_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Configuration manquante.' }, { status: 500 });
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll() {},
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  // Rate limiting: 5 attempts per 15 minutes
  const rl = await checkRateLimit(
    `change-password:${user.id}`,
    5,
    15 * 60 * 1000,
  );
  if (rl.limited) {
    await logAuditEvent(user.id, 'password_change_rate_limited', 'user', user.id);
    return NextResponse.json({
      error: 'Trop de tentatives. Réessayez dans 15 minutes.',
    }, { status: 429 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;

  if (typeof newPassword !== 'string' || !newPassword) {
    return NextResponse.json({ error: 'Tous les champs sont requis.' }, { status: 400 });
  }

  // Server-side password strength validation
  const strengthErr = erreurMotDePasse(newPassword);
  if (strengthErr) {
    return NextResponse.json({ error: strengthErr }, { status: 400 });
  }

  // Création d'un premier mot de passe (compte Google).
  if (!connexionDuCompte(user).motDePasse) {
    const derniere = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
    if (!derniere || Date.now() - derniere > CREATION_FENETRE_MS) {
      return NextResponse.json({
        error: 'Par sécurité, reconnectez-vous avec Google, puis créez votre mot de passe dans le quart d’heure.',
        reconnexion: true,
      }, { status: 403 });
    }
    const service = createServiceClient();
    if (!service) return NextResponse.json({ error: 'Service indisponible.' }, { status: 503 });
    const { error: creationErr } = await service.auth.admin.updateUserById(user.id, {
      password: newPassword,
      app_metadata: { ...user.app_metadata, mot_de_passe_cree: true },
    });
    if (creationErr) {
      await logAuditEvent(user.id, 'password_create_failed', 'user', user.id, { error: creationErr.message });
      return NextResponse.json({ error: 'Erreur lors de la création. Veuillez réessayer.' }, { status: 500 });
    }
    await logAuditEvent(user.id, 'password_created', 'user', user.id);
    try {
      const fullName = user.user_metadata?.full_name || user.email.split('@')[0];
      const template = await applyOverridesTo('password_changed', passwordChangedEmail(fullName));
      await sendTransactionalEmail({ to: user.email, ...template, emailType: 'password_changed', userId: user.id });
    } catch (err) {
      Sentry.captureException(err, { tags: { context: 'password-created-email' } });
    }
    return NextResponse.json({ message: 'Votre mot de passe est créé\u00A0: vous pouvez aussi vous connecter avec votre adresse e-mail.' });
  }

  if (typeof currentPassword !== 'string' || !currentPassword) {
    return NextResponse.json({ error: 'Tous les champs sont requis.' }, { status: 400 });
  }

  // Check new password is different from current
  if (currentPassword === newPassword) {
    return NextResponse.json({ error: 'Le nouveau mot de passe doit être différent de l\'ancien.' }, { status: 400 });
  }

  // Verify current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    await logAuditEvent(user.id, 'password_change_wrong_current', 'user', user.id);
    return NextResponse.json({ error: 'Le mot de passe actuel est incorrect.' }, { status: 400 });
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    await logAuditEvent(user.id, 'password_change_failed', 'user', user.id, { error: updateError.message });
    return NextResponse.json({ error: 'Erreur lors de la mise à jour. Veuillez réessayer.' }, { status: 500 });
  }

  // Sec H-8 : invalide les sessions sur les autres appareils. La session courante
  // (celle qui a fait le changement de mot de passe) reste valide pour eviter de
  // forcer l'utilisateur a se reconnecter immediatement apres son changement.
  // En cas d'erreur, on log mais on n'echoue pas : le mot de passe est deja change.
  const { error: signOutError } = await supabase.auth.signOut({ scope: 'others' });
  if (signOutError) {
    Sentry.captureException(signOutError, {
      tags: { context: 'password-change-signout-others' },
      extra: { userId: user.id },
    });
  }

  // Audit log success
  await logAuditEvent(user.id, 'password_changed', 'user', user.id);

  // Send confirmation email
  try {
    const fullName = user.user_metadata?.full_name || user.email.split('@')[0];
    const template = await applyOverridesTo('password_changed', passwordChangedEmail(fullName));
    await sendTransactionalEmail({ to: user.email, ...template, emailType: 'password_changed', userId: user.id });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'password-changed-email' } });
  }

  return NextResponse.json({ message: 'Votre mot de passe a été mis à jour avec succès.' });
}
