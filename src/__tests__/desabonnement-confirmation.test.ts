import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Désabonnement de la newsletter avec confirmation (décision de Raouf,
 * 23/11/2026 : « dès qu'on appuyait sur se désinscrire, la personne était déjà
 * désinscrite […] il faut une confirmation »).
 *
 * Le lien du mail ne désabonne jamais : il pose le jeton dans un cookie et mène
 * à la page qui pose la question. Seul l'appui sur « Me désabonner » désabonne.
 * Le bouton en un clic de Gmail ou de l'iPhone (POST, RFC 8058) reste direct.
 */

const JETON = '11111111-2222-3333-4444-555555555555';

const { unsubscribeBy, reabonnerParJeton, abonnementParJeton, lien } = vi.hoisted(() => ({
  unsubscribeBy: vi.fn(async () => ({ found: true, alreadyUnsubscribed: false })),
  reabonnerParJeton: vi.fn(async () => ({ found: true, reabonne: true })),
  abonnementParJeton: vi.fn(async (): Promise<{ email: string; status: string } | null> => null),
  /** Jeton du cookie posé par le lien du mail. */
  lien: { jeton: undefined as string | undefined },
}));

vi.mock('@/lib/newsletter/subscribers', () => ({ unsubscribeBy, reabonnerParJeton, abonnementParJeton }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }));
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => (lien.jeton === undefined ? undefined : { value: lien.jeton }) }),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`);
  }),
}));

import { GET, POST } from '@/app/api/newsletter/unsubscribe/route';
import { seDesabonner, seReabonner } from '@/app/newsletter/desabonnement/actions';
import { lireEtatDesabonnement, masquerAdresse } from '@/lib/newsletter/desabonnement';

function get(url: string) {
  return GET(new NextRequest(new Request(url)));
}

beforeEach(() => {
  vi.clearAllMocks();
  lien.jeton = undefined;
  abonnementParJeton.mockResolvedValue(null);
});

describe('le lien du mail (GET) ne désabonne pas : il mène à la question', () => {
  it('un vrai jeton : cookie posé, page sans jeton dans l’adresse, aucun désabonnement', async () => {
    const r = await get(`https://nfireport.com/api/newsletter/unsubscribe?token=${JETON}`);
    expect(r.status).toBe(307);
    expect(r.headers.get('location')).toBe('https://nfireport.com/newsletter/desabonnement');
    const cookie = r.cookies.get('nfi_desabonnement');
    expect(cookie?.value).toBe(JETON);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.path).toBe('/newsletter/desabonnement');
    expect(cookie?.sameSite).toBe('lax');
    expect(unsubscribeBy).not.toHaveBeenCalled();
  });

  it('la page reste sur l’hôte du lien, pour que le cookie suive', async () => {
    const r = await get(`https://www.nfireport.com/api/newsletter/unsubscribe?token=${JETON}`);
    expect(r.headers.get('location')).toBe('https://www.nfireport.com/newsletter/desabonnement');
  });

  it('un lien incomplet ou mal formé : la page le dit, sans cookie', async () => {
    for (const url of [
      'https://nfireport.com/api/newsletter/unsubscribe',
      'https://nfireport.com/api/newsletter/unsubscribe?token=pas-un-jeton',
    ]) {
      const r = await get(url);
      expect(r.headers.get('location')).toBe('https://nfireport.com/newsletter/desabonnement?lien=invalide');
      expect(r.cookies.get('nfi_desabonnement')).toBeUndefined();
    }
    expect(unsubscribeBy).not.toHaveBeenCalled();
  });

  it('les jetons des mails d’essai mènent à la page d’essai', async () => {
    const r = await get('https://nfireport.com/api/newsletter/unsubscribe?token=PREVIEW');
    expect(r.cookies.get('nfi_desabonnement')?.value).toBe('PREVIEW');
    const fait = await get('https://nfireport.com/api/newsletter/unsubscribe?token=DEMO&apres=fait');
    expect(fait.headers.get('location')).toBe('https://nfireport.com/newsletter/desabonnement?apres=fait');
  });

  it('un vrai jeton ne choisit pas le moment de la page', async () => {
    const r = await get(`https://nfireport.com/api/newsletter/unsubscribe?token=${JETON}&apres=fait`);
    expect(r.headers.get('location')).toBe('https://nfireport.com/newsletter/desabonnement');
  });
});

describe('le bouton en un clic de Gmail ou de l’iPhone (POST) reste direct', () => {
  it('désabonne tout de suite', async () => {
    const r = await POST(new NextRequest(new Request(`https://nfireport.com/api/newsletter/unsubscribe?token=${JETON}`, { method: 'POST', body: 'List-Unsubscribe=One-Click' })));
    expect(r.status).toBe(200);
    expect(unsubscribeBy).toHaveBeenCalledWith('unsubscribe_token', JETON);
  });

  it('un jeton inconnu, ou d’une adresse de la liste d’attente : 404', async () => {
    unsubscribeBy.mockResolvedValueOnce({ found: false, alreadyUnsubscribed: false });
    const r = await POST(new NextRequest(new Request(`https://nfireport.com/api/newsletter/unsubscribe?token=${JETON}`, { method: 'POST' })));
    expect(r.status).toBe(404);
  });
});

describe('la confirmation (« Me désabonner ») et le retour (« Me réabonner »)', () => {
  it('seul l’appui sur « Me désabonner » désabonne, avec le jeton du cookie', async () => {
    lien.jeton = JETON;
    await expect(seDesabonner()).rejects.toThrow('REDIRECT /newsletter/desabonnement?apres=fait');
    expect(unsubscribeBy).toHaveBeenCalledWith('unsubscribe_token', JETON);
  });

  it('sans lien suivi, rien ne se passe', async () => {
    await expect(seDesabonner()).rejects.toThrow('REDIRECT /newsletter/desabonnement');
    expect(unsubscribeBy).not.toHaveBeenCalled();
  });

  it('un jeton d’essai n’enregistre rien', async () => {
    lien.jeton = 'DEMO';
    await expect(seDesabonner()).rejects.toThrow('REDIRECT /newsletter/desabonnement?apres=fait');
    await expect(seReabonner()).rejects.toThrow('REDIRECT /newsletter/desabonnement?apres=reabonne');
    expect(unsubscribeBy).not.toHaveBeenCalled();
    expect(reabonnerParJeton).not.toHaveBeenCalled();
  });

  it('une panne de la base : la page le dit', async () => {
    lien.jeton = JETON;
    unsubscribeBy.mockRejectedValueOnce(new Error('base indisponible'));
    await expect(seDesabonner()).rejects.toThrow('REDIRECT /newsletter/desabonnement?erreur=1');
  });

  it('« Me réabonner » réabonne avec le jeton du cookie', async () => {
    lien.jeton = JETON;
    await expect(seReabonner()).rejects.toThrow('REDIRECT /newsletter/desabonnement?apres=reabonne');
    expect(reabonnerParJeton).toHaveBeenCalledWith(JETON);
  });
});

describe('ce que la page montre', () => {
  it('l’adresse à demi masquée', () => {
    expect(masquerAdresse('amadou.diallo@gmail.com')).toBe('a•••o@gmail.com');
    expect(masquerAdresse('ab@exemple.test')).toBe('a•••@exemple.test');
    expect(masquerAdresse('pas-une-adresse')).toBe('•••');
  });

  it('sans lien suivi, lien invalide, panne', async () => {
    expect(await lireEtatDesabonnement({ jeton: undefined })).toEqual({ etat: 'sans-lien' });
    expect(await lireEtatDesabonnement({ jeton: JETON, lienInvalide: true })).toEqual({ etat: 'inactif' });
    expect(await lireEtatDesabonnement({ jeton: JETON, erreur: true })).toEqual({ etat: 'erreur' });
  });

  it('l’état vient de la base, pas de l’adresse de la page', async () => {
    abonnementParJeton.mockResolvedValue({ email: 'amadou.diallo@gmail.com', status: 'active' });
    expect(await lireEtatDesabonnement({ jeton: JETON, apres: 'fait' }))
      .toEqual({ etat: 'question', adresse: 'a•••o@gmail.com', essai: false });
    expect(await lireEtatDesabonnement({ jeton: JETON, apres: 'reabonne' }))
      .toEqual({ etat: 'reabonne', adresse: 'a•••o@gmail.com', essai: false });

    abonnementParJeton.mockResolvedValue({ email: 'amadou.diallo@gmail.com', status: 'unsubscribed' });
    expect(await lireEtatDesabonnement({ jeton: JETON }))
      .toEqual({ etat: 'fait', adresse: 'a•••o@gmail.com', essai: false, reabonnable: true });

    abonnementParJeton.mockResolvedValue({ email: 'amadou.diallo@gmail.com', status: 'complained' });
    expect(await lireEtatDesabonnement({ jeton: JETON }))
      .toEqual({ etat: 'fait', adresse: 'a•••o@gmail.com', essai: false, reabonnable: false });

    abonnementParJeton.mockResolvedValue(null);
    expect(await lireEtatDesabonnement({ jeton: JETON })).toEqual({ etat: 'inactif' });

    abonnementParJeton.mockRejectedValue(new Error('base indisponible'));
    expect(await lireEtatDesabonnement({ jeton: JETON })).toEqual({ etat: 'erreur' });
  });

  it('un jeton d’essai suit les actions, sans base', async () => {
    expect(await lireEtatDesabonnement({ jeton: 'TEST' })).toMatchObject({ etat: 'question', essai: true });
    expect(await lireEtatDesabonnement({ jeton: 'TEST', apres: 'fait' })).toMatchObject({ etat: 'fait', essai: true });
    expect(abonnementParJeton).not.toHaveBeenCalled();
  });
});
