/**
 * Règles d'un mot de passe, les mêmes pour « Mon compte » (page et serveur) et
 * pour la page « nouveau mot de passe » : au moins 8 caractères, une
 * majuscule, un chiffre et un caractère spécial. Est spécial tout ce qui n'est
 * ni une lettre sans accent ni un chiffre (« - », « ? », « . », « @ »…) :
 * l'ancienne liste « !@#$%^&* » refusait « Niamey-2026 », que la page
 * « nouveau mot de passe » acceptait.
 */

export const MOT_DE_PASSE_MIN = 8;
export const MOT_DE_PASSE_MAX = 128;

export interface CriteresMotDePasse {
  longueur: boolean;
  majuscule: boolean;
  chiffre: boolean;
  special: boolean;
}

export function criteresMotDePasse(motDePasse: string): CriteresMotDePasse {
  return {
    longueur: motDePasse.length >= MOT_DE_PASSE_MIN,
    majuscule: /[A-Z]/.test(motDePasse),
    chiffre: /\d/.test(motDePasse),
    special: /[^A-Za-z0-9]/.test(motDePasse),
  };
}

/** Le premier critère manquant, en une phrase, ou null si le mot de passe convient. */
export function erreurMotDePasse(motDePasse: string): string | null {
  if (motDePasse.length > MOT_DE_PASSE_MAX) return `Le mot de passe ne doit pas dépasser ${MOT_DE_PASSE_MAX} caractères.`;
  const c = criteresMotDePasse(motDePasse);
  if (!c.longueur) return `Le mot de passe doit contenir au moins ${MOT_DE_PASSE_MIN} caractères.`;
  if (!c.majuscule) return 'Le mot de passe doit contenir au moins une majuscule.';
  if (!c.chiffre) return 'Le mot de passe doit contenir au moins un chiffre.';
  if (!c.special) return 'Le mot de passe doit contenir au moins un caractère spécial, par exemple «\u202F-\u202F» ou «\u202F?\u202F».';
  return null;
}
