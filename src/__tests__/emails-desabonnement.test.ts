import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * « Se désabonner » n'apparaît que dans les mails de la newsletter (décision
 * de Raouf, 23/11/2026) : ni lien ni en-tête List-Unsubscribe dans les mails de
 * compte, de paiement, de facture ou de la liste d'attente, sinon Gmail et
 * l'iPhone affichent leur bouton « Se désabonner » en haut d'un mail de mot de
 * passe. Et la liste d'attente ne se quitte pas.
 */

const envoyer = vi.fn(async (_m: Record<string, unknown>) => ({ data: { id: 'm1' }, error: null }));
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: envoyer };
  },
}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }));

import { sendTransactionalEmail } from '@/lib/email';
import { newsletterWelcomeEmail, waitlistConfirmationEmail } from '@/lib/email-templates';

beforeEach(() => {
  envoyer.mockClear();
  process.env.RESEND_API_KEY = 're_test';
});

describe('l’en-tête de désabonnement', () => {
  it('absent d’un mail sans lien de désabonnement (compte, paiement, liste d’attente)', async () => {
    await sendTransactionalEmail({ to: 'lecteur@exemple.test', subject: 'Mot de passe modifié', html: '<p>Bonjour</p>' });
    const message = envoyer.mock.calls[0]![0];
    expect(message).not.toHaveProperty('headers');
  });

  it('présent, avec le désabonnement en un clic, sur un mail de la newsletter', async () => {
    const url = 'https://nfireport.com/api/newsletter/unsubscribe?token=11111111-2222-3333-4444-555555555555';
    await sendTransactionalEmail({ to: 'lecteur@exemple.test', subject: 'Bienvenue', html: '<p>Bonjour</p>', unsubscribeUrl: url });
    const message = envoyer.mock.calls[0]![0] as { headers: Record<string, string> };
    expect(message.headers['List-Unsubscribe']).toContain(`<${url}>`);
    expect(message.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
  });
});

describe('les liens des mails', () => {
  it('la confirmation de la liste d’attente ne propose pas de la quitter', () => {
    const { html } = waitlistConfirmationEmail();
    expect(html).not.toMatch(/unsubscribe|Quitter la liste|désinscri|désabonn/i);
  });

  it('la bienvenue de la newsletter garde son lien « Se désabonner de la newsletter »', () => {
    const url = 'https://nfireport.com/api/newsletter/unsubscribe?token=11111111-2222-3333-4444-555555555555';
    const { html } = newsletterWelcomeEmail(url);
    expect(html).toContain(url);
    expect(html).toMatch(/Se(\s|&nbsp;| )désabonner/);
  });
});
