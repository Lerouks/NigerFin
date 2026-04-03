/**
 * Centralized Financial Data Layer — Public API
 *
 * RULE 1: This is the SINGLE SOURCE for all financial data on the site.
 * No component should call a financial API directly.
 */

export { fetchFinancialData } from './fetcher';
export { ASSET_CONFIGS, getAssetConfig, getAssetsByType } from './config';
export type {
  FinancialQuote,
  FinancialDataResult,
  FinancialDataError,
  AssetConfig,
  AssetType,
  RawQuote,
  ProviderConfig,
} from './types';
