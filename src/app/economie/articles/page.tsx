import type { Metadata } from 'next';
import { getArticlesByCategory } from '@/lib/articles';
import { SectionArticlesPage } from '@/components/SectionArticlesPage';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Tous les articles — Économie',
  description: 'Retrouvez l\'ensemble des articles économiques du Niger et de l\'Afrique de l\'Ouest.',
};

const PER_PAGE = 12;

export default async function EconomieArticlesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const { articles, total } = await getArticlesByCategory('economie', page, PER_PAGE);

  return (
    <SectionArticlesPage
      sectionSlug="economie"
      label="Rubrique"
      title="Économie"
      description="Retrouvez l'ensemble des articles économiques du Niger et de l'Afrique de l'Ouest."
      articles={articles}
      total={total}
      page={page}
    />
  );
}
