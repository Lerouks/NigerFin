import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { INSTITUTIONS_FINANCE } from '@/data/institutions-finance';

/**
 * « QUI FAIT QUOI DANS LA FINANCE » (carte noire de la page Finance, choix de
 * Raouf du 26/11/2026, et non une page à part)
 *
 * Ce qui doit tenir : les deux versions de chaque logo réellement présentes,
 * aux dimensions déclarées ; aucun texte qui cite une année antérieure à 2025 ;
 * la carte dans la page Finance, et l'ancienne adresse qui y renvoie.
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

  it('fait partie de la page Finance, et l’ancienne page à part y renvoie', () => {
    const racine = process.cwd();
    const finance = readFileSync(join(racine, 'src', 'app', 'finance', 'page.tsx'), 'utf8');
    expect(finance).toContain('<QuiFaitQuoi institutions={institutions} {...TEXTES_QUI_FAIT_QUOI} />');
    expect(existsSync(join(racine, 'src', 'app', 'finance', 'institutions', 'page.tsx'))).toBe(false);
    const config = readFileSync(join(racine, 'next.config.js'), 'utf8');
    expect(config).toMatch(/source:\s*'\/finance\/institutions',\s*destination:\s*'\/finance#institutions',\s*permanent:\s*true/);
    expect(readFileSync(join(racine, 'src', 'app', 'sitemap.ts'), 'utf8')).not.toContain('/finance/institutions');
  });
});
