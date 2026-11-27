import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { createServerSupabaseClient } from '@/lib/supabase';
import { parseJsonBody, isValidEmail, normalizeEmail } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { connexionDuCompte } from '@/lib/compte';
import { motDePasseCorrect } from '@/lib/auth/verifier-mot-de-passe';

/**
 * Changer soi-même d'adresse e-mail depuis « Mon compte » (décision de Raouf,
 * 27/11/2026), au lieu d'« écrivez-nous ».
 *
 * Le mot de passe actuel est exigé. Supabase envoie ensuite un mail de
 * confirmation à l'ancienne ET à la nouvelle adresse (réglage « secure email
 * change ») : le changement ne se fait qu'une fois les deux liens cliqués. Le
 * profil et l'abonnement à la newsletter suivent alors la nouvelle adresse
 * (déclencheur on_auth_user_email_changed, migration 00036).
 *
 * Un compte ouvert avec Google, sans mot de passe, doit d'abord en créer un.
 */
const Corps = z.object({
  email: z.string().trim().max(254),
  currentPassword: z.string().min(1).max(256),
});

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Service indisponible.' }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const rl = await checkRateLimit(`change-email:${user.id}`, 5, 15 * 60 * 1000);
  if (rl.limited) return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' }, { status: 429 });

  const corps = await parseJsonBody(request, Corps);
  if (!corps.ok) return NextResponse.json({ error: 'Indiquez la nouvelle adresse et votre mot de passe.' }, { status: 400 });

  const nouvelle = normalizeEmail(corps.data.email);
  if (!isValidEmail(nouvelle)) return NextResponse.json({ error: 'Entrez une adresse e-mail valide.' }, { status: 400 });
  if (nouvelle === normalizeEmail(user.email)) return NextResponse.json({ error: 'C’est déjà votre adresse.' }, { status: 400 });

  if (!connexionDuCompte(user).motDePasse) {
    return NextResponse.json({ error: 'Créez d’abord un mot de passe, puis changez d’adresse.' }, { status: 403 });
  }
  if (!(await motDePasseCorrect(user.email, corps.data.currentPassword))) {
    await logAuditEvent(user.id, 'email_change_wrong_password', 'user', user.id);
    return NextResponse.json({ error: 'Le mot de passe est incorrect.' }, { status: 400 });
  }

  const origine = new URL(request.url).origin;
  const { error } = await supabase.auth.updateUser(
    { email: nouvelle },
    { emailRedirectTo: `${origine}/api/auth/callback?next=${encodeURIComponent('/compte#securite')}` },
  );
  if (error) {
    if (error.code === 'email_exists' || /already been registered|already exists/i.test(error.message)) {
      return NextResponse.json({ error: 'Cette adresse est déjà celle d’un autre compte.' }, { status: 409 });
    }
    if (error.code === 'over_email_send_rate_limit' || error.status === 429) {
      return NextResponse.json({ error: 'Un mail vient de partir. Attendez une minute, puis réessayez.' }, { status: 429 });
    }
    Sentry.captureException(new Error('change-email: Supabase a refusé le changement'), {
      tags: { context: 'change-email' },
      extra: { userId: user.id, code: error.code ?? null },
    });
    return NextResponse.json({ error: 'Le changement n’a pas pu être demandé. Réessayez.' }, { status: 500 });
  }

  await logAuditEvent(user.id, 'email_change_requested', 'user', user.id);
  return NextResponse.json({
    message: 'Deux mails sont partis, vers votre adresse actuelle et vers la nouvelle. L’adresse change quand vous aurez cliqué sur les deux liens.',
  });
}
