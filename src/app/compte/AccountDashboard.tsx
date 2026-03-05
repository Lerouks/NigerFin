'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  CreditCard,
  Mail,
  Bell,
  BarChart3,
  ArrowRight,
  Check,
  Loader2,
  Shield,
  Calendar,
  BookOpen,
  ExternalLink,
  Heart,
  Clock,
  TrendingUp,
  Zap,
  Crown,
  FileText,
  ChevronRight,
  Settings,
  LogOut,
  AlertTriangle,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getRoleLabel } from '@/lib/user-profile';
import { formatPrice, TIERS, cycleLabel } from '@/config/pricing';
import type { NewsletterPreferences, UserRole } from '@/types';

interface AccountSummary {
  subscription: {
    tier: string;
    status: string;
    billing_cycle: string;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    price_amount: number;
    created_at: string;
  } | null;
  likedArticlesCount: number;
  recentPayments: {
    id: string;
    amount: number;
    tier: string;
    billing_cycle: string;
    status: string;
    created_at: string;
  }[];
}

export function AccountDashboard() {
  const { isSignedIn, isLoading, user, profile, userRole, premiumArticlesUsed, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'subscription' | 'newsletter' | 'alerts'>('overview');
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [likedArticles, setLikedArticles] = useState<{ article_id: string; created_at: string }[]>([]);
  const [newsletterPrefs, setNewsletterPrefs] = useState<NewsletterPreferences>({
    newsletter_monthly: true,
    newsletter_weekly: false,
    alerts_news: false,
    alerts_custom: false,
    reports_pdf: false,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [subActionMsg, setSubActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isLoading && !isSignedIn) {
      router.push('/connexion');
    }
  }, [isLoading, isSignedIn, router]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const [summaryRes, likesRes, prefsRes] = await Promise.all([
        fetch('/api/user/account-summary'),
        fetch('/api/user/liked-articles'),
        fetch('/api/user/newsletter-prefs'),
      ]);
      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (likesRes.ok) setLikedArticles(await likesRes.json());
      if (prefsRes.ok) setNewsletterPrefs(await prefsRes.json());
    } catch {} finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) fetchSummary();
  }, [isSignedIn, fetchSummary]);

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    setSubActionMsg(null);
    try {
      const res = await fetch('/api/user/subscription', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setSubActionMsg({ type: 'success', text: data.message || 'Abonnement annule.' });
        setShowCancelConfirm(false);
        fetchSummary();
      } else {
        setSubActionMsg({ type: 'error', text: data.error || 'Erreur lors de l\'annulation.' });
      }
    } catch {
      setSubActionMsg({ type: 'error', text: 'Erreur reseau. Veuillez reessayer.' });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setReactivateLoading(true);
    setSubActionMsg(null);
    try {
      const res = await fetch('/api/user/subscription', { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) {
        setSubActionMsg({ type: 'success', text: data.message || 'Abonnement reactive.' });
        fetchSummary();
      } else {
        setSubActionMsg({ type: 'error', text: data.error || 'Erreur lors de la reactivation.' });
      }
    } catch {
      setSubActionMsg({ type: 'error', text: 'Erreur reseau. Veuillez reessayer.' });
    } finally {
      setReactivateLoading(false);
    }
  };

  const handleSaveNewsletterPrefs = async () => {
    setSavingPrefs(true);
    try {
      await fetch('/api/user/newsletter-prefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newsletterPrefs),
      });
    } catch {} finally {
      setSavingPrefs(false);
    }
  };

  if (isLoading || !isSignedIn) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const isSubscribed = userRole === 'standard' || userRole === 'pro' || userRole === 'admin';
  const sub = summary?.subscription;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const tabs = [
    { id: 'overview' as const, label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'subscription' as const, label: 'Abonnement', icon: CreditCard },
    { id: 'newsletter' as const, label: 'Newsletter', icon: Mail },
    { id: 'alerts' as const, label: 'Alertes', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Hero header */}
      <section className="bg-[#111] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl flex items-center justify-center text-2xl font-bold border border-white/10">
              {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {profile?.full_name || user?.email?.split('@')[0]}
                </h1>
                <span className={`text-[10px] tracking-[0.15em] uppercase px-3 py-1 rounded-full font-medium ${
                  userRole === 'pro' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                  userRole === 'standard' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  userRole === 'admin' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                  'bg-white/10 text-white/50 border border-white/10'
                }`}>
                  {getRoleLabel(userRole || 'reader')}
                </span>
              </div>
              <p className="text-white/40 text-sm">{user?.email}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => { await signOut(); router.push('/'); }}
                className="flex items-center gap-2 px-4 py-2 text-[13px] text-white/40 hover:text-white/80 hover:bg-white/5 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>

          {/* Quick stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            <QuickStat
              icon={Shield}
              label="Plan"
              value={getRoleLabel(userRole || 'reader')}
              accent={isSubscribed}
            />
            <QuickStat
              icon={BookOpen}
              label="Articles lus"
              value={userRole === 'reader' ? `${premiumArticlesUsed}/3` : 'Illimité'}
              accent={isSubscribed}
            />
            <QuickStat
              icon={Heart}
              label="Articles sauvegardés"
              value={summaryLoading ? '...' : String(summary?.likedArticlesCount || 0)}
            />
            <QuickStat
              icon={Calendar}
              label="Membre depuis"
              value={memberSince}
            />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab navigation */}
        <div className="flex gap-1 mb-8 bg-white rounded-xl p-1.5 border border-black/[0.06] shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] transition-all flex-1 justify-center font-medium ${
                activeTab === tab.id
                  ? 'bg-[#111] text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Subscription status card (for subscribers) */}
            {isSubscribed && sub && (
              <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] text-white rounded-2xl p-8 border border-white/5">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-5 h-5 text-amber-400" />
                      <span className="text-[11px] tracking-[0.15em] uppercase text-white/40">Abonnement actif</span>
                    </div>
                    <h2 className="text-2xl font-bold">
                      {sub.tier === 'pro' ? 'Pro' : 'Standard'} — {cycleLabel(sub.billing_cycle as 'monthly' | 'quarterly' | 'yearly')}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{(sub.price_amount || 0).toLocaleString('fr-FR')}</p>
                    <p className="text-white/40 text-sm">FCFA/{sub.billing_cycle === 'monthly' ? 'mois' : sub.billing_cycle === 'quarterly' ? 'trim.' : 'an'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">Statut</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-sm font-medium">Actif</span>
                    </div>
                  </div>
                  {periodEnd && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">Prochain renouvellement</p>
                      <p className="text-sm font-medium">{periodEnd}</p>
                    </div>
                  )}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">Accès</p>
                    <p className="text-sm font-medium">
                      {userRole === 'pro' ? 'Complet (PDF + Archives)' : 'Articles illimités'}
                    </p>
                  </div>
                </div>

                {sub.cancel_at_period_end && (
                  <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-amber-300 text-sm">
                    Votre abonnement sera annulé le {periodEnd}. Vous conservez l&apos;accès jusque-là.
                  </div>
                )}
              </div>
            )}

            {/* Upgrade CTA (for free users only) */}
            {!isSubscribed && (
              <div className="bg-gradient-to-br from-[#111] to-[#222] text-white rounded-2xl p-8 border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span className="text-[11px] tracking-[0.15em] uppercase text-white/40">Passez Premium</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Débloquez un accès illimité</h2>
                <p className="text-white/50 text-sm mb-6 max-w-lg">
                  Accédez à tous les articles, analyses, outils premium et newsletters exclusives.
                  Rejoingnez les professionnels qui font confiance à NFI Report.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-xl text-[14px] font-medium hover:bg-white/90 transition-colors"
                  >
                    Voir les plans <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* Features grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Articles sauvegardés */}
              <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-400" />
                    <h3 className="font-semibold text-[15px]">Articles sauvegardés</h3>
                  </div>
                  <span className="text-[12px] text-gray-400">{summary?.likedArticlesCount || 0} articles</span>
                </div>
                {likedArticles.length > 0 ? (
                  <ul className="space-y-2">
                    {likedArticles.slice(0, 5).map((like) => (
                      <li key={like.article_id} className="flex items-center justify-between py-2 border-b border-black/[0.03] last:border-0">
                        <span className="text-sm text-gray-600 truncate flex-1">{like.article_id}</span>
                        <span className="text-[11px] text-gray-400 ml-2 flex-shrink-0">
                          {new Date(like.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 py-4 text-center">
                    Aucun article sauvegardé. Cliquez sur le coeur d&apos;un article pour le sauvegarder.
                  </p>
                )}
              </div>

              {/* Activité récente / Paiements */}
              <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <h3 className="font-semibold text-[15px]">Historique des paiements</h3>
                </div>
                {summary?.recentPayments && summary.recentPayments.length > 0 ? (
                  <ul className="space-y-2">
                    {summary.recentPayments.map((payment) => (
                      <li key={payment.id} className="flex items-center justify-between py-2 border-b border-black/[0.03] last:border-0">
                        <div>
                          <p className="text-sm font-medium capitalize">{payment.tier} — {cycleLabel(payment.billing_cycle as 'monthly' | 'quarterly' | 'yearly')}</p>
                          <p className="text-[11px] text-gray-400">
                            {new Date(payment.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{payment.amount.toLocaleString('fr-FR')} F</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            payment.status === 'verified' ? 'bg-emerald-50 text-emerald-600' :
                            payment.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                            'bg-red-50 text-red-600'
                          }`}>
                            {payment.status === 'verified' ? 'Vérifié' : payment.status === 'pending' ? 'En attente' : 'Rejeté'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 py-4 text-center">Aucun paiement enregistré.</p>
                )}
              </div>
            </div>

            {/* Avantages du plan */}
            {isSubscribed && (
              <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-semibold text-[15px]">Vos avantages {userRole === 'pro' ? 'Pro' : 'Standard'}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(userRole === 'pro' ? TIERS.pro.features : TIERS.standard.features).map((feature) => (
                    <div key={feature} className="flex items-start gap-2 p-3 bg-[#fafaf9] rounded-lg">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-[13px] text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── SUBSCRIPTION TAB ─── */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            {/* Action feedback message */}
            {subActionMsg && (
              <div className={`rounded-xl px-5 py-4 text-sm flex items-start gap-3 ${
                subActionMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {subActionMsg.type === 'success' ? <Check className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                <span>{subActionMsg.text}</span>
              </div>
            )}

            {/* ── Subscription details ── */}
            <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
              <h3 className="text-lg font-semibold mb-5">Details de l&apos;abonnement</h3>

              {/* Infos utilisateur */}
              <div className="mb-6 p-4 bg-[#fafaf9] rounded-xl">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-3">Informations du compte</p>
                <div className="space-y-2">
                  <InfoRow label="Email" value={user?.email || '—'} />
                  {profile?.full_name && <InfoRow label="Nom" value={profile.full_name} />}
                  <InfoRow label="Membre depuis" value={memberSince} />
                  <InfoRow
                    label="Statut du compte"
                    value={isSignedIn ? 'Actif' : 'Inactif'}
                    valueColor={isSignedIn ? 'text-emerald-600' : 'text-gray-400'}
                  />
                </div>
              </div>

              {/* Infos abonnement */}
              <div className="space-y-3">
                <InfoRow label="Plan actuel" value={
                  userRole === 'pro' ? 'Pro' :
                  userRole === 'standard' ? 'Populaire (Standard)' :
                  userRole === 'admin' ? 'Administrateur' : 'Lecteur (gratuit)'
                } />
                <InfoRow
                  label="Statut abonnement"
                  value={
                    sub?.cancel_at_period_end ? 'Annulation programmee'
                    : sub?.status === 'active' ? 'Actif'
                    : profile?.subscription_status === 'active' ? 'Actif'
                    : 'Inactif'
                  }
                  valueColor={
                    sub?.cancel_at_period_end ? 'text-amber-600'
                    : (sub?.status === 'active' || profile?.subscription_status === 'active') ? 'text-emerald-600'
                    : 'text-gray-400'
                  }
                />
                {profile?.billing_cycle && (
                  <InfoRow label="Cycle de facturation" value={cycleLabel(profile.billing_cycle as 'monthly' | 'quarterly' | 'yearly')} />
                )}
                {sub?.price_amount != null && sub.price_amount > 0 && (
                  <InfoRow label="Montant" value={`${sub.price_amount.toLocaleString('fr-FR')} FCFA`} />
                )}
                {sub?.current_period_start && (
                  <InfoRow label="Debut de la periode" value={
                    new Date(sub.current_period_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                  } />
                )}
                {periodEnd && (
                  <InfoRow label={sub?.cancel_at_period_end ? 'Fin d\'acces' : 'Prochain renouvellement'} value={periodEnd} />
                )}
              </div>

              {/* Cancellation warning */}
              {sub?.cancel_at_period_end && (
                <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Annulation programmee</p>
                    <p className="text-[13px] text-amber-700 mt-1">
                      Votre abonnement ne sera pas renouvele. Vous conservez l&apos;acces jusqu&apos;au {periodEnd}.
                    </p>
                    <button
                      onClick={handleReactivateSubscription}
                      disabled={reactivateLoading}
                      className="mt-3 inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-[13px] hover:bg-amber-700 transition-colors"
                    >
                      {reactivateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Reactiver mon abonnement
                    </button>
                  </div>
                </div>
              )}

              {/* Expired subscription */}
              {!isSubscribed && summary?.recentPayments && summary.recentPayments.length > 0 && (
                <div className="mt-5 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Abonnement expire</p>
                    <p className="text-[13px] text-gray-500 mt-1">
                      Votre abonnement precedent a expire. Renouvelez-le pour retrouver l&apos;acces a tous les contenus.
                    </p>
                    <Link
                      href="/pricing"
                      className="mt-3 inline-flex items-center gap-2 bg-[#111] text-white px-4 py-2 rounded-lg text-[13px] hover:bg-[#333] transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Renouveler mon abonnement
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* ── Actions: Modify / Cancel ── */}
            <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
              <h3 className="text-lg font-semibold mb-5">Actions</h3>
              <div className="space-y-4">
                {/* Change plan */}
                {isSubscribed && (
                  <div className="flex items-center justify-between p-4 rounded-xl border border-black/[0.04]">
                    <div>
                      <p className="text-sm font-medium">Modifier mon abonnement</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">
                        {userRole === 'standard'
                          ? 'Passez au plan Pro pour plus d\'avantages'
                          : userRole === 'pro'
                          ? 'Changez de cycle ou passez au plan Standard'
                          : 'Voir les plans disponibles'}
                      </p>
                    </div>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-2 bg-[#111] text-white px-5 py-2.5 rounded-xl text-[13px] hover:bg-[#333] transition-colors flex-shrink-0"
                    >
                      Changer de plan <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}

                {/* Subscribe (for free users) */}
                {!isSubscribed && (
                  <div className="flex items-center justify-between p-4 rounded-xl border border-black/[0.04]">
                    <div>
                      <p className="text-sm font-medium">S&apos;abonner</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">
                        Accedez a tous les articles et outils premium
                      </p>
                    </div>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-2 bg-[#111] text-white px-5 py-2.5 rounded-xl text-[13px] hover:bg-[#333] transition-colors flex-shrink-0"
                    >
                      Voir les plans <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}

                {/* Cancel */}
                {isSubscribed && !sub?.cancel_at_period_end && userRole !== 'admin' && (
                  <div className="flex items-center justify-between p-4 rounded-xl border border-red-100 bg-red-50/50">
                    <div>
                      <p className="text-sm font-medium text-red-800">Resilier mon abonnement</p>
                      <p className="text-[12px] text-red-600/70 mt-0.5">
                        Vous conserverez l&apos;acces jusqu&apos;a la fin de la periode en cours
                      </p>
                    </div>
                    {!showCancelConfirm ? (
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="inline-flex items-center gap-2 border border-red-300 text-red-700 px-5 py-2.5 rounded-xl text-[13px] hover:bg-red-100 transition-colors flex-shrink-0"
                      >
                        Resilier
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setShowCancelConfirm(false)}
                          className="px-4 py-2.5 rounded-xl text-[13px] text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleCancelSubscription}
                          disabled={cancelLoading}
                          className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl text-[13px] hover:bg-red-700 transition-colors"
                        >
                          {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          Confirmer la resiliation
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Upgrade section for standard users ── */}
            {userRole === 'standard' && (
              <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-2xl border border-purple-200/50 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold text-[15px]">Passez a Pro</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Accedez aux rapports PDF, alertes personnalisees, archives completes et support prioritaire.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-5">
                  {TIERS.pro.features.map((f) => (
                    <div key={f} className="flex items-start gap-2 p-2">
                      <Check className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span className="text-[12px] text-gray-600">{f}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl text-[13px] hover:bg-purple-700 transition-colors"
                >
                  Decouvrir Pro <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* ── Payment history ── */}
            {summary?.recentPayments && summary.recentPayments.length > 0 && (
              <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <h3 className="font-semibold text-[15px]">Historique des paiements</h3>
                </div>
                <ul className="space-y-2">
                  {summary.recentPayments.map((payment) => (
                    <li key={payment.id} className="flex items-center justify-between py-3 px-4 border border-black/[0.03] rounded-lg">
                      <div>
                        <p className="text-sm font-medium capitalize">{payment.tier} — {cycleLabel(payment.billing_cycle as 'monthly' | 'quarterly' | 'yearly')}</p>
                        <p className="text-[11px] text-gray-400">
                          {new Date(payment.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{payment.amount.toLocaleString('fr-FR')} FCFA</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          payment.status === 'verified' ? 'bg-emerald-50 text-emerald-600' :
                          payment.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {payment.status === 'verified' ? 'Verifie' : payment.status === 'pending' ? 'En attente' : 'Rejete'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pending payment notice */}
            {summary?.recentPayments?.some(p => p.status === 'pending') && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Paiement en attente de verification</p>
                  <p className="text-[13px] text-amber-700 mt-1">
                    Votre paiement sera verifie sous 24h. Votre abonnement sera active des la verification.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── NEWSLETTER TAB ─── */}
        {activeTab === 'newsletter' && (
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
            <h3 className="text-lg font-semibold mb-6">Préférences newsletter</h3>
            <div className="space-y-4">
              <ToggleRow
                label="Newsletter mensuelle"
                description="Résumé mensuel des actualités économiques"
                checked={newsletterPrefs.newsletter_monthly}
                onChange={(v) => setNewsletterPrefs((p) => ({ ...p, newsletter_monthly: v }))}
              />
              <ToggleRow
                label="Newsletter hebdomadaire"
                description="Analyses et actualités chaque semaine"
                checked={newsletterPrefs.newsletter_weekly}
                onChange={(v) => setNewsletterPrefs((p) => ({ ...p, newsletter_weekly: v }))}
                disabled={!isSubscribed}
                disabledMessage="Standard ou Pro requis"
              />
              <ToggleRow
                label="Rapports PDF"
                description="Recevez les rapports exclusifs en PDF"
                checked={newsletterPrefs.reports_pdf}
                onChange={(v) => setNewsletterPrefs((p) => ({ ...p, reports_pdf: v }))}
                disabled={userRole !== 'pro' && userRole !== 'admin'}
                disabledMessage="Pro requis"
              />
            </div>
            <button
              onClick={handleSaveNewsletterPrefs}
              disabled={savingPrefs}
              className="mt-6 flex items-center gap-2 bg-[#111] text-white px-6 py-2.5 rounded-xl text-[13px] hover:bg-[#333] transition-colors"
            >
              {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        )}

        {/* ─── ALERTS TAB ─── */}
        {activeTab === 'alerts' && (
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
            <h3 className="text-lg font-semibold mb-6">Alertes</h3>
            <div className="space-y-4">
              <ToggleRow
                label="Alertes actualités majeures"
                description="Soyez alerté des événements économiques importants"
                checked={newsletterPrefs.alerts_news}
                onChange={(v) => setNewsletterPrefs((p) => ({ ...p, alerts_news: v }))}
                disabled={!isSubscribed}
                disabledMessage="Standard ou Pro requis"
              />
              <ToggleRow
                label="Alertes personnalisées"
                description="Créez des alertes sur des sujets spécifiques"
                checked={newsletterPrefs.alerts_custom}
                onChange={(v) => setNewsletterPrefs((p) => ({ ...p, alerts_custom: v }))}
                disabled={userRole !== 'pro' && userRole !== 'admin'}
                disabledMessage="Pro requis"
              />
            </div>
            <button
              onClick={handleSaveNewsletterPrefs}
              disabled={savingPrefs}
              className="mt-6 flex items-center gap-2 bg-[#111] text-white px-6 py-2.5 rounded-xl text-[13px] hover:bg-[#333] transition-colors"
            >
              {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickStat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-4 border border-white/[0.06]">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`w-3.5 h-3.5 ${accent ? 'text-amber-400' : 'text-white/30'}`} />
        <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[15px] font-semibold text-white truncate">{value}</p>
    </div>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-black/[0.04] last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${valueColor || ''}`}>{value}</span>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
  disabledMessage,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  disabledMessage?: string;
}) {
  return (
    <div className={`flex items-start justify-between p-4 rounded-xl border border-black/[0.04] ${disabled ? 'opacity-50' : ''}`}>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[12px] text-gray-500 mt-0.5">{description}</p>
        {disabled && disabledMessage && (
          <span className="text-[11px] text-amber-600 mt-1 inline-block">
            {disabledMessage}
          </span>
        )}
      </div>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${
          checked ? 'bg-[#111]' : 'bg-gray-200'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
