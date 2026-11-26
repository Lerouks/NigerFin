import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * APPRENDRE, page d'un cours (choix de Raouf, 26/11/2026) : les leçons
 * s'ouvrent dans la page (maquette « Grand format »), chacune tient en une
 * minute (« une phrase d'entrée, trois idées, une phrase de fin, puis la
 * question »), « À venir », et les thèmes regroupés de 10 à 5.
 */

vi.mock('next/cache', () => ({ unstable_cache: <T,>(f: T) => f }));
vi.mock('@/lib/supabase', () => ({ createServiceClient: () => null }));
vi.mock('@/components/apprendre/progression', async () => {
  const { leconDeDepart } = await import('@/lib/apprendre/lecture');
  return { leconDeDepart, useProgression: () => ({ connecte: false, chargement: false, lues: new Set<string>(), enregistrer: async () => {} }) };
});

const { suiteAVenir, titreAVenir } = await import('@/lib/apprendre/a-venir');
const { aVenirDuCours, apercuPremium, assemblerThemes, cheminLecon } = await import('@/lib/apprendre/donnees');
const { decouperIdees } = await import('@/lib/apprendre/lecture');
const { adresseDuThemeRegroupe } = await import('@/lib/apprendre/anciens-cours');
const { CorpsCourt } = await import('@/components/apprendre/CorpsCourt');
const { LeconsDuCours } = await import('@/components/apprendre/LeconsDuCours');

const sansBalises = (html: string) => html.replace(/<[^>]+>/g, '').replace(/[\u00a0\u202f]/g, ' ');

const COURTE = [
  "1. **L'argent a une valeur dans le temps.** Un franc disponible aujourd'hui peut être placé et rapporter.",
  '2. **Le risque va avec le rendement.** Plus un placement promet de rapporter, plus il est risqué.',
  "3. **La liquidité compte.** L'argent d'un compte courant se retire tout de suite.",
  '',
  'Comprendre ces idées aide à tenir un budget.',
].join('\n');

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

describe('une leçon d’une minute', () => {
  it('trois idées, chacune sa phrase en gras et son explication, puis la phrase de fin', () => {
    const l = decouperIdees(COURTE)!;
    expect(l.idees).toHaveLength(3);
    expect(l.idees[0]).toEqual({ titre: "L'argent a une valeur dans le temps.", texte: "Un franc disponible aujourd'hui peut être placé et rapporter." });
    expect(l.fin).toBe('Comprendre ces idées aide à tenir un budget.');
  });

  it('un corps écrit autrement (intertitres, tableau) n’est pas découpé', () => {
    expect(decouperIdees('### Une partie\n\nTexte.')).toBeNull();
    expect(decouperIdees('1. **A.** a\n2. b sans gras')).toBeNull();
    expect(decouperIdees(`${COURTE}\n\n| a | b |`)).toBeNull();
  });

  it('Premium : rien de plus que la phrase d’entrée pour un non-abonné', () => {
    expect(apercuPremium(COURTE)).toBe('');
    expect(apercuPremium('### Partie\n\nTexte libre.\n\n### Suite\n\nTexte réservé.')).toBe('### Partie\n\nTexte libre.');
  });

  it('le rendu : trois idées numérotées, la phrase de fin, et l’ancien format rendu tel quel', () => {
    const html = renderToStaticMarkup(<CorpsCourt corps={COURTE} />);
    expect(html.match(/<li/g)).toHaveLength(3);
    expect(sansBalises(html)).toContain('Le risque va avec le rendement.');
    expect(sansBalises(html)).toContain('Comprendre ces idées aide à tenir un budget.');
    expect(sansBalises(renderToStaticMarkup(<CorpsCourt corps={'### Une partie\n\nTexte.'} />))).toContain('Une partie');
  });
});

describe('les leçons s’ouvrent dans la page du cours', () => {
  const lecons = [
    { id: 'a', slug: 'qu-est-ce-que-la-finance', numero: 1, titre: 'Qu’est-ce que la finance ?', premium: false, chapeau: 'La finance étudie la façon dont on gère l’argent.' },
    { id: 'b', slug: 'les-taux-d-interet', numero: 4, titre: 'Les taux d’intérêt', premium: true, chapeau: 'Le taux d’intérêt est le prix de l’argent.' },
  ];
  const html = renderToStaticMarkup(
    <LeconsDuCours lecons={lecons}>
      <p>Contenu A</p>
      <p>Contenu B</p>
    </LeconsDuCours>,
  );

  it('une ligne par leçon, numérotée 01, 04, fermée au départ, avec son contenu dans la page', () => {
    expect(sansBalises(html)).toContain('01');
    expect(sansBalises(html)).toContain('04');
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(2);
    expect(html).toContain('aria-controls="lecon-qu-est-ce-que-la-finance"');
    expect(html).toContain('id="lecon-qu-est-ce-que-la-finance"');
    expect(html).toContain('Contenu A');
    expect(html).toContain('Contenu B');
  });

  it('la leçon Premium porte son cadenas, dit aux lecteurs d’écran ; la phrase d’entrée sert d’aperçu au survol', () => {
    expect(sansBalises(html)).toContain(', Premium');
    expect(sansBalises(html)).toContain('Le taux d’intérêt est le prix de l’argent.');
  });

  it('plus de « Leçon suivante » : la suivante est juste en dessous', () => {
    expect(sansBalises(html)).not.toContain('Leçon suivante');
  });

  it('l’adresse d’une leçon est celle de son cours, ouverte sur elle', () => {
    expect(cheminLecon('bases-finance', 'qu-est-ce-que-la-finance')).toBe('/apprendre/bases-finance#qu-est-ce-que-la-finance');
  });
});

describe('les thèmes regroupés (10 devenus 5)', () => {
  it('l’ancienne adresse d’un thème mène au thème qui l’a repris ; Immobilier, retiré, mène à Apprendre', () => {
    expect(adresseDuThemeRegroupe('devises-change')).toBe('/apprendre/economie-monnaie');
    expect(adresseDuThemeRegroupe('crypto-blockchain')).toBe('/apprendre/bourse-crypto');
    expect(adresseDuThemeRegroupe('assurance-prevoyance')).toBe('/apprendre/budget-assurance');
    expect(adresseDuThemeRegroupe('fiscalite-droit')).toBe('/apprendre/entreprise-impots');
    expect(adresseDuThemeRegroupe('immobilier')).toBe('/apprendre');
  });

  it('un thème qui existe, ou une adresse quelconque, ne redirige pas', () => {
    expect(adresseDuThemeRegroupe('bases-finance')).toBeNull();
    expect(adresseDuThemeRegroupe('constructor')).toBeNull();
  });
});
