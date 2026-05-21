'use client';

import useSWR from 'swr';
import Link from 'next/link';
import {
  BookOpen,
  TrendingUp,
  Coins,
  Briefcase,
  GraduationCap,
  Clock,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';

interface LearningPath {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  difficulty: string;
  goal_label: string;
  step_count: number;
  total_minutes: number;
  completed_count: number;
  is_signed_in: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  GraduationCap,
  TrendingUp,
  Coins,
  Briefcase,
  BookOpen,
};

const fetcher = (url: string): Promise<LearningPath[]> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  });

function SkeletonCard() {
  return (
    <div className="flex flex-col justify-between rounded-xl p-5 h-[200px] md:h-[220px] border bg-white border-black/[0.06]">
      <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hours} h` : `${hours} h ${rem}`;
}

export function LearningPathsSection() {
  const { data: paths, isLoading, error } = useSWR<LearningPath[]>('/api/education/paths', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  if (error) return null;

  return (
    <div className="mb-14 md:mb-20">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold leading-tight">Parcours recommandés</h2>
          <p className="text-[13px] text-gray-500 mt-1">
            Suis une séquence de leçons ordonnée pour atteindre un objectif précis.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading || !paths
          ? [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
          : paths.map((path) => {
              const Icon = iconMap[path.icon] ?? GraduationCap;
              const progressPct =
                path.step_count > 0 ? Math.round((path.completed_count / path.step_count) * 100) : 0;
              const showProgress = path.is_signed_in && path.step_count > 0;
              return (
                <Link
                  key={path.id}
                  href={`/education/parcours/${path.slug}`}
                  className="group flex flex-col justify-between rounded-xl p-5 h-[200px] md:h-[220px] border bg-white border-black/[0.06] hover:border-black/[0.14] hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-full bg-[#f5f5f0] flex items-center justify-center">
                      <Icon className="w-[18px] h-[18px] text-[#111]" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                      {path.difficulty}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold leading-tight text-[#111]">
                      {path.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{path.goal_label}</p>
                    <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {path.step_count} leçon{path.step_count !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(path.total_minutes)}
                      </span>
                    </div>
                    {showProgress && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                          <span>
                            {path.completed_count}/{path.step_count} terminées
                          </span>
                          <span className="tabular-nums">{progressPct}%</span>
                        </div>
                        <div className="h-1 w-full bg-black/[0.05] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-3 text-[12px] font-medium text-[#111] opacity-60 group-hover:opacity-100 transition-opacity">
                      Voir le parcours
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>
    </div>
  );
}
