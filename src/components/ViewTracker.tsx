'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ViewTracker({ articleId }: { articleId?: string }) {
  const pathname = usePathname();

  useEffect(() => {
    // Debounce - don't track if navigating quickly
    const timeout = setTimeout(() => {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_path: pathname,
          article_id: articleId || null,
          referrer: document.referrer || null,
        }),
      }).catch(() => {}); // Never block on tracking
    }, 1000);

    return () => clearTimeout(timeout);
  }, [pathname, articleId]);

  return null;
}
