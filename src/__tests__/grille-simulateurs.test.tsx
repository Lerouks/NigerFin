import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SIMULATEURS_MENU } from '@/lib/navigation';
import { GrilleSimulateurs } from '@/components/simulateurs/GrilleSimulateurs';

const auth = vi.hoisted(() => ({ isLoading: false, userRole: null as string | null }));
vi.mock('@/lib/auth-context', () => ({ useAuth: () => auth }));

import { OffrePremiumSimulateurs, phraseSimulateursPremium } from '@/components/simulateurs/OffrePremiumSimulateurs';

/**
 * Page Simulateurs refaite le 25/11/2026 : six carrés noirs à la place des
 * cartes « Plan gratuit » et « Plan Premium ».
 */
const liens = (html: string) =>
  [...html.matchAll(/<a\s[^>]*>/g)].map((m) => ({
    href: m[0].match(/\bhref="([^"]+)"/)?.[1] ?? '',
    nom: (m[0].match(/\baria-label="([^"]+)"/)?.[1] ?? '').replace(/&#x27;/g, "'"),
  }));
const texte = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;|&rsquo;/g, '’').replace(/\s+/g, ' ');

describe('La grille des simulateurs', () => {
  const html = renderToStaticMarkup(<GrilleSimulateurs />);

  it('montre chaque simulateur du menu, avec sa nouvelle adresse, dans le même ordre', () => {
    expect(liens(html).map((l) => l.href)).toEqual(SIMULATEURS_MENU.map((s) => s.href));
    for (const l of liens(html)) expect(l.href).toMatch(/^\/simulateurs\/[a-z-]+$/);
  });

  it('dit Premium ou gratuit pour chacun, comme le menu, et commence par son nom', () => {
    const trouves = liens(html);
    SIMULATEURS_MENU.forEach((s, i) => {
      expect(trouves[i]!.nom.startsWith(`${s.label},`)).toBe(true);
      expect(trouves[i]!.nom).toContain(s.premium ? 'Premium' : 'gratuit');
    });
  });

  it('n’emploie plus le mot « outil » ni l’idée de « plan »', () => {
    expect(texte(html)).not.toMatch(/outil|plan gratuit|plan premium/i);
  });
});

describe('La ligne de l’offre Premium sous la grille', () => {
  it('compte les simulateurs réservés depuis le menu et mène à l’offre', () => {
    auth.isLoading = false;
    auth.userRole = null;
    const nombre = SIMULATEURS_MENU.filter((s) => s.premium).length;
    const html = renderToStaticMarkup(<OffrePremiumSimulateurs />);
    expect(texte(html)).toContain(phraseSimulateursPremium(nombre).replace(/ /g, ' ').split(' ')[0]!);
    expect(texte(html)).toMatch(/réservés? aux abonnés Premium/);
    expect(html).toContain('href="/pricing"');
  });

  it('accorde la phrase au nombre', () => {
    expect(phraseSimulateursPremium(1)).toBe('Un simulateur est réservé aux abonnés Premium.');
    expect(phraseSimulateursPremium(3)).toBe('Trois simulateurs sont réservés aux abonnés Premium.');
    expect(phraseSimulateursPremium(0)).toBe('');
  });

  it('disparaît pour un abonné Premium et pour un admin', () => {
    auth.isLoading = false;
    for (const role of ['premium', 'admin']) {
      auth.userRole = role;
      expect(renderToStaticMarkup(<OffrePremiumSimulateurs />)).toBe('');
    }
  });

  it('reste visible pendant le chargement de la session (rendu serveur compris)', () => {
    auth.isLoading = true;
    auth.userRole = null;
    expect(renderToStaticMarkup(<OffrePremiumSimulateurs />)).toContain('href="/pricing"');
  });
});
