import { describe, it, expect, vi, afterEach } from 'vitest';
import { ECOWASService } from '@/lib/services/ecowas-service';
import { RestCountriesService } from '@/lib/services/rest-countries-service';

/**
 * REST COUNTRIES : LIRE LA VRAIE RÉPONSE, PAS CELLE QU'ON ESPÈRE
 *
 * Le fournisseur a retiré sa v3.1. Depuis, chaque appel reçoit un 200 dont le
 * corps n'est plus une liste de pays mais l'enveloppe d'erreur ci-dessous,
 * relevée telle quelle le 2 novembre 2026. La CEDEAO plantait sur `.map`
 * chaque jour depuis le 13 juin 2026, et la fiche Niger renvoyait `undefined`
 * en se déclarant en succès.
 */
const REPONSE_V31_RETIREE = {
  success: false,
  data: null,
  errors: [
    {
      message:
        'This API version has been deprecated. Please visit https://restcountries.com/docs/countries/legacy-api-deprecation to migrate to our new version (v5).',
    },
  ],
};

const CODES_CEDEAO = [
  'BEN', 'BFA', 'CPV', 'CIV', 'GMB', 'GHA', 'GIN', 'GNB',
  'LBR', 'MLI', 'NER', 'NGA', 'SEN', 'SLE', 'TGO',
];

/** Fiche minimale au format v3.1. Les nombres sont factices : seule la forme compte ici. */
const fiche = (cca3: string, population = 1000, area = 10) => ({
  name: { common: `Pays ${cca3}` },
  cca3,
  capital: [`Capitale ${cca3}`],
  population,
  area,
  flags: { png: `${cca3}.png`, svg: `${cca3}.svg` },
  region: 'Africa',
  subregion: 'Western Africa',
});

/** Une réponse neuve à chaque appel : le corps d'une Response ne se lit qu'une fois. */
const repondre = (corps: unknown, init?: ResponseInit) =>
  vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(Response.json(corps, init))));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CEDEAO : une réponse qui n\'est pas une liste de pays est refusée, sans planter', () => {
  it('cas réel : l\'enveloppe « deprecated » donne un message clair, plus un TypeError', async () => {
    repondre(REPONSE_V31_RETIREE);

    const erreur = await new ECOWASService().fetch().catch((e: unknown) => e);

    expect(erreur).toBeInstanceOf(Error);
    expect((erreur as Error).message).toMatch(/le fournisseur refuse la requête/);
    expect((erreur as Error).message).toMatch(/deprecated/);
    expect((erreur as Error).message).not.toMatch(/is not a function/);
  });

  it('refuse une page HTML servie avec un code 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('<!DOCTYPE html><html></html>', { status: 200, headers: { 'Content-Type': 'text/html' } }),
    ));

    await expect(new ECOWASService().fetch()).rejects.toThrow(/pas du JSON/);
  });

  it('refuse une erreur HTTP en la nommant', async () => {
    repondre({}, { status: 503 });

    await expect(new ECOWASService().fetch()).rejects.toThrow(/HTTP 503/);
  });

  it('refuse un objet quelconque, qui n\'est ni une liste ni une erreur du fournisseur', async () => {
    repondre({ data: [] });

    await expect(new ECOWASService().fetch()).rejects.toThrow(/une liste de pays était attendue/);
  });

  it('refuse une liste incomplète au lieu de publier un total régional faux', async () => {
    repondre(CODES_CEDEAO.filter((c) => c !== 'NGA' && c !== 'GHA').map((c) => fiche(c)));

    await expect(new ECOWASService().fetch()).rejects.toThrow(/il manque GHA, NGA/);
  });

  it('refuse une fiche sans population, au lieu de la compter pour zéro', async () => {
    const fiches: Array<Record<string, unknown>> = CODES_CEDEAO.map((c) => fiche(c));
    fiches[3] = { ...fiches[3], population: undefined };
    repondre(fiches);

    await expect(new ECOWASService().fetch()).rejects.toThrow(/fiche pays illisible \(CIV\)/);
  });

  it('additionne une réponse complète et valide', async () => {
    repondre(CODES_CEDEAO.map((c) => fiche(c, 1000, 10)));

    const data = await new ECOWASService().fetch();

    expect(data.memberCount).toBe(15);
    expect(data.totalPopulation).toBe(15000);
    expect(data.totalArea).toBe(150);
    expect(data.countries.find((c) => c.code === 'NER')?.capital).toBe('Capitale NER');
  });
});

describe('Fiche Niger : plus de faux succès', () => {
  it('cas réel : l\'enveloppe « deprecated » fait échouer l\'appel, au lieu de rendre undefined', async () => {
    repondre(REPONSE_V31_RETIREE);

    await expect(new RestCountriesService().fetch('NER')).rejects.toThrow(/le fournisseur refuse la requête/);
  });

  it('refuse une liste vide ou la fiche d\'un autre pays', async () => {
    repondre([]);
    await expect(new RestCountriesService().fetch('NER')).rejects.toThrow(/absent de la réponse/);

    repondre([fiche('MLI')]);
    await expect(new RestCountriesService().fetch('NER')).rejects.toThrow(/absent de la réponse/);
  });

  it('rend la fiche demandée quand la réponse est valide', async () => {
    repondre([fiche('NER', 27_000_000, 1_267_000)]);

    const niger = await new RestCountriesService().fetch('NER');

    expect(niger.area).toBe(1_267_000);
    expect(niger.capital[0]).toBe('Capitale NER');
  });
});
