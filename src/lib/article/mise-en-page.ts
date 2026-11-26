/**
 * Mise en page du texte d'un article, appliquée au moment de l'afficher
 * (jamais en base) : la page d'un article (direction « La colonne », choisie
 * par la direction le 26/11/2026) a besoin d'un texte régulier, quel que soit
 * la façon dont il a été saisi dans l'administration.
 *
 * - Un paragraphe fait d'un seul gras est un intertitre tapé à la main : il
 *   devient un vrai intertitre (<h2>).
 * - Un intertitre placé avant tout paragraphe sert d'accroche : il devient un
 *   paragraphe d'accroche, une phrase par ligne.
 * - Sans autre intertitre de premier rang, les sous-intertitres (<h3>) montent
 *   d'un rang.
 * - Les paragraphes vides disparaissent.
 * - Dans le texte seulement (jamais dans les balises) : trait d'union
 *   insécable entre deux lettres (« États-Unis » ne se coupe pas), unité
 *   soudée à son nombre (« 48 heures », « 20 % »), locutions soudées
 *   (« tandis que »), symbole soudé au mot qui le précède.
 *
 * Idempotente : l'appliquer deux fois donne le même texte qu'une seule fois.
 * Les insécables sont écrites en échappements, jamais en caractères bruts.
 */
import { enPhrases } from '@/lib/typographie-fr';

const INSECABLE = '\u00a0';
const TRAIT_INSECABLE = '\u2011';

const UNITE = /(\d)[ \u00a0](%|‰|FCFA|€|\$|milliards?|millions?|min|minutes?|heures?|h|ans?|mois|jours?|semaines?|km|kg|tonnes?|barils?|dollars?|points?)(?![\p{L}\p{N}])/gu;
const LOCUTION = /(^|[\s(])(tandis|alors|bien|parce|afin|ainsi|dès|pendant|avant|lors) (que|qu’|de|d’)/gu;

/** Corrections qui ne touchent que les nœuds texte d'un fragment HTML. */
function texteSeulement(html: string): string {
  return html
    .split(/(<[^>]*>)/)
    .map((morceau) => {
      if (morceau.startsWith('<')) return morceau;
      return morceau
        .replace(/(\p{L})-(?=\p{L})/gu, `$1${TRAIT_INSECABLE}`)
        .replace(UNITE, `$1${INSECABLE}$2`)
        .replace(LOCUTION, `$1$2${INSECABLE}$3`)
        .replace(/ ([$€])/g, `${INSECABLE}$1`)
        .replace(/S&amp;P (\d)/g, `S&amp;P${INSECABLE}$1`);
    })
    .join('');
}

/** Une phrase par ligne : chaque phrase dans un span, pour qu'aucune ne commence en bout de ligne. */
export function enLignes(html: string): string {
  if (!html || html.includes('<')) return html;
  return enPhrases(html)
    .map((phrase) => `<span class="phrase">${phrase}</span>`)
    .join(' ');
}

export function miseEnPageArticle(html: string): string {
  if (!html) return html;
  let h = texteSeulement(html);
  h = h.replace(/<p>(\s|&nbsp;|\u00a0)*<\/p>/g, '');
  h = h.replace(/<p>\s*<strong>([^<]+)<\/strong>\s*<\/p>/g, '<h2>$1</h2>');
  h = h.replace(/^\s*<h2>([\s\S]*?)<\/h2>/, (_tout, accroche: string) => `<p class="accroche">${enLignes(accroche.trim())}</p>`);
  if (!/<h2[\s>]/.test(h) && /<h3[\s>]/.test(h)) {
    h = h.replace(/<h3(\s|>)/g, '<h2$1').replace(/<\/h3>/g, '</h2>');
  }
  return h;
}

/**
 * Le début d'un article Premium, montré à qui n'est pas abonné : l'accroche
 * s'il y en a une, puis les deux premiers paragraphes (le second s'efface à
 * l'écran). Rien d'autre du texte ne quitte le serveur.
 */
export function debutArticle(html: string): { accroche: string | null; paragraphes: string[] } {
  const corps = miseEnPageArticle(html);
  const accroche = corps.match(/^\s*<p class="accroche">([\s\S]*?)<\/p>/)?.[1] ?? null;
  const reste = accroche === null ? corps : corps.replace(/^\s*<p class="accroche">[\s\S]*?<\/p>/, '');
  const paragraphes = [...reste.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]!).filter((p) => p.trim()).slice(0, 2);
  return { accroche, paragraphes };
}

/** Texte échappé pour un attribut ou un nœud HTML (titres rendus en HTML pour le régleur des lignes). */
export function echapperHtml(texte: string): string {
  return texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Un titre ou un chapô prêt à afficher : échappé, mêmes finitions que le corps. */
export function texteAffiche(texte: string): string {
  return texteSeulement(echapperHtml(texte));
}
