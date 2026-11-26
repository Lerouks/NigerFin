import { describe, expect, it } from 'vitest';
import { dateArticle, debutArticle, enLignes, miseEnPageArticle, texteAffiche } from '@/lib/article/mise-en-page';
import { meilleuresCoupures, type EspaceMesure, type MotMesure } from '@/lib/article/coupures';

const NBSP = '\u00a0';

describe('mise en page du texte d’un article', () => {
  it('fait d’un paragraphe en gras un vrai intertitre', () => {
    const html = '<p>Début.</p><p><strong>Le financement : le mur invisible</strong></p><p>Suite.</p>';
    expect(miseEnPageArticle(html)).toContain('<h2>Le financement : le mur invisible</h2>');
  });

  it('fait de l’intertitre placé en tête une accroche, une phrase par ligne', () => {
    const html = '<h2>Les marchés n’aiment pas l’incertitude. Encore moins ici.</h2><p>Ce soir.</p><h3>Une ouverture</h3>';
    const sortie = miseEnPageArticle(html);
    expect(sortie.startsWith('<p class="accroche"><span class="phrase">Les marchés n’aiment pas l’incertitude.</span> <span class="phrase">Encore moins ici.</span></p>')).toBe(true);
    // Plus d'autre <h2> : les <h3> montent d'un rang.
    expect(sortie).toContain('<h2>Une ouverture</h2>');
    expect(sortie).not.toContain('<h3>');
  });

  it('retire les paragraphes vides', () => {
    expect(miseEnPageArticle('<p>Texte.</p><p></p><p>&nbsp;</p>')).toBe('<p>Texte.</p>');
  });

  it('soude unités, traits d’union et locutions dans le texte, jamais dans les balises', () => {
    const sortie = miseEnPageArticle('<p><a href="https://exemple.org/a-b">États-Unis</a> : 48 heures, 20 %, tandis que le S&amp;P 500 recule.</p>');
    expect(sortie).toContain('href="https://exemple.org/a-b"');
    expect(sortie).toContain('États\u2011Unis');
    expect(sortie).toContain(`48${NBSP}heures`);
    expect(sortie).toContain(`20${NBSP}%`);
    expect(sortie).toContain(`tandis${NBSP}que`);
    expect(sortie).toContain(`S&amp;P${NBSP}500`);
  });

  it('est idempotente', () => {
    const html = '<h2>Accroche. Deuxième phrase.</h2><p><strong>Titre</strong></p><p>États-Unis, 48 heures.</p>';
    const une = miseEnPageArticle(html);
    expect(miseEnPageArticle(une)).toBe(une);
  });

  it('donne le vrai début d’un article Premium : accroche et deux paragraphes, pas plus', () => {
    const debut = debutArticle('<h2>Accroche.</h2><p>Un.</p><p>Deux.</p><p>Trois.</p>');
    expect(debut.accroche).toContain('Accroche.');
    expect(debut.paragraphes).toEqual(['Un.', 'Deux.']);
  });

  it('date un article à l’heure de Niamey, quel que soit le fuseau du lecteur', () => {
    // 17 avril à 23 h 30 UTC : déjà le 18 avril à Niamey (UTC+1).
    expect(dateArticle('2026-04-17T23:30:00Z')).toBe('18 avril 2026');
  });

  it('échappe un titre avant de l’afficher en HTML', () => {
    expect(texteAffiche('<script>x</script> & co')).toBe('&lt;script&gt;x&lt;/script&gt; &amp; co');
    expect(enLignes('a <b>gras</b>')).toBe('a <b>gras</b>');
  });
});

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
});
