import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * La liste déroulante « Apprendre » du menu : avec dix thèmes ouverts
 * (25/11/2026), un titre par ligne, pour rester moins haute que l'écran.
 */

const donnees = vi.hoisted(() => ({ cours: [] as unknown[] }));

vi.mock('next/cache', () => ({ unstable_cache: <T,>(f: T) => f }));
vi.mock('@/lib/apprendre/donnees', () => ({ getCours: async () => donnees.cours }));

const { getMenuApprendre } = await import('@/lib/menu-apprendre');

function cours(i: number) {
  return {
    id: `c${i}`,
    slug: `cours-${i}`,
    titre: `Cours ${i}`,
    description: '',
    numero: i,
    minutes: 6,
    href: `/apprendre/cours-${i}`,
    lecons: [
      { id: `l${i}a`, slug: 'a', titre: 'Première leçon', numero: 1, premium: false, minutes: 3, publieeLe: '', nouvelle: false, href: `/apprendre/cours-${i}/a` },
      { id: `l${i}b`, slug: 'b', titre: 'Deuxième leçon', numero: 2, premium: true, minutes: 3, publieeLe: '', nouvelle: false, href: `/apprendre/cours-${i}/b` },
    ],
  };
}

beforeEach(() => {
  donnees.cours = [];
});

describe('menu Apprendre', () => {
  it('jusqu’à quatre cours, chaque cours dit son nombre de leçons et sa durée', async () => {
    donnees.cours = [cours(1), cours(2)];
    const menu = await getMenuApprendre();
    expect(menu.cours).toHaveLength(2);
    expect(menu.cours[0]!.detail).toBe('2 leçons · 6 min');
    expect(menu.pourCommencer.map((l) => l.premium)).toEqual([false, true]);
    expect(menu.lecons).toBe(4);
  });

  it('au-delà de quatre cours, un titre par ligne', async () => {
    donnees.cours = Array.from({ length: 10 }, (_, i) => cours(i + 1));
    const menu = await getMenuApprendre();
    expect(menu.cours).toHaveLength(10);
    expect(menu.cours.every((c) => c.detail === undefined)).toBe(true);
    expect(menu.lecons).toBe(20);
  });

  it('sans cours ouvert, le menu vide', async () => {
    const menu = await getMenuApprendre();
    expect(menu).toEqual({ cours: [], pourCommencer: [], lecons: 0 });
  });
});
