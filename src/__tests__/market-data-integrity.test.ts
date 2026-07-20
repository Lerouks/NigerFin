import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BRVMScraperService } from '@/lib/services/brvm-scraper-service';
import { CommoditiesService } from '@/lib/services/commodities-service';
import { donneeFraiche, construireMisesAJourMarche } from '@/lib/services/market-updates';

/**
 * INTEGRITE DES DONNEES DE MARCHE
 *
 * Regle absolue de NFI Report : aucun chiffre economique ne doit jamais etre
 * invente, estime, ou servi depuis une valeur de repli codee en dur. Absence de
 * donnee = affichage d'absence.
 *
 * Ces tests existent parce que cette regle a ete violee en production. Le
 * scraper BRVM servait un « BRVM Composite a 417,00 » entierement invente, ecrit
 * chaque jour en base par le cron, affiche sur l'accueil et dans les articles.
 * La panne etait invisible : le service RENVOYAIT une valeur de repli au lieu de
 * REJETER, donc Promise.allSettled voyait un succes et Sentry n'etait jamais
 * alerte. Le service des matieres premieres faisait de meme avec l'uranium
 * (65,00 USD/lb invente), la matiere la plus sensible du Niger.
 *
 * Aucun test ne couvrait ce code : c'est pour cela que le bug a survecu.
 */

const SERVICES_DIR = join(process.cwd(), 'src/lib/services');

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('BRVM : le service echoue au lieu d\'inventer', () => {
  it('rejette quand la source repond une erreur HTTP (cas reel : brvm.org renvoie 404)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('Not Found', { status: 404 }),
    ));

    const service = new BRVMScraperService();
    await expect(service.fetch()).rejects.toThrow(/BRVM indisponible/);
  });

  it('rejette quand la source est injoignable (reseau coupe, timeout)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unreachable')));

    const service = new BRVMScraperService();
    await expect(service.fetch()).rejects.toThrow(/injoignable/);
  });

  it('rejette une reponse qui ne contient aucun indice, au lieu de fabriquer le Composite', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      Response.json({ indices: [], stocks: [] }),
    ));

    const service = new BRVMScraperService();
    await expect(service.fetch()).rejects.toThrow(/aucun indice/);
  });

  it('ecarte un titre sans prix au lieu de le coter a 0 FCFA', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      Response.json({
        indices: [{ name: 'BRVM Composite', value: 220.5, change: 1.1, changePercent: 0.5 }],
        stocks: [
          { ticker: 'SNTS', name: 'Sonatel', price: 19500, volume: 120 },
          { ticker: 'BOAN', name: 'BOA Niger' }, // aucun prix cote ce jour
        ],
      }),
    ));

    const data = await new BRVMScraperService().fetch();

    expect(data.stocks.map((s) => s.ticker)).toEqual(['SNTS']);
    expect(data.stocks.every((s) => s.price > 0)).toBe(true);
  });
});

describe('Matieres premieres : le service echoue au lieu d\'inventer', () => {
  it('rejette quand toutes les sources externes echouent, sans renvoyer d\'estimation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('toutes les sources sont mortes')));

    const service = new CommoditiesService();
    await expect(service.fetch()).rejects.toThrow(/Aucune matiere premiere disponible/);
  });

  it('convertit les cotations Yahoo en USX (cents) vers des dollars', async () => {
    // Cas reel : Yahoo cote le coton CT=F a 80,22 USX, soit 0,8022 USD/lb.
    // Sans conversion, 80,22 etait pris pour des dollars, rejete par le controle
    // de plage [0,30 - 2,00] comme aberrant, puis remplace par un repli a 0,68.
    // Une donnee juste et disponible etait donc detruite au profit d'un faux.
    const nowSeconds = Math.floor(Date.now() / 1000);
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (!String(url).includes('CT%3DF')) {
        return Promise.reject(new Error('source non simulee pour ce test'));
      }
      return Promise.resolve(Response.json({
        chart: {
          result: [{
            meta: {
              regularMarketPrice: 80.22,
              chartPreviousClose: 79.5,
              regularMarketTime: nowSeconds,
              currency: 'USX',
            },
          }],
        },
      }));
    }));

    const data = await new CommoditiesService().fetch();
    const coton = data.commodities.find((c) => c.symbol === 'CT');

    expect(coton).toBeDefined();
    expect(coton!.price).toBeCloseTo(0.8022, 4);
    expect(coton!.price).not.toBe(0.68); // l'ancienne valeur inventee
  });

  it('n\'expose plus l\'uranium tant qu\'aucune source reelle n\'est branchee', async () => {
    // Le ticker Yahoo UX=F n'est pas le spot U3O8 : son horodatage est fige
    // (53 jours de retard constates), donc le controle de fraicheur le rejetait
    // toujours et le service servait 65,00 USD/lb invente. Une vraie cotation
    // U3O8 vient de UxC ou TradeTech, sur abonnement.
    const nowSeconds = Math.floor(Date.now() / 1000);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      chart: {
        result: [{
          meta: {
            regularMarketPrice: 88.01,
            chartPreviousClose: 87.2,
            regularMarketTime: nowSeconds,
            currency: 'USD',
          },
        }],
      },
    })));

    const data = await new CommoditiesService().fetch();

    expect(data.commodities.find((c) => c.symbol === 'U3O8')).toBeUndefined();
    expect(data.commodities.some((c) => c.name.toLowerCase().includes('uranium'))).toBe(false);
  });
});

describe('Le cache perime ne peut plus etre republie comme donnee du jour', () => {
  const resultat = (source: 'api' | 'cache' | 'stale') =>
    ({ status: 'fulfilled', value: { data: { marqueur: source }, source } }) as const;

  it('accepte une donnee fraiche venue de la source', () => {
    expect(donneeFraiche(resultat('api'))).toEqual({ marqueur: 'api' });
  });

  it('accepte un cache encore valide : c\'est une vraie mesure recente', () => {
    expect(donneeFraiche(resultat('cache'))).toEqual({ marqueur: 'cache' });
  });

  it('REFUSE un cache expire, sinon une valeur perimee redeviendrait « du jour »', () => {
    // C'est ce chemin precis qui aurait defait toute la correction : les services
    // echouent proprement, mais le cache contenait deja les valeurs inventees.
    expect(donneeFraiche(resultat('stale'))).toBeNull();
  });

  it('refuse une source en echec', () => {
    expect(
      donneeFraiche({ status: 'rejected', reason: new Error('source morte') }),
    ).toBeNull();
  });

  it('une source en echec laisse ses symboles hors des mises a jour et consigne l\'echec', () => {
    const echoue = { status: 'rejected', reason: new Error('brvm morte') } as const;
    const perime = { status: 'fulfilled', value: { data: [], source: 'stale' } } as const;

    const { updates, echecs } = construireMisesAJourMarche(
      {
        forex: echoue,
        commodities: echoue,
        indices: echoue,
        crypto: echoue,
        brvm: perime,
      } as never,
      'cron',
    );

    // Aucune valeur de substitution n'est produite : la base restera inchangee.
    expect(Object.keys(updates)).toHaveLength(0);
    expect(echecs.map((e) => e.symbol)).toContain('BRVMC');
    expect(echecs.find((e) => e.symbol === 'BRVMC')!.error).toMatch(/perimee/);
  });

  it('n\'alimente plus le symbole uranium U3O8', () => {
    const echoue = { status: 'rejected', reason: new Error('hs') } as const;
    const { echecs } = construireMisesAJourMarche(
      { forex: echoue, commodities: echoue, indices: echoue, crypto: echoue, brvm: echoue } as never,
      'cron',
    );
    expect(echecs.map((e) => e.symbol)).not.toContain('U3O8');
  });
});

describe('Aucune valeur de marche codee en dur ne subsiste dans les services', () => {
  // Verrou de non-regression le plus important du fichier : il interdit de
  // REINTRODUIRE une valeur de repli, meme des mois plus tard, meme par un autre
  // chemin. Chaque nombre listé ici a reellement ete servi en production comme
  // s'il s'agissait d'une cotation mesuree.
  const VALEURS_INTERDITES: Array<[string, RegExp]> = [
    ['BRVM Composite invente', /\b417\.00\b/],
    ['BRVM 30 invente', /\b209\.00\b/],
    ['uranium invente', /\b65\.00\b/],
    ['coton invente', /\b0\.68\b/],
    ['or invente', /\b3100\.00\b/],
    ['petrole invente', /\b109\.00\b/],
  ];

  const FICHIERS = ['brvm-scraper-service.ts', 'commodities-service.ts'];

  for (const fichier of FICHIERS) {
    for (const [libelle, motif] of VALEURS_INTERDITES) {
      it(`${fichier} ne contient pas de ${libelle}`, () => {
        const contenu = readFileSync(join(SERVICES_DIR, fichier), 'utf8');
        // On ignore les commentaires, qui documentent legitimement l'ancien bug.
        const code = contenu
          .split('\n')
          .filter((l) => !l.trimStart().startsWith('//') && !l.trimStart().startsWith('*'))
          .join('\n');
        expect(code).not.toMatch(motif);
      });
    }
  }

  it('aucun service ne contient de fonction de repli a valeurs statiques', () => {
    for (const fichier of FICHIERS) {
      const contenu = readFileSync(join(SERVICES_DIR, fichier), 'utf8');
      expect(contenu).not.toMatch(/buildFallbackData|getFallbackPrice/);
    }
  });
});
