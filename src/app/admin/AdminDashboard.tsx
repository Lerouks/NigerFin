'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, Shield, Loader2, Download, Building2,
  DollarSign, FileText, Newspaper, LineChart, Zap, BookOpen,
  SlidersHorizontal, Mail, CreditCard, Users, Activity,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
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
import { StrategicEnterprisesManager } from './StrategicEnterprisesManager';
import { OverviewTab } from './OverviewTab';
import { UsersTab } from './UsersTab';
import { PaymentsTab } from './PaymentsTab';
import { PricingTab } from './PricingTab';
import { AuditTab } from './AuditTab';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserStats {
  total: number;
  readers: number;
  premium: number;
  activeSubscriptions: number;
  blockedUsers: number;
  pendingPayments: number;
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

type TabId = 'overview' | 'articles' | 'categories' | 'market' | 'flash' | 'education' | 'niger' | 'enterprises' | 'legal' | 'paywall' | 'users' | 'payments' | 'pricing' | 'stats' | 'audit' | 'messages';

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const { isSignedIn, isLoading, userRole } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const [stats, setStats] = useState<UserStats>({ total: 0, readers: 0, premium: 0, activeSubscriptions: 0, blockedUsers: 0, pendingPayments: 0 });
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!isLoading && (!isSignedIn || userRole !== 'admin')) {
      router.push('/');
    }
  }, [isLoading, isSignedIn, userRole, router]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) setStats(await res.json());
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
      if (res.ok) setOverview(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchStats();
      fetchUnreadCount();
      fetchOverview();
    }
  }, [userRole, fetchStats, fetchUnreadCount, fetchOverview]);

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

  // ─── Tabs config ────────────────────────────────────────────────────────

  const tabs: { id: TabId; label: string; icon: typeof BarChart3; badge?: number }[] = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'articles', label: 'Articles', icon: Newspaper },
    { id: 'categories', label: 'Catégories', icon: FileText },
    { id: 'market', label: 'Marchés', icon: LineChart },
    { id: 'flash', label: 'Flash Info', icon: Zap },
    { id: 'education', label: 'Éducation', icon: BookOpen },
    { id: 'niger', label: 'Niger', icon: Activity },
    { id: 'enterprises', label: 'Entreprises', icon: Building2 },
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
              {['users', 'payments', 'articles', 'messages', 'stats'].map((type) => (
                <button
                  key={type}
                  onClick={() => handleExport(type)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export {type === 'users' ? 'Utilisateurs' : type === 'payments' ? 'Paiements' : type === 'articles' ? 'Articles' : type === 'messages' ? 'Messages' : 'Stats'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1" role="tablist" aria-label="Sections d'administration">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
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

        {/* Tab content */}
        {activeTab === 'overview' && <OverviewTab overview={overview} stats={stats} />}
        {activeTab === 'articles' && <ArticlesManager />}
        {activeTab === 'categories' && <CategoriesManager />}
        {activeTab === 'market' && <MarketDataManager />}
        {activeTab === 'flash' && <FlashBannerManager />}
        {activeTab === 'education' && <EducationManager />}
        {activeTab === 'niger' && <NigerPresentationManager />}
        {activeTab === 'enterprises' && <StrategicEnterprisesManager />}
        {activeTab === 'legal' && <LegalSectionsManager />}
        {activeTab === 'paywall' && <PaywallManager />}
        {activeTab === 'users' && <UsersTab onStatsRefresh={fetchStats} />}
        {activeTab === 'messages' && <MessagesManager />}
        {activeTab === 'payments' && <PaymentsTab onStatsRefresh={fetchStats} />}
        {activeTab === 'pricing' && <PricingTab />}
        {activeTab === 'stats' && <StatsManager />}
        {activeTab === 'audit' && <AuditTab />}
      </div>
    </div>
  );
}
