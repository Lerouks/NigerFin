import { getSiteFeatures } from '@/lib/site-data';
import { isAdminViewer } from '@/lib/viewer';
import { PrelaunchShell } from './PrelaunchShell';

/**
 * Habillage des pages restées ouvertes pendant le pré-lancement (pages
 * légales, connexion, désabonnement). Pour un visiteur, la page porte la
 * marque et le retour à la page d'attente, sans le menu du site. Pour un admin,
 * ou une fois le site lancé, la page s'affiche telle quelle dans le site.
 *
 * L'habillage est porté par la page et non par le layout racine : le layout
 * racine n'est pas réexécuté lors d'une navigation interne, un habillage
 * décidé là-haut selon la page resterait collé à la page suivante.
 */
export async function HabillagePreLancement({ children }: { children: React.ReactNode }) {
  const { prelaunchEnabled } = await getSiteFeatures();
  if (!prelaunchEnabled || (await isAdminViewer())) return <>{children}</>;
  return <PrelaunchShell>{children}</PrelaunchShell>;
}
