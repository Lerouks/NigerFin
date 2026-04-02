'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface ArticleLikesProps {
  articleId: string;
}

export function ArticleLikes({ articleId }: ArticleLikesProps) {
  const { isSignedIn } = useAuth();
  const [count, setCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/likes?article_id=${encodeURIComponent(articleId)}`)
      .then((res) => res.json())
      .then((data) => {
        setCount(data.count || 0);
        setIsLiked(data.isLiked || false);
      })
      .catch(() => {});
  }, [articleId]);

  const handleToggle = async () => {
    if (!isSignedIn || loading) return;
    setLoading(true);

    // Optimistic update using functional setState to avoid stale closures
    const wasLiked = isLiked;
    const prevCount = count;
    setIsLiked(prev => !prev);
    setCount(prev => wasLiked ? prev - 1 : prev + 1);

    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId }),
      });
      if (!res.ok) {
        // Revert
        setIsLiked(wasLiked);
        setCount(prevCount);
      }
    } catch {
      setIsLiked(wasLiked);
      setCount(prevCount);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={!isSignedIn}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] transition-all duration-200 ${
        isLiked
          ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
      } ${!isSignedIn ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'}`}
      aria-label={isLiked ? `Retirer le j'aime (${count})` : `J'aime (${count})`}
    >
      <Heart className={`w-4 h-4 transition-transform duration-200 ${isLiked ? 'scale-110' : ''}`} fill={isLiked ? 'currentColor' : 'none'} />
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
