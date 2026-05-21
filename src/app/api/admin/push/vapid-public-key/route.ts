import { NextResponse } from 'next/server';
import { getVapidConfig } from '@/lib/web-push';

/**
 * GET /api/admin/push/vapid-public-key
 *
 * Retourne la clé publique VAPID utilisée par le navigateur pour s'abonner
 * au service push (PushManager.subscribe). Pas besoin d'auth admin :
 * la clé publique est conçue pour être exposée côté client.
 *
 * Retourne 503 si VAPID n'est pas configuré côté serveur, ce qui permet
 * au composant client d'afficher un message clair au lieu de planter.
 */
export async function GET() {
  const config = getVapidConfig();
  if (!config) {
    return NextResponse.json(
      { error: 'Web Push non configuré sur ce serveur' },
      { status: 503 },
    );
  }
  return NextResponse.json({ publicKey: config.publicKey });
}
