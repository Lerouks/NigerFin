import { revalidatePath, revalidateTag } from 'next/cache';
import {
  SYMBOLE_BOA_NIGER,
  URL_COURS_ACTIONS_BRVM,
  URL_INDICES_BRVM,
  ajouterSeance,
  ajouterSeanceAction,
  analyserCoursActionBrvm,
  analyserIndicesBrvm,
  construireSeanceComplete,
  enregistrerSeanceComplete,
  enregistrerSeancesBrvm,
  lireSeanceComplete,
  lireSeancesBrvm,
} from '@/lib/brvm-seances';

/**
 * Le relevé d'une séance de la BRVM, partagé par la tâche planifiée du soir
 * (/api/cron/releve-brvm) et par l'administration (/api/admin/releve-brvm,
 * pour relancer un relevé manqué sans attendre le lendemain).
 *
 * Il ajoute la séance du jour aux historiques du Composite et de BOA Niger
 * (page Finance), et range la séance complète, indices et actions, pour la
 * page Marchés (25/11/2026). Une séance encore ouverte, déjà enregistrée, ou un
 * jour férié (la page répète la dernière séance) ne change rien.
 */

async function lirePage(url: string): Promise<string> {
  const reponse = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'fr' },
    // Les pages de la BRVM mettent parfois plus de trente secondes à répondre.
    signal: AbortSignal.timeout(50_000),
    cache: 'no-store',
  });
  if (!reponse.ok) throw new Error(`BRVM : réponse ${reponse.status} (${new URL(url).pathname})`);
  return reponse.text();
}

export interface BilanReleveBrvm {
  statut: string;
  seance: string;
  cloture: number;
  enregistree: boolean;
  seances: number;
  boaNiger: { cloture: number; enregistree: boolean } | null;
  seanceComplete: { actions: number; enregistree: boolean } | null;
}

export async function releverBrvm(): Promise<BilanReleveBrvm> {
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

  // Une séance n'est reconnue que fermée et distincte de la précédente : c'est
  // elle qui date BOA Niger et la séance complète.
  const seanceReconnue = apres.some((s) => s.date === lecture.date);

  let boaNiger: BilanReleveBrvm['boaNiger'] = null;
  const boan = pageActions ? analyserCoursActionBrvm(pageActions, SYMBOLE_BOA_NIGER) : null;
  if (boan && seanceReconnue) {
    const avantBoan = await lireSeancesBrvm('boan');
    const apresBoan = ajouterSeanceAction(avantBoan, lecture.date, boan);
    const dejaLa = avantBoan.find((s) => s.date === lecture.date);
    const changeBoan = !dejaLa || dejaLa.cloture !== boan.cloture || dejaLa.variation !== boan.variation;
    if (changeBoan) await enregistrerSeancesBrvm(apresBoan, 'boan');
    boaNiger = { cloture: boan.cloture, enregistree: changeBoan };
  }

  let seanceComplete: BilanReleveBrvm['seanceComplete'] = null;
  const complete = seanceReconnue ? construireSeanceComplete(lecture.date, pageIndices, pageActions) : null;
  if (complete) {
    const precedente = await lireSeanceComplete();
    const changeComplete = !precedente || JSON.stringify(precedente) !== JSON.stringify(complete);
    if (changeComplete) await enregistrerSeanceComplete(complete);
    seanceComplete = { actions: complete.actions.length, enregistree: changeComplete };
  }

  if (change || boaNiger?.enregistree || seanceComplete?.enregistree) {
    // Le cache des séances d'abord, puis les pages qui les affichent.
    revalidateTag('brvm-seances', { expire: 0 });
    revalidatePath('/finance');
    revalidatePath('/marches');
  }

  return {
    statut: lecture.statut,
    seance: lecture.date,
    cloture: lecture.composite.cloture,
    enregistree: change,
    seances: apres.length,
    boaNiger,
    seanceComplete,
  };
}
