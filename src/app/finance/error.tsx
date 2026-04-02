'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, ArrowRight } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

export default function Error({
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
    <div className="min-h-[60vh] bg-[#fafaf9] flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-2xl font-bold mb-3">Erreur de chargement</h1>
        <p className="text-gray-500 text-[15px] mb-6 max-w-md mx-auto">
          Impossible de charger cette section. Veuillez réessayer.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 bg-[#111] text-white px-6 py-2.5 rounded-lg hover:bg-[#333] transition-colors text-[14px]"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-black/[0.1] px-6 py-2.5 rounded-lg hover:bg-black/5 transition-colors text-[14px]"
          >
            Accueil
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
