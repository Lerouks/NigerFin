import sanitize from 'sanitize-html';
import {
  ALLOWED_STYLE_PROPERTIES,
  EMAIL_ALLOWED_ATTRIBUTES,
  EMAIL_ALLOWED_TAGS,
} from '@/lib/sanitize-policy';

/**
 * Nettoyage du HTML inséré dans un e-mail.
 *
 * Politique volontairement plus étroite que celle des articles : ni image, ni
 * tableau, ni style externe. Si le compte d'administration est un jour
 * compromis, l'attaquant ne doit pas pouvoir faire partir du code exécutable
 * dans un e-mail signé du domaine nfireport.com.
 *
 * Moteur sans DOM, comme le reste du serveur (voir sanitize-policy.ts).
 */

const OPTIONS: sanitize.IOptions = {
  allowedTags: [...EMAIL_ALLOWED_TAGS],
  allowedAttributes: { '*': [...EMAIL_ALLOWED_ATTRIBUTES] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,
  allowedStyles: {
    '*': Object.fromEntries(
      ALLOWED_STYLE_PROPERTIES.map((prop) => [prop, [/^[^;{}()<>]*$/]]),
    ),
  },
  transformTags: {
    a: (tagName, attribs) => {
      if (attribs.target === '_blank') {
        return { tagName, attribs: { ...attribs, rel: 'noopener noreferrer' } };
      }
      return { tagName, attribs };
    },
  },
};

export function sanitizeEmailHtml(html: string | undefined | null): string {
  if (!html) return '';
  return sanitize(html, OPTIONS);
}
