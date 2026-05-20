import DOMPurify from 'isomorphic-dompurify';

/**
 * Wrapper centralisé autour de DOMPurify pour le contenu utilisateur
 * (articles éditeur TipTap, etc).
 *
 * Pourquoi un helper : on enregistre un hook `afterSanitizeAttributes`
 * qui force `rel="noopener noreferrer"` sur tout `<a target="_blank">`,
 * y compris si le contenu est arrivé via paste ou import sans rel.
 * Le hook étant global à DOMPurify, on garantit qu'il est posé une
 * seule fois (idempotent via flag module-level).
 *
 * Audit sécurité 2026-05-20 : H3 sur DOMPurify ADD_ATTR target sans
 * noopener systématique. Ce module est la barrière defense-en-profondeur.
 */

let hookRegistered = false;

function ensureHook(): void {
  if (hookRegistered) return;
  hookRegistered = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Forcer noopener+noreferrer sur tout lien qui ouvre dans un nouvel onglet,
    // protege contre tabnabbing (window.opener manipulation).
    if (
      node instanceof Element &&
      node.tagName === 'A' &&
      node.getAttribute('target') === '_blank'
    ) {
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

/**
 * Sanitize HTML avec les hooks de sécurité NFI Report. Toujours utiliser
 * cette fonction plutôt que DOMPurify.sanitize directement.
 */
export function sanitizeHtml(html: string, config?: object): string {
  ensureHook();
  return DOMPurify.sanitize(html, config);
}
