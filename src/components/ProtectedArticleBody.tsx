'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sanitizeHtmlClient } from '@/lib/sanitize-html.client';
import { buildWatermarkSvgDataUrl, isBlockedShortcut } from './ProtectedArticleBody.helpers';

interface ProtectedArticleBodyProps {
  html: string;
  watermarkLabel: string;
}

const HINT_DURATION_MS = 1500;

export function ProtectedArticleBody({ html, watermarkLabel }: ProtectedArticleBodyProps) {
  const [hintVisible, setHintVisible] = useState(false);
  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sanitized = useMemo(() => sanitizeHtmlClient(html), [html]);
  const watermarkUrl = useMemo(() => buildWatermarkSvgDataUrl(watermarkLabel), [watermarkLabel]);

  const flashHint = useCallback(() => {
    setHintVisible(true);
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    hintTimeoutRef.current = setTimeout(() => setHintVisible(false), HINT_DURATION_MS);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isBlockedShortcut(e)) {
        e.preventDefault();
        flashHint();
      }
    };
    const handleBeforePrint = () => {
      document.documentElement.classList.add('nfi-printing-blocked');
    };
    const handleAfterPrint = () => {
      document.documentElement.classList.remove('nfi-printing-blocked');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      document.documentElement.classList.remove('nfi-printing-blocked');
    };
  }, [flashHint]);

  const blockEvent = (e: React.SyntheticEvent) => {
    e.preventDefault();
    flashHint();
  };

  return (
    <div
      className="article-content article-content--protected"
      aria-label="Article protégé contre la copie"
      onCopy={blockEvent}
      onCut={blockEvent}
      onContextMenu={blockEvent}
      onDragStart={blockEvent}
    >
      <div
        className="article-content__watermark"
        aria-hidden="true"
        style={{ backgroundImage: `url("${watermarkUrl}")` }}
      />
      <div
        className="article-content__body"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
      {hintVisible && (
        <div className="article-content__hint" role="status" aria-live="polite">
          Contenu protégé
        </div>
      )}
    </div>
  );
}
