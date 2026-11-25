import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { verifyBearerSecret } from '@/lib/secret-compare';
import { releverBrvm } from '@/lib/releve-brvm';

/**
 * Relevé quotidien de la BRVM (vercel.json : 17 h UTC, du lundi au vendredi,
 * après la clôture de 15 h 30) : historiques du BRVM Composite et de BOA Niger
 * pour les cours du jour, séance complète pour la page Marchés. Le travail est
 * dans src/lib/releve-brvm.ts, partagé avec /api/admin/releve-brvm.
 */
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!verifyBearerSecret(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const bilan = await releverBrvm();
    // Une ligne par passage dans les journaux de Vercel : de quoi vérifier que
    // le relevé tourne, même les jours où il n'y a rien de nouveau à écrire.
    console.info('[releve-brvm]', JSON.stringify(bilan));
    return NextResponse.json(bilan);
  } catch (erreur) {
    console.error('[releve-brvm]', erreur instanceof Error ? erreur.message : erreur);
    Sentry.captureException(erreur, { tags: { cron: 'releve-brvm' } });
    return NextResponse.json(
      { error: erreur instanceof Error ? erreur.message : 'Erreur inconnue' },
      { status: 502 },
    );
  }
}
