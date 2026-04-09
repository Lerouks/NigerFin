import Link from 'next/link';
import {
  BookOpen, TrendingUp, BarChart3, Landmark, Banknote, PiggyBank,
  LineChart, Wallet, Scale, ShieldCheck, Globe, Briefcase,
  Building2, Coins, Clock, ChevronRight, GraduationCap, type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  BookOpen, TrendingUp, BarChart3, Landmark, Banknote, PiggyBank,
  LineChart, Wallet, Scale, ShieldCheck, Globe, Briefcase,
  Building2, Coins, Clock, GraduationCap,
};

interface Category {
  id: string;
  slug: string;
  title: string;
  icon: string;
  description: string;
  available: boolean;
  sort_order: number;
  lesson_count: number;
}

export function EducationGrid({ categories }: { categories: Category[] }) {
  const available = categories.filter((c) => c.available);
  const comingSoon = categories.filter((c) => !c.available);
  const totalLessons = available.reduce((sum, c) => sum + c.lesson_count, 0);

  return (
    <div className="space-y-12">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-6 text-[13px] text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#111]" />
          <span><strong className="text-[#111] font-semibold">{available.length}</strong> catégorie{available.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span><strong className="text-[#111] font-semibold">{totalLessons}</strong> leçon{totalLessons !== 1 ? 's' : ''} disponibles</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gold" />
          <span>Contenu gratuit &amp; premium</span>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {available.map((cat) => {
          const Icon = iconMap[cat.icon] || BookOpen;

          return (
            <Link
              key={cat.id}
              href={`/education/${cat.slug}`}
              className="group relative flex flex-col justify-between rounded-2xl p-6 bg-white border border-black/[0.06] transition-all duration-200 hover:border-black/[0.12] hover:shadow-lg hover:-translate-y-0.5"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#f5f5f0] flex items-center justify-center mb-4 group-hover:bg-[#111] transition-colors duration-200">
                  <Icon className="w-5 h-5 text-[#111] group-hover:text-white transition-colors duration-200" />
                </div>
                <h3 className="text-[16px] font-semibold text-[#111] leading-snug mb-2">{cat.title}</h3>
                {cat.description && (
                  <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2">{cat.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between mt-5 pt-4 border-t border-black/[0.04]">
                {cat.lesson_count > 0 ? (
                  <span className="text-[12px] text-gray-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    {cat.lesson_count} leçon{cat.lesson_count !== 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-[12px] text-gray-300">Aucune leçon</span>
                )}
                <span className="text-[12px] text-gray-400 flex items-center gap-1 group-hover:text-[#111] transition-colors">
                  Commencer
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Coming soon */}
      {comingSoon.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider">Bientôt disponible</h2>
            <div className="flex-1 h-px bg-black/[0.04]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {comingSoon.map((cat) => {
              const Icon = iconMap[cat.icon] || BookOpen;
              return (
                <div
                  key={cat.id}
                  className="flex flex-col items-center text-center rounded-xl p-5 border border-dashed border-black/[0.06] bg-[#fafaf9]"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-[13px] font-medium text-gray-400">{cat.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
