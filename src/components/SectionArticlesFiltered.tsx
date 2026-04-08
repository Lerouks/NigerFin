'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Filter, Clock, Crown, Unlock, ArrowUpDown } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import type { Article } from '@/types';

type ContentFilter = 'all' | 'free' | 'premium';
type SortOrder = 'recent' | 'oldest';
type ReadTimeFilter = 'all' | 'short' | 'medium' | 'long';

interface SectionArticlesFilteredProps {
  articles: Article[];
  total: number;
  sectionLabel: string;
  sectionPath: string;
  allArticlesPath: string;
}

export function SectionArticlesFiltered({
  articles,
  total,
  sectionLabel,
  sectionPath,
  allArticlesPath,
}: SectionArticlesFilteredProps) {
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const [readTimeFilter, setReadTimeFilter] = useState<ReadTimeFilter>('all');

  const filtered = useMemo(() => {
    let result = [...articles];

    // Content type filter
    if (contentFilter === 'free') {
      result = result.filter((a) => !a.isPremium);
    } else if (contentFilter === 'premium') {
      result = result.filter((a) => a.isPremium);
    }

    // Read time filter
    if (readTimeFilter === 'short') {
      result = result.filter((a) => a.readTime < 5);
    } else if (readTimeFilter === 'medium') {
      result = result.filter((a) => a.readTime >= 5 && a.readTime <= 10);
    } else if (readTimeFilter === 'long') {
      result = result.filter((a) => a.readTime > 10);
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return sortOrder === 'recent' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [articles, contentFilter, sortOrder, readTimeFilter]);

  const hasActiveFilters = contentFilter !== 'all' || sortOrder !== 'recent' || readTimeFilter !== 'all';

  const resetFilters = () => {
    setContentFilter('all');
    setSortOrder('recent');
    setReadTimeFilter('all');
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
                onClick={() => setContentFilter(opt.value)}
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
                onClick={() => setSortOrder(opt.value)}
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
                onClick={() => setReadTimeFilter(opt.value)}
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
      </p>

      {/* Articles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-grid">
        {filtered.map((article) => (
          <ArticleCard key={article._id} article={article} />
        ))}
      </div>

      {/* Empty state */}
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

      {articles.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-2">Aucun article dans cette rubrique</p>
          <p className="text-gray-300 text-sm">De nouveaux contenus arrivent bientôt.</p>
        </div>
      )}

      {/* See all link */}
      {total > articles.length && (
        <div className="mt-10 text-center">
          <Link
            href={allArticlesPath}
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 text-sm font-medium border border-black/[0.08] rounded-full hover:bg-[#111] hover:text-white transition-all duration-300"
          >
            <span className="sm:hidden">Voir tous les articles</span>
            <span className="hidden sm:inline">Voir tous les articles de la rubrique {sectionLabel}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
