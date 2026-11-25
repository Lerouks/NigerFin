import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SectionArticlesFiltered } from '@/components/SectionArticlesFiltered';
import {
  CHOIX_PAR_DEFAUT,
  choixProposes,
  filtrerArticles,
  libelleAfficher,
  libelleNombre,
  nombreDeChoixActifs,
  resumeDesChoix,
} from '@/lib/filtres-articles';
import type { Article } from '@/types';

/**
 * Barre « Trier et filtrer » des rubriques, maquette B choisie le 25/11/2026 :
 * une ligne (nombre d'articles, un bouton) qui ouvre un panneau, et seulement
 * les choix qui changent vraiment la liste.
 */

function article(
  id: string,
  { premium = false, minutes = 3, sections = ['economie'], jour = 1 }: { premium?: boolean; minutes?: number; sections?: string[]; jour?: number } = {},
): Article {
  return {
    _id: id,
    slug: { current: id },
    title: `Article ${id}`,
    excerpt: 'Un chapô.',
    category: sections[0] ?? 'economie',
    sections,
    author: { name: 'NFI Report', avatar: null },
    publishedAt: `2026-04-${String(jour).padStart(2, '0')}T10:00:00Z`,
    mainImage: null,
    body: [],
    isPremium: premium,
    readTime: minutes,
    tags: [],
  };
}

/** Le texte lu, balises retirées, insécables ramenées à des espaces. */
function texte(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, '’')
    .replace(/&amp;/g, '&')
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Économie le 25/11/2026 : six articles gratuits, tous de moins de 5 minutes.
const ECONOMIE = [1, 2, 3, 4, 5, 6].map((j) => article(`e${j}`, { jour: j }));
// Finance le 25/11/2026 : deux gratuits (dont un « marchés ») et un Premium.
const FINANCE = [
  article('f1', { sections: ['economie', 'finance'], jour: 15 }),
  article('f2', { sections: ['marches', 'economie', 'finance'], jour: 7 }),
  article('f3', { sections: ['finance'], premium: true, jour: 3 }),
];
const MARCHES = [{ key: 'marches', label: 'Marchés et BRVM' }];

describe('choix proposés : seulement ce qui change la liste', () => {
  it('Économie : ni type, ni durée, ni thème, et le tri sans « Les plus lus » faute de lectures', () => {
    const p = choixProposes(ECONOMIE, [], []);
    expect(p.themes).toEqual([]);
    expect(p.acces).toEqual([]);
    expect(p.durees).toEqual([]);
    expect(p.tris.map((o) => o.libelle)).toEqual(['Plus récents', 'Plus anciens']);
  });

  it('« Les plus lus » revient dès que des lectures sont comptées pour la rubrique', () => {
    expect(choixProposes(ECONOMIE, [], ['e3']).tris.map((o) => o.valeur)).toEqual(['recents', 'anciens', 'lus']);
    expect(choixProposes(ECONOMIE, [], ['ailleurs']).tris.map((o) => o.valeur)).toEqual(['recents', 'anciens']);
  });

  it('Finance : le thème et le type, puisque la rubrique a des deux', () => {
    const p = choixProposes(FINANCE, MARCHES, []);
    expect(p.themes.map((o) => o.libelle)).toEqual(['Tous les sujets', 'Marchés et BRVM']);
    expect(p.acces.map((o) => o.libelle)).toEqual(['Tous', 'Gratuits', 'Premium']);
    expect(p.durees).toEqual([]);
  });

  it('une facette qui regroupe tous les articles ne change rien : pas de thème', () => {
    const tousMarches = FINANCE.map((a) => ({ ...a, sections: ['marches', 'finance'] }));
    expect(choixProposes(tousMarches, MARCHES, []).themes).toEqual([]);
  });

  it('la durée n’apparaît qu’avec deux tranches, et seulement les tranches remplies', () => {
    const melange = [article('a', { minutes: 3 }), article('b', { minutes: 12 })];
    expect(choixProposes(melange, [], []).durees.map((o) => o.valeur)).toEqual(['toutes', 'courts', 'longs']);
  });

  it('un seul article : rien à trier', () => {
    expect(choixProposes([article('seul')], [], ['seul']).tris).toEqual([]);
  });
});

describe('filtrer et trier', () => {
  it('combine thème, type et durée', () => {
    const r = filtrerArticles(FINANCE, { ...CHOIX_PAR_DEFAUT, theme: 'marches', acces: 'gratuits' });
    expect(r.map((a) => a._id)).toEqual(['f2']);
    expect(filtrerArticles(FINANCE, { ...CHOIX_PAR_DEFAUT, theme: 'marches', acces: 'premium' })).toEqual([]);
  });

  it('trie du plus récent au plus ancien par défaut, et l’inverse sur demande', () => {
    expect(filtrerArticles(FINANCE, CHOIX_PAR_DEFAUT).map((a) => a._id)).toEqual(['f1', 'f2', 'f3']);
    expect(filtrerArticles(FINANCE, { ...CHOIX_PAR_DEFAUT, tri: 'anciens' }).map((a) => a._id)).toEqual(['f3', 'f2', 'f1']);
  });

  it('« Les plus lus » suit le classement des lectures', () => {
    const r = filtrerArticles(FINANCE, { ...CHOIX_PAR_DEFAUT, tri: 'lus' }, ['f3', 'f1']);
    expect(r.map((a) => a._id)).toEqual(['f3', 'f1', 'f2']);
  });
});

describe('textes de la barre', () => {
  it('compte les articles, avec une insécable entre le nombre et le mot', () => {
    expect(libelleNombre(6, 6)).toBe('6\u00a0articles');
    expect(libelleNombre(1, 1)).toBe('1\u00a0article');
    expect(libelleNombre(2, 6)).toBe('2\u00a0articles sur 6');
    expect(libelleNombre(0, 6)).toBe('Aucun article');
  });

  it('résume ce qui est appliqué, en minuscules après le premier mot sauf « Premium »', () => {
    expect(resumeDesChoix({ ...CHOIX_PAR_DEFAUT, acces: 'gratuits', tri: 'lus' }, MARCHES)).toBe('Gratuits, les plus lus');
    expect(resumeDesChoix({ ...CHOIX_PAR_DEFAUT, theme: 'marches', acces: 'premium', duree: 'courts' }, MARCHES)).toBe(
      'Marchés et BRVM, Premium, moins de 5\u00a0min',
    );
    expect(resumeDesChoix(CHOIX_PAR_DEFAUT, MARCHES)).toBe('');
  });

  it('compte les choix actifs et nomme le bouton du panneau', () => {
    expect(nombreDeChoixActifs(CHOIX_PAR_DEFAUT)).toBe(0);
    expect(nombreDeChoixActifs({ ...CHOIX_PAR_DEFAUT, acces: 'gratuits', tri: 'lus' })).toBe(2);
    expect(libelleAfficher(0)).toBe('Aucun article');
    expect(libelleAfficher(1)).toBe('Afficher l’article');
    expect(libelleAfficher(6)).toBe('Afficher les 6\u00a0articles');
  });
});

describe('la barre sur la page', () => {
  const rendu = (articles: Article[], facets = [] as typeof MARCHES) =>
    renderToStaticMarkup(
      <SectionArticlesFiltered articles={articles} total={articles.length} sectionLabel="Essai" sectionPath="/essai" facets={facets} />,
    );

  it('Économie : une ligne, “6 articles” et un bouton “Trier”, sans panneau collé à gauche', () => {
    const html = rendu(ECONOMIE);
    expect(texte(html)).toMatch(/^6 articles Trier /);
    expect(html).not.toContain('<aside');
    expect(html).not.toContain('role="dialog"');
    expect(html).toContain('aria-haspopup="dialog"');
  });

  it('Finance : le bouton s’appelle “Trier et filtrer”', () => {
    expect(texte(rendu(FINANCE, MARCHES))).toMatch(/^3 articles Trier et filtrer /);
  });

  it('un seul article : le nombre, sans bouton', () => {
    const html = rendu([article('seul')]);
    expect(texte(html)).toMatch(/^1 article /);
    expect(html).not.toContain('aria-haspopup');
  });

  it('une rubrique vide le dit en une phrase', () => {
    expect(texte(rendu([]))).toBe('Aucun article dans cette rubrique pour l’instant. De nouveaux contenus arrivent bientôt.');
  });

  it('le bouton fait au moins 44 px de haut', () => {
    const bouton = rendu(FINANCE, MARCHES).match(/<button[^>]*aria-haspopup="dialog"[^>]*>/)?.[0] ?? '';
    expect(bouton).toContain('h-11');
  });

  it('Finance écrit “Marchés et BRVM”, jamais “&”', () => {
    const source = readFileSync('src/app/finance/page.tsx', 'utf8');
    expect(source).toContain("label: 'Marchés et BRVM'");
    expect(source).not.toContain('Marchés & BRVM');
  });
});
