'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Clock } from 'lucide-react';
import Link from 'next/link';
import { mockArticles } from '@/data/mock-data';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
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

  const filteredArticles =
    query.trim().length > 1
      ? mockArticles.filter(
          (a) =>
            a.title.toLowerCase().includes(query.toLowerCase()) ||
            a.excerpt.toLowerCase().includes(query.toLowerCase()) ||
            a.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())) ||
            a.category.toLowerCase().includes(query.toLowerCase())
        )
      : [];

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex flex-col">
      <div className="bg-white shadow-lg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Search className="w-5 h-5 text-gray-300 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un article, un sujet, une catégorie..."
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
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-lg">
              <p className="text-gray-400 text-[15px]">
                Aucun résultat pour &ldquo;<span className="font-semibold">{query}</span>&rdquo;
              </p>
            </div>
          ) : (
            <>
              <p className="text-[12px] text-gray-400 mb-6">
                {filteredArticles.length} résultat{filteredArticles.length > 1 ? 's' : ''} pour &ldquo;{query}&rdquo;
              </p>
              <div className="space-y-0">
                {filteredArticles.map((article) => (
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
        </div>
      </div>
    </div>
  );
}
