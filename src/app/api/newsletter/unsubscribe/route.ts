import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { unsubscribeBy } from '@/lib/newsletter/subscribers';
import {
  CHEMIN_DESABONNEMENT,
  COOKIE_DESABONNEMENT,
  DUREE_COOKIE_DESABONNEMENT_S,
  estJetonEssai,
  estJetonValide,
  jetonUtilisable,
} from '@/lib/newsletter/desabonnement';

/**
 * GET /api/newsletter/unsubscribe?token=...
 * Lien « Se désabonner de la newsletter » du pied des mails. Il ne désabonne
 * PAS : il pose le jeton dans un cookie et mène à la page qui demande de
 * confirmer (voir src/lib/newsletter/desabonnement.ts). Des antivirus et des
 * messageries d'entreprise ouvrent seuls les liens des mails ; un
 * désabonnement au simple chargement ferait partir des lecteurs qui n'ont rien
 * demandé. Public par conception : le jeton sert de clé, comme un lien magique.
 *
 * La redirection reste sur l'hôte de la requête, pour que le cookie suive.
 */
export async function GET(req: NextRequest) {
  const jeton = jetonUtilisable(req.nextUrl.searchParams.get('token'));
  const page = new URL(CHEMIN_DESABONNEMENT, req.url);

  if (!jeton) {
    page.searchParams.set('lien', 'invalide');
    const reponse = NextResponse.redirect(page);
    reponse.headers.set('Cache-Control', 'private, no-store');
    return reponse;
  }

  // Lien d'essai : on peut viser directement un moment de la page (« fait »,
  // « reabonne ») pour la contrôler sur tous les écrans. Sans effet pour un
  // vrai jeton, dont la page lit l'état dans la base.
  const apres = req.nextUrl.searchParams.get('apres');
  if (estJetonEssai(jeton) && (apres === 'fait' || apres === 'reabonne')) page.searchParams.set('apres', apres);

  const reponse = NextResponse.redirect(page);
  reponse.cookies.set(COOKIE_DESABONNEMENT, jeton, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: CHEMIN_DESABONNEMENT,
    maxAge: DUREE_COOKIE_DESABONNEMENT_S,
  });
  reponse.headers.set('Cache-Control', 'private, no-store');
  return reponse;
}

/**
 * POST /api/newsletter/unsubscribe?token=...
 * Désabonnement en un clic de la RFC 8058 : c'est le bouton « Se désabonner »
 * que Gmail, Yahoo ou l'iPhone affichent en haut d'un mail de la newsletter.
 * Il agit directement, car ces messageries posent déjà la question dans leur
 * propre fenêtre (et leurs règles d'envoi l'exigent). Elles envoient
 * `List-Unsubscribe=One-Click` dans le corps, mais on accepte tout POST.
 */
export async function POST(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'token requis' }, { status: 400 });
  }
  if (estJetonEssai(token)) {
    return NextResponse.json({ ok: true, demo: true });
  }
  if (!estJetonValide(token)) {
    return NextResponse.json({ error: 'token invalide' }, { status: 400 });
  }
  try {
    const result = await unsubscribeBy('unsubscribe_token', token);
    if (!result.found) {
      return NextResponse.json({ error: 'token introuvable' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, alreadyUnsubscribed: result.alreadyUnsubscribed });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'newsletter-unsubscribe-post' } });
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
