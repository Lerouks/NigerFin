'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Clock, Lock, Crown, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface Category {
  id: string;
  slug: string;
  title: string;
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  access_level: 'free' | 'standard' | 'pro';
  sort_order: number;
  content: string;
}

const ACCESS_CONFIG: Record<string, { label: string; color: string; requiredRoles: string[] }> = {
  free: { label: 'Gratuit', color: 'bg-emerald-100 text-emerald-700', requiredRoles: ['reader', 'standard', 'pro', 'admin'] },
  standard: { label: 'Standard', color: 'bg-blue-100 text-blue-700', requiredRoles: ['standard', 'pro', 'admin'] },
  pro: { label: 'Pro', color: 'bg-purple-100 text-purple-700', requiredRoles: ['pro', 'admin'] },
};

export function EducationCategoryContent({ slug }: { slug: string }) {
  const [category, setCategory] = useState<Category | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const { isSignedIn, userRole } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const catRes = await fetch('/api/admin/education/categories');
        if (!catRes.ok) { setNotFound(true); setLoading(false); return; }
        const cats: Category[] = await catRes.json();
        const found = cats.find((c: any) => c.slug === slug && c.available !== false);
        if (!found) { setNotFound(true); setLoading(false); return; }
        setCategory(found);

        const lessonsRes = await fetch(`/api/admin/education/lessons?category_id=${found.id}`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (notFound || !category) {
    return (
      <div className="min-h-screen bg-[#fafaf9]">
        <section className="bg-[#111] text-white py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/education" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-[13px] mb-6">
              <ArrowLeft className="w-4 h-4" />
              Retour à l&apos;éducation
            </Link>
            <h1 className="text-3xl font-bold">Catégorie introuvable</h1>
          </div>
        </section>
      </div>
    );
  }

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
            <span className="text-[11px] tracking-[0.2em] uppercase text-white/40">
              Éducation
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{category.title}</h1>
        </div>
      </section>

      {/* Lessons list */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg font-semibold">{lessons.length} leçon{lessons.length !== 1 ? 's' : ''}</h2>
          <div className="flex-1 h-px bg-black/[0.06]" />
        </div>

        <div className="space-y-3">
          {lessons.map((lesson, i) => {
            const accessible = canAccess(lesson.access_level);
            const isOpen = openLesson === lesson.id;
            const config = ACCESS_CONFIG[lesson.access_level] || ACCESS_CONFIG.free;

            return (
              <div key={lesson.id}>
                <div
                  onClick={() => accessible && lesson.content && setOpenLesson(isOpen ? null : lesson.id)}
                  className={`group flex items-center justify-between p-5 rounded-xl border transition-all duration-150 ${
                    accessible
                      ? 'bg-white border-black/[0.06] hover:border-black/[0.12] hover:shadow-sm cursor-pointer'
                      : 'bg-white/60 border-black/[0.04] cursor-default'
                  } ${isOpen ? 'border-black/[0.12] shadow-sm' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-[#f5f5f0] flex items-center justify-center text-[13px] font-medium text-gray-500">
                      {i + 1}
                    </span>
                    <div>
                      <p className={`text-[15px] font-medium ${accessible ? 'text-gray-900' : 'text-gray-400'}`}>
                        {lesson.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3.5 h-3.5 text-gray-300" />
                        <span className="text-[12px] text-gray-400">{lesson.duration}</span>
                      </div>
                    </div>
                  </div>
                  {!accessible && (
                    <span className={`flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full ${config.color}`}>
                      {lesson.access_level === 'pro' ? <Crown className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {config.label}
                    </span>
                  )}
                </div>
                {/* Expanded content */}
                {isOpen && accessible && lesson.content && (
                  <div className="mx-5 px-5 py-4 bg-[#fafaf9] border-x border-b border-black/[0.06] rounded-b-xl -mt-1">
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                      {lesson.content}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Upsell for non-subscribed */}
        {!isSignedIn && lessons.some((l) => l.access_level !== 'free') && (
          <div className="mt-10 p-6 bg-[#111] text-white rounded-xl text-center">
            <h3 className="text-lg font-semibold mb-2">Débloquez toutes les leçons</h3>
            <p className="text-white/50 text-[14px] mb-4">
              Connectez-vous et abonnez-vous pour accéder à l&apos;ensemble du contenu éducatif.
            </p>
            <Link
              href="/connexion"
              className="inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-lg text-[14px] font-medium hover:bg-white/90 transition-colors"
            >
              Se connecter
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
