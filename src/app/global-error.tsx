'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ minHeight: '100vh', backgroundColor: '#fafaf9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '0 16px' }}>
            <div style={{ marginBottom: 32 }}>
              <span style={{ fontSize: 160, fontWeight: 700, color: 'rgba(0,0,0,0.04)', lineHeight: 1, display: 'block' }}>
                500
              </span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16, marginTop: -64 }}>Erreur critique</h1>
            <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 32, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
              Une erreur inattendue s&apos;est produite. Notre équipe a été automatiquement notifiée.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => reset()}
                style={{ backgroundColor: '#111', color: '#fff', padding: '12px 28px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
              >
                Réessayer
              </button>
              <a
                href="/"
                style={{ padding: '12px 28px', borderRadius: 9999, border: '1px solid rgba(0,0,0,0.1)', textDecoration: 'none', color: '#111', fontSize: 14, fontWeight: 500 }}
              >
                Retour à l&apos;accueil
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
