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
  return `, et\u00a0${reste}\u00a0autre${s}\u00a0leçon${s}.`;
}

/**
 * Le titre de la prochaine leçon. Quand rien ne le suit que le point final,
 * ses quatre derniers mots restent ensemble : la dernière ligne n'a jamais un,
 * deux ou trois mots seuls (« en zone OHADA. »).
 */
export function titreAVenir(titre: string, nombre: number): string {
  const t = titre.trim();
  if (nombre > 1) return t;
  const mots = t.split(/\s+/);
  if (mots.length < 5) return mots.join('\u00a0');
  return `${mots.slice(0, -4).join(' ')} ${mots.slice(-4).join('\u00a0')}`;
}
