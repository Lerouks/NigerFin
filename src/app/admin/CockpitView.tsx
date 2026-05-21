'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, Bell, Play, Sparkles } from 'lucide-react';
import { useAdminApiPolling } from './hooks/useAdminApi';

interface OverviewData {
  mrr: number;
  viewsToday: number;
  viewsTodayGrowthPercent: number;
  newUsersToday: number;
  newUsersTodayGrowthPercent: number;
  articlesPublishedToday: number;
  revenueToday: number;
  revenueTodayGrowthPercent: number;
  viewsSparkline: number[];
  premiumActive: number;
  newPremiumThisMonth: number;
  topArticle: { id: string; title: string; views: number } | null;
}

interface ProfileGreeting {
  initials: string;
  firstName: string;
}

export function CockpitView({ greeting }: { greeting: ProfileGreeting }) {
  const { data: overview, error, isLoading } = useAdminApiPolling<OverviewData>('overview', 30000);
  const today = formatToday();

  return (
    <div className="max-w-[640px] lg:max-w-[820px] mx-auto px-5 pt-3">
      <CockpitHeader greeting={greeting} today={today} />

      {error && (
        <div className="my-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px]">
          Impossible de charger les données. Nouvel essai dans 30 secondes.
        </div>
      )}

      <HeroCardViews
        value={overview?.viewsToday ?? null}
        growthPercent={overview?.viewsTodayGrowthPercent ?? null}
        sparkline={overview?.viewsSparkline ?? []}
        isLoading={isLoading}
      />

      <StatsRow
        articlesViews={overview?.viewsToday ?? null}
        mrr={overview?.mrr ?? null}
        mrrGrowth={overview?.revenueTodayGrowthPercent ?? null}
        isLoading={isLoading}
      />

      <ActivitySection />

      <TopArticleSection top={overview?.topArticle ?? null} isLoading={isLoading} />

      <BriefingCard
        viewsToday={overview?.viewsToday ?? 0}
        revenueToday={overview?.revenueToday ?? 0}
        newUsersToday={overview?.newUsersToday ?? 0}
      />
    </div>
  );
}

function CockpitHeader({ greeting, today }: { greeting: ProfileGreeting; today: string }) {
  return (
    <header className="pt-3 pb-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#d4a843] to-[#ff8c42] flex items-center justify-center text-white font-bold text-[14px]">
          {greeting.initials}
        </div>
        <div>
          <p className="font-bold text-[22px] text-[#1a1a1a] leading-none tracking-tight">
            Bonjour {greeting.firstName}
          </p>
          <p className="text-[12px] text-[#1a1a1a]/45 mt-1">{today}</p>
        </div>
      </div>
      <button
        type="button"
        aria-label="Notifications"
        className="relative w-10 h-10 rounded-full bg-black/[0.04] flex items-center justify-center hover:bg-black/[0.06] transition"
      >
        <Bell className="w-[18px] h-[18px]" />
      </button>
    </header>
  );
}

function HeroCardViews({
  value,
  growthPercent,
  sparkline,
  isLoading,
}: {
  value: number | null;
  growthPercent: number | null;
  sparkline: number[];
  isLoading: boolean;
}) {
  const positive = (growthPercent ?? 0) >= 0;
  return (
    <section className="mb-3">
      <div
        className="rounded-3xl p-6 border border-black/[0.04]"
        style={{
          background:
            'radial-gradient(circle at 20% 0%, rgba(255,140,66,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 100%, rgba(212,168,67,0.12) 0%, transparent 50%), #ffffff',
        }}
      >
        <div className="flex items-start justify-between mb-1">
          <p className="text-[11px] tracking-widest uppercase text-[#1a1a1a]/45 font-semibold">
            Lecteurs aujourd&apos;hui
          </p>
          <span className="text-[11px] text-[#1a1a1a]/40">en direct</span>
        </div>
        <div className="flex items-baseline gap-2 mt-3">
          <span className="font-black text-[64px] leading-none tracking-tight tabular-nums">
            <AnimatedNumber value={value} isLoading={isLoading} />
          </span>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span
            className={[
              'inline-flex items-center gap-1 text-[12px] font-bold px-2 py-1 rounded-md',
              positive ? 'bg-[#00c805]/10 text-[#00a004]' : 'bg-red-500/10 text-red-600',
            ].join(' ')}
          >
            {positive ? (
              <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="w-3 h-3" aria-hidden="true" />
            )}
            {growthPercent === null ? '—' : `${positive ? '+' : ''}${growthPercent}%`}
          </span>
          <span className="text-[12px] text-[#1a1a1a]/45">vs hier</span>
        </div>
        <Sparkline data={sparkline} className="mt-5 w-full h-[70px]" positive={positive} />
      </div>
    </section>
  );
}

function StatsRow({
  articlesViews,
  mrr,
  mrrGrowth,
  isLoading,
}: {
  articlesViews: number | null;
  mrr: number | null;
  mrrGrowth: number | null;
  isLoading: boolean;
}) {
  const positive = (mrrGrowth ?? 0) >= 0;
  return (
    <section className="grid grid-cols-2 gap-3 mb-6">
      <div className="bg-black/[0.025] rounded-2xl p-4">
        <p className="text-[10px] tracking-widest uppercase text-[#1a1a1a]/45 font-semibold">
          Articles vus
        </p>
        <p className="font-extrabold text-[28px] leading-tight mt-2 tabular-nums">
          <AnimatedNumber value={articlesViews} isLoading={isLoading} />
        </p>
      </div>
      <div className="rounded-2xl p-4 border border-[#d4a843]/15 bg-gradient-to-br from-[#d4a843]/8 to-[#ff8c42]/4">
        <p className="text-[10px] tracking-widest uppercase text-[#d4a843] font-semibold">
          Premium MRR
        </p>
        <p className="font-extrabold text-[22px] leading-tight mt-2 tabular-nums">
          <AnimatedNumber value={mrr} isLoading={isLoading} />
          <span className="text-[12px] text-[#1a1a1a]/40 font-medium ml-1">FCFA</span>
        </p>
        <span
          className={[
            'inline-flex items-center gap-1 text-[11px] font-bold mt-1',
            positive ? 'text-[#d4a843]' : 'text-red-600',
          ].join(' ')}
        >
          {positive ? '▲' : '▼'} {mrrGrowth === null ? '—' : `${positive ? '+' : ''}${mrrGrowth}%`}
        </span>
      </div>
    </section>
  );
}

interface ActivityEvent {
  id: string;
  initials?: string;
  label: string;
  detail: string;
  relativeTime: string;
  highlight?: string;
}

function ActivitySection() {
  const { data, isLoading } = useAdminApiPolling<{ events: ActivityEvent[] }>(
    'activity',
    30000
  );
  const events = data?.events ?? [];

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-[16px]">Activité en direct</h2>
        <Link
          href="/admin/legacy"
          className="text-[12px] text-[#d4a843] font-semibold hover:underline"
        >
          Tout voir
        </Link>
      </div>

      {isLoading && <ActivitySkeleton />}
      {!isLoading && events.length === 0 && (
        <div className="bg-white border border-black/[0.06] rounded-2xl p-6 text-center text-[13px] text-[#1a1a1a]/55">
          Aucune activité récente. Profite du calme.
        </div>
      )}
      {!isLoading && events.length > 0 && (
        <div className="space-y-2.5">
          {events.slice(0, 5).map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 bg-white border border-black/[0.06] rounded-2xl p-3.5"
            >
              <Avatar initials={e.initials ?? '••'} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold leading-tight text-[#1a1a1a]">
                  {e.label}{' '}
                  <span className="text-[#1a1a1a]/45 font-normal">{e.detail}</span>
                </p>
                <p className="text-[11px] text-[#1a1a1a]/45 mt-0.5">
                  {e.relativeTime}
                  {e.highlight ? (
                    <>
                      {' · '}
                      <span className="text-[#d4a843] font-semibold">{e.highlight}</span>
                    </>
                  ) : null}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-white border border-black/[0.06] rounded-2xl p-3.5 animate-pulse"
        >
          <div className="w-10 h-10 rounded-full bg-black/[0.06] flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-black/[0.06] rounded w-3/4" />
            <div className="h-2 bg-black/[0.04] rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4a843] to-[#ff8c42] flex items-center justify-center text-white font-bold text-[12px] flex-shrink-0">
      {initials}
    </div>
  );
}

function TopArticleSection({
  top,
  isLoading,
}: {
  top: { id: string; title: string; views: number } | null;
  isLoading: boolean;
}) {
  if (isLoading) return null;
  if (!top) return null;
  return (
    <section className="mb-6">
      <h2 className="font-bold text-[16px] mb-3">Article qui monte</h2>
      <Link
        href={`/admin/legacy?tab=articles&article=${top.id}`}
        className="block rounded-2xl p-4 text-white bg-gradient-to-br from-black to-[#1a1a1a] hover:from-[#1a1a1a] hover:to-[#2a2a2a] transition"
      >
        <div className="text-[10px] tracking-widest uppercase text-[#d4a843] font-semibold mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3" aria-hidden="true" /> Top du moment
        </div>
        <p className="font-semibold text-[14px] leading-tight line-clamp-2">{top.title}</p>
        <p className="text-[11px] font-mono text-white/70 mt-3 tabular-nums">
          {top.views.toLocaleString('fr-FR')} vues ce mois
        </p>
      </Link>
    </section>
  );
}

function BriefingCard({
  viewsToday,
  revenueToday,
  newUsersToday,
}: {
  viewsToday: number;
  revenueToday: number;
  newUsersToday: number;
}) {
  const narrative = buildNarrative({ viewsToday, revenueToday, newUsersToday });
  return (
    <section className="mb-10">
      <div className="rounded-3xl p-5 text-white bg-gradient-to-br from-[#1a1a1a] to-black">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Écouter le briefing (bientôt)"
            disabled
            className="w-14 h-14 rounded-full bg-gradient-to-br from-[#d4a843] to-[#ff8c42] flex items-center justify-center flex-shrink-0 shadow-lg opacity-70 cursor-not-allowed"
          >
            <Play className="w-[18px] h-[18px] text-white fill-current" />
          </button>
          <div>
            <p className="text-[11px] tracking-widest uppercase text-[#d4a843] font-bold">
              Briefing du jour
            </p>
            <p className="text-[15px] font-bold mt-1">Aujourd&apos;hui en bref</p>
            <p className="text-[12px] text-white/55 mt-0.5">
              Audio bientôt disponible
            </p>
          </div>
        </div>
        <p className="text-[13px] text-white/80 leading-relaxed mt-4">{narrative}</p>
      </div>
    </section>
  );
}

function buildNarrative({
  viewsToday,
  revenueToday,
  newUsersToday,
}: {
  viewsToday: number;
  revenueToday: number;
  newUsersToday: number;
}): string {
  if (viewsToday === 0 && revenueToday === 0 && newUsersToday === 0) {
    return 'Pas encore d\'activité aujourd\'hui. La journée commence à peine.';
  }
  const parts: string[] = [];
  if (viewsToday > 0) {
    parts.push(
      `${viewsToday.toLocaleString('fr-FR')} ${
        viewsToday > 1 ? 'pages lues' : 'page lue'
      }`
    );
  }
  if (newUsersToday > 0) {
    parts.push(
      `${newUsersToday.toLocaleString('fr-FR')} ${
        newUsersToday > 1 ? 'nouveaux lecteurs' : 'nouveau lecteur'
      }`
    );
  }
  if (revenueToday > 0) {
    parts.push(`${revenueToday.toLocaleString('fr-FR')} FCFA encaissés`);
  }
  return `Aujourd'hui : ${parts.join(', ')}.`;
}

function AnimatedNumber({
  value,
  isLoading,
}: {
  value: number | null;
  isLoading: boolean;
}) {
  const [display, setDisplay] = useState<number>(0);

  useEffect(() => {
    if (value === null || value === undefined) return;
    const start = display;
    const end = value;
    if (start === end) return;
    const duration = 600;
    const startTime = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const elapsed = t - startTime;
      const ratio = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - ratio, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (ratio < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (isLoading && value === null) return <span className="text-[#1a1a1a]/20">—</span>;
  return <>{display.toLocaleString('fr-FR')}</>;
}

function Sparkline({
  data,
  className,
  positive,
}: {
  data: number[];
  className?: string;
  positive: boolean;
}) {
  if (!data || data.length === 0) {
    return <div className={[className, 'opacity-30'].filter(Boolean).join(' ')} />;
  }
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 320;
  const height = 70;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  const path = `M${points.join(' L')}`;
  const area = `${path} L${width},${height} L0,${height} Z`;
  const color = positive ? '#00c805' : '#dc2626';
  const gradientId = positive ? 'spark-pos' : 'spark-neg';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatToday(): string {
  const now = new Date();
  return now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
