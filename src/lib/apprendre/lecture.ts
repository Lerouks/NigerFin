/**
 * Outils purs de la rubrique Apprendre : adresse d'une leçon, temps de lecture,
 * chapeau et corps. Aucun accès à la base ici, pour être testés simplement et
 * servir aussi bien au serveur qu'à l'administration.
 */

/** Mots lus par minute pour un texte d'apprentissage, plus lent qu'un article. */
export const MOTS_PAR_MINUTE = 180;

/**
 * Adresse d'une leçon à partir de son titre : minuscules, sans accents, mots
 * séparés par des tirets (« Qu'est-ce que la finance ? » donne
 * « qu-est-ce-que-la-finance »). Même règle que la contrainte de la base
 * (migration 00035).
 */
export function slugifier(titre: string): string {
  return titre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

/** Une adresse valide pour la base : minuscules, chiffres et tirets simples. */
export function slugValide(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length <= 80;
}

/** Le texte lisible d'un contenu Markdown, sans balises ni syntaxe. */
export function texteBrut(markdown: string): string {
  return markdown
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_>`|]/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Nombre de mots d'un contenu. */
export function compterMots(markdown: string): number {
  const texte = texteBrut(markdown);
  if (!texte) return 0;
  return texte.split(' ').filter((mot) => /[\p{L}\p{N}]/u.test(mot)).length;
}

/**
 * Temps de lecture réel, en minutes entières (au moins 2). Calculé sur la
 * longueur du texte, jamais saisi à la main : la durée affichée suit seule
 * chaque correction de la leçon.
 */
export function minutesDeLecture(markdown: string): number {
  return Math.max(1, Math.ceil(compterMots(markdown) / MOTS_PAR_MINUTE));
}

export interface LeconDecoupee {
  /** Premier paragraphe, affiché en chapeau sous le titre. */
  chapeau: string;
  /** Le reste de la leçon, en Markdown. */
  corps: string;
}

/** Un bloc Markdown qui n'est pas un paragraphe de texte simple. */
function blocSpecial(bloc: string): boolean {
  return /^(#{1,6}\s|<|[-*+]\s|\d+\.\s|>|\||```)/.test(bloc.trimStart());
}

/**
 * Sépare le chapeau (premier paragraphe) du corps. Un premier intertitre qui
 * répète le titre de la leçon est retiré : les leçons écrites en mars 2026
 * commençaient toutes par leur propre titre.
 */
export function decouperLecon(markdown: string, titre: string): LeconDecoupee {
  const blocs = markdown.replace(/\r\n/g, '\n').split(/\n{2,}/);
  const normaliser = (t: string) => slugifier(t.replace(/^#+\s*/, ''));
  if (blocs[0] && /^#{1,3}\s/.test(blocs[0].trim()) && normaliser(blocs[0]) === normaliser(titre)) {
    blocs.shift();
  }
  const premier = blocs[0]?.trim() ?? '';
  if (!premier || blocSpecial(premier)) {
    return { chapeau: '', corps: blocs.join('\n\n').trim() };
  }
  return { chapeau: premier.replace(/\s*\n\s*/g, ' '), corps: blocs.slice(1).join('\n\n').trim() };
}

/** Une idée d'une leçon d'une minute : sa phrase en gras, puis son explication. */
export interface IdeeLecon {
  titre: string;
  texte: string;
}

export interface LeconEnIdees {
  idees: IdeeLecon[];
  /** La phrase de fin, après les idées ; vide s'il n'y en a pas. */
  fin: string;
}

/**
 * Le corps d'une leçon d'une minute, au format choisi par Raouf le 26/11/2026
 * (« une phrase d'entrée, trois idées, une phrase de fin, puis la question ») :
 * une liste numérotée « 1. **Idée.** Explication. », puis la phrase de fin.
 * Null quand le corps suit un autre format : il est alors rendu tel quel.
 */
export function decouperIdees(corps: string): LeconEnIdees | null {
  const blocs = corps
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (blocs.length < 1 || blocs.length > 2) return null;
  const lignes = blocs[0]!.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lignes.length < 2) return null;
  const idees: IdeeLecon[] = [];
  for (const ligne of lignes) {
    const m = /^\d+\.\s+\*\*(.+?)\*\*\s*(.*)$/.exec(ligne);
    if (!m) return null;
    idees.push({ titre: m[1]!.trim(), texte: m[2]!.trim() });
  }
  const fin = blocs[1] ?? '';
  if (fin && blocSpecial(fin)) return null;
  return { idees, fin: fin.replace(/\s*\n\s*/g, ' ') };
}

/**
 * Les phrases d'un texte : un point, un point d'exclamation ou d'interrogation
 * suivi d'une majuscule, mais pas après « M. », « art. », « p. » ou « n° ».
 * Sert aux accroches (chapeau, question de fin) : une phrase par ligne, pour
 * qu'aucune ne commence en bout de ligne (règle de Raouf pour les sites).
 */
export function phrases(texte: string): string[] {
  const sortie: string[] = [];
  const re = /([.!?…]["»”)]?)\s+(?=[«“"(]?\p{Lu})/gu;
  let debut = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texte))) {
    const fin = m.index + m[1]!.length;
    if (/(?:^|\s)(?:M|art|p|n°)\.$/i.test(texte.slice(debut, fin))) continue;
    sortie.push(texte.slice(debut, fin).trim());
    debut = re.lastIndex;
  }
  sortie.push(texte.slice(debut).trim());
  return sortie.filter(Boolean);
}

/** Les intertitres de section d'une leçon (### dans le Markdown), dans l'ordre. */
export function intertitres(markdown: string): string[] {
  return [...markdown.matchAll(/^#{2,3}\s+(.+)$/gm)].map((m) => m[1]!.trim());
}

/** La leçon où reprendre : la première pas encore lue, sinon la première du cours. */
export function leconDeDepart<T extends { id: string }>(lecons: T[], lues: Set<string>): { lecon: T; reprise: boolean } | null {
  if (lecons.length === 0) return null;
  const suivante = lecons.find((l) => !lues.has(l.id));
  const reprise = lues.size > 0 && lecons.some((l) => lues.has(l.id));
  return { lecon: suivante ?? lecons[0]!, reprise: reprise && !!suivante };
}
