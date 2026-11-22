import type { Metadata, Viewport } from 'next';
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

// Barre du navigateur sur téléphone et fond du rebond de défilement : noirs,
// comme la page, au lieu du blanc du site.
export const viewport: Viewport = {
  themeColor: '#09090a',
  colorScheme: 'dark',
};

export default function PageAttente() {
  return (
    <>
      <style>{'html,body{background:#09090a}'}</style>
      <ComingSoon />
    </>
  );
}
