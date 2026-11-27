/**
 * Le choix des fins de ligne d'un bloc de texte, sans navigateur.
 *
 * Le régleur d'Apprendre (src/lib/apprendre/lignes.ts) ne fait que souder des
 * espaces autour des coupures du navigateur : sur un long paragraphe
 * d'article, il reste des défauts qu'aucune soudure ne lève. Ici, à partir de
 * la largeur de chaque mot et de chaque espace mesurées à l'écran, on choisit
 * toutes les coupures du bloc d'un coup (programmation dynamique, la méthode
 * de TeX), sous les règles de la rédaction :
 * - jamais un mot-outil ni un pronom sujet en fin de ligne ;
 * - jamais un début de phrase de un à trois mots abandonné en bout de ligne ;
 * - jamais une dernière ligne de un à trois mots (dans un bloc d'au moins
 *   huit mots ; un titre équilibré en trois mots bien remplis est toléré) ;
 * - jamais une ponctuation en tête de ligne ;
 * - pas de ligne à moitié vide au milieu d'un bloc.
 * Sans solution parfaite, la mise en page la moins mauvaise est rendue.
 */
import { MOTS_OUTILS } from '@/lib/typographie-fr';

export interface MotMesure {
  texte: string;
  /** Largeur du mot à l'écran, en pixels. */
  largeur: number;
}

export interface EspaceMesure {
  /** Largeur de l'espace qui précède le mot, en pixels. */
  largeur: number;
  /** Faux pour une espace insécable : le navigateur ne peut pas y couper. */
  secable: boolean;
}

/** Un titre (équilibré), un titre de liste, ou un paragraphe. */
export type GenreBloc = 'titre' | 'liste' | 'texte';

const OUTILS = new Set<string>([
  ...MOTS_OUTILS,
  'il', 'ils', 'elle', 'elles', 'on', 'moins', 'entre', 'aussi', 'donc', 'bien', 'doit', 'peut',
  'l’', 'd’', 'qu’', 'n’', 's’', 'c’', 'j’', 'm’', 't’', 'jusqu’', 'lorsqu’', 'puisqu’',
]);
const FIN_DE_PHRASE = /[.!?…]["»”)]?$/;
const ABREVIATION = /^(M\.|n°|art\.|p\.)$/i;
const DEBUT_DE_PHRASE = /^[«“"(]?\p{Lu}/u;
const PONCTUATION_EN_TETE = /^[:;!?»,.)]/;
const BONNE_COUPURE = /[,;:]$/;
const vrai = (t: string) => /[\p{L}\p{N}]/u.test(t);

/** Coût d'une ligne allant du mot i au mot j (inclus) ; l'infini si elle ne tient pas. */
export function coutLigne(
  mots: MotMesure[],
  espaces: EspaceMesure[],
  i: number,
  j: number,
  largeur: number,
  derniere: boolean,
  genre: GenreBloc,
  total: number,
): number {
  let w = 0;
  for (let k = i; k <= j; k += 1) w += mots[k]!.largeur + (k > i ? espaces[k]!.largeur : 0);
  if (w > largeur - 0.75) return Number.POSITIVE_INFINITY;
  const part = w / largeur;
  let cout = 0;
  // Des lignes pleines, proches de la mise en page du navigateur. Une ligne
  // trop courte au milieu d'un bloc se voit plus qu'une coupure fautive :
  // sous le tiers de la colonne, c'est pire qu'une faute ; sous la moitié,
  // un peu moins. Vu le 27/11/2026 : « Le temps » seul sur sa ligne, pour
  // éviter une dernière ligne de trois mots.
  if (!derniere || genre !== 'texte') cout += 800 * (1 - part) ** 2;
  if (!derniere) {
    if (part < 0.35) cout += 12000;
    else if (part < 0.5) cout += 3500;
    else if (part < 0.62) cout += 600;
    const fin = mots[j]!.texte.toLowerCase();
    if (OUTILS.has(fin)) cout += 6000;
    if (PONCTUATION_EN_TETE.test(mots[j + 1]!.texte)) cout += 6000;
    if (BONNE_COUPURE.test(mots[j]!.texte) || FIN_DE_PHRASE.test(mots[j]!.texte)) cout -= 6;
    for (let s = i + 1; s <= j; s += 1) {
      const avant = mots[s - 1]!.texte;
      if (!FIN_DE_PHRASE.test(avant) || ABREVIATION.test(avant) || !DEBUT_DE_PHRASE.test(mots[s]!.texte)) continue;
      let finie = false;
      let nombre = 0;
      for (let k = s; k <= j; k += 1) {
        if (vrai(mots[k]!.texte)) nombre += 1;
        if (FIN_DE_PHRASE.test(mots[k]!.texte) && !ABREVIATION.test(mots[k]!.texte)) finie = true;
      }
      if (!finie && nombre >= 1 && nombre <= 3) cout += 6000;
    }
  } else if (i > 0) {
    let nombre = 0;
    for (let k = i; k <= j; k += 1) if (vrai(mots[k]!.texte)) nombre += 1;
    if (nombre <= 1) cout += 20000;
    else if (total >= 8 && nombre === 2) cout += 8000;
    else if (total >= 8 && nombre === 3) {
      cout += genre === 'titre' ? (part >= 0.6 ? 400 : part >= 0.4 ? 2500 : 6000) : 6000;
    }
  }
  return cout;
}

/**
 * Les mots qui ouvrent une ligne (indices, le premier exclu) dans la meilleure
 * mise en page ; null si un mot ne tient pas seul sur la ligne.
 *
 * `largeur` vaut pour toutes les lignes, ou bien donne la largeur de chacune
 * des premières lignes, la dernière valeur valant pour toutes les suivantes :
 * à côté d'une lettrine, les premières lignes sont plus courtes.
 */
export function meilleuresCoupures(
  mots: MotMesure[],
  espaces: EspaceMesure[],
  largeur: number | readonly number[],
  genre: GenreBloc,
): number[] | null {
  const n = mots.length;
  if (n === 0) return [];
  const largeurs = typeof largeur === 'number' ? [largeur] : [...largeur];
  if (largeurs.length === 0) return null;
  const dernier = largeurs.length - 1;
  const plusLarge = Math.max(...largeurs);
  const total = mots.filter((m) => vrai(m.texte)).length;
  // meilleur[l][i] : coût le plus bas pour poser les mots 0 à i - 1, la ligne
  // suivante (celle qui commence au mot i) étant la ligne l, plafonnée à la dernière largeur.
  const meilleur = largeurs.map(() => new Array<number>(n + 1).fill(Number.POSITIVE_INFINITY));
  const debutPrecedent = largeurs.map(() => new Array<number>(n + 1).fill(-1));
  const lignePrecedente = largeurs.map(() => new Array<number>(n + 1).fill(-1));
  meilleur[0]![0] = 0;
  for (let j = 1; j <= n; j += 1) {
    if (j < n && !espaces[j]!.secable) continue;
    for (let i = j - 1; i >= 0; i -= 1) {
      if (i > 0 && !espaces[i]!.secable) continue;
      // Trop longue même pour la plus large des lignes : commencer plus tôt ne tiendra pas non plus.
      if (coutLigne(mots, espaces, i, j - 1, plusLarge, j === n, genre, total) === Number.POSITIVE_INFINITY) {
        if (i < j - 1) break;
        continue;
      }
      for (let l = 0; l <= dernier; l += 1) {
        if (meilleur[l]![i] === Number.POSITIVE_INFINITY) continue;
        const c = coutLigne(mots, espaces, i, j - 1, largeurs[l]!, j === n, genre, total);
        if (c === Number.POSITIVE_INFINITY) continue;
        const suivante = Math.min(l + 1, dernier);
        if (meilleur[l]![i]! + c < meilleur[suivante]![j]!) {
          meilleur[suivante]![j] = meilleur[l]![i]! + c;
          debutPrecedent[suivante]![j] = i;
          lignePrecedente[suivante]![j] = l;
        }
      }
    }
  }
  let fin = -1;
  for (let l = 0; l <= dernier; l += 1) {
    if (meilleur[l]![n]! < Number.POSITIVE_INFINITY && (fin < 0 || meilleur[l]![n]! < meilleur[fin]![n]!)) fin = l;
  }
  if (fin < 0) return null;
  const debuts: number[] = [];
  for (let j = n, l = fin; j > 0; ) {
    const i = debutPrecedent[l]![j]!;
    const avant = lignePrecedente[l]![j]!;
    if (i > 0) debuts.push(i);
    j = i;
    l = avant;
  }
  return debuts.sort((a, b) => a - b);
}
