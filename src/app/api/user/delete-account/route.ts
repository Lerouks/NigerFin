import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';
import { CompteAvecFactures, deleteUserCompletely } from '@/lib/delete-user';
import { connexionDuCompte } from '@/lib/compte';
import { motDePasseCorrect } from '@/lib/auth/verifier-mot-de-passe';
import { logAuditEvent } from '@/lib/audit';

/**
 * Supprimer son compte. Une session ouverte ne suffit plus (décision de Raouf,
 * 27/11/2026, sur le conseil de l'OWASP : s'identifier à nouveau avant une
 * action grave) : le mot de passe est redemandé ; un compte ouvert avec
 * Google, sans mot de passe, doit s'être connecté il y a moins d'un quart
 * d'heure.
 */
const FENETRE_GOOGLE_MS = 15 * 60 * 1000;

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  // Cinq essais par quart d'heure et par compte : un mot de passe mal tapé ne bloque pas une heure.
  const rl = await checkRateLimit(`delete-account:${user.id}`, 5, 15 * 60 * 1000);
  if (rl.limited) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' }, { status: 429 });
  }

  let motDePasse: string | null = null;
  try {
    const corps = (await request.json()) as { currentPassword?: unknown };
    if (typeof corps?.currentPassword === 'string' && corps.currentPassword) motDePasse = corps.currentPassword;
  } catch {
    // Corps absent : traité comme sans mot de passe.
  }

  if (connexionDuCompte(user).motDePasse) {
    if (!motDePasse || !user.email || !(await motDePasseCorrect(user.email, motDePasse))) {
      await logAuditEvent(user.id, 'account_delete_wrong_password', 'user', user.id);
      return NextResponse.json({ error: 'Le mot de passe est incorrect.' }, { status: 400 });
    }
  } else {
    const derniere = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : 0;
    if (!derniere || Date.now() - derniere > FENETRE_GOOGLE_MS) {
      return NextResponse.json({
        error: 'Par sécurité, reconnectez-vous avec Google, puis supprimez votre compte dans le quart d’heure.',
        reconnexion: true,
      }, { status: 403 });
    }
  }

  const serviceClient = createServiceClient();
  if (!serviceClient) return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });

  // Get profile for name/email
  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('email, full_name, role')
    .eq('id', user.id)
    .single();

  // Un administrateur ne se supprime pas depuis « Mon compte » : il perdrait
  // l'accès au cockpit, et ses actions au journal bloqueraient la suppression.
  if (profile?.role === 'admin') {
    return NextResponse.json(
      { error: 'Un compte administrateur ne se supprime pas depuis cette page.' },
      { status: 403 },
    );
  }

  try {
    await deleteUserCompletely(
      serviceClient,
      user.id,
      profile?.email || user.email || '',
      profile?.full_name || '',
      user.id, // deleted by self
    );
  } catch (err) {
    if (err instanceof CompteAvecFactures) {
      return NextResponse.json({ error: err.message, factures: true }, { status: 409 });
    }
    return NextResponse.json({ error: 'La suppression n’a pas abouti. Écrivez-nous à contact@nfireport.com : nous la terminerons pour vous.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
