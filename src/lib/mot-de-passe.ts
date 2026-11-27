import { LISTE_MOTS_DE_PASSE_COURANTS } from '@/lib/mots-de-passe-courants';

/**
 * La règle du mot de passe, la même partout : inscription, paiement, « Mon
 * compte », nouveau mot de passe et serveur (décision de Raouf, 26/11/2026).
 *
 * Au moins 8 caractères, au plus 128, et aucune exigence de majuscule, de
 * chiffre ni de caractère spécial : la norme américaine NIST SP 800-63B
 * (révision de 2025) les interdit, parce qu'elles poussent à des formes
 * prévisibles comme « Niamey2026! ». Elle demande à la place de refuser les
 * mots de passe connus : on refuse les plus courants, les répétitions et les
 * suites (« aaaaaaaa », « 12345678 »), ainsi que l'adresse e-mail ou le nom de
 * la personne.
 */

export const MOT_DE_PASSE_MIN = 8;
export const MOT_DE_PASSE_MAX = 128;

let courants: Set<string> | null = null;

function motsCourants(): Set<string> {
  if (!courants) courants = new Set(LISTE_MOTS_DE_PASSE_COURANTS.split('\n'));
  return courants;
}

const SUITES = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'azertyuiop', 'qwertyuiop', 'qsdfghjklm', 'asdfghjkl'];

function estSuiteOuRepetition(mot: string): boolean {
  if (new Set(mot).size <= 2) return true;
  return SUITES.some((suite) => {
    const inverse = [...suite].reverse().join('');
    return suite.includes(mot) || inverse.includes(mot);
  });
}

export interface ContexteMotDePasse {
  email?: string | null;
  prenom?: string | null;
  nom?: string | null;
}

/** La règle que le mot de passe ne tient pas, en une phrase, ou null s'il convient. */
export function erreurMotDePasse(motDePasse: string, contexte: ContexteMotDePasse = {}): string | null {
  const longueur = [...motDePasse].length;
  if (longueur > MOT_DE_PASSE_MAX) return `Le mot de passe ne doit pas dépasser ${MOT_DE_PASSE_MAX} caractères.`;
  if (longueur < MOT_DE_PASSE_MIN) return `Le mot de passe doit contenir au moins ${MOT_DE_PASSE_MIN} caractères.`;

  const mot = motDePasse.toLowerCase();
  const trop = 'Ce mot de passe est trop facile à deviner. Choisissez-en un autre.';
  if (motsCourants().has(mot) || estSuiteOuRepetition(mot)) return trop;

  const email = contexte.email?.trim().toLowerCase();
  const local = email?.split('@')[0] ?? '';
  if (email && (mot === email || (local.length >= 4 && mot.includes(local)))) {
    return 'Le mot de passe ne doit pas reprendre votre adresse e-mail.';
  }
  const noms = [contexte.prenom, contexte.nom]
    .map((n) => n?.trim().toLowerCase().replace(/\s+/g, '') ?? '')
    .filter((n) => n.length >= 4);
  const sansEspaces = mot.replace(/\s+/g, '');
  if (noms.some((n) => sansEspaces === n || sansEspaces === `${n}123` || sansEspaces === `${n}1234`)) {
    return 'Le mot de passe ne doit pas être votre nom.';
  }
  return null;
}
