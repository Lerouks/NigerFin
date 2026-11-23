import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { safeNextPath } from '@/lib/validation';
import { googleDisponible } from '@/lib/auth/google-disponible';
import {
  CHEMIN_COOKIE_GOOGLE,
  CHEMIN_RETOUR_GOOGLE,
  COOKIE_GOOGLE,
  GOOGLE_AUTORISATION,
  empreinteSha256,
  encoderEtat,
  identifiantsGoogle,
  jetonAleatoire,
} from '@/lib/auth/google';

export const dynamic = 'force-dynamic';

/**
 * Départ de la connexion avec Google (bouton « Continuer avec Google »).
 * Envoie le lecteur chez Google, qui le renverra sur /api/auth/google/retour.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const identifiants = identifiantsGoogle();

  if (!identifiants || !(await googleDisponible())) {
    if (!identifiants) {
      Sentry.captureMessage('Connexion Google demandée sans identifiants Google', {
        level: 'warning',
        tags: { context: 'auth-google' },
      });
    }
    return NextResponse.redirect(`${origin}/connexion`);
  }

  const etat = jetonAleatoire();
  const nonce = jetonAleatoire();
  const suite = safeNextPath(searchParams.get('next'));

  const adresse = new URL(GOOGLE_AUTORISATION);
  adresse.search = new URLSearchParams({
    client_id: identifiants.clientId,
    redirect_uri: `${origin}${CHEMIN_RETOUR_GOOGLE}`,
    response_type: 'code',
    scope: 'openid email profile',
    state: etat,
    nonce: await empreinteSha256(nonce),
    prompt: 'select_account',
    hl: 'fr',
  }).toString();

  const reponse = NextResponse.redirect(adresse.toString());
  reponse.cookies.set(COOKIE_GOOGLE, encoderEtat({ etat, nonce, suite }), {
    httpOnly: true,
    secure: origin.startsWith('https://'),
    sameSite: 'lax',
    path: CHEMIN_COOKIE_GOOGLE,
    maxAge: 600,
  });
  reponse.headers.set('Cache-Control', 'no-store, max-age=0');
  return reponse;
}
