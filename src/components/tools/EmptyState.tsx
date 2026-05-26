'use client';

import { Calculator } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function EmptyState({
  message = 'Veuillez saisir les informations ci-dessus pour afficher les résultats.',
  icon: Icon = Calculator,
}: EmptyStateProps) {
  return (
    <div className="bg-white border border-black/6 rounded-xl p-10 text-center">
      <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-gray-400" aria-hidden="true" />
      </div>
      <p className="text-[14px] text-gray-500 max-w-sm mx-auto leading-relaxed" role="status">
        {message}
      </p>
    </div>
  );
}
