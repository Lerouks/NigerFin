'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Building2, type LucideIcon } from 'lucide-react';

interface SectionDef {
  slug: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

const SECTIONS: SectionDef[] = [
  { slug: 'presentation', label: 'Présentation', icon: MapPin, description: 'Profil, chiffres clés et ressources' },
  { slug: 'entreprises-strategiques', label: 'Entreprises stratégiques', icon: Building2, description: 'Les 8 piliers de l\'économie' },
];

export function NigerSectionSelector() {
  const pathname = usePathname();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-10">
      <div className="bg-white rounded-2xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] border border-black/[0.06] p-2">
        <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${SECTIONS.length}, 1fr)` }}>
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = pathname === `/niger/${section.slug}`;
            return (
              <Link
                key={section.slug}
                href={`/niger/${section.slug}`}
                className={`
                  relative flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 rounded-xl transition-all duration-300
                  ${isActive
                    ? 'bg-[#111] text-white shadow-lg'
                    : 'bg-transparent text-gray-400 hover:bg-[#f5f5f0] hover:text-gray-600'
                  }
                `}
              >
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                    isActive
                      ? 'bg-[#d4a843]/20'
                      : 'bg-black/[0.04]'
                  }`}
                >
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-300 ${isActive ? 'text-[#d4a843]' : 'text-gray-400'}`} />
                </div>
                <div className="text-left min-w-0">
                  <p className={`text-[14px] sm:text-[16px] font-semibold leading-tight ${isActive ? 'text-white' : 'text-gray-700'}`}>
                    {section.label}
                  </p>
                  <p className={`text-[11px] sm:text-[12px] mt-0.5 hidden sm:block ${isActive ? 'text-white/50' : 'text-gray-400'}`}>
                    {section.description}
                  </p>
                </div>
                {isActive && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#d4a843]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
