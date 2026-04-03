import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { MarketDataWidget } from '@/components/MarketDataWidget';
import { MarketMarquee } from '@/components/MarketMarquee';
import { NewsletterForm } from '@/components/NewsletterForm';
import { PracticalTools } from '@/components/PracticalTools';
import { getAllArticles, getFeaturedArticles } from '@/lib/articles';

export const metadata: Metadata = {
  title: 'NFI Report - Actualités économiques et financières du Niger',
  description: "Votre source d'informations économiques et financières pour le Niger et l'Afrique de l'Ouest. Articles, analyses, outils financiers et données de marché.",
};

export const revalidate = 60;

export default async function HomePage() {
  const [featured, { articles }] = await Promise.all([
    getFeaturedArticles(),
    getAllArticles(),
  ]);
  const featuredArticle = featured[0] ?? articles[0] ?? null;
  const otherArticles = articles.filter((a) => a._id !== featuredArticle?._id);

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <h1 className="sr-only">NFI Report - Actualités économiques et financières du Niger</h1>

      {/* Featured Article */}
      {featuredArticle && (
        <section className="animate-fade-in">
          <ArticleCard article={featuredArticle} featured />
        </section>
      )}

      {/* Market Ticker Bar */}
      <div className="bg-[#111] border-b border-white/[0.06] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-6 min-w-0">
          <span className="text-[10px] tracking-[0.2em] uppercase text-gold font-bold flex-shrink-0">
            Marchés
          </span>
          <div className="h-3 w-px bg-white/10 flex-shrink-0" />
          <MarketMarquee />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Articles Grid */}
          <div className="lg:col-span-8">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="animate-gold-line h-[2px] bg-gold" />
                <h2 className="text-2xl">Dernières actualités</h2>
                <div className="flex-1 h-px bg-black/[0.06]" />
                <Link
                  href="/economie"
                  className="hidden sm:inline-flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gold transition-colors group"
                >
                  Tout voir
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
              {articles.length === 0 && (
                <p className="text-gray-500 text-center py-20">Aucun article pour le moment. Publiez votre premier article depuis l&apos;espace admin.</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-grid">
                {otherArticles.map((article) => (
                  <ArticleCard key={article._id} article={article} />
                ))}
              </div>
            </div>

            {/* Newsletter Section */}
            <div className="mt-14">
              <NewsletterForm />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <MarketDataWidget />
            </div>
          </aside>
        </div>
      </div>

      {/* Practical Tools */}
      <PracticalTools />
    </div>
  );
}
