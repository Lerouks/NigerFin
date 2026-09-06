/**
 * Politique de sanitisation unique du site.
 *
 * Pourquoi ce fichier : le HTML éditorial (corps d'article écrit dans TipTap)
 * est nettoyé à deux endroits — sur le serveur au moment de l'enregistrement et
 * de la lecture, et dans le navigateur juste avant l'affichage. Ces deux
 * endroits n'utilisent PAS le même moteur (voir plus bas), donc la liste des
 * balises autorisées est définie ici, une seule fois, et les deux moteurs la
 * lisent. Sans ça, les deux barrières divergent en silence et l'une finit par
 * laisser passer ce que l'autre refuse.
 *
 * Pourquoi deux moteurs :
 * - Serveur (Node) : `sanitize-html`, qui n'a besoin d'aucun DOM.
 * - Navigateur : `dompurify`, qui s'appuie sur le DOM natif de la page.
 *
 * Historique, à ne pas refaire : jusqu'au 6 septembre 2026 les deux côtés
 * partageaient `isomorphic-dompurify`, qui simule un DOM sur le serveur avec
 * `jsdom`. Depuis le 16 juin 2026, `jsdom` chargeait un module ESM par
 * `require()`, ce que le runtime de Vercel refuse : les routes des articles et
 * de la newsletter renvoyaient une erreur 500 en production, et l'admin
 * affichait « Aucun article » alors que la base en contenait huit. Aucun DOM
 * simulé ne doit donc revenir côté serveur.
 */

/** Balises autorisées dans un corps d'article. */
export const ALLOWED_TAGS = [
  'p', 'br', 'hr', 'span', 'div',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins', 'mark', 'small', 'sub', 'sup',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
] as const;

/** Attributs autorisés, toutes balises confondues. */
export const ALLOWED_ATTRIBUTES = [
  'href', 'target', 'rel', 'title',
  'src', 'alt', 'width', 'height', 'loading',
  'class', 'style',
  'colspan', 'rowspan', 'scope',
  'start', 'reversed', 'type',
  // Attributs posés par les extensions TipTap (encadrés chiffres, sources...).
  'data-type', 'data-value', 'data-label', 'data-source', 'data-align',
] as const;

/** Propriétés CSS tolérées dans un attribut style. Tout le reste est jeté. */
export const ALLOWED_STYLE_PROPERTIES = [
  'text-align', 'font-weight', 'font-style', 'text-decoration',
  'color', 'background-color', 'width', 'height', 'margin', 'padding',
] as const;

/** Protocoles de lien acceptés. */
export const ALLOWED_SCHEMES = ['http', 'https', 'mailto', 'tel'] as const;

/** Protocoles acceptés pour une image (data: sert aux images collées). */
export const ALLOWED_IMAGE_SCHEMES = ['http', 'https', 'data'] as const;

/**
 * Politique restreinte des e-mails : un client de messagerie ne rend pas le
 * HTML comme un navigateur, et un e-mail ne doit jamais porter d'image ni de
 * tableau injectés depuis un compte d'administration compromis.
 */
export const EMAIL_ALLOWED_TAGS = [
  'p', 'br', 'span', 'div',
  'b', 'strong', 'i', 'em', 'u', 's',
  'a',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote',
] as const;

export const EMAIL_ALLOWED_ATTRIBUTES = ['href', 'target', 'rel', 'class', 'style'] as const;
