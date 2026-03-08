import type { Metadata } from 'next';
import { PracticalTools } from '@/components/PracticalTools';

export const revalidate = 3600;

export const metadata: Metadata = { title: 'Outils Financiers', description: 'Simulateurs et calculateurs financiers pour les professionnels au Niger.' };

export default function OutilsPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <section className="bg-[#111] text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/40 block mb-4">Rubrique</span>
          <h1 className="text-4xl md:text-5xl">Outils Financiers</h1>
        </div>
      </section>
      <PracticalTools />
    </div>
  );
}
