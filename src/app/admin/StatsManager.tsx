'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Eye, TrendingUp, Users, CreditCard, BarChart3,
  FileText, Calendar, ArrowUpRight,
} from 'lucide-react';
import { formatPrice } from '@/config/pricing';

interface ViewStats {
  total: number;
  today: number;
  week: number;
  month: number;
}

interface TopArticle {
  id: string;
  title: string;
  views: number;
}

interface TopPage {
  path: string;
  views: number;
}

interface DailyView {
  date: string;
  views: number;
}

interface UserStats {
  total: number;
  newThisMonth: number;
  premiumActive: number;
  conversionRate: string;
}

interface StatsData {
  views: ViewStats;
  topArticles: TopArticle[];
  topPages: TopPage[];
  dailyViews: DailyView[];
  users: UserStats;
  revenueThisMonth: number;
}

export function StatsManager() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/views');
      if (res.ok) {
        setData(await res.json());
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-center py-16 text-gray-400">Erreur de chargement des statistiques</p>;
  }

  const maxDaily = Math.max(...data.dailyViews.map((d) => d.views), 1);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={<Eye className="w-4 h-4" />} label="Vues aujourd'hui" value={data.views.today.toString()} color="text-blue-600" bg="bg-blue-50" />
        <KpiCard icon={<BarChart3 className="w-4 h-4" />} label="Vues 7 jours" value={data.views.week.toString()} color="text-emerald-600" bg="bg-emerald-50" />
        <KpiCard icon={<Calendar className="w-4 h-4" />} label="Vues 30 jours" value={data.views.month.toString()} color="text-purple-600" bg="bg-purple-50" />
        <KpiCard icon={<Eye className="w-4 h-4" />} label="Vues totales" value={data.views.total.toString()} color="text-gray-700" bg="bg-gray-100" />
      </div>

      {/* Users & Revenue row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={<Users className="w-4 h-4" />} label="Inscrits total" value={data.users.total.toString()} color="text-blue-600" bg="bg-blue-50" />
        <KpiCard icon={<ArrowUpRight className="w-4 h-4" />} label="Nouveaux ce mois" value={data.users.newThisMonth.toString()} color="text-emerald-600" bg="bg-emerald-50" />
        <KpiCard icon={<CreditCard className="w-4 h-4" />} label="Premium actifs" value={data.users.premiumActive.toString()} color="text-amber-600" bg="bg-amber-50" />
        <KpiCard icon={<TrendingUp className="w-4 h-4" />} label="Conversion" value={`${data.users.conversionRate}%`} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Revenue this month */}
      <div className="bg-white rounded-xl border border-black/[0.06] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] text-gray-400 uppercase tracking-wider mb-1">Revenus du mois en cours</p>
            <p className="text-3xl font-bold">{formatPrice(data.revenueThisMonth)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Daily views chart */}
      <div className="bg-white rounded-xl border border-black/[0.06] p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          Vues par jour (30 derniers jours)
        </h3>
        <div className="flex items-end gap-1 h-40">
          {data.dailyViews.map((d) => {
            const height = (d.views / maxDaily) * 100;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="opacity-0 group-hover:opacity-100 absolute -top-6 bg-[#111] text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap transition-opacity">
                  {d.views} vues
                </div>
                <div
                  className="w-full bg-[#111] hover:bg-blue-600 rounded-t transition-all min-h-[2px] cursor-default"
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
                {/* Show date label every 5th day */}
                {data.dailyViews.indexOf(d) % 5 === 0 && (
                  <span className="text-[9px] text-gray-400 -rotate-45 origin-top-left mt-1">{d.date.slice(5)}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two columns: top articles + top pages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Articles */}
        <div className="bg-white rounded-xl border border-black/[0.06] p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            Articles les plus lus (30j)
          </h3>
          {data.topArticles.length === 0 ? (
            <p className="text-[13px] text-gray-400 py-4 text-center">Aucune donnee de vue encore</p>
          ) : (
            <div className="space-y-2">
              {data.topArticles.map((article, i) => (
                <div key={article.id} className="flex items-center gap-3 py-2 border-b border-black/[0.03] last:border-0">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-500 flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-[13px] flex-1 line-clamp-1">{article.title}</span>
                  <span className="text-[12px] font-medium text-gray-500 flex-shrink-0">{article.views} vues</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Pages */}
        <div className="bg-white rounded-xl border border-black/[0.06] p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-400" />
            Pages les plus visitées (30j)
          </h3>
          {data.topPages.length === 0 ? (
            <p className="text-[13px] text-gray-400 py-4 text-center">Aucune donnee de vue encore</p>
          ) : (
            <div className="space-y-2">
              {data.topPages.map((page, i) => (
                <div key={page.path} className="flex items-center gap-3 py-2 border-b border-black/[0.03] last:border-0">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-500 flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-[13px] font-mono flex-1 line-clamp-1">{page.path}</span>
                  <span className="text-[12px] font-medium text-gray-500 flex-shrink-0">{page.views} vues</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, color, bg }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-black/[0.06] p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[12px] text-gray-400 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
          <span className={color}>{icon}</span>
        </div>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
