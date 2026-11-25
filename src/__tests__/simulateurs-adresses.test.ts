import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SIMULATEURS_MENU } from '@/lib/navigation';

/**
 * Les simulateurs ont changé d'adresse le 25/11/2026 (choix de Raouf, avant
 * l'ouverture du site) : /outils devient /simulateurs, et chaque simulateur une
 * adresse courte. Les anciennes adresses ont pu partir dans des mails, des
 * publications ou des favoris : chacune doit mener à la bonne page.
 *
 * Les redirections sont lues dans next.config.js et rejouées comme Next.js les
 * applique : dans l'ordre, la première qui correspond l'emporte.
 */

const ANCIENNES_ADRESSES: Record<string, string> = {
  '/outils': '/simulateurs',
  '/outil': '/simulateurs',
  '/outil/simulateur-salaire': '/simulateurs/salaire',
  '/outil/simulateur-emprunt': '/simulateurs/emprunt',
  '/outil/interet-compose': '/simulateurs/interets-composes',
  '/outil/interet-simple': '/simulateurs/interets-simples',
  '/outil/budget-familial': '/simulateurs/budget-familial',
  '/outil/indices-economiques': '/simulateurs/indices-economiques',
};

const source = readFileSync(join(process.cwd(), 'next.config.js'), 'utf8');
const redirections = [...source.matchAll(/source:\s*'([^']+)',\s*destination:\s*'([^']+)'/g)].map((m) => ({
  source: m[1]!,
  destination: m[2]!,
}));

/** Rejoue une redirection : « :slug » prend un segment, « :slug* » le reste. */
function suivre(chemin: string): string | null {
  for (const { source: motif, destination } of redirections) {
    const noms: string[] = [];
    const expression = motif.replace(/:(\w+)(\*)?/g, (_, nom: string, etoile?: string) => {
      noms.push(nom);
      return etoile ? '(.*)' : '([^/]+)';
    });
    const trouve = chemin.match(new RegExp(`^${expression}$`));
    if (!trouve) continue;
    return noms.reduce((dest, nom, i) => dest.replace(new RegExp(`:${nom}\\*?`), trouve[i + 1] ?? ''), destination);
  }
  return null;
}

describe('Les anciennes adresses des simulateurs mènent aux nouvelles', () => {
  it('lit bien les redirections de next.config.js', () => {
    expect(redirections.length).toBeGreaterThan(5);
  });

  for (const [ancienne, nouvelle] of Object.entries(ANCIENNES_ADRESSES)) {
    it(`${ancienne} mène à ${nouvelle}`, () => {
      expect(suivre(ancienne)).toBe(nouvelle);
    });
  }

  it('chaque simulateur du menu a une ancienne adresse qui mène à lui', () => {
    const destinations = new Set(Object.values(ANCIENNES_ADRESSES));
    for (const s of SIMULATEURS_MENU) {
      expect(destinations.has(s.href), s.href).toBe(true);
    }
  });

  it('les nouvelles adresses ne sont jamais redirigées', () => {
    for (const s of SIMULATEURS_MENU) {
      expect(suivre(s.href), s.href).toBeNull();
    }
    expect(suivre('/simulateurs')).toBeNull();
  });
});
