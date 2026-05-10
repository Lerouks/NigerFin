import type { Metadata } from 'next';
import { CategoryHero } from '@/components/CategoryHero';
import { SectionArticlesFiltered } from '@/components/SectionArticlesFiltered';
import { getAllArticles, getArticleViewRanking } from '@/lib/articles';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Tous les articles : actualit\u00e9s et analyses',
  description:
    'Retrouvez l\u2019ensemble des articles de NFI Report : \u00e9conomie, finance, march\u00e9s, Niger, \u00e9ducation et entreprises. Analyses, actualit\u00e9s et d\u00e9cryptages.',
  alternates: {
    canonical: '/articles',
  },
  openGraph: {
    title: 'Tous les articles : actualit\u00e9s et analyses',
    description:
      'L\u2019ensemble des analyses et actualit\u00e9s \u00e9conomiques et financi\u00e8res du Niger et de l\u2019Afrique de l\u2019Ouest.',
    type: 'website',
    url: '/articles',
  },
};

export default async function ArticlesPage() {
  const [{ articles, total }, viewRanking] = await Promise.all([
    getAllArticles(1, 500),
    getArticleViewRanking(),
  ]);

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CategoryHero
        label="Archives"
        title="Tous les articles"
        description="L\u2019ensemble des analyses et actualit\u00e9s \u00e9conomiques et financi\u00e8res du Niger et de l\u2019Afrique de l\u2019Ouest."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <SectionArticlesFiltered
          articles={articles}
          total={total}
          sectionLabel="Tous"
          sectionPath="/articles"
          viewRanking={viewRanking}
        />
      </div>
    </div>
  );
}
