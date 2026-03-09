'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  BookOpen, TrendingUp, BarChart3, Landmark, Banknote, PiggyBank,
  LineChart, Wallet, Scale, ShieldCheck, Globe, Briefcase,
  Building2, Coins, Clock, Loader2, type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  BookOpen, TrendingUp, BarChart3, Landmark, Banknote, PiggyBank,
  LineChart, Wallet, Scale, ShieldCheck, Globe, Briefcase,
  Building2, Coins, Clock,
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

export function EducationGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/education')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {categories.map((cat) => {
        const Icon = iconMap[cat.icon] || BookOpen;

        if (cat.available) {
          return (
            <Link
              key={cat.id}
              href={`/education/${cat.slug}`}
              className="group relative flex flex-col justify-between rounded-xl p-5 h-[160px] md:h-[180px] text-left transition-all duration-150 border bg-[#1a1a1a] border-white/[0.06] text-white hover:border-white/20 hover:bg-[#222] hover:shadow-lg hover:-translate-y-0.5"
            >
              <Icon className="w-7 h-7 text-white/70 group-hover:text-white transition-colors" />
              <div>
                <p className="text-[14px] font-semibold leading-tight">{cat.title}</p>
                {cat.lesson_count > 0 && (
                  <span className="text-[10px] text-white/30 mt-1 block">{cat.lesson_count} leçon{cat.lesson_count !== 1 ? 's' : ''}</span>
                )}
              </div>
            </Link>
          );
        }

        return (
          <div
            key={cat.id}
            className="relative flex flex-col justify-between rounded-xl p-5 h-[160px] md:h-[180px] text-left border bg-[#1a1a1a] border-white/[0.04] text-white/30 cursor-not-allowed"
          >
            <Icon className="w-7 h-7 text-white/20" />
            <div>
              <p className="text-[14px] font-semibold leading-tight">{cat.title}</p>
              <span className="text-[10px] text-white/20 mt-1 block">Bientôt disponible</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
