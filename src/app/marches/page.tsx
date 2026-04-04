import type { Metadata } from 'next';
import Link from 'next/link';
import { MarchesContent } from './MarchesContent';
import { ArticleCard } from '@/components/ArticleCard';
import { CategoryHero } from '@/components/CategoryHero';
import { getArticlesByCategory } from '@/lib/articles';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Marchés', description: 'Suivez les cours des marchés en temps réel : matières premières, devises, indices boursiers et actifs financiers africains.' };

const PREVIEW_LIMIT = 6;

export default async function MarchesPage() {
  const { articles, total } = await getArticlesByCategory('marches', 1, PREVIEW_LIMIT);
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CategoryHero
        label="Rubrique"
        title="Marchés"
        description="Suivez les cours en temps réel et apprenez à comprendre chaque actif grâce à nos fiches pédagogiques."
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <MarchesContent />
      </div>
      {articles.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 md:pb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-[2px] bg-gold/40" />
            <h2 className="text-2xl font-bold">Articles Marchés</h2>
            <div className="flex-1 h-px bg-black/[0.06]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-grid">
            {articles.map((article) => (<ArticleCard key={article._id} article={article} />))}
          </div>
          {total > PREVIEW_LIMIT && (
            <div className="mt-10 text-center">
              <Link
                href="/marches/articles"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium border border-black/[0.08] rounded-full hover:bg-[#111] hover:text-white transition-all duration-300"
              >
                Voir tous les articles de la rubrique Marchés
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
