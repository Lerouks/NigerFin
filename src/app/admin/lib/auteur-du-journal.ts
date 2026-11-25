/** Ce qu'une ligne du journal dit de son auteur (route /api/admin/audit). */
export interface AuteurDuJournal {
  /** Vide pour une action du système, ou quand le compte auteur a été supprimé. */
  admin_id: string | null;
  /** Action automatique : tâche de nuit, retour d'iPayMoney (migration 00034). */
  par_le_systeme?: boolean;
  user_profiles?: { email: string; full_name: string } | null;
}

/** Qui a fait l'action : un compte, le système, ou un compte supprimé depuis. */
export function auteurDeLaLigne(ligne: AuteurDuJournal): string {
  if (ligne.par_le_systeme) return 'Système';
  if (ligne.user_profiles?.email) return ligne.user_profiles.email;
  if (ligne.admin_id) return ligne.admin_id.slice(0, 8) + '…';
  return 'Compte supprimé';
}

/**
 * Le nom à afficher dans le fil d'activité du module Site : le nom complet quand
 * il existe, sinon le même auteur que le journal. Avant le 25/11/2026, une ligne
 * sans auteur (système, compte supprimé) faisait planter toute la page.
 */
export function nomDansLeFil(ligne: AuteurDuJournal): string {
  if (!ligne.par_le_systeme && ligne.user_profiles?.full_name) return ligne.user_profiles.full_name;
  return auteurDeLaLigne(ligne);
}
