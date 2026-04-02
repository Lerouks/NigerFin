'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Article } from '@/types';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchResults = useCallback(async (q: string) => {
    // Cancel any pending request
    abortRef.current?.abort();

    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      const json = await res.json();
      setResults(json.data ?? []);
      setSearched(true);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setResults([]);
        setSearched(true);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // Debounced search: triggers 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => fetchResults(query), 300);
    return () => clearTimeout(timer);
  }, [query, fetchResults]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
      setSearched(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex flex-col animate-fade-in" role="dialog" aria-modal="true" aria-label="Recherche">
      <div className="bg-white shadow-lg animate-fade-in-up">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            {loading ? (
              <Loader2 className="w-5 h-5 text-gray-400 flex-shrink-0 animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-gray-300 flex-shrink-0" />
            )}
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un article, un sujet, une catégorie..."
              aria-label="Rechercher un article"
              autoComplete="off"
              className="flex-1 text-[16px] bg-transparent border-none outline-none placeholder:text-gray-300"
            />
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {query.trim().length < 2 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-lg">
              <Search className="w-12 h-12 text-gray-200 mx-auto mb-5" />
              <p className="text-gray-400 text-[15px]">Tapez au moins 2 caractères pour rechercher</p>
              <div className="mt-6">
                <p className="text-[13px] text-gray-400 mb-4">Suggestions populaires</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Économie', 'Finance', 'BRVM', 'Uranium', 'Éducation', 'Outils'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="px-4 py-2 bg-[#f5f5f0] text-[13px] text-gray-600 hover:bg-[#eee] transition-colors rounded-full"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : searched && results.length === 0 && !loading ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-lg">
              <p className="text-gray-400 text-[15px]">
                Aucun résultat pour &ldquo;<span className="font-semibold">{query}</span>&rdquo;
              </p>
            </div>
          ) : (
            <>
              {results.length > 0 && (
                <>
                  <p className="text-[12px] text-gray-400 mb-6">
                    {results.length} résultat{results.length > 1 ? 's' : ''} pour &ldquo;{query}&rdquo;
                  </p>
                  <div className="space-y-0">
                    {results.map((article) => (
                      <Link
                        key={article._id}
                        href={`/articles/${article.slug.current}`}
                        onClick={onClose}
                        className="flex gap-5 p-5 border-b border-black/[0.04] last:border-0 hover:bg-[#fafaf9] transition-all group bg-white first:rounded-t-xl last:rounded-b-xl"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] tracking-[0.1em] uppercase text-gray-400">
                              {article.category}
                            </span>
                            {article.isPremium && (
                              <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full">
                                PREMIUM
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-base mb-1 line-clamp-1 group-hover:text-gray-600 transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-sm text-gray-500 line-clamp-2">{article.excerpt}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            <span>{article.author.name}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {article.readTime} min
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
