'use client';

import { useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { sanitizeHtmlClient } from '@/lib/sanitize-html.client';
import { ReadingProgressBar } from '@/components/ReadingProgressBar';
import { BackToTop } from '@/components/BackToTop';
import { useAuth } from '@/lib/auth-context';
import { PremiumPaywall } from '@/components/PremiumPaywall';
import { ProtectedArticleBody } from '@/components/ProtectedArticleBody';
import { NewsletterPopup } from '@/components/NewsletterPopup';
import { ArticleLikes } from '@/components/ArticleLikes';
import { ViewTracker } from '@/components/ViewTracker';
import { ReglageLignes } from '@/components/article/ReglageLignes';
import { PartageFin } from '@/components/article/BoutonsPartage';
import { BarreLecture } from '@/components/article/BarreLecture';
import { DiscussionRepliee } from '@/components/article/DiscussionRepliee';
import type { Article } from '@/types';
import { SITE_URL } from '@/lib/config';
import { SECTION_META } from '@/lib/sections';
import { dateArticle, texteAffiche } from '@/lib/article/mise-en-page';
import {
  checkArticleAccess,
  getContentTypeFromArticle,
  trackVisitorArticle,
  type AccessResult,
} from '@/lib/access-control';
import { trackPremiumArticleRead } from '@/lib/user-profile';
import styles from './article.module.css';

interface ArticleContentProps {
  article: Article;
  htmlBody: string;
  relatedArticles?: Article[];
  /** En-tête rendu côté serveur (rubriques, titre, chapô, signature, photo). */
  header: ReactNode;
  /** Début d'un article Premium, montré à qui n'est pas abonné (accroche et deux paragraphes réels, déjà nettoyés côté serveur). */
  debut?: { accroche: string | null; paragraphes: string[] };
}

const ID_ENTETE = 'article-entete';
const ID_FIN = 'article-fin';
const ID_DISCUSSION = 'discussion';

/** Articles à lire ensuite : rubrique, titre complet, date et durée. */
function ListeArticles({ articles }: { articles: Article[] }) {
  return (
    <ul className={styles.liste}>
      {articles.map((a) => {
        const rubriques = (a.sections?.length ? a.sections : [a.category]).map((s) => SECTION_META[s]?.label || s).join(', ');
        return (
          <li key={a._id}>
            <Link href={`/articles/${a.slug.current}`}>
              <span className={styles.listeRub}>{rubriques}</span>
              <span className={`${styles.listeTitre} ligne-reglee`} dangerouslySetInnerHTML={{ __html: texteAffiche(a.title) }} />
              <span className={styles.listeDate}>{`${dateArticle(a.publishedAt)} · ${a.readTime}\u00a0min`}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function ArticleContent({ article, htmlBody, relatedArticles = [], header, debut }: ArticleContentProps) {
  const { user, isSignedIn, isLoading, userRole, premiumArticlesUsed, refreshProfile } = useAuth();
  const [accessResult, setAccessResult] = useState<AccessResult | null>(null);
  const [hasTracked, setHasTracked] = useState(false);
  const [resolvedBody, setResolvedBody] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState(false);
  const [premiumLimit, setPremiumLimit] = useState(3);
  const contentType = getContentTypeFromArticle(article);
  const url = `${SITE_URL}/articles/${article.slug.current}`;

  useEffect(() => {
    if (contentType !== 'premium') return;
    // Endpoint reel : /api/paywall (l'URL /api/paywall-config n'existe pas).
    // Si la config retourne free_articles_count, on s'aligne sur le reglage
    // admin ; sinon on garde le default useState(3).
    fetch('/api/paywall')
      .then((r) => (r.ok ? r.json() : null))
      .then((config) => {
        if (config?.free_articles_count) setPremiumLimit(config.free_articles_count);
      })
      .catch(() => {});
  }, [contentType]);

  useEffect(() => {
    if (isLoading) return;

    const result = checkArticleAccess(contentType, userRole, premiumArticlesUsed, article.slug.current, premiumLimit);
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
      .catch(() => {
        if (!cancelled) setBodyError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [accessResult, htmlBody, article.slug, resolvedBody]);

  // Lecture : barre de progression ; « remonter » seulement sur ordinateur (sur
  // téléphone, la barre de partage occupe le bas de l'écran).
  const progressBar = (
    <>
      <ReadingProgressBar targetId="article-main" />
      <div className="hidden lg:block">
        <BackToTop />
      </div>
    </>
  );

  const isPremiumContent = contentType === 'premium';
  const authResolved = accessResult !== null;
  const accessAllowed = authResolved && accessResult.allowed;
  const showPaywall = isPremiumContent && !accessAllowed;
  const gratuits = relatedArticles.filter((a) => getContentTypeFromArticle(a) === 'free');

  if (showPaywall) {
    return (
      <div className={styles.page}>
        {progressBar}
        <ReglageLignes className={styles.article}>
          <article id="article-main">
            {header}
            <div className={styles.corps}>
              {debut?.accroche && <p className="accroche" dangerouslySetInnerHTML={{ __html: debut.accroche }} />}
              {debut?.paragraphes[0] && <p dangerouslySetInnerHTML={{ __html: debut.paragraphes[0] }} />}
              {debut?.paragraphes[1] && (
                <p className={styles.efface} aria-hidden="true" dangerouslySetInnerHTML={{ __html: debut.paragraphes[1] }} />
              )}
              {!debut?.accroche && !debut?.paragraphes.length && article.excerpt && <p>{article.excerpt}</p>}
            </div>
            <div className={styles.corps}>
              <PremiumPaywall />
            </div>
          </article>
          {gratuits.length > 0 && (
            <section className={styles.alire} aria-labelledby="titre-gratuits">
              <h2 className={styles.finTitre} id="titre-gratuits">À lire gratuitement</h2>
              <ListeArticles articles={gratuits} />
            </section>
          )}
        </ReglageLignes>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {progressBar}
      <ViewTracker articleId={article._id} />

      <ReglageLignes className={styles.article}>
        <article id="article-main">
          {header}

          {resolvedBody ? (
            isPremiumContent ? (
              <ProtectedArticleBody
                html={resolvedBody}
                watermarkLabel={user?.email ?? user?.id ?? 'Abonné NFI'}
                className={styles.corps}
              />
            ) : (
              <div className={styles.corps} dangerouslySetInnerHTML={{ __html: sanitizeHtmlClient(resolvedBody) }} />
            )
          ) : bodyError ? (
            <div className={styles.corps}>
              <p>Impossible de charger le contenu de cet article.</p>
              <button
                type="button"
                className={styles.bouton}
                onClick={() => {
                  setBodyError(false);
                  setResolvedBody(null);
                  setAccessResult((prev) => (prev ? { ...prev } : prev));
                }}
              >
                Réessayer
              </button>
            </div>
          ) : (
            <div className={`${styles.corps} animate-pulse`} aria-hidden="true">
              <p style={{ height: '1.2em', background: '#eeeeec', borderRadius: 2 }} />
              <p style={{ height: '1.2em', width: '90%', background: '#eeeeec', borderRadius: 2 }} />
              <p style={{ height: '1.2em', width: '75%', background: '#eeeeec', borderRadius: 2 }} />
            </div>
          )}
        </article>

        <section className={styles.fin} id={ID_FIN} aria-labelledby="titre-partage">
          <h2 className={styles.finTitre} id="titre-partage">Partager l’article</h2>
          <PartageFin url={url} titre={article.title}>
            <ArticleLikes articleId={article._id} />
          </PartageFin>
          <DiscussionRepliee articleId={article._id} id={ID_DISCUSSION} />
        </section>

        {relatedArticles.length > 0 && (
          <section className={styles.alire} aria-labelledby="titre-alire">
            <h2 className={styles.finTitre} id="titre-alire">À lire aussi</h2>
            <ListeArticles articles={relatedArticles} />
          </section>
        )}
      </ReglageLignes>

      <BarreLecture url={url} titre={article.title} idEntete={ID_ENTETE} idFin={ID_FIN} idDiscussion={ID_DISCUSSION} />
      <NewsletterPopup />
    </div>
  );
}
