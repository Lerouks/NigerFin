/**
 * Typographie française des messages affichés à l'écran.
 *
 * Sans espace insécable, le navigateur peut rejeter un deux-points ou un
 * guillemet fermant seul en début de ligne, ou laisser « le », « et », « de »
 * seuls en fin de ligne, et seulement à certaines largeurs d'écran : le défaut
 * ne se voit pas en écrivant le texte, il apparaît sur le téléphone. Les textes
 * de l'écran et les messages composés par le serveur (titres d'articles,
 * motifs d'échec) passent donc par ici avant d'être affichés.
 *
 * Mêmes règles que le correcteur de référence des sites (insécables de
 * ponctuation, apostrophe, points de suspension, milliers), plus la soudure
 * des mots-outils au mot qui les suit.
 *
 * Idempotente : l'appliquer deux fois donne le même texte qu'une seule fois.
 * Les insécables sont écrites en échappements, jamais en caractères bruts.
 */

const INSECABLE = '\u00a0';
const FINE_INSECABLE = '\u202f';
const TRAIT_INSECABLE = '\u2011';

/**
 * Mots qui ne doivent jamais finir une ligne : ils restent avec le mot suivant.
 * Articles, prépositions, conjonctions et possessifs, rien d'autre : souder
 * aussi les pronoms sujets formait des blocs insécables trop longs (« ce que
 * vous les supprimiez »), qui forçaient des coupures pires que celles évitées.
 */
const MOTS_OUTILS = [
  'à', 'a', 'au', 'aux', 'avec', 'ce', 'ces', 'cet', 'cette', 'chez', 'dans', 'de', 'des', 'du',
  'en', 'et', 'la', 'le', 'les', 'leur', 'leurs', 'mais', 'ne', 'ni', 'non', 'nos', 'ou', 'par', 'pour',
  'puis', 'que', 'qui', 'sa', 'sans', 'se', 'ses', 'si', 'son', 'sous', 'sur', 'un', 'une',
  'vers', 'vos', 'y',
];
// Aussi après une apostrophe : « d’une leçon » ne se coupe pas après « d’une ».
const MOT_OUTIL = new RegExp(`(^|[\\s«(’'])(${MOTS_OUTILS.join('|')}) (?=\\S)`, 'giu');

function souderMotsOutils(texte: string): string {
  // Deux mots-outils qui se suivent (« de la ») demandent deux passages : la
  // première soudure consomme l'espace qui précède le second.
  let avant = '';
  let apres = texte;
  while (apres !== avant) {
    avant = apres;
    apres = avant.replace(MOT_OUTIL, (_, debut: string, mot: string) => `${debut}${mot}${INSECABLE}`);
  }
  return apres;
}

export function typographieFr(texte: string): string {
  if (!texte) return texte;
  const ponctuee = texte
    // Apostrophe typographique entre deux lettres.
    .replace(/(\p{L})['\u02bc](?=\p{L})/gu, '$1\u2019')
    // Points de suspension en un seul caractère.
    .replace(/\.{3,}/g, '\u2026')
    // Insécable avant le deux-points qui introduit : « 21:55 » et « https:// »
    // restent intacts, le deux-points n'y est pas suivi d'une espace.
    .replace(/[ \u00a0\u202f]*:(?=\s|$)/g, `${INSECABLE}:`)
    // Fine insécable avant ; ! ?
    .replace(/([^\s;!?\u00a0\u202f])[ \u00a0\u202f]*([;!?])/g, `$1${FINE_INSECABLE}$2`)
    // Fine insécable à l'intérieur des guillemets.
    .replace(/«[ \u00a0\u202f]*/g, `«${FINE_INSECABLE}`)
    .replace(/[ \u00a0\u202f]*»/g, `${FINE_INSECABLE}»`)
    // Milliers déjà espacés (1 450) : fine insécable.
    .replace(/\d{1,3}(?:[ \u00a0]\d{3})+\b/g, (nombre) => nombre.replace(/[ \u00a0]/g, FINE_INSECABLE))
    // Trait d'union insécable dans un mot composé : jamais « entre- » en fin de
    // ligne et « temps » au début de la suivante. La police Inter du site a ce
    // glyphe. Jamais dans un lien ni une adresse (« /articles/franc-cfa »), qui
    // doivent rester copiables tels quels.
    .replace(/\S+/g, (mot) => (/[/@]/.test(mot) ? mot : mot.replace(/(\p{L})-(?=\p{L})/gu, `$1${TRAIT_INSECABLE}`)));
  return souderMotsOutils(ponctuee);
}

/** « 1 450 » : nombre à la française, milliers en fine insécable. */
export function nombreFr(nombre: number): string {
  return new Intl.NumberFormat('fr-FR').format(nombre).replace(/[ \u00a0]/g, FINE_INSECABLE);
}

/** Met un texte entre guillemets français, avec les fines insécables. */
export function guillemets(texte: string): string {
  return `«${FINE_INSECABLE}${texte}${FINE_INSECABLE}»`;
}

/**
 * Soude les deux derniers mots d'une phrase : sa dernière ligne n'est jamais
 * un mot seul (« entre-temps. » tout seul sous une phrase de trois lignes).
 */
export function sansMotSeul(phrase: string): string {
  // Seule l'espace ordinaire est une coupure possible : « numéro\u202f». » est
  // un seul mot. Une fin déjà soudée (« de\u00a0lecteurs. ») est laissée telle
  // quelle, ce qui rend la fonction idempotente.
  return phrase.replace(/ (?=[^ \u00a0]+$)/, INSECABLE);
}

/**
 * Découpe un message en phrases, pour afficher chacune sur sa propre ligne :
 * une phrase ne doit jamais commencer dans les derniers mots d'une ligne.
 * Pas de lookbehind dans l'expression : les vieux Safari d'iPhone, encore
 * nombreux au Niger, refuseraient tout le script.
 */
export function enPhrases(texte: string): string[] {
  const morceaux = texte.split(/([.!?\u2026])\s+(?=[A-ZÀ-ÖØ-Ý«])/);
  const phrases: string[] = [];
  for (let i = 0; i < morceaux.length; i += 2) {
    const phrase = `${morceaux[i] ?? ''}${morceaux[i + 1] ?? ''}`.trim();
    if (phrase) phrases.push(phrase);
  }
  return phrases;
}
