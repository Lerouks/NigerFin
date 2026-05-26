'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Tag,
  Lock,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BILLING_OPTIONS, getBillingCycleLabel } from '@/config/pricing';
import { useAdminApi, useAdminApiPolling } from '../hooks/useAdminApi';

interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
}

interface OverviewData {
  mrr: number;
  arr: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowthPercent: number;
  totalRevenue: number;
  monthlyRevenue: MonthlyRevenuePoint[];
  premiumActive: number;
  newPremiumThisMonth: number;
  expiredThisMonth: number;
  churnRate: number;
  ltv: number;
  conversionRate: number;
}

interface TransactionItem {
  id: string;
  amount: number;
  tier: string;
  billing_cycle: string;
  payment_method: string;
  verified_at: string | null;
  created_at: string;
  relativeTime: string;
  user: { initials: string; displayName: string };
}

interface TransactionsResponse {
  transactions: TransactionItem[];
}

export function ArgentView() {
  const {
    data: overview,
    error: overviewError,
    isLoading: overviewLoading,
  } = useAdminApiPolling<OverviewData>('overview', 30000);

  const {
    data: transactionsData,
    error: transactionsError,
    isLoading: transactionsLoading,
  } = useAdminApiPolling<TransactionsResponse>('transactions', 30000);

  const {
    data: revenueDetail,
    isLoading: revenueLoading,
  } = useAdminApi<{ monthly: MonthlyRevenuePoint[] }>('revenue');

  return (
    <div className="max-w-[640px] lg:max-w-[920px] mx-auto px-5 pt-8 pb-10">
      <ArgentHeader />

      {overviewError && (
        <div className="my-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px]">
          Impossible de charger les données. Nouvel essai dans 30 secondes.
        </div>
      )}

      <MetricsSection overview={overview ?? null} isLoading={overviewLoading} />

      <RevenueChartSection
        monthly={overview?.monthlyRevenue ?? revenueDetail?.monthly ?? []}
        isLoading={overviewLoading && revenueLoading}
      />

      <TransactionsSection
        transactions={transactionsData?.transactions ?? []}
        isLoading={transactionsLoading}
        hasError={Boolean(transactionsError)}
      />

      <PricingSection />

      <QuickAccessSection />
    </div>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────

function ArgentHeader() {
  return (
    <header className="mb-8">
      <p className="text-[10px] tracking-widest uppercase text-foreground/45 font-bold">
        Module
      </p>
      <h1 className="font-extrabold text-[32px] leading-tight tracking-tight mt-1">
        Argent
      </h1>
      <p className="text-[15px] text-foreground/60 mt-3 leading-relaxed max-w-[560px]">
        Le revenu réel de votre business en direct.
      </p>
    </header>
  );
}

// ─── Metrics ───────────────────────────────────────────────────────────────

function MetricsSection({
  overview,
  isLoading,
}: {
  overview: OverviewData | null;
  isLoading: boolean;
}) {
  const churn = overview?.churnRate ?? null;
  const churnTone: 'good' | 'warn' | 'bad' =
    churn === null
      ? 'good'
      : churn < 5
        ? 'good'
        : churn > 10
          ? 'bad'
          : 'warn';

  return (
    <section className="grid grid-cols-2 gap-3 mb-8">
      <MrrCard
        mrr={overview?.mrr ?? null}
        growthPercent={overview?.revenueGrowthPercent ?? null}
        isLoading={isLoading}
      />
      <ArrCard arr={overview?.arr ?? null} isLoading={isLoading} />
      <ChurnCard rate={churn} tone={churnTone} isLoading={isLoading} />
      <LtvCard ltv={overview?.ltv ?? null} isLoading={isLoading} />
    </section>
  );
}

function MrrCard({
  mrr,
  growthPercent,
  isLoading,
}: {
  mrr: number | null;
  growthPercent: number | null;
  isLoading: boolean;
}) {
  const positive = (growthPercent ?? 0) >= 0;
  return (
    <div
      className="col-span-2 rounded-3xl p-6 border border-[#d4a843]/15"
      style={{
        background:
          'radial-gradient(circle at 20% 0%, rgba(255,140,66,0.10) 0%, transparent 55%), radial-gradient(circle at 80% 100%, rgba(212,168,67,0.14) 0%, transparent 55%), #ffffff',
      }}
    >
      <div className="flex items-start justify-between mb-1">
        <p className="text-[11px] tracking-widest uppercase text-[#d4a843] font-bold">
          Revenu mensuel récurrent
        </p>
        <span className="text-[11px] text-foreground/40">en direct</span>
      </div>
      <div className="flex items-baseline gap-2 mt-3 flex-wrap">
        <span className="font-black text-[44px] leading-none tracking-tight tabular-nums">
          <AnimatedNumber value={mrr} isLoading={isLoading} />
        </span>
        <span className="text-[14px] text-foreground/45 font-semibold">FCFA</span>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span
          className={[
            'inline-flex items-center gap-1 text-[12px] font-bold px-2 py-1 rounded-md',
            positive
              ? 'bg-[#00c805]/10 text-[#00a004]'
              : 'bg-red-500/10 text-red-600',
          ].join(' ')}
        >
          {positive ? (
            <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
          ) : (
            <ArrowDownRight className="w-3 h-3" aria-hidden="true" />
          )}
          {growthPercent === null
            ? '·'
            : `${positive ? '+' : ''}${growthPercent}%`}
        </span>
        <span className="text-[12px] text-foreground/45">vs mois dernier</span>
      </div>
    </div>
  );
}

function ArrCard({
  arr,
  isLoading,
}: {
  arr: number | null;
  isLoading: boolean;
}) {
  return (
    <div className="bg-white border border-black/6 rounded-2xl p-4">
      <p className="text-[10px] tracking-widest uppercase text-foreground/45 font-semibold">
        Revenu annualisé
      </p>
      <p className="font-extrabold text-[22px] leading-tight mt-2 tabular-nums">
        <AnimatedNumber value={arr} isLoading={isLoading} />
      </p>
      <p className="text-[11px] text-foreground/40 mt-1">FCFA · annuel projeté</p>
    </div>
  );
}

function ChurnCard({
  rate,
  tone,
  isLoading,
}: {
  rate: number | null;
  tone: 'good' | 'warn' | 'bad';
  isLoading: boolean;
}) {
  const toneClass =
    tone === 'good'
      ? 'text-[#00a004]'
      : tone === 'warn'
        ? 'text-[#d4a843]'
        : 'text-red-600';
  const toneBg =
    tone === 'good'
      ? 'bg-[#00c805]/10'
      : tone === 'warn'
        ? 'bg-[#d4a843]/12'
        : 'bg-red-500/10';

  return (
    <div className="bg-white border border-black/6 rounded-2xl p-4">
      <p className="text-[10px] tracking-widest uppercase text-foreground/45 font-semibold">
        Taux de churn
      </p>
      <p className="font-extrabold text-[22px] leading-tight mt-2 tabular-nums">
        {isLoading && rate === null ? (
          <span className="text-foreground/20">·</span>
        ) : (
          <>
            {rate === null ? '·' : rate}
            <span className="text-[14px] text-foreground/40 font-medium ml-1">
              %
            </span>
          </>
        )}
      </p>
      <span
        className={[
          'inline-flex items-center gap-1 text-[11px] font-bold mt-1 px-2 py-0.5 rounded-sm',
          toneBg,
          toneClass,
        ].join(' ')}
      >
        {tone === 'good'
          ? 'sain'
          : tone === 'warn'
            ? 'à surveiller'
            : 'à corriger'}
      </span>
    </div>
  );
}

function LtvCard({
  ltv,
  isLoading,
}: {
  ltv: number | null;
  isLoading: boolean;
}) {
  return (
    <div className="col-span-2 bg-white border border-black/6 rounded-2xl p-4">
      <p className="text-[10px] tracking-widest uppercase text-foreground/45 font-semibold">
        Valeur vie client (LTV)
      </p>
      <div className="flex items-baseline gap-2 mt-2 flex-wrap">
        <span className="font-extrabold text-[22px] leading-tight tabular-nums">
          <AnimatedNumber value={ltv} isLoading={isLoading} />
        </span>
        <span className="text-[12px] text-foreground/45 font-medium">FCFA</span>
        <span className="text-[11px] text-foreground/40 ml-1">
          en moyenne par abonné
        </span>
      </div>
    </div>
  );
}

// ─── Revenue chart ─────────────────────────────────────────────────────────

function RevenueChartSection({
  monthly,
  isLoading,
}: {
  monthly: MonthlyRevenuePoint[];
  isLoading: boolean;
}) {
  const cleaned = monthly.filter((m) => m && typeof m.revenue === 'number');
  const hasData = cleaned.some((m) => m.revenue > 0);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-[16px]">Revenu mensuel</h2>
        <span className="text-[11px] text-foreground/40">6 derniers mois</span>
      </div>
      <div className="bg-white border border-black/6 rounded-2xl p-4">
        {isLoading && cleaned.length === 0 && <ChartSkeleton />}
        {!isLoading && !hasData && (
          <div className="text-center py-10 text-[13px] text-foreground/55">
            Pas encore de revenu enregistré. Le premier paiement Premium fera
            décoller le graphe.
          </div>
        )}
        {hasData && (
          <div className="h-[180px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={cleaned}
                margin={{ top: 5, right: 12, left: 12, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="argent-revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4a843" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#ff8c42" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#1a1a1a' }}
                  tickLine={false}
                  axisLine={false}
                  stroke="#1a1a1a"
                  opacity={0.45}
                />
                <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#d4a843', strokeOpacity: 0.3 }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#d4a843"
                  strokeWidth={2.5}
                  fill="url(#argent-revenue)"
                  activeDot={{ r: 5, fill: '#ff8c42', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}

interface RevenueTooltipProps {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
}

function RevenueTooltip({ active, payload, label }: RevenueTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="bg-foreground text-white rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[10px] uppercase tracking-widest text-[#d4a843] font-bold">
        {label}
      </p>
      <p className="text-[13px] font-bold tabular-nums mt-0.5">
        {value.toLocaleString('fr-FR')} FCFA
      </p>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-[180px] flex items-end gap-2 animate-pulse px-2">
      {[35, 55, 40, 70, 60, 80].map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-black/6 rounded-t"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

// ─── Transactions feed ─────────────────────────────────────────────────────

function TransactionsSection({
  transactions,
  isLoading,
  hasError,
}: {
  transactions: TransactionItem[];
  isLoading: boolean;
  hasError: boolean;
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-[16px]">Transactions récentes</h2>
        <Link
          href="/admin/argent/paiements"
          className="text-[12px] text-[#d4a843] font-semibold hover:underline"
        >
          Tout voir
        </Link>
      </div>

      {hasError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-[13px]">
          Flux de transactions indisponible. Nouvel essai dans 30 secondes.
        </div>
      )}

      {!hasError && isLoading && transactions.length === 0 && (
        <TransactionsSkeleton />
      )}

      {!hasError && !isLoading && transactions.length === 0 && (
        <div className="bg-white border border-black/6 rounded-2xl p-6 text-center text-[13px] text-foreground/55">
          Aucune transaction pour le moment. Le premier paiement Premium va
          arriver.
        </div>
      )}

      {transactions.length > 0 && (
        <div className="space-y-2.5">
          {transactions.slice(0, 10).map((t) => (
            <TransactionRow key={t.id} transaction={t} />
          ))}
        </div>
      )}
    </section>
  );
}

function TransactionRow({ transaction }: { transaction: TransactionItem }) {
  return (
    <div className="flex items-center gap-3 bg-white border border-black/6 rounded-2xl p-3.5">
      <Avatar initials={transaction.user.initials} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold leading-tight text-foreground truncate">
          {transaction.user.displayName}
        </p>
        <p className="text-[11px] text-foreground/45 mt-0.5">
          {transaction.tier} · {getBillingCycleLabel(transaction.billing_cycle)}
          {' · '}
          {transaction.relativeTime}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[13px] font-bold text-[#d4a843] tabular-nums whitespace-nowrap">
          +{transaction.amount.toLocaleString('fr-FR')}
        </p>
        <p className="text-[10px] text-foreground/40 mt-0.5">FCFA</p>
      </div>
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-white border border-black/6 rounded-2xl p-3.5 animate-pulse"
        >
          <div className="w-10 h-10 rounded-full bg-black/6 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-black/6 rounded-sm w-3/5" />
            <div className="h-2 bg-black/4 rounded-sm w-2/5" />
          </div>
          <div className="h-3 bg-black/6 rounded-sm w-16" />
        </div>
      ))}
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#d4a843] to-[#ff8c42] flex items-center justify-center text-white font-bold text-[12px] shrink-0">
      {initials}
    </div>
  );
}

// ─── Pricing section ───────────────────────────────────────────────────────

interface PricingPopularity {
  popularCycle: string | null;
}

function PricingSection() {
  const { data: transactionsData } = useAdminApi<TransactionsResponse>(
    'transactions'
  );

  const popularity = computePopularity(transactionsData?.transactions ?? []);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-[16px]">Tarifs actifs</h2>
        <Link
          href="/admin/argent/tarifs"
          className="text-[12px] text-[#d4a843] font-semibold hover:underline"
        >
          Configurer
        </Link>
      </div>
      <div className="grid gap-2.5">
        {BILLING_OPTIONS.map((option) => (
          <PricingRow
            key={option.cycle}
            cycle={option.cycle}
            price={option.price}
            durationLabel={option.durationLabel}
            savings={option.savings}
            isPopular={popularity.popularCycle === option.cycle}
          />
        ))}
      </div>
    </section>
  );
}

function computePopularity(transactions: TransactionItem[]): PricingPopularity {
  if (!transactions.length) return { popularCycle: null };

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const counts: Record<string, number> = {};

  for (const t of transactions) {
    const ref = t.verified_at ?? t.created_at;
    if (!ref) continue;
    if (new Date(ref) < thisMonthStart) continue;
    counts[t.billing_cycle] = (counts[t.billing_cycle] ?? 0) + 1;
  }

  let top: string | null = null;
  let topCount = 0;
  for (const [cycle, count] of Object.entries(counts)) {
    if (count > topCount) {
      top = cycle;
      topCount = count;
    }
  }
  return { popularCycle: top };
}

function PricingRow({
  cycle,
  price,
  durationLabel,
  savings,
  isPopular,
}: {
  cycle: string;
  price: number;
  durationLabel: string;
  savings?: string;
  isPopular: boolean;
}) {
  return (
    <div
      className={[
        'flex items-center justify-between bg-white border rounded-2xl p-4',
        isPopular ? 'border-[#d4a843]/50 shadow-xs' : 'border-black/6',
      ].join(' ')}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-[14px] text-foreground">
            {getBillingCycleLabel(cycle)}
          </p>
          {isPopular && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#d4a843] bg-[#d4a843]/10 px-2 py-0.5 rounded-sm">
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              le plus populaire
            </span>
          )}
        </div>
        <p className="text-[11px] text-foreground/45 mt-0.5">
          {durationLabel}
          {savings ? ` · ${savings}` : ''}
        </p>
      </div>
      <div className="text-right">
        <p className="font-extrabold text-[18px] tabular-nums text-foreground">
          {price.toLocaleString('fr-FR')}
        </p>
        <p className="text-[10px] text-foreground/40">FCFA</p>
      </div>
    </div>
  );
}

// ─── Quick access ──────────────────────────────────────────────────────────

function QuickAccessSection() {
  const cards = [
    {
      href: '/admin/argent/paiements',
      icon: Receipt,
      title: 'Toutes les transactions',
      description:
        'Liste complète des paiements, validations, exports Excel.',
    },
    {
      href: '/admin/argent/tarifs',
      icon: Tag,
      title: 'Tarifs détaillés',
      description: 'Configurer les prix Premium par cycle de facturation.',
    },
    {
      href: '/admin/argent/paywall',
      icon: Lock,
      title: 'Configuration paywall',
      description: 'Décider quels articles passent en Premium et comment.',
    },
  ];

  return (
    <section>
      <h2 className="font-bold text-[16px] mb-3">Accès rapide</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            prefetch
            className="group relative bg-white border border-black/6 rounded-2xl p-5 hover:border-[#d4a843]/40 hover:shadow-xs transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-linear-to-br from-[#d4a843]/12 to-[#ff8c42]/8 flex items-center justify-center text-[#d4a843]">
                <card.icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <ArrowUpRight
                className="w-4 h-4 text-foreground/30 group-hover:text-[#d4a843] transition"
                aria-hidden="true"
              />
            </div>
            <p className="font-bold text-[16px] text-foreground leading-tight">
              {card.title}
            </p>
            <p className="text-[13px] text-foreground/55 leading-relaxed mt-1">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Animated number ───────────────────────────────────────────────────────

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

  if (isLoading && value === null)
    return <span className="text-foreground/20">·</span>;
  return <>{display.toLocaleString('fr-FR')}</>;
}
