import { describe, it, expect } from 'vitest';
import {
  getIPayChargeAmount,
  IPAYMONEY_FEE_RATE,
  BILLING_OPTIONS,
} from '@/config/pricing';

/**
 * iPayMoney ajoute des frais = round(montant x 3%) AU montant envoye, a la
 * charge du client par defaut (5 000 -> 5 150). getIPayChargeAmount envoie un
 * montant reduit pour que le CLIENT paie le prix ROND affiche (NFI absorbe les
 * ~3%). Ces tests verrouillent ce comportement.
 */
describe('getIPayChargeAmount — frais iPayMoney absorbes par NFI', () => {
  // Reproduit le calcul cote iPay : total = montant + arrondi(montant x taux).
  const customerTotal = (sent: number) =>
    sent + Math.round(sent * IPAYMONEY_FEE_RATE);

  it('mensuel : le client paie exactement 5 000 FCFA', () => {
    const sent = getIPayChargeAmount(5000);
    expect(sent).toBe(4854);
    expect(customerTotal(sent)).toBe(5000);
  });

  it('annuel : le client paie exactement 50 000 FCFA', () => {
    const sent = getIPayChargeAmount(50000);
    expect(customerTotal(sent)).toBe(50000);
  });

  it('le montant envoye a iPay est toujours inferieur au prix affiche', () => {
    for (const opt of BILLING_OPTIONS) {
      expect(getIPayChargeAmount(opt.price)).toBeLessThan(opt.price);
    }
  });

  it('le total paye par le client reste a +/-1 FCFA du prix affiche', () => {
    for (const opt of BILLING_OPTIONS) {
      const total = customerTotal(getIPayChargeAmount(opt.price));
      expect(Math.abs(total - opt.price)).toBeLessThanOrEqual(1);
    }
  });
});
