import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ContenuBandeauCookies } from '@/components/CookieBanner';
import { BoutonChoixCookies } from '@/components/BoutonChoixCookies';
import { Footer } from '@/components/Footer';
import { OUVRIR_CHOIX_COOKIES, ouvrirChoixCookies, retraitDAccord } from '@/lib/consent';

/**
 * Le bandeau des cookies, version « bandeau » choisie le 25/11/2026 : une phrase,
 * deux boutons de même taille, et un lien du pied de page pour changer d'avis.
 * Refuser doit rester aussi simple qu'accepter, et retirer son accord aussi
 * simple que le donner.
 */

/** Le texte lu, balises retirées, insécables ramenées à des espaces. */
function texte(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, '’')
    .replace(/&amp;/g, '&')
    .replace(/[  ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Les classes de chaque bouton, dans l'ordre de la page. */
function classesDesBoutons(html: string): { libelle: string; classes: string[] }[] {
  return Array.from(html.matchAll(/<button[^>]*class="([^"]*)"[^>]*>([^<]*)<\/button>/g)).map((m) => ({
    libelle: (m[2] ?? '').trim(),
    classes: (m[1] ?? '').split(/\s+/),
  }));
}

describe('bandeau des cookies', () => {
  const html = renderToStaticMarkup(<ContenuBandeauCookies onChoix={() => undefined} />);

  it('dit à quoi servent les cookies, et le mot « cookies » mène à leur politique', () => {
    expect(texte(html)).toBe('On utilise des cookies pour mesurer l’audience. Refuser Accepter');
    const lien = html.match(/<a [^>]*>cookies<\/a>/)?.[0] ?? '';
    expect(lien).toContain('href="/cookies"');
    expect(lien).toContain('aria-label="En savoir plus sur les cookies"');
  });

  it('propose exactement deux choix, sans croix ni icône', () => {
    const boutons = classesDesBoutons(html);
    expect(boutons.map((b) => b.libelle)).toEqual(['Refuser', 'Accepter']);
    expect(html).not.toContain('<svg');
  });

  it('donne à Refuser la même taille qu’à Accepter, au moins 44 px de haut', () => {
    const [refuser, accepter] = classesDesBoutons(html);
    const taille = (c: string[]) => c.filter((k) => /^(h-|px-|text-\[\d|md:min-w-|rounded)/.test(k)).sort();
    expect(taille(refuser?.classes ?? [])).toEqual(taille(accepter?.classes ?? []));
    expect(refuser?.classes).toContain('h-11');
  });

  it('coupe la phrase en deux moitiés soudées, jamais « l’audience. » seul', () => {
    const groupes = Array.from(html.matchAll(/<span class="whitespace-nowrap">(.*?)<\/span>(?= |$|<\/p>)/g));
    expect(groupes).toHaveLength(2);
    expect(texte(groupes[1]?.[1] ?? '')).toBe('pour mesurer l’audience.');
  });
});

describe('changer d’avis', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retirer un accord déjà donné demande de recharger la page, et seulement ce cas', () => {
    expect(retraitDAccord('accepted', 'rejected')).toBe(true);
    expect(retraitDAccord(null, 'rejected')).toBe(false);
    expect(retraitDAccord('rejected', 'rejected')).toBe(false);
    expect(retraitDAccord('rejected', 'accepted')).toBe(false);
    expect(retraitDAccord('accepted', 'accepted')).toBe(false);
  });

  it('le lien du pied de page rouvre le bandeau', () => {
    const fenetre = new EventTarget();
    const ecouteur = vi.fn();
    fenetre.addEventListener(OUVRIR_CHOIX_COOKIES, ecouteur);
    vi.stubGlobal('window', fenetre);
    ouvrirChoixCookies();
    expect(ecouteur).toHaveBeenCalledTimes(1);
  });

  it('« Choix des cookies » est un vrai bouton, rangé à côté de « Cookies » dans le pied de page', () => {
    expect(renderToStaticMarkup(<BoutonChoixCookies />)).toBe(
      '<button type="button">Choix des cookies</button>',
    );
    const pied = texte(renderToStaticMarkup(<Footer />));
    expect(pied).toContain('Confidentialité Cookies Choix des cookies CGU Plan du site');
  });
});
