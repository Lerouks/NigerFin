import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Cours, Theme } from '@/lib/apprendre/donnees';

/**
 * APPRENDRE, la page d'entrée en damier (25/11/2026) : un carré par thème,
 * ouvert s'il a au moins une leçon publiée, grisé avec « En préparation »
 * sinon. La progression du lecteur est simulée.
 */

const progression = vi.hoisted(() => ({ lues: new Set<string>() }));

vi.mock('next/cache', () => ({ unstable_cache: <T,>(f: T) => f }));
vi.mock('@/lib/supabase', () => ({ createServiceClient: () => null }));
vi.mock('@/components/apprendre/progression', async () => {
  const { leconDeDepart } = await import('@/lib/apprendre/lecture');
  return {
    leconDeDepart,
    useProgression: () => ({ connecte: progression.lues.size > 0, chargement: false, lues: progression.lues, enregistrer: async () => {} }),
  };
});

const { DamierThemes } = await import('@/components/apprendre/DamierThemes');
const { assemblerThemes } = await import('@/lib/apprendre/donnees');

function cours(slug: string, ids: string[]): Cours {
  return {
    id: `c-${slug}`,
    slug,
    titre: slug,
    description: '',
    numero: 1,
    minutes: ids.length * 3,
    href: `/apprendre/${slug}`,
    lecons: ids.map((id, i) => ({
      id,
      slug: id,
      titre: id,
      numero: i + 1,
      premium: false,
      minutes: 3,
      publieeLe: '2026-11-25T10:00:00Z',
      nouvelle: false,
      href: `/apprendre/${slug}/${id}`,
    })),
  };
}

function theme(slug: string, titre: string, lecons: string[] | null, icone = 'TrendingUp'): Theme {
  return { id: `t-${slug}`, slug, titre, icone, cours: lecons ? cours(slug, lecons) : null };
}

const rendu = (themes: Theme[]) => renderToStaticMarkup(<DamierThemes themes={themes} />);

beforeEach(() => {
  progression.lues = new Set();
});

describe('assemblage des thèmes', () => {
  const lignesCours = [
    { id: 'a', slug: 'bases', title: 'Les bases de la finance', description: null, sort_order: 1, icon: 'BookOpen' },
    { id: 'b', slug: 'bourse', title: 'Bourse et investissement', description: null, sort_order: 2, icon: null },
  ];
  const lecon = { slug: 'l1', title: 'Qu’est-ce que la finance ?', access_level: 'free', sort_order: 1, content: 'Un texte.', published_at: '2026-11-25T10:00:00Z', updated_at: '2026-11-25T10:00:00Z', quiz: null };

  it('garde tous les thèmes dans l’ordre, ouverts ou non', () => {
    const themes = assemblerThemes(lignesCours, [{ ...lecon, id: 'l1', category_id: 'a' }], Date.parse('2026-11-26'));
    expect(themes.map((t) => t.slug)).toEqual(['bases', 'bourse']);
    expect(themes[0]!.cours?.lecons).toHaveLength(1);
    expect(themes[1]!.cours).toBeNull();
  });

  it('sans icône choisie, le livre ouvert par défaut', () => {
    const themes = assemblerThemes(lignesCours, [], Date.parse('2026-11-26'));
    expect(themes[1]!.icone).toBe('BookOpen');
  });
});

describe('le damier', () => {
  it('un thème ouvert mène à son cours, un thème vide est grisé sans lien', () => {
    const html = rendu([theme('bases', 'Les bases de la finance', ['a', 'b']), theme('bourse', 'Bourse et investissement', null)]);
    expect(html).toContain('href="/apprendre/bases"');
    expect(html).not.toContain('href="/apprendre/bourse"');
    expect(html).toContain('En préparation');
    expect(html).toContain('Commencer');
    expect(html).toContain('2\u00a0leçons · 6\u00a0min');
  });

  it('pour un lecteur : « Reprendre » et la barre de progression, puis « Terminé »', () => {
    progression.lues = new Set(['a']);
    const enCours = rendu([theme('bases', 'Les bases de la finance', ['a', 'b'])]);
    expect(enCours).toContain('Reprendre');
    expect(enCours).toContain('1 lue sur 2');
    progression.lues = new Set(['a', 'b']);
    const fini = rendu([theme('bases', 'Les bases de la finance', ['a', 'b'])]);
    expect(fini).toContain('Terminé');
    expect(fini).toContain('Relire');
  });

  it('dix thèmes : sur tablette, le dixième seul sur sa rangée prend toute la largeur', () => {
    const dix = Array.from({ length: 10 }, (_, i) => theme(`t${i}`, `Thème ${i}`, ['x']));
    const html = rendu(dix);
    expect(html.match(/sm:col-span-3/g)).toHaveLength(1);
    expect(html).not.toMatch(/(?<![a-z:])col-span-2/);
  });

  it('une icône inconnue ne casse pas la page', () => {
    expect(() => rendu([theme('x', 'Thème', ['a'], 'IconeInconnue')])).not.toThrow();
  });
});
