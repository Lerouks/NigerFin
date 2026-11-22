import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon/ComingSoon';

/**
 * Page d'attente du pré-lancement. Le proxy (src/proxy.ts) y réécrit toutes
 * les pages fermées, l'adresse affichée ne change pas, et le layout racine
 * l'affiche seule, sans le menu du site. Un admin peut l'ouvrir à /attente
 * pour la regarder. Une fois le site lancé, /attente renvoie vers l'accueil.
 */
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function PageAttente() {
  return <ComingSoon />;
}
