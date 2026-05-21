import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { MarketDataWidget } from '@/components/MarketDataWidget';
import { MarketMarquee } from '@/components/MarketMarquee';
import { NewsletterForm } from '@/components/NewsletterForm';
import { PracticalTools } from '@/components/PracticalTools';
import { getAllArticles, getFeaturedArticles, getLatestBySection } from '@/lib/articles';
import { SECTION_META } from '@/lib/sections';
import { getSiteFeatures } from '@/lib/site-data';

export const metadata: Metadata = {
  title: 'NFI Report - Actualités économiques et financières du Niger',
  description: "Actualités économiques et financières du Niger et de l'Afrique de l'Ouest : articles, analyses, données de marché et outils gratuits.",
  alternates: {
    canonical: '/',
  },
};

// ISR: page régénérée toutes les heures. Articles n'évoluent pas à la minute,
// 1h offre un bon compromis fraîcheur/cache hit. Auparavant 60s = trop de cache
// misses, perçu comme lent par les utilisateurs (skeletons visibles 5s+).
export const revalidate = 3600;

// Sections displayed on homepage (in order)
const HOME_SECTIONS = ['economie', 'finance', 'marches', 'entreprises'] as const;
const LATEST_COUNT = 6;
const ARTICLES_PER_SECTION = 4;

export default async function HomePage() {
  const [featured, { articles: latestArticles }, sectionArticles, siteFeatures] = await Promise.all([
    getFeaturedArticles(),
    getAllArticles(1, LATEST_COUNT),
    getLatestBySection([...HOME_SECTIONS], ARTICLES_PER_SECTION),
    getSiteFeatures(),
  ]);

  const featuredArticle = featured[0] ?? null;
  const featuredId = featuredArticle?._id;

  // Latest articles excluding the featured one
  const latestFiltered = latestArticles.filter((a) => a._id !== featuredId);

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <h1 className="sr-only">NFI Report - Actualités économiques et financières du Niger</h1>

      {/* Featured Article */}
      {featuredArticle && (
        <section className="animate-fade-in">
          <ArticleCard article={featuredArticle} featured />
        </section>
      )}

      {/* Market Ticker Bar, contrôlable depuis l'admin (site_features.market_ticker_enabled) */}
      {siteFeatures.marketTickerEnabled && (
        <div className="bg-[#111] border-b border-white/[0.06] overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-6 min-w-0">
            <span className="text-[10px] tracking-[0.2em] uppercase text-gold font-bold flex-shrink-0">
              Marchés
            </span>
            <div className="h-3 w-px bg-white/10 flex-shrink-0" />
            <MarketMarquee />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-14">

            {/* Latest articles (all sections) */}
            {latestFiltered.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="animate-gold-line h-[2px] bg-gold" />
                  <h2 className="text-xl sm:text-2xl font-semibold whitespace-nowrap">Dernières actualités</h2>
                  <div className="flex-1 h-px bg-black/[0.06]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-grid">
                  {latestFiltered.map((article, index) => (
                    <ArticleCard key={article._id} article={article} priority={index === 0} />
                  ))}
                </div>
              </section>
            )}

            {/* Articles by section */}
            {HOME_SECTIONS.map((sectionKey) => {
              const meta = SECTION_META[sectionKey];
              if (!meta) return null;

              const articles = sectionArticles[sectionKey] || [];
              if (articles.length === 0) return null;

              return (
                <section key={sectionKey}>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="animate-gold-line h-[2px] bg-gold" />
                    <h2 className="text-xl sm:text-2xl font-semibold whitespace-nowrap">{meta.label}</h2>
                    <div className="flex-1 h-px bg-black/[0.06]" />
                    <Link
                      href={meta.path}
                      className="hidden sm:inline-flex items-center gap-1.5 min-h-[44px] px-2 -mx-2 text-[13px] text-gray-500 hover:text-gold transition-colors group whitespace-nowrap"
                    >
                      Voir tous les articles
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-grid">
                    {articles.map((article) => (
                      <ArticleCard key={article._id} article={article} />
                    ))}
                  </div>
                  <Link
                    href={meta.path}
                    className="sm:hidden inline-flex items-center gap-1.5 mt-6 min-h-[44px] px-2 -mx-2 text-[13px] text-gray-500 hover:text-gold transition-colors group"
                  >
                    Voir les articles {meta.label.toLowerCase()}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </section>
              );
            })}

            {/* Newsletter */}
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
