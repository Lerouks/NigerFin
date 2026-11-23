import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Liste d'attente du pré-lancement : la page promet « Votre adresse ne sert
 * qu'à vous prévenir de l'ouverture ». Ces adresses ne reçoivent donc pas la
 * newsletter, sauf si la personne s'y abonne elle-même ensuite (décision de
 * Raouf, 23/11/2026).
 */

let existant: Record<string, unknown> | null = null;
const majs: Record<string, unknown>[] = [];

const service = {
  from: () => ({
    select: () => ({
      eq: () => ({ maybeSingle: async () => ({ data: existant, error: null }) }),
    }),
    update: (valeurs: Record<string, unknown>) => ({
      eq: async () => {
        majs.push(valeurs);
        return { error: null };
      },
    }),
    insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'nouveau' }, error: null }) }) }),
  }),
};

vi.mock('@/lib/supabase', () => ({ createServiceClient: vi.fn(() => service) }));

import { lienDesinscription, recoitLaNewsletter, SOURCE_LISTE_ATTENTE, unsubscribeBy, upsertNewsletterSubscriber } from '@/lib/newsletter/subscribers';

beforeEach(() => {
  existant = null;
  majs.length = 0;
});

describe('qui reçoit la newsletter', () => {
  it('pas une adresse venue seulement de la page d’attente', () => {
    expect(SOURCE_LISTE_ATTENTE).toBe('prelaunch');
    expect(recoitLaNewsletter('prelaunch')).toBe(false);
  });

  it('les autres inscriptions, y compris sans source connue', () => {
    expect(recoitLaNewsletter('form_home')).toBe(true);
    expect(recoitLaNewsletter('signup')).toBe(true);
    expect(recoitLaNewsletter(null)).toBe(true);
    expect(recoitLaNewsletter(undefined)).toBe(true);
  });
});

describe('une personne de la liste d’attente qui s’abonne ensuite à la newsletter', () => {
  it('son choix est enregistré : elle reçoit la newsletter et le mail de bienvenue', async () => {
    existant = { id: 'a1', status: 'active', unsubscribed_at: null, source: 'prelaunch' };
    const r = await upsertNewsletterSubscriber({ email: 'lecteur@exemple.test', source: 'form_home' });
    expect(r).toEqual({ id: 'a1', isNew: false, reactivated: true });
    expect(majs).toHaveLength(1);
    expect(majs[0]).toMatchObject({ source: 'form_home' });
    expect(typeof majs[0]!.opt_in_at).toBe('string');
  });

  it('une nouvelle inscription sur la page d’attente ne change rien', async () => {
    existant = { id: 'a1', status: 'active', unsubscribed_at: null, source: 'prelaunch' };
    const r = await upsertNewsletterSubscriber({ email: 'lecteur@exemple.test', source: 'prelaunch' });
    expect(r).toEqual({ id: 'a1', isNew: false, reactivated: false });
    expect(majs).toHaveLength(0);
  });

  it('un abonné de la newsletter qui passe par la page d’attente reste abonné', async () => {
    existant = { id: 'b2', status: 'active', unsubscribed_at: null, source: 'form_home' };
    const r = await upsertNewsletterSubscriber({ email: 'abonne@exemple.test', source: 'prelaunch' });
    expect(r).toEqual({ id: 'b2', isNew: false, reactivated: false });
    expect(majs).toHaveLength(0);
  });
});

describe('quitter la liste par le lien d’un mail', () => {
  it('une adresse de la page d’attente : la page de confirmation parle de la liste d’attente', async () => {
    existant = { id: 'a1', status: 'active', user_id: null, source: 'prelaunch' };
    const r = await unsubscribeBy('unsubscribe_token', '11111111-2222-3333-4444-555555555555');
    expect(r).toEqual({ found: true, alreadyUnsubscribed: false, listeAttente: true });
    expect(majs[0]).toMatchObject({ status: 'unsubscribed' });
  });

  it('un abonné de la newsletter : la page parle de la newsletter', async () => {
    existant = { id: 'b2', status: 'active', user_id: null, source: 'form_home' };
    const r = await unsubscribeBy('unsubscribe_token', '11111111-2222-3333-4444-555555555555');
    expect(r).toEqual({ found: true, alreadyUnsubscribed: false, listeAttente: false });
  });

  it('un deuxième clic : rien ne change, la page le dit', async () => {
    existant = { id: 'a1', status: 'unsubscribed', user_id: null, source: 'prelaunch' };
    const r = await unsubscribeBy('unsubscribe_token', '11111111-2222-3333-4444-555555555555');
    expect(r).toEqual({ found: true, alreadyUnsubscribed: true, listeAttente: true });
    expect(majs).toHaveLength(0);
  });

  it('le lien de désinscription d’une adresse porte son jeton', async () => {
    existant = { unsubscribe_token: '11111111-2222-3333-4444-555555555555' };
    expect(await lienDesinscription('a1')).toMatch(/\/api\/newsletter\/unsubscribe\?token=11111111-2222-3333-4444-555555555555$/);
    existant = null;
    expect(await lienDesinscription('a1')).toBeUndefined();
  });
});
