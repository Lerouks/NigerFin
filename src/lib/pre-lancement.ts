/**
 * Porte du pré-lancement : ce qu'un visiteur non admin peut atteindre tant que
 * nfireport.com n'est pas ouvert au public.
 *
 * Jusqu'au 23/11/2026, la porte vivait seulement dans le layout racine. Or
 * Next.js ne réexécute pas le layout racine lors d'une navigation interne :
 * depuis une page restée ouverte (la politique de confidentialité, liée depuis
 * la page d'attente), le lien « Retour à l'accueil » affichait tout le site,
 * articles compris. Les routes d'API (liste des articles, recherche), le plan
 * du site et les images de partage n'y passaient pas non plus.
 *
 * La porte est maintenant tenue par `src/proxy.ts`, qui voit TOUTES les
 * requêtes, navigations internes comprises. Ce fichier ne dépend de rien :
 * le proxy et le layout racine lisent les mêmes listes, et les tests aussi.
 */

/** Adresse interne de la page d'attente. Toutes les pages fermées y sont réécrites, l'adresse affichée ne change pas. */
export const PAGE_ATTENTE = '/attente';

/**
 * Repli quand la base ne répond pas. `true` est DÉLIBÉRÉ : tant que le site
 * n'est pas ouvert au public, une panne ne doit jamais ouvrir nfireport.com
 * toute seule. Le jour du lancement, une fois `prelaunch_enabled` basculé à
 * false en base, repasser cette valeur à `false`, pour qu'une panne n'affiche
 * plus la page d'attente à un public qui connaît déjà le site.
 */
export const PRE_LANCEMENT_PAR_DEFAUT = true;

/** Pages qu'un visiteur peut lire pendant le pré-lancement (sans le menu du site). */
const PAGES_OUVERTES = ['/mentions-legales', '/confidentialite', '/cgu', '/cookies'];

/** Pages ouvertes avec leurs sous-pages : la connexion de l'admin et le désabonnement. */
const SECTIONS_OUVERTES = ['/connexion', '/newsletter/desabonnement', '/auth'];

/**
 * Routes d'API qui doivent répondre pendant le pré-lancement. Toutes les autres
 * (articles, recherche, marchés, commentaires…) répondent 404 à un visiteur.
 */
const API_OUVERTES = [
  '/api/waitlist', // formulaire de la page d'attente
  '/api/auth', // connexion de l'admin (retour de lien, journal des tentatives)
  '/api/newsletter/unsubscribe', // liens de désabonnement des courriels, y compris en un clic
  '/api/health', // tâche planifiée quotidienne et surveillance
  '/api/cron', // tâches planifiées de Vercel, protégées par leur secret
  '/api/webhooks', // retours de Resend, signés
  '/api/ipaymoney/callback', // retours du prestataire de paiement, signés
  '/api/revalidate', // protégée par son secret
  '/api/admin', // protégées par le rôle admin
];

/** Fichiers servis tels quels (dossier public, robots.txt). Le plan du site (.xml) n'en fait pas partie. */
const EXTENSIONS_OUVERTES = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'ico',
  'js', 'css', 'woff', 'woff2', 'ttf', 'txt', 'webmanifest', 'mp4', 'webm', 'pdf',
]);

/** `chemin` est `section` ou l'une de ses sous-pages (« /auth » ne couvre pas « /authentique »). */
function dansSection(chemin: string, section: string): boolean {
  return chemin === section || chemin.startsWith(`${section}/`);
}

/** Page lisible par un visiteur pendant le pré-lancement, habillée sans le menu du site. */
export function estPageOuverte(chemin: string): boolean {
  return PAGES_OUVERTES.includes(chemin) || SECTIONS_OUVERTES.some((s) => dansSection(chemin, s));
}

export type DecisionPorte =
  /** Laisser passer la requête telle quelle. */
  | 'passer'
  /**
   * Page fermée : réécrire vers la page d'attente, l'adresse affichée reste la
   * même. Vaut aussi pour les navigations internes et les préchargements : le
   * proxy ne peut pas les distinguer d'un chargement complet (Next.js lui masque
   * leurs en-têtes), et il n'en a pas besoin, une page fermée ne renvoie jamais
   * que la page d'attente.
   */
  | 'attente'
  /** API, fichier ou image de partage fermés : 404. */
  | 'introuvable'
  /** Espace admin sans session : renvoyer vers la connexion. */
  | 'connexion'
  /** Site lancé : la page d'attente n'a plus lieu d'être, retour à l'accueil. */
  | 'accueil';

export interface RequetePorte {
  /** Chemin demandé, sans la chaîne de requête. */
  chemin: string;
  /** Le mode pré-lancement est actif en base. */
  preLancement: boolean;
  /** Le visiteur est un admin connecté. */
  admin: boolean;
  /** Le visiteur a une session valide (connecté, admin ou non). */
  session: boolean;
}

/** Fichiers techniques de Next.js (rechargement à chaud en local, pages d'erreur) et .well-known. */
export function estInfrastructure(chemin: string): boolean {
  return chemin.startsWith('/_next/') || chemin.startsWith('/__nextjs') || dansSection(chemin, '/.well-known');
}

function extension(chemin: string): string | null {
  const dernier = chemin.slice(chemin.lastIndexOf('/') + 1);
  const point = dernier.lastIndexOf('.');
  return point > 0 ? dernier.slice(point + 1).toLowerCase() : null;
}

export function decidePorte(r: RequetePorte): DecisionPorte {
  const { chemin } = r;

  if (!r.preLancement || r.admin) {
    if (!r.preLancement && !r.admin && chemin === PAGE_ATTENTE) return 'accueil';
    return 'passer';
  }

  // Pré-lancement, visiteur qui n'est pas admin.
  if (estInfrastructure(chemin)) return 'passer';

  if (dansSection(chemin, '/api')) {
    return API_OUVERTES.some((a) => dansSection(chemin, a)) ? 'passer' : 'introuvable';
  }

  // Images de partage : seule celle de l'accueil (celle de la page d'attente) reste visible.
  if (/\/(opengraph|twitter)-image/.test(chemin)) {
    return /^\/(opengraph|twitter)-image(-[\w-]+)?$/.test(chemin) ? 'passer' : 'introuvable';
  }

  const ext = extension(chemin);
  if (ext) return EXTENSIONS_OUVERTES.has(ext) ? 'passer' : 'introuvable';

  // Pages.
  if (chemin === PAGE_ATTENTE || estPageOuverte(chemin)) return 'passer';
  if (dansSection(chemin, '/admin') && !r.session) return 'connexion';
  return 'attente';
}
