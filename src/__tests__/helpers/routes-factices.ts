import { vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * Aides des tests de routes de la corbeille. Le fichier de test doit simuler
 * '@/lib/admin-auth' (vi.mock) avant d'importer ce module.
 */

export const uuid = (n: number): string => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export const ADMIN = uuid(1);

type Garde = Awaited<ReturnType<typeof requireAdmin>>;

/**
 * Un client de service factice : rpc et from enregistrent leurs appels. Les
 * réponses de la base sont réglées test par test ; l'ordre des appels sert à
 * vérifier que la purge précède la liste.
 */
export function clientFactice(reponses: { rpc?: Record<string, { data?: unknown; error?: unknown }>; liste?: unknown } = {}) {
  const ordre: string[] = [];
  const rpc = vi.fn(async (nom: string) => {
    ordre.push(`rpc:${nom}`);
    const reponse = reponses.rpc?.[nom];
    return { data: reponse?.data ?? null, error: reponse?.error ?? null };
  });
  const from = vi.fn((table: string) => {
    const chaine: Record<string, unknown> = {};
    for (const methode of ['select', 'order', 'limit', 'delete', 'eq', 'not', 'lt', 'in', 'update', 'insert', 'or']) {
      chaine[methode] = vi.fn(() => chaine);
    }
    chaine.then = (ok: (v: unknown) => unknown, ko?: (e: unknown) => unknown) => {
      ordre.push(`from:${table}`);
      const resultat = table === 'contenus_supprimes' ? reponses.liste : undefined;
      return Promise.resolve(resultat ?? { data: [], error: null, count: 0 }).then(ok, ko);
    };
    return chaine;
  });
  return { service: { rpc, from } as unknown as SupabaseClient, rpc, from, ordre };
}

export function connecter(service: SupabaseClient): void {
  vi.mocked(requireAdmin).mockResolvedValue({ user: { id: ADMIN }, serviceClient: service } as unknown as Garde);
}

export function refuser(statut: 401 | 403): void {
  const corps = { error: statut === 401 ? 'Non authentifié' : 'Accès refusé' };
  vi.mocked(requireAdmin).mockResolvedValue({ error: NextResponse.json(corps, { status: statut }) } as unknown as Garde);
}

/** Une route qui ne renverrait rien ferait échouer le test au lieu de passer inaperçue. */
export function definie<T>(reponse: T | undefined): T {
  if (reponse === undefined) throw new Error('la route n’a renvoyé aucune réponse');
  return reponse;
}

export function requete(chemin: string, init?: { method: string; body?: unknown; headers?: Record<string, string> }): NextRequest {
  return new NextRequest(
    new Request(`http://localhost${chemin}`, {
      method: init?.method ?? 'GET',
      headers: { ...(init?.body === undefined ? {} : { 'Content-Type': 'application/json' }), ...init?.headers },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    }),
  );
}
