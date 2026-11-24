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

/**
 * Fin de paragraphe soudée : les derniers mots restent ensemble jusqu'à en
 * compter quatre, pour qu'aucun paragraphe ni titre ne finisse sur une ligne
 * de deux ou trois mots. Le bloc soudé ne dépasse pas `longueurMax`
 * caractères (32 par défaut) : plus long, il déborderait d'un écran de 320 px. À appliquer
 * après typographieFr (seule l'espace ordinaire est une coupure possible).
 */
export function finSoudee(texte: string, motsDeFin = 4, longueurMax = 32): string {
  if (!texte) return texte;
  const morceaux = texte.split(' ');
  if (morceaux.length < 2) return texte;
  const compter = (s: string) => s.split(/[\u00a0\u202f]+/).filter(Boolean).length;
  let debut = morceaux.length - 1;
  let mots = compter(morceaux[debut]!);
  let longueur = morceaux[debut]!.length;
  while (debut > 0 && mots < motsDeFin && longueur + 1 + morceaux[debut - 1]!.length <= longueurMax) {
    debut -= 1;
    mots += compter(morceaux[debut]!);
    longueur += 1 + morceaux[debut]!.length;
  }
  return [...morceaux.slice(0, debut), morceaux.slice(debut).join(INSECABLE)].join(' ');
}

/**
 * Débuts de phrase soudés : après un point, les premiers mots d'une phrase
 * restent ensemble jusqu'à en compter quatre (au plus `longueurMax`
 * caractères), pour qu'une phrase ne commence jamais par deux ou trois mots
 * abandonnés en fin de ligne. À appliquer après typographieFr.
 */
export function debutsSoudes(texte: string, motsDeDebut = 4, longueurMax = 32): string {
  if (!texte) return texte;
  const morceaux = texte.split(' ');
  const compter = (s: string) => s.split(/[\u00a0\u202f]+/).filter(Boolean).length;
  const finDePhrase = (s: string) => /[.!?\u2026»]$/.test(s) && /[.!?\u2026]/.test(s.slice(-3));
  const sortie: string[] = [];
  let i = 0;
  while (i < morceaux.length) {
    if (i > 0 && finDePhrase(morceaux[i - 1]!)) {
      let bloc = morceaux[i]!;
      let mots = compter(bloc);
      let j = i + 1;
      while (
        j < morceaux.length &&
        mots < motsDeDebut &&
        !finDePhrase(morceaux[j - 1]!) &&
        bloc.length + 1 + morceaux[j]!.length <= longueurMax
      ) {
        bloc += INSECABLE + morceaux[j]!;
        mots += compter(morceaux[j]!);
        j += 1;
      }
      sortie.push(bloc);
      i = j;
    } else {
      sortie.push(morceaux[i]!);
      i += 1;
    }
  }
  return sortie.join(' ');
}

/**
 * Paragraphe ou titre affiché : typographie française, débuts de phrase et
 * fin soudés. Jamais sur un texte justifié (l'insécable y creuse des blancs).
 */
export function paragrapheFr(texte: string, longueurMax = 32): string {
  return finSoudee(debutsSoudes(typographieFr(texte), 4, longueurMax), 4, longueurMax);
}

/**
 * Secteur écrit à la française : « Mines & Ressources » devient « Mines et
 * ressources ». Les sigles (BTP, BCEAO) gardent leurs capitales.
 */
export function secteurFr(secteur: string): string {
  return secteur
    .trim()
    .replace(/\s*&\s*/g, ' et ')
    .split(' ')
    .map((mot, i) =>
      i === 0 || /^[A-ZÀ-ÖØ-Þ0-9]{2,}$/.test(mot) ? mot : mot.charAt(0).toLocaleLowerCase('fr') + mot.slice(1),
    )
    .join(' ');
}
