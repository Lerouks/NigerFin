import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';

interface CategoryInfo {
  title: string;
  description?: string | null;
}

export function EducationCategoryHero({ category }: { category: CategoryInfo }) {
  return (
    <section className="bg-[#111] text-white py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/education"
          className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-[13px] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l&apos;éducation
        </Link>

        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-6 h-6 text-white/60" />
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/40">Éducation</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{category.title}</h1>
        {category.description && (
          <p className="text-white/50 text-[15px] max-w-xl">{category.description}</p>
        )}
      </div>
    </section>
  );
}
