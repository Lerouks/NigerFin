import type { Metadata } from 'next';
import { MarketDataWidget } from '@/components/MarketDataWidget';
import { marketData } from '@/data/mock-data';

export const metadata: Metadata = { title: 'Marchés' };

export default function MarchesPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <section className="bg-[#111] text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/40 block mb-4">Rubrique</span>
          <h1 className="text-4xl md:text-5xl">Marchés</h1>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="max-w-lg mx-auto">
          <MarketDataWidget data={marketData} />
        </div>
      </div>
    </div>
  );
}
