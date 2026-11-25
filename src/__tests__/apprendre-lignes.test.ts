import { describe, it, expect } from 'vitest';
import { chercher, noter, simuler, type Espace, type MotMesure } from '@/lib/apprendre/lignes';

/**
 * Le calcul des fins de ligne des leçons (refonte Apprendre du 25/11/2026) :
 * rejouer la mise en page du navigateur, puis souder le moins d'espaces
 * possible pour qu'aucun bloc ne finisse sur une ligne de un à trois mots ni
 * ne laisse un début de phrase en bout de ligne, sans creuser de trou.
 */

/** Des mots de 50 px séparés par des espaces de 10 px : quatre mots tiennent sur 230 px. */
function paragraphe(textes: string[], insecablesAvant: number[] = []): { mots: MotMesure[]; espaces: Espace[] } {
  const mots = textes.map((texte, i) => ({ texte, gauche: i * 60, droite: i * 60 + 50 }));
  const espaces = textes.map((_, j) => ({ car: j === 0 ? '' : insecablesAvant.includes(j) ? ' ' : ' ', largeur: j === 0 ? 0 : 10 }));
  return { mots, espaces };
}

const LARGEUR = 230;
const disposer = (p: ReturnType<typeof paragraphe>, colles: number[] = []) =>
  simuler(p.mots, p.espaces, new Set(colles), LARGEUR, 0.3, 10);

describe('mise en page rejouée', () => {
  it('chaque ligne prend autant de mots qu’elle peut en tenir', () => {
    const p = paragraphe(['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8', 'i9', 'j10']);
    expect(disposer(p).ligneDe).toEqual([0, 0, 0, 0, 1, 1, 1, 1, 2, 2]);
  });

  it('une espace insécable fait descendre les deux mots ensemble', () => {
    const p = paragraphe(['a1', 'b2', 'c3', 'd4', 'e5', 'f6'], [4]);
    expect(disposer(p).ligneDe).toEqual([0, 0, 0, 1, 1, 1]);
  });
});

describe('défauts repérés', () => {
  it('dernière ligne de deux mots', () => {
    const p = paragraphe(['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8', 'i9', 'j10']);
    expect(noter(p.mots, disposer(p), LARGEUR, 0).durs).toBe(1);
  });

  it('début de phrase laissé en bout de ligne', () => {
    const p = paragraphe(['a1', 'b2', 'fin.', 'Début', 'e5', 'f6', 'g7', 'h8']);
    expect(noter(p.mots, disposer(p), LARGEUR, 0).durs).toBe(1);
  });

  it('mot-outil en fin de ligne', () => {
    const p = paragraphe(['a1', 'b2', 'c3', 'de', 'e5', 'f6', 'g7', 'h8']);
    expect(noter(p.mots, disposer(p), LARGEUR, 0).durs).toBe(1);
  });

  it('pronom sujet ou mot de la liste de Raouf en fin de ligne', () => {
    for (const mot of ['il', 'peut', 'donc']) {
      const p = paragraphe(['a1', 'b2', 'c3', mot, 'e5', 'f6', 'g7', 'h8']);
      expect(noter(p.mots, disposer(p), LARGEUR, 0).durs).toBe(1);
    }
  });
});

describe('recherche des soudures', () => {
  it('allonge la dernière ligne sans creuser la ligne d’au-dessus', () => {
    const p = paragraphe(['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8', 'i9', 'j10']);
    const [colles = []] = chercher(p.mots, p.espaces, LARGEUR, 0.3, 10);
    const mise = disposer(p, colles);
    expect(noter(p.mots, mise, LARGEUR, colles.length).durs).toBe(0);
    // Trois, trois puis quatre mots : aucune ligne à moitié vide.
    expect(mise.ligneDe).toEqual([0, 0, 0, 1, 1, 1, 2, 2, 2, 2]);
  });

  it('fait descendre un début de phrase avec la suite de sa phrase', () => {
    const p = paragraphe(['a1', 'b2', 'fin.', 'Début', 'e5', 'f6', 'g7', 'h8', 'i9', 'j10']);
    const [colles = []] = chercher(p.mots, p.espaces, LARGEUR, 0.3, 10);
    const mise = disposer(p, colles);
    expect(noter(p.mots, mise, LARGEUR, colles.length).durs).toBe(0);
    expect(mise.ligneDe[3]).toBe(1);
  });

  it('ne touche à rien quand le paragraphe est déjà juste', () => {
    const p = paragraphe(['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8']);
    expect(chercher(p.mots, p.espaces, LARGEUR, 0.3, 10)).toEqual([]);
  });

  it('ne soude jamais au point de faire déborder un morceau', () => {
    const p = paragraphe(['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8', 'i9', 'j10']);
    const [colles = []] = chercher(p.mots, p.espaces, LARGEUR, 0.3, 10);
    expect(disposer(p, colles).deborde).toBe(false);
  });
});
