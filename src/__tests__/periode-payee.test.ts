import { describe, expect, it } from 'vitest';
import { periodePayee } from '@/lib/periode-payee';

/**
 * La période qu'achète un paiement Premium unique. Avant le 24/11/2026, la
 * nouvelle fin partait toujours du jour du paiement : un abonné qui repayait
 * dix jours avant la fin perdait ces dix jours.
 */

const MAINTENANT = new Date('2026-11-24T12:00:00Z');

describe('periodePayee : payer en avance ne fait perdre aucun jour', () => {
  it('sans accès en cours, la période part du paiement', () => {
    const p = periodePayee('monthly', null, MAINTENANT);
    expect(p.prolonge).toBe(false);
    expect(p.debut.toISOString()).toBe('2026-11-24T12:00:00.000Z');
    expect(p.fin.toISOString()).toBe('2026-12-24T12:00:00.000Z');
  });

  it('un accès actif qui court encore : le mois payé s’ajoute à sa fin', () => {
    const p = periodePayee('monthly', { subscription_status: 'active', subscription_end: '2026-12-04T12:00:00Z' }, MAINTENANT);
    expect(p.prolonge).toBe(true);
    expect(p.debut.toISOString()).toBe('2026-12-04T12:00:00.000Z');
    expect(p.fin.toISOString()).toBe('2027-01-04T12:00:00.000Z');
  });

  it('trois mois et un an payés en avance s’ajoutent aussi', () => {
    const acces = { subscription_status: 'active', subscription_end: '2026-12-04T12:00:00Z' };
    expect(periodePayee('quarterly', acces, MAINTENANT).fin.toISOString()).toBe('2027-03-04T12:00:00.000Z');
    expect(periodePayee('yearly', acces, MAINTENANT).fin.toISOString()).toBe('2027-12-04T12:00:00.000Z');
  });

  it('un accès arrivé à sa fin : la période part du paiement', () => {
    const p = periodePayee('monthly', { subscription_status: 'active', subscription_end: '2026-11-20T12:00:00Z' }, MAINTENANT);
    expect(p.prolonge).toBe(false);
    expect(p.debut.toISOString()).toBe('2026-11-24T12:00:00.000Z');
  });

  it('un accès coupé par l’administration ne se prolonge pas, même avec une fin à venir', () => {
    for (const statut of ['inactive', 'expired', 'cancelled']) {
      const p = periodePayee('monthly', { subscription_status: statut, subscription_end: '2026-12-04T12:00:00Z' }, MAINTENANT);
      expect(p.prolonge).toBe(false);
      expect(p.fin.toISOString()).toBe('2026-12-24T12:00:00.000Z');
    }
  });

  it('une fin absente ou illisible : la période part du paiement', () => {
    expect(periodePayee('monthly', { subscription_status: 'active', subscription_end: null }, MAINTENANT).prolonge).toBe(false);
    expect(periodePayee('monthly', { subscription_status: 'active', subscription_end: 'pas une date' }, MAINTENANT).prolonge).toBe(false);
  });
});
