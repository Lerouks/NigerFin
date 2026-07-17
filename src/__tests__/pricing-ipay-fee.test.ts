import { describe, it, expect } from 'vitest';
import {
  getIPayChargeAmount,
  ipayCustomerTotal,
  IPAYMONEY_FEE_RATE,
  BILLING_OPTIONS,
} from '@/config/pricing';

/**
 * MODELE REEL iPayMoney (verifie en production) : iPay ajoute des frais de 3 %
 * AU montant envoye, ARRONDIS A L'ENTIER SUPERIEUR (ceil), a la charge du client :
 *     total debite = X + Math.ceil(X x 0,03)
 * Envoyer 48 544 fait donc payer 50 001 (ceil(1 456,32) = 1 457). C'est la cause
 * du bug "50 000 -> 50 001". getIPayChargeAmount envoie un montant reduit pour que
 * le CLIENT paie le prix ROND affiche (NFI absorbe les frais). Ces tests
 * verrouillent ce comportement pour qu'il ne puisse plus jamais deriver.
 *
 * NB : le modele de reference ci-dessous est recalcule INDEPENDAMMENT du helper
 * de l'implementation, pour attraper toute regression y compris dans le helper.
 */
const iPayTotalReference = (sent: number) => sent + Math.ceil(sent * IPAYMONEY_FEE_RATE);

describe('getIPayChargeAmount — frais iPayMoney absorbes par NFI', () => {
  it('le helper ipayCustomerTotal reproduit le modele iPay (ceil), pas round', () => {
    // 48 544 = ancien montant envoye pour l'annuel -> 50 001 : c'est le bug observe.
    expect(ipayCustomerTotal(48544)).toBe(50001);
    expect(iPayTotalReference(48544)).toBe(50001);
  });

  it('mensuel : le client paie exactement 5 000 FCFA', () => {
    const sent = getIPayChargeAmount(5000);
    expect(sent).toBe(4854);
    expect(iPayTotalReference(sent)).toBe(5000);
  });

  it('trimestriel : le client paie exactement 13 750 FCFA (etait casse -> 13 751)', () => {
    const sent = getIPayChargeAmount(13750);
    expect(sent).toBe(13349);
    expect(iPayTotalReference(sent)).toBe(13750);
  });

  it('annuel : le client paie exactement 50 000 FCFA (etait casse -> 50 001)', () => {
    const sent = getIPayChargeAmount(50000);
    expect(sent).toBe(48543);
    expect(iPayTotalReference(sent)).toBe(50000);
  });

  it('les 3 plans configures : le client paie PILE le prix rond, jamais un FCFA de plus', () => {
    for (const opt of BILLING_OPTIONS) {
      const sent = getIPayChargeAmount(opt.price);
      expect(sent).toBeLessThan(opt.price);
      expect(iPayTotalReference(sent)).toBe(opt.price);
    }
  });

  /**
   * Test exhaustif (brute force) sur toute la plage de prix plausibles. Verrouille
   * les deux proprietes fondamentales pour N'IMPORTE quel prix (utile si un prix
   * dynamique non rond etait un jour introduit) :
   *   1. SURETE     : le client ne paie JAMAIS plus que le prix affiche.
   *   2. MAXIMALITE : X est le plus grand possible -> le client paie le prix pile
   *      des que c'est atteignable (NFI n'absorbe pas plus que necessaire), et
   *      au pire 1 FCFA de moins.
   */
  it('propriete (1..200 000) : jamais de depassement, et maximal (exact des que possible)', () => {
    for (let price = 1; price <= 200000; price++) {
      const sent = getIPayChargeAmount(price);
      // 1. Surete : jamais au-dessus du prix affiche.
      expect(iPayTotalReference(sent)).toBeLessThanOrEqual(price);
      // 2. Maximalite : envoyer 1 FCFA de plus depasserait forcement le prix.
      expect(iPayTotalReference(sent + 1)).toBeGreaterThan(price);
    }
  });
});
