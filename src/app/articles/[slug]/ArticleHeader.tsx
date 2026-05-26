import Image from 'next/image';
import Link from 'next/link';
import { Clock, Calendar, User } from 'lucide-react';
import type { Article } from '@/types';
import { fallbackImageUrl } from '@/data/mock-data';
import { formatDate } from '@/lib/utils';
import { SECTION_META } from '@/lib/sections';
import { getContentTypeFromArticle } from '@/lib/access-control';

interface ArticleHeaderProps {
  article: Article;
}

function getArticleImageUrl(article: Article): string {
  if (article.mainImage?.url) return article.mainImage.url;
  return fallbackImageUrl;
}

/**
 * Server-rendered header for an article page.
 * Renders sections, premium badge, title, subtitle, metadata, and the LCP hero image.
 * Rendered identically for paywalled and allowed articles so the cover image
 * (LCP) reaches the DOM during SSR, without waiting for auth hydration.
 */
export function ArticleHeader({ article }: ArticleHeaderProps) {
  const imageUrl = getArticleImageUrl(article);
  const contentType = getContentTypeFromArticle(article);
  const isPremium = contentType !== 'free';

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
        {(article.sections || [article.category]).map((s) => (
          <Link
            key={s}
            href={SECTION_META[s]?.path || `/${s}`}
            className="text-[11px] tracking-[0.15em] uppercase text-gray-500 hover:text-black transition-colors"
          >
            {SECTION_META[s]?.label || s}
          </Link>
        ))}
        {isPremium && (
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase px-2.5 py-0.5 rounded-full bg-[#d4a843]/10 text-[#d4a843] ring-1 ring-inset ring-[#d4a843]/20">
            Premium
          </span>
        )}
      </div>
      <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 leading-tight">
        {article.title}
      </h1>
      {article.subtitle && (
        <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-4 sm:mb-6">{article.subtitle}</p>
      )}

      <div className="flex flex-wrap items-center gap-4 pb-6 mb-6 border-b border-black/6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-gray-500" />
          </div>
          <span className="text-[13px]">{article.author.name}</span>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-gray-500">
          <Calendar className="w-4 h-4" />
          {formatDate(article.publishedAt)}
        </div>
        <div className="flex items-center gap-2 text-[13px] text-gray-500">
          <Clock className="w-4 h-4" />
          {article.readTime} min de lecture
        </div>
      </div>

      {imageUrl && (
        <figure className="-mx-5 sm:-mx-8 md:-mx-12 mb-8">
          <div className="relative aspect-video w-full overflow-hidden">
            <Image
              src={imageUrl}
              alt={article.mainImage?.alt || article.title}
              width={1600}
              height={900}
              sizes="(max-width: 768px) 100vw, 900px"
              quality={90}
              className="absolute inset-0 w-full h-full object-cover"
              priority
              fetchPriority="high"
            />
          </div>
          {(article.mainImage?.caption || article.mainImage?.source) && (
            <figcaption className="flex items-start justify-between mt-2 px-5 sm:px-8 md:px-12">
              {article.mainImage?.caption && (
                <span className="text-[12px] text-gray-500">{article.mainImage.caption}</span>
              )}
              {article.mainImage?.source && (
                <span className="text-[11px] text-gray-500 ml-auto whitespace-nowrap">
                  Source : {article.mainImage.source}
                </span>
              )}
            </figcaption>
          )}
        </figure>
      )}
    </>
  );
}
