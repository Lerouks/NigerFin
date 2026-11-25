import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * FICHES ENTREPRISES (refonte du 25/11/2026, direction « Dans la famille Niger »)
 *
 * Ce qui doit tenir sur les sept fiches : aucun point clé qui répète la ligne
 * de l'entreprise, un lien « Site officiel » qui ne peut être qu'une adresse
 * web, les logos sur noir et les photos réellement présents avec les bonnes
 * dimensions, la rubrique Niger allumée dans le menu, et une image de partage
 * qui montre l'entreprise partagée.
 */

const { single, fetchMock } = vi.hoisted(() => ({
  single: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock('next/og', () => ({
  ImageResponse: class {
    constructor(
      public element: unknown,
      public options: unknown,
    ) {}
  },
}));
vi.mock('@/lib/supabase', () => ({
  createServiceClient: () => {
    const requete = { select: () => requete, eq: () => requete, single };
    return { from: () => requete };
  },
}));

import {
  PHOTO_ENTREPRISE,
  logoSurNoir,
  pointsSansRepetition,
  siteOfficiel,
} from '@/data/entreprises-niger';
import { villeSurLaCarte } from '@/components/niger/CarteSiege';
import { NAVIGATION, estRubriqueActive } from '@/lib/navigation';
import EnterpriseOgImage from '@/app/entreprises/[slug]/opengraph-image';

const PUBLIC = join(process.cwd(), 'public');

/** Largeur et hauteur d'un JPEG, lues dans son en-tête (segment SOF). */
function dimensionsJpeg(fichier: string): { largeur: number; hauteur: number } {
  const octets = readFileSync(fichier);
  let i = 2;
  while (i < octets.length) {
    if (octets[i] !== 0xff) throw new Error('JPEG illisible');
    const marqueur = octets[i + 1]!;
    const longueur = octets.readUInt16BE(i + 2);
    if (marqueur >= 0xc0 && marqueur <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marqueur)) {
      return { hauteur: octets.readUInt16BE(i + 5), largeur: octets.readUInt16BE(i + 7) };
    }
    i += 2 + longueur;
  }
  throw new Error('Dimensions introuvables');
}

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
  vi.stubGlobal('fetch', fetchMock);
});

describe('Points clés', () => {
  it('le point qui répète la ligne de l’entreprise disparaît (SONIBANK)', () => {
    const points = [
      { label: 'Type', value: 'Banque commerciale' },
      { label: 'Agences', value: 'Grandes villes' },
      { label: 'Métiers', value: 'Détail, entreprises' },
    ];
    expect(pointsSansRepetition(points, 'Banque commerciale').map((p) => p.label)).toEqual(['Agences', 'Métiers']);
  });

  it('trois points au plus, et jamais de point vide', () => {
    const points = [
      { label: 'A', value: '1' },
      { label: '', value: '2' },
      { label: 'C', value: '' },
      { label: 'D', value: '4' },
      { label: 'E', value: '5' },
      { label: 'F', value: '6' },
    ];
    expect(pointsSansRepetition(points, null).map((p) => p.label)).toEqual(['A', 'D', 'E']);
    expect(pointsSansRepetition(null, 'x')).toEqual([]);
  });
});

describe('Lien du site officiel', () => {
  it('une adresse web devient un lien lisible', () => {
    expect(siteOfficiel('https://www.nigelec.ne')).toEqual({ url: 'https://www.nigelec.ne/', libelle: 'nigelec.ne' });
    expect(siteOfficiel('https://www.sopamin-sa.com/')?.libelle).toBe('sopamin-sa.com');
  });

  it('jamais de lien « javascript: » ni d’adresse cassée', () => {
    expect(siteOfficiel('javascript:alert(1)')).toBeNull();
    expect(siteOfficiel('data:text/html,coucou')).toBeNull();
    expect(siteOfficiel('pas une adresse')).toBeNull();
    expect(siteOfficiel(null)).toBeNull();
  });
});

describe('Logos et photos', () => {
  it('SOMAÏR et BAGRI ont leur version sur noir, les autres gardent leur logo', () => {
    expect(logoSurNoir('somair', null)).toBe('/logos/entreprises/somair-sur-noir.png');
    expect(logoSurNoir('bagri', null)).toBe('/logos/entreprises/bagri-sur-noir.png');
    expect(logoSurNoir('nigelec', null)).toBe('/logos/entreprises/nigelec.png');
    for (const slug of ['somair', 'bagri']) {
      expect(existsSync(join(PUBLIC, 'logos', 'entreprises', `${slug}-sur-noir.png`))).toBe(true);
    }
  });

  it('chaque photo existe et a les dimensions déclarées (elle s’affiche entière)', () => {
    for (const [slug, photo] of Object.entries(PHOTO_ENTREPRISE)) {
      const fichier = join(PUBLIC, photo.src);
      expect(existsSync(fichier), slug).toBe(true);
      expect(dimensionsJpeg(fichier), slug).toEqual({ largeur: photo.largeur, hauteur: photo.hauteur });
    }
  });

  it('les sept entreprises ont leur photo, avec sa description et sans source', () => {
    const sept = ['somair', 'sonidep', 'nigelec', 'niger-telecoms', 'sonibank', 'bagri', 'sopamin'];
    expect(Object.keys(PHOTO_ENTREPRISE).sort()).toEqual([...sept].sort());
    for (const [slug, photo] of Object.entries(PHOTO_ENTREPRISE)) {
      expect(photo.legende.trim().length, slug).toBeGreaterThan(0);
      expect(Object.keys(photo).sort(), slug).toEqual(['hauteur', 'largeur', 'legende', 'src']);
    }
  });
});

describe('Carte du siège et menu', () => {
  it('la carte connaît les sièges, accents ou non', () => {
    expect(villeSurLaCarte('Arlit')?.nom).toBe('Arlit');
    expect(villeSurLaCarte('niamey')?.nom).toBe('Niamey');
    expect(villeSurLaCarte('Tillaberi')?.nom).toBe('Tillabéri');
    expect(villeSurLaCarte('Abidjan')).toBeNull();
    expect(villeSurLaCarte('')).toBeNull();
  });

  it('sur une fiche entreprise, c’est Niger qui s’allume dans le menu', () => {
    const niger = NAVIGATION.find((e) => e.key === 'niger')!;
    const economie = NAVIGATION.find((e) => e.key === 'economie')!;
    expect(estRubriqueActive(niger, '/entreprises/somair')).toBe(true);
    expect(estRubriqueActive(niger, '/niger')).toBe(true);
    expect(estRubriqueActive(niger, '/entreprisesX')).toBe(false);
    expect(estRubriqueActive(economie, '/entreprises/somair')).toBe(false);
  });
});

describe('Image de partage d’une fiche', () => {
  it('le nom, ce que fait l’entreprise et la ville du siège, sans l’ancien Atlas', async () => {
    single.mockResolvedValue({
      data: { name: 'SOMAÏR', full_name: 'Société des Mines de l’Aïr', headquarters: 'Arlit, Niger', logo_url: null },
    });
    fetchMock.mockResolvedValue(new Response(new Uint8Array([137, 80, 78, 71]), { headers: { 'content-type': 'image/png' } }));
    const image = await EnterpriseOgImage({ params: Promise.resolve({ slug: 'somair' }) });
    // Les insécables de la typographie française comptent comme des espaces ici.
    const contenu = texte((image as unknown as { element: unknown }).element).replace(/[\u00a0\u202f]/g, ' ');
    expect(contenu).toContain('SOMAÏR');
    expect(contenu).toContain('Société des Mines de');
    expect(contenu).toContain('uranium');
    expect(contenu).toContain('Arlit');
    expect(contenu).not.toMatch(/Atlas/i);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/logos/entreprises/somair-sur-noir.png'), expect.anything());
  });

  it('logo injoignable : l’image se dessine quand même', async () => {
    single.mockResolvedValue({ data: { name: 'NIGELEC', full_name: null, headquarters: 'Niamey, Niger', logo_url: null } });
    fetchMock.mockRejectedValue(new Error('réseau'));
    const image = await EnterpriseOgImage({ params: Promise.resolve({ slug: 'nigelec' }) });
    expect(texte((image as unknown as { element: unknown }).element)).toContain('NIGELEC');
  });
});
