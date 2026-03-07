'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Calendar, User, Facebook, Linkedin, Link2, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { CommentsSection } from '@/components/CommentsSection';
import { MarketDataWidget } from '@/components/MarketDataWidget';
import { Paywall } from '@/components/Paywall';
import { PaywallOverlay } from '@/components/PaywallOverlay';
import { ArticleCard } from '@/components/ArticleCard';
import { ArticleLikes } from '@/components/ArticleLikes';
import type { Article, MarketData } from '@/types';
import { fallbackImageUrl } from '@/data/mock-data';
import { formatDate } from '@/lib/utils';
import {
  checkArticleAccess,
  getContentTypeFromArticle,
  trackVisitorArticle,
  getReaderPremiumLimit,
  getVisitorLimit,
  type AccessResult,
} from '@/lib/access-control';
import { trackPremiumArticleRead } from '@/lib/user-profile';

interface ArticleContentProps {
  article: Article;
  htmlBody: string;
  marketData: MarketData[];
  relatedArticles?: Article[];
}

function getArticleImageUrl(article: Article): string {
  if (article.mainImage?.url) return article.mainImage.url;
  return fallbackImageUrl;
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ArticleContent({ article, htmlBody, marketData, relatedArticles = [] }: ArticleContentProps) {
  const { isSignedIn, userRole, premiumArticlesUsed, refreshProfile } = useAuth();
  const [accessResult, setAccessResult] = useState<AccessResult>({ allowed: true });
  const [linkCopied, setLinkCopied] = useState(false);
  const [hasTracked, setHasTracked] = useState(false);
  const imageUrl = getArticleImageUrl(article);
  const contentType = getContentTypeFromArticle(article);

  const articleUrl = typeof window !== 'undefined'
    ? window.location.href
    : `https://nfireport.com/articles/${article.slug.current}`;

  useEffect(() => {
    const result = checkArticleAccess(
      contentType,
      userRole,
      premiumArticlesUsed,
      article.slug.current
    );
    setAccessResult(result);

    if (result.allowed && !hasTracked) {
      if (!isSignedIn) {
        if (contentType === 'free') {
          trackVisitorArticle(article.slug.current);
        }
      } else if (contentType === 'premium' && userRole === 'reader') {
        trackPremiumArticleRead(article._id, article.slug.current).then(() => {
          refreshProfile();
        });
        setHasTracked(true);
      }
    }
  }, [contentType, userRole, premiumArticlesUsed, article, isSignedIn, hasTracked, refreshProfile]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(articleUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(article.title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(article.title + ' ' + articleUrl)}`,
  };

  if (!accessResult.allowed) {
    return (
      <div className="min-h-screen bg-[#fafaf9]">
        <div className="relative h-[450px] md:h-[500px] bg-[#111]">
          <Image src={imageUrl} alt={article.title} fill className="object-cover opacity-60" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-20">
          <div className="max-w-3xl mx-auto">
            <article className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="p-8 md:p-12">
                <span className="inline-block text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-4">{article.category}</span>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{article.title}</h1>
                {article.excerpt && <p className="text-lg text-gray-600 mb-6">{article.excerpt}</p>}

                <div className="relative">
                  <div className="text-gray-600 leading-relaxed line-clamp-6 opacity-50 select-none">
                    {article.excerpt} {article.excerpt}
                  </div>
                  <Paywall
                    reason={accessResult.reason}
                    inline
                    premiumArticlesUsed={premiumArticlesUsed}
                    premiumArticlesLimit={
                      accessResult.reason === 'visitor_limit' ? getVisitorLimit() : getReaderPremiumLimit()
                    }
                  />
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <div className="relative h-[450px] md:h-[500px] bg-[#111]">
        <Image src={imageUrl} alt={article.title} fill className="object-cover opacity-60" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <article className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="p-8 md:p-12">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-block text-[11px] tracking-[0.15em] uppercase text-gray-400">{article.category}</span>
                  {contentType !== 'free' && (
                    <span className={`text-[10px] tracking-[0.12em] uppercase px-2 py-0.5 rounded ${
                      contentType === 'pro' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {contentType === 'pro' ? 'PRO' : 'PREMIUM'}
                    </span>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{article.title}</h1>
                {article.subtitle && <p className="text-xl text-gray-600 mb-6">{article.subtitle}</p>}

                <div className="flex flex-wrap items-center gap-4 pb-6 mb-8 border-b border-black/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#f0efe9] flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <span className="text-[13px]">{article.author.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-gray-500">
                    <Calendar className="w-4 h-4" />{formatDate(article.publishedAt)}
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-gray-500">
                    <Clock className="w-4 h-4" />{article.readTime} min de lecture
                  </div>
                </div>

                {/* Render HTML body */}
                <div
                  className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:mb-4 prose-p:leading-relaxed prose-blockquote:border-l-4 prose-blockquote:border-black prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-6 prose-a:text-black prose-a:underline hover:prose-a:no-underline prose-img:rounded-lg prose-img:my-6"
                  dangerouslySetInnerHTML={{ __html: htmlBody }}
                />

                {/* Tags */}
                {article.tags.length > 0 && (
                  <div className="mt-10 pt-6 border-t border-black/[0.06]">
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1.5 bg-[#f5f5f0] text-[12px] rounded-full hover:bg-[#eee] transition-colors cursor-pointer text-gray-600">#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Share Buttons */}
                <div className="mt-6 pt-6 border-t border-black/[0.06]">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[12px] tracking-[0.1em] uppercase text-gray-400">Partager cet article</p>
                    <ArticleLikes articleId={article._id} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-lg text-[13px] hover:opacity-90 transition-opacity">
                      <Facebook className="w-4 h-4" />Facebook
                    </a>
                    <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-[13px] hover:opacity-90 transition-opacity">
                      <XIcon className="w-4 h-4" />X
                    </a>
                    <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2] text-white rounded-lg text-[13px] hover:opacity-90 transition-opacity">
                      <Linkedin className="w-4 h-4" />LinkedIn
                    </a>
                    <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg text-[13px] hover:opacity-90 transition-opacity">
                      <WhatsAppIcon className="w-4 h-4" />WhatsApp
                    </a>
                    <button onClick={handleCopyLink} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-[13px] hover:bg-gray-200 transition-colors">
                      {linkCopied ? <Check className="w-4 h-4 text-green-600" /> : <Link2 className="w-4 h-4" />}
                      {linkCopied ? 'Copié !' : 'Copier le lien'}
                    </button>
                  </div>
                </div>
              </div>
            </article>

            <div className="mt-8">
              <CommentsSection articleId={article._id} />
            </div>

            {relatedArticles.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-xl font-semibold">Articles similaires</h2>
                  <div className="flex-1 h-px bg-black/[0.06]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedArticles.map((related) => (
                    <ArticleCard key={related._id} article={related} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="lg:col-span-4">
            <MarketDataWidget data={marketData} />
          </aside>
        </div>
      </div>

      {/* Soft paywall overlay for non-subscribers (nudge, not block) */}
      <PaywallOverlay articleId={article._id} contentType={contentType} />
    </div>
  );
}
