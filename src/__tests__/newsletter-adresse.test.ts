import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * La forme sous laquelle newsletter_subscribers enregistre une adresse.
 *
 * La suppression d'un compte retrouve l'inscription faite avant le compte
 * (liste d'attente du pré-lancement, formulaire en visiteur) par une égalité
 * exacte avec l'adresse du compte, mise sous cette forme (normalizeEmail).
 * Chaque chemin d'inscription passe par upsertNewsletterSubscriber : la liste
 * d'attente, le formulaire (qui sert aussi à la création de compte), et les
 * deux confirmations de paiement. Ce test vérifie, par le vrai code des deux
 * routes publiques, que l'adresse est cherchée et écrite sous cette forme.
 */

const appels: { operation: string; valeur: unknown }[] = [];

const service = {
  from: (table: string) => ({
    select: () => ({
      eq: (colonne: string, valeur: string) => ({
        maybeSingle: async () => {
          appels.push({ operation: `${table}.select.eq.${colonne}`, valeur });
          return { data: null, error: null };
        },
      }),
    }),
    insert: (ligne: Record<string, unknown>) => {
      appels.push({ operation: `${table}.insert`, valeur: ligne });
      return { select: () => ({ single: async () => ({ data: { id: 'abonne-1' }, error: null }) }) };
    },
  }),
};

vi.mock('@/lib/supabase', () => ({
  createServiceClient: vi.fn(() => service),
  createServerSupabaseClient: vi.fn(async () => null),
}));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(async () => ({ limited: false, remaining: 5, resetAt: new Date() })),
  getClientIP: vi.fn(() => '127.0.0.1'),
  RATE_LIMITS: { newsletter: { limit: 5, windowMs: 3600000 } },
}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }));
vi.mock('@/lib/email', () => ({ sendTransactionalEmail: vi.fn(async () => undefined) }));
vi.mock('@/lib/email-templates', () => ({ newsletterWelcomeEmail: vi.fn(() => ({ subject: 'Bienvenue', html: '<p>Bienvenue</p>' })) }));
vi.mock('@/lib/emails/overrides', () => ({ applyOverridesTo: vi.fn(async (_type: string, email: unknown) => email) }));

import { normalizeEmail } from '@/lib/validation';

function requete(url: string, corps: unknown): NextRequest {
  return new NextRequest(
    new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) }),
  );
}

beforeEach(() => {
  appels.length = 0;
  vi.clearAllMocks();
});

describe('normalizeEmail', () => {
  it('retire les espaces autour et met en minuscules, sans rien toucher d’autre', () => {
    expect(normalizeEmail('  Pre_Lancement@Exemple.TEST ')).toBe('pre_lancement@exemple.test');
    expect(normalizeEmail('a.b+c_d%e@exemple.test')).toBe('a.b+c_d%e@exemple.test');
  });
});

describe('les inscriptions enregistrent l’adresse normalisée', () => {
  it('la liste d’attente du pré-lancement : sans compte, adresse normalisée', async () => {
    const { POST } = await import('@/app/api/waitlist/route');

    const reponse = await POST(requete('http://localhost/api/waitlist', { email: 'Pre_Lancement@Exemple.Test' }));

    expect(reponse.status).toBe(200);
    expect(appels).toEqual([
      { operation: 'newsletter_subscribers.select.eq.email', valeur: 'pre_lancement@exemple.test' },
      {
        operation: 'newsletter_subscribers.insert',
        valeur: { email: 'pre_lancement@exemple.test', source: 'prelaunch', user_id: null, locale: 'fr' },
      },
    ]);
  });

  it('le formulaire d’inscription, celui de la création de compte compris : adresse normalisée', async () => {
    const { POST } = await import('@/app/api/newsletter/route');

    const reponse = await POST(requete('http://localhost/api/newsletter', { email: 'Lecteur.Visiteur@Exemple.Test', source: 'signup' }));

    expect(reponse.status).toBe(200);
    expect(appels).toEqual([
      { operation: 'newsletter_subscribers.select.eq.email', valeur: 'lecteur.visiteur@exemple.test' },
      {
        operation: 'newsletter_subscribers.insert',
        valeur: { email: 'lecteur.visiteur@exemple.test', source: 'signup', user_id: null, locale: 'fr' },
      },
    ]);
  });
});
