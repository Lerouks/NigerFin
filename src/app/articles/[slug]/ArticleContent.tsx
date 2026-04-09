'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import DOMPurify from 'dompurify';
import { ReadingProgressBar } from '@/components/ReadingProgressBar';
import { Clock, Calendar, User, Facebook, Linkedin, Link2, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { CommentsSection } from '@/components/CommentsSection';
import { MarketDataWidget } from '@/components/MarketDataWidget';
import { PremiumPaywall } from '@/components/PremiumPaywall';
import { NewsletterPopup } from '@/components/NewsletterPopup';
import { ArticleCard } from '@/components/ArticleCard';
import { ArticleLikes } from '@/components/ArticleLikes';
import { ViewTracker } from '@/components/ViewTracker';
import type { Article } from '@/types';
import { fallbackImageUrl } from '@/data/mock-data';
import { formatDate } from '@/lib/utils';
import { SITE_URL } from '@/lib/config';
import {
  checkArticleAccess,
  getContentTypeFromArticle,
  trackVisitorArticle,
  type AccessResult,
} from '@/lib/access-control';
import { trackPremiumArticleRead } from '@/lib/user-profile';
import { SECTION_META } from '@/lib/sections';

interface ArticleContentProps {
  article: Article;
  htmlBody: string;
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

export function ArticleContent({ article, htmlBody, relatedArticles = [] }: ArticleContentProps) {
  const articleRef = useRef<HTMLElement>(null);
  const { isSignedIn, isLoading, userRole, premiumArticlesUsed, refreshProfile } = useAuth();
  const [accessResult, setAccessResult] = useState<AccessResult | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [hasTracked, setHasTracked] = useState(false);
  const [resolvedBody, setResolvedBody] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState(false);
  const [premiumLimit, setPremiumLimit] = useState(3);
  const imageUrl = getArticleImageUrl(article);
  const contentType = getContentTypeFromArticle(article);

  const getArticleUrl = () =>
    typeof window !== 'undefined'
      ? window.location.href
      : `${SITE_URL}/articles/${article.slug.current}`;

  // Fetch paywall config once for configurable limit
  useEffect(() => {
    if (contentType !== 'premium') return;
    fetch('/api/paywall-config')
      .then((r) => r.ok ? r.json() : null)
      .then((config) => {
        if (config?.free_articles_count) setPremiumLimit(config.free_articles_count);
      })
      .catch(() => {});
  }, [contentType]);

  useEffect(() => {
    // Wait for auth to finish loading before checking access
    if (isLoading) return;

    const result = checkArticleAccess(
      contentType,
      userRole,
      premiumArticlesUsed,
      article.slug.current,
      premiumLimit
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
  }, [contentType, userRole, premiumArticlesUsed, article, isSignedIn, isLoading, hasTracked, refreshProfile, premiumLimit]);

  // Fetch body: use prop for free articles immediately, fetch securely for premium after auth
  useEffect(() => {
    // Free articles: set body immediately from server prop (no auth needed)
    if (htmlBody && !resolvedBody) {
      setResolvedBody(htmlBody);
      return;
    }
    // Premium articles: wait for auth to resolve access
    if (!accessResult?.allowed) return;
    if (resolvedBody) return; // Already set
    let cancelled = false;
    setBodyError(false);
    fetch(`/api/articles/${article.slug.current}/content`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.body) {
          setResolvedBody(data.body);
        } else {
          setBodyError(true);
        }
      })
      .catch(() => { if (!cancelled) setBodyError(true); });
    return () => { cancelled = true; };
  }, [accessResult, htmlBody, article.slug]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(getArticleUrl());
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const getShareLinks = () => {
    const url = getArticleUrl();
    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(article.title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(article.title + ' ' + url)}`,
    };
  };

  // Reading progress bar - always rendered, hidden when ref is null
  const progressBar = <ReadingProgressBar articleRef={articleRef} />;

  // For free articles: show content immediately without waiting for auth
  // For premium articles: show paywall until access is confirmed
  const isPremiumContent = contentType === 'premium';
  const authResolved = accessResult !== null;
  const accessAllowed = authResolved && accessResult.allowed;
  // Show paywall if: premium article AND (auth not yet resolved OR access denied)
  const showPaywall = isPremiumContent && !accessAllowed;

  if (showPaywall) {
    return (
      <div className="min-h-screen bg-[#fafaf9]">
        {progressBar}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-20">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="p-5 sm:p-8 md:p-12">
                {/* Article header */}
                <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                  {(article.sections || [article.category]).map((s) => (
                    <Link key={s} href={SECTION_META[s]?.path || `/${s}`} className="text-[11px] tracking-[0.15em] uppercase text-gray-400 hover:text-black transition-colors">
                      {SECTION_META[s]?.label || s}
                    </Link>
                  ))}
                  <span className="text-[10px] font-semibold tracking-[0.12em] uppercase px-2.5 py-0.5 rounded-full bg-[#d4a843]/10 text-[#d4a843] ring-1 ring-inset ring-[#d4a843]/20">
                    Premium
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 leading-tight">{article.title}</h1>
                {article.excerpt && <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">{article.excerpt}</p>}

                {/* Cover image */}
                {imageUrl && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-6">
                    <Image
                      src={imageUrl}
                      alt={article.mainImage?.alt || article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 900px"
                      quality={90}
                      className="object-cover"
                      priority
                    />
                  </div>
                )}

                {/* Fake text that fades out */}
                <div className="relative select-none" aria-hidden="true">
                  <div className="space-y-4 text-[15px] sm:text-[16px] text-gray-700 leading-relaxed">
                    <p className="opacity-80">{article.excerpt || 'Cet article analyse en profondeur les dernières évolutions économiques et financières de la région, avec des données exclusives et des perspectives d\'experts.'}</p>
                    <p className="opacity-50">Les indicateurs récents montrent une dynamique significative dans les secteurs clés de l&apos;économie. Notre analyse complète détaille les implications pour les investisseurs et les décideurs...</p>
                    <p className="opacity-25">Les experts interrogés soulignent l&apos;importance de ces évolutions pour le contexte régional et international...</p>
                  </div>
                </div>

                {/* Paywall block with gradient, slogan, mockup, CTA */}
                <PremiumPaywall articleTitle={article.title} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const shareLinks = getShareLinks();

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {progressBar}
      <ViewTracker articleId={article._id} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <article ref={articleRef} id="article-main" className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="p-8 md:p-12">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {(article.sections || [article.category]).map((s) => (
                      <Link key={s} href={SECTION_META[s]?.path || `/${s}`} className="text-[11px] tracking-[0.15em] uppercase text-gray-400 hover:text-black transition-colors">
                        {SECTION_META[s]?.label || s}
                      </Link>
                    ))}
                  </div>
                  {contentType !== 'free' && (
                    <span className="text-[10px] font-semibold tracking-[0.12em] uppercase px-2.5 py-0.5 rounded-full bg-[#d4a843]/10 text-[#d4a843] ring-1 ring-inset ring-[#d4a843]/20">
                      PREMIUM
                    </span>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{article.title}</h1>
                {article.subtitle && <p className="text-xl text-gray-600 mb-6">{article.subtitle}</p>}

                <div className="flex flex-wrap items-center gap-4 pb-6 mb-6 border-b border-black/[0.06]">
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

                {/* Cover image, after title & metadata */}
                {imageUrl && (
                  <figure className="-mx-8 md:-mx-12 mb-8">
                    <div className="relative aspect-video w-full overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={article.mainImage?.alt || article.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 900px"
                        quality={90}
                        className="object-cover"
                        priority
                      />
                    </div>
                    {(article.mainImage?.caption || article.mainImage?.source) && (
                      <figcaption className="flex items-start justify-between mt-2 px-8 md:px-12">
                        {article.mainImage?.caption && (
                          <span className="text-[12px] text-gray-500">{article.mainImage.caption}</span>
                        )}
                        {article.mainImage?.source && (
                          <span className="text-[11px] text-gray-400 ml-auto whitespace-nowrap">Source : {article.mainImage.source}</span>
                        )}
                      </figcaption>
                    )}
                  </figure>
                )}

                {/* Render HTML body (fetched securely for premium, sanitized) */}
                {resolvedBody ? (
                  <div
                    className="article-content"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(resolvedBody, {
                      ADD_TAGS: ['figure', 'figcaption'],
                      ADD_ATTR: ['data-type', 'data-value', 'data-label', 'target', 'rel'],
                    }) }}
                  />
                ) : bodyError ? (
                  <div className="text-center py-16">
                    <p className="text-gray-500 mb-4">Impossible de charger le contenu de cet article.</p>
                    <button
                      onClick={() => {
                        setBodyError(false);
                        setResolvedBody(null);
                        // Re-trigger fetch by toggling accessResult
                        setAccessResult(prev => prev ? { ...prev } : prev);
                      }}
                      className="px-4 py-2 bg-[#111] text-white rounded-lg text-sm hover:bg-[#333] transition-colors"
                    >
                      Réessayer
                    </button>
                  </div>
                ) : (
                  <div className="animate-pulse space-y-4 py-8">
                    <div className="h-4 bg-gray-100 rounded w-full" />
                    <div className="h-4 bg-gray-100 rounded w-11/12" />
                    <div className="h-4 bg-gray-100 rounded w-9/12" />
                    <div className="h-4 bg-gray-100 rounded w-full" />
                    <div className="h-4 bg-gray-100 rounded w-10/12" />
                  </div>
                )}

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
            <MarketDataWidget />
          </aside>
        </div>
      </div>

      {/* Newsletter popup — shows once per session after scroll/time */}
      <NewsletterPopup />
    </div>
  );
}
