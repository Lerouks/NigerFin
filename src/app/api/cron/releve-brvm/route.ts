import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import * as Sentry from '@sentry/nextjs';
import { verifyBearerSecret } from '@/lib/secret-compare';
import {
  SYMBOLE_BOA_NIGER,
  URL_COURS_ACTIONS_BRVM,
  URL_INDICES_BRVM,
  ajouterSeance,
  ajouterSeanceAction,
  analyserCoursActionBrvm,
  analyserIndicesBrvm,
  enregistrerSeancesBrvm,
  lireSeancesBrvm,
} from '@/lib/brvm-seances';

/**
 * Relevé quotidien du BRVM Composite et de BOA Niger (vercel.json : 17 h UTC,
 * du lundi au vendredi, après la clôture de 15 h 30). Ajoute la séance du jour
 * aux historiques qui nourrissent « Les cours du jour » de la page Finance.
 *
 * Les pages de la BRVM mettent parfois plus de trente secondes à répondre :
 * d'où le délai long, les deux pages étant lues en même temps. Une séance
 * encore ouverte, déjà enregistrée, ou un jour férié (la page répète la
 * dernière séance) ne change rien. BOA Niger n'est enregistrée que pour une
 * séance du Composite reconnue : c'est elle qui donne la date.
 */
export const maxDuration = 60;

async function lirePage(url: string): Promise<string> {
  const reponse = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'fr' },
    signal: AbortSignal.timeout(50_000),
    cache: 'no-store',
  });
  if (!reponse.ok) throw new Error(`BRVM : réponse ${reponse.status} (${new URL(url).pathname})`);
  return reponse.text();
}

export async function GET(request: NextRequest) {
  if (!verifyBearerSecret(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // La page des actions est secondaire : sa panne n'empêche pas le relevé du Composite.
    const [pageIndices, pageActions] = await Promise.all([
      lirePage(URL_INDICES_BRVM),
      lirePage(URL_COURS_ACTIONS_BRVM).catch((erreur: unknown) => {
        console.error('[releve-brvm] page des actions :', erreur instanceof Error ? erreur.message : erreur);
        return null;
      }),
    ]);
    const lecture = analyserIndicesBrvm(pageIndices);
    if (!lecture.composite || !lecture.date) {
      throw new Error('BRVM : ligne du BRVM Composite ou date de séance introuvable');
    }

    const avant = await lireSeancesBrvm('composite');
    const apres = ajouterSeance(avant, lecture);
    const derniere = avant.at(-1);
    const change =
      apres.length !== avant.length ||
      !derniere ||
      derniere.date !== apres.at(-1)?.date ||
      derniere.cloture !== apres.at(-1)?.cloture;

    if (change) await enregistrerSeancesBrvm(apres, 'composite');

    // BOA Niger, datée par la séance du Composite (présente dans l'historique
    // seulement si elle est fermée et n'est pas la répétition d'un jour férié).
    let boaNiger: { cloture: number; enregistree: boolean } | null = null;
    const boan = pageActions ? analyserCoursActionBrvm(pageActions, SYMBOLE_BOA_NIGER) : null;
    if (boan && apres.some((s) => s.date === lecture.date)) {
      const avantBoan = await lireSeancesBrvm('boan');
      const apresBoan = ajouterSeanceAction(avantBoan, lecture.date, boan);
      const dejaLa = avantBoan.find((s) => s.date === lecture.date);
      const changeBoan =
        !dejaLa || dejaLa.cloture !== boan.cloture || dejaLa.variation !== boan.variation;
      if (changeBoan) await enregistrerSeancesBrvm(apresBoan, 'boan');
      boaNiger = { cloture: boan.cloture, enregistree: changeBoan };
    }

    if (change || boaNiger?.enregistree) {
      // Le cache des séances d'abord, puis la page qui les affiche.
      revalidateTag('brvm-seances', { expire: 0 });
      revalidatePath('/finance');
    }

    const bilan = {
      statut: lecture.statut,
      seance: lecture.date,
      cloture: lecture.composite.cloture,
      enregistree: change,
      seances: apres.length,
      boaNiger,
    };
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
