import { describe, it, expect } from 'vitest';
import {
  TRANSACTIONAL_REGISTRY,
  listTransactionalDefs,
  getTransactionalDef,
  isTransactionalKey,
  type TransactionalEmailKey,
} from '@/lib/emails/registry';
import * as T from '@/lib/email-templates';

const ALL_KEYS = Object.keys(TRANSACTIONAL_REGISTRY) as TransactionalEmailKey[];

describe('registre des e-mails transactionnels', () => {
  it('couvre les 12 templates (11 clients + 1 interne)', () => {
    expect(ALL_KEYS).toHaveLength(12);
    const internal = ALL_KEYS.filter((k) => TRANSACTIONAL_REGISTRY[k].audience === 'internal');
    expect(internal).toEqual(['contact_notification']);
  });

  it('rend chaque e-mail avec un objet non vide et un HTML complet', () => {
    for (const key of ALL_KEYS) {
      const def = TRANSACTIONAL_REGISTRY[key];
      const { subject, html } = def.render(def.sampleArgs);
      expect(subject, `subject vide pour ${key}`).toBeTruthy();
      expect(html, `html sans doctype pour ${key}`).toContain('<!DOCTYPE html>');
      expect(html.length, `html trop court pour ${key}`).toBeGreaterThan(200);
    }
  });

  it('delegue aux vrais templates (aucune divergence)', () => {
    // Le rendu du registre doit etre STRICTEMENT identique a l'appel direct du template.
    expect(TRANSACTIONAL_REGISTRY.welcome_signup.render({ name: 'Amadou Diallo' }))
      .toEqual(T.welcomeSignupEmail('Amadou Diallo'));
    expect(TRANSACTIONAL_REGISTRY.newsletter_welcome.render({}))
      .toEqual(T.newsletterWelcomeEmail());
    expect(TRANSACTIONAL_REGISTRY.invoice.render(TRANSACTIONAL_REGISTRY.invoice.sampleArgs))
      .toEqual(
        T.invoiceEmail({
          customerName: 'Amadou Diallo',
          invoiceNumber: 'FAC-2026-0001',
          amountXof: 50000,
          paidAt: '2026-01-12T09:00:00.000Z',
          periodStart: '2026-01-12T09:00:00.000Z',
          periodEnd: '2027-01-12T09:00:00.000Z',
          downloadUrl: '#',
        }),
      );
  });

  it('utilise le bon layout : facture = receipt (pas de liseré or ni slogan)', () => {
    const invoice = TRANSACTIONAL_REGISTRY.invoice.render(TRANSACTIONAL_REGISTRY.invoice.sampleArgs).html;
    expect(invoice).toContain('Reçu de paiement');
    expect(invoice).not.toContain('La connaissance, votre meilleur capital.');
    const welcome = TRANSACTIONAL_REGISTRY.welcome_signup.render({ name: 'Amadou Diallo' }).html;
    expect(welcome).toContain('La connaissance, votre meilleur capital.');
  });

  it('listTransactionalDefs expose objet + metadonnees sans fonctions', () => {
    const list = listTransactionalDefs();
    expect(list).toHaveLength(12);
    for (const item of list) {
      expect(item.subject).toBeTruthy();
      expect(['brand', 'receipt']).toContain(item.layout);
      expect(item).not.toHaveProperty('render');
    }
  });

  it('valide les cles connues et rejette les inconnues', () => {
    expect(isTransactionalKey('welcome_signup')).toBe(true);
    expect(isTransactionalKey('inconnu')).toBe(false);
    expect(isTransactionalKey(42)).toBe(false);
    expect(getTransactionalDef('welcome_signup')?.key).toBe('welcome_signup');
    expect(getTransactionalDef('inconnu')).toBeNull();
  });

  it("fallback vers l'exemple si un argument est absent ou du mauvais type", () => {
    // name absent -> le nom d'exemple est utilise, jamais "undefined" dans le HTML.
    const html = TRANSACTIONAL_REGISTRY.welcome_signup.render({}).html;
    expect(html).toContain('Amadou Diallo');
    expect(html).not.toContain('undefined');
  });
});
