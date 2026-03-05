import { Link } from 'react-router';
import { Clock, ArrowUpRight } from 'lucide-react';
import type { Article } from '../../types';

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  if (featured) {
    return (
      <Link to={`/article/${article.slug}`} className="group block">
        <div className="relative overflow-hidden bg-[#111]">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-[500px] object-cover opacity-70 group-hover:opacity-60 group-hover:scale-[1.02] transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
            <div className="max-w-7xl mx-auto">
              <span className="inline-block text-[11px] tracking-[0.15em] uppercase text-white/50 mb-3">
                {article.category}
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl mb-3 line-clamp-2 group-hover:text-gray-200 transition-colors leading-[1.1]">
                {article.title}
              </h2>
              {article.subtitle && (
                <p className="text-base md:text-lg text-white/60 mb-5 line-clamp-2 max-w-2xl">
                  {article.subtitle}
                </p>
              )}
              <div className="flex items-center gap-3 text-[13px] text-white/45">
                <span className="text-white/70">{article.author.name}</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span>
                  {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.readTime} min
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/article/${article.slug}`} className="group block">
      <article className="bg-white rounded-xl border border-black/[0.06] overflow-hidden hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] hover:border-black/[0.1] transition-all duration-300">
        <div className="relative overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-48 object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
          {article.isPremium && (
            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white text-[10px] tracking-[0.1em] uppercase px-2.5 py-1 rounded-full">
              Premium
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] tracking-[0.1em] uppercase text-gray-400">
              {article.category}
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-200" />
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.readTime} min
            </span>
          </div>
          <h3 className="text-[17px] leading-snug mb-2 line-clamp-2 group-hover:text-gray-500 transition-colors">
            {article.title}
          </h3>
          <p className="text-[13px] text-gray-500 mb-4 line-clamp-2 leading-relaxed">{article.excerpt}</p>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{article.author.name}</span>
            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </div>
        </div>
      </article>
    </Link>
  );
}