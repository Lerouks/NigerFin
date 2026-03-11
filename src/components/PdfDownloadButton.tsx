'use client';

import { useState } from 'react';
import { Download, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import type { PdfExportOptions } from '@/hooks/usePdfExport';
import { usePdfExport } from '@/hooks/usePdfExport';

interface PdfDownloadButtonProps {
  options: PdfExportOptions;
  hasResults: boolean;
}

export function PdfDownloadButton({ options, hasResults }: PdfDownloadButtonProps) {
  const { isSignedIn, userRole } = useAuth();
  const { generate } = usePdfExport();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPremium = isSignedIn && (userRole === 'premium' || userRole === 'admin');

  if (!hasResults) return null;

  const handleDownload = async () => {
    if (!isPremium) return;
    setLoading(true);
    setError(null);

    try {
      // Server-side premium verification
      const res = await fetch('/api/tools/pdf-verify', { method: 'POST' });
      if (res.status === 401) {
        setError('Veuillez vous connecter.');
        return;
      }
      if (res.status === 403) {
        setError('Abonnement Premium requis.');
        return;
      }
      if (!res.ok) {
        setError('Erreur de vérification.');
        return;
      }

      generate(options);
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="relative group inline-block w-full">
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed text-[14px] border border-black/[0.04]"
        >
          <Lock className="w-4 h-4" />
          Télécharger en PDF
        </button>
        <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-[#111] text-white text-[12px] rounded-lg px-4 py-3 text-center z-10 shadow-lg">
          <p className="mb-2">Fonctionnalité réservée aux abonnés Premium</p>
          <Link href="/pricing" className="text-white/70 underline hover:text-white transition-colors">
            Voir les abonnements
          </Link>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-[#111]" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#111] text-white hover:bg-[#333] transition-colors text-[14px] disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {loading ? 'Vérification…' : 'Télécharger en PDF'}
      </button>
      {error && (
        <p className="text-red-500 text-[12px] mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
