import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BLOCS_ORDI,
  BLOCS_TELEPHONE,
  INSTITUTIONS_FINANCE,
  casesDeLaTuile,
  ordreFiche,
  ordreTuile,
} from '@/data/institutions-finance';

/**
 * « QUI FAIT QUOI DANS LA FINANCE » (mosaïque choisie par Raouf le 26/11/2026)
 *
 * Ce qui doit tenir : les deux versions de chaque logo réellement présentes,
 * aux dimensions déclarées ; des blocs qui couvrent les neuf institutions dans
 * l'ordre du mur et remplissent leurs rangées en entier (sinon une fiche
 * s'ouvrirait au milieu d'une rangée) ; chaque fiche placée juste après son
 * bloc ; aucun texte qui cite une année antérieure à 2025.
 */

function dimensionsPng(chemin: string): { largeur: number; hauteur: number } {
  const octets = readFileSync(chemin);
  expect(octets.subarray(1, 4).toString('ascii')).toBe('PNG');
  return { largeur: octets.readUInt32BE(16), hauteur: octets.readUInt32BE(20) };
}

const ids = INSTITUTIONS_FINANCE.map((i) => i.id);

describe('Qui fait quoi dans la finance', () => {
  it('les neuf institutions ont un identifiant unique', () => {
    expect(ids).toHaveLength(9);
    expect(new Set(ids).size).toBe(9);
  });

  it.each(INSTITUTIONS_FINANCE.map((i) => [i.id, i] as const))('%s : logo clair et logo sur noir présents, aux bonnes dimensions', (id, institution) => {
    for (const suffixe of ['', '-sur-noir']) {
      const chemin = join(process.cwd(), 'public', 'logos', 'institutions', `${id}${suffixe}.png`);
      expect(existsSync(chemin), chemin).toBe(true);
      expect(dimensionsPng(chemin)).toEqual(institution.logo);
    }
  });

  it.each([
    ['ordinateur', BLOCS_ORDI, 'ordi', 4],
    ['téléphone', BLOCS_TELEPHONE, 'telephone', 2],
  ] as const)('%s : les blocs suivent le mur et remplissent leurs rangées', (_, blocs, ecran, colonnes) => {
    expect(blocs.flat()).toEqual(ids);
    for (const bloc of blocs) {
      const cases = bloc.reduce((total, id) => total + casesDeLaTuile(INSTITUTIONS_FINANCE.find((i) => i.id === id)!.forme, ecran), 0);
      expect(cases % colonnes, bloc.join(', ')).toBe(0);
    }
  });

  it.each([
    ['ordinateur', BLOCS_ORDI],
    ['téléphone', BLOCS_TELEPHONE],
  ] as const)('%s : chaque fiche s’affiche juste après le bloc de sa tuile', (_, blocs) => {
    for (const bloc of blocs) {
      const derniere = ids.indexOf(bloc[bloc.length - 1]!);
      for (const id of bloc) {
        const rang = ordreFiche(id, blocs);
        expect(rang).toBeGreaterThan(ordreTuile(derniere));
        if (derniere + 1 < ids.length) expect(rang).toBeLessThan(ordreTuile(derniere + 1));
      }
    }
  });

  it('aucun texte ne cite une année antérieure à 2025 (règle de Raouf, 26/11/2026)', () => {
    for (const i of INSTITUTIONS_FINANCE) {
      const texte = [i.nomComplet, i.role, ...i.presentation, ...i.pourVous].join(' ');
      for (const annee of texte.match(/\b(19|20)\d{2}\b/g) ?? []) {
        expect(Number(annee), `${i.id} : ${annee}`).toBeGreaterThanOrEqual(2025);
      }
    }
  });

  it('les sites officiels sont des adresses https', () => {
    for (const i of INSTITUTIONS_FINANCE) {
      if (i.site) expect(i.site.url).toMatch(/^https:\/\//);
    }
  });
});
