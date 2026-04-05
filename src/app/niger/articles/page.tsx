import type { Metadata } from 'next';
import { getArticlesByCategory } from '@/lib/articles';
import { SectionArticlesPage } from '@/components/SectionArticlesPage';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Tous les articles, Niger',
  description: 'Retrouvez l\'ensemble des articles sur l\'actualité économique et financière du Niger.',
};

const PER_PAGE = 12;

export default async function NigerArticlesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const { articles, total } = await getArticlesByCategory('niger', page, PER_PAGE);

  return (
    <SectionArticlesPage
      sectionSlug="niger"
      label="Rubrique"
      title="Niger"
      description="Retrouvez l'ensemble des articles sur l'actualité économique et financière du Niger."
      articles={articles}
      total={total}
      page={page}
      accentGold
    />
  );
}
