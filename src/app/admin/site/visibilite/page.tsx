import type { Metadata } from 'next';
import { SiteFeaturesManager } from '../../SiteFeaturesManager';

export const metadata: Metadata = {
  title: 'Visibilité du site · NFI Cockpit',
  description:
    'Activer ou désactiver les modules visibles sur le site (bandeau Marchés, etc.).',
  robots: { index: false },
};

export default function SiteVisibilitePage() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 pt-6 pb-6">
      <header className="mb-6">
        <p className="text-[10px] tracking-widest uppercase text-foreground/45 font-bold">
          Module Site
        </p>
        <h1 className="font-extrabold text-[26px] leading-tight tracking-tight mt-1">
          Visibilité du site
        </h1>
        <p className="text-[14px] text-foreground/60 mt-2 leading-relaxed max-w-[560px]">
          Active ou coupe les modules visibles sur le site public. Effet
          immédiat après sauvegarde.
        </p>
      </header>
      <SiteFeaturesManager />
    </div>
  );
}
