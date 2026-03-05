import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { mockArticles, marketData } from '@/data/mock-data';
import { ArticleContent } from './ArticleContent';

interface ArticlePageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = mockArticles.find((a) => a.slug.current === params.slug);
  if (!article) return { title: 'Article introuvable' };

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author.name],
    },
  };
}

export async function generateStaticParams() {
  return mockArticles.map((article) => ({
    slug: article.slug.current,
  }));
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const article = mockArticles.find((a) => a.slug.current === params.slug);

  if (!article) {
    notFound();
  }

  return <ArticleContent article={article} marketData={marketData} />;
}
