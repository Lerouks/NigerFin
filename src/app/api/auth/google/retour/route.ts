import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import * as Sentry from '@sentry/nextjs';
import { createServiceClient } from '@/lib/supabase';
import { envoyerBienvenueSiNouveau } from '@/lib/auth/bienvenue';
import {
  CHEMIN_COOKIE_GOOGLE,
  CHEMIN_RETOUR_GOOGLE,
  COOKIE_GOOGLE,
  GOOGLE_JETONS,
  decoderEtat,
  identifiantsGoogle,
  lireNoms,
  memesChaines,
} from '@/lib/auth/google';

export const dynamic = 'force-dynamic';

/** Un compte créé il y a moins de deux minutes vient d'être ouvert par cette connexion. */
const NOUVEAU_COMPTE_MS = 2 * 60 * 1000;

type CookieSession = { name: string; value: string; options?: Record<string, unknown> };

function redirection(origin: string, chemin: string, cookiesSession: CookieSession[] = []): NextResponse {
  const reponse = NextResponse.redirect(`${origin}${chemin}`);
  cookiesSession.forEach(({ name, value, options }) => reponse.cookies.set(name, value, options));
  // L'aller-retour est terminé : le cookie de départ ne sert plus.
  reponse.cookies.set(COOKIE_GOOGLE, '', { path: CHEMIN_COOKIE_GOOGLE, maxAge: 0 });
  reponse.headers.set('Cache-Control', 'no-store, max-age=0');
  return reponse;
}

/** Retour de Google après « Continuer avec Google ». */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const echec = () => redirection(origin, '/connexion?erreur=google');

  // Le lecteur a refusé ou fermé la fenêtre de Google : simple retour à la connexion.
  if (searchParams.get('error') === 'access_denied') return redirection(origin, '/connexion');
  if (searchParams.get('error')) return echec();

  const identifiants = identifiantsGoogle();
  const depart = decoderEtat(request.cookies.get(COOKIE_GOOGLE)?.value);
  const code = searchParams.get('code');
  if (!identifiants || !depart || !code || !memesChaines(depart.etat, searchParams.get('state') ?? '')) {
    return echec();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return echec();

  // 1. Le code contre le jeton d'identité de Google.
  let idToken: string | null = null;
  try {
    const r = await fetch(GOOGLE_JETONS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: identifiants.clientId,
        client_secret: identifiants.secret,
        redirect_uri: `${origin}${CHEMIN_RETOUR_GOOGLE}`,
        grant_type: 'authorization_code',
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    const corps = (await r.json().catch(() => null)) as { id_token?: unknown; error?: unknown } | null;
    if (r.ok && typeof corps?.id_token === 'string') {
      idToken = corps.id_token;
    } else {
      Sentry.captureMessage('Google a refusé l’échange du code', {
        level: 'warning',
        tags: { context: 'auth-google' },
        extra: { statut: r.status, erreur: typeof corps?.error === 'string' ? corps.error : null },
      });
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'auth-google-echange' } });
  }
  if (!idToken) return echec();

  // 2. Supabase vérifie le jeton (signature, destinataire, nonce) et ouvre la session.
  const cookiesSession: CookieSession[] = [];
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(aPoser: CookieSession[]) {
        cookiesSession.push(...aPoser);
      },
    },
  });

  let utilisateur: { id: string; email?: string; created_at: string; user_metadata?: Record<string, unknown> } | null = null;
  try {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      nonce: depart.nonce,
    });
    if (error || !data?.user) {
      Sentry.captureMessage('Supabase a refusé la session Google', {
        level: 'warning',
        tags: { context: 'auth-google' },
        extra: { erreur: error?.message ?? null },
      });
    } else {
      utilisateur = data.user;
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'auth-google-session' } });
  }
  if (!utilisateur) return echec();

  // 3. Compte tout juste ouvert : prénom et nom depuis Google, mail de bienvenue,
  //    puis la page « Complétez votre profil », comme après une inscription par e-mail.
  const nouveau = Date.now() - Date.parse(utilisateur.created_at) < NOUVEAU_COMPTE_MS;
  if (nouveau) {
    await completerNoms(utilisateur.id, idToken);
    const nomComplet = typeof utilisateur.user_metadata?.full_name === 'string' ? utilisateur.user_metadata.full_name : undefined;
    await envoyerBienvenueSiNouveau(utilisateur.id, utilisateur.email, nomComplet).catch((err) => {
      Sentry.captureException(err, { tags: { context: 'welcome-email' }, extra: { userId: utilisateur?.id } });
    });
  }

  return redirection(origin, nouveau ? '/inscription/completer-profil' : depart.suite, cookiesSession);
}

/**
 * Le profil est créé par la base (handle_new_user) avec le nom complet donné
 * par Google. On y ajoute le prénom et le nom séparés, comme le fait
 * l'inscription par e-mail, sans écraser ce qui existe déjà.
 */
async function completerNoms(userId: string, idToken: string): Promise<void> {
  const { prenom, nom } = lireNoms(idToken);
  if (!prenom && !nom) return;
  const service = createServiceClient();
  if (!service) return;
  try {
    const { data: profil } = await service
      .from('user_profiles')
      .select('first_name, last_name, full_name')
      .eq('id', userId)
      .single();
    if (!profil) return;
    const maj: Record<string, string> = {};
    if (!profil.first_name && prenom) maj.first_name = prenom;
    if (!profil.last_name && nom) maj.last_name = nom;
    if (!profil.full_name) {
      const complet = [prenom, nom].filter(Boolean).join(' ');
      if (complet) maj.full_name = complet;
    }
    if (Object.keys(maj).length) await service.from('user_profiles').update(maj).eq('id', userId);
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'auth-google-noms' }, extra: { userId } });
  }
}
