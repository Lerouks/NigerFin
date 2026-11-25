/**
 * Mention de protection des cours, mot pour mot (choix de Raouf, 25/11/2026).
 * Chaque phrase commence en début de ligne, et ses quatre derniers mots restent
 * ensemble : mesuré de 320 à 1 440 px, aucune ligne ne finit sur un début de
 * phrase et aucune phrase ne finit sur une ligne de trois mots. Elle ferme la
 * liste « Sources » des cours du jour, l'encadré de l'accueil et des articles,
 * et la page Marchés : partout où ces chiffres s'affichent.
 */
export function MentionCours() {
  return (
    <>
      <span className="block">
        Ces cours sont donnés à titre <span className="whitespace-nowrap">indicatif, sans garantie d’exactitude.</span>
      </span>
      <span className="block">
        Ils ne constituent <span className="whitespace-nowrap">pas un conseil d’investissement.</span>
      </span>
    </>
  );
}
