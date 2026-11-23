import { createServiceClient } from '@/lib/supabase';
import { normalizeEmail } from '@/lib/validation';
import { SITE_URL } from '@/lib/config';

/**
 * Source des adresses laissées sur la page d'attente du pré-lancement.
 *
 * La page promet : « Votre adresse ne sert qu'à vous prévenir de l'ouverture ».
 * Ces adresses vivent dans newsletter_subscribers (même désabonnement, même
 * suppression de compte) mais ne reçoivent PAS la newsletter tant que la
 * personne ne s'y abonne pas elle-même (décision de Raouf, 23/11/2026).
 */
export const SOURCE_LISTE_ATTENTE = 'prelaunch';

/** Une adresse active reçoit-elle la newsletter ? Non si elle vient seulement de la liste d'attente. */
export function recoitLaNewsletter(source: string | null | undefined): boolean {
  return source !== SOURCE_LISTE_ATTENTE;
}

/**
 * Lien de désabonnement de la newsletter d'une adresse (jeton unique de la
 * ligne). Sert au pied des mails de la newsletter et à l'en-tête
 * List-Unsubscribe. Ouvert dans un navigateur, il mène à une page qui demande
 * de confirmer : il ne désabonne jamais à lui seul. Les mails de la liste
 * d'attente n'en portent pas, car la liste d'attente ne se quitte pas
 * (décision de Raouf, 23/11/2026). `undefined` si le jeton est introuvable.
 */
export async function lienDesinscription(id: string): Promise<string | undefined> {
  const supabase = createServiceClient();
  if (!supabase) return undefined;
  const { data } = await supabase
    .from('newsletter_subscribers')
    .select('unsubscribe_token')
    .eq('id', id)
    .maybeSingle();
  const jeton = (data as { unsubscribe_token?: string } | null)?.unsubscribe_token;
  return jeton ? `${SITE_URL}/api/newsletter/unsubscribe?token=${jeton}` : undefined;
}

export interface UpsertSubscriberInput {
  email: string;
  /** Where the user opted in (e.g. 'form', 'popup', 'signup', 'admin'). */
  source?: string;
  /** Optional auth user_id if the subscriber has an NFI account. */
  userId?: string;
  /** Locale for future i18n. Default: 'fr'. */
  locale?: string;
}

export interface UpsertSubscriberResult {
  id: string;
  /** True if this is a brand new subscriber. */
  isNew: boolean;
  /** True if a previously unsubscribed subscriber has been reactivated. */
  reactivated: boolean;
}

/**
 * Idempotent subscribe: creates a new newsletter_subscribers row, or reactivates
 * one that was previously unsubscribed, or no-ops if already active.
 *
 * Service-role only (bypasses RLS): callers must be server-side and trusted.
 */
export async function upsertNewsletterSubscriber(
  input: UpsertSubscriberInput,
): Promise<UpsertSubscriberResult> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Supabase service client unavailable');

  // La forme enregistrée, la même que celle que la suppression d'un compte
  // recherche (src/lib/delete-user.ts).
  const email = normalizeEmail(input.email);

  // Check existing
  const { data: existing, error: selErr } = await supabase
    .from('newsletter_subscribers')
    .select('id, status, unsubscribed_at, source')
    .eq('email', email)
    .maybeSingle();

  if (selErr) {
    throw new Error(`Failed to lookup subscriber: ${selErr.message}`);
  }

  if (existing) {
    if (existing.status === 'active') {
      // Inscrite seulement sur la liste d'attente, la personne s'abonne
      // maintenant à la newsletter : on enregistre ce nouveau choix, sinon
      // elle resterait exclue des envois (voir recoitLaNewsletter).
      if (!recoitLaNewsletter(existing.source) && recoitLaNewsletter(input.source)) {
        const { error: majErr } = await supabase
          .from('newsletter_subscribers')
          .update({
            source: input.source ?? null,
            opt_in_at: new Date().toISOString(),
            ...(input.userId ? { user_id: input.userId } : {}),
          })
          .eq('id', existing.id);
        if (majErr) {
          throw new Error(`Failed to record newsletter opt-in: ${majErr.message}`);
        }
        return { id: existing.id, isNew: false, reactivated: true };
      }
      return { id: existing.id, isNew: false, reactivated: false };
    }

    // Une adresse qui a classé un de nos mails en indésirable n'est jamais
    // réinscrite par un formulaire : n'importe qui a pu la retaper, et un
    // nouveau mail la ferait se plaindre encore (décision de Raouf, 23/11/2026).
    // No-op silencieux, comme pendant l'attente ci-dessous.
    if (existing.status === 'complained') {
      return { id: existing.id, isNew: false, reactivated: false };
    }

    // Rebond (adresse inexistante, boîte pleine) : 30 jours d'attente avant de
    // la réinscrire, pour protéger la réputation d'envoi (Resend) contre les
    // boucles (adresse invalide réinscrite, nouveau rebond).
    // Pour 'unsubscribed' (désabo volontaire), pas d'attente : si la personne
    // clique sur S'inscrire, c'est son choix de revenir.
    if (existing.status === 'bounced' && existing.unsubscribed_at) {
      const unsubDate = new Date(existing.unsubscribed_at).getTime();
      const cooldownEnd = unsubDate + 30 * 24 * 60 * 60 * 1000;
      if (Date.now() < cooldownEnd) {
        // No-op silencieux : on ne révèle pas le status à l'attaquant et l'UX
        // reste identique à un succès (l'user voit le check vert).
        return { id: existing.id, isNew: false, reactivated: false };
      }
    }

    // Réinscription d'une adresse désinscrite, ou en rebond depuis plus de 30 jours.
    const { error: updErr } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'active',
        unsubscribed_at: null,
        opt_in_at: new Date().toISOString(),
        source: input.source ?? null,
        user_id: input.userId ?? null,
      })
      .eq('id', existing.id);

    if (updErr) {
      throw new Error(`Failed to reactivate subscriber: ${updErr.message}`);
    }

    return { id: existing.id, isNew: false, reactivated: true };
  }

  // Insert fresh
  const { data: created, error: insErr } = await supabase
    .from('newsletter_subscribers')
    .insert({
      email,
      source: input.source ?? null,
      user_id: input.userId ?? null,
      locale: input.locale ?? 'fr',
    })
    .select('id')
    .single();

  if (insErr || !created) {
    throw new Error(`Failed to insert subscriber: ${insErr?.message ?? 'unknown'}`);
  }

  return { id: created.id, isNew: true, reactivated: false };
}

export type SubscriberStatus =
  | 'active'
  | 'unsubscribed'
  | 'bounced'
  | 'complained';

export interface SubscriberRow {
  id: string;
  email: string;
  status: SubscriberStatus;
  source: string | null;
  user_id: string | null;
  opt_in_at: string;
  unsubscribed_at: string | null;
  locale: string;
  created_at: string;
}

export interface ListSubscribersInput {
  status?: SubscriberStatus | 'all';
  source?: string | 'all';
  /** Recherche partielle sur email (case-insensitive). */
  q?: string;
  page?: number;
  limit?: number;
}

export interface ListSubscribersResult {
  rows: SubscriberRow[];
  total: number;
}

export interface SubscriberStats {
  totalActive: number;
  totalUnsubscribed: number;
  totalBounced: number;
  totalComplained: number;
  newThisMonth: number;
  unsubscribedThisMonth: number;
  /** Breakdown des abonnés actifs par source. */
  bySource: { source: string; count: number }[];
}

/**
 * Liste paginée + filtrée des abonnés. Service-role only.
 */
export async function listSubscribers(
  input: ListSubscribersInput = {},
): Promise<ListSubscribersResult> {
  const supabase = createServiceClient();
  if (!supabase) return { rows: [], total: 0 };

  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(200, Math.max(1, input.limit ?? 50));
  const offset = (page - 1) * limit;

  let countQuery = supabase
    .from('newsletter_subscribers')
    .select('id', { count: 'exact', head: true });
  let dataQuery = supabase
    .from('newsletter_subscribers')
    .select(
      'id, email, status, source, user_id, opt_in_at, unsubscribed_at, locale, created_at',
    );

  if (input.status && input.status !== 'all') {
    countQuery = countQuery.eq('status', input.status);
    dataQuery = dataQuery.eq('status', input.status);
  }
  if (input.source && input.source !== 'all') {
    countQuery = countQuery.eq('source', input.source);
    dataQuery = dataQuery.eq('source', input.source);
  }
  if (input.q && input.q.trim()) {
    const q = input.q.trim().toLowerCase().slice(0, 100);
    const safe = q.replace(/[%_\\,]/g, ' ');
    countQuery = countQuery.ilike('email', `%${safe}%`);
    dataQuery = dataQuery.ilike('email', `%${safe}%`);
  }

  const [{ count }, { data }] = await Promise.all([
    countQuery,
    dataQuery
      .order('opt_in_at', { ascending: false })
      .range(offset, offset + limit - 1),
  ]);

  return {
    rows: (data ?? []) as SubscriberRow[],
    total: count ?? 0,
  };
}

/**
 * Statistiques agrégées (totaux par status + nouveautés du mois + breakdown source).
 */
export async function getSubscriberStats(): Promise<SubscriberStats> {
  const supabase = createServiceClient();
  if (!supabase) {
    return {
      totalActive: 0,
      totalUnsubscribed: 0,
      totalBounced: 0,
      totalComplained: 0,
      newThisMonth: 0,
      unsubscribedThisMonth: 0,
      bySource: [],
    };
  }

  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const startOfMonthIso = startOfMonth.toISOString();

  const [
    activeCount,
    unsubCount,
    bouncedCount,
    complainedCount,
    newThisMonthCount,
    unsubThisMonthCount,
    sourceBreakdown,
  ] = await Promise.all([
    supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'unsubscribed'),
    supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'bounced'),
    supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'complained'),
    supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('opt_in_at', startOfMonthIso),
    supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'unsubscribed')
      .gte('unsubscribed_at', startOfMonthIso),
    supabase
      .from('newsletter_subscribers')
      .select('source')
      .eq('status', 'active'),
  ]);

  const counts = new Map<string, number>();
  for (const row of sourceBreakdown.data ?? []) {
    const key = (row as { source: string | null }).source ?? 'inconnu';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const bySource = Array.from(counts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalActive: activeCount.count ?? 0,
    totalUnsubscribed: unsubCount.count ?? 0,
    totalBounced: bouncedCount.count ?? 0,
    totalComplained: complainedCount.count ?? 0,
    newThisMonth: newThisMonthCount.count ?? 0,
    unsubscribedThisMonth: unsubThisMonthCount.count ?? 0,
    bySource,
  };
}

export interface UnsubscribeByIdResult {
  /** True si la requête a abouti côté DB (pas d'erreur de connexion/permissions). */
  ok: boolean;
  /** True si une ligne correspondant a été trouvée et mise à jour. */
  found: boolean;
  /** Email de l'abonné désabonné, pour audit log. */
  email?: string;
}

/**
 * Désabonner manuellement un abonné par son id (admin only).
 * Soft delete : on garde la ligne en status='unsubscribed' pour audit + anti-réinscription.
 *
 * Renvoie `found: false` si l'id n'existe pas (permet à l'API de répondre 404).
 *
 * Synchronise aussi `user_profiles.newsletter_subscribed = false` si l'abonné
 * a un compte NFI lié (sinon la home dirait à tort "déjà inscrit").
 */
export async function unsubscribeById(id: string): Promise<UnsubscribeByIdResult> {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, found: false };

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, email, user_id')
    .maybeSingle();

  if (error) return { ok: false, found: false };
  if (!data) return { ok: true, found: false };

  if (data.user_id) {
    await syncProfileNewsletterFlag(data.user_id, false);
  }

  return { ok: true, found: true, email: data.email };
}

/**
 * Synchronise le flag `user_profiles.newsletter_subscribed` avec l'état réel
 * dans `newsletter_subscribers`. Évite la désynchronisation entre les 2 sources
 * de vérité quand un désabo passe par un autre canal que /api/newsletter POST.
 *
 * Best-effort : log l'erreur sans casser le flow appelant.
 */
async function syncProfileNewsletterFlag(
  userId: string,
  subscribed: boolean,
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  const { error } = await supabase
    .from('user_profiles')
    .update({
      newsletter_subscribed: subscribed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('[newsletter] sync profile flag failed', {
      userId,
      subscribed,
      error: error.message,
    });
  }
}

/**
 * Mark a subscriber as unsubscribed (RFC 8058 one-click and standard flow).
 * Idempotent: no-op if already unsubscribed.
 *
 * Par jeton, seule la newsletter se quitte : une adresse de la seule liste
 * d'attente est traitée comme inconnue, la liste d'attente ne se quittant pas
 * (décision de Raouf, 23/11/2026).
 *
 * Synchronise aussi `user_profiles.newsletter_subscribed = false` quand le
 * subscriber a un user_id lié (single source of truth).
 */
export async function unsubscribeBy(
  field: 'email' | 'unsubscribe_token',
  value: string,
): Promise<{ found: boolean; alreadyUnsubscribed: boolean }> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Supabase service client unavailable');

  const { data: existing, error: selErr } = await supabase
    .from('newsletter_subscribers')
    .select('id, status, user_id, source')
    .eq(field, value)
    .maybeSingle();

  if (selErr) throw new Error(`Failed to lookup subscriber: ${selErr.message}`);
  if (!existing) return { found: false, alreadyUnsubscribed: false };
  if (field === 'unsubscribe_token' && !recoitLaNewsletter(existing.source)) {
    return { found: false, alreadyUnsubscribed: false };
  }
  if (existing.status === 'unsubscribed') {
    return { found: true, alreadyUnsubscribed: true };
  }

  const { error: majErr } = await supabase
    .from('newsletter_subscribers')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('id', existing.id);
  if (majErr) throw new Error(`Failed to unsubscribe: ${majErr.message}`);

  if (existing.user_id) {
    await syncProfileNewsletterFlag(existing.user_id, false);
  }

  return { found: true, alreadyUnsubscribed: false };
}

/** Ce que la page de désabonnement montre d'un abonnement désigné par son jeton. */
export interface AbonnementParJeton {
  email: string;
  status: SubscriberStatus;
}

/**
 * Abonnement à la newsletter désigné par un jeton de désabonnement, pour la
 * page qui demande de confirmer. `null` si le jeton est inconnu ou s'il désigne
 * une adresse de la seule liste d'attente (celle-ci ne se quitte pas).
 */
export async function abonnementParJeton(jeton: string): Promise<AbonnementParJeton | null> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Supabase service client unavailable');

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('email, status, source')
    .eq('unsubscribe_token', jeton)
    .maybeSingle();

  if (error) throw new Error(`Failed to lookup subscriber: ${error.message}`);
  if (!data || !recoitLaNewsletter(data.source)) return null;
  return { email: data.email, status: data.status as SubscriberStatus };
}

/**
 * Réabonnement depuis la page de désabonnement (« Vous changez d'avis ? »).
 * Seule une adresse qui s'est désabonnée elle-même revient : jamais une adresse
 * en rebond ou qui nous a classés en indésirable, ni une adresse de la seule
 * liste d'attente. Aucun mail ne part. Idempotent.
 */
export async function reabonnerParJeton(jeton: string): Promise<{ found: boolean; reabonne: boolean }> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Supabase service client unavailable');

  const { data: existing, error: selErr } = await supabase
    .from('newsletter_subscribers')
    .select('id, status, user_id, source')
    .eq('unsubscribe_token', jeton)
    .maybeSingle();

  if (selErr) throw new Error(`Failed to lookup subscriber: ${selErr.message}`);
  if (!existing || !recoitLaNewsletter(existing.source)) return { found: false, reabonne: false };
  if (existing.status !== 'unsubscribed') return { found: true, reabonne: false };

  const { error: majErr } = await supabase
    .from('newsletter_subscribers')
    .update({
      status: 'active',
      unsubscribed_at: null,
      opt_in_at: new Date().toISOString(),
    })
    .eq('id', existing.id);
  if (majErr) throw new Error(`Failed to resubscribe: ${majErr.message}`);

  if (existing.user_id) {
    await syncProfileNewsletterFlag(existing.user_id, true);
  }

  return { found: true, reabonne: true };
}
