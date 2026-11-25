import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { compterMots, decouperLecon, intertitres, leconDeDepart, minutesDeLecture, phrases, slugifier, slugValide } from '@/lib/apprendre/lecture';
import { lireQuiz, QuizSchema, scoreQuiz } from '@/lib/apprendre/quiz';
import { CorpsLecon } from '@/components/apprendre/CorpsLecon';
import { estNotreRetouche } from '@/components/apprendre/AjusteurLignes';

const NB = ' ';
const FINE = ' ';

/**
 * APPRENDRE (refonte du 25/11/2026) : des cours publiés leçon par leçon, une
 * page par leçon, le chapeau sous le titre, « À retenir », le chiffre en
 * bandeau noir et la question de fin.
 */

describe('adresse d’une leçon', () => {
  it('se déduit du titre, sans accents ni apostrophes', () => {
    expect(slugifier('Qu’est-ce que la finance ?')).toBe('qu-est-ce-que-la-finance');
    expect(slugifier("Comprendre l'inflation et ses effets")).toBe('comprendre-l-inflation-et-ses-effets');
    expect(slugifier('Épargner ou investir : quelle différence ?')).toBe('epargner-ou-investir-quelle-difference');
    expect(slugifier('Œuvres & cœur')).toBe('oeuvres-coeur');
  });

  it('respecte la règle de la base : minuscules, chiffres, tirets simples', () => {
    expect(slugValide('les-bases-2026')).toBe(true);
    expect(slugValide('Les-bases')).toBe(false);
    expect(slugValide('les--bases')).toBe(false);
    expect(slugValide('-bases')).toBe(false);
    expect(slugValide(slugifier('x'.repeat(200)))).toBe(true);
  });
});

describe('temps de lecture', () => {
  it('se calcule sur les mots réels, à 180 par minute, jamais moins de 2 minutes', () => {
    const texte = Array.from({ length: 540 }, (_, i) => `mot${i}`).join(' ');
    expect(compterMots(texte)).toBe(540);
    expect(minutesDeLecture(texte)).toBe(3);
    expect(minutesDeLecture('')).toBe(2);
  });

  it('ne compte ni les balises ni la syntaxe Markdown', () => {
    expect(compterMots('## Titre\n\n**Gras** et <strong>fort</strong> | a |')).toBe(5);
  });
});

describe('chapeau et corps', () => {
  it('retire le titre répété en tête et prend le premier paragraphe comme chapeau', () => {
    const md = '## Comprendre l’inflation\n\nL’inflation est la hausse des prix.\nElle touche tout le monde.\n\n### Comment la mesurer ?\n\nAvec un indice.';
    const { chapeau, corps } = decouperLecon(md, 'Comprendre l’inflation');
    expect(chapeau).toBe('L’inflation est la hausse des prix. Elle touche tout le monde.');
    expect(corps).toBe('### Comment la mesurer ?\n\nAvec un indice.');
  });

  it('sans paragraphe d’ouverture, pas de chapeau', () => {
    const { chapeau, corps } = decouperLecon('### Section\n\nTexte.', 'Autre titre');
    expect(chapeau).toBe('');
    expect(corps).toBe('### Section\n\nTexte.');
  });

  it('liste les intertitres', () => {
    expect(intertitres('### Un\n\ntexte\n\n## Deux\n\n#### Trois')).toEqual(['Un', 'Deux']);
  });
});

describe('phrases d’une accroche', () => {
  it('coupe après un point suivi d’une majuscule, pas après « M. » ni dans un nombre', () => {
    expect(phrases('Le taux est de 4,5 %. Il change chaque année ! Pourquoi ? Parce que.')).toEqual([
      'Le taux est de 4,5 %.',
      'Il change chaque année !',
      'Pourquoi ?',
      'Parce que.',
    ]);
    expect(phrases('Voyez M. Diallo à la banque. Puis signez.')).toEqual(['Voyez M. Diallo à la banque.', 'Puis signez.']);
    expect(phrases('Une seule phrase sans point final')).toEqual(['Une seule phrase sans point final']);
  });
});

describe('question de fin', () => {
  const question = {
    question: 'Que pourrez-vous acheter au bout d’un an ?',
    choix: ['Autant qu’avant', 'Environ 5 % de moins', 'Environ 5 % de plus'],
    bonne: 1,
    explication: 'Tout coûte 5 % plus cher.',
  };

  it('accepte une question complète et calcule le score', () => {
    expect(lireQuiz([question])).toHaveLength(1);
    expect(scoreQuiz([question], [1])).toBe(100);
    expect(scoreQuiz([question, question], [1, 0])).toBe(50);
  });

  it('écarte une question mal formée sans casser la page', () => {
    expect(lireQuiz([{ ...question, bonne: 5 }])).toEqual([]);
    expect(lireQuiz([{ ...question, choix: ['Seul'] }])).toEqual([]);
    expect(lireQuiz('n’importe quoi')).toEqual([]);
    expect(lireQuiz(null)).toEqual([]);
    expect(QuizSchema.safeParse([question, question, question, question]).success).toBe(false);
  });
});

describe('leçon de départ', () => {
  const lecons = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  it('commence à la première pour un visiteur', () => {
    expect(leconDeDepart(lecons, new Set())).toEqual({ lecon: { id: 'a' }, reprise: false });
  });
  it('reprend à la première leçon non lue', () => {
    expect(leconDeDepart(lecons, new Set(['a']))).toEqual({ lecon: { id: 'b' }, reprise: true });
  });
  it('tout lu : retour à la première, sans « reprendre »', () => {
    expect(leconDeDepart(lecons, new Set(['a', 'b', 'c']))).toEqual({ lecon: { id: 'a' }, reprise: false });
  });
});

describe('corps d’une leçon', () => {
  const rendu = (md: string) => renderToStaticMarkup(<CorpsLecon markdown={md} />);
  /** Le même HTML, espaces insécables et trait d'union insécable ramenés à leur forme simple. */
  const plat = (md: string) => rendu(md).replace(/[\u00a0\u202f]/g, ' ').replace(/\u2011/g, '-');

  it('retire scripts, attributs dangereux et liens javascript:', () => {
    const html = rendu(
      'Texte <script>alert(1)</script><img src="x" onerror="alert(2)">\n\n<a href="javascript:alert(3)">piège</a> et <a href="https://exemple.org">source</a>',
    );
    expect(html).not.toMatch(/script|onerror|<img|javascript:/i);
    expect(html).toContain('piège');
    expect(html).toContain('href="https://exemple.org"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('les sections deviennent des H2 avec une ancre, les sous-sections des H3', () => {
    const html = plat('### Comment la mesurer ?\n\nTexte.\n\n#### Un détail\n\nSuite.');
    expect(html).toContain('<h2 id="comment-la-mesurer">Comment la mesurer ?</h2>');
    expect(html).toContain('<h3>Un détail</h3>');
  });

  it('la section « À retenir » devient un encadré', () => {
    const html = plat('Texte.\n\n### 3 points clés à retenir\n\n1. **Un** : premier.\n2. **Deux** : second.');
    expect(html).toMatch(/<aside aria-label="À retenir" class="retenir"><p class="retenir-titre">À retenir<\/p>/);
    expect(html).toContain('<ol>');
    expect(html).not.toContain('3 points clés');
  });

  it('« Le chiffre » devient le bandeau des grands chiffres, la dernière valeur en avant', () => {
    const html = plat(
      '<figure data-type="chiffre" data-titre="Le chiffre au Niger" data-legende="Les prix ont baissé." data-source="INS, avril 2026.">\n<data value="2024">+9,1 %</data>\n<data value="2025">−4,7 %</data>\n</figure>',
    );
    expect(html).toContain('<figure class="chiffre">');
    expect(html).toContain('<p class="chiffre-titre">Le chiffre au Niger</p>');
    expect(html).toContain('chiffre-valeurs-2');
    expect(html).toContain('<p class="chiffre-valeur chiffre-valeur-derniere">−4,7 %</p>');
    expect(html).toContain('<span class="chiffre-source">INS, avril 2026.</span>');
  });

  it('applique la typographie française aux textes', () => {
    const html = rendu("L'inflation : qu'est-ce que c'est ?");
    // « que » est un mot-outil : il reste collé au mot qui le suit. La fin de
    // phrase, elle, se règle à l'écran (AjusteurLignes).
    expect(html).toContain(`L’inflation${NB}: qu’est\u2011ce que${NB}c’est${FINE}?`);
  });

  it('soude les mots-outils à travers le gras, pas les fins de phrase', () => {
    const html = rendu('On parle ici des **actions cotées** chaque matin très tôt.');
    // « des » reste collé au mot en gras qui le suit.
    expect(html).toContain(`des${NB}<strong>actions`);
    // La fin de phrase reste sécable : elle se règle à l'écran, à la largeur réelle.
    expect(html).toContain('chaque matin très tôt.');
  });

  it('l’apostrophe devant un gras ou un lien devient typographique', () => {
    // Vu en production le 25/11/2026 : « avec l'indice des prix » gardait une apostrophe droite.
    const html = rendu("Elle se mesure avec l'**indice des prix** et d'[autres outils](/apprendre).");
    expect(html).toContain('l’<strong>indice');
    expect(html).toContain('d’<a href="/apprendre">autres');
    expect(html).not.toContain("'");
  });

  it('un lien « //autre-site » est refusé, un faux nfireport.com reste externe', () => {
    const md = 'Voir [ce site](//exemple.org/page) et [cet autre](https://nfireport.com.exemple.org/x).';
    const html = rendu(md);
    expect(html).not.toContain('href="//exemple.org');
    expect(plat(md)).toContain('Voir ce site et');
    expect(html).toContain('href="https://nfireport.com.exemple.org/x" target="_blank" rel="noopener noreferrer"');
  });

  it('chaque phrase d’un paragraphe a son span, l’espace ouvrant la suivante', () => {
    const md = 'Voyez M. Diallo à la banque. Puis signez le contrat. Fin.';
    expect(plat(md)).toContain(
      '<p><span class="phrase">Voyez M. Diallo à la banque.</span><span class="phrase"> Puis signez le contrat.</span><span class="phrase"> Fin.</span></p>',
    );
    // Une seule phrase : pas de span.
    expect(plat('Une seule phrase ici.')).toContain('<p>Une seule phrase ici.</p>');
  });

  it('un bloc de code garde ses retours à la ligne', () => {
    const html = rendu('```\nligne 1\nligne 2\n```');
    expect(html).toContain('<pre><code>ligne 1\nligne 2');
  });

  it('un intertitre rangé dans un bloc devient aussi un H2', () => {
    const html = rendu('<div><h1>Une section</h1><p>Texte de la section.</p></div>');
    expect(html).toContain('<h2 id="une-section">');
  });

  it('une cellule de tableau peut passer à la ligne : pas de longue soudure', () => {
    const html = rendu('<table><tbody><tr><td>Faire grandir la somme placée</td></tr></tbody></table>');
    expect(html).toContain('Faire grandir la');
  });
});

describe('ajustement des fins de ligne', () => {
  it('ne restaure que ses propres retouches (espaces devenues insécables)', () => {
    expect(estNotreRetouche('les bonnes occasions', `les${NB}bonnes${NB}occasions`)).toBe(true);
    expect(estNotreRetouche('les bonnes occasions', 'les bonnes occasions')).toBe(true);
    // React a réécrit le texte (nouvel état) : ce n'est plus notre version.
    expect(estNotreRetouche('Copier le lien', 'Lien copié !!!')).toBe(false);
    expect(estNotreRetouche('Leçon lue', 'Leçon vue')).toBe(false);
  });
});
