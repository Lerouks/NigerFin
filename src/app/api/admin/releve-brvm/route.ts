import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { requireAdmin } from '@/lib/admin-auth';
import { releverBrvm } from '@/lib/releve-brvm';

/**
 * Relancer à la main le relevé de la BRVM (même travail que la tâche planifiée
 * du soir), pour rattraper une séance manquée ou remplir la page Marchés sans
 * attendre le lendemain. Réservé à l'administration.
 *
 * POST /api/admin/releve-brvm
 */
export const maxDuration = 60;

export async function POST() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const bilan = await releverBrvm();
    console.info('[releve-brvm admin]', JSON.stringify(bilan));
    return NextResponse.json(bilan);
  } catch (erreur) {
    console.error('[releve-brvm admin]', erreur instanceof Error ? erreur.message : erreur);
    Sentry.captureException(erreur, { tags: { admin: 'releve-brvm' } });
    return NextResponse.json(
      { error: erreur instanceof Error ? erreur.message : 'Erreur inconnue' },
      { status: 502 },
    );
  }
}
