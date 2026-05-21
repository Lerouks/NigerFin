'use client';

import {
  Users, BarChart3, TrendingUp, DollarSign, Activity,
  Ban, UserPlus, UserMinus, Repeat, Target, FileBarChart, Crown, Eye, Newspaper, FileText, Clock,
} from 'lucide-react';
import { formatPrice } from '@/config/pricing';
import { VariationBadge } from '@/components/data/VariationBadge';

interface OverviewData {
  mrr: number;
  arr: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowthPercent: number;
  totalRevenue: number;
  monthlyRevenue_chart: { month: string; revenue: number }[];
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
  monthlyUsers_chart: { month: string; users: number }[];
}

interface UserStats {
  total: number;
  readers: number;
  premium: number;
  activeSubscriptions: number;
  blockedUsers: number;
  pendingPayments: number;
}

interface OverviewTabProps {
  overview: OverviewData | null;
  stats: UserStats;
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
        <p className="text-[12px] text-gray-500 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {variation !== undefined && (
        <div className="flex items-center gap-1 mt-1">
          <VariationBadge value={variation} pill />
          <span className="text-[10px] text-gray-500 ml-0.5">vs mois dernier</span>
        </div>
      )}
      {sub && !variation && variation !== 0 && (
        <p className="text-[11px] text-gray-500 mt-1">{sub}</p>
      )}
    </div>
  );
}

export function OverviewTab({ overview, stats }: OverviewTabProps) {
  return (
    <div className="space-y-6">

      {/* Hero KPIs: MRR, Abonnés actifs, Churn */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-black/[0.06] p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] text-gray-500 uppercase tracking-wider">MRR</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-4xl font-bold text-emerald-600">{overview ? formatPrice(overview.mrr) : '-'}</p>
          <p className="text-[11px] text-gray-500 mt-1">Monthly Recurring Revenue</p>
        </div>
        <div className="bg-white rounded-xl border border-black/[0.06] p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] text-gray-500 uppercase tracking-wider">Abonnés actifs</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Crown className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-4xl font-bold text-blue-600">{overview ? overview.premiumActive : '-'}</p>
          {overview && overview.newPremiumThisMonth > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[11px] text-emerald-600 font-medium">+{overview.newPremiumThisMonth} ce mois</span>
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-black/[0.06] p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] text-gray-500 uppercase tracking-wider">Churn Rate</p>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <UserMinus className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className={`text-4xl font-bold ${overview && overview.churnRate > 5 ? 'text-red-600' : overview && overview.churnRate > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {overview ? `${overview.churnRate}%` : '-'}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            {overview ? `${overview.expiredThisMonth} résiliation(s) ce mois` : ''}
          </p>
        </div>
      </div>

      {/* Revenue KPIs */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> Revenus
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="ARR" value={overview ? formatPrice(overview.arr) : '-'} sub="Annual Recurring Revenue" icon={BarChart3} color="text-emerald-600" bg="bg-emerald-50" />
          <KpiCard label="Revenus ce mois" value={overview ? formatPrice(overview.thisMonthRevenue) : '-'} variation={overview?.revenueGrowthPercent} icon={TrendingUp} color="text-blue-600" bg="bg-blue-50" />
          <KpiCard label="Revenus cumulés" value={overview ? formatPrice(overview.totalRevenue) : '-'} sub="Depuis le lancement" icon={DollarSign} color="text-gray-700" bg="bg-gray-100" />
          <KpiCard label="LTV" value={overview ? (overview.ltv > 0 ? formatPrice(overview.ltv) : 'Données insuffisantes') : '-'} sub="Lifetime Value moyen" icon={Target} color="text-purple-600" bg="bg-purple-50" />
        </div>
      </div>

      {/* Subscribers KPIs */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" /> Abonnés
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Nouveaux abonnés" value={overview ? overview.newPremiumThisMonth.toString() : '-'} sub="Ce mois" icon={UserPlus} color="text-emerald-600" bg="bg-emerald-50" />
          <KpiCard label="Abonnements expirés" value={overview ? overview.expiredThisMonth.toString() : '-'} sub="Ce mois" icon={UserMinus} color="text-red-600" bg="bg-red-50" />
          <KpiCard label="Taux de conversion" value={overview ? `${overview.conversionRate}%` : '-'} sub="Inscription → Premium" icon={Repeat} color="text-amber-600" bg="bg-amber-50" />
          <KpiCard label="Paiements en attente" value={stats.pendingPayments.toString()} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
        </div>
      </div>

      {/* Acquisition KPIs */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Acquisition
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KpiCard label="Total inscrits" value={overview ? overview.totalUsers.toString() : '-'} sub="Gratuits + Premium" icon={Users} color="text-blue-600" bg="bg-blue-50" />
          <KpiCard label="Nouveaux inscrits" value={overview ? overview.newUsersThisMonth.toString() : '-'} sub="Ce mois" variation={overview?.newUsersGrowthPercent} icon={UserPlus} color="text-emerald-600" bg="bg-emerald-50" />
          <KpiCard label="Utilisateurs bloqués" value={stats.blockedUsers.toString()} icon={Ban} color="text-red-600" bg="bg-red-50" />
        </div>
      </div>

      {/* Charts: MRR + Inscrits (6 mois) */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-black/[0.06] p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-gray-500" />
              Revenus mensuels (6 derniers mois)
            </h3>
            <div className="flex items-end gap-3 h-40">
              {overview.monthlyRevenue_chart.map((m) => {
                const max = Math.max(...overview.monthlyRevenue_chart.map((x) => x.revenue), 1);
                const height = (m.revenue / max) * 100;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-gray-500 font-medium">
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

          <div className="bg-white rounded-xl border border-black/[0.06] p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-gray-500" />
              Nouveaux inscrits (6 derniers mois)
            </h3>
            <div className="flex items-end gap-3 h-40">
              {overview.monthlyUsers_chart.map((m) => {
                const max = Math.max(...overview.monthlyUsers_chart.map((x) => x.users), 1);
                const height = (m.users / max) * 100;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-gray-500 font-medium">
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

      {/* Content & Engagement KPIs */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileBarChart className="w-4 h-4" /> Contenu & Engagement
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total articles" value={overview ? overview.totalArticles.toString() : '-'} sub="Publiés" icon={Newspaper} color="text-gray-700" bg="bg-gray-100" />
          <KpiCard label="Articles ce mois" value={overview ? overview.articlesThisMonth.toString() : '-'} icon={FileText} color="text-blue-600" bg="bg-blue-50" />
          <KpiCard label="Vues ce mois" value={overview ? overview.viewsThisMonth.toLocaleString('fr-FR') : '-'} variation={overview?.viewsGrowthPercent} icon={Eye} color="text-purple-600" bg="bg-purple-50" />
          <KpiCard label="Vues mois précédent" value={overview ? overview.viewsLastMonth.toLocaleString('fr-FR') : '-'} icon={Eye} color="text-gray-500" bg="bg-gray-100" />
        </div>

        {overview?.topArticle && (
          <div className="mt-4 bg-white rounded-xl border border-black/[0.06] p-5">
            <p className="text-[12px] text-gray-500 uppercase tracking-wider mb-2">Article le plus lu ce mois</p>
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
  );
}
