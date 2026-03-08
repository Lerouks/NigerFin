'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, RefreshCw } from 'lucide-react';
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
    <div className="min-h-[70vh] bg-[#fafaf9] flex items-center justify-center">
      <div className="text-center px-4">
        <div className="mb-8">
          <span className="text-[120px] md:text-[160px] font-bold text-black/[0.04] leading-none block">
            500
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4 -mt-16">Erreur inattendue</h1>
        <p className="text-gray-500 text-[15px] mb-8 max-w-md mx-auto leading-relaxed">
          Une erreur s&apos;est produite lors du chargement de cette page.
          Notre équipe a été notifiée et travaille à résoudre le problème.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 bg-[#111] text-white px-7 py-3 rounded-full hover:bg-[#333] transition-colors text-[14px]"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-black/[0.1] px-7 py-3 rounded-full hover:bg-black/5 transition-colors text-[14px]"
          >
            Retour à l&apos;accueil
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
