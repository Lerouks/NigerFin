import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { draftMode } from 'next/headers';
import { getArticleBySlug, getRelatedArticles, getAllArticleSlugs, urlFor } from '@/lib/sanity';
import { mockArticles, marketData } from '@/data/mock-data';
import { ArticleContent } from './ArticleContent';

export const revalidate = 60;

interface ArticlePageProps {
  params: { slug: string };
}

async function getArticle(slug: string, preview = false) {
  const sanityArticle = await getArticleBySlug(slug, preview);
  if (sanityArticle) return sanityArticle;
  return mockArticles.find((a) => a.slug.current === slug) || null;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return { title: 'Article introuvable' };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nfireport.com';
  const articleUrl = `${siteUrl}/articles/${article.slug.current}`;
  const imageUrl = article.mainImage
    ? urlFor(article.mainImage)?.width(1200).height(630).url()
    : `${siteUrl}/og-default.jpg`;

  return {
    title: article.title,
    description: article.excerpt,
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
    const sanitySlugs = await getAllArticleSlugs();
    const mockSlugs = mockArticles.map((a) => a.slug.current);
    const allSlugs = Array.from(new Set([...sanitySlugs, ...mockSlugs]));
    return allSlugs.map((slug) => ({ slug }));
  } catch {
    // Fallback to mock slugs if Sanity is unavailable during build
    return mockArticles.map((a) => ({ slug: a.slug.current }));
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { isEnabled: preview } = await draftMode();
  const article = await getArticle(params.slug, preview);

  if (!article) {
    notFound();
  }

  const related = await getRelatedArticles(
    article.slug.current,
    article.category,
    article.tags || [],
    preview
  );

  return (
    <>
      {preview && (
        <div className="bg-yellow-400 text-black text-center py-2 text-sm">
          Mode preview actif — <a href="/api/exit-preview" className="underline font-semibold">Quitter le preview</a>
        </div>
      )}
      <ArticleContent article={article} marketData={marketData} relatedArticles={related} />
    </>
  );
}
