import { cookies } from 'next/headers';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';

/**
 * Le visiteur courant est-il un admin connecté ?
 *
 * Utilisé par le layout racine pour laisser les admins traverser le mode
 * pré-lancement (voir le site complet) pendant que le public voit la page
 * « Prochainement ».
 *
 * Chemin rapide : sans cookie de session Supabase (visiteur anonyme, la quasi
 * totalité du trafic), on répond false sans aucun appel réseau, ce qui préserve
 * la stratégie de cache Edge / ISR du site.
 *
 * Non-bloquant : toute erreur -> false (on ne casse jamais le rendu).
 */
export async function isAdminViewer(): Promise<boolean> {
  const cookieStore = await cookies();
  const hasSession = cookieStore.getAll().some((c) => c.name.startsWith('sb-'));
  if (!hasSession) return false;

  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return false;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    // Service client : lecture du rôle en contournant la RLS (évite les faux négatifs).
    const service = createServiceClient();
    if (!service) return false;

    const { data } = await service
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return data?.role === 'admin';
  } catch {
    return false;
  }
}
