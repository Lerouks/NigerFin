import { afterEach, describe, expect, it, vi } from 'vitest';
import { estUnEchec, inscrireALaNewsletter, MESSAGES_ECHEC } from '@/lib/newsletter/inscription';
import { RATE_LIMITS } from '@/lib/rate-limit';

/**
 * Formulaire newsletter de l'accueil et fenêtre des articles : une adresse déjà
 * inscrite doit l'apprendre (« Cette adresse est déjà inscrite à la newsletter »)
 * au lieu de lire une confirmation, et chaque refus dit pourquoi.
 */

function repondre(status: number, corps?: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(corps === undefined ? null : JSON.stringify(corps), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('inscription à la newsletter depuis le navigateur', () => {
  it('une adresse nouvelle est inscrite', async () => {
    repondre(200, { success: true, isNew: true, reactivated: false });
    expect(await inscrireALaNewsletter('lecteur@exemple.test', 'form_home')).toBe('inscrit');
  });

  it('une adresse qui revient (désinscrite, ou seulement sur la liste d’attente) est inscrite', async () => {
    repondre(200, { success: true, isNew: false, reactivated: true });
    expect(await inscrireALaNewsletter('lecteur@exemple.test', 'form_home')).toBe('inscrit');
  });

  it('une adresse déjà inscrite le dit, au lieu de confirmer une inscription', async () => {
    repondre(200, { success: true, isNew: false, reactivated: false });
    expect(await inscrireALaNewsletter('lecteur@exemple.test', 'form_home')).toBe('deja-inscrit');
  });

  it('une réponse sans détail compte comme une inscription', async () => {
    repondre(200, { success: true });
    expect(await inscrireALaNewsletter('lecteur@exemple.test', 'popup_scroll')).toBe('inscrit');
  });

  it('chaque refus a son message', async () => {
    repondre(400, { error: 'Email invalide' });
    expect(await inscrireALaNewsletter('pas-une-adresse', 'form_home')).toBe('adresse-invalide');
    repondre(429, { error: 'Trop de requêtes' });
    expect(await inscrireALaNewsletter('lecteur@exemple.test', 'form_home')).toBe('trop-de-tentatives');
    repondre(500, { error: 'Erreur serveur' });
    expect(await inscrireALaNewsletter('lecteur@exemple.test', 'form_home')).toBe('erreur');
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    expect(await inscrireALaNewsletter('lecteur@exemple.test', 'form_home')).toBe('hors-ligne');

    for (const issue of ['adresse-invalide', 'trop-de-tentatives', 'erreur', 'hors-ligne'] as const) {
      expect(estUnEchec(issue)).toBe(true);
      expect(MESSAGES_ECHEC[issue]).toMatch(/\.$/);
    }
    expect(estUnEchec('inscrit')).toBe(false);
    expect(estUnEchec('deja-inscrit')).toBe(false);
  });

  it('envoie l’adresse sans espaces autour, avec la source du formulaire', async () => {
    repondre(200, { success: true, isNew: true, reactivated: false });
    await inscrireALaNewsletter('  lecteur@exemple.test ', 'popup_scroll');
    const appel = vi.mocked(fetch).mock.calls[0]!;
    expect(appel[0]).toBe('/api/newsletter');
    expect(JSON.parse((appel[1] as RequestInit).body as string)).toEqual({
      email: 'lecteur@exemple.test',
      source: 'popup_scroll',
    });
  });
});

describe('limite d’essais de la newsletter et de la liste d’attente', () => {
  it('30 par heure et par connexion', () => {
    expect(RATE_LIMITS.newsletter).toEqual({ limit: 30, windowMs: 60 * 60 * 1000 });
  });
});
