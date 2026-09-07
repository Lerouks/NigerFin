'use client';

import useSWR, { type SWRConfiguration, type SWRResponse } from 'swr';
import { appelAdmin } from '@/app/admin/lib/appel-admin';

/**
 * Lecture des donnees d'administration, avec rafraichissement automatique.
 *
 * Le message porte par l'erreur est celui d'appelAdmin, donc une phrase en
 * francais prete a afficher. Avant, il ressemblait a
 * « API /api/admin/stats a renvoyé 500: <!DOCTYPE html><html>... », ce qui
 * n'aide personne et surtout pas quelqu'un qui ne code pas.
 */
async function lecteur<T>(url: string): Promise<T> {
  // Deux tentatives seulement : SWR rejoue lui-meme les erreurs, inutile de
  // multiplier les appels sur une connexion qui coupe deja regulierement.
  const resultat = await appelAdmin<T>(url, { credentials: 'same-origin', tentatives: 2 });
  if (!resultat.ok) {
    const erreur = new Error(resultat.message);
    erreur.name = resultat.horsLigne ? 'HorsLigne' : 'ErreurApi';
    throw erreur;
  }
  return resultat.donnees;
}

export function useAdminApi<T>(
  path: string | null,
  options?: SWRConfiguration<T>
): SWRResponse<T> {
  const key = path ? (path.startsWith('/api/admin') ? path : `/api/admin/${path.replace(/^\/+/, '')}`) : null;
  return useSWR<T>(key, lecteur<T>, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    ...options,
  });
}

export function useAdminApiPolling<T>(
  path: string | null,
  intervalMs = 30000,
  options?: SWRConfiguration<T>
): SWRResponse<T> {
  return useAdminApi<T>(path, { refreshInterval: intervalMs, ...options });
}
