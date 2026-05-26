import type { Metadata } from 'next';
import { NigerPresentationManager } from '../../NigerPresentationManager';

export const metadata: Metadata = {
  title: 'Niger en chiffres · NFI Cockpit',
  description:
    'Carte, faits clés et régions affichés sur la page présentation Niger.',
  robots: { index: false },
};

export default function SiteNigerPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 pt-6 pb-6">
      <header className="mb-6">
        <p className="text-[10px] tracking-widest uppercase text-foreground/45 font-bold">
          Module Site
        </p>
        <h1 className="font-extrabold text-[26px] leading-tight tracking-tight mt-1">
          Niger en chiffres
        </h1>
        <p className="text-[14px] text-foreground/60 mt-2 leading-relaxed max-w-[560px]">
          Carte interactive, faits clés et régions présentés sur la page
          Niger du site public.
        </p>
      </header>
      <NigerPresentationManager />
    </div>
  );
}
