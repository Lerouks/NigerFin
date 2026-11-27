import { describe, expect, it } from 'vitest';
import { meilleuresCoupures, type EspaceMesure, type MotMesure } from '@/lib/article/coupures';

describe('choix des fins de ligne', () => {
  // Mots de 10 px, espaces de 4 px : une colonne de 100 px tient sept mots.
  const bloc = (textes: string[], insecables: number[] = []) => {
    const mots: MotMesure[] = textes.map((t) => ({ texte: t, largeur: 10 }));
    const espaces: EspaceMesure[] = textes.map((_, i) => ({ largeur: 4, secable: i > 0 && !insecables.includes(i) }));
    return { mots, espaces };
  };

  it('ne laisse jamais un mot-outil en fin de ligne quand une autre coupure existe', () => {
    const { mots, espaces } = bloc(['Aa', 'Bb', 'Cc', 'Dd', 'Ee', 'Ff', 'de', 'Gg', 'Hh', 'Ii', 'Jj', 'Kk', 'Ll', 'Mm']);
    const debuts = meilleuresCoupures(mots, espaces, 100, 'texte')!;
    for (const d of debuts) expect(mots[d - 1]!.texte).not.toBe('de');
  });

  it('ne laisse jamais une dernière ligne de un à trois mots quand c’est évitable', () => {
    const { mots, espaces } = bloc(['Aa', 'Bb', 'Cc', 'Dd', 'Ee', 'Ff', 'Gg', 'Hh', 'Ii']);
    const debuts = meilleuresCoupures(mots, espaces, 100, 'texte')!;
    const dernierDebut = debuts[debuts.length - 1] ?? 0;
    expect(mots.length - dernierDebut).toBeGreaterThanOrEqual(4);
  });

  it('ne coupe jamais à une espace insécable', () => {
    const { mots, espaces } = bloc(['Aa', 'Bb', 'Cc', 'Dd', 'Ee', 'Ff', 'Gg', 'Hh', 'Ii', 'Jj'], [7]);
    const debuts = meilleuresCoupures(mots, espaces, 100, 'texte')!;
    expect(debuts).not.toContain(7);
  });

  it('rend null quand un mot ne tient pas seul sur la ligne', () => {
    const mots: MotMesure[] = [{ texte: 'Immense', largeur: 200 }, { texte: 'mot', largeur: 10 }];
    const espaces: EspaceMesure[] = [{ largeur: 0, secable: false }, { largeur: 4, secable: true }];
    expect(meilleuresCoupures(mots, espaces, 100, 'texte')).toBeNull();
  });

  it('raccourcit les premières lignes à côté d’une lettrine', () => {
    const { mots, espaces } = bloc(Array.from({ length: 18 }, (_, i) => `M${i}`));
    // 3 mots font 38 px et 4 mots 52 px : à côté de la lettrine (50 px), 3 mots au plus.
    const debuts = meilleuresCoupures(mots, espaces, [50, 50, 100], 'texte')!;
    expect(debuts[0]).toBeLessThanOrEqual(3);
    expect(debuts[1]! - debuts[0]!).toBeLessThanOrEqual(3);
    for (let k = 2; k < debuts.length; k += 1) expect(debuts[k]! - debuts[k - 1]!).toBeLessThanOrEqual(7);
    expect(debuts.length).toBeLessThan(6);
  });

  it('donne le même choix avec une seule largeur, en nombre ou en liste', () => {
    const { mots, espaces } = bloc(['Aa', 'Bb', 'Cc', 'Dd', 'Ee', 'Ff', 'de', 'Gg', 'Hh', 'Ii', 'Jj', 'Kk', 'Ll', 'Mm']);
    expect(meilleuresCoupures(mots, espaces, [100], 'texte')).toEqual(meilleuresCoupures(mots, espaces, 100, 'texte'));
  });
});
