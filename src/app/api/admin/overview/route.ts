import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { BILLING_OPTIONS } from '@/config/pricing';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { serviceClient } = auth;
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const prevLastMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const prevLastMonthEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);

  // ─── Parallel queries ──────────────────────────────────────────────────────

  const [
    totalUsersRes,
    premiumActiveRes,
    newUsersThisMonthRes,
    newUsersLastMonthRes,
    newPremiumThisMonthRes,
    expiredThisMonthRes,
    totalArticlesRes,
    articlesThisMonthRes,
    viewsThisMonthRes,
    viewsLastMonthRes,
    allPaymentsRes,
    allSubscriptionsRes,
    topArticleViewsRes,
    usersStartOfMonthRes,
    monthlyUsersRawRes,
  ] = await Promise.all([
    // Total users
    serviceClient.from('user_profiles').select('*', { count: 'exact', head: true }),
    // Premium active
    serviceClient.from('user_profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    // New users this month
    serviceClient.from('user_profiles').select('*', { count: 'exact', head: true }).gte('created_at', thisMonthStart.toISOString()),
    // New users last month
    serviceClient.from('user_profiles').select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonthStart.toISOString())
      .lte('created_at', lastMonthEnd.toISOString()),
    // New premium subscribers this month (subscription started this month)
    serviceClient.from('user_profiles').select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active')
      .gte('subscription_start', thisMonthStart.toISOString()),
    // Expired subscriptions this month
    serviceClient.from('user_profiles').select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'expired')
      .gte('subscription_end', thisMonthStart.toISOString())
      .lte('subscription_end', now.toISOString()),
    // Total articles published
    serviceClient.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    // Articles published this month
    serviceClient.from('articles').select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('published_at', thisMonthStart.toISOString()),
    // Page views this month
    serviceClient.from('page_views').select('*', { count: 'exact', head: true })
      .gte('viewed_at', thisMonthStart.toISOString()),
    // Page views last month
    serviceClient.from('page_views').select('*', { count: 'exact', head: true })
      .gte('viewed_at', lastMonthStart.toISOString())
      .lte('viewed_at', lastMonthEnd.toISOString()),
    // All verified payments (for revenue calculations)
    serviceClient.from('payment_requests')
      .select('amount, tier, billing_cycle, payment_method, created_at, verified_at, status')
      .eq('status', 'verified')
      .order('created_at', { ascending: true }),
    // All subscriptions for LTV calculation (active + expired)
    serviceClient.from('user_profiles')
      .select('subscription_start, subscription_end, subscription_status, billing_cycle')
      .not('subscription_start', 'is', null),
    // Top articles by views this month
    serviceClient.from('page_views')
      .select('article_id, page_path')
      .not('article_id', 'is', null)
      .gte('viewed_at', thisMonthStart.toISOString()),
    // Users at start of month (created before this month) for churn denominator
    serviceClient.from('user_profiles').select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active')
      .lt('subscription_start', thisMonthStart.toISOString()),
    // Monthly user registrations for the last 6 months (raw data)
    serviceClient.from('user_profiles')
      .select('created_at')
      .gte('created_at', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString())
      .order('created_at', { ascending: true }),
  ]);

  // ─── Revenue calculations ─────────────────────────────────────────────────

  const payments = allPaymentsRes.data || [];
  let totalRevenue = 0;
  let thisMonthRevenue = 0;
  let lastMonthRevenue = 0;
  const monthlyRevenueMap: Record<string, number> = {};

  for (const p of payments) {
    const amount = p.amount || 0;
    totalRevenue += amount;
    const date = new Date(p.verified_at || p.created_at);
    if (date >= thisMonthStart) thisMonthRevenue += amount;
    if (date >= lastMonthStart && date <= lastMonthEnd) lastMonthRevenue += amount;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevenueMap[key] = (monthlyRevenueMap[key] || 0) + amount;
  }

  const revenueGrowthPercent = lastMonthRevenue > 0
    ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : thisMonthRevenue > 0 ? 100 : 0;

  // MRR: active subscribers x monthly equivalent price
  const premiumActive = premiumActiveRes.count || 0;
  const subscriptions = allSubscriptionsRes.data || [];

  // Calculate MRR based on actual billing cycles of active subscribers
  let mrr = 0;
  const activeSubscriptions = subscriptions.filter(s => s.subscription_status === 'active');
  for (const sub of activeSubscriptions) {
    const billingOption = BILLING_OPTIONS.find(b => b.cycle === sub.billing_cycle);
    if (billingOption) {
      // Convert to monthly equivalent
      mrr += billingOption.price / billingOption.durationMonths;
    } else {
      // Default to monthly price
      mrr += BILLING_OPTIONS[0].price;
    }
  }
  mrr = Math.round(mrr);

  const arr = mrr * 12;

  // Monthly revenue time series (last 6 months)
  const monthlyRevenue: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    monthlyRevenue.push({ month: label, revenue: monthlyRevenueMap[key] || 0 });
  }

  // ─── Subscriber metrics ───────────────────────────────────────────────────

  const totalUsers = totalUsersRes.count || 0;
  const newUsersThisMonth = newUsersThisMonthRes.count || 0;
  const newUsersLastMonth = newUsersLastMonthRes.count || 0;
  const newPremiumThisMonth = newPremiumThisMonthRes.count || 0;
  const expiredThisMonth = expiredThisMonthRes.count || 0;
  const subscribersStartOfMonth = (usersStartOfMonthRes.count || 0) + newPremiumThisMonth;

  // Churn rate
  const churnRate = subscribersStartOfMonth > 0
    ? parseFloat(((expiredThisMonth / subscribersStartOfMonth) * 100).toFixed(1))
    : 0;

  // LTV: average MRR per subscriber x average subscription duration
  let ltv = 0;
  const completedSubs = subscriptions.filter(s => s.subscription_start && s.subscription_end);
  if (completedSubs.length > 0 && premiumActive > 0) {
    let totalMonths = 0;
    for (const sub of completedSubs) {
      const start = new Date(sub.subscription_start);
      const end = new Date(sub.subscription_end);
      const months = Math.max(1, (end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000));
      totalMonths += months;
    }
    const avgMonths = totalMonths / completedSubs.length;
    const avgMrrPerSub = premiumActive > 0 ? mrr / premiumActive : 0;
    ltv = Math.round(avgMrrPerSub * avgMonths);
  }

  // Conversion rate
  const conversionRate = totalUsers > 0
    ? parseFloat(((premiumActive / totalUsers) * 100).toFixed(1))
    : 0;

  // ─── Content metrics ──────────────────────────────────────────────────────

  const totalArticles = totalArticlesRes.count || 0;
  const articlesThisMonth = articlesThisMonthRes.count || 0;
  const viewsThisMonth = viewsThisMonthRes.count || 0;
  const viewsLastMonth = viewsLastMonthRes.count || 0;
  const viewsGrowthPercent = viewsLastMonth > 0
    ? Math.round(((viewsThisMonth - viewsLastMonth) / viewsLastMonth) * 100)
    : viewsThisMonth > 0 ? 100 : 0;

  // Top article this month
  const articleViewMap: Record<string, number> = {};
  if (topArticleViewsRes.data) {
    for (const row of topArticleViewsRes.data) {
      articleViewMap[row.article_id] = (articleViewMap[row.article_id] || 0) + 1;
    }
  }
  let topArticle: { id: string; title: string; views: number } | null = null;
  const topArticleId = Object.entries(articleViewMap).sort(([, a], [, b]) => b - a)[0];
  if (topArticleId) {
    const { data: articleData } = await serviceClient
      .from('articles')
      .select('id, title')
      .eq('id', topArticleId[0])
      .single();
    if (articleData) {
      topArticle = { id: articleData.id, title: articleData.title, views: topArticleId[1] };
    }
  }

  // ─── Monthly users time series (last 6 months) ────────────────────────────

  const monthlyUsersMap: Record<string, number> = {};
  if (monthlyUsersRawRes.data) {
    for (const row of monthlyUsersRawRes.data) {
      const d = new Date(row.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyUsersMap[key] = (monthlyUsersMap[key] || 0) + 1;
    }
  }

  const monthlyUsers: { month: string; users: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    monthlyUsers.push({ month: label, users: monthlyUsersMap[key] || 0 });
  }

  // New users growth
  const newUsersGrowthPercent = newUsersLastMonth > 0
    ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
    : newUsersThisMonth > 0 ? 100 : 0;

  return NextResponse.json({
    // Revenue
    mrr,
    arr,
    thisMonthRevenue,
    lastMonthRevenue,
    revenueGrowthPercent,
    totalRevenue,
    monthlyRevenue,

    // Subscribers
    premiumActive,
    newPremiumThisMonth,
    expiredThisMonth,
    churnRate,
    ltv,

    // Acquisition
    totalUsers,
    newUsersThisMonth,
    newUsersGrowthPercent,
    conversionRate,

    // Content
    totalArticles,
    articlesThisMonth,
    topArticle,
    viewsThisMonth,
    viewsLastMonth,
    viewsGrowthPercent,

    // Charts
    monthlyRevenue_chart: monthlyRevenue,
    monthlyUsers_chart: monthlyUsers,
  });
}
