'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, BarChart3, Shield, Loader2, Search, CreditCard, CheckCircle, XCircle,
  Clock, Download, TrendingUp, TrendingDown, DollarSign, Activity, Ban,
  Unlock, Settings, FileText, AlertTriangle, ChevronDown, ChevronUp, Newspaper, LineChart, Zap, BookOpen, SlidersHorizontal, Mail, Crown, Calendar,
  Eye, UserPlus, UserMinus, Repeat, Target, FileBarChart,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { formatPrice, PREMIUM_TIER, CURRENCY, BILLING_OPTIONS, getBillingCycleLabel } from '@/config/pricing';
import { ArticlesManager } from './ArticlesManager';
import { CategoriesManager } from './CategoriesManager';
import { MarketDataManager } from './MarketDataManager';
import { FlashBannerManager } from './FlashBannerManager';
import { EducationManager } from './EducationManager';
import { PaywallManager } from './PaywallManager';
import { NigerPresentationManager } from './NigerPresentationManager';
import { LegalSectionsManager } from './LegalSectionsManager';
import { StatsManager } from './StatsManager';
import { MessagesManager } from './MessagesManager';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserStats {
  total: number;
  readers: number;
  premium: number;
  activeSubscriptions: number;
  blockedUsers: number;
  pendingPayments: number;
}

interface UserEntry {
  id: string;
  email: string;
  full_name: string;
  role: string;
  subscription_status: string;
  billing_cycle: string | null;
  blocked: boolean;
  created_at: string;
  subscription_start: string | null;
  subscription_end: string | null;
}

interface PaymentRequest {
  id: string;
  user_id: string;
  tier: string;
  billing_cycle: string;
  amount: number;
  payment_method: string;
  transaction_number: string;
  status: string;
  rejection_reason?: string;
  created_at: string;
  verified_at?: string;
  user_profiles?: { email: string; full_name: string };
}

interface RevenueData {
  totalRevenue: number;
  thisMonth: number;
  lastMonth: number;
  growthPercent: number;
  byTier: Record<string, number>;
  byMethod: Record<string, number>;
  monthly: { month: string; revenue: number }[];
  totalPayments: number;
  pendingCount: number;
}

interface AuditEntry {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  user_profiles?: { email: string; full_name: string };
}

interface DynamicPrice {
  id: string;
  tier: string;
  billing_cycle: string;
  amount: number;
  updated_at: string;
}

interface OverviewData {
  mrr: number;
  arr: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowthPercent: number;
  totalRevenue: number;
  monthlyRevenue: { month: string; revenue: number }[];
  premiumActive: number;
  newPremiumThisMonth: number;
  expiredThisMonth: number;
  churnRate: number;
  ltv: number;
  totalUsers: number;
  newUsersThisMonth: number;
  newUsersGrowthPercent: number;
  conversionRate: number;
  totalArticles: number;
  articlesThisMonth: number;
  topArticle: { id: string; title: string; views: number } | null;
  viewsThisMonth: number;
  viewsLastMonth: number;
  viewsGrowthPercent: number;
  monthlyRevenue_chart: { month: string; revenue: number }[];
  monthlyUsers_chart: { month: string; users: number }[];
}

type TabId = 'overview' | 'articles' | 'categories' | 'market' | 'flash' | 'education' | 'niger' | 'legal' | 'paywall' | 'users' | 'payments' | 'pricing' | 'stats' | 'audit' | 'messages';

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const { isSignedIn, isLoading, userRole } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Data states
  const [stats, setStats] = useState<UserStats>({ total: 0, readers: 0, premium: 0, activeSubscriptions: 0, blockedUsers: 0, pendingPayments: 0 });
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [dynamicPrices, setDynamicPrices] = useState<DynamicPrice[]>([]);
  const [overview, setOverview] = useState<OverviewData | null>(null);

  // UI states
  const [loadingData, setLoadingData] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('pending');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [savingPrice, setSavingPrice] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!isLoading && (!isSignedIn || userRole !== 'admin')) {
      router.push('/');
    }
  }, [isLoading, isSignedIn, userRole, router]);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, revenueRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/revenue'),
      ]);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (revenueRes.ok) {
        const revenueData = await revenueRes.json();
        setRevenue(revenueData);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (roleFilter) params.set('role', roleFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch { /* ignore */ }
    setLoadingData(false);
  }, [searchQuery, roleFilter]);

  const fetchPayments = useCallback(async (status: string) => {
    setLoadingPayments(true);
    setPaymentFilter(status);
    try {
      const res = await fetch(`/api/payment/list?status=${status}`);
      const data = await res.json();
      if (Array.isArray(data)) setPayments(data);
    } catch { /* ignore */ }
    setLoadingPayments(false);
  }, []);

  const fetchAuditLog = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/audit');
      const data = await res.json();
      setAuditLog(data.data || []);
    } catch { /* ignore */ }
  }, []);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pricing');
      const data = await res.json();
      if (Array.isArray(data)) setDynamicPrices(data);
    } catch { /* ignore */ }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/messages?count_only=true');
      if (res.ok) {
        const data = await res.json();
        setUnreadMessages(data.unread || 0);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/overview');
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchStats();
      fetchUsers();
      fetchPayments('pending');
      fetchUnreadCount();
      fetchOverview();
    }
  }, [userRole, fetchStats, fetchUsers, fetchPayments, fetchUnreadCount, fetchOverview]);

  // Fetch tab-specific data when tab changes
  useEffect(() => {
    if (userRole !== 'admin') return;
    if (activeTab === 'audit') fetchAuditLog();
    if (activeTab === 'pricing') fetchPrices();
  }, [activeTab, userRole, fetchAuditLog, fetchPrices]);

  // Refetch users when search/filter changes
  useEffect(() => {
    if (userRole === 'admin') {
      setLoadingData(true);
      const timeout = setTimeout(fetchUsers, 300);
      return () => clearTimeout(timeout);
    }
  }, [searchQuery, roleFilter, userRole, fetchUsers]);

  // ─── Actions ─────────────────────────────────────────────────────────────

  const handlePaymentAction = async (paymentId: string, action: 'verify' | 'reject') => {
    setProcessingPayment(paymentId);
    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentRequestId: paymentId,
          action,
          rejectionReason: action === 'reject' ? 'Paiement non confirmé' : undefined,
        }),
      });
      if (res.ok) {
        setPayments((prev) => prev.filter((p) => p.id !== paymentId));
        fetchStats();
      }
    } catch { /* ignore */ }
    setProcessingPayment(null);
  };

  const handleUserAction = async (userId: string, action: string, extra?: Record<string, string>) => {
    setProcessingUser(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, ...extra }),
      });
      if (res.ok) {
        await fetchUsers();
        fetchStats();
      }
    } catch { /* ignore */ }
    setProcessingUser(null);
  };

  const handlePriceUpdate = async (tier: string, billingCycle: string, amount: number) => {
    const key = `${tier}_${billingCycle}`;
    setSavingPrice(key);
    try {
      await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, billingCycle, amount }),
      });
      await fetchPrices();
    } catch { /* ignore */ }
    setSavingPrice(null);
  };

  const handleExport = (type: string) => {
    window.open(`/api/admin/export?type=${type}`, '_blank');
  };

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (isLoading || userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const conversionRate = stats.total > 0
    ? ((stats.premium / stats.total) * 100).toFixed(1)
    : '0';

  // ─── Tabs config ────────────────────────────────────────────────────────

  const tabs: { id: TabId; label: string; icon: typeof BarChart3; badge?: number }[] = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'articles', label: 'Articles', icon: Newspaper },
    { id: 'categories', label: 'Catégories', icon: FileText },
    { id: 'market', label: 'Marchés', icon: LineChart },
    { id: 'flash', label: 'Flash Info', icon: Zap },
    { id: 'education', label: 'Éducation', icon: BookOpen },
    { id: 'niger', label: 'Niger', icon: Activity },
    { id: 'legal', label: 'Pages', icon: FileText },
    { id: 'paywall', label: 'Paywall', icon: SlidersHorizontal },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'messages', label: 'Messages', icon: Mail, badge: unreadMessages },
    { id: 'payments', label: 'Paiements', icon: CreditCard, badge: stats.pendingPayments },
    { id: 'pricing', label: 'Tarifs', icon: DollarSign },
    { id: 'stats', label: 'Statistiques', icon: BarChart3 },
    { id: 'audit', label: 'Journal', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header */}
      <section className="bg-[#111] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-red-400" />
              <div>
                <h1 className="text-2xl font-bold">CEO Cockpit</h1>
                <p className="text-white/40 text-[13px]">NFI Report - Tableau de bord</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('users')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export Utilisateurs
              </button>
              <button
                onClick={() => handleExport('payments')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export Paiements
              </button>
              <button
                onClick={() => handleExport('articles')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export Articles
              </button>
              <button
                onClick={() => handleExport('messages')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export Messages
              </button>
              <button
                onClick={() => handleExport('stats')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export Stats
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-[#111] text-white' : 'bg-white border border-black/[0.06] text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge ? (
                <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-bold">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW TAB ──────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">

            {/* ── Hero KPIs: MRR, Abonnés actifs, Churn ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-black/[0.06] p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12px] text-gray-400 uppercase tracking-wider">MRR</p>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-emerald-600">{overview ? formatPrice(overview.mrr) : '—'}</p>
                <p className="text-[11px] text-gray-400 mt-1">Monthly Recurring Revenue</p>
              </div>
              <div className="bg-white rounded-xl border border-black/[0.06] p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12px] text-gray-400 uppercase tracking-wider">Abonnés actifs</p>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-blue-600">{overview ? overview.premiumActive : '—'}</p>
                {overview && overview.newPremiumThisMonth > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[11px] text-emerald-600 font-medium">+{overview.newPremiumThisMonth} ce mois</span>
                  </div>
                )}
              </div>
              <div className="bg-white rounded-xl border border-black/[0.06] p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12px] text-gray-400 uppercase tracking-wider">Churn Rate</p>
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <UserMinus className="w-4 h-4 text-red-600" />
                  </div>
                </div>
                <p className={`text-4xl font-bold ${overview && overview.churnRate > 5 ? 'text-red-600' : overview && overview.churnRate > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {overview ? `${overview.churnRate}%` : '—'}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {overview ? `${overview.expiredThisMonth} résiliation(s) ce mois` : ''}
                </p>
              </div>
            </div>

            {/* ── Revenue KPIs ── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Revenus
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard
                  label="ARR"
                  value={overview ? formatPrice(overview.arr) : '—'}
                  sub="Annual Recurring Revenue"
                  icon={BarChart3}
                  color="text-emerald-600"
                  bg="bg-emerald-50"
                />
                <KpiCard
                  label="Revenus ce mois"
                  value={overview ? formatPrice(overview.thisMonthRevenue) : '—'}
                  variation={overview?.revenueGrowthPercent}
                  icon={TrendingUp}
                  color="text-blue-600"
                  bg="bg-blue-50"
                />
                <KpiCard
                  label="Revenus cumulés"
                  value={overview ? formatPrice(overview.totalRevenue) : '—'}
                  sub="Depuis le lancement"
                  icon={DollarSign}
                  color="text-gray-700"
                  bg="bg-gray-100"
                />
                <KpiCard
                  label="LTV"
                  value={overview ? (overview.ltv > 0 ? formatPrice(overview.ltv) : 'Données insuffisantes') : '—'}
                  sub="Lifetime Value moyen"
                  icon={Target}
                  color="text-purple-600"
                  bg="bg-purple-50"
                />
              </div>
            </div>

            {/* ── Subscribers KPIs ── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Abonnés
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard
                  label="Nouveaux abonnés"
                  value={overview ? overview.newPremiumThisMonth.toString() : '—'}
                  sub="Ce mois"
                  icon={UserPlus}
                  color="text-emerald-600"
                  bg="bg-emerald-50"
                />
                <KpiCard
                  label="Abonnements expirés"
                  value={overview ? overview.expiredThisMonth.toString() : '—'}
                  sub="Ce mois"
                  icon={UserMinus}
                  color="text-red-600"
                  bg="bg-red-50"
                />
                <KpiCard
                  label="Taux de conversion"
                  value={overview ? `${overview.conversionRate}%` : '—'}
                  sub="Inscription → Premium"
                  icon={Repeat}
                  color="text-amber-600"
                  bg="bg-amber-50"
                />
                <KpiCard
                  label="Paiements en attente"
                  value={stats.pendingPayments.toString()}
                  icon={Clock}
                  color="text-amber-600"
                  bg="bg-amber-50"
                />
              </div>
            </div>

            {/* ── Acquisition KPIs ── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Acquisition
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <KpiCard
                  label="Total inscrits"
                  value={overview ? overview.totalUsers.toString() : '—'}
                  sub="Gratuits + Premium"
                  icon={Users}
                  color="text-blue-600"
                  bg="bg-blue-50"
                />
                <KpiCard
                  label="Nouveaux inscrits"
                  value={overview ? overview.newUsersThisMonth.toString() : '—'}
                  sub="Ce mois"
                  variation={overview?.newUsersGrowthPercent}
                  icon={UserPlus}
                  color="text-emerald-600"
                  bg="bg-emerald-50"
                />
                <KpiCard
                  label="Utilisateurs bloqués"
                  value={stats.blockedUsers.toString()}
                  icon={Ban}
                  color="text-red-600"
                  bg="bg-red-50"
                />
              </div>
            </div>

            {/* ── Charts: MRR + Inscrits (6 mois) ── */}
            {overview && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* MRR Chart */}
                <div className="bg-white rounded-xl border border-black/[0.06] p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4 text-gray-400" />
                    Revenus mensuels (6 derniers mois)
                  </h3>
                  <div className="flex items-end gap-3 h-40">
                    {overview.monthlyRevenue_chart.map((m) => {
                      const max = Math.max(...overview.monthlyRevenue_chart.map((x) => x.revenue), 1);
                      const height = (m.revenue / max) * 100;
                      return (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[9px] text-gray-400 font-medium">
                            {m.revenue > 0 ? formatPrice(m.revenue) : ''}
                          </span>
                          <div
                            className="w-full bg-emerald-500 rounded-t transition-all min-h-[2px]"
                            style={{ height: `${Math.max(height, 2)}%` }}
                          />
                          <span className="text-[10px] text-gray-500 font-medium">{m.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Users Chart */}
                <div className="bg-white rounded-xl border border-black/[0.06] p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    Nouveaux inscrits (6 derniers mois)
                  </h3>
                  <div className="flex items-end gap-3 h-40">
                    {overview.monthlyUsers_chart.map((m) => {
                      const max = Math.max(...overview.monthlyUsers_chart.map((x) => x.users), 1);
                      const height = (m.users / max) * 100;
                      return (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[9px] text-gray-400 font-medium">
                            {m.users > 0 ? m.users : ''}
                          </span>
                          <div
                            className="w-full bg-blue-500 rounded-t transition-all min-h-[2px]"
                            style={{ height: `${Math.max(height, 2)}%` }}
                          />
                          <span className="text-[10px] text-gray-500 font-medium">{m.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Content & Engagement KPIs ── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileBarChart className="w-4 h-4" /> Contenu & Engagement
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard
                  label="Total articles"
                  value={overview ? overview.totalArticles.toString() : '—'}
                  sub="Publiés"
                  icon={Newspaper}
                  color="text-gray-700"
                  bg="bg-gray-100"
                />
                <KpiCard
                  label="Articles ce mois"
                  value={overview ? overview.articlesThisMonth.toString() : '—'}
                  icon={FileText}
                  color="text-blue-600"
                  bg="bg-blue-50"
                />
                <KpiCard
                  label="Vues ce mois"
                  value={overview ? overview.viewsThisMonth.toLocaleString('fr-FR') : '—'}
                  variation={overview?.viewsGrowthPercent}
                  icon={Eye}
                  color="text-purple-600"
                  bg="bg-purple-50"
                />
                <KpiCard
                  label="Vues mois précédent"
                  value={overview ? overview.viewsLastMonth.toLocaleString('fr-FR') : '—'}
                  icon={Eye}
                  color="text-gray-500"
                  bg="bg-gray-100"
                />
              </div>

              {/* Top article */}
              {overview?.topArticle && (
                <div className="mt-4 bg-white rounded-xl border border-black/[0.06] p-5">
                  <p className="text-[12px] text-gray-400 uppercase tracking-wider mb-2">Article le plus lu ce mois</p>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm truncate mr-4">{overview.topArticle.title}</p>
                    <span className="text-sm text-purple-600 font-medium whitespace-nowrap flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {overview.topArticle.views} vues
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ─── ARTICLES TAB ──────────────────────────────────────── */}
        {activeTab === 'articles' && <ArticlesManager />}

        {/* ─── CATEGORIES TAB ──────────────────────────────────── */}
        {activeTab === 'categories' && <CategoriesManager />}

        {/* ─── MARKET DATA TAB ──────────────────────────────────── */}
        {activeTab === 'market' && <MarketDataManager />}

        {/* ─── FLASH BANNER TAB ──────────────────────────────────── */}
        {activeTab === 'flash' && <FlashBannerManager />}

        {/* ─── EDUCATION TAB ─────────────────────────────────────── */}
        {activeTab === 'education' && <EducationManager />}

        {/* ─── NIGER TAB ──────────────────────────────────────────── */}
        {activeTab === 'niger' && <NigerPresentationManager />}

        {/* ─── LEGAL TAB ──────────────────────────────────────────── */}
        {activeTab === 'legal' && <LegalSectionsManager />}

        {/* ─── PAYWALL TAB ────────────────────────────────────────── */}
        {activeTab === 'paywall' && <PaywallManager />}

        {/* ─── USERS TAB ──────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-black/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-3 bg-white border border-black/[0.06] rounded-lg text-sm focus:outline-none"
              >
                <option value="">Tous les rôles</option>
                <option value="reader">Lecteur</option>
                <option value="premium">Premium</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <p className="text-[12px] text-gray-400">{users.length} utilisateur(s)</p>

            {loadingData ? (
              <div className="text-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-black/[0.04]">
                      <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Utilisateur</th>
                      <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Rôle</th>
                      <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Statut</th>
                      <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Inscrit le</th>
                      <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <UserRow
                        key={u.id}
                        user={u}
                        expanded={expandedUser === u.id}
                        processing={processingUser === u.id}
                        onToggle={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                        onAction={(action, extra) => handleUserAction(u.id, action, extra)}
                      />
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <p className="text-center py-8 text-sm text-gray-400">Aucun utilisateur trouvé</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── PAYMENTS TAB ──────────────────────────────────────── */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {['pending', 'verified', 'rejected'].map((s) => (
                  <button
                    key={s}
                    onClick={() => fetchPayments(s)}
                    className={`px-4 py-2 rounded-lg text-[13px] transition-all ${
                      paymentFilter === s
                        ? 'bg-[#111] text-white'
                        : 'bg-white border border-black/[0.06] text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {s === 'pending' && <Clock className="w-3.5 h-3.5 inline mr-1.5" />}
                    {s === 'verified' && <CheckCircle className="w-3.5 h-3.5 inline mr-1.5" />}
                    {s === 'rejected' && <XCircle className="w-3.5 h-3.5 inline mr-1.5" />}
                    {s === 'pending' ? 'En attente' : s === 'verified' ? 'Vérifiés' : 'Rejetés'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleExport('payments')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] bg-white border border-black/[0.06] hover:bg-gray-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
            </div>

            {loadingPayments ? (
              <div className="text-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-black/[0.04]">
                      <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Utilisateur</th>
                      <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Plan</th>
                      <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Montant</th>
                      <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Méthode</th>
                      <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">N° Transaction</th>
                      <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Date</th>
                      {paymentFilter === 'pending' && (
                        <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-black/[0.03] last:border-0">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium">{p.user_profiles?.full_name || '-'}</p>
                          <p className="text-[12px] text-gray-400">{p.user_profiles?.email || p.user_id}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded bg-amber-100 text-amber-700">
                            {p.tier}
                          </span>
                          <span className="text-[10px] text-gray-400 ml-1">
                            {getBillingCycleLabel(p.billing_cycle)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{formatPrice(p.amount)}</td>
                        <td className="px-4 py-3 text-[12px] text-gray-600 capitalize">{p.payment_method}</td>
                        <td className="px-4 py-3 text-[12px] font-mono text-gray-600">{p.transaction_number}</td>
                        <td className="px-4 py-3 text-[12px] text-gray-500">
                          {new Date(p.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        {paymentFilter === 'pending' && (
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handlePaymentAction(p.id, 'verify')}
                                disabled={processingPayment === p.id}
                                className="text-[12px] bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded hover:bg-emerald-100 transition-colors disabled:opacity-50"
                              >
                                {processingPayment === p.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  'Valider'
                                )}
                              </button>
                              <button
                                onClick={() => handlePaymentAction(p.id, 'reject')}
                                disabled={processingPayment === p.id}
                                className="text-[12px] bg-red-50 text-red-700 px-3 py-1.5 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                Rejeter
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {payments.length === 0 && (
                  <p className="text-center py-8 text-sm text-gray-400">Aucun paiement {paymentFilter === 'pending' ? 'en attente' : ''}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── PRICING TAB ──────────────────────────────────────── */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Gestion dynamique des prix</p>
                  <p className="text-[13px] text-amber-700 mt-1">
                    Modifiez les prix ci-dessous. Les prix par défaut (config) sont affichés si aucun prix dynamique n&apos;est défini.
                    Les nouveaux prix s&apos;appliquent immédiatement sur le site.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-black/[0.06] p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-400" />
                Plan Premium
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {BILLING_OPTIONS.map((opt) => {
                  const dynamic = dynamicPrices.find(
                    (dp) => dp.tier === 'premium' && dp.billing_cycle === opt.cycle
                  );
                  const currentAmount = dynamic?.amount ?? opt.price;
                  const key = `premium_${opt.cycle}`;

                  return (
                    <PriceEditor
                      key={key}
                      label={getBillingCycleLabel(opt.cycle)}
                      defaultAmount={opt.price}
                      currentAmount={currentAmount}
                      saving={savingPrice === key}
                      onSave={(amount) => handlePriceUpdate('premium', opt.cycle, amount)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── STATS TAB ──────────────────────────────────────── */}
        {activeTab === 'stats' && <StatsManager />}

        {/* ─── MESSAGES TAB ──────────────────────────────────── */}
        {activeTab === 'messages' && <MessagesManager />}

        {/* ─── AUDIT LOG TAB ──────────────────────────────────── */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/[0.04]">
                    <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Date</th>
                    <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Admin</th>
                    <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Action</th>
                    <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Type</th>
                    <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((entry) => (
                    <tr key={entry.id} className="border-b border-black/[0.03] last:border-0">
                      <td className="px-4 py-3 text-[12px] text-gray-500 whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-[12px]">
                        {entry.user_profiles?.email || entry.admin_id.slice(0, 8) + '...'}
                      </td>
                      <td className="px-4 py-3">
                        <AuditActionBadge action={entry.action} />
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-600">{entry.entity_type}</td>
                      <td className="px-4 py-3 text-[12px] text-gray-500 font-mono max-w-xs truncate">
                        {JSON.stringify(entry.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {auditLog.length === 0 && (
                <p className="text-center py-8 text-sm text-gray-400">Aucune action enregistrée</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, bg }: {
  label: string; value: string; icon: typeof Users; color: string; bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-black/[0.06] p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[12px] text-gray-400 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function KpiCard({ label, value, sub, variation, icon: Icon, color, bg }: {
  label: string;
  value: string;
  sub?: string;
  variation?: number;
  icon: typeof Users;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-black/[0.06] p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[12px] text-gray-400 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {variation !== undefined && (
        <div className="flex items-center gap-1 mt-1">
          {variation >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          )}
          <span className={`text-[11px] font-medium ${variation >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {variation > 0 ? '+' : ''}{variation}% vs mois dernier
          </span>
        </div>
      )}
      {sub && !variation && variation !== 0 && (
        <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
      )}
    </div>
  );
}

function UserRow({ user, expanded, processing, onToggle, onAction }: {
  user: UserEntry;
  expanded: boolean;
  processing: boolean;
  onToggle: () => void;
  onAction: (action: string, extra?: Record<string, string>) => void;
}) {
  const [durationMonths, setDurationMonths] = useState('1');
  const [customDays, setCustomDays] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const isActive = user.subscription_status === 'active';
  const isExpired = user.subscription_status === 'expired';

  // Calculate projected end date for display
  const getProjectedEnd = () => {
    const end = new Date();
    if (showCustom && customDays) {
      end.setDate(end.getDate() + parseInt(customDays));
    } else {
      end.setMonth(end.getMonth() + parseInt(durationMonths));
    }
    return end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleActivate = async () => {
    const extra: Record<string, string> = { durationMonths };
    if (showCustom && customDays) {
      extra.customDays = customDays;
    }
    onAction('activateSubscription', extra);
    setActionSuccess('premium');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleDeactivate = () => {
    setShowDowngradeConfirm(false);
    onAction('deactivateSubscription');
    setActionSuccess('downgrade');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const statusLabel = isActive ? 'Premium actif' : isExpired ? 'Expiré' : 'Lecteur gratuit';
  const statusColor = isActive ? 'text-emerald-600' : isExpired ? 'text-amber-600' : 'text-gray-400';
  const statusBg = isActive ? 'bg-emerald-50' : isExpired ? 'bg-amber-50' : 'bg-gray-50';

  return (
    <>
      <tr className="border-b border-black/[0.03] last:border-0 hover:bg-gray-50/50 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm font-medium">{user.full_name || '-'}</p>
              <p className="text-[12px] text-gray-400">{user.email}</p>
            </div>
            {user.blocked && (
              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Bloqué</span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`text-[11px] uppercase tracking-wider px-2 py-1 rounded ${
            user.role === 'premium' ? 'bg-amber-100 text-amber-700' :
            user.role === 'admin' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {user.role}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className={`text-[12px] font-medium ${statusColor}`}>
              {statusLabel}
            </span>
            {isActive && user.subscription_end && (
              <span className="text-[10px] text-gray-400">
                Exp. {new Date(user.subscription_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-[12px] text-gray-500">
          {new Date(user.created_at).toLocaleDateString('fr-FR')}
        </td>
        <td className="px-4 py-3">
          <button onClick={onToggle} className="text-[12px] text-gray-500 hover:text-black flex items-center gap-1">
            Gérer {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50/80">
          <td colSpan={5} className="px-4 py-5">
            {/* Success feedback */}
            {actionSuccess && (
              <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-lg text-[13px]">
                <CheckCircle className="w-4 h-4" />
                {actionSuccess === 'premium'
                  ? 'Abonnement Premium activé avec succès. Email envoyé.'
                  : 'Abonnement rétrogradé en Lecteur gratuit. Email envoyé.'}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Current status + role management */}
              <div className="space-y-3">
                {/* Current subscription status card */}
                <div className={`${statusBg} rounded-lg p-4 border border-black/[0.04]`}>
                  <div className="flex items-center gap-2 mb-2">
                    {isActive ? <Crown className="w-4 h-4 text-amber-500" /> : <Users className="w-4 h-4 text-gray-400" />}
                    <span className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Statut actuel</span>
                  </div>
                  <p className={`text-sm font-semibold ${statusColor}`}>{statusLabel}</p>
                  {isActive && user.subscription_start && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[11px] text-gray-500">
                        Début : {new Date(user.subscription_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      {user.subscription_end && (
                        <p className="text-[11px] text-gray-500">
                          Fin : {new Date(user.subscription_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Role change */}
                <div className="flex items-end gap-2">
                  <div>
                    <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Rôle</label>
                    <select
                      defaultValue={user.role}
                      onChange={(e) => onAction('changeRole', { role: e.target.value })}
                      disabled={processing}
                      className="text-[12px] border border-gray-200 rounded px-2 py-1.5 bg-white"
                    >
                      <option value="reader">Lecteur</option>
                      <option value="premium">Premium</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Block / Unblock */}
                  {user.blocked ? (
                    <button
                      onClick={() => onAction('unblock')}
                      disabled={processing}
                      className="text-[12px] bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded hover:bg-emerald-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <Unlock className="w-3 h-3" /> Débloquer
                    </button>
                  ) : (
                    <button
                      onClick={() => onAction('block')}
                      disabled={processing}
                      className="text-[12px] bg-red-50 text-red-700 px-3 py-1.5 rounded hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <Ban className="w-3 h-3" /> Bloquer
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Subscription management */}
              <div className="bg-white rounded-lg border border-black/[0.06] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Gestion abonnement</span>
                </div>

                {/* Status selector */}
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Nouveau statut</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (isActive) {
                          setShowDowngradeConfirm(true);
                        }
                      }}
                      className={`flex-1 text-[12px] px-3 py-2 rounded border transition-colors ${
                        !isActive
                          ? 'bg-gray-100 border-gray-300 text-gray-700 font-medium'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      Lecteur gratuit
                    </button>
                    <button
                      className={`flex-1 text-[12px] px-3 py-2 rounded border transition-colors ${
                        isActive
                          ? 'bg-amber-50 border-amber-300 text-amber-700 font-medium'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-amber-300'
                      }`}
                      disabled
                    >
                      Premium
                    </button>
                  </div>
                </div>

                {/* Duration selector */}
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Durée de l&apos;abonnement</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { value: '1', label: '1 mois' },
                      { value: '3', label: '3 mois' },
                      { value: '6', label: '6 mois' },
                      { value: '12', label: '12 mois' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setDurationMonths(opt.value); setShowCustom(false); setCustomDays(''); }}
                        className={`text-[12px] px-2 py-1.5 rounded border transition-colors ${
                          durationMonths === opt.value && !showCustom
                            ? 'bg-[#111] text-white border-[#111]'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowCustom(!showCustom)}
                    className={`mt-1.5 text-[11px] px-2 py-1 rounded border transition-colors w-full ${
                      showCustom ? 'bg-[#111] text-white border-[#111]' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    Durée personnalisée
                  </button>
                  {showCustom && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Nombre de jours"
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value)}
                        min={1}
                        className="flex-1 text-[12px] border border-gray-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-black"
                      />
                      <span className="text-[11px] text-gray-400">jours</span>
                    </div>
                  )}
                </div>

                {/* Projected end date */}
                <div className="bg-[#fafaf9] rounded-lg p-3 border border-black/[0.04]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[11px] text-gray-400">Date de fin calculée</span>
                  </div>
                  <p className="text-[13px] font-medium">{getProjectedEnd()}</p>
                </div>

                {/* Action buttons */}
                <button
                  onClick={handleActivate}
                  disabled={processing || (showCustom && !customDays)}
                  className="w-full text-[13px] bg-[#111] text-white px-4 py-2.5 rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Confirmer et appliquer Premium
                </button>

                {/* Downgrade button */}
                {isActive && !showDowngradeConfirm && (
                  <button
                    onClick={() => setShowDowngradeConfirm(true)}
                    disabled={processing}
                    className="w-full text-[12px] bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Rétrograder en Lecteur gratuit
                  </button>
                )}

                {/* Downgrade confirmation */}
                {showDowngradeConfirm && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-[12px] text-red-700 mb-2 font-medium">
                      Confirmer la rétrogradation en Lecteur gratuit ?
                    </p>
                    <p className="text-[11px] text-red-600 mb-3">
                      L&apos;utilisateur perdra immédiatement l&apos;accès premium et recevra un email de notification.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDowngradeConfirm(false)}
                        className="flex-1 text-[12px] px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleDeactivate}
                        disabled={processing}
                        className="flex-1 text-[12px] px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {processing ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Confirmer'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {processing && (
              <div className="mt-3 flex items-center gap-2 text-[12px] text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Traitement en cours...
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function PriceEditor({ label, defaultAmount, currentAmount, saving, onSave }: {
  label: string;
  defaultAmount: number;
  currentAmount: number;
  saving: boolean;
  onSave: (amount: number) => void;
}) {
  const [value, setValue] = useState(currentAmount.toString());
  const isDifferent = parseInt(value) !== currentAmount;
  const isCustom = currentAmount !== defaultAmount;

  return (
    <div className="border border-black/[0.06] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        {isCustom && (
          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Personnalisé</span>
        )}
      </div>
      <p className="text-[11px] text-gray-400 mb-2">
        Par défaut : {formatPrice(defaultAmount)}
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            min={100}
            step={100}
            className="w-full border border-black/[0.08] rounded px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:border-black/15"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">{CURRENCY}</span>
        </div>
        <button
          onClick={() => onSave(parseInt(value))}
          disabled={saving || !isDifferent || parseInt(value) < 100}
          className="px-3 py-2 bg-[#111] text-white rounded text-[12px] hover:bg-[#333] disabled:opacity-30 transition-colors"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sauver'}
        </button>
      </div>
    </div>
  );
}

function AuditActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    verify_payment: 'bg-emerald-100 text-emerald-700',
    reject_payment: 'bg-red-100 text-red-700',
    change_role: 'bg-blue-100 text-blue-700',
    block_user: 'bg-red-100 text-red-700',
    unblock_user: 'bg-emerald-100 text-emerald-700',
    activate_subscription: 'bg-purple-100 text-purple-700',
    deactivate_subscription: 'bg-gray-100 text-gray-700',
    subscription_expired: 'bg-orange-100 text-orange-700',
    update_price: 'bg-amber-100 text-amber-700',
    export_csv: 'bg-blue-100 text-blue-700',
  };

  const labels: Record<string, string> = {
    verify_payment: 'Paiement validé',
    reject_payment: 'Paiement rejeté',
    change_role: 'Rôle modifié',
    block_user: 'Utilisateur bloqué',
    unblock_user: 'Utilisateur débloqué',
    activate_subscription: 'Abo activé',
    deactivate_subscription: 'Abo désactivé',
    subscription_expired: 'Abo expiré (auto)',
    update_price: 'Prix modifié',
    export_csv: 'Export CSV',
  };

  return (
    <span className={`text-[11px] px-2 py-1 rounded ${colors[action] || 'bg-gray-100 text-gray-600'}`}>
      {labels[action] || action}
    </span>
  );
}
