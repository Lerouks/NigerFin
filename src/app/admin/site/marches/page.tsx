import type { Metadata } from 'next';
import { MarketDataManager } from '../../MarketDataManager';

export const metadata: Metadata = {
  title: 'Marchés BRVM · NFI Cockpit',
  description:
    'Gestion des indices, devises et matières premières affichés sur le site.',
  robots: { index: false },
};

export default function SiteMarchesPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 pt-6 pb-6">
      <header className="mb-6">
        <p className="text-[10px] tracking-widest uppercase text-[#1a1a1a]/45 font-bold">
          Module Site
        </p>
        <h1 className="font-extrabold text-[26px] leading-tight tracking-tight mt-1">
          Marchés BRVM
        </h1>
        <p className="text-[14px] text-[#1a1a1a]/60 mt-2 leading-relaxed max-w-[560px]">
          Indices, devises et matières premières affichés sur la page d&apos;accueil et
          dans le bandeau Marchés.
        </p>
      </header>
      <MarketDataManager />
    </div>
  );
}
