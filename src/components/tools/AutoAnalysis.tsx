'use client';

import { TrendingUp } from 'lucide-react';

interface AutoAnalysisProps {
  paragraphs: string[];
}

export function AutoAnalysis({ paragraphs }: AutoAnalysisProps) {
  if (paragraphs.length === 0) return null;

  return (
    <div className="bg-white border border-black/[0.06] rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-gray-400" />
        <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400">
          Analyse automatique
        </h3>
      </div>
      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-[14px] text-gray-600 leading-relaxed">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
