import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }));

/** La ligne de newsletter_subscribers que la lecture renvoie, et ce que le client a vu passer. */
const etat: { ligne: { id: string; status: string; source: string | null } | null; vus: string[] } = { ligne: null, vus: [] };

vi.mock('@/lib/supabase', () => ({
  createServiceClient: vi.fn(() => ({
    from: (table: string) => ({
      select: () => ({
        eq: (colonne: string, valeur: string) => ({
          maybeSingle: async () => {
            etat.vus.push(`select:${table}.${colonne}=${valeur}`);
            return { data: etat.ligne, error: null };
          },
        }),
      }),
      update: (valeurs: Record<string, unknown>) => ({
        eq: async (colonne: string, valeur: string) => {
          etat.vus.push(`update:${table}.${colonne}=${valeur}:${JSON.stringify(valeurs.newsletter_subscribed)}`);
          return { error: null };
        },
      }),
    }),
  })),
}));

vi.mock('@/lib/newsletter/subscribers', async (original) => {
  const vrai = await original<typeof import('@/lib/newsletter/subscribers')>();
  return {
    ...vrai,
    upsertNewsletterSubscriber: vi.fn(async () => {
      // Ce que fait la vraie fonction : la ligne devient active, à la source donnée.
      etat.ligne = { id: 'ligne-1', status: 'active', source: 'compte' };
      return { id: 'ligne-1', isNew: true, reactivated: false };
    }),
    unsubscribeBy: vi.fn(async () => {
      if (etat.ligne) etat.ligne = { ...etat.ligne, status: 'unsubscribed' };
      return { found: true, alreadyUnsubscribed: false };
    }),
  };
});

import { upsertNewsletterSubscriber, unsubscribeBy } from '@/lib/newsletter/subscribers';
import { changerNewsletterDuCompte, etatDepuisLigne, SOURCE_COMPTE } from '@/lib/newsletter/compte';

beforeEach(() => {
  vi.clearAllMocks();
  etat.ligne = null;
  etat.vus = [];
});

describe('l’interrupteur « Recevoir la newsletter » de « Mon compte »', () => {
  it('lit l’état réel : la seule liste d’attente ne reçoit pas la newsletter, un rebond la bloque', () => {
    expect(etatDepuisLigne(null)).toEqual({ recoit: false, bloquee: false });
    expect(etatDepuisLigne({ id: 'a', status: 'active', source: 'prelaunch' })).toEqual({ recoit: false, bloquee: false });
    expect(etatDepuisLigne({ id: 'a', status: 'active', source: 'form_home' })).toEqual({ recoit: true, bloquee: false });
    expect(etatDepuisLigne({ id: 'a', status: 'bounced', source: 'form' })).toEqual({ recoit: false, bloquee: true });
    expect(etatDepuisLigne({ id: 'a', status: 'complained', source: 'form' })).toEqual({ recoit: false, bloquee: true });
    expect(etatDepuisLigne({ id: 'a', status: 'unsubscribed', source: 'form' })).toEqual({ recoit: false, bloquee: false });
  });

  it('allumer abonne l’adresse du compte, sous la forme enregistrée, et le mail de bienvenue part', async () => {
    const r = await changerNewsletterDuCompte({ email: 'Lectrice@Exemple.TEST', userId: 'u1', recevoir: true });

    expect(upsertNewsletterSubscriber).toHaveBeenCalledWith({ email: 'lectrice@exemple.test', source: SOURCE_COMPTE, userId: 'u1' });
    expect(r).toEqual({ etat: { recoit: true, bloquee: false }, bienvenuePour: 'ligne-1' });
    expect(etat.vus).toContain('update:user_profiles.id=u1:true');
  });

  it('couper désabonne une adresse qui reçoit la newsletter', async () => {
    etat.ligne = { id: 'ligne-1', status: 'active', source: 'form_home' };

    const r = await changerNewsletterDuCompte({ email: 'lectrice@exemple.test', userId: 'u1', recevoir: false });

    expect(unsubscribeBy).toHaveBeenCalledWith('email', 'lectrice@exemple.test');
    expect(r.etat).toEqual({ recoit: false, bloquee: false });
    expect(r.bienvenuePour).toBeNull();
  });

  it('couper ne retire jamais une adresse de la liste d’attente, qui ne se quitte pas', async () => {
    etat.ligne = { id: 'ligne-1', status: 'active', source: 'prelaunch' };

    const r = await changerNewsletterDuCompte({ email: 'lectrice@exemple.test', userId: 'u1', recevoir: false });

    expect(unsubscribeBy).not.toHaveBeenCalled();
    expect(etat.ligne.status).toBe('active');
    expect(r.etat).toEqual({ recoit: false, bloquee: false });
  });

  it('une adresse bloquée reste coupée, sans mail de bienvenue', async () => {
    etat.ligne = { id: 'ligne-1', status: 'complained', source: 'form' };
    vi.mocked(upsertNewsletterSubscriber).mockImplementationOnce(async () => ({ id: 'ligne-1', isNew: false, reactivated: false }));

    const r = await changerNewsletterDuCompte({ email: 'lectrice@exemple.test', userId: 'u1', recevoir: true });

    expect(r).toEqual({ etat: { recoit: false, bloquee: true }, bienvenuePour: null });
    expect(etat.vus.some((v) => v.startsWith('update:user_profiles'))).toBe(false);
  });
});
