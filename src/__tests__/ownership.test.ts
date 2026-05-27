import { describe, it, expect } from 'vitest';
import { parseOwnership, getMajorityCountry } from '@/lib/ownership';
import { detectCountry } from '@/lib/country-flags';

describe('detectCountry', () => {
  it('detects Niger', () => {
    expect(detectCountry('Etat du Niger 100%')).toBe('NE');
    expect(detectCountry('Etat nigerien')).toBe('NE');
  });

  it('does NOT confuse Niger with Nigeria', () => {
    expect(detectCountry('First Bank Nigeria')).toBe('NG');
    expect(detectCountry('Nigerian National Petroleum')).toBe('NG');
  });

  it('detects France via patronyme entreprise', () => {
    expect(detectCountry('Orano (ex-Areva)')).toBe('FR');
    expect(detectCountry('Bollore Logistics')).toBe('FR');
    expect(detectCountry('TotalEnergies')).toBe('FR');
  });

  it('detects Chine via groupe', () => {
    expect(detectCountry('CNPC Petrochina')).toBe('CN');
    expect(detectCountry('China National Nuclear Corporation')).toBe('CN');
  });

  it('detects Maroc via banque', () => {
    expect(detectCountry('Bank of Africa BOA')).toBe('MA');
    expect(detectCountry('Attijariwafa Bank')).toBe('MA');
  });

  it('detects Togo via Ecobank', () => {
    expect(detectCountry('Ecobank Transnational')).toBe('TG');
  });

  it('detects Senegal via Sonatel', () => {
    expect(detectCountry('Sonatel Group')).toBe('SN');
  });

  it('falls back to WORLD on unknown text', () => {
    expect(detectCountry('Random investor XYZ')).toBe('WORLD');
    expect(detectCountry('')).toBe('WORLD');
  });
});

describe('parseOwnership', () => {
  it('returns empty array on null/undefined/empty', () => {
    expect(parseOwnership(null)).toEqual([]);
    expect(parseOwnership(undefined)).toEqual([]);
    expect(parseOwnership('')).toEqual([]);
    expect(parseOwnership('   ')).toEqual([]);
  });

  it('parses single actionnaire 100%', () => {
    const result = parseOwnership('Etat du Niger 100%');
    expect(result).toEqual([{ label: 'Etat du Niger', share: 100, country: 'NE' }]);
  });

  it('parses two actionnaires separated by /', () => {
    const result = parseOwnership('Orano (ex-Areva) 63,4% / Etat du Niger 36,6%');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ label: 'Orano', share: 63.4, country: 'FR' });
    expect(result[1]).toEqual({ label: 'Etat du Niger', share: 36.6, country: 'NE' });
  });

  it('parses two actionnaires separated by +', () => {
    const result = parseOwnership('Orange Group 70% + Etat du Niger 30%');
    expect(result).toHaveLength(2);
    expect(result[0]?.country).toBe('FR');
    expect(result[1]?.country).toBe('NE');
    expect(result[0]?.share).toBe(70);
    expect(result[1]?.share).toBe(30);
  });

  it('parses comma decimal correctly (FR format)', () => {
    const result = parseOwnership('Orano 63,4% / Etat 36,6%');
    expect(result[0]?.share).toBe(63.4);
    expect(result[1]?.share).toBe(36.6);
  });

  it('parses dot decimal correctly (EN format)', () => {
    const result = parseOwnership('Foo 63.4% / Bar 36.6%');
    expect(result[0]?.share).toBe(63.4);
  });

  it('keeps label without share when no percent in segment', () => {
    const result = parseOwnership('Famille fondatrice (majoritaire)');
    expect(result).toHaveLength(1);
    expect(result[0]?.share).toBeNull();
    expect(result[0]?.label).toBe('Famille fondatrice');
  });

  it('strips parentheses from label', () => {
    const result = parseOwnership('Orano (ex-Areva, depuis 2017) 63,4%');
    expect(result[0]?.label).toBe('Orano');
  });

  it('handles "Etat du Niger 100% (en cours de privatisation)"', () => {
    const result = parseOwnership('Etat du Niger 100% (en cours de privatisation)');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ label: 'Etat du Niger', share: 100, country: 'NE' });
  });

  it('handles complex 3-actionnaires string', () => {
    const result = parseOwnership('Etat du Niger 50% + CNNC 30% + Orano 20%');
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.country)).toEqual(['NE', 'CN', 'FR']);
    expect(result.map((r) => r.share)).toEqual([50, 30, 20]);
  });

  it('handles "et" as separator', () => {
    const result = parseOwnership('Etat du Niger 60% et BCEAO 40%');
    expect(result).toHaveLength(2);
  });
});

describe('getMajorityCountry', () => {
  it('returns the country with highest share', () => {
    expect(getMajorityCountry('Orano 63,4% / Etat du Niger 36,6%')).toBe('FR');
    expect(getMajorityCountry('Etat du Niger 60% + Orano 40%')).toBe('NE');
  });

  it('returns WORLD on empty', () => {
    expect(getMajorityCountry('')).toBe('WORLD');
    expect(getMajorityCountry(null)).toBe('WORLD');
  });

  it('returns first detected country when no shares', () => {
    expect(getMajorityCountry('Etat du Niger')).toBe('NE');
  });

  it('handles 100% case', () => {
    expect(getMajorityCountry('Etat du Niger 100%')).toBe('NE');
  });
});
