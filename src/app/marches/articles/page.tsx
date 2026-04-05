import type { Metadata } from 'next';
import { getArticlesByCategory } from '@/lib/articles';
import { SectionArticlesPage } from '@/components/SectionArticlesPage';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Tous les articles, Marchés',
  description: 'Retrouvez l\'ensemble des articles sur les marchés financiers, matières premières et devises.',
};

const PER_PAGE = 12;

export default async function MarchesArticlesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const { articles, total } = await getArticlesByCategory('marches', page, PER_PAGE);

  return (
    <SectionArticlesPage
      sectionSlug="marches"
      label="Rubrique"
      title="Marchés"
      description="Retrouvez l'ensemble des articles sur les marchés financiers, matières premières et devises."
      articles={articles}
      total={total}
      page={page}
    />
  );
}
