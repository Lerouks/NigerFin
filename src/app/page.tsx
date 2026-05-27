import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MarketDataWidget } from '@/components/MarketDataWidget';
import { MarketMarquee } from '@/components/MarketMarquee';
import { NewsletterForm } from '@/components/NewsletterForm';
import { PracticalTools } from '@/components/PracticalTools';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeRubriqueSection } from '@/components/home/HomeRubriqueSection';
import { formatDate } from '@/lib/utils';
import { fallbackImageUrl } from '@/data/mock-data';
import { getAllArticles, getFeaturedArticles, getLatestBySection } from '@/lib/articles';
import { SECTION_META } from '@/lib/sections';
import { getSiteFeatures } from '@/lib/site-data';

export const metadata: Metadata = {
  title: 'NFI Report - Actualités économiques et financières du Niger',
  description:
    "Magazine economique premium dedie au Niger et a l'Afrique de l'Ouest : analyses, donnees de marche, dossiers d'entreprises strategiques, outils financiers.",
  alternates: { canonical: '/' },
};

// ISR: page régénérée toutes les heures. Articles n'évoluent pas à la minute,
// 1h offre un bon compromis fraîcheur/cache hit.
export const revalidate = 3600;

// Sections displayed on homepage (in order)
const HOME_SECTIONS = ['economie', 'finance', 'marches', 'entreprises'] as const;
const SECTION_INTROS: Record<string, string> = {
  economie:
    "Conjoncture, politiques publiques et grands equilibres macroeconomiques du Niger et de la zone UEMOA.",
  finance:
    "Banques, microfinance, marche du credit, regulation BCEAO et inclusion financiere.",
  marches:
    "Cours BRVM, devises, matieres premieres et indices qui pesent sur l'economie nigerienne.",
  entreprises:
    "Acteurs strategiques nigeriens et regionaux : resultats, strategies, opportunites.",
};

const LATEST_COUNT = 8; // 1 hero + 1 vedette + 6 secondaires
const ARTICLES_PER_SECTION = 4; // 1 vedette + 3 secondaires par rubrique

export default async function HomePage() {
  const [featured, { articles: latestArticles }, sectionArticles, siteFeatures] = await Promise.all([
    getFeaturedArticles(),
    getAllArticles(1, LATEST_COUNT),
    getLatestBySection([...HOME_SECTIONS], ARTICLES_PER_SECTION),
    getSiteFeatures(),
  ]);

  // Hero : featured si dispo, sinon le tout 1er article recent (fallback robuste)
  const heroArticle = featured[0] ?? latestArticles[0] ?? null;
  const heroId = heroArticle?._id;

  // Articles restants pour la section "Dernieres actualites" (exclu le hero)
  const latestFiltered = latestArticles.filter((a) => a._id !== heroId);
  const recentVedette = latestFiltered[0] ?? null;
  const recentSecondary = latestFiltered.slice(1, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero magazine plein largeur */}
      {heroArticle ? (
        <HomeHero article={heroArticle} />
      ) : (
        <div className="border-b border-black/10 py-20 text-center">
          <p className="text-[14px] uppercase tracking-[0.22em] text-gray-500">
            Atlas economique du Niger
          </p>
          <h1 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-black text-foreground">
            NFI Report
          </h1>
        </div>
      )}

      {/* Market Ticker Bar */}
      {siteFeatures.marketTickerEnabled && (
        <div className="bg-[#0a0a0a] border-b border-white/8 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-6 min-w-0">
            <span className="text-[10px] tracking-[0.22em] uppercase text-gold font-bold shrink-0">
              Marches
            </span>
            <div className="h-3 w-px bg-white/10 shrink-0" />
            <MarketMarquee />
          </div>
        </div>
      )}

      {/* Chapitre "Dernieres actualites" : meme pattern magazine que les
          rubriques (vedette grande + liste secondaires FT-style). Anti-clash
          avec le hero, on garde la qualite premium jusqu'au scroll. */}
      {recentVedette ? (
        <section
          aria-labelledby="home-latest-heading"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 md:pt-20 pb-2"
        >
          <header className="mb-8 md:mb-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-10 bg-gold" />
              <span className="text-[11px] uppercase tracking-[0.24em] text-foreground font-extrabold">
                Actualite
              </span>
            </div>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <h2
                id="home-latest-heading"
                className="font-black tracking-tight leading-[1.05] text-[clamp(1.875rem,3.5vw,2.5rem)] text-foreground"
              >
                Dernieres actualites
              </h2>
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 text-[12px] md:text-[13px] font-bold uppercase tracking-[0.14em] text-foreground hover:text-foreground/70 transition-colors border-b-2 border-gold pb-1"
              >
                Tous les articles
                <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8m0 0L7 3m3 3L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </header>

          {/* Vedette grande (gauche) + liste secondaires FT-style (droite) */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-8 lg:gap-12">
            {/* Vedette */}
            <Link
              href={`/articles/${recentVedette.slug.current}`}
              className="group block"
            >
              <article>
                <div className="relative aspect-[16/10] overflow-hidden bg-secondary mb-5">
                  <Image
                    src={recentVedette.mainImage?.url || fallbackImageUrl}
                    alt={recentVedette.mainImage?.alt || recentVedette.title}
                    fill
                    sizes="(min-width: 1024px) 720px, 100vw"
                    quality={85}
                    priority
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
                <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-[0.18em] text-gray-600 font-semibold">
                  {recentVedette.isPremium ? (
                    <>
                      <span className="text-gold font-bold">Premium</span>
                      <span aria-hidden className="text-gray-300">·</span>
                    </>
                  ) : null}
                  <span>{SECTION_META[recentVedette.sections?.[0] ?? recentVedette.category]?.label ?? 'Actualite'}</span>
                </div>
                <h3 className="text-[clamp(1.5rem,2.5vw,2rem)] font-black tracking-tight leading-[1.1] text-foreground group-hover:text-foreground/75 transition-colors">
                  {recentVedette.title}
                </h3>
                {recentVedette.excerpt ? (
                  <p className="mt-3 text-[15px] md:text-[16px] leading-relaxed text-gray-700 line-clamp-3">
                    {recentVedette.excerpt}
                  </p>
                ) : null}
                <div className="mt-4 flex items-center gap-3 text-[12px] text-gray-600">
                  {recentVedette.author?.name ? (
                    <span className="font-semibold">{recentVedette.author.name}</span>
                  ) : null}
                  {recentVedette.publishedAt ? (
                    <>
                      <span aria-hidden className="w-1 h-1 rounded-full bg-gray-400" />
                      <span>{formatDate(recentVedette.publishedAt)}</span>
                    </>
                  ) : null}
                </div>
              </article>
            </Link>

            {/* Secondaires liste dense */}
            <div>
              {recentSecondary.length > 0 ? (
                <ul>
                  {recentSecondary.map((a, idx) => (
                    <li
                      key={a._id}
                      className={
                        'group ' +
                        (idx < recentSecondary.length - 1 ? 'border-b border-black/8' : '')
                      }
                    >
                      <Link
                        href={`/articles/${a.slug.current}`}
                        className="flex items-start gap-4 py-5 first:pt-0 last:pb-0"
                      >
                        <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0 overflow-hidden bg-secondary">
                          <Image
                            src={a.mainImage?.url || fallbackImageUrl}
                            alt={a.mainImage?.alt || a.title}
                            fill
                            sizes="128px"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] uppercase tracking-[0.16em] text-gray-600 font-bold mb-1.5">
                            {a.isPremium ? (
                              <span className="text-gold mr-2">Premium</span>
                            ) : null}
                            {SECTION_META[a.sections?.[0] ?? a.category]?.label ?? 'Actualite'}
                          </div>
                          <h4 className="text-[15px] md:text-[16px] font-bold leading-snug text-foreground group-hover:text-foreground/70 transition-colors line-clamp-3">
                            {a.title}
                          </h4>
                          <div className="mt-2 text-[11px] text-gray-500">
                            {a.publishedAt ? formatDate(a.publishedAt) : ''}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* Sections par rubrique : 1 vedette + 3 secondaires liste FT-style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-16 space-y-12 md:space-y-16">
        {HOME_SECTIONS.map((sectionKey) => {
          const meta = SECTION_META[sectionKey];
          if (!meta) return null;
          const articles = sectionArticles[sectionKey] || [];
          if (articles.length === 0) return null;
          return (
            <HomeRubriqueSection
              key={sectionKey}
              sectionKey={sectionKey}
              sectionLabel={meta.label}
              sectionPath={meta.path}
              articles={articles}
              intro={SECTION_INTROS[sectionKey]}
            />
          );
        })}
      </div>

      {/* Sidebar data marche (sous le contenu sur mobile, integre via un layout
          pleine largeur magazine plutot que sidebar etroite blog) */}
      <section
        aria-labelledby="home-marches-heading"
        className="border-t border-black/10 bg-secondary/40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-10 bg-gold" />
              <span className="text-[11px] uppercase tracking-[0.24em] text-foreground font-extrabold">
                Donnees de marche
              </span>
            </div>
            <h2
              id="home-marches-heading"
              className="font-black tracking-tight leading-[1.05] text-[clamp(1.75rem,3vw,2.25rem)] text-foreground"
            >
              Le pouls economique
            </h2>
            <p className="mt-3 text-[15px] md:text-[16px] italic text-gray-700 max-w-2xl">
              Cours BRVM, devises, matieres premieres et indices qui structurent
              l&apos;economie nigerienne.
            </p>
          </header>
          <MarketDataWidget />
        </div>
      </section>

      {/* Newsletter premium */}
      <section
        aria-labelledby="home-newsletter-heading"
        className="border-t border-black/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <h2 id="home-newsletter-heading" className="sr-only">
            Newsletter
          </h2>
          <NewsletterForm />
        </div>
      </section>

      {/* Practical Tools (outils financiers gratuits + premium) */}
      <PracticalTools />
    </div>
  );
}
