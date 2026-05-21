import type { Metadata } from 'next';
import { StrategicEnterprisesManager } from '../../StrategicEnterprisesManager';

export const metadata: Metadata = {
  title: 'Entreprises stratégiques · NFI Cockpit',
  description: 'Fiches détaillées des champions économiques nigériens.',
  robots: { index: false },
};

export default function SiteEntreprisesPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 pt-6 pb-6">
      <header className="mb-6">
        <p className="text-[10px] tracking-widest uppercase text-[#1a1a1a]/45 font-bold">
          Module Site
        </p>
        <h1 className="font-extrabold text-[26px] leading-tight tracking-tight mt-1">
          Entreprises stratégiques
        </h1>
        <p className="text-[14px] text-[#1a1a1a]/60 mt-2 leading-relaxed max-w-[560px]">
          Fiches des champions économiques nigériens publiées sur la section
          Entreprises stratégiques.
        </p>
      </header>
      <StrategicEnterprisesManager />
    </div>
  );
}
