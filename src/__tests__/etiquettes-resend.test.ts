import { describe, expect, it } from 'vitest';
import { lireEtiquette } from '@/lib/emails/etiquettes-resend';

describe('lireEtiquette', () => {
  it('lit la forme objet, celle des avis (webhooks) de Resend', () => {
    const etiquettes = { nfi_issue_id: 'numero-1', nfi_subscriber_id: 'abonne-1' };
    expect(lireEtiquette(etiquettes, 'nfi_issue_id')).toBe('numero-1');
    expect(lireEtiquette(etiquettes, 'nfi_subscriber_id')).toBe('abonne-1');
  });

  it("lit la forme tableau, celle de l'API d'envoi", () => {
    const etiquettes = [
      { name: 'nfi_email_type', value: 'facture' },
      { name: 'nfi_user_id', value: 'lecteur-1' },
    ];
    expect(lireEtiquette(etiquettes, 'nfi_email_type')).toBe('facture');
    expect(lireEtiquette(etiquettes, 'nfi_user_id')).toBe('lecteur-1');
  });

  it("ne renvoie rien quand l'étiquette manque, ou n'est pas du texte", () => {
    expect(lireEtiquette(undefined, 'nfi_email_type')).toBeUndefined();
    expect(lireEtiquette(null, 'nfi_email_type')).toBeUndefined();
    expect(lireEtiquette({}, 'nfi_email_type')).toBeUndefined();
    expect(lireEtiquette({ nfi_email_type: 3 }, 'nfi_email_type')).toBeUndefined();
    expect(lireEtiquette([{ name: 'nfi_email_type' }], 'nfi_email_type')).toBeUndefined();
    expect(lireEtiquette([null, { name: 'autre', value: 'x' }], 'nfi_email_type')).toBeUndefined();
  });
});
