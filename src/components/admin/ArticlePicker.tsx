'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface ArticleResult {
  id: string;
  slug: string;
  title: string;
  url: string;
  contentType: string | null;
  publishedAt: string | null;
}

export interface ArticlePickerProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  label?: string;
  placeholder?: string;
}

/**
 * Article URL picker : autocomplete from /api/admin/articles/search,
 * or accepts a free URL pasted by the admin.
 */
export function ArticlePicker({ value, onChange, label, placeholder }: ArticlePickerProps) {
  const [query, setQuery] = useState(value ?? '');
  const [results, setResults] = useState<ArticleResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value ?? '');
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2 || /^https?:\/\//.test(query)) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/articles/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = (await res.json()) as { articles: ArticleResult[] };
          setResults(data.articles);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function pick(article: ArticleResult) {
    onChange(article.url);
    setQuery(article.url);
    setOpen(false);
  }

  return (
    <div className="relative">
      {label ? <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/60 mb-1.5">{label}</label> : null}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-foreground/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value || undefined);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder ?? 'Tapez un mot-clé ou collez une URL…'}
          className="w-full rounded-md border border-foreground/15 bg-white py-1.5 pl-8 pr-7 text-sm focus:outline-hidden focus:ring-2 focus:ring-gold"
        />
        {query ? (
          <button
            type="button"
            onClick={() => { onChange(undefined); setQuery(''); }}
            className="absolute right-2 top-2 text-foreground/40 hover:text-foreground"
            aria-label="Effacer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      {open && (results.length > 0 || loading) ? (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-md border border-foreground/15 bg-white shadow-lg">
          {loading ? (
            <p className="px-3 py-2 text-xs text-foreground/55">Recherche…</p>
          ) : (
            results.map((a) => (
              <button
                key={a.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); pick(a); }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <div className="truncate font-medium text-foreground">{a.title}</div>
                <div className="truncate text-xs text-foreground/55">{a.url}</div>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
