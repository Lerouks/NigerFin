import type { Metadata } from 'next';
import { getArticlesByCategory } from '@/lib/articles';
import { SectionArticlesPage } from '@/components/SectionArticlesPage';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Tous les articles, Entreprises',
  description: 'Retrouvez l\'ensemble des articles sur les entreprises nigériennes et ouest-africaines.',
};

const PER_PAGE = 12;

export default async function EntreprisesArticlesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const { articles, total } = await getArticlesByCategory('entreprises', page, PER_PAGE);

  return (
    <SectionArticlesPage
      sectionSlug="entreprises"
      label="Rubrique"
      title="Entreprises"
      description="Retrouvez l'ensemble des articles sur les entreprises nigériennes et ouest-africaines."
      articles={articles}
      total={total}
      page={page}
    />
  );
}
