/**
 * La ligne « À venir » d'un cours, mot pour mot comme Raouf l'a choisie le
 * 26/11/2026 : « À venir : Lire un graphique boursier, et 15 autres leçons. »
 * Aucune date. « et 9 autres leçons » reste d'un seul tenant : la ligne ne
 * finit jamais sur « leçons. » seul ni sur « et ».
 */
export function suiteAVenir(nombre: number): string {
  const reste = nombre - 1;
  if (reste <= 0) return '.';
  const s = reste > 1 ? 's' : '';
  return `, et ${reste} autre${s} leçon${s}.`;
}

/**
 * Le titre de la prochaine leçon. Quand rien ne le suit que le point final,
 * ses trois derniers mots restent ensemble : jamais « OHADA. » seul en fin de
 * paragraphe.
 */
export function titreAVenir(titre: string, nombre: number): string {
  const t = titre.trim();
  if (nombre > 1) return t;
  const mots = t.split(/\s+/);
  if (mots.length < 4) return t;
  return `${mots.slice(0, -3).join(' ')} ${mots.slice(-3).join(' ')}`;
}
