/**
 * Typographie française appliquée au texte saisi dans l'admin (titres,
 * sous-titres, chapôs, corps des articles) au moment de l'afficher.
 *
 * - Une espace insécable remplace l'espace avant « : », « ; », « ? » et « ! »,
 *   pour que la ponctuation ne tombe jamais seule en début de ligne
 *   (« Gazoduc Nigeria-Algérie : … » ne se coupe plus avant le deux-points).
 * - Une espace insécable colle les guillemets français à leur contenu.
 * - L'apostrophe droite entre deux lettres devient l'apostrophe typographique.
 *
 * On ne touche qu'aux espaces déjà présentes : un texte sans espace avant
 * la ponctuation (une adresse web, une heure) reste tel quel.
 */

const INSECABLE = ' ';

export function typographier(texte: string): string;
export function typographier(texte: string | null | undefined): string | null | undefined;
export function typographier(texte: string | null | undefined): string | null | undefined {
  if (!texte) return texte;
  return texte
    .replace(/(\p{L})'(?=\p{L})/gu, '$1’')
    .replace(/[   ]+([:;?!])/g, `${INSECABLE}$1`)
    .replace(/«[   ]*/g, `«${INSECABLE}`)
    .replace(/[   ]*»/g, `${INSECABLE}»`);
}

/**
 * Même traitement pour du HTML : seuls les nœuds texte sont modifiés,
 * jamais les balises ni leurs attributs (liens, sources d'images).
 */
export function typographierHtml(html: string): string {
  if (!html) return html;
  return html
    .split(/(<[^>]*>)/)
    .map((morceau) => (morceau.startsWith('<') ? morceau : typographier(morceau)))
    .join('');
}
