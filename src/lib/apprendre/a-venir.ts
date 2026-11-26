/**
 * La ligne « À venir » d'un cours, mot pour mot comme Raouf l'a choisie le
 * 26/11/2026 : « À venir : Lire un graphique boursier, et 15 autres leçons. »
 * Aucune date. Le nombre reste collé à « autres leçons » : la ligne ne finit
 * jamais sur « leçons. » seul.
 */
export function suiteAVenir(nombre: number): string {
  const reste = nombre - 1;
  if (reste <= 0) return '.';
  const s = reste > 1 ? 's' : '';
  return `, et ${reste} autre${s} leçon${s}.`;
}
