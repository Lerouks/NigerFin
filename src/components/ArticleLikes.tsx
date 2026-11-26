'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import styles from '@/app/articles/[slug]/article.module.css';

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

  // Noir et blanc comme le reste de la page ; à zéro, le bouton dit « J'aime » plutôt qu'un compteur vide.
  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={!isSignedIn}
      className={`${styles.bouton} ${!isSignedIn ? 'opacity-60 cursor-not-allowed' : ''}`}
      aria-pressed={isLiked}
      aria-label={isLiked ? `Retirer le j\u2019aime (${count})` : `J\u2019aime (${count})`}
      title={!isSignedIn ? 'Connectez-vous pour aimer cet article' : undefined}
    >
      <Heart className={styles.icone} fill={isLiked ? 'currentColor' : 'none'} aria-hidden="true" />
      <span className="tabular-nums">{count > 0 ? count : 'J\u2019aime'}</span>
    </button>
  );
}
