import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML pour usage dans les emails React Email.
 *
 * Whitelist minimale pour les contenus admin (TipTap RichTextEditor) qui sont
 * inserés dans dangerouslySetInnerHTML. Bloque scripts, iframes, event handlers,
 * data-uri javascript, etc. (H-2 fix avant lancement public).
 *
 * Si l'admin account est compromis, l'attaquant ne peut plus injecter de JS
 * exécutable dans les emails ni dans la preview server-side.
 */
const EMAIL_SAFE_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'p', 'br', 'span', 'div',
    'b', 'strong', 'i', 'em', 'u', 's',
    'a',
    'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):)/i,
  ADD_ATTR: ['target', 'rel'],
  // Force tous les liens sortants en _blank + rel="noopener noreferrer"
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'style', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'srcset'],
};

export function sanitizeEmailHtml(html: string | undefined | null): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, EMAIL_SAFE_CONFIG);
}
