import { MOTS_OUTILS } from '@/lib/typographie-fr';

/**
 * Le calcul des fins de ligne d'un paragraphe, sans navigateur : à partir de
 * la largeur de chaque mot et de chaque espace (mesurées à l'écran par
 * AjusteurLignes), rejouer la mise en page du navigateur et chercher les
 * quelques espaces à rendre insécables pour respecter les règles de Raouf :
 * jamais une dernière ligne de un à trois mots, jamais un début de phrase
 * laissé en bout de ligne, jamais un mot-outil en fin de ligne, pas de ligne à
 * moitié vide au milieu d'un paragraphe.
 */

export const INSECABLE = ' ';
/** Les espaces où le navigateur peut passer à la ligne. */
export const SECABLES = ' \n\t\r';

const FIN_DE_PHRASE = /[.!?…]["»”)]?$/;
const ABREVIATION = /^(M\.|n°|art\.|p\.)$/i;
const DEBUT_DE_PHRASE = /^[«“"(]?\p{Lu}/u;
const PONCTUATION_EN_TETE = /^[:;!?»,.)]/;
const OUTILS = new Set(MOTS_OUTILS);
/**
 * Mots qui ne finissent pas une ligne non plus, sans être soudés à l'avance
 * (des blocs trop longs) : les pronoms sujets, séparés de leur verbe, et la
 * liste de Raouf (« moins, dans, pour, avec, entre, aussi, donc, bien, doit, peut »).
 */
const FIN_INTERDITE = new Set(['il', 'ils', 'elle', 'elles', 'on', 'moins', 'entre', 'aussi', 'donc', 'bien', 'doit', 'peut']);

/** Un mot tel qu'il se coupe, avec sa position horizontale à l'écran. */
export interface MotMesure {
  texte: string;
  gauche: number;
  droite: number;
}

/** L'espace qui précède un mot : son caractère (« plusieurs » pour une suite de blancs) et sa largeur. */
export interface Espace {
  car: string;
  largeur: number;
}

/** Une mise en page : la ligne de chaque mot, la largeur de chaque ligne, et si un morceau dépasse. */
export interface Mise {
  ligneDe: number[];
  largeurs: number[];
  deborde: boolean;
}

const cassable = (e: Espace, colle: boolean) => !colle && (SECABLES.includes(e.car) || e.car === 'plusieurs');

/**
 * Rejoue la mise en page du navigateur : chaque morceau insécable va sur la
 * ligne en cours s'il y tient, sinon il ouvre la ligne suivante.
 * `espaces[j]` est l'espace avant le mot j ; `colles` les espaces rendus insécables.
 */
export function simuler(
  mots: MotMesure[],
  espaces: Espace[],
  colles: Set<number>,
  largeur: number,
  tolerance: number,
  largeurInsecable: number,
): Mise {
  const ligneDe: number[] = [];
  const largeurs: number[] = [];
  let deborde = false;
  let ligne = -1;
  let occupe = 0;
  let j = 0;
  while (j < mots.length) {
    let k = j;
    let w = mots[j]!.droite - mots[j]!.gauche;
    while (k + 1 < mots.length && !cassable(espaces[k + 1]!, colles.has(k + 1))) {
      w += (colles.has(k + 1) ? largeurInsecable : espaces[k + 1]!.largeur) + (mots[k + 1]!.droite - mots[k + 1]!.gauche);
      k += 1;
    }
    if (ligne >= 0 && occupe + espaces[j]!.largeur + w <= largeur + tolerance) {
      occupe += espaces[j]!.largeur + w;
    } else {
      if (ligne >= 0) largeurs.push(occupe);
      ligne += 1;
      occupe = w;
      if (w > largeur + tolerance) deborde = true;
    }
    for (let i = j; i <= k; i += 1) ligneDe[i] = ligne;
    j = k + 1;
  }
  largeurs.push(occupe);
  return { ligneDe, largeurs, deborde };
}

/** Note d'une mise en page, plus basse quand c'est mieux ; `durs` compte les défauts interdits. */
export function noter(
  mots: MotMesure[],
  mise: Mise,
  largeur: number,
  nbColles: number,
  finDeParagraphe = false,
): { note: number; durs: number } {
  const n = mise.largeurs.length;
  const parLigne: number[][] = Array.from({ length: n }, () => []);
  mise.ligneDe.forEach((l, j) => parLigne[l]!.push(j));
  const vrai = (j: number) => /[\p{L}\p{N}]/u.test(mots[j]!.texte);
  let note = 2 * n + 0.3 * nbColles;
  let durs = 0;
  if (mise.deborde) {
    note += 100000;
    durs += 1;
  }
  // Dernière ligne de un à trois mots, dans un bloc d'au moins huit mots (ou la
  // dernière phrase d'un paragraphe qui en compte huit : sa fin est celle du paragraphe).
  if (n >= 2 && (finDeParagraphe || mots.filter((_, j) => vrai(j)).length >= 8) && parLigne[n - 1]!.filter(vrai).length <= 3) {
    note += 1000;
    durs += 1;
  }
  for (let i = 0; i < n - 1; i += 1) {
    // Ligne creuse : moins de la moitié de la colonne est un trou.
    const part = Math.min(mise.largeurs[i]! / largeur, 1);
    if (part < 0.35) note += 1200;
    else if (part < 0.5) note += 400;
    else if (part < 0.62) note += 40;
    if (part < 0.5) durs += 1;
    note += 20 * (1 - part) ** 2;
    // Début de phrase : un à trois mots laissés en bout de ligne, la phrase continuant dessous.
    const idx = parLigne[i]!;
    for (let p = 1; p < idx.length; p += 1) {
      const s = idx[p]!;
      const avant = mots[s - 1]!.texte;
      if (!FIN_DE_PHRASE.test(avant) || ABREVIATION.test(avant) || !DEBUT_DE_PHRASE.test(mots[s]!.texte)) continue;
      const reste = idx.slice(p);
      const finie = reste.some((w) => FIN_DE_PHRASE.test(mots[w]!.texte) && !ABREVIATION.test(mots[w]!.texte));
      const nombre = reste.filter(vrai).length;
      if (!finie && nombre >= 1 && nombre <= 3) {
        note += 1000;
        durs += 1;
      }
    }
    // Mot-outil en fin de ligne, ponctuation en tête de la suivante.
    const dernier = mots[idx[idx.length - 1]!]!.texte.toLowerCase();
    if (OUTILS.has(dernier) || FIN_INTERDITE.has(dernier)) {
      note += 300;
      durs += 1;
    }
    if (PONCTUATION_EN_TETE.test(mots[parLigne[i + 1]![0]!]!.texte)) {
      note += 300;
      durs += 1;
    }
  }
  return { note, durs };
}

/** Espaces qu'il vaut la peine de souder : à chaque passage à la ligne et juste avant. */
function candidats(mise: Mise, espaces: Espace[], deja: number[]): number[] {
  const sortie = new Set<number>();
  for (let j = 1; j < mise.ligneDe.length; j += 1) {
    if (mise.ligneDe[j] === mise.ligneDe[j - 1]) continue;
    for (const c of [j, j - 1, j - 2]) {
      if (c >= 1 && SECABLES.includes(espaces[c]!.car) && !deja.includes(c)) sortie.add(c);
    }
  }
  return [...sortie];
}

/**
 * Recherche en faisceau des espaces à souder (cinq au plus) : chaque pas
 * essaie de souder un espace de plus là où une ligne se coupe et garde les
 * huit meilleures mises en page. Rend les meilleures solutions trouvées, de la
 * meilleure à la moins bonne, toutes meilleures que le paragraphe tel quel :
 * le rendu réel départage, une mesure à l'écran pouvant différer d'un pixel.
 */
export function chercher(
  mots: MotMesure[],
  espaces: Espace[],
  largeur: number,
  tolerance: number,
  largeurInsecable: number,
  combien = 6,
  finDeParagraphe = false,
): number[][] {
  const evaluer = (colles: number[]) => {
    const mise = simuler(mots, espaces, new Set(colles), largeur, tolerance, largeurInsecable);
    return { colles, mise, note: noter(mots, mise, largeur, colles.length, finDeParagraphe).note };
  };
  const depart = evaluer([]);
  let faisceau = [depart];
  const vus = new Set<string>(['']);
  const toutes: (typeof depart)[] = [];
  for (let profondeur = 0; profondeur < 5; profondeur += 1) {
    const suivants: (typeof depart)[] = [];
    for (const etat of faisceau) {
      for (const c of candidats(etat.mise, espaces, etat.colles)) {
        const colles = [...etat.colles, c].sort((a, b) => a - b);
        const cle = colles.join(',');
        if (vus.has(cle)) continue;
        vus.add(cle);
        suivants.push(evaluer(colles));
      }
    }
    if (suivants.length === 0) break;
    suivants.sort((a, b) => a.note - b.note);
    faisceau = suivants.slice(0, 8);
    toutes.push(...faisceau);
  }
  return toutes
    .filter((e) => e.note < depart.note)
    .sort((a, b) => a.note - b.note || a.colles.length - b.colles.length)
    .slice(0, combien)
    .map((e) => e.colles);
}
