import type { Metadata } from 'next';
import { EducationGrid } from './EducationGrid';

export const metadata: Metadata = { title: 'Éducation' };

export default function EducationPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Hero */}
      <section className="bg-[#111] text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/40 block mb-4">
            Rubrique
          </span>
          <h1 className="text-4xl md:text-5xl mb-3">Éducation</h1>
          <p className="text-white/50 text-[16px] max-w-xl">
            Apprenez la finance, l&apos;économie et les marchés à votre rythme.
            Choisissez une catégorie pour commencer.
          </p>
        </div>
      </section>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <EducationGrid />
      </div>
    </div>
  );
}
