'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { ReadingProgressBar } from '@/components/ReadingProgressBar';
import { BackToTop } from '@/components/BackToTop';
import { Link2, Check } from 'lucide-react';
import { Facebook, Linkedin } from '@/components/icons/social';
import { useAuth } from '@/lib/auth-context';
import { CommentsSection } from '@/components/CommentsSection';
import { MarketDataWidget } from '@/components/MarketDataWidget';
import { PremiumPaywall } from '@/components/PremiumPaywall';
import { ProtectedArticleBody } from '@/components/ProtectedArticleBody';
import { NewsletterPopup } from '@/components/NewsletterPopup';
import { ArticleCard } from '@/components/ArticleCard';
import { ArticleLikes } from '@/components/ArticleLikes';
import { ViewTracker } from '@/components/ViewTracker';
import type { Article } from '@/types';
import { SITE_URL } from '@/lib/config';
import {
  checkArticleAccess,
  getContentTypeFromArticle,
  trackVisitorArticle,
  type AccessResult,
} from '@/lib/access-control';
import { trackPremiumArticleRead } from '@/lib/user-profile';

interface ArticleContentProps {
  article: Article;
  htmlBody: string;
  relatedArticles?: Article[];
  /** Server-rendered article header (sections, title, subtitle, metadata, hero image). */
  header: ReactNode;
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

export function ArticleContent({ article, htmlBody, relatedArticles = [], header }: ArticleContentProps) {
  const { user, isSignedIn, isLoading, userRole, premiumArticlesUsed, refreshProfile } = useAuth();
  const [accessResult, setAccessResult] = useState<AccessResult | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [hasTracked, setHasTracked] = useState(false);
  const [resolvedBody, setResolvedBody] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState(false);
  const [premiumLimit, setPremiumLimit] = useState(3);
  const contentType = getContentTypeFromArticle(article);

  const getArticleUrl = () =>
    typeof window !== 'undefined'
      ? window.location.href
      : `${SITE_URL}/articles/${article.slug.current}`;

  useEffect(() => {
    if (contentType !== 'premium') return;
    // Endpoint reel : /api/paywall (l'URL /api/paywall-config n'existe pas).
    // Si la config retourne free_articles_count, on s'aligne sur le reglage
    // admin ; sinon on garde le default useState(3).
    fetch('/api/paywall')
      .then((r) => r.ok ? r.json() : null)
      .then((config) => {
        if (config?.free_articles_count) setPremiumLimit(config.free_articles_count);
      })
      .catch(() => {});
  }, [contentType]);

  useEffect(() => {
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

  useEffect(() => {
    if (htmlBody && !resolvedBody) {
      setResolvedBody(htmlBody);
      return;
    }
    if (!accessResult?.allowed) return;
    if (resolvedBody) return;
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
  }, [accessResult, htmlBody, article.slug, resolvedBody]);

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

  // Chrome de lecture commun aux deux rendus (article complet / paywall) :
  // barre de progression en haut + bouton "remonter en haut" flottant.
  const progressBar = (
    <>
      <ReadingProgressBar targetId="article-main" />
      <BackToTop />
    </>
  );

  const isPremiumContent = contentType === 'premium';
  const authResolved = accessResult !== null;
  const accessAllowed = authResolved && accessResult.allowed;
  const showPaywall = isPremiumContent && !accessAllowed;

  if (showPaywall) {
    return (
      <div className="min-h-screen bg-background">
        {progressBar}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-20">
          <div className="max-w-3xl mx-auto">
            <article id="article-main" className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="p-5 sm:p-8 md:p-12">
                {header}

                <div className="relative select-none" aria-hidden="true">
                  <div className="space-y-4 text-[15px] sm:text-[16px] text-gray-700 leading-relaxed">
                    <p className="opacity-80">{article.excerpt || 'Cet article analyse en profondeur les dernières évolutions économiques et financières de la région, avec des données exclusives et des perspectives d\'experts.'}</p>
                    <p className="opacity-50">Les indicateurs récents montrent une dynamique significative dans les secteurs clés de l&apos;économie. Notre analyse complète détaille les implications pour les investisseurs et les décideurs...</p>
                    <p className="opacity-25">Les experts interrogés soulignent l&apos;importance de ces évolutions pour le contexte régional et international...</p>
                  </div>
                </div>

                <PremiumPaywall articleTitle={article.title} />
              </div>
            </article>
          </div>
        </div>
      </div>
    );
  }

  const shareLinks = getShareLinks();

  return (
    <div className="min-h-screen bg-background">
      {progressBar}
      <ViewTracker articleId={article._id} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <article id="article-main" className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="p-5 sm:p-8 md:p-12">
                {header}

                {resolvedBody ? (
                  isPremiumContent ? (
                    <ProtectedArticleBody
                      html={resolvedBody}
                      watermarkLabel={user?.email ?? user?.id ?? 'Abonné NFI'}
                    />
                  ) : (
                    <div
                      className="article-content"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(resolvedBody, {
                        ADD_TAGS: ['figure', 'figcaption'],
                        ADD_ATTR: ['data-type', 'data-value', 'data-label', 'target', 'rel'],
                      }) }}
                    />
                  )
                ) : bodyError ? (
                  <div className="text-center py-16">
                    <p className="text-gray-500 mb-4">Impossible de charger le contenu de cet article.</p>
                    <button
                      onClick={() => {
                        setBodyError(false);
                        setResolvedBody(null);
                        setAccessResult(prev => prev ? { ...prev } : prev);
                      }}
                      className="px-4 py-2 bg-[#111] text-white rounded-lg text-sm hover:bg-[#333] transition-colors"
                    >
                      Réessayer
                    </button>
                  </div>
                ) : (
                  <div className="animate-pulse space-y-4 py-8">
                    <div className="h-4 bg-gray-100 rounded-sm w-full" />
                    <div className="h-4 bg-gray-100 rounded-sm w-11/12" />
                    <div className="h-4 bg-gray-100 rounded-sm w-9/12" />
                    <div className="h-4 bg-gray-100 rounded-sm w-full" />
                    <div className="h-4 bg-gray-100 rounded-sm w-10/12" />
                  </div>
                )}

                {article.tags.length > 0 && (
                  <div className="mt-10 pt-6 border-t border-black/6">
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1.5 bg-secondary text-[12px] rounded-full hover:bg-[#eee] transition-colors cursor-pointer text-gray-600">#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-black/6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[12px] tracking-widest uppercase text-gray-500">Partager cet article</p>
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
                      {linkCopied ? 'Copié !' : 'Copier le lien'}
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
                  <div className="flex-1 h-px bg-black/6" />
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
            {/* Sticky pour ne pas etirer la sidebar 1300px sous la fin de l'article */}
            <div className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
              <MarketDataWidget />
            </div>
          </aside>
        </div>
      </div>

      <NewsletterPopup />
    </div>
  );
}
