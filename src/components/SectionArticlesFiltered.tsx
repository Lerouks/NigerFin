'use client';

import { useState, useMemo } from 'react';
import { Filter, Clock, Crown, Unlock, ArrowUpDown, ChevronLeft, ChevronRight, SlidersHorizontal, X, TrendingUp } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import type { Article } from '@/types';

type ContentFilter = 'all' | 'free' | 'premium';
type SortOrder = 'recent' | 'oldest' | 'popular';
type ReadTimeFilter = 'all' | 'short' | 'medium' | 'long';

const PER_PAGE = 20;

interface SectionArticlesFilteredProps {
  articles: Article[];
  total: number;
  sectionLabel: string;
  sectionPath: string;
  /** Article IDs ordered by view count (most viewed first). Never exposed to user. */
  viewRanking?: string[];
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">{label}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function FilterOption({
  active,
  onClick,
  icon: Icon,
  label,
  golden,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ElementType;
  label: string;
  golden?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 text-left ${
        active
          ? golden
            ? 'bg-[#d4a843] text-white shadow-sm'
            : 'bg-[#111] text-white shadow-sm'
          : golden
            ? 'text-[#d4a843] hover:bg-[#d4a843]/10'
            : 'text-gray-500 hover:bg-[#f5f5f0] hover:text-gray-700'
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      {label}
    </button>
  );
}

export function SectionArticlesFiltered({
  articles,
  total: _total,
  sectionLabel: _sectionLabel,
  viewRanking = [],
}: SectionArticlesFilteredProps) {
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const [readTimeFilter, setReadTimeFilter] = useState<ReadTimeFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = [...articles];

    if (contentFilter === 'free') {
      result = result.filter((a) => !a.isPremium);
    } else if (contentFilter === 'premium') {
      result = result.filter((a) => a.isPremium);
    }

    if (readTimeFilter === 'short') {
      result = result.filter((a) => a.readTime < 5);
    } else if (readTimeFilter === 'medium') {
      result = result.filter((a) => a.readTime >= 5 && a.readTime <= 10);
    } else if (readTimeFilter === 'long') {
      result = result.filter((a) => a.readTime > 10);
    }

    if (sortOrder === 'popular' && viewRanking.length > 0) {
      const rankMap = new Map(viewRanking.map((id, i) => [id, i]));
      result.sort((a, b) => (rankMap.get(a._id) ?? Infinity) - (rankMap.get(b._id) ?? Infinity));
    } else {
      result.sort((a, b) => {
        const dateA = new Date(a.publishedAt).getTime();
        const dateB = new Date(b.publishedAt).getTime();
        return sortOrder === 'oldest' ? dateA - dateB : dateB - dateA;
      });
    }

    return result;
  }, [articles, contentFilter, sortOrder, readTimeFilter, viewRanking]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedArticles = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const hasActiveFilters = contentFilter !== 'all' || sortOrder !== 'recent' || readTimeFilter !== 'all';
  const activeCount = [contentFilter !== 'all', sortOrder !== 'recent', readTimeFilter !== 'all'].filter(Boolean).length;

  const resetFilters = () => {
    setContentFilter('all');
    setSortOrder('recent');
    setReadTimeFilter('all');
    setCurrentPage(1);
  };

  const applyFilter = <T,>(setter: (v: T) => void, value: T) => {
    setter(value);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [1];
    if (safePage > 3) pages.push('ellipsis');
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (safePage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  const filtersContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#d4a843]" />
          <span className="text-[13px] font-semibold text-gray-800">Filtres</span>
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#d4a843] text-white text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-[11px] text-[#d4a843] hover:text-[#c49a3a] font-medium transition-colors"
          >
            Tout effacer
          </button>
        )}
      </div>

      <div className="h-px bg-black/[0.06]" />

      {/* Type */}
      <FilterGroup label="Type d'article">
        <FilterOption active={contentFilter === 'all'} onClick={() => applyFilter(setContentFilter, 'all')} label="Tous les articles" />
        <FilterOption active={contentFilter === 'free'} onClick={() => applyFilter(setContentFilter, 'free')} icon={Unlock} label="Gratuit" />
        <FilterOption active={contentFilter === 'premium'} onClick={() => applyFilter(setContentFilter, 'premium')} icon={Crown} label="Premium" golden />
      </FilterGroup>

      <div className="h-px bg-black/[0.06]" />

      {/* Sort */}
      <FilterGroup label="Trier par">
        <FilterOption active={sortOrder === 'recent'} onClick={() => applyFilter(setSortOrder, 'recent')} icon={ArrowUpDown} label="Plus récents" />
        <FilterOption active={sortOrder === 'oldest'} onClick={() => applyFilter(setSortOrder, 'oldest')} icon={ArrowUpDown} label="Plus anciens" />
        <FilterOption active={sortOrder === 'popular'} onClick={() => applyFilter(setSortOrder, 'popular')} icon={TrendingUp} label="Les plus lus" />
      </FilterGroup>

      <div className="h-px bg-black/[0.06]" />

      {/* Read time */}
      <FilterGroup label="Durée de lecture">
        <FilterOption active={readTimeFilter === 'all'} onClick={() => applyFilter(setReadTimeFilter, 'all')} icon={Clock} label="Toutes les durées" />
        <FilterOption active={readTimeFilter === 'short'} onClick={() => applyFilter(setReadTimeFilter, 'short')} icon={Clock} label="Moins de 5 min" />
        <FilterOption active={readTimeFilter === 'medium'} onClick={() => applyFilter(setReadTimeFilter, 'medium')} icon={Clock} label="5 à 10 min" />
        <FilterOption active={readTimeFilter === 'long'} onClick={() => applyFilter(setReadTimeFilter, 'long')} icon={Clock} label="Plus de 10 min" />
      </FilterGroup>
    </div>
  );

  return (
    <div>
      {/* Mobile: filter toggle button */}
      <button
        onClick={() => setMobileFiltersOpen(true)}
        className="lg:hidden flex items-center gap-2 px-4 py-2.5 mb-6 bg-white border border-black/[0.06] rounded-xl text-[13px] font-medium text-gray-600 hover:border-black/[0.12] transition-colors w-full justify-center"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filtres
        {activeCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-[#d4a843] text-white text-[10px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {/* Mobile: filter bottom sheet */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] bg-white rounded-t-2xl shadow-2xl overflow-y-auto overscroll-contain animate-slide-up">
            {/* Drag handle */}
            <div className="sticky top-0 bg-white pt-3 pb-2 px-6 border-b border-black/[0.04] z-10">
              <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-semibold">Filtres</h3>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-8 h-8 rounded-lg bg-[#f5f5f0] flex items-center justify-center hover:bg-[#eee] transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {filtersContent}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-black/[0.04] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3.5 bg-[#111] text-white rounded-xl text-[14px] font-medium hover:bg-[#333] transition-colors"
              >
                Voir les résultats ({filtered.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop: sidebar filters */}
        <aside className="hidden lg:block w-[220px] flex-shrink-0">
          <div className="sticky top-24 bg-white rounded-xl border border-black/[0.06] p-5 shadow-[0_2px_20px_-6px_rgba(0,0,0,0.06)]">
            {filtersContent}
          </div>
        </aside>

        {/* Articles */}
        <div className="flex-1 min-w-0">
          {/* Results count */}
          <p className="text-[13px] text-gray-500 mb-6">
            {filtered.length} article{filtered.length !== 1 ? 's' : ''}
            {hasActiveFilters ? ' (filtré)' : ''}
            {totalPages > 1 && ` · Page ${safePage} sur ${totalPages}`}
          </p>

          {/* Articles grid : 1 colonne si peu d'articles pour ne pas laisser de vide */}
          <div className={`grid gap-6 stagger-grid ${paginatedArticles.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {paginatedArticles.map((article) => (
              <ArticleCard key={article._id} article={article} featured={paginatedArticles.length === 1} />
            ))}
          </div>

          {/* Empty state (filters active) */}
          {filtered.length === 0 && articles.length > 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg mb-2">Aucun article ne correspond aux filtres</p>
              <button
                onClick={resetFilters}
                className="text-[13px] text-[#d4a843] hover:text-[#c49a3a] font-medium transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}

          {/* Empty state (no articles) */}
          {articles.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg mb-2">Aucun article dans cette rubrique</p>
              <p className="text-gray-500 text-sm">De nouveaux contenus arrivent bientôt.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-10 flex items-center justify-center" aria-label="Pagination">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => goToPage(safePage - 1)}
                  disabled={safePage <= 1}
                  aria-label="Page précédente"
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-[#111] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-all min-w-[44px] min-h-[44px] justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Précédent</span>
                </button>

                {getPageNumbers().map((page, i) =>
                  page === 'ellipsis' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-300 text-[13px]">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      aria-label={`Page ${page}`}
                      aria-current={page === safePage ? 'page' : undefined}
                      className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[13px] font-medium transition-all ${
                        page === safePage
                          ? 'bg-[#111] text-white'
                          : 'text-gray-500 hover:bg-[#f5f5f0] hover:text-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage >= totalPages}
                  aria-label="Page suivante"
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-[#111] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-all min-w-[44px] min-h-[44px] justify-center"
                >
                  <span className="hidden sm:inline">Suivant</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
