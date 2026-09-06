import sanitize from 'sanitize-html';
import {
  ALLOWED_ATTRIBUTES,
  ALLOWED_IMAGE_SCHEMES,
  ALLOWED_SCHEMES,
  ALLOWED_STYLE_PROPERTIES,
  ALLOWED_TAGS,
} from './sanitize-policy';

/**
 * Nettoyage du HTML éditorial, côté SERVEUR.
 *
 * Ce module ne doit jamais dépendre d'un DOM, simulé ou non : il tourne dans
 * les routes d'API et dans le rendu serveur, où `jsdom` a déjà cassé la
 * production pendant deux mois et demi (voir sanitize-policy.ts).
 *
 * Pour le navigateur, utiliser `sanitize-html.client.ts`, qui applique la même
 * politique avec DOMPurify et le DOM natif de la page.
 */

const STYLE_RULES: Record<string, RegExp[]> = Object.fromEntries(
  ALLOWED_STYLE_PROPERTIES.map((prop) => [prop, [/^[^;{}()<>]*$/]]),
);

const OPTIONS: sanitize.IOptions = {
  allowedTags: [...ALLOWED_TAGS],
  allowedAttributes: { '*': [...ALLOWED_ATTRIBUTES] },
  allowedSchemes: [...ALLOWED_SCHEMES],
  allowedSchemesByTag: { img: [...ALLOWED_IMAGE_SCHEMES] },
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  allowProtocolRelative: false,
  allowedStyles: { '*': STYLE_RULES },
  // Un lien qui ouvre un nouvel onglet donne sinon au site de destination la
  // main sur l'onglet d'origine (tabnabbing). Barrière posée en 2026-05-20,
  // conservée telle quelle lors du changement de moteur.
  transformTags: {
    a: (tagName, attribs) => {
      if (attribs.target === '_blank') {
        return { tagName, attribs: { ...attribs, rel: 'noopener noreferrer' } };
      }
      return { tagName, attribs };
    },
  },
};

/**
 * Nettoie un fragment de HTML éditorial. Toujours passer par cette fonction
 * plutôt que d'appeler directement la bibliothèque : la politique est commune
 * au serveur et au navigateur, et un appel direct la contournerait.
 */
export function sanitizeHtml(html: string | undefined | null): string {
  if (!html) return '';
  return sanitize(html, OPTIONS);
}
