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

import { recoitLaNewsletter, SOURCE_LISTE_ATTENTE, upsertNewsletterSubscriber } from '@/lib/newsletter/subscribers';

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
