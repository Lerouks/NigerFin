import type { Metadata } from 'next';
import { ArticleCard } from '@/components/ArticleCard';
import { MarketDataWidget } from '@/components/MarketDataWidget';
import { StrategicEnterprisesSection } from '@/components/StrategicEnterprisesSection';
import { getArticlesByCategory } from '@/lib/articles';
import { Building2, TrendingUp, Briefcase, ArrowRight } from 'lucide-react';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Entreprises', description: 'Actualités des entreprises nigériennes et ouest-africaines : résultats, stratégies, fusions et opportunités d\'investissement.' };

export default async function EntreprisesPage() {
  const { articles } = await getArticlesByCategory('entreprises');
  const featuredArticle = articles[0];
  const remainingArticles = articles.slice(1);

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* ── Glassmorphism Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#1a1510]">
        {/* Animated gradient blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-gold/20 to-gold/5 blur-[100px] animate-subtle-pulse" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-amber-500/10 to-transparent blur-[80px] animate-subtle-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute -bottom-20 left-1/3 w-[350px] h-[350px] rounded-full bg-gradient-to-t from-gold/10 to-transparent blur-[90px] animate-subtle-pulse" style={{ animationDelay: '3s' }} />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 hero-grid-pattern" />

        {/* Hero content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            {/* Left side: Title area */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 mb-6 animate-fade-in">
                <span className="h-px w-8 bg-gold/60" />
                <span className="text-gold/80 text-xs font-medium uppercase tracking-[0.2em]">Rubrique</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 animate-fade-in-up tracking-tight">
                Entreprises
              </h1>
              <p className="text-white/50 text-base md:text-lg leading-relaxed animate-fade-in-up delay-100 max-w-xl">
                Résultats, stratégies et opportunités d&apos;investissement des entreprises nigériennes et ouest-africaines.
              </p>
            </div>

            {/* Right side: Glass stat cards */}
            <div className="flex flex-wrap gap-3 animate-fade-in-up delay-200">
              {[
                { icon: Building2, label: 'Entreprises', value: 'Niger & UEMOA' },
                { icon: TrendingUp, label: 'Analyses', value: 'Stratégiques' },
                { icon: Briefcase, label: 'Secteurs', value: 'Multi-industries' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="group flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.08] hover:border-gold/20 transition-all duration-300"
                >
                  <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                    <stat.icon className="w-4 h-4 text-gold/80" />
                  </div>
                  <div>
                    <p className="text-[11px] text-white/40 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-sm text-white/80 font-medium">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured article glass card */}
          {featuredArticle && (
            <div className="mt-14 animate-fade-in-up delay-300">
              <a
                href={`/articles/${featuredArticle.slug.current}`}
                className="group block relative rounded-3xl overflow-hidden border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm hover:border-gold/20 transition-all duration-500"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  {featuredArticle.mainImage && (
                    <div className="md:w-1/2 relative overflow-hidden">
                      <img
                        src={featuredArticle.mainImage.url}
                        alt={featuredArticle.mainImage.alt || featuredArticle.title}
                        className="w-full h-64 md:h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#111]/80 hidden md:block" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111]/80 to-transparent md:hidden" />
                    </div>
                  )}
                  {/* Content */}
                  <div className="md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-gold/15 text-gold border border-gold/20">
                        A la une
                      </span>
                      {featuredArticle.readTime && (
                        <span className="text-white/30 text-xs">{featuredArticle.readTime} min de lecture</span>
                      )}
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-gold/90 transition-colors line-clamp-2">
                      {featuredArticle.title}
                    </h2>
                    {featuredArticle.excerpt && (
                      <p className="text-white/40 text-sm leading-relaxed line-clamp-3 mb-5">
                        {featuredArticle.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-gold/70 text-sm font-medium group-hover:text-gold transition-colors">
                      Lire l&apos;article
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </a>
            </div>
          )}
        </div>

        {/* Bottom fade to page background */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#fafaf9] to-transparent" />
      </section>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        {/* Section header */}
        <div className="flex items-center gap-4 mb-10">
          <h2 className="text-2xl font-bold text-foreground">Derniers articles</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-black/[0.08] to-transparent" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Articles grid */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-grid">
              {remainingArticles.map((article) => (
                <ArticleCard key={article._id} article={article} />
              ))}
            </div>
            {articles.length === 0 && (
              <div className="relative text-center py-24 rounded-3xl border border-black/[0.04] bg-white/60 backdrop-blur-sm">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gold/[0.02] to-transparent" />
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gold/10 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-gold/60" />
                  </div>
                  <p className="text-gray-400 text-lg mb-2">Aucun article dans cette rubrique</p>
                  <p className="text-gray-300 text-sm">De nouveaux contenus arrivent bientot.</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar with glass effect */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.03] to-transparent rounded-2xl pointer-events-none" />
                <MarketDataWidget />
              </div>
            </div>
          </aside>
        </div>

        {/* Strategic enterprises section */}
        <div className="mt-20">
          <StrategicEnterprisesSection />
        </div>
      </div>
    </div>
  );
}
