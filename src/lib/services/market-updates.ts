import * as Sentry from '@sentry/nextjs';
import type { DataProvenance } from './base-service';
import type { ForexData } from './frankfurter-service';
import type { CommoditiesData } from './commodities-service';
import type { IndicesData } from './indices-service';
import type { CryptoData } from './crypto-service';
import type { BRVMIndex } from './brvm-scraper-service';

/**
 * Construction des mises a jour de market_data a partir des sources externes.
 *
 * Ce module existe parce que la meme logique etait ecrite DEUX fois, a
 * l'identique, dans /api/cron/update-market-data et /api/admin/sync-market-data.
 * Toute faille y existait donc en double, et toute correction risquait de n'etre
 * appliquee qu'a un seul des deux endroits. La regle d'integrite des donnees est
 * trop importante pour dependre de deux copies qui doivent rester synchronisees
 * a la main.
 */

export type ResultatSource<T> = PromiseSettledResult<{ data: T; source: DataProvenance }>;

export interface MiseAJourMarche {
  value: number;
  /** Provenance, ecrite en base UNIQUEMENT si la source la fournit vraiment. */
  source?: string;
}

export interface EchecSource {
  symbol: string;
  error: string;
}

export interface SourcesMarche {
  forex: ResultatSource<ForexData>;
  commodities: ResultatSource<CommoditiesData>;
  indices: ResultatSource<IndicesData>;
  crypto: ResultatSource<CryptoData>;
  brvm: ResultatSource<BRVMIndex[]>;
}

export interface ResultatConstruction {
  updates: Record<string, MiseAJourMarche>;
  echecs: EchecSource[];
}

/**
 * N'accepte un resultat QUE s'il porte une donnee reellement mesuree.
 *
 * `source: 'stale'` signale un cache EXPIRE servi en depannage apres l'echec de
 * la source. Ecrire une telle valeur en base la re-horodaterait a maintenant et
 * la republierait comme la cotation du jour : une donnee perimee redeviendrait
 * fraiche par le seul fait d'avoir transite par un cron. C'est exactement ainsi
 * qu'un « BRVM Composite 417,00 » fabrique se retrouvait reecrit chaque matin.
 * Un cache encore valide ('cache') reste une vraie mesure recente : il est
 * accepte.
 */
export function donneeFraiche<T>(result: ResultatSource<T>): T | null {
  if (result.status !== 'fulfilled') return null;
  if (result.value.source === 'stale') return null;
  return result.value.data;
}

/**
 * Construit la table des valeurs a ecrire, et la liste des echecs a consigner.
 *
 * Aucune valeur de substitution n'est jamais produite ici : une source en echec
 * laisse simplement ses symboles absents de `updates`, donc la base inchangee.
 * Mieux vaut une donnee absente, ou une ancienne donnee clairement horodatee,
 * qu'une valeur inventee qui se ferait passer pour la cotation du jour.
 */
export function construireMisesAJourMarche(
  sources: SourcesMarche,
  contexte: 'cron' | 'admin',
): ResultatConstruction {
  const updates: Record<string, MiseAJourMarche> = {};
  const echecs: EchecSource[] = [];

  const signalerEchec = (
    result: ResultatSource<unknown>,
    nomSource: string,
    symboles: string[],
  ) => {
    const raison =
      result.status === 'rejected'
        ? String(result.reason)
        : `Donnee perimee refusee (cache expire) pour ${nomSource}`;
    Sentry.captureException(
      result.status === 'rejected' ? result.reason : new Error(raison),
      { tags: { contexte, source: nomSource } },
    );
    for (const symbol of symboles) echecs.push({ symbol, error: raison });
  };

  // --- Forex ---
  const forex = donneeFraiche(sources.forex);
  if (forex) {
    const eurXof = forex.rates.find((r) => r.base === 'EUR' && r.target === 'XOF');
    if (eurXof) updates['EUR/XOF'] = { value: eurXof.rateInXOF };
    const usdXof = forex.rates.find((r) => r.base === 'USD' && r.target === 'XOF');
    if (usdXof) updates['USD/XOF'] = { value: usdXof.rateInXOF };
  } else {
    signalerEchec(sources.forex, 'forex', ['EUR/XOF', 'USD/XOF']);
  }

  // --- Matieres premieres ---
  // U3O8 n'est plus alimente : le ticker Yahoo UX=F n'est pas le spot uranium et
  // le service servait un chiffre invente. Voir commodities-service.ts.
  const commodities = donneeFraiche(sources.commodities);
  if (commodities) {
    for (const c of commodities.commodities) {
      if (c.symbol === 'XAU') updates['XAU'] = { value: c.price, source: c.source };
      if (c.symbol === 'ICEEUR:BRN1!' || c.name.toLowerCase().includes('brent')) {
        updates['ICEEUR:BRN1!'] = { value: c.price, source: c.source };
      }
    }
  } else {
    signalerEchec(sources.commodities, 'commodities', ['XAU', 'ICEEUR:BRN1!']);
  }

  // --- Indices mondiaux ---
  const indices = donneeFraiche(sources.indices);
  if (indices) {
    for (const q of indices.quotes) {
      if (q.symbol === 'IXIC') updates['IXIC'] = { value: q.price };
      if (q.symbol === 'GSPC') updates['GSPC'] = { value: q.price };
      if (q.symbol === 'SXXP') updates['SXXP'] = { value: q.price };
    }
  } else {
    signalerEchec(sources.indices, 'indices', ['IXIC', 'GSPC', 'SXXP']);
  }

  // --- Crypto ---
  const crypto = donneeFraiche(sources.crypto);
  if (crypto) {
    for (const p of crypto.prices) {
      if (p.symbol === 'BTC') updates['BTC'] = { value: p.price };
      if (p.symbol === 'ETH') updates['ETH'] = { value: p.price };
    }
  } else {
    signalerEchec(sources.crypto, 'crypto', ['BTC', 'ETH']);
  }

  // --- BRVM ---
  // Aucune source BRVM vivante a ce jour (brvm.org/api/quotes repond 404), donc
  // cette branche echoue et BRVMC n'est pas mis a jour. C'est voulu : mieux vaut
  // pas de cotation BRVM du tout qu'une cotation inventee.
  const brvm = donneeFraiche(sources.brvm);
  if (brvm) {
    const composite = brvm.find((i) => i.name.includes('Composite'));
    if (composite) updates['BRVMC'] = { value: composite.value };
  } else {
    signalerEchec(sources.brvm, 'brvm', ['BRVMC']);
  }

  return { updates, echecs };
}
