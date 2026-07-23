import { describe, it, expect } from 'vitest';
import { TEMPLATE_SLOTS } from '@/lib/emails/slots';
import { TRANSACTIONAL_REGISTRY, type TransactionalEmailKey } from '@/lib/emails/registry';
import { applyOverrideStrings } from '@/lib/emails/overrides';

const KEYS = Object.keys(TEMPLATE_SLOTS) as TransactionalEmailKey[];

describe('slots de textes editables (Phase 2)', () => {
  it('couvre les 12 templates', () => {
    expect(KEYS).toHaveLength(12);
  });

  it('chaque texte par defaut est REELLEMENT present dans le HTML rendu (sinon l\'edition ne pourrait rien remplacer)', () => {
    for (const key of KEYS) {
      const def = TRANSACTIONAL_REGISTRY[key];
      const { subject, html } = def.render(def.sampleArgs);
      const slots = TEMPLATE_SLOTS[key];
      if (slots.subject !== undefined) {
        expect(subject, `objet defaut != objet rendu pour ${key}`).toBe(slots.subject);
      }
      for (const b of slots.blocks) {
        expect(
          html.includes(b.default),
          `bloc "${b.key}" introuvable dans ${key} : « ${b.default} »`,
        ).toBe(true);
      }
    }
  });

  it('GARANTIE BYTE-IDENTIQUE : sans surcharge, la sortie est intacte', () => {
    for (const key of KEYS) {
      const def = TRANSACTIONAL_REGISTRY[key];
      const built = def.render(def.sampleArgs);
      expect(applyOverrideStrings(key, built, null)).toEqual(built);
      // Surcharge vide = aussi identique.
      expect(applyOverrideStrings(key, built, { subject: null, blocks: {} })).toEqual(built);
    }
  });

  it('applique correctement une surcharge (objet + bloc)', () => {
    const key: TransactionalEmailKey = 'welcome_signup';
    const built = TRANSACTIONAL_REGISTRY[key].render({ name: 'Amadou Diallo' });
    const out = applyOverrideStrings(key, built, {
      subject: 'Bienvenue chez NFI 🎉',
      blocks: { bouton: 'Explorer le site' },
    });
    expect(out.subject).toBe('Bienvenue chez NFI 🎉');
    expect(out.html).toContain('Explorer le site');
    expect(out.html).not.toContain('Découvrir les articles');
    // Le reste du HTML est inchange.
    expect(out.html).toContain('Bienvenue sur NFI Report');
  });

  it('ignore une valeur egale au defaut ou vide (pas de bruit)', () => {
    const key: TransactionalEmailKey = 'contact_confirmation';
    const built = TRANSACTIONAL_REGISTRY[key].render({ name: 'Amadou Diallo' });
    const out = applyOverrideStrings(key, built, {
      subject: null,
      blocks: { heading: 'Message bien reçu', bouton: '   ' },
    });
    expect(out).toEqual(built);
  });

  it("n'interprete pas les caracteres speciaux du remplacement ($)", () => {
    const key: TransactionalEmailKey = 'welcome_signup';
    const built = TRANSACTIONAL_REGISTRY[key].render({ name: 'Amadou Diallo' });
    const out = applyOverrideStrings(key, built, { subject: null, blocks: { bouton: 'Prix : $10 & plus' } });
    expect(out.html).toContain('Prix : $10 & plus');
  });
});
