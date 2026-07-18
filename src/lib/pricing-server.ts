import { createServiceClient } from '@/lib/supabase';
import { resolvePrice, type BillingCycle } from '@/config/pricing';
import * as Sentry from '@sentry/nextjs';

/**
 * Prix serveur canonique (SOURCE DE VERITE UNIQUE) pour un cycle de facturation.
 *
 * Lit l'override admin dans `dynamic_pricing` via le service role (la table
 * n'est pas exposee au client) et delegue le calcul final a `resolvePrice`
 * (plancher = prix config, plafond = MAX_DYNAMIC_PRICE). A utiliser partout ou
 * un prix est ENCAISSE (checkout iPay, soumission manuelle) ou VALIDE, afin que
 * le prix affiche, le prix debite, le prix facture et le controle anti-fraude
 * soient TOUJOURS le meme nombre.
 *
 * Fail-safe : si le service role est indisponible ou la requete echoue, on
 * retombe sur le prix du config (jamais une erreur, jamais un prix sous le
 * plancher). Impossible de renvoyer un prix inferieur au config.
 */
export async function getServerPrice(cycle: BillingCycle): Promise<number> {
  const serviceClient = createServiceClient();
  if (!serviceClient) return resolvePrice(cycle);

  const { data, error } = await serviceClient
    .from('dynamic_pricing')
    .select('amount')
    .eq('tier', 'premium')
    .eq('billing_cycle', cycle)
    .maybeSingle();

  if (error) {
    Sentry.captureException(error, { tags: { context: 'get-server-price' }, extra: { cycle } });
    return resolvePrice(cycle);
  }

  return resolvePrice(cycle, data?.amount);
}
