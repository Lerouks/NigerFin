import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';

/**
 * CONNEXION AVEC GOOGLE
 *
 * Le départ (/api/auth/google) envoie chez Google avec un jeton anti-falsification
 * et l'empreinte d'un nonce, gardés dans un cookie httpOnly. Le retour
 * (/api/auth/google/retour) n'ouvre une session que si le jeton revient
 * intact, que Google accepte le code et que Supabase accepte le jeton
 * d'identité. Il ne renvoie jamais hors du site.
 */

const { signInWithIdToken, googleDisponible, envoyerBienvenueSiNouveau, majProfil } = vi.hoisted(() => ({
  signInWithIdToken: vi.fn(),
  googleDisponible: vi.fn(async () => true),
  envoyerBienvenueSiNouveau: vi.fn(async () => undefined),
  majProfil: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((_u: string, _k: string, options: { cookies: { setAll: (c: unknown[]) => void } }) => ({
    auth: {
      signInWithIdToken: async (args: unknown) => {
        const r = await signInWithIdToken(args);
        if (r?.data?.user) options.cookies.setAll([{ name: 'sb-test-auth-token', value: 'session', options: { path: '/' } }]);
        return r;
      },
    },
  })),
}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }));
vi.mock('@/lib/auth/google-disponible', () => ({ googleDisponible }));
vi.mock('@/lib/auth/bienvenue', () => ({ envoyerBienvenueSiNouveau }));
vi.mock('@/lib/supabase', () => ({
  createServiceClient: vi.fn(() => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: { first_name: null, last_name: null, full_name: 'Awa Moussa' } }) }) }),
      update: (maj: unknown) => ({ eq: async () => { majProfil(maj); return { error: null }; } }),
    }),
  })),
}));

import { estNavigateurIntegre } from '@/lib/navigateur-integre';
import { encoderEtat, decoderEtat, COOKIE_GOOGLE } from '@/lib/auth/google';
import { GET as depart } from '@/app/api/auth/google/route';
import { GET as retour } from '@/app/api/auth/google/retour/route';

const ORIGINE = 'https://nfireport.com';

function destination(res: Response): URL {
  const lieu = res.headers.get('location');
  expect(lieu).toBeTruthy();
  return new URL(lieu as string);
}

/** Jeton d'identité factice (Supabase le vérifie ; ici seule la charge compte). */
function jetonIdentite(charge: Record<string, unknown>): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'RS256' })}.${b64(charge)}.signature`;
}

function requeteRetour(params: string, cookie?: string): NextRequest {
  return new NextRequest(`${ORIGINE}/api/auth/google/retour?${params}`, {
    headers: cookie ? { cookie: `${COOKIE_GOOGLE}=${cookie}` } : {},
  });
}

const ETAT = { etat: 'etat-123', nonce: 'nonce-en-clair', suite: '/premium' };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GOOGLE_CLIENT_ID = 'client-test.apps.googleusercontent.com';
  process.env.GOOGLE_CLIENT_SECRET = 'secret-test';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'placeholder';
  googleDisponible.mockResolvedValue(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('navigateurs intégrés aux applications', () => {
  it.each([
    ['Facebook sur iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/480.0.0.40.97;FBBV/1]'],
    ['Instagram sur iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0.0 (iPhone15,2; iOS 18_1; fr_FR)'],
    ['Facebook sur Android', 'Mozilla/5.0 (Linux; Android 14; SM-A146B Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0.0.40.97;]'],
    ['TikTok', 'Mozilla/5.0 (Linux; Android 13; TECNO KI5q; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0 Mobile Safari/537.36 musical_ly_2023405030 BytedanceWebview/d8a21c6'],
  ])('%s est repéré', (_nom, ua) => {
    expect(estNavigateurIntegre(ua)).toBe(true);
  });

  it.each([
    ['Safari sur iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1'],
    ['Chrome sur Android', 'Mozilla/5.0 (Linux; Android 14; SM-A146B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'],
    ['Chrome sur ordinateur', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'],
  ])('%s n’est pas bloqué', (_nom, ua) => {
    expect(estNavigateurIntegre(ua)).toBe(false);
  });
});

describe('/api/auth/google, départ vers Google', () => {
  it('sans identifiants Google, renvoie à la connexion', async () => {
    delete process.env.GOOGLE_CLIENT_SECRET;
    const res = await depart(new NextRequest(`${ORIGINE}/api/auth/google`));
    expect(destination(res).href).toBe(`${ORIGINE}/connexion`);
  });

  it('fermé (pré-lancement, visiteur), renvoie à la connexion', async () => {
    googleDisponible.mockResolvedValue(false);
    const res = await depart(new NextRequest(`${ORIGINE}/api/auth/google`));
    expect(destination(res).href).toBe(`${ORIGINE}/connexion`);
  });

  it('envoie chez Google avec le retour sur nfireport.com, l’état et l’empreinte du nonce', async () => {
    const res = await depart(new NextRequest(`${ORIGINE}/api/auth/google?next=%2Fpremium`));
    const google = destination(res);
    expect(google.origin + google.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(google.searchParams.get('client_id')).toBe('client-test.apps.googleusercontent.com');
    expect(google.searchParams.get('redirect_uri')).toBe(`${ORIGINE}/api/auth/google/retour`);
    expect(google.searchParams.get('response_type')).toBe('code');
    expect(google.searchParams.get('scope')).toBe('openid email profile');

    const cookie = res.cookies.get(COOKIE_GOOGLE);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.path).toBe('/api/auth/google');
    const etat = decoderEtat(cookie?.value);
    expect(etat?.suite).toBe('/premium');
    expect(google.searchParams.get('state')).toBe(etat?.etat);
    expect(google.searchParams.get('nonce')).toBe(createHash('sha256').update(etat?.nonce ?? '').digest('hex'));
    expect(res.headers.get('cache-control')).toContain('no-store');
  });

  it('une page de suite hors du site devient l’accueil', async () => {
    const res = await depart(new NextRequest(`${ORIGINE}/api/auth/google?next=%40evil.example`));
    expect(decoderEtat(res.cookies.get(COOKIE_GOOGLE)?.value)?.suite).toBe('/');
  });
});

describe('/api/auth/google/retour, retour de Google', () => {
  it('lecteur qui refuse chez Google : simple retour à la connexion', async () => {
    const res = await retour(requeteRetour('error=access_denied', encoderEtat(ETAT)));
    expect(destination(res).href).toBe(`${ORIGINE}/connexion`);
  });

  it('sans le cookie de départ : échec, aucune session', async () => {
    const res = await retour(requeteRetour('code=c&state=etat-123'));
    expect(destination(res).href).toBe(`${ORIGINE}/connexion?erreur=google`);
    expect(signInWithIdToken).not.toHaveBeenCalled();
  });

  it('état falsifié : échec, aucune session', async () => {
    const res = await retour(requeteRetour('code=c&state=autre', encoderEtat(ETAT)));
    expect(destination(res).href).toBe(`${ORIGINE}/connexion?erreur=google`);
    expect(signInWithIdToken).not.toHaveBeenCalled();
  });

  it('Google refuse le code : échec', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 })));
    const res = await retour(requeteRetour('code=c&state=etat-123', encoderEtat(ETAT)));
    expect(destination(res).href).toBe(`${ORIGINE}/connexion?erreur=google`);
    expect(signInWithIdToken).not.toHaveBeenCalled();
  });

  it('compte existant : session ouverte, retour à la page de suite, cookie de départ effacé', async () => {
    const idToken = jetonIdentite({ given_name: 'Awa', family_name: 'Moussa' });
    const fetchGoogle = vi.fn(async (_adresse: string, _init?: RequestInit) => new Response(JSON.stringify({ id_token: idToken }), { status: 200 }));
    vi.stubGlobal('fetch', fetchGoogle);
    signInWithIdToken.mockResolvedValue({ data: { user: { id: 'u1', email: 'awa@example.com', created_at: '2026-01-05T10:00:00Z' } }, error: null });

    const res = await retour(requeteRetour('code=le-code&state=etat-123', encoderEtat(ETAT)));

    expect(destination(res).href).toBe(`${ORIGINE}/premium`);
    const corps = new URLSearchParams(fetchGoogle.mock.calls[0]?.[1]?.body as URLSearchParams);
    expect(corps.get('code')).toBe('le-code');
    expect(corps.get('redirect_uri')).toBe(`${ORIGINE}/api/auth/google/retour`);
    expect(signInWithIdToken).toHaveBeenCalledWith({ provider: 'google', token: idToken, nonce: 'nonce-en-clair' });
    expect(res.cookies.get('sb-test-auth-token')?.value).toBe('session');
    expect(res.cookies.get(COOKIE_GOOGLE)?.value).toBe('');
    expect(envoyerBienvenueSiNouveau).not.toHaveBeenCalled();
  });

  it('compte tout juste ouvert : prénom et nom, mail de bienvenue, puis l’écran de bienvenue', async () => {
    const idToken = jetonIdentite({ given_name: 'Awa', family_name: 'Moussa' });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id_token: idToken }), { status: 200 })));
    signInWithIdToken.mockResolvedValue({
      data: { user: { id: 'u2', email: 'awa@example.com', created_at: new Date().toISOString(), user_metadata: { full_name: 'Awa Moussa' } } },
      error: null,
    });

    const res = await retour(requeteRetour('code=c&state=etat-123', encoderEtat(ETAT)));

    // Puis retour à la page de départ (« /premium » dans ce scénario).
    expect(destination(res).href).toBe(`${ORIGINE}/inscription/bienvenue?suite=%2Fpremium`);
    expect(majProfil).toHaveBeenCalledWith({ first_name: 'Awa', last_name: 'Moussa' });
    expect(envoyerBienvenueSiNouveau).toHaveBeenCalledWith('u2', 'awa@example.com', 'Awa Moussa');
  });

  it('Supabase refuse le jeton : échec, aucune session posée', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id_token: jetonIdentite({}) }), { status: 200 })));
    signInWithIdToken.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Nonces mismatch' } });
    const res = await retour(requeteRetour('code=c&state=etat-123', encoderEtat(ETAT)));
    expect(destination(res).href).toBe(`${ORIGINE}/connexion?erreur=google`);
    expect(res.cookies.get('sb-test-auth-token')).toBeUndefined();
  });
});
