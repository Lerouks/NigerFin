import type { Metadata } from 'next';
import { NigerSection } from '@/components/niger/NigerSection';

export const metadata: Metadata = {
  title: 'Niger — Intelligence interactive',
  description: 'Explorez le Niger à travers des cartes interactives, des données économiques, un tracker des ressources naturelles et un profil complet du pays.',
};

export default function NigerPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Hero */}
      <section className="bg-[#111] text-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/40 block mb-4">Plateforme d&apos;intelligence</span>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-[1.1]">
            Le Niger en données
          </h1>
          <p className="text-[17px] text-white/50 max-w-2xl leading-relaxed">
            Carte interactive, ressources naturelles, indicateurs économiques et profil complet.
            Toutes les données pour comprendre le Niger.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <NigerSection />
      </section>
    </div>
  );
}
