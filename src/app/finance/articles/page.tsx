import type { Metadata } from 'next';
import { getArticlesByCategory } from '@/lib/articles';
import { SectionArticlesPage } from '@/components/SectionArticlesPage';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Tous les articles, Finance',
  description: 'Retrouvez l\'ensemble des articles financiers, analyses bancaires et tendances du secteur.',
};

const PER_PAGE = 12;

export default async function FinanceArticlesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const { articles, total } = await getArticlesByCategory('finance', page, PER_PAGE);

  return (
    <SectionArticlesPage
      sectionSlug="finance"
      label="Rubrique"
      title="Finance"
      description="Retrouvez l'ensemble des articles financiers, analyses bancaires et tendances du secteur."
      articles={articles}
      total={total}
      page={page}
    />
  );
}
