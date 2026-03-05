'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getRoleLabel } from '@/lib/user-profile';
import type { NewsletterPreferences, UserRole } from '@/types';

export function AccountDashboard() {
  const { isSignedIn, isLoading, user, profile, userRole, premiumArticlesUsed, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'subscription' | 'newsletter' | 'alerts'>('overview');
  const [newsletterPrefs, setNewsletterPrefs] = useState<NewsletterPreferences>({
    newsletter_monthly: true,
    newsletter_weekly: false,
    alerts_news: false,
    alerts_custom: false,
    reports_pdf: false,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isSignedIn) {
      router.push('/connexion');
    }
  }, [isLoading, isSignedIn, router]);

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/user/newsletter-prefs')
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data) setNewsletterPrefs(data);
        })
        .catch(() => {});
    }
  }, [isSignedIn]);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {} finally {
      setPortalLoading(false);
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

  const tabs = [
    { id: 'overview' as const, label: 'Aperçu', icon: BarChart3 },
    { id: 'subscription' as const, label: 'Abonnement', icon: CreditCard },
    { id: 'newsletter' as const, label: 'Newsletter', icon: Mail },
    { id: 'alerts' as const, label: 'Alertes', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <section className="bg-[#111] text-white py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-xl font-bold">
              {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profile?.full_name || user?.email?.split('@')[0]}</h1>
              <p className="text-white/40 text-sm">{user?.email}</p>
            </div>
            <div className="ml-auto">
              <span className={`text-[11px] tracking-[0.12em] uppercase px-3 py-1.5 rounded-full ${
                userRole === 'pro' ? 'bg-purple-500/20 text-purple-300' :
                userRole === 'standard' ? 'bg-amber-500/20 text-amber-300' :
                'bg-white/10 text-white/60'
              }`}>
                {getRoleLabel(userRole || 'reader')}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab navigation */}
        <div className="flex gap-1 mb-8 bg-white rounded-lg p-1 border border-black/[0.06]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-[13px] transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-[#111] text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                icon={Shield}
                label="Plan actuel"
                value={getRoleLabel(userRole || 'reader')}
              />
              <StatCard
                icon={BookOpen}
                label="Articles premium lus ce mois"
                value={userRole === 'reader' ? `${premiumArticlesUsed}/3` : 'Illimité'}
              />
              <StatCard
                icon={Calendar}
                label="Membre depuis"
                value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '—'}
              />
            </div>

            {userRole === 'reader' && (
              <div className="bg-gradient-to-r from-[#111] to-[#333] text-white rounded-xl p-8">
                <h3 className="text-xl font-bold mb-2">Passez à Standard</h3>
                <p className="text-white/60 text-sm mb-4">
                  Accédez à tous les articles, analyses et outils premium sans aucune limite.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-lg text-[13px] hover:bg-white/90 transition-colors"
                >
                  Voir les abonnements <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-black/[0.06] p-6">
              <h3 className="text-lg font-semibold mb-4">Mon abonnement</h3>
              <div className="space-y-3">
                <InfoRow label="Plan" value={getRoleLabel(userRole || 'reader')} />
                <InfoRow label="Statut" value={profile?.subscription_status === 'active' ? 'Actif' : 'Inactif'} />
                {profile?.billing_cycle && (
                  <InfoRow label="Cycle de facturation" value={
                    profile.billing_cycle === 'monthly' ? 'Mensuel' :
                    profile.billing_cycle === 'quarterly' ? 'Trimestriel' : 'Annuel'
                  } />
                )}
              </div>

              {(userRole === 'standard' || userRole === 'pro') && (
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="mt-6 flex items-center gap-2 bg-[#111] text-white px-6 py-2.5 rounded-lg text-[13px] hover:bg-[#333] transition-colors"
                >
                  {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                  Gérer mon abonnement
                </button>
              )}

              {userRole === 'reader' && (
                <Link
                  href="/pricing"
                  className="mt-6 inline-flex items-center gap-2 bg-[#111] text-white px-6 py-2.5 rounded-lg text-[13px] hover:bg-[#333] transition-colors"
                >
                  S&apos;abonner <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Newsletter Tab */}
        {activeTab === 'newsletter' && (
          <div className="bg-white rounded-xl border border-black/[0.06] p-6">
            <h3 className="text-lg font-semibold mb-6">Préférences newsletter</h3>
            <div className="space-y-4">
              <ToggleRow
                label="Newsletter mensuelle"
                description="Recevez un résumé mensuel des actualités économiques"
                checked={newsletterPrefs.newsletter_monthly}
                onChange={(v) => setNewsletterPrefs((p) => ({ ...p, newsletter_monthly: v }))}
              />
              <ToggleRow
                label="Newsletter hebdomadaire"
                description="Analyses et actualités chaque semaine"
                checked={newsletterPrefs.newsletter_weekly}
                onChange={(v) => setNewsletterPrefs((p) => ({ ...p, newsletter_weekly: v }))}
                disabled={userRole === 'reader'}
                disabledMessage="Disponible avec Standard"
              />
              <ToggleRow
                label="Rapports PDF"
                description="Recevez les rapports exclusifs en PDF"
                checked={newsletterPrefs.reports_pdf}
                onChange={(v) => setNewsletterPrefs((p) => ({ ...p, reports_pdf: v }))}
                disabled={userRole !== 'pro'}
                disabledMessage="Disponible avec Pro"
              />
            </div>
            <button
              onClick={handleSaveNewsletterPrefs}
              disabled={savingPrefs}
              className="mt-6 flex items-center gap-2 bg-[#111] text-white px-6 py-2.5 rounded-lg text-[13px] hover:bg-[#333] transition-colors"
            >
              {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="bg-white rounded-xl border border-black/[0.06] p-6">
            <h3 className="text-lg font-semibold mb-6">Alertes</h3>
            <div className="space-y-4">
              <ToggleRow
                label="Alertes actualités majeures"
                description="Soyez alerté des événements économiques importants"
                checked={newsletterPrefs.alerts_news}
                onChange={(v) => setNewsletterPrefs((p) => ({ ...p, alerts_news: v }))}
                disabled={userRole === 'reader'}
                disabledMessage="Disponible avec Standard"
              />
              <ToggleRow
                label="Alertes personnalisées"
                description="Créez des alertes sur des sujets spécifiques"
                checked={newsletterPrefs.alerts_custom}
                onChange={(v) => setNewsletterPrefs((p) => ({ ...p, alerts_custom: v }))}
                disabled={userRole !== 'pro'}
                disabledMessage="Disponible avec Pro"
              />
            </div>
            <button
              onClick={handleSaveNewsletterPrefs}
              disabled={savingPrefs}
              className="mt-6 flex items-center gap-2 bg-[#111] text-white px-6 py-2.5 rounded-lg text-[13px] hover:bg-[#333] transition-colors"
            >
              {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        )}

        {/* Sign out */}
        <div className="mt-8 text-center">
          <button
            onClick={async () => { await signOut(); router.push('/'); }}
            className="text-sm text-gray-400 hover:text-red-600 transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-black/[0.06] p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-[12px] text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-black/[0.04] last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium">{value}</span>
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
    <div className={`flex items-start justify-between p-4 rounded-lg border border-black/[0.04] ${disabled ? 'opacity-60' : ''}`}>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[12px] text-gray-500 mt-0.5">{description}</p>
        {disabled && disabledMessage && (
          <Link href="/pricing" className="text-[11px] text-blue-600 hover:underline mt-1 inline-block">
            {disabledMessage} &rarr;
          </Link>
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
