'use client';

import { ArrowUpRight, ArrowDownLeft, Landmark, Handshake } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  country_code: string;
  type: string;
  description: string;
  display_order: number;
}

const TYPE_CONFIG: Record<string, { icon: typeof ArrowUpRight; label: string; color: string }> = {
  export: { icon: ArrowUpRight, label: 'Export', color: 'text-emerald-600' },
  import: { icon: ArrowDownLeft, label: 'Import', color: 'text-blue-600' },
  investissement: { icon: Landmark, label: 'Investissement', color: 'text-amber-600' },
  aide: { icon: Handshake, label: 'Aide', color: 'text-purple-600' },
};

export function NigerPartners({ partners }: { partners: Partner[] }) {
  if (!partners.length) return null;

  return (
    <section className="border-t border-black/[0.06] pt-14 md:pt-20">
      <div className="mb-10">
        <span className="text-[11px] tracking-[0.2em] uppercase text-gray-400 block mb-3">Relations internationales</span>
        <h2 className="text-2xl md:text-3xl leading-tight">Partenaires economiques</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.map((partner) => {
          const config = TYPE_CONFIG[partner.type] || TYPE_CONFIG.investissement;
          const Icon = config.icon;

          return (
            <div
              key={partner.id}
              className="bg-white rounded-xl border border-black/[0.06] p-5 hover:shadow-sm transition-shadow group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl leading-none">{countryFlag(partner.country_code)}</span>
                  <h3 className="text-[15px] font-medium">{partner.name}</h3>
                </div>
                <div className={`flex items-center gap-1.5 ${config.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium">{config.label}</span>
                </div>
              </div>
              <p className="text-[13px] text-gray-500 leading-relaxed">{partner.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function countryFlag(code: string): string {
  if (code === 'EU') return '\u{1F1EA}\u{1F1FA}';
  const upper = code.toUpperCase();
  const codePoints = Array.from(upper).map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}
