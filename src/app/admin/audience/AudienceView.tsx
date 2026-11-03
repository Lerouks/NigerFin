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
  AlertTriangle,
  RefreshCw,
  WifiOff,
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
import { useAdminApiPolling } from '@/app/admin/hooks/useAdminApi';

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

/** Le hook rend une erreur déjà rédigée en français. On la reprend telle quelle. */
function messageDeLErreur(erreur: unknown): string {
  if (erreur instanceof Error && erreur.message.trim()) return erreur.message;
  return "Les données n'ont pas pu être chargées. Réessayez dans un instant.";
}

/** Le hook nomme « HorsLigne » l'erreur d'une connexion coupée. */
function estHorsLigne(erreur: unknown): boolean {
  return erreur instanceof Error && erreur.name === 'HorsLigne';
}

export function AudienceView() {
  const {
    data: overview,
    error: erreurOverview,
    isLoading,
    mutate: rechargerOverview,
  } = useAdminApiPolling<OverviewData>('overview', 60000);

  const {
    data: messagesCount,
    error: erreurMessages,
    mutate: rechargerMessages,
  } = useAdminApiPolling<MessagesCount>('messages?count_only=true', 60000);

  const echecOverview = Boolean(erreurOverview);
  const reessayerOverview = () => {
    void rechargerOverview();
  };

  return (
    <div className="max-w-[640px] lg:max-w-[920px] mx-auto px-5 pt-8 pb-6">
      <AudienceHeader />

      {echecOverview && !overview ? (
        // Aucun chiffre en mémoire : on n'affiche ni zéro ni tiret à la place
        // des données, c'est exactement ce qui faisait mentir le tableau de bord.
        <ErreurAudience
          message={messageDeLErreur(erreurOverview)}
          horsLigne={estHorsLigne(erreurOverview)}
          onReessayer={reessayerOverview}
        />
      ) : (
        <>
          {echecOverview && (
            <BandeauAlerte
              className="mb-6"
              texte={
                <>
                  Chiffres du dernier chargement réussi, la mise à jour vient
                  d&apos;échouer. {messageDeLErreur(erreurOverview)}
                </>
              }
              horsLigne={estHorsLigne(erreurOverview)}
              onReessayer={reessayerOverview}
            />
          )}

          <OverviewSection overview={overview} isLoading={isLoading} />

          <FunnelSection overview={overview} isLoading={isLoading} />

          <GrowthChartSection
            data={overview?.monthlyUsers_chart ?? []}
            isLoading={isLoading}
          />
        </>
      )}

      <QuickAccessSection
        unreadMessages={messagesCount?.unread ?? null}
        erreurMessages={erreurMessages ? messageDeLErreur(erreurMessages) : null}
        horsLigneMessages={estHorsLigne(erreurMessages)}
        onReessayerMessages={() => {
          void rechargerMessages();
        }}
      />
    </div>
  );
}

/**
 * Remplace les chiffres, le funnel et la courbe quand rien n'a pu être chargé.
 * Un écran vide qui dit pourquoi vaut mieux qu'un écran plein de zéros faux.
 */
function ErreurAudience({
  message,
  horsLigne,
  onReessayer,
}: {
  message: string;
  horsLigne: boolean;
  onReessayer: () => void;
}) {
  const Icone = horsLigne ? WifiOff : AlertTriangle;

  return (
    <section
      role="alert"
      className={[
        'mb-10 rounded-2xl p-5 border',
        horsLigne ? 'bg-black/2.5 border-black/8' : 'bg-red-50 border-red-200',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <Icone
          className={`w-5 h-5 shrink-0 mt-0.5 ${horsLigne ? 'text-foreground/40' : 'text-red-500'}`}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="font-bold text-[15px] leading-tight">
            {horsLigne
              ? 'Connexion perdue'
              : "Les chiffres audience n'ont pas pu être chargés"}
          </p>
          <p className="text-[13px] text-foreground/60 leading-relaxed mt-1">
            {message} Aucun chiffre n&apos;est affiché tant que le chargement
            n&apos;a pas réussi, pour ne pas laisser croire à une audience
            nulle. Nouvel essai automatique dans 60 secondes.
          </p>
          <button
            type="button"
            onClick={onReessayer}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111] text-white text-[13px] font-medium hover:bg-[#222] transition-colors active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Réessayer
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * Bandeau discret : une partie de l'écran a bien des données, mais le dernier
 * rafraichissement a échoué. Sert aux chiffres périmés et au compteur de
 * messages qui manque.
 */
function BandeauAlerte({
  texte,
  horsLigne,
  onReessayer,
  className,
}: {
  texte: React.ReactNode;
  horsLigne: boolean;
  onReessayer: () => void;
  className: string;
}) {
  const Icone = horsLigne ? WifiOff : AlertTriangle;

  return (
    <div
      role="alert"
      className={[
        className,
        'rounded-xl px-4 py-3 border flex flex-wrap items-center gap-x-3 gap-y-2',
        horsLigne ? 'bg-black/2.5 border-black/8' : 'bg-red-50 border-red-200',
      ].join(' ')}
    >
      <Icone
        className={`w-4 h-4 shrink-0 ${horsLigne ? 'text-foreground/40' : 'text-red-500'}`}
        aria-hidden="true"
      />
      <p className="text-[13px] text-foreground/70 leading-relaxed min-w-0 flex-1">
        {texte}
      </p>
      <button
        type="button"
        onClick={onReessayer}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111] text-white text-[12px] font-medium hover:bg-[#222] transition-colors active:scale-[0.98]"
      >
        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
        Réessayer
      </button>
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
    <div className="rounded-2xl p-4 border border-[#8a8e95]/15 bg-linear-to-br from-[#8a8e95]/8 to-[#ff8c42]/4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] tracking-widest uppercase text-[#8a8e95] font-semibold">
          Taux de conversion
        </p>
        <TrendingUp className="w-4 h-4 text-[#8a8e95]/60" aria-hidden="true" />
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
            color="bg-linear-to-br from-[#8a8e95]/20 to-[#ff8c42]/10"
            textColor="text-[#8a8e95]"
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
  /** Le compteur n'a pas pu être chargé : on le dit au lieu de ne rien montrer. */
  badgeIndisponible?: boolean;
}

function QuickAccessSection({
  unreadMessages,
  erreurMessages,
  horsLigneMessages,
  onReessayerMessages,
}: {
  unreadMessages: number | null;
  erreurMessages: string | null;
  horsLigneMessages: boolean;
  onReessayerMessages: () => void;
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
      // Le compteur déjà chargé reste affiché quand un rafraîchissement échoue,
      // comme les chiffres de la vue d'ensemble juste au-dessus. Le faire
      // disparaître à chaque coupure le ferait clignoter en permanence, alors
      // que le bandeau d'erreur suffit à dire qu'il n'est plus tout frais.
      badge: unreadMessages,
      badgeIndisponible: Boolean(erreurMessages) && unreadMessages === null,
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
        {cards.map(({
          href,
          icon: Icon,
          title,
          description,
          badge,
          badgeIndisponible,
        }) => (
          <Link
            key={href}
            href={href}
            prefetch
            className="group relative bg-white border border-black/6 rounded-2xl p-5 hover:border-[#8a8e95]/40 hover:shadow-xs transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-linear-to-br from-[#8a8e95]/12 to-[#ff8c42]/8 flex items-center justify-center text-[#8a8e95]">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-2">
                {badgeIndisponible && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-black/5 text-foreground/45">
                    <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                    <span className="sr-only">Compteur indisponible</span>
                  </span>
                )}
                {!badgeIndisponible &&
                  badge !== null &&
                  badge !== undefined &&
                  badge > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#dc2626] text-white text-[10px] font-bold">
                      {badge}
                    </span>
                  )}
                <ArrowUpRight
                  className="w-4 h-4 text-foreground/30 group-hover:text-[#8a8e95] transition"
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

      {/* Deux phrases differentes, parce que ce sont deux situations
          differentes : soit la pastille montre un compteur deja charge et il
          faut dire qu'il date, soit il n'y en a jamais eu et il faut dire qu'il
          manque. Une seule phrase pour les deux contredisait la pastille. */}
      {erreurMessages && (
        <BandeauAlerte
          className="mt-3"
          texte={
            unreadMessages !== null ? (
              <>
                Compteur du dernier chargement réussi, la mise à jour vient
                d&apos;échouer. {erreurMessages}
              </>
            ) : (
              <>
                Le nombre de messages non lus n&apos;a pas pu être chargé.{' '}
                {erreurMessages}
              </>
            )
          }
          horsLigne={horsLigneMessages}
          onReessayer={onReessayerMessages}
        />
      )}
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

  // Sans valeur, on montre un tiret et jamais le zéro de l'animation : un zéro
  // affiché à la place d'une donnée absente ferait mentir le tableau de bord.
  if (isLoading || value === null)
    return <span className="text-foreground/20">-</span>;
  return (
    <>
      {display.toLocaleString('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </>
  );
}

