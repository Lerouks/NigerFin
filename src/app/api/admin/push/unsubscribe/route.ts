import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { parseJsonBody } from '@/lib/validation';

/**
 * DELETE /api/admin/push/unsubscribe
 *
 * Supprime la PushSubscription correspondant à l'endpoint fourni
 * pour l'admin courant. La double condition (endpoint + user_id) garantit
 * qu'un admin ne peut désabonner qu'un de ses propres devices.
 */

const UnsubscribeBody = z.object({
  endpoint: z.string().trim().url().max(2000),
});

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { user, serviceClient } = auth;

  const parsed = await parseJsonBody(request, UnsubscribeBody);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const { endpoint } = parsed.data;

  const { error } = await serviceClient
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json(
      { error: 'Impossible de supprimer la subscription' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
