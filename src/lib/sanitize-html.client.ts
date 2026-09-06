'use client';

import DOMPurify from 'dompurify';
import {
  ALLOWED_ATTRIBUTES,
  ALLOWED_TAGS,
} from './sanitize-policy';

/**
 * Nettoyage du HTML éditorial, côté NAVIGATEUR.
 *
 * Deuxième barrière : le contenu affiché a déjà été nettoyé par le serveur, à
 * l'enregistrement puis à la lecture. Celle-ci protège l'affichage si un
 * contenu ancien, enregistré avant la barrière serveur, remonte de la base.
 *
 * DOMPurify s'appuie sur le DOM de la page. Les deux composants qui l'utilisent
 * ne rendent leur contenu qu'après l'avoir chargé depuis l'API, donc jamais
 * pendant le rendu serveur ; l'appel ci-dessous se protège quand même du cas
 * où il n'y a pas de document, plutôt que de renvoyer du HTML non nettoyé.
 */

const CONFIG = {
  ALLOWED_TAGS: [...ALLOWED_TAGS],
  ALLOWED_ATTR: [...ALLOWED_ATTRIBUTES],
  ALLOW_DATA_ATTR: false,
};

let hookPose = false;

function poserLeHook(): void {
  if (hookPose) return;
  hookPose = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (
      node instanceof Element &&
      node.tagName === 'A' &&
      node.getAttribute('target') === '_blank'
    ) {
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

export function sanitizeHtmlClient(html: string | undefined | null): string {
  if (!html) return '';
  // Pas de document : on n'a aucun moyen de nettoyer, donc on n'affiche rien
  // plutôt que d'afficher du HTML non vérifié.
  if (typeof window === 'undefined' || !DOMPurify.isSupported) return '';
  poserLeHook();
  return DOMPurify.sanitize(html, CONFIG);
}
