'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe,
  Database,
  Clock,
  CreditCard,
  LineChart,
  MapPin,
  Building2,
  Eye,
  Scroll,
  FileText,
  Pencil,
  Trash2,
  Plus,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAdminApi, useAdminApiPolling } from '../hooks/useAdminApi';

// ─── Types ────────────────────────────────────────────────────────────────

type HealthStatus = 'ok' | 'warn' | 'error';

interface SiteHealthCheck {
  online: boolean;
  status: HealthStatus;
  latencyMs: number | null;
  lastChecked: string;
  message: string;
}

interface SupabaseHealthCheck {
  online: boolean;
  status: HealthStatus;
  latencyMs: number | null;
  message: string;
}

interface CronHealthCheck {
  status: HealthStatus;
  message: string;
  lastEventAt: string | null;
  successCount: number;
  failureCount: number;
}

interface IpayHealthCheck {
  status: HealthStatus;
  message: string;
  avgDelayMs: number | null;
  verifiedCount: number;
  pendingOldCount: number;
}

interface SiteHealthData {
  site: SiteHealthCheck;
  supabase: SupabaseHealthCheck;
  cron: CronHealthCheck;
  ipaymoney: IpayHealthCheck;
  checkedAt: string;
}

interface AuditEntry {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  user_profiles?: { email: string; full_name: string };
}

interface AuditResponse {
  data: AuditEntry[];
  total: number;
}

// ─── Main view ────────────────────────────────────────────────────────────

export function SiteView() {
  return (
    <div className="max-w-[640px] lg:max-w-[920px] mx-auto px-5 pt-8 pb-10">
      <SiteHeader />
      <HealthSection />
      <ActivitySection />
      <ReferenceDataSection />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="mb-8">
      <p className="text-[10px] tracking-widest uppercase text-[#1a1a1a]/45 font-bold">
        Module
      </p>
      <h1 className="font-extrabold text-[32px] leading-tight tracking-tight mt-1">
        Site
      </h1>
      <p className="text-[15px] text-[#1a1a1a]/60 mt-3 leading-relaxed max-w-[560px]">
        La santé technique et les données référentielles qui alimentent NFI
        Report.
      </p>
    </header>
  );
}

// ─── Health section ───────────────────────────────────────────────────────

function HealthSection() {
  const { data, error, isLoading } = useAdminApiPolling<SiteHealthData>(
    'site-health',
    60000,
  );

  const lastCheckedRelative = data?.checkedAt ? relativeTime(data.checkedAt) : '';

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-[16px]">Santé du site</h2>
        <span className="text-[11px] text-[#1a1a1a]/45">
          {lastCheckedRelative
            ? `Dernière vérif ${lastCheckedRelative}`
            : 'rafraichi chaque minute'}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-[13px]">
          Impossible de récupérer les contrôles de santé. Nouvel essai dans 60
          secondes.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HealthCard
          icon={Globe}
          label="Site web"
          okLabel="En ligne"
          warnLabel="Réponse lente"
          errorLabel="Hors ligne"
          status={data?.site.status ?? null}
          message={data?.site.message ?? null}
          lastChecked={data?.site.lastChecked ?? null}
          isLoading={isLoading}
        />
        <HealthCard
          icon={Database}
          label="API Supabase"
          okLabel="Connecté"
          warnLabel="Latence élevée"
          errorLabel="Indisponible"
          status={data?.supabase.status ?? null}
          message={data?.supabase.message ?? null}
          lastChecked={data?.checkedAt ?? null}
          isLoading={isLoading}
        />
        <HealthCard
          icon={Clock}
          label="Cron jobs"
          okLabel="OK"
          warnLabel="À surveiller"
          errorLabel="En échec"
          status={data?.cron.status ?? null}
          message={data?.cron.message ?? null}
          lastChecked={data?.cron.lastEventAt ?? data?.checkedAt ?? null}
          isLoading={isLoading}
        />
        <HealthCard
          icon={CreditCard}
          label="Webhook iPayMoney"
          okLabel="Sain"
          warnLabel="À surveiller"
          errorLabel="Bloqué"
          status={data?.ipaymoney.status ?? null}
          message={data?.ipaymoney.message ?? null}
          lastChecked={data?.checkedAt ?? null}
          isLoading={isLoading}
        />
      </div>
    </section>
  );
}

function HealthCard({
  icon: Icon,
  label,
  okLabel,
  warnLabel,
  errorLabel,
  status,
  message,
  lastChecked,
  isLoading,
}: {
  icon: LucideIcon;
  label: string;
  okLabel: string;
  warnLabel: string;
  errorLabel: string;
  status: HealthStatus | null;
  message: string | null;
  lastChecked: string | null;
  isLoading: boolean;
}) {
  if (isLoading && status === null) {
    return (
      <div className="bg-white border border-black/[0.06] rounded-2xl p-4 animate-pulse min-h-[120px]">
        <div className="w-9 h-9 rounded-xl bg-black/[0.06] mb-3" />
        <div className="h-3 bg-black/[0.06] rounded w-2/3 mb-2" />
        <div className="h-2 bg-black/[0.04] rounded w-1/2" />
      </div>
    );
  }

  const visual = getStatusVisual(status);
  const statusLabel =
    status === 'ok'
      ? okLabel
      : status === 'warn'
        ? warnLabel
        : status === 'error'
          ? errorLabel
          : 'Inconnu';

  return (
    <div className="bg-white border border-black/[0.06] rounded-2xl p-4 flex flex-col gap-2 min-h-[120px]">
      <div className="flex items-center justify-between">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${visual.bg}`}
        >
          <Icon
            className={`w-[18px] h-[18px] ${visual.iconColor}`}
            aria-hidden="true"
          />
        </div>
        <visual.statusIcon
          className={`w-[18px] h-[18px] ${visual.statusColor}`}
          aria-hidden="true"
        />
      </div>
      <p className="text-[10px] tracking-widest uppercase text-[#1a1a1a]/45 font-semibold mt-1">
        {label}
      </p>
      <p className={`font-bold text-[14px] leading-tight ${visual.statusColor}`}>
        {statusLabel}
      </p>
      {message && (
        <p className="text-[11px] text-[#1a1a1a]/55 leading-snug line-clamp-2">
          {message}
        </p>
      )}
      {lastChecked && (
        <p className="text-[10px] text-[#1a1a1a]/35 mt-auto">
          Dernière vérif {relativeTime(lastChecked)}
        </p>
      )}
    </div>
  );
}

function getStatusVisual(status: HealthStatus | null): {
  bg: string;
  iconColor: string;
  statusIcon: LucideIcon;
  statusColor: string;
} {
  switch (status) {
    case 'ok':
      return {
        bg: 'bg-[#00c805]/12',
        iconColor: 'text-[#00a004]',
        statusIcon: CheckCircle2,
        statusColor: 'text-[#00a004]',
      };
    case 'warn':
      return {
        bg: 'bg-[#d4a843]/15',
        iconColor: 'text-[#d4a843]',
        statusIcon: AlertTriangle,
        statusColor: 'text-[#d4a843]',
      };
    case 'error':
      return {
        bg: 'bg-red-500/12',
        iconColor: 'text-red-600',
        statusIcon: XCircle,
        statusColor: 'text-red-600',
      };
    default:
      return {
        bg: 'bg-black/[0.06]',
        iconColor: 'text-[#1a1a1a]/50',
        statusIcon: AlertTriangle,
        statusColor: 'text-[#1a1a1a]/50',
      };
  }
}

// ─── Activity timeline ────────────────────────────────────────────────────

function ActivitySection() {
  const { data, error, isLoading } = useAdminApiPolling<AuditResponse>(
    'audit?page=1',
    60000,
  );

  const events = (data?.data ?? []).slice(0, 10);

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-[16px]">Activité système</h2>
        <Link
          href="/admin/site/journal"
          className="text-[12px] text-[#d4a843] font-semibold hover:underline"
        >
          Tout voir
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-[13px]">
          Journal d&apos;audit indisponible. Nouvel essai dans 60 secondes.
        </div>
      )}

      {!error && isLoading && events.length === 0 && <ActivitySkeleton />}

      {!error && !isLoading && events.length === 0 && (
        <div className="bg-white border border-black/[0.06] rounded-2xl p-6 text-center text-[13px] text-[#1a1a1a]/55">
          Aucune action admin enregistrée pour le moment. Les futures
          modifications apparaîtront ici.
        </div>
      )}

      {events.length > 0 && (
        <div className="space-y-2.5">
          {events.map((entry) => (
            <AuditRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const visual = getAuditVisual(entry.action);
  const adminLabel =
    entry.user_profiles?.full_name ||
    entry.user_profiles?.email ||
    `${entry.admin_id.slice(0, 8)}...`;
  const entityLabel = formatEntity(entry.entity_type);

  return (
    <div className="flex items-center gap-3 bg-white border border-black/[0.06] rounded-2xl p-3.5">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${visual.bg}`}
      >
        <visual.icon
          className={`w-[18px] h-[18px] ${visual.iconColor}`}
          aria-hidden="true"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold leading-tight text-[#1a1a1a] truncate">
          {adminLabel}
          <span className="text-[#1a1a1a]/45 font-normal">
            {' '}
            {visual.verb} {entityLabel}
          </span>
        </p>
        <p className="text-[11px] text-[#1a1a1a]/45 mt-0.5">
          {relativeTime(entry.created_at)}
          {entry.entity_id ? (
            <>
              {' · '}
              <span className="font-mono text-[10px] text-[#1a1a1a]/40">
                {entry.entity_id.slice(0, 8)}
              </span>
            </>
          ) : null}
        </p>
      </div>
    </div>
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

function getAuditVisual(action: string): {
  icon: LucideIcon;
  bg: string;
  iconColor: string;
  verb: string;
} {
  const normalized = action.toLowerCase();
  if (normalized.includes('delete') || normalized.includes('remove')) {
    return {
      icon: Trash2,
      bg: 'bg-red-500/10',
      iconColor: 'text-red-600',
      verb: 'a supprimé',
    };
  }
  if (normalized.includes('create') || normalized.includes('add')) {
    return {
      icon: Plus,
      bg: 'bg-[#00c805]/12',
      iconColor: 'text-[#00a004]',
      verb: 'a créé',
    };
  }
  if (
    normalized.includes('update') ||
    normalized.includes('edit') ||
    normalized.includes('modify')
  ) {
    return {
      icon: Pencil,
      bg: 'bg-[#d4a843]/15',
      iconColor: 'text-[#d4a843]',
      verb: 'a modifié',
    };
  }
  if (normalized.includes('publish')) {
    return {
      icon: FileText,
      bg: 'bg-[#1a1a1a]',
      iconColor: 'text-[#d4a843]',
      verb: 'a publié',
    };
  }
  return {
    icon: Settings,
    bg: 'bg-black/[0.06]',
    iconColor: 'text-[#1a1a1a]/70',
    verb: 'a agi sur',
  };
}

function formatEntity(entity: string): string {
  switch (entity) {
    case 'article':
      return 'un article';
    case 'comment':
      return 'un commentaire';
    case 'user':
      return 'un utilisateur';
    case 'payment':
    case 'payment_request':
      return 'un paiement';
    case 'newsletter':
      return 'une newsletter';
    case 'pricing':
      return 'un tarif';
    case 'market_data':
      return 'une donnée marché';
    case 'enterprise':
      return 'une fiche entreprise';
    case 'niger_presentation':
      return 'la présentation Niger';
    case 'site_features':
      return 'la visibilité du site';
    case 'education':
      return 'un contenu éducation';
    case 'legal':
    case 'legal_section':
      return 'une page légale';
    case 'flash_banner':
      return 'le flash info';
    case 'cron':
      return 'un cron job';
    default:
      return entity.replace(/_/g, ' ');
  }
}

// ─── Reference data section ───────────────────────────────────────────────

interface ReferenceCard {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

function ReferenceDataSection() {
  const cards: ReferenceCard[] = [
    {
      href: '/admin/site/marches',
      icon: LineChart,
      title: 'Marchés BRVM',
      description:
        'Indices, devises et matières premières affichés sur la home.',
    },
    {
      href: '/admin/site/niger',
      icon: MapPin,
      title: 'Niger en chiffres',
      description: 'Carte, faits clés et régions de la page présentation.',
    },
    {
      href: '/admin/site/entreprises',
      icon: Building2,
      title: 'Entreprises stratégiques',
      description: 'Fiches détaillées des champions économiques nigériens.',
    },
    {
      href: '/admin/site/visibilite',
      icon: Eye,
      title: 'Visibilité du site',
      description: 'Activer ou couper le bandeau Marchés et autres modules.',
    },
    {
      href: '/admin/site/journal',
      icon: Scroll,
      title: "Journal d'audit",
      description: 'Toutes les actions admin tracées, paginées et filtrables.',
    },
  ];

  return (
    <section className="mb-6">
      <h2 className="font-bold text-[16px] mb-3">Données référentielles</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            prefetch
            className="group relative bg-white border border-black/[0.06] rounded-2xl p-5 hover:border-[#d4a843]/40 hover:shadow-sm transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#d4a843]/12 to-[#ff8c42]/8 flex items-center justify-center text-[#d4a843]">
                <card.icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <ArrowUpRight
                className="w-4 h-4 text-[#1a1a1a]/30 group-hover:text-[#d4a843] transition"
                aria-hidden="true"
              />
            </div>
            <p className="font-bold text-[16px] text-[#1a1a1a] leading-tight">
              {card.title}
            </p>
            <p className="text-[13px] text-[#1a1a1a]/55 leading-relaxed mt-1">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
      <MarketTickerInlineToggle />
    </section>
  );
}

// ─── Market ticker quick toggle ───────────────────────────────────────────

interface SiteFeaturesPayload {
  market_ticker_enabled: boolean;
  updated_at: string | null;
}

function MarketTickerInlineToggle() {
  const { data, mutate, isLoading } = useAdminApi<SiteFeaturesPayload>(
    'site-features',
  );

  const enabled = data?.market_ticker_enabled ?? true;

  const handleToggle = async () => {
    if (!data) return;
    const next = !enabled;
    // Mise à jour optimiste
    await mutate(
      { market_ticker_enabled: next, updated_at: new Date().toISOString() },
      { revalidate: false },
    );
    try {
      const res = await fetch('/api/admin/site-features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market_ticker_enabled: next }),
      });
      if (!res.ok) throw new Error('toggle failed');
      const updated = (await res.json()) as SiteFeaturesPayload;
      await mutate(updated, { revalidate: false });
    } catch {
      // Revert si échec
      await mutate();
    }
  };

  return (
    <div className="mt-4 bg-white border border-black/[0.06] rounded-2xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4a843]/12 to-[#ff8c42]/8 flex items-center justify-center text-[#d4a843] flex-shrink-0">
        <LineChart className="w-5 h-5" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[14px] text-[#1a1a1a] leading-tight">
          Bandeau Marchés BRVM
        </p>
        <p className="text-[11px] text-[#1a1a1a]/55 mt-0.5">
          {isLoading
            ? 'Chargement de l\'état...'
            : enabled
              ? 'Visible en haut de toutes les pages.'
              : 'Désactivé, le site ne l\'affiche pas.'}
        </p>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading || !data}
        aria-pressed={enabled}
        aria-label={
          enabled
            ? 'Désactiver le bandeau Marchés BRVM'
            : 'Activer le bandeau Marchés BRVM'
        }
        className={[
          'relative inline-flex h-7 w-12 items-center rounded-full transition flex-shrink-0',
          enabled ? 'bg-[#00c805]' : 'bg-black/[0.12]',
          isLoading || !data ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <span
          className={[
            'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
            enabled ? 'translate-x-6' : 'translate-x-1',
          ].join(' ')}
        />
      </button>
    </div>
  );
}

// ─── Time helpers ─────────────────────────────────────────────────────────

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Math.max(0, Date.now() - date.getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'à l\'instant';
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
