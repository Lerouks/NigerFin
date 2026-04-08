'use client';

import { CategoryHero } from '@/components/CategoryHero';
import { NigerPresentation } from '@/components/NigerPresentation';
import { StrategicEnterprisesSection } from '@/components/StrategicEnterprisesSection';

export function NigerPageContent() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CategoryHero
        label="Découvrir"
        title="Niger"
        description="Profil économique, chiffres clés, ressources naturelles et entreprises stratégiques du Niger."
        accentGold
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* Présentation du Niger */}
        <NigerPresentation />

        {/* Entreprises stratégiques */}
        <div className="mt-16 md:mt-24 pt-14 md:pt-20 border-t border-black/[0.06]">
          <StrategicEnterprisesSection />
        </div>
      </div>
    </div>
  );
}
