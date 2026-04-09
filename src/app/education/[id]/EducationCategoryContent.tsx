'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Clock, Lock, Crown, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useAuth } from '@/lib/auth-context';

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

const ACCESS_CONFIG: Record<string, { label: string; color: string; bg: string; requiredRoles: string[] }> = {
  free: { label: 'Gratuit', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100', requiredRoles: ['reader', 'premium', 'admin'] },
  premium: { label: 'Premium', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100', requiredRoles: ['premium', 'admin'] },
};

/* ─── Skeleton de chargement ─── */
function LessonsSkeleton() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <section className="bg-[#111] text-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-32 bg-white/10 rounded animate-pulse mb-6" />
          <div className="h-8 w-64 bg-white/10 rounded animate-pulse mb-3" />
          <div className="h-4 w-96 bg-white/[0.06] rounded animate-pulse" />
        </div>
      </section>
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
    </div>
  );
}

export function EducationCategoryContent({ slug }: { slug: string }) {
  const [category, setCategory] = useState<Category | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const { isSignedIn, userRole } = useAuth();
  const router = useRouter();

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

  const canAccess = (level: string) => {
    if (level === 'free') return true;
    if (!isSignedIn || !userRole) return false;
    return ACCESS_CONFIG[level]?.requiredRoles.includes(userRole) ?? false;
  };

  if (loading) return <LessonsSkeleton />;

  if (notFound || !category) {
    return (
      <div className="min-h-screen bg-[#fafaf9]">
        <section className="bg-[#111] text-white py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/education" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-[13px] mb-6">
              <ArrowLeft className="w-4 h-4" />Retour à l&apos;éducation
            </Link>
            <h1 className="text-3xl font-bold">Catégorie introuvable</h1>
            <p className="text-white/40 mt-2 text-[14px]">Cette catégorie n&apos;existe pas ou a été désactivée.</p>
          </div>
        </section>
      </div>
    );
  }

  const freeLessons = lessons.filter((l) => l.access_level === 'free').length;
  const premiumLessons = lessons.filter((l) => l.access_level === 'premium').length;
  const hasPremium = premiumLessons > 0;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Hero */}
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
            <p className="text-white/50 text-[15px] max-w-xl mb-6">{category.description}</p>
          )}

          {/* Stats chips */}
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
              <span className="text-[12px] bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-full flex items-center gap-1">
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
          <span className="text-[12px] text-gray-400">{lessons.length} leçon{lessons.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Lesson list */}
        <div className="space-y-3">
          {lessons.map((lesson, i) => {
            const accessible = canAccess(lesson.access_level);
            const isOpen = openLesson === lesson.id;
            const config = ACCESS_CONFIG[lesson.access_level] || ACCESS_CONFIG.free!;

            const handleClick = () => {
              if (accessible && lesson.content) {
                setOpenLesson(isOpen ? null : lesson.id);
              } else if (!accessible) {
                router.push('/pricing');
              }
            };

            return (
              <div key={lesson.id} className="group">
                <button
                  onClick={handleClick}
                  className={`w-full text-left flex items-center gap-4 p-5 rounded-xl border transition-all duration-200 ${
                    isOpen
                      ? 'bg-white border-black/[0.12] shadow-sm rounded-b-none'
                      : accessible
                        ? 'bg-white border-black/[0.06] hover:border-black/[0.12] hover:shadow-sm'
                        : 'bg-white/60 border-black/[0.04] hover:border-black/[0.08]'
                  }`}
                >
                  {/* Number */}
                  <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[13px] font-semibold ${
                    isOpen ? 'bg-[#111] text-white' : 'bg-[#f5f5f0] text-gray-500'
                  } transition-colors`}>
                    {i + 1}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[15px] font-medium truncate ${accessible ? 'text-[#111]' : 'text-gray-400'}`}>
                      {lesson.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[12px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{lesson.duration}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                  </div>

                  {/* Right action */}
                  {!accessible ? (
                    <Lock className="w-4 h-4 text-gray-300 shrink-0" />
                  ) : lesson.content ? (
                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-gray-200 shrink-0" />
                  )}
                </button>

                {/* Expanded content */}
                {isOpen && accessible && lesson.content && (
                  <div className="px-6 py-6 bg-white border-x border-b border-black/[0.12] rounded-b-xl">
                    <div className="prose prose-sm max-w-none text-gray-700 prose-headings:text-[#111] prose-h2:text-lg prose-h2:mt-0 prose-h3:text-base prose-strong:text-gray-800 prose-a:text-blue-600 prose-table:text-sm prose-img:rounded-lg">
                      <ReactMarkdown rehypePlugins={[rehypeRaw]}>{lesson.content}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {lessons.length === 0 && (
          <div className="text-center py-16 bg-white border border-black/[0.06] rounded-xl">
            <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-[15px] font-medium text-gray-400">Aucune leçon pour le moment</p>
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
                    ? `Accédez aux ${premiumLessons} leçon${premiumLessons !== 1 ? 's' : ''} premium de cette catégorie avec l\u2019abonnement.`
                    : 'Connectez-vous et abonnez-vous pour accéder à l\u2019ensemble du contenu éducatif.'}
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
    </div>
  );
}
