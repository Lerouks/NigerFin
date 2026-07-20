import { createServiceClient } from '@/lib/supabase';
import * as Sentry from '@sentry/nextjs';

export interface CacheEntry<T = unknown> {
  source: string;
  key: string;
  data: T;
  fetched_at: string;
  expires_at: string;
}

/**
 * Provenance d'une donnee remise a l'appelant.
 *   'api'   la source externe a repondu a l'instant
 *   'cache' cache encore valide, dans son TTL
 *   'stale' cache EXPIRE, servi en depannage apres l'echec de la source
 *
 * Distinguer 'cache' de 'stale' est essentiel : sans cette distinction, un
 * appelant ne peut pas savoir s'il tient une donnee fraiche ou un vestige, et se
 * met a republier de la donnee perimee comme si elle etait du jour.
 */
export type DataProvenance = 'api' | 'cache' | 'stale';

export interface ServiceResult<T> {
  data: T;
  source: DataProvenance;
  fetchedAt: string;
  /** Fin de validite du cache. Passe, la donnee est perimee. */
  expiresAt?: string;
}

/**
 * Age maximal, en secondes, au dela duquel un cache expire n'est PLUS servi meme
 * en depannage. Sans cette borne, `if (cached)` servait indefiniment un cache
 * vieux de plusieurs mois en le presentant comme du cache ordinaire.
 */
const MAX_STALE_SECONDS = 6 * 3600; // 6 heures

export abstract class BaseDataService {
  protected abstract source: string;
  protected abstract defaultTTLSeconds: number;

  protected getServiceClient() {
    const client = createServiceClient();
    if (!client) throw new Error('Supabase service client not configured');
    return client;
  }

  async getCached<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const supabase = this.getServiceClient();
      const { data, error } = await supabase
        .from('api_cache')
        .select('*')
        .eq('source', this.source)
        .eq('key', key)
        .single();

      if (error || !data) return null;
      return data as CacheEntry<T>;
    } catch {
      return null;
    }
  }

  async store<T>(key: string, data: T, ttlSeconds?: number): Promise<void> {
    try {
      const supabase = this.getServiceClient();
      const ttl = ttlSeconds ?? this.defaultTTLSeconds;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttl * 1000);

      await supabase.from('api_cache').upsert(
        {
          source: this.source,
          key,
          data: data as unknown as Record<string, unknown>,
          fetched_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: 'source,key' }
      );
    } catch (err) {
      Sentry.captureException(err, { tags: { service: this.source, key } });
    }
  }

  async isCacheValid(key: string): Promise<boolean> {
    const cached = await this.getCached(key);
    if (!cached) return false;
    return new Date(cached.expires_at) > new Date();
  }

  async getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttlSeconds?: number): Promise<ServiceResult<T>> {
    // Try cache first
    const cached = await this.getCached<T>(key);
    if (cached && new Date(cached.expires_at) > new Date()) {
      return {
        data: cached.data,
        source: 'cache',
        fetchedAt: cached.fetched_at,
        expiresAt: cached.expires_at,
      };
    }

    // Try fetching fresh data
    try {
      const startTime = Date.now();
      const freshData = await fetcher();
      const responseTime = Date.now() - startTime;
      const fetchedAt = new Date().toISOString();

      // Store in cache
      await this.store(key, freshData, ttlSeconds);

      // Log success
      await this.logHealth('success', responseTime);

      return { data: freshData, source: 'api', fetchedAt };
    } catch (err) {
      Sentry.captureException(err, { tags: { service: this.source, key } });
      await this.logHealth('error', undefined, (err as Error).message);

      // Depannage sur cache EXPIRE, mais borne dans le temps et etiquete 'stale'.
      //
      // Avant : `if (cached)` renvoyait n'importe quel cache, sans borne d'age, et
      // sous l'etiquette 'cache', strictement identique a celle d'un cache valide.
      // L'appelant ne pouvait donc pas distinguer une donnee de 30 minutes d'une
      // donnee de six mois. C'est ce chemin qui aurait rendu inoperante la
      // correction des services : ceux-ci echouent desormais proprement, mais le
      // cache empoisonne aurait continue a resservir les memes valeurs inventees.
      if (cached) {
        const ageSeconds = (Date.now() - new Date(cached.expires_at).getTime()) / 1000;
        if (ageSeconds <= MAX_STALE_SECONDS) {
          return {
            data: cached.data,
            source: 'stale',
            fetchedAt: cached.fetched_at,
            expiresAt: cached.expires_at,
          };
        }
      }

      throw err;
    }
  }

  private async logHealth(status: 'success' | 'error', responseTimeMs?: number, errorMessage?: string): Promise<void> {
    try {
      const supabase = this.getServiceClient();
      await supabase.from('api_health_log').insert({
        source: this.source,
        status,
        response_time_ms: responseTimeMs,
        error_message: errorMessage,
      });
    } catch {
      // Non-blocking
    }
  }
}
