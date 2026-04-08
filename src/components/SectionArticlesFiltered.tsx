'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Filter, Clock, Crown, Unlock, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import type { Article } from '@/types';

type ContentFilter = 'all' | 'free' | 'premium';
type SortOrder = 'recent' | 'oldest';
type ReadTimeFilter = 'all' | 'short' | 'medium' | 'long';

const PER_PAGE = 20;

interface SectionArticlesFilteredProps {
  articles: Article[];
  total: number;
  sectionLabel: string;
  sectionPath: string;
}

export function SectionArticlesFiltered({
  articles,
  total,
  sectionLabel,
  sectionPath,
}: SectionArticlesFilteredProps) {
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const [readTimeFilter, setReadTimeFilter] = useState<ReadTimeFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);

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

    result.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return sortOrder === 'recent' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [articles, contentFilter, sortOrder, readTimeFilter]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedArticles = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const hasActiveFilters = contentFilter !== 'all' || sortOrder !== 'recent' || readTimeFilter !== 'all';

  const resetFilters = () => {
    setContentFilter('all');
    setSortOrder('recent');
    setReadTimeFilter('all');
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers with ellipsis for large page counts
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

  return (
    <div>
      {/* Filters bar */}
      <div className="mb-8 bg-white rounded-xl border border-black/[0.06] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">Filtres</span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              Réinitialiser
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Type filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400 mr-1">Type</span>
            {([
              { value: 'all' as const, label: 'Tous', icon: null },
              { value: 'free' as const, label: 'Gratuit', icon: Unlock },
              { value: 'premium' as const, label: 'Premium', icon: Crown },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setContentFilter(opt.value); setCurrentPage(1); }}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 ${
                  contentFilter === opt.value
                    ? 'bg-[#111] text-white'
                    : 'bg-[#f5f5f0] text-gray-500 hover:bg-[#eee] hover:text-gray-700'
                }`}
              >
                {opt.icon && <opt.icon className="w-3 h-3" />}
                {opt.label}
              </button>
            ))}
          </div>

          {/* Sort filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400 mr-1">Tri</span>
            {([
              { value: 'recent' as const, label: 'Plus récents' },
              { value: 'oldest' as const, label: 'Plus anciens' },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setSortOrder(opt.value); setCurrentPage(1); }}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 ${
                  sortOrder === opt.value
                    ? 'bg-[#111] text-white'
                    : 'bg-[#f5f5f0] text-gray-500 hover:bg-[#eee] hover:text-gray-700'
                }`}
              >
                <ArrowUpDown className="w-3 h-3" />
                {opt.label}
              </button>
            ))}
          </div>

          {/* Read time filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400 mr-1">Durée</span>
            {([
              { value: 'all' as const, label: 'Toutes' },
              { value: 'short' as const, label: '< 5 min' },
              { value: 'medium' as const, label: '5-10 min' },
              { value: 'long' as const, label: '> 10 min' },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setReadTimeFilter(opt.value); setCurrentPage(1); }}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 ${
                  readTimeFilter === opt.value
                    ? 'bg-[#111] text-white'
                    : 'bg-[#f5f5f0] text-gray-500 hover:bg-[#eee] hover:text-gray-700'
                }`}
              >
                <Clock className="w-3 h-3" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-[13px] text-gray-400 mb-6">
        {filtered.length} article{filtered.length !== 1 ? 's' : ''}
        {hasActiveFilters ? ' (filtré)' : ''}
        {totalPages > 1 && ` · Page ${safePage} sur ${totalPages}`}
      </p>

      {/* Articles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-grid">
        {paginatedArticles.map((article) => (
          <ArticleCard key={article._id} article={article} />
        ))}
      </div>

      {/* Empty state (filters active) */}
      {filtered.length === 0 && articles.length > 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-2">Aucun article ne correspond aux filtres</p>
          <button
            onClick={resetFilters}
            className="text-[13px] text-[#d4a843] hover:text-[#c49a3a] font-medium transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Empty state (no articles at all) */}
      {articles.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-2">Aucun article dans cette rubrique</p>
          <p className="text-gray-300 text-sm">De nouveaux contenus arrivent bientôt.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center" aria-label="Pagination">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Previous */}
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage <= 1}
              aria-label="Page précédente"
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-[#111] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-all min-w-[44px] min-h-[44px] justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Précédent</span>
            </button>

            {/* Page numbers */}
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

            {/* Next */}
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
  );
}
