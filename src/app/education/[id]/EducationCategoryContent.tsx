'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { BookOpen, Clock, Lock, Crown, CheckCircle2, ChevronDown, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useAuth } from '@/lib/auth-context';

interface ProgressEntry {
  lesson_id: string;
  completed_at: string | null;
  last_viewed_at: string;
  quiz_score: number | null;
}

const progressFetcher = (url: string): Promise<ProgressEntry[]> =>
  fetch(url).then((res) => {
    if (!res.ok) return [];
    return res.json();
  });

interface Category {
  id: string;
  slug: string;
  title: string;
  description?: string;
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  access_level: 'free' | 'premium';
  sort_order: number;
  content: string;
}

/* ─── Sous-sections pour les catégories fusionnées ─── */
const SUBSECTIONS: Record<string, { title: string; from: number; to: number }[]> = {
  'bourse-investissement': [
    { title: 'Les fondamentaux de la bourse', from: 1, to: 4 },
    { title: 'Analyse technique', from: 5, to: 9 },
    { title: 'Analyse fondamentale', from: 10, to: 13 },
    { title: 'Psychologie de l’investisseur', from: 14, to: 18 },
  ],
  'economie-niger': [
    { title: 'Macroéconomie', from: 1, to: 3 },
    { title: 'BRVM & intégration UEMOA', from: 4, to: 7 },
    { title: 'Matières premières stratégiques', from: 8, to: 11 },
    { title: 'Investir en pratique depuis le Niger', from: 12, to: 99 },
  ],
  'bases-finance': [
    { title: 'Comprendre la finance', from: 1, to: 5 },
    { title: 'Épargne & investissement', from: 6, to: 9 },
  ],
  'budget-banque': [
    { title: 'Gestion de budget', from: 1, to: 4 },
    { title: 'Services bancaires & financiers', from: 5, to: 8 },
  ],
};

const ACCESS_CONFIG: Record<string, { label: string; color: string; bg: string; requiredRoles: string[] }> = {
  free: { label: 'Gratuit', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100', requiredRoles: ['reader', 'premium', 'admin'] },
  premium: { label: 'Premium', color: 'text-[#92400e]', bg: 'bg-[#fffbeb] border-[#fde68a]', requiredRoles: ['premium', 'admin'] },
};

/* ─── Skeleton de chargement ─── */
function LessonsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-5 rounded-xl border border-black/[0.06] bg-white">
            <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/5 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Lesson row component ─── */
function LessonRow({
  lesson, index, accessible, isOpen, onToggle, isSignedIn, isCompleted, isPending, onToggleComplete,
}: {
  lesson: Lesson; index: number; accessible: boolean; isOpen: boolean;
  onToggle: () => void;
  isSignedIn: boolean;
  isCompleted: boolean;
  isPending: boolean;
  onToggleComplete: () => void;
}) {
  const config = ACCESS_CONFIG[lesson.access_level] || ACCESS_CONFIG.free!;

  return (
    <div id={`lesson-${lesson.id}`} className="group scroll-mt-24">
      <button
        onClick={onToggle}
        className={`w-full text-left flex items-center gap-4 p-5 rounded-xl border transition-all duration-200 ${
          isOpen
            ? 'bg-white border-black/[0.12] shadow-sm rounded-b-none'
            : isCompleted && accessible
              ? 'bg-emerald-50/60 border-emerald-100 hover:border-emerald-200'
              : accessible
                ? 'bg-white border-black/[0.06] hover:border-black/[0.12] hover:shadow-sm'
                : 'bg-white/60 border-black/[0.04] hover:border-black/[0.08]'
        }`}
      >
        <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[13px] font-semibold transition-colors ${
          isCompleted && accessible
            ? 'bg-emerald-500 text-white'
            : isOpen ? 'bg-[#111] text-white' : 'bg-[#f5f5f0] text-gray-500'
        }`}>
          {isCompleted && accessible ? <CheckCircle2 className="w-4 h-4" /> : index}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-[15px] font-medium truncate ${accessible ? 'text-[#111]' : 'text-gray-500'}`}>
            {lesson.title}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[12px] text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />{lesson.duration}
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${config.bg} ${config.color}`}>
              {config.label}
            </span>
            {isCompleted && accessible && (
              <span className="text-[11px] text-emerald-700 font-medium">Terminée</span>
            )}
          </div>
        </div>
        {!accessible ? (
          <Lock className="w-4 h-4 text-gray-300 shrink-0" />
        ) : lesson.content ? (
          <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-gray-200 shrink-0" />
        )}
      </button>
      {isOpen && accessible && lesson.content && (
        <div className="px-6 py-6 bg-white border-x border-b border-black/[0.12] rounded-b-xl">
          <div className="prose prose-sm max-w-none text-gray-700 prose-headings:text-[#111] prose-h2:text-lg prose-h2:mt-0 prose-h3:text-base prose-strong:text-gray-800 prose-a:text-blue-600 prose-table:text-sm prose-img:rounded-lg">
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{lesson.content}</ReactMarkdown>
          </div>
          <div className="mt-6 pt-5 border-t border-black/[0.06] flex items-center justify-between gap-4 flex-wrap">
            {isSignedIn ? (
              <button
                onClick={onToggleComplete}
                disabled={isPending}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                  isCompleted
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-[#111] text-white hover:bg-[#222]'
                }`}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : null}
                {isCompleted ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
              </button>
            ) : (
              <Link
                href="/inscription"
                className="inline-flex items-center gap-2 text-[13px] font-medium text-[#111] hover:underline"
              >
                <CheckCircle2 className="w-4 h-4" />
                Crée un compte pour suivre ton avancement
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Tri : gratuits d'abord, premium ensuite (sort_order comme tri secondaire) ─── */
function sortByAccessLevel(lessons: Lesson[]): Lesson[] {
  const accessRank: Record<Lesson['access_level'], number> = { free: 0, premium: 1 };
  return [...lessons].sort((a, b) => {
    const rankDiff = accessRank[a.access_level] - accessRank[b.access_level];
    if (rankDiff !== 0) return rankDiff;
    return a.sort_order - b.sort_order;
  });
}

/* ─── Render lessons with optional subsections ─── */
function renderLessons(
  slug: string,
  lessons: Lesson[],
  canAccess: (level: string) => boolean,
  openLesson: string | null,
  setOpenLesson: (id: string | null) => void,
  router: ReturnType<typeof useRouter>,
  isSignedIn: boolean,
  completedIds: Set<string>,
  pendingIds: Set<string>,
  onToggleComplete: (lessonId: string) => void,
) {
  const subs = SUBSECTIONS[slug];

  const handleToggle = (lesson: Lesson, accessible: boolean, isOpen: boolean) => {
    if (accessible && lesson.content) {
      setOpenLesson(isOpen ? null : lesson.id);
    } else if (!accessible) {
      router.push('/pricing');
    }
  };

  // No subsections → flat list
  if (!subs) {
    const sortedLessons = sortByAccessLevel(lessons);
    return (
      <div className="space-y-3">
        {sortedLessons.map((lesson, i) => (
          <LessonRow
            key={lesson.id}
            lesson={lesson}
            index={i + 1}
            accessible={canAccess(lesson.access_level)}
            isOpen={openLesson === lesson.id}
            isSignedIn={isSignedIn}
            isCompleted={completedIds.has(lesson.id)}
            isPending={pendingIds.has(lesson.id)}
            onToggleComplete={() => onToggleComplete(lesson.id)}
            onToggle={() => handleToggle(lesson, canAccess(lesson.access_level), openLesson === lesson.id)}
          />
        ))}
      </div>
    );
  }

  // With subsections
  let globalIndex = 0;
  return (
    <div className="space-y-10">
      {subs.map((sub) => {
        const subLessons = sortByAccessLevel(
          lessons.filter((l) => l.sort_order >= sub.from && l.sort_order <= sub.to),
        );
        if (subLessons.length === 0) return null;

        return (
          <div key={sub.title}>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-[14px] font-semibold text-[#111]">{sub.title}</h3>
              <div className="flex-1 h-px bg-black/[0.06]" />
              <span className="text-[11px] text-gray-500">{subLessons.length} leçon{subLessons.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-3">
              {subLessons.map((lesson) => {
                globalIndex++;
                return (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    index={globalIndex}
                    accessible={canAccess(lesson.access_level)}
                    isOpen={openLesson === lesson.id}
                    isSignedIn={isSignedIn}
                    isCompleted={completedIds.has(lesson.id)}
                    isPending={pendingIds.has(lesson.id)}
                    onToggleComplete={() => onToggleComplete(lesson.id)}
                    onToggle={() => handleToggle(lesson, canAccess(lesson.access_level), openLesson === lesson.id)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function EducationCategoryContent({ slug }: { slug: string }) {
  const [category, setCategory] = useState<Category | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const { isSignedIn, userRole } = useAuth();
  const router = useRouter();

  const { data: progressData, mutate: mutateProgress } = useSWR<ProgressEntry[]>(
    isSignedIn ? '/api/education/progress' : null,
    progressFetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  );

  const completedIds = useMemo(
    () => new Set((progressData ?? []).filter((p) => p.completed_at).map((p) => p.lesson_id)),
    [progressData],
  );

  const toggleComplete = useCallback(
    async (lessonId: string) => {
      if (!isSignedIn) return;
      const wasCompleted = completedIds.has(lessonId);
      setPendingIds((prev) => new Set(prev).add(lessonId));
      try {
        const res = await fetch('/api/education/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lesson_id: lessonId, completed: !wasCompleted }),
        });
        if (res.ok) await mutateProgress();
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(lessonId);
          return next;
        });
      }
    },
    [isSignedIn, completedIds, mutateProgress],
  );

  useEffect(() => {
    (async () => {
      try {
        const catRes = await fetch(`/api/education?slug=${encodeURIComponent(slug)}`);
        if (!catRes.ok) { setNotFound(true); setLoading(false); return; }
        const found: Category = await catRes.json();
        if (!found?.id) { setNotFound(true); setLoading(false); return; }
        setCategory(found);

        const lessonsRes = await fetch(`/api/education?category_id=${found.id}`);
        if (lessonsRes.ok) setLessons(await lessonsRes.json());
      } catch { setNotFound(true); }
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (loading || typeof window === 'undefined') return;
    if (!window.location.hash.startsWith('#lesson-')) return;
    const lessonId = window.location.hash.replace('#lesson-', '');
    const target = lessons.find((l) => l.id === lessonId);
    if (!target) return;
    setOpenLesson(lessonId);
    setTimeout(() => {
      document.getElementById(`lesson-${lessonId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }, [loading, lessons]);

  const canAccess = (level: string) => {
    if (level === 'free') return true;
    if (!isSignedIn || !userRole) return false;
    return ACCESS_CONFIG[level]?.requiredRoles.includes(userRole) ?? false;
  };

  if (loading) return <LessonsSkeleton />;

  if (notFound || !category) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-[15px] text-gray-500">Cette catégorie n&apos;existe pas ou a été désactivée.</p>
      </div>
    );
  }

  const freeLessons = lessons.filter((l) => l.access_level === 'free').length;
  const premiumLessons = lessons.filter((l) => l.access_level === 'premium').length;
  const hasPremium = premiumLessons > 0;

  return (
    <>
      {/* Stats chips (rendered below the SSR hero) */}
      <section className="bg-[#111] text-white pb-8 -mt-2">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3">
            <span className="text-[12px] bg-white/[0.08] text-white/60 px-3 py-1.5 rounded-full">
              {lessons.length} leçon{lessons.length !== 1 ? 's' : ''}
            </span>
            {freeLessons > 0 && (
              <span className="text-[12px] bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-full">
                {freeLessons} gratuite{freeLessons !== 1 ? 's' : ''}
              </span>
            )}
            {premiumLessons > 0 && (
              <span className="text-[12px] bg-gold/20 text-gold px-3 py-1.5 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" />{premiumLessons} premium
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Lessons */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-[15px] font-semibold text-[#111]">Programme</h2>
          <div className="flex-1 h-px bg-black/[0.06]" />
          <span className="text-[12px] text-gray-500">{lessons.length} leçon{lessons.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Lesson list (with optional subsections) */}
        {renderLessons(slug, lessons, canAccess, openLesson, setOpenLesson, router, isSignedIn, completedIds, pendingIds, toggleComplete)}

        {/* Empty state */}
        {lessons.length === 0 && (
          <div className="text-center py-16 bg-white border border-black/[0.06] rounded-xl">
            <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-[15px] font-medium text-gray-500">Aucune leçon pour le moment</p>
            <p className="text-[13px] text-gray-300 mt-1">Le contenu sera bientôt disponible.</p>
          </div>
        )}

        {/* Upsell */}
        {hasPremium && lessons.some((l) => !canAccess(l.access_level)) && (
          <div className="mt-10 p-8 bg-gradient-to-br from-[#111] to-[#1a1a1a] text-white rounded-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-gold" />
                  <h3 className="text-lg font-semibold">Débloquez toutes les leçons</h3>
                </div>
                <p className="text-white/50 text-[14px] leading-relaxed">
                  {isSignedIn
                    ? `Accédez aux ${premiumLessons} leçon${premiumLessons !== 1 ? 's' : ''} premium de cette catégorie avec l’abonnement.`
                    : 'Connectez-vous et abonnez-vous pour accéder à l’ensemble du contenu éducatif.'}
                </p>
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 bg-white text-[#111] px-6 py-3 rounded-xl text-[14px] font-semibold hover:bg-white/90 transition-colors shrink-0"
              >
                <Crown className="w-4 h-4" />
                Voir les offres
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
