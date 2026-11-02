import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * REDIRECTION APRÈS AUTHENTIFICATION
 *
 * Les liens de confirmation et de connexion portent la page où renvoyer le
 * lecteur (« next »). Ce paramètre vient d'un lien que n'importe qui peut
 * fabriquer : il ne doit jamais pouvoir envoyer le lecteur, tout juste connecté,
 * sur un autre site. Collé derrière l'origine, « @evil.example » donnait
 * https://nfireport.com@evil.example, c'est-à-dire evil.example.
 */

const { verifyOtp, exchangeCodeForSession } = vi.hoisted(() => ({
  verifyOtp: vi.fn(async () => ({ error: null })),
  exchangeCodeForSession: vi.fn(async () => ({ error: null, data: { user: null, session: null } })),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({ auth: { verifyOtp, exchangeCodeForSession } })),
}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ createServiceClient: vi.fn(() => null) }));
vi.mock('@/lib/email', () => ({ sendTransactionalEmail: vi.fn() }));
vi.mock('@/lib/email-templates', () => ({ welcomeSignupEmail: vi.fn() }));
vi.mock('@/lib/emails/overrides', () => ({ applyOverridesTo: vi.fn() }));

import { GET as confirmer } from '@/app/auth/confirm/route';
import { GET as callback } from '@/app/api/auth/callback/route';

const ORIGINE = 'https://nfireport.com';

/** Valeurs de « next » telles qu'elles arrivent dans l'adresse (déjà encodées). */
const PIEGES = [
  '%40evil.example', // @evil.example : https://nfireport.com@evil.example
  '%2F%2Fevil.example', // //evil.example : adresse sans schéma
  '%2F%5Cevil.example', // /\evil.example : le navigateur lit « \ » comme « / »
  '%2F%09%2Fevil.example', // /<tab>/evil.example : la tabulation est retirée
  '%2F%0D%0A%2Fevil.example', // retour à la ligne, retiré lui aussi
  '%0A%2F%2Fevil.example',
  'https%3A%2F%2Fevil.example',
  'javascript%3Aalert(1)',
  '.evil.example',
];

function destination(res: Response): URL {
  const lieu = res.headers.get('location');
  expect(lieu).toBeTruthy();
  return new URL(lieu as string);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('/auth/confirm ne renvoie jamais hors du site', () => {
  it.each(PIEGES)('next=%s mène à l’accueil du site', async (piege) => {
    const res = await confirmer(
      new NextRequest(`${ORIGINE}/auth/confirm?token_hash=t&type=email&next=${piege}`),
    );
    const cible = destination(res);
    expect(verifyOtp).toHaveBeenCalledTimes(1);
    expect(cible.origin).toBe(ORIGINE);
    expect(cible.username).toBe('');
    expect(cible.pathname).toBe('/');
  });

  it('garde un chemin du site, requête comprise', async () => {
    const res = await confirmer(
      new NextRequest(`${ORIGINE}/auth/confirm?token_hash=t&type=email&next=%2Fcompte%3Ftab%3Dinfos`),
    );
    const cible = destination(res);
    expect(cible.origin).toBe(ORIGINE);
    expect(`${cible.pathname}${cible.search}`).toBe('/compte?tab=infos');
  });

  it('sans next, une inscription mène toujours à la fin du profil', async () => {
    const res = await confirmer(new NextRequest(`${ORIGINE}/auth/confirm?token_hash=t&type=signup`));
    expect(destination(res).href).toBe(`${ORIGINE}/inscription/completer-profil`);
  });

  it('sans next, une autre confirmation mène à l’accueil', async () => {
    const res = await confirmer(new NextRequest(`${ORIGINE}/auth/confirm?token_hash=t&type=email`));
    expect(destination(res).href).toBe(`${ORIGINE}/`);
  });
});

describe('/api/auth/callback ne renvoie jamais hors du site', () => {
  it.each(PIEGES)('next=%s mène à l’accueil du site', async (piege) => {
    const res = await callback(new NextRequest(`${ORIGINE}/api/auth/callback?code=c&next=${piege}`));
    const cible = destination(res);
    expect(exchangeCodeForSession).toHaveBeenCalledTimes(1);
    expect(cible.origin).toBe(ORIGINE);
    expect(cible.pathname).toBe('/');
  });
});
