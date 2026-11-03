import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import {
  DUREE_CONSERVATION_JOURS,
  LIMITE_LISTE,
  lireCurseur,
  listerLaCorbeille,
  purgerLaCorbeille,
  restaurerDepuisCorbeille,
  supprimerDefinitivement,
} from '@/lib/corbeille';
import { isValidUUID, safeParseJSON } from '@/lib/validation';

/**
 * La corbeille : ce qui a été supprimé, et le moyen de le remettre en place.
 *
 * GET     purge les entrées dont le dernier jour récupérable est passé, puis
 *         liste les autres, les plus récentes d'abord, par pages de 200 ;
 *         ?avant_le=...&avant_id=... donne la page qui suit cette entrée
 * POST    { id } remet une entrée en place, avec tout ce qui en dépend, ou rien
 * DELETE  ?id=... supprime définitivement une entrée, sans retour possible,
 *         et pour un article ses commentaires et ses j'aime
 *
 * Les trois verbes exigent un compte administrateur : la corbeille contient
 * des articles premium retirés et la progression de lecteurs.
 */

const IDENTIFIANT_INVALIDE = 'Identifiant manquant ou invalide.';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const parametres = new URL(request.url).searchParams;
  const curseur = lireCurseur(parametres.get('avant_le'), parametres.get('avant_id'));
  if (curseur === 'invalide') {
    return NextResponse.json({ error: 'Position dans la liste invalide : rechargez la corbeille.' }, { status: 400 });
  }

  // La liste ne montre jamais une entrée qui aurait déjà dû partir. Une purge
  // en panne n'empêche pas de lire : elle est signalée et rejouée cette nuit.
  await purgerLaCorbeille(auth.serviceClient, 'liste');

  const liste = await listerLaCorbeille(auth.serviceClient, curseur);
  if (!liste.ok) return NextResponse.json({ error: liste.motif }, { status: liste.statut });
  return NextResponse.json({
    entrees: liste.entrees,
    total: liste.total,
    suite: liste.suite,
    limite: LIMITE_LISTE,
    dureeConservationJours: DUREE_CONSERVATION_JOURS,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const corps = await safeParseJSON<{ id?: unknown }>(request);
  if (!corps || !isValidUUID(corps.id)) {
    return NextResponse.json({ error: IDENTIFIANT_INVALIDE }, { status: 400 });
  }

  const resultat = await restaurerDepuisCorbeille(auth.serviceClient, corps.id, auth.user.id);
  if (!resultat.ok) return NextResponse.json({ error: resultat.motif }, { status: resultat.statut });

  return NextResponse.json({
    table: resultat.table,
    titre: resultat.titre,
    message: resultat.message,
    remarques: resultat.remarques,
  });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const id = new URL(request.url).searchParams.get('id');
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: IDENTIFIANT_INVALIDE }, { status: 400 });
  }

  const resultat = await supprimerDefinitivement(auth.serviceClient, id, auth.user.id);
  if (!resultat.ok) return NextResponse.json({ error: resultat.motif }, { status: resultat.statut });
  return NextResponse.json({ success: true, message: resultat.message });
}
