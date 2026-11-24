import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import * as Sentry from '@sentry/nextjs';
import { verifyBearerSecret } from '@/lib/secret-compare';
import {
  URL_INDICES_BRVM,
  ajouterSeance,
  analyserIndicesBrvm,
  enregistrerSeancesBrvm,
  lireSeancesBrvm,
} from '@/lib/brvm-seances';

/**
 * Relevé quotidien du BRVM Composite (vercel.json : 17 h UTC, du lundi au
 * vendredi, après la clôture de 15 h 30). Ajoute la séance du jour à
 * l'historique qui nourrit « Les cours du jour » de la page Finance.
 *
 * La page de la BRVM met parfois plus de trente secondes à répondre : d'où le
 * délai long. Une séance encore ouverte, ou déjà enregistrée, ne change rien.
 */
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!verifyBearerSecret(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const reponse = await fetch(URL_INDICES_BRVM, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'fr' },
      signal: AbortSignal.timeout(50_000),
      cache: 'no-store',
    });
    if (!reponse.ok) throw new Error(`BRVM : réponse ${reponse.status}`);
    const lecture = analyserIndicesBrvm(await reponse.text());
    if (!lecture.composite || !lecture.date) {
      throw new Error('BRVM : ligne du BRVM Composite ou date de séance introuvable');
    }

    const avant = await lireSeancesBrvm();
    const apres = ajouterSeance(avant, lecture);
    const derniere = avant.at(-1);
    const change =
      apres.length !== avant.length ||
      !derniere ||
      derniere.date !== apres.at(-1)?.date ||
      derniere.cloture !== apres.at(-1)?.cloture;

    if (change) {
      await enregistrerSeancesBrvm(apres);
      // Le cache des séances d'abord, puis la page qui les affiche.
      revalidateTag('brvm-seances', { expire: 0 });
      revalidatePath('/finance');
    }

    return NextResponse.json({
      statut: lecture.statut,
      seance: lecture.date,
      cloture: lecture.composite.cloture,
      enregistree: change,
      seances: apres.length,
    });
  } catch (erreur) {
    Sentry.captureException(erreur, { tags: { cron: 'releve-brvm' } });
    return NextResponse.json(
      { error: erreur instanceof Error ? erreur.message : 'Erreur inconnue' },
      { status: 502 },
    );
  }
}
