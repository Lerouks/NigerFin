import Link from 'next/link';
import {
  BookOpen, TrendingUp, BarChart3, Landmark, Banknote, PiggyBank,
  LineChart, Wallet, Scale, ShieldCheck, Globe, Briefcase,
  Building2, Coins, Clock, GraduationCap, type LucideIcon,
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
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {categories.map((cat) => {
        const Icon = iconMap[cat.icon] || BookOpen;

        if (cat.available) {
          return (
            <Link
              key={cat.id}
              href={`/education/${cat.slug}`}
              className="group relative flex flex-col justify-between rounded-xl p-5 h-[160px] md:h-[180px] text-left transition-all duration-150 border bg-foreground border-white/6 text-white hover:border-white/20 hover:bg-[#222] hover:shadow-lg hover:-translate-y-0.5"
            >
              <Icon className="w-7 h-7 text-white/70 group-hover:text-white transition-colors" aria-hidden="true" />
              <div>
                <p className="text-[14px] font-semibold leading-tight">{cat.title}</p>
                {cat.lesson_count > 0 && (
                  <span className="text-[11px] text-white/70 mt-1 block">{cat.lesson_count} leçon{cat.lesson_count !== 1 ? 's' : ''}</span>
                )}
              </div>
            </Link>
          );
        }

        return (
          <div
            key={cat.id}
            aria-disabled="true"
            className="relative flex flex-col justify-between rounded-xl p-5 h-[160px] md:h-[180px] text-left border bg-foreground border-white/6 text-white/55 cursor-not-allowed"
          >
            <Icon className="w-7 h-7 text-white/55" aria-hidden="true" />
            <div>
              <p className="text-[14px] font-semibold leading-tight text-white/80">{cat.title}</p>
              <span className="text-[11px] text-white/60 mt-1 block">Bientôt disponible</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
