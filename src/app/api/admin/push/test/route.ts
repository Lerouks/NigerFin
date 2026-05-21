import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getVapidConfig, isWebPushError, sendPushTo } from '@/lib/web-push';

/**
 * POST /api/admin/push/test
 *
 * Envoie une notification de test à TOUS les devices de l'admin courant.
 * Si un endpoint renvoie 404 ou 410 (subscription expirée chez le push
 * service), la ligne correspondante est supprimée pour garder la table
 * propre.
 *
 * Réponse : { sent: number, failed: number, removed: number }
 */
export async function POST() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { user, serviceClient } = auth;

  if (!getVapidConfig()) {
    return NextResponse.json(
      { error: 'Web Push non configuré sur ce serveur' },
      { status: 503 },
    );
  }

  const { data: subscriptions, error } = await serviceClient
    .from('push_subscriptions')
    .select('id, endpoint, p256dh_key, auth_key')
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json(
      { error: 'Impossible de charger les subscriptions' },
      { status: 500 },
    );
  }

  const rows = subscriptions ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, removed: 0 });
  }

  const payload = {
    title: 'NFI Cockpit · Test',
    body: 'Notifications activées ! Tu recevras les events business critiques.',
    url: '/admin',
    tag: 'nfi-cockpit-test',
  };

  let sent = 0;
  let failed = 0;
  const expiredIds: string[] = [];

  await Promise.all(
    rows.map(async (row) => {
      try {
        await sendPushTo(
          {
            endpoint: row.endpoint,
            p256dh_key: row.p256dh_key,
            auth_key: row.auth_key,
          },
          payload,
        );
        sent += 1;
      } catch (err) {
        if (isWebPushError(err) && (err.statusCode === 404 || err.statusCode === 410)) {
          expiredIds.push(row.id);
        } else {
          failed += 1;
        }
      }
    }),
  );

  let removed = 0;
  if (expiredIds.length > 0) {
    const { error: deleteError, count } = await serviceClient
      .from('push_subscriptions')
      .delete({ count: 'exact' })
      .in('id', expiredIds);
    if (!deleteError) {
      removed = count ?? expiredIds.length;
    }
  }

  return NextResponse.json({ sent, failed, removed });
}
