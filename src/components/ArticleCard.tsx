import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowUpRight } from 'lucide-react';
import type { Article } from '@/types';
import { formatDate } from '@/lib/utils';
import { fallbackImageUrl } from '@/data/mock-data';
import { SECTION_META } from '@/lib/sections';

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

function getImageUrl(article: Article): string {
  if (article.mainImage?.url) return article.mainImage.url;
  return fallbackImageUrl;
}

function SectionBadges({ sections, category, variant = 'light' }: { sections?: string[]; category: string; variant?: 'light' | 'dark' }) {
  const items = sections && sections.length > 0 ? sections : [category];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((s, i) => (
        <span key={s}>
          <span className={`text-[11px] tracking-[0.1em] uppercase ${
            variant === 'dark' ? 'text-white/50' : 'text-gray-400'
          }`}>
            {SECTION_META[s]?.label || s}
          </span>
          {i < items.length - 1 && (
            <span className={`mx-1 text-[11px] ${variant === 'dark' ? 'text-white/20' : 'text-gray-200'}`}>&bull;</span>
          )}
        </span>
      ))}
    </div>
  );
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const imageUrl = getImageUrl(article);

  if (featured) {
    return (
      <Link href={`/articles/${article.slug.current}`} className="group block">
        <div className="relative overflow-hidden bg-[#111]">
          <Image
            src={imageUrl}
            alt={article.title}
            width={1200}
            height={600}
            sizes="100vw"
            quality={90}
            className="w-full h-[500px] object-cover opacity-70 group-hover:opacity-60 group-hover:scale-[1.02] transition-all duration-700"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
            <div className="max-w-7xl mx-auto">
              <SectionBadges sections={article.sections} category={article.category} variant="dark" />
              <h2 className="text-3xl md:text-4xl lg:text-5xl mb-3 mt-3 line-clamp-2 group-hover:text-gray-200 transition-colors leading-[1.1]">
                {article.title}
              </h2>
              {article.subtitle && (
                <p className="text-base md:text-lg text-white/60 mb-5 line-clamp-2 max-w-2xl">
                  {article.subtitle}
                </p>
              )}
              <div className="flex items-center gap-3 text-[13px] text-white/45">
                <span className="text-white/70">{article.author.name}</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span>{formatDate(article.publishedAt)}</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.readTime} min
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/articles/${article.slug.current}`} className="group block">
      <article className="bg-white rounded-xl border border-black/[0.06] overflow-hidden hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] hover:border-black/[0.1] transition-all duration-300">
        <div className="relative overflow-hidden">
          <Image
            src={imageUrl}
            alt={article.title}
            width={600}
            height={300}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={85}
            className="w-full h-48 object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
          {article.isPremium && (
            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white text-[10px] tracking-[0.1em] uppercase px-2.5 py-1 rounded-full">
              Premium
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <SectionBadges sections={article.sections} category={article.category} />
            <span className="w-1 h-1 rounded-full bg-gray-200" />
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.readTime} min
            </span>
          </div>
          <h3 className="text-[17px] leading-snug mb-2 line-clamp-2 group-hover:text-gray-500 transition-colors">
            {article.title}
          </h3>
          <p className="text-[13px] text-gray-500 mb-4 line-clamp-2 leading-relaxed">
            {article.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{article.author.name}</span>
            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </div>
        </div>
      </article>
    </Link>
  );
}
