'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Clock, Eye, Share2, Calendar, User } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { PortableTextRenderer } from '@/components/PortableTextRenderer';
import { CommentsSection } from '@/components/CommentsSection';
import { MarketDataWidget } from '@/components/MarketDataWidget';
import { LoginGate } from '@/components/LoginGate';
import type { Article, MarketData } from '@/types';
import { articleImages, fallbackImageUrl } from '@/data/mock-data';
import { formatDate } from '@/lib/utils';

interface ArticleContentProps {
  article: Article;
  marketData: MarketData[];
}

export function ArticleContent({ article, marketData }: ArticleContentProps) {
  const { isSignedIn } = useUser();
  const [showLoginGate, setShowLoginGate] = useState(false);
  const imageUrl = articleImages[article.slug.current] || fallbackImageUrl;

  useEffect(() => {
    if (article.isPremium && !isSignedIn) {
      const timer = setTimeout(() => setShowLoginGate(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [article.isPremium, isSignedIn]);

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <LoginGate
        isOpen={showLoginGate}
        onClose={() => setShowLoginGate(false)}
        title="Contenu Premium"
        message={`Connectez-vous pour lire "${article.title}" en entier`}
      />

      {/* Hero Image */}
      <div className="relative h-[450px] md:h-[500px] bg-[#111]">
        <Image
          src={imageUrl}
          alt={article.title}
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Article Content */}
          <div className="lg:col-span-8">
            <article className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="p-8 md:p-12">
                <span className="inline-block text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-4">
                  {article.category}
                </span>

                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  {article.title}
                </h1>

                {article.subtitle && (
                  <p className="text-xl text-gray-600 mb-6">{article.subtitle}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 pb-6 mb-8 border-b border-black/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#f0efe9] flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <span className="text-[13px]">{article.author.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {formatDate(article.publishedAt)}
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-gray-500">
                    <Clock className="w-4 h-4" />
                    {article.readTime} min de lecture
                  </div>
                  <button className="ml-auto flex items-center gap-2 text-[13px] text-gray-400 hover:text-gray-600 transition-colors">
                    <Share2 className="w-4 h-4" />
                    Partager
                  </button>
                </div>

                {/* Article Body */}
                <div className={article.isPremium && !isSignedIn ? 'relative' : ''}>
                  <PortableTextRenderer content={article.body} />
                  {article.isPremium && !isSignedIn && (
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

            {/* Comments */}
            <div className="mt-8">
              <CommentsSection
                articleId={article._id}
                initialComments={[
                  {
                    id: '1',
                    article_id: article._id,
                    user_id: 'user1',
                    user_name: 'Amadou Tanko',
                    content: 'Excellente analyse ! Le secteur minier est vraiment crucial pour notre économie.',
                    created_at: '2026-03-04T10:15:00Z',
                    likes: 12,
                    isLiked: false,
                  },
                  {
                    id: '2',
                    article_id: article._id,
                    user_id: 'user2',
                    user_name: 'Mariama Souley',
                    content: "J'espère que ces investissements profiteront aussi aux populations locales.",
                    created_at: '2026-03-04T11:30:00Z',
                    likes: 8,
                    isLiked: false,
                  },
                ]}
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
