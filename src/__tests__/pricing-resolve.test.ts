import { describe, it, expect } from 'vitest';
import { resolvePrice, MAX_DYNAMIC_PRICE, getBillingOption } from '@/config/pricing';

/**
 * resolvePrice = source de verite unique du prix en vigueur pour un cycle.
 * Regles metier verrouillees ici :
 *   - pas d'override -> prix du config,
 *   - override valide -> l'override, mais JAMAIS sous le plancher (prix config)
 *     ni au-dessus du plafond (MAX_DYNAMIC_PRICE),
 *   - override absurde (NaN, Infinity, null) -> retombe sur le prix config.
 * Ces garanties rendent impossible de facturer un client sous le prix config,
 * quelle que soit la valeur presente en base dynamic_pricing.
 */
describe('resolvePrice — prix canonique (plancher config, plafond MAX)', () => {
  const YEARLY_FLOOR = getBillingOption('yearly').price; // 50 000
  const MONTHLY_FLOOR = getBillingOption('monthly').price; // 5 000

  it('sans override : renvoie le prix du config', () => {
    expect(resolvePrice('monthly')).toBe(MONTHLY_FLOOR);
    expect(resolvePrice('quarterly')).toBe(getBillingOption('quarterly').price);
    expect(resolvePrice('yearly')).toBe(YEARLY_FLOOR);
  });

  it('override null / undefined / NaN / Infinity : retombe sur le config (fail-safe)', () => {
    expect(resolvePrice('yearly', null)).toBe(YEARLY_FLOOR);
    expect(resolvePrice('yearly', undefined)).toBe(YEARLY_FLOOR);
    expect(resolvePrice('yearly', Number.NaN)).toBe(YEARLY_FLOOR);
    expect(resolvePrice('yearly', Number.POSITIVE_INFINITY)).toBe(YEARLY_FLOOR);
  });

  it('override au-dessus du plancher : renvoie l\'override', () => {
    expect(resolvePrice('yearly', 60_000)).toBe(60_000);
    expect(resolvePrice('monthly', 7_000)).toBe(7_000);
  });

  it('override SOUS le plancher : clampe au prix config (jamais facturer moins)', () => {
    expect(resolvePrice('yearly', 40_000)).toBe(YEARLY_FLOOR);
    expect(resolvePrice('monthly', 1)).toBe(MONTHLY_FLOOR);
    expect(resolvePrice('monthly', -999)).toBe(MONTHLY_FLOOR);
  });

  it('override au-dessus du plafond : clampe a MAX_DYNAMIC_PRICE (anti-aberration)', () => {
    expect(resolvePrice('yearly', MAX_DYNAMIC_PRICE + 1)).toBe(MAX_DYNAMIC_PRICE);
    expect(resolvePrice('yearly', 999_999_999)).toBe(MAX_DYNAMIC_PRICE);
  });

  it('override decimal : arrondi a l\'entier (les montants FCFA sont entiers)', () => {
    expect(resolvePrice('yearly', 60_000.4)).toBe(60_000);
    expect(resolvePrice('yearly', 59_999.6)).toBe(60_000);
  });
});
