import { ArticleCard } from '@/components/ArticleCard';
import { MarketDataWidget } from '@/components/MarketDataWidget';
import { NewsletterForm } from '@/components/NewsletterForm';
import { PracticalTools } from '@/components/PracticalTools';
import { getAllArticles, getFeaturedArticles } from '@/lib/articles';
import { marketData } from '@/data/mock-data';

export const revalidate = 60;

export default async function HomePage() {
  const [featured, articles] = await Promise.all([
    getFeaturedArticles(),
    getAllArticles(),
  ]);
  const featuredArticle = featured[0] ?? articles[0] ?? null;
  const otherArticles = articles.filter((a) => a._id !== featuredArticle?._id);

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Featured Article */}
      {featuredArticle && (
        <section>
          <ArticleCard article={featuredArticle} featured />
        </section>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Articles Grid */}
          <div className="lg:col-span-8">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl">Dernières actualités</h2>
                <div className="flex-1 h-px bg-black/[0.06]" />
              </div>
              {articles.length === 0 && (
                <p className="text-gray-500 text-center py-20">Aucun article pour le moment. Publiez votre premier article depuis l&apos;espace admin.</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {otherArticles.map((article) => (
                  <ArticleCard key={article._id} article={article} />
                ))}
              </div>
            </div>

            {/* Newsletter Section */}
            <div className="mt-14">
              <NewsletterForm />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <MarketDataWidget data={marketData} />
          </aside>
        </div>
      </div>

      {/* Practical Tools */}
      <PracticalTools />
    </div>
  );
}
