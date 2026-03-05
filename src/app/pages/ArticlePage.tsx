import { useParams, Navigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Clock, Eye, Share2, Calendar, User } from 'lucide-react';
import { PortableTextRenderer } from '../components/PortableTextRenderer';
import { CommentsSection } from '../components/CommentsSection';
import { MarketDataWidget } from '../components/MarketDataWidget';
import { LoginGate } from '../components/LoginGate';
import { articles, mockComments, marketData } from '../../data/mock-data';

interface ArticlePageProps {
  isAuthenticated: boolean;
  onLogin: () => void;
}

export function ArticlePage({ isAuthenticated, onLogin }: ArticlePageProps) {
  const { slug } = useParams<{ slug: string }>();
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [views, setViews] = useState(0);

  const article = articles.find((a) => a.slug === slug);

  useEffect(() => {
    if (article) {
      // Simulate view increment
      setViews(article.views + Math.floor(Math.random() * 10));
    }
  }, [article]);

  useEffect(() => {
    // Check if article requires authentication after content loads
    if (article && article.isPremium && !isAuthenticated) {
      const timer = setTimeout(() => {
        setShowLoginGate(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [article, isAuthenticated]);

  if (!article) {
    return <Navigate to="/" replace />;
  }

  const articleComments = mockComments.filter((c) => c.articleId === article.id);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <LoginGate
        isOpen={showLoginGate}
        onClose={() => setShowLoginGate(false)}
        onLogin={onLogin}
        articleTitle={article.title}
      />

      {/* Hero Image */}
      <div className="relative h-[450px] md:h-[500px] bg-[#111]">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Article Content */}
          <div className="lg:col-span-8">
            <article className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="p-8 md:p-12">
                {/* Category Badge */}
                <span className="inline-block text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-4">
                  {article.category}
                </span>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  {article.title}
                </h1>

                {/* Subtitle */}
                {article.subtitle && (
                  <p className="text-xl text-gray-600 mb-6">{article.subtitle}</p>
                )}

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-4 pb-6 mb-8 border-b border-black/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#f0efe9] flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <span className="text-[13px]">{article.author.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-gray-500">
                    <Clock className="w-4 h-4" />
                    {article.readTime} min de lecture
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-gray-500">
                    <Eye className="w-4 h-4" />
                    {views.toLocaleString('fr-FR')} vues
                  </div>
                  <button
                    onClick={handleShare}
                    className="ml-auto flex items-center gap-2 text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Partager
                  </button>
                </div>

                {/* Article Content */}
                <div className={article.isPremium && !isAuthenticated ? 'relative' : ''}>
                  <PortableTextRenderer content={article.content} />
                  {article.isPremium && !isAuthenticated && (
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent flex items-end justify-center pb-8">
                      <button
                        onClick={() => setShowLoginGate(true)}
                        className="bg-[#111] text-white px-8 py-3 rounded-full hover:bg-[#333] transition-colors text-[14px]"
                      >
                        Connectez-vous pour lire la suite
                      </button>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="mt-10 pt-6 border-t border-black/[0.06]">
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 bg-[#f5f5f0] text-[12px] rounded-full hover:bg-[#eee] transition-colors cursor-pointer text-gray-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            {/* Comments Section */}
            <div className="mt-8">
              <CommentsSection
                articleId={article.id}
                comments={articleComments}
                isAuthenticated={isAuthenticated}
                onLogin={onLogin}
              />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <MarketDataWidget data={marketData} />
          </aside>
        </div>
      </div>
    </div>
  );
}