'use client';

import { useAdminApiPolling } from '../hooks/useAdminApi';

interface OverviewLite {
  totalArticles: number;
  articlesThisMonth: number;
  articlesPublishedToday: number;
}

export function ContenuStats() {
  const { data, isLoading } = useAdminApiPolling<OverviewLite>('overview', 60000);

  return (
    <section className="grid grid-cols-3 gap-3 mb-8">
      <StatCard
        label="Articles publiés"
        value={data?.totalArticles}
        isLoading={isLoading}
      />
      <StatCard
        label="Ce mois"
        value={data?.articlesThisMonth}
        isLoading={isLoading}
        accent
      />
      <StatCard
        label="Aujourd'hui"
        value={data?.articlesPublishedToday}
        isLoading={isLoading}
      />
    </section>
  );
}

function StatCard({
  label,
  value,
  isLoading,
  accent = false,
}: {
  label: string;
  value?: number;
  isLoading: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        'rounded-2xl p-4',
        accent
          ? 'bg-linear-to-br from-[#d4a843]/8 to-[#ff8c42]/4 border border-[#d4a843]/15'
          : 'bg-black/2.5',
      ].join(' ')}
    >
      <p
        className={[
          'text-[10px] tracking-widest uppercase font-semibold',
          accent ? 'text-[#d4a843]' : 'text-foreground/45',
        ].join(' ')}
      >
        {label}
      </p>
      <p className="font-extrabold text-[24px] leading-tight mt-2 tabular-nums">
        {isLoading || value === undefined ? (
          <span className="text-foreground/20">-</span>
        ) : (
          value.toLocaleString('fr-FR')
        )}
      </p>
    </div>
  );
}
