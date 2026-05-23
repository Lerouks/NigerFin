'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Search,
  Download,
  UserMinus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { useAdminApi } from '../../hooks/useAdminApi';
import { useToast } from '@/components/Toast';
import type {
  SubscriberRow,
  SubscriberStats,
  SubscriberStatus,
} from '@/lib/newsletter/subscribers';

interface SubscribersApiResponse {
  rows: SubscriberRow[];
  total: number;
  page: number;
  limit: number;
  stats: SubscriberStats | null;
}

const STATUS_LABELS: Record<SubscriberStatus, string> = {
  active: 'Actifs',
  unsubscribed: 'Désabonnés',
  bounced: 'Bounce',
  complained: 'Spam',
};

const STATUS_BADGE: Record<SubscriberStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  unsubscribed: 'bg-zinc-50 text-zinc-600 border-zinc-200',
  bounced: 'bg-amber-50 text-amber-700 border-amber-200',
  complained: 'bg-red-50 text-red-700 border-red-200',
};

const SOURCE_LABELS: Record<string, string> = {
  form: 'Formulaire',
  popup: 'Popup',
  signup: 'Inscription',
  backfill_user_profiles: 'Migration profil',
  admin: 'Manuel admin',
  magic_link: 'Magic link',
  inconnu: 'Inconnu',
};

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

export function NewsletterSubscribersView() {
  const { show } = useToast();
  const [status, setStatus] = useState<SubscriberStatus | 'all'>('active');
  const [source, setSource] = useState<string>('all');
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [page, setPage] = useState(1);

  // Debounce de la recherche : évite de fire une fetch SWR à chaque keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setQDebounced(q.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [q]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('status', status);
    if (source !== 'all') params.set('source', source);
    if (qDebounced) params.set('q', qDebounced);
    params.set('page', String(page));
    params.set('limit', String(PAGE_SIZE));
    params.set('stats', '1');
    return params.toString();
  }, [status, source, qDebounced, page]);

  const { data, error, isLoading, mutate } = useAdminApi<SubscribersApiResponse>(
    `/api/admin/newsletter/subscribers?${queryString}`,
  );

  const stats = data?.stats ?? null;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const [unsubscribingId, setUnsubscribingId] = useState<string | null>(null);

  const handleUnsubscribe = async (row: SubscriberRow) => {
    if (unsubscribingId) return;
    if (
      !confirm(
        `Désabonner ${row.email} de la newsletter ? Cette action est réversible (la personne peut se réinscrire).`,
      )
    )
      return;
    setUnsubscribingId(row.id);
    try {
      const res = await fetch(`/api/admin/newsletter/subscribers/${row.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      show(`${row.email} désabonné.`, 'success');
      mutate();
    } catch {
      show('Erreur lors du désabonnement.', 'error');
    } finally {
      setUnsubscribingId(null);
    }
  };

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set('status', status);
    if (source !== 'all') params.set('source', source);
    return `/api/admin/newsletter/subscribers/export?${params.toString()}`;
  }, [status, source]);

  const availableSources = useMemo(() => {
    if (!stats) return [] as string[];
    return stats.bySource.map((s) => s.source);
  }, [stats]);

  return (
    <div className="space-y-8">
      <Header />

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-[13px] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Impossible de charger les abonnés. Recharge la page ou vérifie ta connexion.
        </div>
      )}

      <StatsSection stats={stats} isLoading={isLoading && !stats} />

      <Filters
        status={status}
        source={source}
        q={q}
        availableSources={availableSources}
        onStatusChange={(s) => {
          setStatus(s);
          setPage(1);
        }}
        onSourceChange={(s) => {
          setSource(s);
          setPage(1);
        }}
        onSearchChange={(value) => setQ(value)}
        exportHref={exportHref}
      />

      <SubscribersTable
        rows={data?.rows ?? []}
        isLoading={isLoading}
        unsubscribingId={unsubscribingId}
        onUnsubscribe={handleUnsubscribe}
      />

      {data && data.total > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalRows={data.total}
          onPage={setPage}
        />
      )}
    </div>
  );
}

function Header() {
  return (
    <header className="space-y-3">
      <Link
        href="/admin/audience"
        className="inline-flex items-center gap-1.5 text-[12px] text-[#1a1a1a]/55 hover:text-[#1a1a1a] transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Audience
      </Link>
      <div>
        <p className="text-[10px] tracking-widest uppercase text-[#1a1a1a]/45 font-bold">
          Audience
        </p>
        <h1 className="font-extrabold text-[28px] sm:text-[32px] leading-tight tracking-tight mt-1">
          Abonnés newsletter
        </h1>
        <p className="text-[14px] text-[#1a1a1a]/60 mt-3 leading-relaxed max-w-[560px]">
          Liste complète des abonnés, sources d&apos;acquisition, désabonnements et export CSV.
        </p>
      </div>
    </header>
  );
}

function StatsSection({
  stats,
  isLoading,
}: {
  stats: SubscriberStats | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-black/[0.025] rounded-2xl p-4 h-[88px] animate-pulse"
          />
        ))}
      </section>
    );
  }
  if (!stats) return null;

  const churnRate =
    stats.totalActive + stats.totalUnsubscribed > 0
      ? Math.round(
          (stats.unsubscribedThisMonth /
            (stats.totalActive + stats.totalUnsubscribed)) *
            1000,
        ) / 10
      : 0;

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Actifs"
          value={stats.totalActive}
          color="text-[#00a004]"
        />
        <StatCard
          label="Nouveaux ce mois"
          value={stats.newThisMonth}
          color="text-[#d4a843]"
        />
        <StatCard
          label="Désabonnés ce mois"
          value={stats.unsubscribedThisMonth}
          color="text-[#1a1a1a]/80"
        />
        <StatCard
          label="Taux churn"
          value={churnRate}
          suffix="%"
          color="text-[#1a1a1a]/80"
          decimals={1}
        />
      </div>

      {stats.bySource.length > 0 && (
        <div className="bg-white border border-black/[0.06] rounded-2xl p-4">
          <p className="text-[10px] tracking-widest uppercase text-[#1a1a1a]/45 font-semibold mb-3">
            Sources d&apos;acquisition (abonnés actifs)
          </p>
          <div className="space-y-2">
            {stats.bySource.map(({ source, count }) => {
              const pct = stats.totalActive > 0 ? (count / stats.totalActive) * 100 : 0;
              return (
                <div key={source} className="space-y-1">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-[#1a1a1a]/75">
                      {SOURCE_LABELS[source] ?? source}
                    </span>
                    <span className="tabular-nums font-semibold">
                      {count}{' '}
                      <span className="text-[#1a1a1a]/40 font-normal">
                        ({pct.toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-black/[0.05] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#d4a843] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  suffix,
  color = 'text-[#1a1a1a]',
  decimals = 0,
}: {
  label: string;
  value: number;
  suffix?: string;
  color?: string;
  decimals?: number;
}) {
  return (
    <div className="bg-black/[0.025] rounded-2xl p-4">
      <p className="text-[10px] tracking-widest uppercase text-[#1a1a1a]/45 font-semibold">
        {label}
      </p>
      <p className={`font-extrabold text-[28px] leading-tight mt-2 tabular-nums ${color}`}>
        {value.toLocaleString('fr-FR', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
        {suffix && (
          <span className="text-[18px] text-[#1a1a1a]/40 font-medium ml-0.5">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}

function Filters({
  status,
  source,
  q,
  availableSources,
  onStatusChange,
  onSourceChange,
  onSearchChange,
  exportHref,
}: {
  status: SubscriberStatus | 'all';
  source: string;
  q: string;
  availableSources: string[];
  onStatusChange: (s: SubscriberStatus | 'all') => void;
  onSourceChange: (s: string) => void;
  onSearchChange: (v: string) => void;
  exportHref: string;
}) {
  const statusOptions: (SubscriberStatus | 'all')[] = [
    'active',
    'unsubscribed',
    'bounced',
    'complained',
    'all',
  ];

  return (
    <section className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <label htmlFor="newsletter-search" className="sr-only">
            Rechercher un abonné par email
          </label>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1a]/35"
            aria-hidden="true"
          />
          <input
            id="newsletter-search"
            type="search"
            value={q}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par email..."
            aria-label="Rechercher un abonné par email"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-black/[0.08] focus:border-[#d4a843]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843]/30 text-[14px] placeholder:text-[#1a1a1a]/30"
          />
        </div>
        <a
          href={exportHref}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a1a1a] text-white text-[13px] font-semibold hover:bg-[#1a1a1a]/90 active:scale-[0.98] transition"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </a>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[10px] tracking-widest uppercase text-[#1a1a1a]/45 font-semibold mr-1">
          Status
        </span>
        {statusOptions.map((s) => (
          <FilterChip
            key={s}
            active={status === s}
            onClick={() => onStatusChange(s)}
          >
            {s === 'all' ? 'Tous' : STATUS_LABELS[s as SubscriberStatus]}
          </FilterChip>
        ))}
      </div>

      {availableSources.length > 1 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] tracking-widest uppercase text-[#1a1a1a]/45 font-semibold mr-1">
            Source
          </span>
          <FilterChip active={source === 'all'} onClick={() => onSourceChange('all')}>
            Toutes
          </FilterChip>
          {availableSources.map((s) => (
            <FilterChip
              key={s}
              active={source === s}
              onClick={() => onSourceChange(s)}
            >
              {SOURCE_LABELS[s] ?? s}
            </FilterChip>
          ))}
        </div>
      )}
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={[
        'px-3 py-1.5 rounded-full text-[12px] font-semibold transition border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843]/30',
        active
          ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
          : 'bg-white text-[#1a1a1a]/70 border-black/[0.08] hover:border-black/20',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function SubscribersTable({
  rows,
  isLoading,
  unsubscribingId,
  onUnsubscribe,
}: {
  rows: SubscriberRow[];
  isLoading: boolean;
  unsubscribingId: string | null;
  onUnsubscribe: (row: SubscriberRow) => void;
}) {
  if (isLoading && rows.length === 0) {
    return (
      <div className="bg-white border border-black/[0.06] rounded-2xl p-8 flex items-center justify-center text-[#1a1a1a]/45 text-[13px]">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Chargement des abonnés...
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="bg-white border border-black/[0.06] rounded-2xl p-10 text-center">
        <Mail className="w-8 h-8 text-[#1a1a1a]/20 mx-auto mb-3" />
        <p className="text-[14px] text-[#1a1a1a]/55">
          Aucun abonné ne correspond à ces filtres.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden lg:block bg-white border border-black/[0.06] rounded-2xl overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-black/[0.02]">
            <tr className="text-left text-[10px] tracking-widest uppercase text-[#1a1a1a]/45 font-semibold">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Inscrit</th>
              <th className="px-4 py-3">Compte</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-black/[0.02] transition">
                <td className="px-4 py-3 font-medium">{row.email}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-[#1a1a1a]/75">
                  {SOURCE_LABELS[row.source ?? 'inconnu'] ?? row.source ?? '—'}
                </td>
                <td className="px-4 py-3 text-[#1a1a1a]/65 tabular-nums">
                  {formatDate(row.opt_in_at)}
                </td>
                <td className="px-4 py-3">
                  {row.user_id ? (
                    <Link
                      href={`/admin/audience/utilisateurs?user=${row.user_id}`}
                      className="text-[#d4a843] hover:underline text-[12px] font-semibold"
                    >
                      Voir profil
                    </Link>
                  ) : (
                    <span className="text-[#1a1a1a]/35 text-[12px]">Aucun</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {row.status === 'active' && (
                    <button
                      onClick={() => onUnsubscribe(row)}
                      disabled={unsubscribingId === row.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {unsubscribingId === row.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserMinus className="w-3.5 h-3.5" />
                      )}
                      Désabonner
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden space-y-2">
        {rows.map((row) => (
          <div
            key={row.id}
            className="bg-white border border-black/[0.06] rounded-2xl p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="font-semibold text-[14px] break-all">{row.email}</p>
              <StatusBadge status={row.status} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[12px] text-[#1a1a1a]/65">
              <p>
                <span className="text-[#1a1a1a]/40">Source :</span>{' '}
                {SOURCE_LABELS[row.source ?? 'inconnu'] ?? row.source ?? '—'}
              </p>
              <p>
                <span className="text-[#1a1a1a]/40">Inscrit :</span>{' '}
                {formatDate(row.opt_in_at)}
              </p>
            </div>
            {row.user_id && (
              <Link
                href={`/admin/audience/utilisateurs?user=${row.user_id}`}
                className="inline-block mt-2 text-[#d4a843] hover:underline text-[12px] font-semibold"
              >
                Voir le profil utilisateur
              </Link>
            )}
            {row.status === 'active' && (
              <button
                onClick={() => onUnsubscribe(row)}
                disabled={unsubscribingId === row.id}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {unsubscribingId === row.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserMinus className="w-3.5 h-3.5" />
                )}
                Désabonner
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: SubscriberStatus }) {
  const icon =
    status === 'active' ? (
      <CheckCircle2 className="w-3 h-3" />
    ) : status === 'complained' || status === 'bounced' ? (
      <XCircle className="w-3 h-3" />
    ) : null;
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold',
        STATUS_BADGE[status],
      ].join(' ')}
    >
      {icon}
      {STATUS_LABELS[status]}
    </span>
  );
}

function Pagination({
  page,
  totalPages,
  totalRows,
  onPage,
}: {
  page: number;
  totalPages: number;
  totalRows: number;
  onPage: (p: number) => void;
}) {
  return (
    <nav
      aria-label="Pagination des abonnés"
      className="flex items-center justify-between gap-3 pt-2"
    >
      <p className="text-[12px] text-[#1a1a1a]/55 tabular-nums">
        Page {page} / {totalPages}{' '}
        <span className="text-[#1a1a1a]/30">
          ({totalRows.toLocaleString('fr-FR')} au total)
        </span>
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-black/[0.08] text-[#1a1a1a]/70 hover:border-black/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Page précédente"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-black/[0.08] text-[#1a1a1a]/70 hover:border-black/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Page suivante"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
