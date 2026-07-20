import * as Sentry from '@sentry/nextjs';
import { worldBankService } from './world-bank-service';
import { imfService } from './imf-service';
import { frankfurterService } from './frankfurter-service';
import { exchangeRateService } from './exchange-rate-service';
import { restCountriesService } from './rest-countries-service';
import { ecowasService } from './ecowas-service';
import { brvmScraperService } from './brvm-scraper-service';
import { commoditiesService } from './commodities-service';
import { cryptoService } from './crypto-service';
import { indicesService } from './indices-service';
import type { MacroData } from './world-bank-service';
import type { IMFData } from './imf-service';
import type { ForexData } from './frankfurter-service';
import type { CountryData } from './rest-countries-service';
import type { ECOWASData } from './ecowas-service';
import type { BRVMIndex, BRVMStock } from './brvm-scraper-service';
import type { CommoditiesData } from './commodities-service';
import type { CryptoData } from './crypto-service';
import type { IndicesData } from './indices-service';
import type { DataProvenance } from './base-service';

export interface OrchestratorResult<T> {
  data: T;
  /**
   * Provenance reelle de la donnee. 'stale' signale un cache EXPIRE servi en
   * depannage : l'appelant DOIT en tenir compte et ne jamais republier une telle
   * valeur comme la cotation du jour (voir le garde du cron update-market-data).
   */
  source: DataProvenance;
  fetchedAt: string;
  service: string;
}

class DataOrchestrator {
  /**
   * Get macro-economic data combining World Bank and IMF.
   * Falls back gracefully if one source fails.
   */
  async getMacroData(country: string = 'NER'): Promise<OrchestratorResult<{ worldBank: MacroData; imf: IMFData }>> {
    const [wbResult, imfResult] = await Promise.allSettled([
      worldBankService.getMacro(country),
      imfService.getMacro(country),
    ]);

    const worldBank = wbResult.status === 'fulfilled'
      ? wbResult.value.data
      : { gdp: [], gdpGrowth: [], gdpPerCapita: [], inflation: [], debt: [], population: [] };

    const imf = imfResult.status === 'fulfilled'
      ? imfResult.value.data
      : { realGDPGrowth: [], inflationRate: [], currentAccountBalance: [], governmentRevenue: [], governmentExpenditure: [] };

    if (wbResult.status === 'rejected') {
      Sentry.captureException(wbResult.reason, { tags: { orchestrator: 'macro', source: 'world_bank' } });
    }
    if (imfResult.status === 'rejected') {
      Sentry.captureException(imfResult.reason, { tags: { orchestrator: 'macro', source: 'imf' } });
    }

    const source = (wbResult.status === 'fulfilled' && wbResult.value.source === 'api') ||
                   (imfResult.status === 'fulfilled' && imfResult.value.source === 'api') ? 'api' : 'cache';

    const fetchedAt = wbResult.status === 'fulfilled'
      ? wbResult.value.fetchedAt
      : imfResult.status === 'fulfilled'
        ? imfResult.value.fetchedAt
        : new Date().toISOString();

    return { data: { worldBank, imf }, source, fetchedAt, service: 'world_bank+imf' };
  }

  /**
   * Get forex rates. Frankfurter first, ExchangeRate-API as fallback.
   */
  async getForexData(): Promise<OrchestratorResult<ForexData>> {
    try {
      const result = await frankfurterService.getForex();
      return { data: result.data, source: result.source, fetchedAt: result.fetchedAt, service: 'frankfurter' };
    } catch (err) {
      Sentry.captureException(err, { tags: { orchestrator: 'forex', source: 'frankfurter' } });

      try {
        const fallback = await exchangeRateService.getForex();
        return { data: fallback.data, source: fallback.source, fetchedAt: fallback.fetchedAt, service: 'exchange_rate_api' };
      } catch (err2) {
        Sentry.captureException(err2, { tags: { orchestrator: 'forex', source: 'exchange_rate_api' } });
        throw new Error('All forex APIs failed');
      }
    }
  }

  /**
   * Get commodity prices.
   */
  async getCommoditiesData(): Promise<OrchestratorResult<CommoditiesData>> {
    const result = await commoditiesService.getCommodities();
    return { data: result.data, source: result.source, fetchedAt: result.fetchedAt, service: 'commodities' };
  }

  /**
   * Get BRVM indices.
   */
  async getBRVMIndices(): Promise<OrchestratorResult<BRVMIndex[]>> {
    const result = await brvmScraperService.getIndices();
    return { data: result.data, source: result.source, fetchedAt: result.fetchedAt, service: 'brvm' };
  }

  /**
   * Get BRVM stocks with optional ticker filter.
   */
  async getBRVMStocks(ticker?: string): Promise<OrchestratorResult<BRVMStock[]>> {
    const result = await brvmScraperService.getStocks(ticker);
    return { data: result.data, source: result.source, fetchedAt: result.fetchedAt, service: 'brvm' };
  }

  /**
   * Get Niger country data.
   */
  async getNigerCountry(): Promise<OrchestratorResult<CountryData>> {
    const result = await restCountriesService.getCountry('NER');
    return { data: result.data, source: result.source, fetchedAt: result.fetchedAt, service: 'rest_countries' };
  }

  /**
   * Get ECOWAS region data.
   */
  async getRegionData(): Promise<OrchestratorResult<ECOWASData>> {
    const result = await ecowasService.getRegion();
    return { data: result.data, source: result.source, fetchedAt: result.fetchedAt, service: 'ecowas' };
  }

  /**
   * Get crypto prices (Bitcoin, Ethereum).
   */
  async getCryptoData(): Promise<OrchestratorResult<CryptoData>> {
    const result = await cryptoService.getCryptoPrices();
    return { data: result.data, source: result.source, fetchedAt: result.fetchedAt, service: 'coingecko' };
  }

  /**
   * Get global indices (Nasdaq, S&P 500, STOXX Europe 600).
   */
  async getIndicesData(): Promise<OrchestratorResult<IndicesData>> {
    const result = await indicesService.getIndices();
    return { data: result.data, source: result.source, fetchedAt: result.fetchedAt, service: 'yahoo_finance' };
  }

  /**
   * Health check: test all services and return status.
   */
  async healthCheck(): Promise<Record<string, { status: 'ok' | 'error'; responseTime: number; error?: string }>> {
    const services = [
      { name: 'world_bank', check: () => worldBankService.getMacro() },
      { name: 'imf', check: () => imfService.getMacro() },
      { name: 'frankfurter', check: () => frankfurterService.getForex() },
      { name: 'exchange_rate_api', check: () => exchangeRateService.getForex() },
      { name: 'rest_countries', check: () => restCountriesService.getCountry() },
      { name: 'ecowas', check: () => ecowasService.getRegion() },
      { name: 'brvm', check: () => brvmScraperService.getIndices() },
      { name: 'commodities', check: () => commoditiesService.getCommodities() },
      { name: 'crypto', check: () => cryptoService.getCryptoPrices() },
      { name: 'indices', check: () => indicesService.getIndices() },
    ];

    const results: Record<string, { status: 'ok' | 'error'; responseTime: number; error?: string }> = {};

    await Promise.allSettled(
      services.map(async ({ name, check }) => {
        const start = Date.now();
        try {
          await check();
          results[name] = { status: 'ok', responseTime: Date.now() - start };
        } catch (err) {
          results[name] = {
            status: 'error',
            responseTime: Date.now() - start,
            error: (err as Error).message,
          };
        }
      })
    );

    return results;
  }
}

export const dataOrchestrator = new DataOrchestrator();
