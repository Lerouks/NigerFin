'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, ArrowRight, AlertTriangle } from 'lucide-react';
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
    <div className="min-h-[60vh] bg-[#fafaf9] flex items-center justify-center relative overflow-hidden">
      {/* Subtle background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-red-500/[0.04] to-transparent blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-gradient-to-tl from-gold/[0.05] to-transparent blur-[60px]" />
      </div>

      <div className="relative text-center px-4">
        {/* Glass icon container */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-black/[0.06] shadow-sm flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-error/70" />
        </div>

        <h1 className="text-2xl font-bold mb-3 text-foreground">Erreur de chargement</h1>
        <p className="text-gray-400 text-[15px] mb-8 max-w-md mx-auto leading-relaxed">
          Impossible de charger cette section. Veuillez réessayer.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 bg-[#111] text-white px-6 py-2.5 rounded-xl hover:bg-[#222] transition-all duration-300 text-[14px] font-medium shadow-sm hover:shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm border border-black/[0.08] px-6 py-2.5 rounded-xl hover:bg-white hover:border-black/[0.12] transition-all duration-300 text-[14px] font-medium"
          >
            Accueil
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
