import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
}

export interface FlashBannerItem {
  tag: string;
  text: string;
}

export interface FlashBannerData {
  enabled: boolean;
  items: FlashBannerItem[];
}

export const defaultSocialLinks: SocialLinks = {
  facebook: 'https://www.facebook.com/share/1APpbXcsAV/?mibextid=wwXIfr',
  twitter: '',
  linkedin: '',
  instagram: 'https://www.instagram.com/nfireport?igsh=Y3FmYTYyZXBrd3ph&utm_source=qr',
  youtube: 'https://youtube.com/@nfireport?si=bnYKo7AVK9F9pklE',
  tiktok: 'https://www.tiktok.com/@nfireport?_r=1&_t=ZN-94QaNLIYjkE',
};

export const defaultContactEmail = 'contact@nfireport.com';

const EMPTY_BANNER: FlashBannerData = { enabled: false, items: [] };

export interface SiteFeatures {
  /** Bandeau marche defilant en haut de la home */
  marketTickerEnabled: boolean;
  /** Mode pre-lancement : le public voit la page « Prochainement », les admins voient le site complet. */
  prelaunchEnabled: boolean;
}

/**
 * Repli utilise quand la base ne repond pas. `prelaunchEnabled: true` est
 * DELIBERE : tant que le site n'est pas ouvert au public, une panne reseau ne
 * doit jamais ouvrir nfireport.com toute seule. Le repli d'une porte fermee est
 * « fermee ». A repasser a `false` le jour de l'ouverture, une fois le drapeau
 * bascule en base, pour qu'une panne n'affiche plus la page d'attente a un
 * public qui connait deja le site.
 */
const FALLBACK_FEATURES: SiteFeatures = {
  marketTickerEnabled: true,
  prelaunchEnabled: true,
};

/**
 * Derniere valeur lue avec succes, gardee le temps de vie de l'instance. La
 * connexion coupe regulierement : mieux vaut rejouer le dernier etat connu que
 * retomber sur un repli qui contredit ce que Raouf a regle dans l'admin.
 */
let lastKnownFeatures: SiteFeatures | null = null;

/**
 * Server-only fetcher for site-wide feature toggles. Table site_features
 * a une seule row (id=1). En cas d'erreur ou de table manquante, rejoue le
 * dernier etat connu, sinon le repli sur — voir FALLBACK_FEATURES.
 * Cache 60s, invalide via revalidateTag('site-features').
 */
export const getSiteFeatures = unstable_cache(
  async (): Promise<SiteFeatures> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return lastKnownFeatures ?? FALLBACK_FEATURES;

    try {
      const supabase = createClient(url, key, {
        auth: { persistSession: false },
      });
      const { data, error } = await supabase
        .from('site_features')
        .select('market_ticker_enabled, prelaunch_enabled')
        .eq('id', 1)
        .maybeSingle();

      if (error || !data) return lastKnownFeatures ?? FALLBACK_FEATURES;

      const features: SiteFeatures = {
        marketTickerEnabled: data.market_ticker_enabled !== false,
        prelaunchEnabled: data.prelaunch_enabled === true,
      };
      lastKnownFeatures = features;
      return features;
    } catch {
      return lastKnownFeatures ?? FALLBACK_FEATURES;
    }
  },
  ['site-features-v1'],
  { revalidate: 60, tags: ['site-features'] },
);

/**
 * Server-only fetcher for the flash banner. Uses the anon Supabase client
 * (no cookies) so the result is shared across requests and cacheable.
 * Cached for 60 seconds; admin updates should call revalidateTag('flash-banner', 'max').
 */
export const getFlashBanner = unstable_cache(
  async (): Promise<FlashBannerData> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return EMPTY_BANNER;

    try {
      const supabase = createClient(url, key, {
        auth: { persistSession: false },
      });
      const { data, error } = await supabase
        .from('flash_banner')
        .select('enabled, items')
        .order('id')
        .limit(1)
        .single();

      if (error || !data) return EMPTY_BANNER;

      const enabled = data.enabled === true;
      const rawItems = Array.isArray(data.items) ? data.items : [];
      const items: FlashBannerItem[] = rawItems
        .filter((it: unknown): it is FlashBannerItem => {
          if (!it || typeof it !== 'object') return false;
          const obj = it as Record<string, unknown>;
          return typeof obj.tag === 'string' && typeof obj.text === 'string';
        })
        .map((it) => ({ tag: it.tag, text: it.text }));

      return { enabled, items };
    } catch {
      return EMPTY_BANNER;
    }
  },
  ['flash-banner-v1'],
  { revalidate: 60, tags: ['flash-banner'] },
);
