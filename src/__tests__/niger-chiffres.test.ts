import { describe, it, expect } from 'vitest';
import {
  CHIFFRES_CLES,
  DETTE_PUBLIQUE,
  EN_UN_AN,
  NIGER_CHIFFRES_MIS_A_JOUR,
  SECTEURS_PIB,
  pourcentFr,
  secteurFr,
  villeDuSiege,
} from '@/data/niger-chiffres';

describe('Chiffres de la page Niger : sourcés, datés, cohérents', () => {
  it('chaque chiffre clé porte une source', () => {
    for (const c of CHIFFRES_CLES) expect(c.source.length).toBeGreaterThan(2);
  });

  it('la date de mise à jour est une vraie date', () => {
    expect(Number.isNaN(Date.parse(NIGER_CHIFFRES_MIS_A_JOUR))).toBe(false);
  });

  it('les trois secteurs font tout le PIB', () => {
    const total = SECTEURS_PIB.reduce((s, x) => s + x.part, 0);
    expect(total).toBeCloseTo(100, 0);
  });

  it('la dette extérieure et intérieure font la dette totale', () => {
    expect(DETTE_PUBLIQUE.exterieure + DETTE_PUBLIQUE.interieure).toBeCloseTo(DETTE_PUBLIQUE.totale, 1);
    expect(DETTE_PUBLIQUE.totale).toBeLessThan(DETTE_PUBLIQUE.plafondUemoa);
  });

  it('les évolutions donnent une valeur avant et après', () => {
    for (const e of EN_UN_AN) {
      expect(e.avant).toMatch(/%$/);
      expect(e.apres).toMatch(/%$/);
    }
  });
});

describe('Écriture à la française', () => {
  it('pourcentage avec virgule et espace insécable', () => {
    expect(pourcentFr(47.4)).toBe('47,4\u00a0%');
    expect(pourcentFr(19)).toBe('19,0\u00a0%');
  });

  it('secteurs : « & » devient « et », sans majuscule à l\u2019anglaise', () => {
    expect(secteurFr('Mines & Ressources')).toBe('Mines et ressources');
    expect(secteurFr('Pétrole & Énergie')).toBe('Pétrole et énergie');
    expect(secteurFr('Agriculture & Agroalimentaire')).toBe('Agriculture et agroalimentaire');
    expect(secteurFr('Télécommunications')).toBe('Télécommunications');
    expect(secteurFr('Mines, BTP & Industrie')).toBe('Mines, BTP et industrie');
  });

  it('ville du siège sans le pays', () => {
    expect(villeDuSiege('Arlit, Niger')).toBe('Arlit');
    expect(villeDuSiege('Niamey')).toBe('Niamey');
    expect(villeDuSiege(null)).toBe('');
  });
});
