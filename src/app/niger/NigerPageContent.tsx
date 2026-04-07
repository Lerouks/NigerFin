'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Building2 } from 'lucide-react';
import { CategoryHero } from '@/components/CategoryHero';
import { NigerPresentation } from '@/components/NigerPresentation';
import { StrategicEnterprisesSection } from '@/components/StrategicEnterprisesSection';

type TabId = 'presentation' | 'entreprises';

export function NigerPageContent() {
  const [activeTab, setActiveTab] = useState<TabId>('presentation');
  const presentationRef = useRef<HTMLDivElement>(null);
  const entreprisesRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Track which section is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section');
            if (id === 'presentation' || id === 'entreprises') {
              setActiveTab(id);
            }
          }
        }
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 },
    );

    const sections = [presentationRef.current, entreprisesRef.current];
    sections.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: TabId) => {
    const ref = id === 'presentation' ? presentationRef : entreprisesRef;
    if (ref.current) {
      const navHeight = navRef.current?.offsetHeight || 64;
      const y = ref.current.getBoundingClientRect().top + window.scrollY - navHeight - 24;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'presentation', label: 'Présentation', icon: MapPin },
    { id: 'entreprises', label: 'Entreprises stratégiques', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CategoryHero
        label="Découvrir"
        title="Niger"
        description="Profil économique, chiffres clés, ressources naturelles et entreprises stratégiques du Niger."
        accentGold
      />

      {/* Sticky navigation */}
      <div
        ref={navRef}
        className="sticky top-[64px] z-30 bg-[#fafaf9]/95 backdrop-blur-sm border-b border-black/[0.06]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1" aria-label="Sections">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => scrollTo(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-4 sm:px-5 py-3.5 text-[13px] sm:text-[14px] font-medium transition-colors duration-200
                    ${isActive
                      ? 'text-[#111]'
                      : 'text-gray-400 hover:text-gray-600'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#d4a843] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* Présentation du Niger */}
        <div ref={presentationRef} data-section="presentation">
          <NigerPresentation />
        </div>

        {/* Entreprises stratégiques */}
        <div ref={entreprisesRef} data-section="entreprises" className="mt-16 md:mt-24">
          <StrategicEnterprisesSection />
        </div>
      </div>
    </div>
  );
}
