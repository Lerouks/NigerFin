import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { parseJsonBody } from '@/lib/validation';

/**
 * POST /api/admin/push/subscribe
 *
 * Enregistre (ou met à jour) une PushSubscription pour l'admin courant.
 * Body : { endpoint, keys: { p256dh, auth } } tel que renvoyé par
 * PushManager.subscribe() côté navigateur.
 *
 * La table push_subscriptions a une contrainte UNIQUE sur endpoint :
 * on utilise upsert sur cette colonne pour gérer la réactivation propre
 * (même device qui se ré-abonne après désabonnement).
 */

const SubscribeBody = z.object({
  endpoint: z.string().trim().url().max(2000),
  keys: z.object({
    p256dh: z.string().trim().min(1).max(500),
    auth: z.string().trim().min(1).max(500),
  }),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { user, serviceClient } = auth;

  const parsed = await parseJsonBody(request, SubscribeBody);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const { endpoint, keys } = parsed.data;
  const userAgent = request.headers.get('user-agent')?.slice(0, 500) ?? null;

  const { error } = await serviceClient
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh_key: keys.p256dh,
        auth_key: keys.auth,
        user_agent: userAgent,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' },
    );

  if (error) {
    return NextResponse.json(
      { error: 'Impossible d\'enregistrer la subscription' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
