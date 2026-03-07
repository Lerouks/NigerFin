import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getArticleBySlug, getRelatedArticles, getAllArticleSlugs } from '@/lib/articles';
import { marketData } from '@/data/mock-data';
import { ArticleContent } from './ArticleContent';

export const revalidate = 60;

interface ArticlePageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const result = await getArticleBySlug(params.slug);
  if (!result) return { title: 'Article introuvable' };

  const { article } = result;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nfireport.com';
  const articleUrl = `${siteUrl}/articles/${article.slug.current}`;
  const imageUrl = article.mainImage?.url || `${siteUrl}/og-default.jpg`;

  return {
    title: article.seo?.metaTitle || article.title,
    description: article.seo?.metaDescription || article.excerpt,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      url: articleUrl,
      publishedTime: article.publishedAt,
      authors: [article.author.name],
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: article.title }] : [],
      siteName: 'NFI Report',
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllArticleSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const result = await getArticleBySlug(params.slug);

  if (!result) {
    notFound();
  }

  const { article, htmlBody } = result;

  // Security: never include premium body in static payload
  const isPremium = article.contentType === 'premium' || article.isPremium;
  const safeHtmlBody = isPremium ? '' : htmlBody;

  const related = await getRelatedArticles(
    article.slug.current,
    article.category,
    article.tags || [],
  );

  return (
    <ArticleContent article={article} htmlBody={safeHtmlBody} marketData={marketData} relatedArticles={related} />
  );
}
