import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * IMAGES DE PARTAGE (Open Graph)
 *
 * Next 16 transmet les paramètres de la route sous forme de promesse. Les
 * images des articles et des catégories d'éducation les lisaient sans await :
 * le slug valait undefined, rien n'était trouvé, et chaque partage sur les
 * réseaux montrait le titre générique au lieu de celui de la page.
 */

const { getArticleBySlug, eq } = vi.hoisted(() => ({
  getArticleBySlug: vi.fn(async (slug: string) =>
    slug === 'budget-2027'
      ? { article: { title: 'Budget 2027 : ce qui change', category: 'Économie', excerpt: 'Les grandes lignes.' }, htmlBody: '' }
      : null,
  ),
  eq: vi.fn(),
}));

// L'image elle-même n'est pas dessinée : seul compte ce qu'on lui demande d'afficher.
vi.mock('next/og', () => ({
  ImageResponse: class {
    constructor(
      public element: unknown,
      public options: unknown,
    ) {}
  },
}));
vi.mock('@/lib/articles', () => ({ getArticleBySlug }));
vi.mock('@/lib/supabase', () => ({
  createServiceClient: () => {
    const requete = {
      select: () => requete,
      eq: (colonne: string, valeur: string) => {
        eq(colonne, valeur);
        return requete;
      },
      single: async () => ({
        data: { title: 'Gérer son budget', description: 'Les bases, pas à pas.' },
      }),
    };
    return { from: () => requete };
  },
}));

import ArticleOgImage from '@/app/articles/[slug]/opengraph-image';
import EducationOgImage from '@/app/education/[id]/opengraph-image';

/** Tout le texte d'un arbre d'éléments React, dans l'ordre. */
function texte(noeud: unknown): string {
  if (noeud === null || noeud === undefined || typeof noeud === 'boolean') return '';
  if (typeof noeud === 'string' || typeof noeud === 'number') return String(noeud);
  if (Array.isArray(noeud)) return noeud.map(texte).join(' ');
  const props = (noeud as { props?: { children?: unknown } }).props;
  return props ? texte(props.children) : '';
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Les images de partage montrent la page partagée', () => {
  it('article : le titre et la rubrique de l’article, pas le titre par défaut', async () => {
    const image = await ArticleOgImage({ params: Promise.resolve({ slug: 'budget-2027' }) });
    const contenu = texte((image as unknown as { element: unknown }).element);

    expect(getArticleBySlug).toHaveBeenCalledWith('budget-2027');
    expect(contenu).toContain('Budget 2027 : ce qui change');
    expect(contenu).toContain('ÉCONOMIE');
    expect(contenu).not.toContain('Actualités économiques et financières du Niger');
  });

  it('article introuvable : le titre par défaut, sans erreur', async () => {
    const image = await ArticleOgImage({ params: Promise.resolve({ slug: 'inconnu' }) });
    expect(texte((image as unknown as { element: unknown }).element)).toContain(
      'NFI Report · Actualités économiques et financières du Niger',
    );
  });

  it('éducation : la catégorie demandée, cherchée par son slug', async () => {
    const image = await EducationOgImage({ params: Promise.resolve({ id: 'budget-familial' }) });
    const contenu = texte((image as unknown as { element: unknown }).element);

    expect(eq).toHaveBeenCalledWith('slug', 'budget-familial');
    expect(contenu).toContain('Gérer son budget');
    expect(contenu).toContain('Les bases, pas à pas.');
  });
});
