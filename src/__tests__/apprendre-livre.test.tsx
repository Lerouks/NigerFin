import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Cours, LeconResume } from '@/lib/apprendre/donnees';

/**
 * APPRENDRE, page d'un cours et page d'une leçon (choix de Raouf, 26/11/2026) :
 * page du cours sobre, « Titres seulement » (une ligne par leçon, sans résumé
 * ni figure), « À venir », Premium annoncé avant le clic. La progression du
 * lecteur est simulée.
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

const { suiteAVenir, titreAVenir } = await import('@/lib/apprendre/a-venir');
const { aVenirDuCours, assemblerThemes } = await import('@/lib/apprendre/donnees');
const { ancresDesParties } = await import('@/components/apprendre/PlanLecon');
const { ActionCours, SommaireDuCours } = await import('@/components/apprendre/SommaireDuCours');
const { rehypeLecon } = await import('@/lib/apprendre/rehype-lecon');

function lecon(id: string, numero: number, premium = false): LeconResume {
  return {
    id,
    slug: id,
    titre: `Leçon ${id}`,
    numero,
    premium,
    minutes: 3,
    publieeLe: '2026-11-25T10:00:00Z',
    nouvelle: false,
    href: `/apprendre/cours/${id}`,
    chapeau: 'Première phrase du résumé. Seconde phrase.',
    parties: ['Une partie', 'Une autre partie'],
  };
}

function cours(premiums: number[] = [], aVenir: Cours['aVenir'] = null, n = 9): Cours {
  return {
    id: 'c',
    slug: 'economie-niger',
    titre: 'Économie du Niger',
    description: 'Ce cours donne les clés pour lire l’économie du Niger.',
    numero: 3,
    minutes: n * 3,
    href: '/apprendre/economie-niger',
    lecons: Array.from({ length: n }, (_, i) => lecon(`l${i + 1}`, i + 1, premiums.includes(i + 1))),
    icone: 'Landmark',
    aVenir,
  };
}

const sommaire = (c: Cours) =>
  renderToStaticMarkup(
    <>
      <ActionCours cours={c} />
      <SommaireDuCours cours={c} />
    </>,
  );
const sansBalises = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\u00a0/g, ' ');

beforeEach(() => {
  progression.lues = new Set();
});

describe('« À venir », la formule choisie par Raouf', () => {
  it('« À venir : X, et 9 autres leçons. », d’un seul tenant à partir de « et »', () => {
    expect(suiteAVenir(10)).toBe(', et\u00a09\u00a0autres\u00a0leçons.');
    expect(suiteAVenir(2)).toBe(', et\u00a01\u00a0autre\u00a0leçon.');
    expect(suiteAVenir(1)).toBe('.');
  });

  it('seule à venir : les quatre derniers mots du titre restent avec le point final', () => {
    expect(titreAVenir('Droits des actionnaires en zone OHADA', 1)).toBe('Droits des actionnaires\u00a0en\u00a0zone\u00a0OHADA');
    expect(titreAVenir('Droits des actionnaires en zone OHADA', 3)).toBe('Droits des actionnaires en zone OHADA');
    expect(titreAVenir('Le marché des changes', 1)).toBe('Le\u00a0marché\u00a0des\u00a0changes');
  });

  it('la prochaine leçon dans l’ordre du cours, et leur nombre', () => {
    const lignes = [
      { category_id: 'c', title: 'Plus tard', sort_order: 5 },
      { category_id: 'c', title: 'Lire un graphique boursier', sort_order: 3 },
      { category_id: 'autre', title: 'Ailleurs', sort_order: 1 },
    ];
    expect(aVenirDuCours('c', lignes)).toEqual({ prochaine: 'Lire un graphique boursier', nombre: 2 });
    expect(aVenirDuCours('vide', lignes)).toBeNull();
  });
});

describe('assemblage d’un cours', () => {
  const lignesCours = [
    { id: 'a', slug: 'bases-finance', title: 'Les bases de la finance', description: null, sort_order: 1, icon: 'BookOpen' },
    { id: 'b', slug: 'economie-niger', title: 'Économie du Niger', description: null, sort_order: 2, icon: 'Landmark' },
  ];
  const contenu = 'Le PIB mesure la richesse produite. Sa variation est la croissance.\n\n### Qu’est-ce que le PIB ?\n\nTexte.\n\n### La croissance\n\nTexte.\n\n### À retenir\n\n1. **Un point**';
  const ligne = (id: string, cat: string) => ({
    id, category_id: cat, slug: id, title: id, access_level: 'free', sort_order: 1, content: contenu,
    published_at: '2026-11-25T10:00:00Z', updated_at: '2026-11-25T10:00:00Z', quiz: null,
  });

  it('chaque leçon porte son résumé et ses parties, sans « À retenir » ; le cours, son icône et « À venir »', () => {
    const themes = assemblerThemes(lignesCours, [ligne('l1', 'b')], Date.parse('2026-11-26'), [
      { category_id: 'b', title: 'Commerce international et balance des paiements', sort_order: 3 },
    ]);
    const c = themes[1]!.cours!;
    expect(c.icone).toBe('Landmark');
    expect(c.lecons[0]!.chapeau).toBe('Le PIB mesure la richesse produite. Sa variation est la croissance.');
    expect(c.lecons[0]!.parties).toEqual(['Qu’est-ce que le PIB ?', 'La croissance']);
    expect(c.aVenir).toEqual({ prochaine: 'Commerce international et balance des paiements', nombre: 1 });
    expect(themes[0]!.cours).toBeNull();
  });
});

describe('le sommaire du cours', () => {
  it('un visiteur : « Commencer la leçon 1 », puis une ligne par leçon, sans résumé ni parties', () => {
    const html = sommaire(cours([], { prochaine: 'Commerce international', nombre: 10 }));
    const texte = sansBalises(html);
    expect(texte).toContain('Commencer la leçon 1');
    expect(texte).toContain('Leçon l1');
    expect(texte).toContain('3 min');
    expect(texte).not.toContain('Première phrase du résumé.');
    expect(texte).not.toContain('Dans cette leçon');
    expect(texte).not.toContain('Thème suivant');
    expect(texte).toContain('À venir : Commerce international, et 9 autres leçons.');
    // Plus de carré noir dans la page du cours : seul le bouton est noir.
    expect(html.match(/bg-\[#111\]/g)?.length ?? 0).toBe(1);
  });

  it('trois leçons lues et la quatrième Premium : annoncée avant le clic, la prochaine libre proposée', () => {
    progression.lues = new Set(['l1', 'l2', 'l3']);
    const texte = sansBalises(sommaire(cours([4, 5, 8, 9])));
    expect(texte).toContain('Leçon 4 · Premium');
    expect(texte).toContain('Lire la leçon 6, en accès libre');
    expect(texte).toContain(', Premium');
    expect(texte).toContain(', lue');
  });

  it('une leçon déjà commencée : « Reprendre : leçon 2 »', () => {
    progression.lues = new Set(['l1']);
    expect(sansBalises(sommaire(cours([], null, 3)))).toContain('Reprendre : leçon 2');
  });

  it('tout lu : « Relire le cours »', () => {
    progression.lues = new Set(['l1', 'l2']);
    expect(sansBalises(sommaire(cours([], null, 2)))).toContain('Relire le cours');
  });
});

describe('le plan d’une leçon', () => {
  it('ses ancres sont celles que rehype-lecon donne aux intertitres', () => {
    const arbre = {
      type: 'root' as const,
      children: ['Qu’est-ce que le PIB ?', 'La croissance', 'La croissance'].map((t) => ({
        type: 'element' as const, tagName: 'h3', properties: {}, children: [{ type: 'text' as const, value: t }],
      })),
    };
    rehypeLecon()(arbre as never);
    const ids = (arbre.children as unknown as { properties: { id: string } }[]).map((n) => n.properties.id);
    expect(ancresDesParties(['Qu’est-ce que le PIB ?', 'La croissance', 'La croissance'])).toEqual(ids);
  });
});
