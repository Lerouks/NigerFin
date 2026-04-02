'use client';

import { ReactNode } from 'react';

interface DataWidgetProps {
  title: string;
  children: ReactNode;
  isLoading?: boolean;
  source?: string | null;
  lastUpdated?: string | null;
  className?: string;
}

function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-8 bg-gray-200 rounded w-1/2" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  );
}

export function DataWidget({ title, children, isLoading, source, lastUpdated, className = '' }: DataWidgetProps) {
  return (
    <div className={`bg-white rounded-xl border border-black/[0.06] overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-black/[0.05] flex items-center justify-between">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        {source && (
          <span className="text-[10px] text-gray-400 bg-[#f5f5f0] px-2 py-0.5 rounded-full">
            {source}
          </span>
        )}
      </div>
      <div className="p-5">
        {isLoading ? <SkeletonLoader /> : children}
      </div>
      {lastUpdated && (
        <div className="px-5 py-2.5 border-t border-black/[0.04] bg-[#fafaf9]">
          <p className="text-[10px] text-gray-400 text-center">
            Mis à jour : {new Date(lastUpdated).toLocaleString('fr-FR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      )}
    </div>
  );
}
