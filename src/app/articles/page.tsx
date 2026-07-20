import type { Metadata } from 'next';
import { CategoryHero } from '@/components/CategoryHero';
import { SectionArticlesFiltered } from '@/components/SectionArticlesFiltered';
import { getAllArticles, getArticleViewRanking } from '@/lib/articles';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Tous les articles : actualités et analyses',
  description:
    'Retrouvez l’ensemble des articles de NFI Report : économie, finance, marchés, Niger, éducation et entreprises. Analyses, actualités et décryptages.',
  alternates: {
    canonical: '/articles',
  },
  openGraph: {
    title: 'Tous les articles : actualités et analyses',
    description:
      'L’ensemble des analyses et actualités économiques et financières du Niger et de l’Afrique de l’Ouest.',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'NFI Report',
    url: '/articles',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NFI Report - Actualités économiques et financières du Niger',
      },
    ],
  },
};

export default async function ArticlesPage() {
  const [{ articles, total }, viewRanking] = await Promise.all([
    getAllArticles(1, 500),
    getArticleViewRanking(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <CategoryHero
        title="Tous les articles"
        description="L’ensemble des analyses et actualités économiques et financières du Niger et de l’Afrique de l’Ouest."
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
