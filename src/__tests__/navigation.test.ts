import { describe, it, expect } from 'vitest';
import {
  NAVIGATION,
  NAV_ENTRIES,
  NAV_GROUPS,
  FOOTER_ENTRIES,
  SITEMAP_ENTRIES,
  EDITORIAL_ENTRIES,
} from '@/lib/navigation';
import { SECTION_META } from '@/lib/sections';

/**
 * TAXONOMIE DE NAVIGATION
 *
 * La meme liste de rubriques etait recopiee a la main dans six fichiers, qui
 * avaient deja diverge : 7 entrees dans la barre, 6 dans SECTION_META, 6 dans le
 * selecteur admin, 7 dans le sitemap dont /outils mais pas /premium. Aucun test
 * ne protegeait cette coherence.
 */

describe('Regle d\'or : on renomme des LIBELLES, jamais des CHEMINS', () => {
  // Ce test est un CONTRAT. Si une modification le fait echouer, c'est qu'elle
  // casse des URL publiques, des liens externes et le referencement. La bonne
  // reaction est de revenir en arriere, pas de mettre a jour cette liste.
  const CHEMINS_FIGES = [
    '/economie',
    '/education',
    '/entreprises',
    '/finance',
    '/marches',
    '/niger',
    '/outils',
  ];

  it('l\'ensemble des chemins declares est exactement celui d\'origine', () => {
    expect(NAVIGATION.map((e) => e.path).sort()).toEqual(CHEMINS_FIGES);
  });

  it('chaque cle de section conserve son chemin d\'origine', () => {
    const attendu: Record<string, string> = {
      economie: '/economie',
      finance: '/finance',
      marches: '/marches',
      entreprises: '/entreprises',
      niger: '/niger',
      education: '/education',
      outils: '/outils',
    };
    for (const [cle, chemin] of Object.entries(attendu)) {
      expect(NAVIGATION.find((e) => e.key === cle)?.path).toBe(chemin);
    }
  });
});

describe('Barre de navigation cible : cinq entrees, deux registres', () => {
  it('expose exactement les cinq rubriques voulues, dans l\'ordre', () => {
    expect(NAV_ENTRIES.map((e) => e.label)).toEqual([
      'Économie',
      'Finance',
      'Entreprises',
      'Apprendre',
      'Simulateurs',
    ]);
  });

  it('« Apprendre » et « Simulateurs » sont de simples renommages, chemins inchanges', () => {
    expect(NAV_ENTRIES.find((e) => e.label === 'Apprendre')?.path).toBe('/education');
    expect(NAV_ENTRIES.find((e) => e.label === 'Simulateurs')?.path).toBe('/outils');
  });

  it('Économie et Finance portent le sous-titre qui les rend distinguables', () => {
    expect(NAVIGATION.find((e) => e.key === 'economie')?.subtitle).toBe('Le pays');
    expect(NAVIGATION.find((e) => e.key === 'finance')?.subtitle).toBe('Votre argent');
  });

  it('les entrees se repartissent en deux registres, separes par un filet', () => {
    expect(NAV_GROUPS).toHaveLength(2);
    expect(NAV_GROUPS[0]!.entries.map((e) => e.key)).toEqual(['economie', 'finance']);
    expect(NAV_GROUPS[1]!.entries.map((e) => e.key)).toEqual([
      'entreprises',
      'education',
      'outils',
    ]);
  });
});

describe('Marches et Niger sortent de la barre sans rien perdre', () => {
  it('ne figurent plus dans la barre principale', () => {
    expect(NAV_ENTRIES.map((e) => e.key)).not.toContain('marches');
    expect(NAV_ENTRIES.map((e) => e.key)).not.toContain('niger');
  });

  it('restent accessibles depuis le pied de page', () => {
    expect(FOOTER_ENTRIES.map((e) => e.key)).toContain('marches');
    expect(FOOTER_ENTRIES.map((e) => e.key)).toContain('niger');
  });

  it('restent indexees dans le sitemap : les pages ne sont ni retirees ni redirigees', () => {
    expect(SITEMAP_ENTRIES.map((e) => e.path)).toContain('/marches');
    expect(SITEMAP_ENTRIES.map((e) => e.path)).toContain('/niger');
  });

  it('« marches » reste une cle connue, mais son lien de tag pointe vers /finance', () => {
    // Retirer la cle aurait casse les liens de tag des articles deja publies.
    expect(SECTION_META.marches).toBeDefined();
    expect(SECTION_META.marches!.path).toBe('/finance');
    expect(SECTION_META.marches!.label).toBe('Marchés');
  });

  it('n\'est plus proposee a la redaction d\'un nouvel article', () => {
    expect(EDITORIAL_ENTRIES.map((e) => e.key)).not.toContain('marches');
  });
});

describe('Les fichiers derives ne peuvent plus diverger', () => {
  it('SECTION_META couvre toutes les rubriques, « outils » compris', () => {
    // « outils » manquait, ce qui privait les simulateurs de libelle et de lien
    // partout ou SECTION_META sert de reference.
    for (const entry of NAVIGATION) {
      expect(SECTION_META[entry.key]).toBeDefined();
    }
    expect(SECTION_META.outils).toBeDefined();
    expect(SECTION_META.outils!.path).toBe('/outils');
  });

  it('les simulateurs ne sont pas une rubrique editoriale', () => {
    // Un hub de simulateurs n'est pas une rubrique sous laquelle classer un
    // article. C'etait deja vrai de fait, mais par omission silencieuse.
    expect(NAVIGATION.find((e) => e.key === 'outils')?.isEditorial).toBe(false);
    expect(EDITORIAL_ENTRIES.map((e) => e.key)).not.toContain('outils');
  });

  it('aucune cle ni aucun chemin en double', () => {
    expect(new Set(NAVIGATION.map((e) => e.key)).size).toBe(NAVIGATION.length);
    expect(new Set(NAVIGATION.map((e) => e.path)).size).toBe(NAVIGATION.length);
  });

  it('aucun ordre en double, sinon l\'affichage devient non deterministe', () => {
    expect(new Set(NAVIGATION.map((e) => e.order)).size).toBe(NAVIGATION.length);
  });
});
