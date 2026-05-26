'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Mail,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Eye,
  UserPlus,
  Crown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useAdminApiPolling } from '../hooks/useAdminApi';

interface MonthlyUser {
  month: string;
  users: number;
}

interface OverviewData {
  totalUsers: number;
  premiumActive: number;
  newUsersThisMonth: number;
  newUsersGrowthPercent: number;
  conversionRate: number;
  churnRate: number;
  ltv: number;
  viewsThisMonth: number;
  viewsLastMonth: number;
  viewsGrowthPercent: number;
  monthlyUsers_chart: MonthlyUser[];
}

interface MessagesCount {
  unread: number;
}

export function AudienceView() {
  const {
    data: overview,
    error,
    isLoading,
  } = useAdminApiPolling<OverviewData>('overview', 60000);

  const { data: messagesCount } = useAdminApiPolling<MessagesCount>(
    'messages?count_only=true',
    60000,
  );

  return (
    <div className="max-w-[640px] lg:max-w-[920px] mx-auto px-5 pt-8 pb-6">
      <AudienceHeader />

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-[13px]">
          Impossible de charger les données audience. Vérifie ta connexion ou
          recharge la page.
        </div>
      )}

      <OverviewSection overview={overview} isLoading={isLoading} />

      <FunnelSection overview={overview} isLoading={isLoading} />

      <GrowthChartSection
        data={overview?.monthlyUsers_chart ?? []}
        isLoading={isLoading}
      />

      <QuickAccessSection unreadMessages={messagesCount?.unread ?? null} />
    </div>
  );
}

function AudienceHeader() {
  return (
    <header className="mb-8">
      <p className="text-[10px] tracking-widest uppercase text-foreground/45 font-bold">
        Module
      </p>
      <h1 className="font-extrabold text-[32px] leading-tight tracking-tight mt-1">
        Audience
      </h1>
      <p className="text-[15px] text-foreground/60 mt-3 leading-relaxed max-w-[560px]">
        Qui sont vos lecteurs, comment ils interagissent, et où vous perdez ou
        gagnez.
      </p>
    </header>
  );
}

function OverviewSection({
  overview,
  isLoading,
}: {
  overview: OverviewData | undefined;
  isLoading: boolean;
}) {
  return (
    <section className="mb-10">
      <h2 className="font-bold text-[16px] mb-3">Vue d&apos;ensemble</h2>
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Users}
          label="Total inscrits"
          value={overview?.totalUsers ?? null}
          isLoading={isLoading}
          growth={overview?.newUsersGrowthPercent ?? null}
          growthLabel="vs mois dernier"
        />
        <StatCard
          icon={Crown}
          label="Premium actifs"
          value={overview?.premiumActive ?? null}
          isLoading={isLoading}
        />
        <ConversionCard
          rate={overview?.conversionRate ?? null}
          churnRate={overview?.churnRate ?? null}
          isLoading={isLoading}
        />
        <StatCard
          icon={Eye}
          label="Vues ce mois"
          value={overview?.viewsThisMonth ?? null}
          isLoading={isLoading}
          growth={overview?.viewsGrowthPercent ?? null}
          growthLabel="vs mois dernier"
        />
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  isLoading,
  growth,
  growthLabel,
}: {
  icon: LucideIcon;
  label: string;
  value: number | null;
  isLoading: boolean;
  growth?: number | null;
  growthLabel?: string;
}) {
  const positive = (growth ?? 0) >= 0;
  return (
    <div className="bg-black/2.5 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] tracking-widest uppercase text-foreground/45 font-semibold">
          {label}
        </p>
        <Icon className="w-4 h-4 text-foreground/30" aria-hidden="true" />
      </div>
      <p className="font-extrabold text-[28px] leading-tight mt-1 tabular-nums">
        <AnimatedNumber value={value} isLoading={isLoading} />
      </p>
      {growth !== undefined && growth !== null && (
        <span
          className={[
            'inline-flex items-center gap-1 text-[11px] font-bold mt-1',
            positive ? 'text-[#00a004]' : 'text-red-600',
          ].join(' ')}
        >
          {positive ? (
            <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
          ) : (
            <ArrowDownRight className="w-3 h-3" aria-hidden="true" />
          )}
          {`${positive ? '+' : ''}${growth}%`}
          {growthLabel && (
            <span className="text-foreground/40 font-normal ml-1">
              {growthLabel}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

function ConversionCard({
  rate,
  churnRate,
  isLoading,
}: {
  rate: number | null;
  churnRate: number | null;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-2xl p-4 border border-[#d4a843]/15 bg-linear-to-br from-[#d4a843]/8 to-[#ff8c42]/4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] tracking-widest uppercase text-[#d4a843] font-semibold">
          Taux de conversion
        </p>
        <TrendingUp className="w-4 h-4 text-[#d4a843]/60" aria-hidden="true" />
      </div>
      <p className="font-extrabold text-[28px] leading-tight mt-1 tabular-nums">
        {isLoading || rate === null ? (
          <span className="text-foreground/20">-</span>
        ) : (
          <>
            <AnimatedNumber value={rate} isLoading={false} decimals={1} />
            <span className="text-[18px] text-foreground/40 font-medium ml-1">
              %
            </span>
          </>
        )}
      </p>
      {churnRate !== null && churnRate !== undefined && (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium mt-1 text-foreground/55">
          Churn {churnRate}% ce mois
        </span>
      )}
    </div>
  );
}

function FunnelSection({
  overview,
  isLoading,
}: {
  overview: OverviewData | undefined;
  isLoading: boolean;
}) {
  const visitors = overview?.viewsThisMonth ?? null;
  const registered = overview?.totalUsers ?? null;
  const premium = overview?.premiumActive ?? null;

  const visitorToRegisteredPercent =
    visitors !== null && registered !== null && visitors > 0
      ? parseFloat(((registered / visitors) * 100).toFixed(1))
      : null;

  const registeredToPremiumPercent =
    registered !== null && premium !== null && registered > 0
      ? parseFloat(((premium / registered) * 100).toFixed(1))
      : null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-[16px]">Funnel de conversion</h2>
        <span className="text-[11px] text-foreground/45">ce mois</span>
      </div>

      {isLoading ? (
        <FunnelSkeleton />
      ) : (
        <div className="space-y-2.5">
          <FunnelStep
            label="Visiteurs"
            sublabel="Pages vues ce mois"
            value={visitors}
            color="bg-foreground/6"
            textColor="text-foreground"
            barWidth="100%"
          />
          <FunnelArrow percent={visitorToRegisteredPercent} stage="inscrits" />
          <FunnelStep
            label="Inscrits"
            sublabel="Total comptes créés"
            value={registered}
            color="bg-[#00c805]/15"
            textColor="text-[#00a004]"
            barWidth={
              visitors && registered && visitors > 0
                ? `${Math.max(8, (registered / visitors) * 100)}%`
                : '50%'
            }
          />
          <FunnelArrow
            percent={registeredToPremiumPercent}
            stage="Premium"
          />
          <FunnelStep
            label="Premium"
            sublabel="Abonnements actifs"
            value={premium}
            color="bg-linear-to-br from-[#d4a843]/20 to-[#ff8c42]/10"
            textColor="text-[#d4a843]"
            barWidth={
              registered && premium && registered > 0
                ? `${Math.max(8, (premium / registered) * 100)}%`
                : '20%'
            }
          />
        </div>
      )}
    </section>
  );
}

function FunnelStep({
  label,
  sublabel,
  value,
  color,
  textColor,
  barWidth,
}: {
  label: string;
  sublabel: string;
  value: number | null;
  color: string;
  textColor: string;
  barWidth: string;
}) {
  return (
    <div className="bg-white border border-black/6 rounded-2xl p-4 relative overflow-hidden">
      <div
        className={`absolute inset-y-0 left-0 ${color} transition-all`}
        style={{ width: barWidth }}
        aria-hidden="true"
      />
      <div className="relative flex items-center justify-between">
        <div>
          <p className={`font-bold text-[14px] ${textColor}`}>{label}</p>
          <p className="text-[11px] text-foreground/55 mt-0.5">{sublabel}</p>
        </div>
        <p className="font-extrabold text-[22px] tabular-nums text-foreground">
          {value === null ? (
            <span className="text-foreground/20">-</span>
          ) : (
            value.toLocaleString('fr-FR')
          )}
        </p>
      </div>
    </div>
  );
}

function FunnelArrow({
  percent,
  stage,
}: {
  percent: number | null;
  stage: string;
}) {
  return (
    <div className="flex items-center gap-2 pl-4">
      <div className="w-px h-3 bg-foreground/15" />
      <p className="text-[11px] text-foreground/55">
        {percent === null ? (
          <span className="text-foreground/30">
            Conversion vers {stage} non calculable
          </span>
        ) : (
          <>
            <span className="font-bold tabular-nums text-foreground">
              {percent}%
            </span>{' '}
            convertis en {stage}
          </>
        )}
      </p>
    </div>
  );
}

function FunnelSkeleton() {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-white border border-black/6 rounded-2xl p-4 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-black/6 rounded-sm w-1/3" />
              <div className="h-2 bg-black/4 rounded-sm w-1/2" />
            </div>
            <div className="h-6 bg-black/6 rounded-sm w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

function GrowthChartSection({
  data,
  isLoading,
}: {
  data: MonthlyUser[];
  isLoading: boolean;
}) {
  const totalSixMonths = data.reduce((sum, m) => sum + (m.users || 0), 0);
  const hasData = data.length > 0 && totalSixMonths > 0;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-[16px]">Croissance utilisateurs</h2>
        <span className="text-[11px] text-foreground/45">6 derniers mois</span>
      </div>

      <div className="bg-white border border-black/6 rounded-2xl p-4 sm:p-5">
        {isLoading ? (
          <div className="h-[220px] flex items-center justify-center">
            <div className="w-full h-full bg-black/3 rounded-xl animate-pulse" />
          </div>
        ) : !hasData ? (
          <div className="h-[220px] flex flex-col items-center justify-center text-center px-4">
            <UserPlus className="w-8 h-8 text-foreground/20 mb-3" aria-hidden="true" />
            <p className="text-[13px] text-foreground/55">
              Pas encore assez de données pour tracer la croissance. Les
              premières inscriptions apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00c805" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#00c805" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1a1a1a"
                  strokeOpacity={0.06}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#1a1a1a99', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#1a1a1a99', fontSize: 11 }}
                  allowDecimals={false}
                  width={32}
                />
                <Tooltip
                  cursor={{ stroke: '#00c805', strokeOpacity: 0.2 }}
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 12,
                    fontSize: 12,
                    padding: '8px 12px',
                  }}
                  labelStyle={{ color: '#1a1a1a', fontWeight: 600 }}
                  formatter={(value) => {
                    const n = typeof value === 'number' ? value : Number(value);
                    return [
                      `${n.toLocaleString('fr-FR')} inscrit${n > 1 ? 's' : ''}`,
                      'Nouveaux',
                    ];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#00c805"
                  strokeWidth={2}
                  fill="url(#growthGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}

interface QuickAccessCard {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: number | null;
}

function QuickAccessSection({
  unreadMessages,
}: {
  unreadMessages: number | null;
}) {
  const cards: QuickAccessCard[] = [
    {
      href: '/admin/audience/utilisateurs',
      icon: Users,
      title: 'Utilisateurs',
      description:
        'Liste complète, recherche, blocage, gestion des abonnements.',
    },
    {
      href: '/admin/audience/abonnes-newsletter',
      icon: Mail,
      title: 'Abonnés newsletter',
      description:
        'Liste, sources, désabonnements et export CSV des abonnés.',
    },
    {
      href: '/admin/audience/messages',
      icon: Mail,
      title: 'Messages',
      description: 'Boîte de réception du formulaire de contact.',
      badge: unreadMessages,
    },
    {
      href: '/admin/audience/statistiques',
      icon: BarChart3,
      title: 'Statistiques avancées',
      description: 'Top articles, pages, vues quotidiennes sur 30 jours.',
    },
  ];

  return (
    <section className="mb-6">
      <h2 className="font-bold text-[16px] mb-3">Accès rapide</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ href, icon: Icon, title, description, badge }) => (
          <Link
            key={href}
            href={href}
            prefetch
            className="group relative bg-white border border-black/6 rounded-2xl p-5 hover:border-[#d4a843]/40 hover:shadow-xs transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-linear-to-br from-[#d4a843]/12 to-[#ff8c42]/8 flex items-center justify-center text-[#d4a843]">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-2">
                {badge !== null && badge !== undefined && badge > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#dc2626] text-white text-[10px] font-bold">
                    {badge}
                  </span>
                )}
                <ArrowUpRight
                  className="w-4 h-4 text-foreground/30 group-hover:text-[#d4a843] transition"
                  aria-hidden="true"
                />
              </div>
            </div>
            <p className="font-bold text-[16px] text-foreground leading-tight">
              {title}
            </p>
            <p className="text-[13px] text-foreground/55 leading-relaxed mt-1">
              {description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function AnimatedNumber({
  value,
  isLoading,
  decimals = 0,
}: {
  value: number | null;
  isLoading: boolean;
  decimals?: number;
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
      const next = start + (end - start) * eased;
      setDisplay(decimals > 0 ? parseFloat(next.toFixed(decimals)) : Math.round(next));
      if (ratio < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (isLoading && value === null) return <span className="text-foreground/20">-</span>;
  return (
    <>
      {display.toLocaleString('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </>
  );
}

