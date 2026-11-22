/**
 * Chargement complet d'une page du site, pas une navigation interne.
 *
 * À utiliser quand la session change (connexion, déconnexion) : le layout
 * racine choisit l'habillage selon le lecteur (site complet pour un admin,
 * page sans menu pour un visiteur pendant le pré-lancement), et Next.js ne le
 * réévalue que lors d'un vrai chargement. Une navigation interne garderait
 * l'habillage de l'ancienne session.
 *
 * `remplacer` évite de laisser la page quittée dans l'historique (page de
 * changement de mot de passe, par exemple).
 */
export function chargementComplet(chemin: string, { remplacer = false }: { remplacer?: boolean } = {}) {
  if (remplacer) window.location.replace(chemin);
  else window.location.assign(chemin);
}
