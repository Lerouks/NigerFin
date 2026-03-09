import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { serviceClient } = auth;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Run all queries in parallel
  const [
    totalViewsRes,
    todayViewsRes,
    weekViewsRes,
    monthViewsRes,
    topArticlesRes,
    topPagesRes,
    newUsersMonthRes,
    totalUsersRes,
    premiumActiveRes,
    dailyViewsRes,
  ] = await Promise.all([
    // Total views
    serviceClient.from('page_views').select('*', { count: 'exact', head: true }),
    // Today views
    serviceClient.from('page_views').select('*', { count: 'exact', head: true }).gte('viewed_at', todayStart),
    // Week views
    serviceClient.from('page_views').select('*', { count: 'exact', head: true }).gte('viewed_at', weekAgo),
    // Month views
    serviceClient.from('page_views').select('*', { count: 'exact', head: true }).gte('viewed_at', monthAgo),
    // Top articles (30 days) - articles with views
    serviceClient
      .from('page_views')
      .select('article_id, page_path')
      .not('article_id', 'is', null)
      .gte('viewed_at', monthAgo),
    // Top pages (30 days)
    serviceClient
      .from('page_views')
      .select('page_path')
      .gte('viewed_at', monthAgo),
    // New users this month
    serviceClient.from('user_profiles').select('*', { count: 'exact', head: true }).gte('created_at', thisMonthStart),
    // Total users
    serviceClient.from('user_profiles').select('*', { count: 'exact', head: true }),
    // Premium active
    serviceClient.from('user_profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    // Daily views for last 30 days (get raw data and aggregate)
    serviceClient
      .from('page_views')
      .select('viewed_at')
      .gte('viewed_at', monthAgo)
      .order('viewed_at', { ascending: true }),
  ]);

  // Aggregate top articles
  const articleViewMap: Record<string, { count: number; path: string }> = {};
  if (topArticlesRes.data) {
    for (const row of topArticlesRes.data) {
      const key = row.article_id;
      if (!articleViewMap[key]) {
        articleViewMap[key] = { count: 0, path: row.page_path };
      }
      articleViewMap[key].count++;
    }
  }

  // Get article titles for top articles
  const topArticleIds = Object.entries(articleViewMap)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([id]) => id);

  let articleTitles: Record<string, string> = {};
  if (topArticleIds.length > 0) {
    const { data: articles } = await serviceClient
      .from('articles')
      .select('id, title')
      .in('id', topArticleIds);
    if (articles) {
      articleTitles = Object.fromEntries(articles.map((a: { id: string; title: string }) => [a.id, a.title]));
    }
  }

  const topArticles = topArticleIds.map((id) => ({
    id,
    title: articleTitles[id] || articleViewMap[id]?.path || 'Sans titre',
    views: articleViewMap[id]?.count || 0,
  }));

  // Aggregate top pages
  const pageViewMap: Record<string, number> = {};
  if (topPagesRes.data) {
    for (const row of topPagesRes.data) {
      pageViewMap[row.page_path] = (pageViewMap[row.page_path] || 0) + 1;
    }
  }
  const topPages = Object.entries(pageViewMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([path, views]) => ({ path, views }));

  // Aggregate daily views
  const dailyMap: Record<string, number> = {};
  if (dailyViewsRes.data) {
    for (const row of dailyViewsRes.data) {
      const day = row.viewed_at.slice(0, 10);
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    }
  }
  // Fill in missing days
  const dailyViews: { date: string; views: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyViews.push({ date: key, views: dailyMap[key] || 0 });
  }

  // Revenue this month
  const { data: revenueData } = await serviceClient
    .from('payment_requests')
    .select('amount')
    .eq('status', 'verified')
    .gte('verified_at', thisMonthStart);

  const revenueThisMonth = (revenueData || []).reduce((sum: number, p: { amount: number }) => sum + (p.amount || 0), 0);

  // Conversion rate
  const totalUsers = totalUsersRes.count || 0;
  const premiumActive = premiumActiveRes.count || 0;
  const conversionRate = totalUsers > 0 ? ((premiumActive / totalUsers) * 100).toFixed(1) : '0';

  return NextResponse.json({
    views: {
      total: totalViewsRes.count || 0,
      today: todayViewsRes.count || 0,
      week: weekViewsRes.count || 0,
      month: monthViewsRes.count || 0,
    },
    topArticles,
    topPages,
    dailyViews,
    users: {
      total: totalUsers,
      newThisMonth: newUsersMonthRes.count || 0,
      premiumActive,
      conversionRate,
    },
    revenueThisMonth,
  });
}
