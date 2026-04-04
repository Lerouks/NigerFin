import Link from 'next/link';
import { ArticleCard } from '@/components/ArticleCard';
import { MarketDataWidget } from '@/components/MarketDataWidget';
import { CategoryHero } from '@/components/CategoryHero';
import type { Article } from '@/types';

interface SectionArticlesPageProps {
  sectionSlug: string;
  label: string;
  title: string;
  description: string;
  articles: Article[];
  total: number;
  page: number;
  accentGold?: boolean;
}

const ARTICLES_PER_PAGE = 12;

export function SectionArticlesPage({
  sectionSlug,
  label,
  title,
  description,
  articles,
  total,
  page,
  accentGold,
}: SectionArticlesPageProps) {
  const totalPages = Math.ceil(total / ARTICLES_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CategoryHero
        label={label}
        title={`Tous les articles\u00A0— ${title}`}
        description={description}
        accentGold={accentGold}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        {/* Back link */}
        <Link
          href={`/${sectionSlug}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Retour à {title}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            {/* Article count */}
            <p className="text-sm text-gray-400 mb-6">
              {total}&nbsp;article{total !== 1 ? 's' : ''} dans cette rubrique
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-grid">
              {articles.map((article) => (
                <ArticleCard key={article._id} article={article} />
              ))}
            </div>

            {articles.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg mb-2">Aucun article dans cette rubrique</p>
                <p className="text-gray-300 text-sm">De nouveaux contenus arrivent bientôt.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Pagination des articles">
                {page > 1 && (
                  <Link
                    href={`/${sectionSlug}/articles${page - 1 === 1 ? '' : `?page=${page - 1}`}`}
                    rel="prev"
                    aria-label="Page précédente"
                    className="px-4 py-2 text-sm border border-black/[0.08] rounded-lg hover:bg-black hover:text-white transition-colors"
                  >
                    ←&nbsp;Précédent
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`/${sectionSlug}/articles${p === 1 ? '' : `?page=${p}`}`}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? 'page' : undefined}
                    className={`w-10 h-10 flex items-center justify-center text-sm rounded-lg transition-colors ${
                      p === page
                        ? 'bg-[#111] text-white'
                        : 'border border-black/[0.08] hover:bg-black/[0.04]'
                    }`}
                  >
                    {p}
                  </Link>
                ))}
                {page < totalPages && (
                  <Link
                    href={`/${sectionSlug}/articles?page=${page + 1}`}
                    rel="next"
                    aria-label="Page suivante"
                    className="px-4 py-2 text-sm border border-black/[0.08] rounded-lg hover:bg-black hover:text-white transition-colors"
                  >
                    Suivant&nbsp;→
                  </Link>
                )}
              </nav>
            )}
          </div>

          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <MarketDataWidget />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
