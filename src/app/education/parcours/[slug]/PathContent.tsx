'use client';

import useSWR from 'swr';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  CheckCircle2,
  Lock,
  Crown,
  GraduationCap,
  TrendingUp,
  Coins,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';

interface PathLesson {
  step_order: number;
  id: string;
  title: string;
  duration: string;
  access_level: 'free' | 'premium';
  category: { slug: string; title: string };
  completed: boolean;
  completed_at: string | null;
  quiz_score: number | null;
}

interface Path {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  difficulty: string;
  goal_label: string;
  total_minutes: number;
  step_count: number;
  completed_count: number;
  is_signed_in: boolean;
  lessons: PathLesson[];
}

const iconMap: Record<string, LucideIcon> = {
  GraduationCap,
  TrendingUp,
  Coins,
  Briefcase,
  BookOpen,
};

const fetcher = (url: string): Promise<Path> =>
  fetch(url).then(async (res) => {
    if (res.status === 404) throw new Error('not-found');
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  });

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hours} h` : `${hours} h ${rem}`;
}

function PathSkeleton() {
  return (
    <>
      <section className="bg-[#111] text-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-32 bg-white/10 rounded-sm animate-pulse mb-6" />
          <div className="h-8 w-64 bg-white/10 rounded-sm animate-pulse mb-3" />
          <div className="h-4 w-96 bg-white/6 rounded-sm animate-pulse" />
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-5 rounded-xl border border-black/6 bg-white"
            >
              <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/5 bg-gray-200 rounded-sm animate-pulse" />
                <div className="h-3 w-20 bg-gray-100 rounded-sm animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function PathContent({ slug }: { slug: string }) {
  const { data, error, isLoading } = useSWR<Path>(
    `/api/education/paths/${slug}`,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 30_000 },
  );

  if (isLoading) return <PathSkeleton />;

  if (error || !data) {
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
          <h1 className="text-3xl font-bold">Parcours introuvable</h1>
          <p className="text-white/40 mt-2 text-[14px]">
            Ce parcours n&apos;existe pas ou a été désactivé.
          </p>
        </div>
      </section>
    );
  }

  const Icon = iconMap[data.icon] ?? GraduationCap;
  const progressPct =
    data.step_count > 0 ? Math.round((data.completed_count / data.step_count) * 100) : 0;
  const freeLessons = data.lessons.filter((l) => l.access_level === 'free').length;
  const premiumLessons = data.lessons.filter((l) => l.access_level === 'premium').length;

  const firstIncomplete = data.lessons.find((l) => !l.completed);
  const continueTarget = firstIncomplete
    ? `/education/${firstIncomplete.category.slug}#lesson-${firstIncomplete.id}`
    : null;

  return (
    <>
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
            <Icon className="w-6 h-6 text-white/60" />
            <span className="text-[11px] tracking-[0.2em] uppercase text-white/40">Parcours guidé</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{data.title}</h1>
          <p className="text-white/60 text-[15px] max-w-2xl mb-4">{data.description}</p>
          <p className="text-white/40 text-[13px] max-w-2xl mb-6">
            Objectif : {data.goal_label}
          </p>

          <div className="flex flex-wrap gap-3">
            <span className="text-[12px] bg-white/8 text-white/60 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" />
              {data.step_count} leçon{data.step_count !== 1 ? 's' : ''}
            </span>
            <span className="text-[12px] bg-white/8 text-white/60 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {formatDuration(data.total_minutes)}
            </span>
            <span className="text-[12px] bg-white/8 text-white/60 px-3 py-1.5 rounded-full">
              {data.difficulty}
            </span>
            {freeLessons > 0 && (
              <span className="text-[12px] bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-full">
                {freeLessons} gratuite{freeLessons !== 1 ? 's' : ''}
              </span>
            )}
            {premiumLessons > 0 && (
              <span className="text-[12px] bg-gold/20 text-gold px-3 py-1.5 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" />
                {premiumLessons} premium
              </span>
            )}
          </div>

          {data.is_signed_in && data.step_count > 0 && (
            <div className="mt-8 max-w-md">
              <div className="flex items-center justify-between text-[12px] text-white/60 mb-2">
                <span>
                  {data.completed_count}/{data.step_count} terminées
                </span>
                <span className="tabular-nums">{progressPct}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {continueTarget && (
                <Link
                  href={continueTarget}
                  className="mt-4 inline-flex items-center gap-2 bg-white text-[#111] px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-white/90 transition-colors"
                >
                  Continuer : {firstIncomplete?.title}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          )}

          {!data.is_signed_in && (
            <div className="mt-8 max-w-md p-4 rounded-xl bg-white/5 border border-white/8">
              <p className="text-[13px] text-white/70">
                Créez un compte gratuit pour suivre votre avancement, reprendre où vous vous étiez arrêté et
                débloquer vos succès.
              </p>
              <div className="flex gap-2 mt-3">
                <Link
                  href="/inscription"
                  className="inline-flex items-center gap-1.5 bg-white text-[#111] px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-white/90 transition-colors"
                >
                  Créer un compte
                </Link>
                <Link
                  href="/connexion"
                  className="inline-flex items-center gap-1.5 text-white/60 hover:text-white px-4 py-2 text-[12px] font-medium transition-colors"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-[15px] font-semibold text-[#111]">Programme</h2>
          <div className="flex-1 h-px bg-black/6" />
          <span className="text-[12px] text-gray-500">
            {data.step_count} étape{data.step_count !== 1 ? 's' : ''}
          </span>
        </div>

        <ol className="space-y-3">
          {data.lessons.map((lesson) => {
            const isFree = lesson.access_level === 'free';
            const lessonHref = `/education/${lesson.category.slug}#lesson-${lesson.id}`;
            return (
              <li key={lesson.id}>
                <Link
                  href={lessonHref}
                  className={`flex items-center gap-4 p-5 rounded-xl border transition-all duration-200 ${
                    lesson.completed
                      ? 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-200'
                      : 'bg-white border-black/6 hover:border-black/[0.14] hover:shadow-xs'
                  }`}
                >
                  <span
                    className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[13px] font-semibold ${
                      lesson.completed
                        ? 'bg-emerald-500 text-white'
                        : 'bg-secondary text-gray-500'
                    }`}
                  >
                    {lesson.completed ? <CheckCircle2 className="w-4 h-4" /> : lesson.step_order}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-[#111] truncate">{lesson.title}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[11px] text-gray-500">
                        {lesson.category.title}
                      </span>
                      <span className="text-[11px] text-gray-500">•</span>
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lesson.duration}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          isFree
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : 'bg-[#fffbeb] border-[#fde68a] text-[#92400e]'
                        }`}
                      >
                        {isFree ? 'Gratuit' : 'Premium'}
                      </span>
                    </div>
                  </div>
                  {lesson.completed ? (
                    <span className="text-[11px] text-emerald-700 font-medium shrink-0">Terminée</span>
                  ) : isFree ? (
                    <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-300 shrink-0" />
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}
