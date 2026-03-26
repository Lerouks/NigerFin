'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BarChart3, Loader2, Shield, Calendar, BookOpen, Heart,
  CreditCard, Mail, Bell, Check, Lock, Eye, EyeOff, XCircle, LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getRoleLabel } from '@/lib/user-profile';
import type { NewsletterPreferences } from '@/types';
import { AccountOverviewTab } from './AccountOverviewTab';
import { AccountSubscriptionTab } from './AccountSubscriptionTab';

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

export function AccountDashboard() {
  const { isSignedIn, isLoading, user, profile, userRole, premiumArticlesUsed, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPasswordReset = searchParams.get('reset') === 'true';
  const [activeTab, setActiveTab] = useState<'overview' | 'subscription' | 'security' | 'newsletter' | 'alerts'>(isPasswordReset ? 'security' : 'overview');
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
  const [premiumLimit, setPremiumLimit] = useState(3);

  useEffect(() => {
    if (!isLoading && !isSignedIn) router.push('/connexion');
  }, [isLoading, isSignedIn, router]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      await refreshProfile();
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
  }, [refreshProfile]);

  useEffect(() => {
    if (isSignedIn) fetchSummary();
  }, [isSignedIn, fetchSummary]);

  useEffect(() => {
    fetch('/api/paywall-config')
      .then((r) => r.ok ? r.json() : null)
      .then((cfg) => { if (cfg?.free_articles_count) setPremiumLimit(cfg.free_articles_count); })
      .catch(() => {});
  }, []);

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

  const isSubscribed = userRole === 'premium' || userRole === 'admin';
  const isExpired = profile?.subscription_status === 'expired';
  const sub = summary?.subscription ?? null;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '-';
  const rawPeriodEnd = profile?.subscription_end || sub?.current_period_end;
  const periodEnd = rawPeriodEnd
    ? new Date(rawPeriodEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const tabs = [
    { id: 'overview' as const, label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'subscription' as const, label: 'Abonnement', icon: CreditCard },
    { id: 'security' as const, label: 'Sécurité', icon: Lock },
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
                  userRole === 'premium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  userRole === 'admin' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                  'bg-white/10 text-white/50 border border-white/10'
                }`}>
                  {getRoleLabel(userRole || 'reader')}
                </span>
              </div>
              <p className="text-white/40 text-sm">{user?.email}</p>
            </div>
            <button
              onClick={async () => { await signOut(); router.push('/'); }}
              className="flex items-center gap-2 px-4 py-2 text-[13px] text-white/40 hover:text-white/80 hover:bg-white/5 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" /> Déconnexion
            </button>
          </div>

          {/* Quick stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            <QuickStat icon={Shield} label="Plan" value={getRoleLabel(userRole || 'reader')} accent={isSubscribed} />
            <QuickStat icon={BookOpen} label="Articles lus" value={userRole === 'reader' ? `${premiumArticlesUsed}/${premiumLimit} premium` : 'Illimité'} accent={isSubscribed} />
            <QuickStat icon={Heart} label="Articles sauvegardés" value={summaryLoading ? '...' : String(summary?.likedArticlesCount || 0)} />
            <QuickStat icon={Calendar} label="Membre depuis" value={memberSince} />
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
                activeTab === tab.id ? 'bg-[#111] text-white shadow-sm' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <AccountOverviewTab
            isSubscribed={isSubscribed}
            sub={sub}
            periodEnd={periodEnd}
            summary={summary}
            likedArticles={likedArticles}
          />
        )}

        {activeTab === 'subscription' && (
          <AccountSubscriptionTab
            user={user}
            profile={profile}
            userRole={userRole}
            isSubscribed={isSubscribed}
            isExpired={isExpired}
            sub={sub}
            periodEnd={periodEnd}
            memberSince={memberSince}
            recentPayments={summary?.recentPayments || []}
            onRefresh={fetchSummary}
          />
        )}

        {activeTab === 'security' && (
          <PasswordChangeSection isReset={isPasswordReset} />
        )}

        {activeTab === 'newsletter' && (
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
            <h3 className="text-lg font-semibold mb-6">Préférences newsletter</h3>
            <div className="space-y-4">
              <ToggleRow label="Newsletter mensuelle" description="Résumé mensuel des actualités économiques" checked={newsletterPrefs.newsletter_monthly} onChange={(v) => setNewsletterPrefs((p) => ({ ...p, newsletter_monthly: v }))} />
              <ToggleRow label="Newsletter hebdomadaire" description="Analyses et actualités chaque semaine" checked={newsletterPrefs.newsletter_weekly} onChange={(v) => setNewsletterPrefs((p) => ({ ...p, newsletter_weekly: v }))} disabled={!isSubscribed} disabledMessage="Premium requis" />
              <ToggleRow label="Rapports PDF" description="Recevez les rapports exclusifs en PDF" checked={newsletterPrefs.reports_pdf} onChange={(v) => setNewsletterPrefs((p) => ({ ...p, reports_pdf: v }))} disabled={!isSubscribed} disabledMessage="Premium requis" />
            </div>
            <button onClick={handleSaveNewsletterPrefs} disabled={savingPrefs} className="mt-6 flex items-center gap-2 bg-[#111] text-white px-6 py-2.5 rounded-xl text-[13px] hover:bg-[#333] transition-colors">
              {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Enregistrer
            </button>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
            <h3 className="text-lg font-semibold mb-6">Alertes</h3>
            <div className="space-y-4">
              <ToggleRow label="Alertes actualités majeures" description="Soyez alerté des événements économiques importants" checked={newsletterPrefs.alerts_news} onChange={(v) => setNewsletterPrefs((p) => ({ ...p, alerts_news: v }))} disabled={!isSubscribed} disabledMessage="Premium requis" />
              <ToggleRow label="Alertes personnalisées" description="Créez des alertes sur des sujets spécifiques" checked={newsletterPrefs.alerts_custom} onChange={(v) => setNewsletterPrefs((p) => ({ ...p, alerts_custom: v }))} disabled={!isSubscribed} disabledMessage="Premium requis" />
            </div>
            <button onClick={handleSaveNewsletterPrefs} disabled={savingPrefs} className="mt-6 flex items-center gap-2 bg-[#111] text-white px-6 py-2.5 rounded-xl text-[13px] hover:bg-[#333] transition-colors">
              {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Enregistrer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function QuickStat({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent?: boolean }) {
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

function getPasswordStrength(password: string): { level: 'weak' | 'medium' | 'strong'; label: string; color: string; bgColor: string; width: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 'weak', label: 'Faible', color: 'text-red-600', bgColor: 'bg-red-500', width: 'w-1/3' };
  if (score <= 3) return { level: 'medium', label: 'Moyen', color: 'text-amber-600', bgColor: 'bg-amber-500', width: 'w-2/3' };
  return { level: 'strong', label: 'Fort', color: 'text-emerald-600', bgColor: 'bg-emerald-500', width: 'w-full' };
}

function PasswordChangeSection({ isReset = false }: { isReset?: boolean }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const strength = newPassword ? getPasswordStrength(newPassword) : null;
  const passwordsMatch = confirmPassword ? newPassword === confirmPassword : true;
  const canSubmit = (isReset || currentPassword) && newPassword.length >= 8 && newPassword === confirmPassword && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }

    setLoading(true);

    if (isReset) {
      try {
        const { createBrowserSupabaseClient } = await import('@/lib/supabase-browser');
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          setMessage({ type: 'error', text: error.message || 'Erreur lors de la mise à jour du mot de passe.' });
        } else {
          setMessage({ type: 'success', text: 'Votre mot de passe a été mis à jour avec succès.' });
          setNewPassword('');
          setConfirmPassword('');
          router.replace('/compte');
        }
      } catch {
        setMessage({ type: 'error', text: 'Erreur réseau. Veuillez réessayer.' });
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Votre mot de passe a été mis à jour avec succès.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Une erreur est survenue.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
      <div className="flex items-center gap-2 mb-2">
        <Lock className="w-4 h-4 text-gray-500" />
        <h3 className="text-lg font-semibold">{isReset ? 'Définir un nouveau mot de passe' : 'Modifier le mot de passe'}</h3>
      </div>
      {isReset && <p className="text-sm text-gray-500 mb-6">Vous avez demandé une réinitialisation de mot de passe. Définissez votre nouveau mot de passe ci-dessous.</p>}
      {!isReset && <div className="mb-6" />}

      {message && (
        <div className={`rounded-xl px-5 py-4 text-sm flex items-start gap-3 mb-6 ${
          message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
        {!isReset && (
          <PasswordField id="current-password" label="Mot de passe actuel" value={currentPassword} onChange={setCurrentPassword} show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} placeholder="Entrez votre mot de passe actuel" required />
        )}

        <div>
          <PasswordField id="new-password" label="Nouveau mot de passe" value={newPassword} onChange={setNewPassword} show={showNew} onToggle={() => setShowNew(!showNew)} placeholder="Minimum 8 caractères" required minLength={8} />
          {newPassword && strength && (
            <div className="mt-2">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${strength.bgColor} ${strength.width} rounded-full transition-all duration-300`} />
              </div>
              <p className={`text-[11px] mt-1 ${strength.color}`}>Force du mot de passe : {strength.label}</p>
            </div>
          )}
          {newPassword && newPassword.length < 8 && (
            <p className="text-[11px] mt-1 text-red-500">Le mot de passe doit contenir au moins 8 caractères.</p>
          )}
        </div>

        <div>
          <PasswordField id="confirm-password" label="Confirmer le nouveau mot de passe" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} placeholder="Confirmez le nouveau mot de passe" required
            className={confirmPassword && !passwordsMatch ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : undefined} />
          {confirmPassword && !passwordsMatch && (
            <p className="text-[11px] mt-1 text-red-500">Les mots de passe ne correspondent pas.</p>
          )}
        </div>

        <button type="submit" disabled={!canSubmit} className="flex items-center gap-2 bg-[#111] text-white px-6 py-2.5 rounded-xl text-[13px] hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Mettre à jour le mot de passe
        </button>
      </form>
    </div>
  );
}

function PasswordField({ id, label, value, onChange, show, onToggle, placeholder, required, minLength, className }: {
  id: string; label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; placeholder: string; required?: boolean; minLength?: number; className?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-2">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full border rounded-lg pl-10 pr-10 py-3 bg-[#fafaf9] focus:outline-none focus:ring-1 transition-all text-sm ${
            className || 'border-black/[0.08] focus:border-black/15 focus:ring-black/5'
          }`}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
        />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange, disabled, disabledMessage }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; disabledMessage?: string;
}) {
  return (
    <div className={`flex items-start justify-between p-4 rounded-xl border border-black/[0.04] ${disabled ? 'opacity-50' : ''}`}>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[12px] text-gray-500 mt-0.5">{description}</p>
        {disabled && disabledMessage && <span className="text-[11px] text-amber-600 mt-1 inline-block">{disabledMessage}</span>}
      </div>
      <button onClick={() => !disabled && onChange(!checked)} disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${checked ? 'bg-[#111]' : 'bg-gray-200'}`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
