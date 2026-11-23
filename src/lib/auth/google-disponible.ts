import { getSiteFeatures } from '@/lib/site-data';
import { isAdminViewer } from '@/lib/viewer';
import { identifiantsGoogle } from '@/lib/auth/google';

/**
 * La connexion avec Google est-elle ouverte à ce visiteur ?
 *
 * - Jamais tant que les identifiants Google ne sont pas posés sur le serveur :
 *   le bouton n'apparaît pas plutôt que de mener à une erreur.
 * - Pendant le pré-lancement, seulement pour un admin. Les inscriptions sont
 *   fermées au public jusqu'à l'ouverture, et Google ouvrirait un compte au
 *   premier clic (avec son mail de bienvenue).
 */
export async function googleDisponible(): Promise<boolean> {
  if (!identifiantsGoogle()) return false;
  const { prelaunchEnabled } = await getSiteFeatures();
  if (!prelaunchEnabled) return true;
  return isAdminViewer();
}
