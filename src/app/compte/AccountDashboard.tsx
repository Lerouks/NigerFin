'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, Lock, Eye, EyeOff, XCircle, LogOut, Check,
  CreditCard, User, Shield, Mail, Crown, Zap, ArrowRight,
  Wrench, BarChart3, Newspaper, Timer, Heart,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getRoleLabel } from '@/lib/user-profile';
import { PhoneField, validatePhone } from '@/components/PhoneField';
import { CURRENCY, getBillingCycleLabel } from '@/config/pricing';
import type { NewsletterPreferences } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

type SectionId = 'abonnement' | 'profil' | 'securite' | 'newsletter';

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

// ─── Avantages Premium ───────────────────────────────────────────────────────

const PREMIUM_BENEFITS = [
  { icon: Newspaper, label: 'Tous les articles en illimité' },
  { icon: Wrench, label: 'Outils financiers premium' },
  { icon: Mail, label: 'Newsletters exclusives' },
  { icon: BarChart3, label: 'Analyses approfondies' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function AccountDashboard() {
  const { isSignedIn, isLoading, user, profile, userRole, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPasswordReset = searchParams.get('reset') === 'true';
  const [activeSection, setActiveSection] = useState<SectionId>(isPasswordReset ? 'securite' : 'abonnement');
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [civility, setCivility] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName2, setLastName2] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Niger');
  const [profession, setProfession] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Newsletter state
  const [newsletterPrefs, setNewsletterPrefs] = useState<NewsletterPreferences>({
    newsletter_monthly: true, newsletter_weekly: false, alerts_news: false, alerts_custom: false, reports_pdf: false,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (!isLoading && !isSignedIn) router.push('/connexion');
  }, [isLoading, isSignedIn, router]);

  const fetchData = useCallback(async () => {
    setSummaryLoading(true);
    try {
      await refreshProfile();
      const [summaryRes, prefsRes] = await Promise.all([
        fetch('/api/user/account-summary'),
        fetch('/api/user/newsletter-prefs'),
      ]);
      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (prefsRes.ok) setNewsletterPrefs(await prefsRes.json());
    } catch {} finally {
      setSummaryLoading(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    if (isSignedIn) fetchData();
  }, [isSignedIn, fetchData]);

  // Sync profile edit fields
  useEffect(() => {
    if (profile) {
      const p = profile as unknown as Record<string, unknown>;
      setCivility((p.civility as string) || '');
      setFirstName((p.first_name as string) || '');
      setLastName2((p.last_name as string) || '');
      setPhone((p.phone as string) || '');
      setBirthDay(p.birth_day ? String(p.birth_day) : '');
      setBirthMonth(p.birth_month ? String(p.birth_month) : '');
      setBirthYear(p.birth_year ? String(p.birth_year) : '');
      setAddress((p.address as string) || '');
      setCity((p.city as string) || '');
      setPostalCode((p.postal_code as string) || '');
      setCountry((p.country as string) || 'Niger');
      setProfession((p.profession as string) || '');
    }
  }, [profile]);

  if (isLoading || !isSignedIn) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const isSubscribed = userRole === 'premium' || userRole === 'admin';
  const sub = summary?.subscription ?? null;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const rawPeriodEnd = profile?.subscription_end || sub?.current_period_end;
  const periodEnd = rawPeriodEnd
    ? new Date(rawPeriodEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const remainingDays = (() => {
    if (!rawPeriodEnd) return null;
    const diff = new Date(rawPeriodEnd).getTime() - Date.now();
    return diff > 0 ? Math.ceil(diff / 86400000) : null;
  })();

  // Extract name for greeting
  const p = profile as unknown as Record<string, unknown>;
  const greetCivility = (p?.civility as string) || '';
  const greetLastName = (p?.last_name as string) || profile?.full_name?.split(' ').pop() || user?.email?.split('@')[0] || '';
  const greetName = greetCivility ? `${greetCivility} ${greetLastName}` : greetLastName;

  const handleSaveProfile = async () => {
    // Client-side validation
    if (!firstName.trim() || !lastName2.trim()) {
      setProfileMessage({ type: 'error', text: 'Le prénom et le nom sont obligatoires.' });
      return;
    }
    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      setProfileMessage({ type: 'error', text: phoneErr });
      return;
    }
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          civility: civility || null,
          first_name: firstName,
          last_name: lastName2,
          phone: phone || null,
          birth_day: birthDay ? parseInt(birthDay) : null,
          birth_month: birthMonth ? parseInt(birthMonth) : null,
          birth_year: birthYear ? parseInt(birthYear) : null,
          address: address || null,
          city: city || null,
          postal_code: postalCode || null,
          country: country || null,
          profession: profession || null,
        }),
      });
      if (res.ok) {
        setProfileMessage({ type: 'success', text: 'Profil mis à jour avec succès.' });
        setEditingProfile(false);
        await refreshProfile();
      } else {
        const data = await res.json();
        setProfileMessage({ type: 'error', text: data.error || 'Erreur lors de la mise à jour.' });
      }
    } catch {
      setProfileMessage({ type: 'error', text: 'Erreur réseau.' });
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMessage(null), 4000);
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

  const sections: { id: SectionId; label: string; icon: React.ElementType }[] = [
    { id: 'abonnement', label: 'Abonnement', icon: CreditCard },
    { id: 'profil', label: 'Profil', icon: User },
    { id: 'securite', label: 'Sécurité', icon: Shield },
    { id: 'newsletter', label: 'Newsletters', icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header - Bonjour style JA */}
      <section className="bg-[#111] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-2xl font-bold">
            {greetLastName.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Bonjour{greetName ? ` ${greetName}` : ''}
          </h1>
          <p className="text-white/40 text-[14px] mb-3">
            Merci de suivre l&apos;actualité à nos côtés{memberSince ? ` depuis le ${memberSince}` : ''}.
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className={`text-[10px] font-semibold tracking-[0.15em] uppercase px-3 py-1 rounded-full ${
              isSubscribed
                ? 'bg-[#d4a843]/20 text-[#d4a843] border border-[#d4a843]/30'
                : 'bg-white/10 text-white/50 border border-white/10'
            }`}>
              {getRoleLabel(userRole || 'reader')}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-white/30 text-[12px]">{user?.email}</p>
            <button
              onClick={async () => { await signOut(); router.push('/'); }}
              className="inline-flex items-center gap-1.5 mt-2 text-[12px] text-white/30 hover:text-white/60 transition-colors"
            >
              Pas vous ? <span className="underline">Se déconnecter</span>
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar navigation - desktop */}
          <aside className="hidden lg:block w-[200px] flex-shrink-0">
            <nav className="sticky top-24 space-y-1">
              {sections.map((s) => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all ${
                      isActive
                        ? 'bg-[#111] text-white shadow-sm'
                        : 'text-gray-500 hover:bg-white hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {s.label}
                  </button>
                );
              })}
              <div className="h-px bg-black/[0.06] my-3" />
              <button
                onClick={async () => { await signOut(); router.push('/'); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </nav>
          </aside>

          {/* Mobile navigation */}
          <div className="lg:hidden w-full mb-6">
            <div className="flex gap-1 bg-white rounded-xl p-1.5 border border-black/[0.06] shadow-sm overflow-x-auto">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                      activeSection === s.id ? 'bg-[#111] text-white' : 'text-gray-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* ─── ABONNEMENT ─────────────────────────────────── */}
            {activeSection === 'abonnement' && (
              <>
                {/* Subscription status - skeleton while loading */}
                {summaryLoading ? (
                  <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden animate-pulse">
                    <div className="bg-[#111] p-6 sm:p-8">
                      <div className="h-4 w-32 bg-white/10 rounded mb-4" />
                      <div className="h-7 w-64 bg-white/10 rounded mb-2" />
                      <div className="h-4 w-80 bg-white/5 rounded" />
                    </div>
                    <div className="p-6 sm:p-8">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="h-14 bg-gray-100 rounded-lg" />
                        <div className="h-14 bg-gray-100 rounded-lg" />
                        <div className="h-14 bg-gray-100 rounded-lg hidden sm:block" />
                      </div>
                    </div>
                  </div>
                ) : isSubscribed && sub ? (
                  <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden">
                    <div className="bg-gradient-to-r from-[#111] to-[#1a1a1a] text-white p-6 sm:p-8">
                      <div className="flex items-center gap-2 mb-3">
                        <Crown className="w-5 h-5 text-[#d4a843]" />
                        <span className="text-[11px] tracking-[0.15em] uppercase text-[#d4a843]">Abonnement en cours</span>
                      </div>
                      <h2 className="text-2xl font-bold mb-1">
                        Abonnement {getBillingCycleLabel(sub.billing_cycle || 'monthly')}
                      </h2>
                      <p className="text-white/50 text-[14px]">
                        Votre abonnement vous donne un accès illimité à l&apos;ensemble du contenu de NFI Report.
                      </p>
                    </div>
                    <div className="p-6 sm:p-8">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                        <div>
                          <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Statut</p>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="text-[14px] font-medium">Actif</span>
                          </div>
                        </div>
                        {periodEnd && (
                          <div>
                            <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Renouvellement</p>
                            <p className="text-[14px] font-medium">{periodEnd}</p>
                          </div>
                        )}
                        {remainingDays != null && (
                          <div>
                            <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Temps restant</p>
                            <div className="flex items-center gap-1.5">
                              <Timer className="w-4 h-4 text-[#d4a843]" />
                              <span className="text-[14px] font-medium">
                                {remainingDays > 30 ? `${Math.floor(remainingDays / 30)} mois` : `${remainingDays} jour${remainingDays !== 1 ? 's' : ''}`}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] text-white rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-5 h-5 text-[#d4a843]" />
                      <span className="text-[11px] tracking-[0.15em] uppercase text-[#d4a843]">Passez Premium</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Débloquez un accès illimité</h2>
                    <p className="text-white/50 text-[14px] mb-6 max-w-lg">
                      Accédez à tous les articles, analyses, outils premium et newsletters exclusives.
                    </p>
                    <Link href="/pricing" className="inline-flex items-center gap-2 bg-[#d4a843] text-white px-6 py-3 rounded-xl text-[14px] font-medium hover:bg-[#c49a3a] transition-colors">
                      Voir les plans <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}

                {/* Rappel des avantages - style JA */}
                <div className="bg-white rounded-2xl border border-black/[0.06] p-6 sm:p-8">
                  <h3 className="text-lg font-semibold mb-6">
                    {isSubscribed ? 'Rappel de vos avantages' : 'Avantages Premium'}
                  </h3>
                  <div className="space-y-4">
                    {PREMIUM_BENEFITS.map((benefit) => {
                      const Icon = benefit.icon;
                      return (
                        <div key={benefit.label} className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isSubscribed ? 'bg-[#d4a843]/10' : 'bg-gray-100'
                          }`}>
                            <Icon className={`w-5 h-5 ${isSubscribed ? 'text-[#d4a843]' : 'text-gray-400'}`} />
                          </div>
                          <p className="text-[15px] font-medium">{benefit.label}</p>
                          {isSubscribed && <Check className="w-4 h-4 text-[#d4a843] ml-auto" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Historique paiements */}
                {summary?.recentPayments && summary.recentPayments.length > 0 && (
                  <div className="bg-white rounded-2xl border border-black/[0.06] p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-5">
                      <Heart className="w-4 h-4 text-gray-400" />
                      <h3 className="text-lg font-semibold">Historique des paiements</h3>
                    </div>
                    <div className="space-y-3">
                      {summary.recentPayments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between py-3 border-b border-black/[0.04] last:border-0">
                          <div>
                            <p className="text-[14px] font-medium capitalize">{payment.tier} - {getBillingCycleLabel(payment.billing_cycle || 'monthly')}</p>
                            <p className="text-[12px] text-gray-400">
                              {new Date(payment.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[14px] font-semibold">{payment.amount.toLocaleString('fr-FR')} {CURRENCY}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              payment.status === 'verified' ? 'bg-emerald-50 text-emerald-600' :
                              payment.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                              'bg-red-50 text-red-600'
                            }`}>
                              {payment.status === 'verified' ? 'Vérifié' : payment.status === 'pending' ? 'En attente' : 'Rejeté'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ─── PROFIL ─────────────────────────────────────── */}
            {activeSection === 'profil' && (
              <>
                {profileMessage && (
                  <div className={`rounded-xl px-5 py-4 text-sm flex items-start gap-3 ${
                    profileMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {profileMessage.type === 'success' ? <Check className="w-4 h-4 mt-0.5" /> : <XCircle className="w-4 h-4 mt-0.5" />}
                    {profileMessage.text}
                  </div>
                )}

                {/* Coordonnées */}
                <div className="bg-white rounded-2xl border border-black/[0.06] p-6 sm:p-8">
                  <h3 className="text-lg font-semibold mb-6">Vos coordonnées</h3>
                  <div className="space-y-5">
                    {/* Civilité */}
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-2">Civilité</label>
                      <div className="flex gap-4">
                        {['M.', 'Mme'].map((opt) => (
                          <label key={opt} className={`flex items-center gap-2 cursor-pointer ${!editingProfile ? 'pointer-events-none' : ''}`}>
                            <input type="radio" name="civility" value={opt} checked={civility === opt} onChange={() => setCivility(opt)} disabled={!editingProfile} className="w-4 h-4 accent-[#111]" />
                            <span className="text-[14px]">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Prénom / Nom */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ProfileField label="Prénom" value={firstName} onChange={setFirstName} disabled={!editingProfile} required placeholder="Votre prénom" />
                      <ProfileField label="Nom" value={lastName2} onChange={setLastName2} disabled={!editingProfile} required placeholder="Votre nom" />
                    </div>

                    {/* Boutons */}
                    {editingProfile ? (
                      <div className="flex gap-2 pt-2">
                        <button onClick={handleSaveProfile} disabled={savingProfile || !firstName.trim() || !lastName2.trim()} className="flex items-center gap-2 bg-[#111] text-white px-6 py-2.5 rounded-xl text-[13px] font-medium hover:bg-[#333] transition-colors disabled:opacity-50">
                          {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Enregistrer
                        </button>
                        <button onClick={() => { setEditingProfile(false); /* fields reset on next profile sync */ }} className="px-4 py-2.5 rounded-xl text-[13px] text-gray-500 hover:bg-gray-50 transition-colors">Annuler</button>
                      </div>
                    ) : (
                      <button onClick={() => setEditingProfile(true)} className="flex items-center gap-2 bg-[#111] text-white px-6 py-2.5 rounded-xl text-[13px] font-medium hover:bg-[#333] transition-colors">Modifier</button>
                    )}
                  </div>
                </div>

                {/* Identifiants */}
                <div className="bg-white rounded-2xl border border-black/[0.06] p-6 sm:p-8">
                  <h3 className="text-lg font-semibold mb-6">Vos identifiants</h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">E-mail</label>
                      <input type="email" value={user?.email || ''} disabled className="w-full border border-black/[0.08] rounded-lg px-4 py-3 text-[14px] bg-[#fafaf9] text-gray-500" />
                      <p className="text-[11px] text-gray-400 mt-1.5">Pour changer votre e-mail, <Link href="/contact" className="underline hover:text-gray-600">contactez-nous</Link>.</p>
                    </div>
                    <button onClick={() => setActiveSection('securite')} className="flex items-center gap-2 border border-black/[0.08] px-4 py-2.5 rounded-xl text-[13px] font-medium text-gray-700 hover:bg-[#f5f5f0] transition-colors">
                      <Lock className="w-4 h-4" /> Changer le mot de passe
                    </button>
                  </div>
                </div>

                {/* Compléter votre profil */}
                <div className="bg-white rounded-2xl border border-black/[0.06] p-6 sm:p-8">
                  <h3 className="text-lg font-semibold mb-6">Compléter votre profil</h3>
                  <div className="space-y-5">
                    {/* Date de naissance */}
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Date de naissance</label>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} disabled={!editingProfile} className="border border-black/[0.08] rounded-lg px-2 sm:px-3 py-3 text-[13px] sm:text-[14px] bg-[#fafaf9] disabled:text-gray-500 w-full min-w-0">
                          <option value="">Jour</option>
                          {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                        </select>
                        <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} disabled={!editingProfile} className="border border-black/[0.08] rounded-lg px-2 sm:px-3 py-3 text-[13px] sm:text-[14px] bg-[#fafaf9] disabled:text-gray-500 w-full min-w-0">
                          <option value="">Mois</option>
                          {['Jan.','Fév.','Mars','Avr.','Mai','Juin','Juil.','Août','Sep.','Oct.','Nov.','Déc.'].map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                        </select>
                        <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} disabled={!editingProfile} className="border border-black/[0.08] rounded-lg px-2 sm:px-3 py-3 text-[13px] sm:text-[14px] bg-[#fafaf9] disabled:text-gray-500 w-full min-w-0">
                          <option value="">Année</option>
                          {Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - 13 - i).map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Téléphone */}
                    <PhoneField value={phone} onChange={setPhone} disabled={!editingProfile} />

                    {/* Adresse */}
                    <ProfileField label="Adresse" value={address} onChange={setAddress} disabled={!editingProfile} placeholder="Votre adresse" />

                    {/* Ville / Code postal */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ProfileField label="Ville" value={city} onChange={setCity} disabled={!editingProfile} placeholder="Votre ville" />
                      <ProfileField label="Code postal" value={postalCode} onChange={setPostalCode} disabled={!editingProfile} placeholder="Code postal" />
                    </div>

                    {/* Pays */}
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Pays</label>
                      <select value={country} onChange={(e) => setCountry(e.target.value)} disabled={!editingProfile} className="w-full border border-black/[0.08] rounded-lg px-4 py-3 text-[14px] bg-[#fafaf9] disabled:text-gray-500">
                        <optgroup label="Afrique de l'Ouest">
                          {WEST_AFRICA_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </optgroup>
                        <optgroup label="Autres pays">
                          {OTHER_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </optgroup>
                      </select>
                    </div>

                    {/* Profession */}
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Profession</label>
                      <select value={profession} onChange={(e) => setProfession(e.target.value)} disabled={!editingProfile} className="w-full border border-black/[0.08] rounded-lg px-4 py-3 text-[14px] bg-[#fafaf9] disabled:text-gray-500">
                        <option value="">Sélectionner</option>
                        {PROFESSIONS.map((p2) => <option key={p2} value={p2}>{p2}</option>)}
                      </select>
                    </div>

                    {editingProfile && (
                      <div className="flex gap-2 pt-2">
                        <button onClick={handleSaveProfile} disabled={savingProfile || !firstName.trim() || !lastName2.trim()} className="flex items-center gap-2 bg-[#111] text-white px-6 py-2.5 rounded-xl text-[13px] font-medium hover:bg-[#333] transition-colors disabled:opacity-50">
                          {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Enregistrer
                        </button>
                        <button onClick={() => setEditingProfile(false)} className="px-4 py-2.5 rounded-xl text-[13px] text-gray-500 hover:bg-gray-50 transition-colors">Annuler</button>
                      </div>
                    )}

                    <p className="text-[11px] text-gray-400">Les champs avec * sont obligatoires</p>
                  </div>
                </div>
              </>
            )}

            {/* ─── SECURITE ───────────────────────────────────── */}
            {activeSection === 'securite' && (
              <>
                <PasswordChangeSection isReset={isPasswordReset} />
                <DeleteAccountSection />
              </>
            )}

            {/* ─── NEWSLETTER ─────────────────────────────────── */}
            {activeSection === 'newsletter' && (
              <div className="bg-white rounded-2xl border border-black/[0.06] p-6 sm:p-8">
                <h3 className="text-lg font-semibold mb-6">Préférences newsletter</h3>
                <div className="space-y-4">
                  <ToggleRow label="Newsletter mensuelle" description="Résumé mensuel des actualités économiques" checked={newsletterPrefs.newsletter_monthly} onChange={(v) => setNewsletterPrefs((p) => ({ ...p, newsletter_monthly: v }))} />
                  <ToggleRow label="Newsletter hebdomadaire" description="Analyses et actualités chaque semaine" checked={newsletterPrefs.newsletter_weekly} onChange={(v) => setNewsletterPrefs((p) => ({ ...p, newsletter_weekly: v }))} disabled={!isSubscribed} premium />
                  <ToggleRow label="Alertes actualités" description="Soyez alerté des événements économiques importants" checked={newsletterPrefs.alerts_news} onChange={(v) => setNewsletterPrefs((p) => ({ ...p, alerts_news: v }))} disabled={!isSubscribed} premium />
                  <ToggleRow label="Rapports PDF" description="Recevez les rapports exclusifs en PDF" checked={newsletterPrefs.reports_pdf} onChange={(v) => setNewsletterPrefs((p) => ({ ...p, reports_pdf: v }))} disabled={!isSubscribed} premium />
                </div>
                <button onClick={handleSaveNewsletterPrefs} disabled={savingPrefs} className="mt-6 flex items-center gap-2 bg-[#111] text-white px-6 py-2.5 rounded-xl text-[13px] font-medium hover:bg-[#333] transition-colors">
                  {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Enregistrer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

// ─── Data ────────────────────────────────────────────────────────────────────

const WEST_AFRICA_COUNTRIES = [
  'Niger', 'Nigeria', 'Bénin', 'Burkina Faso', 'Côte d\'Ivoire', 'Ghana',
  'Guinée', 'Guinée-Bissau', 'Liberia', 'Mali', 'Mauritanie', 'Sénégal',
  'Sierra Leone', 'Togo', 'Cap-Vert', 'Gambie',
];

const OTHER_COUNTRIES = [
  'Algérie', 'Cameroun', 'Canada', 'Centrafrique', 'Comores', 'Congo',
  'Djibouti', 'Égypte', 'Éthiopie', 'France', 'Gabon', 'Kenya',
  'Madagascar', 'Maroc', 'RD Congo', 'Rwanda', 'Tchad', 'Tunisie',
  'Belgique', 'Suisse', 'États-Unis', 'Royaume-Uni', 'Allemagne',
  'Arabie Saoudite', 'Émirats arabes unis', 'Chine', 'Inde', 'Autre',
];

const PROFESSIONS = [
  'Entrepreneur',
  'Fonctionnaire',
  'Cadre d\'entreprise',
  'Commerçant',
  'Agriculteur',
  'Enseignant / Chercheur',
  'Étudiant',
  'Journaliste / Média',
  'Banquier / Finance',
  'Ingénieur / Technicien',
  'Médecin / Santé',
  'Avocat / Juriste',
  'Consultant',
  'Artisan',
  'Retraité',
  'Sans emploi',
  'Autre',
];

function ProfileField({ label, value, onChange, disabled, required, placeholder, type }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; required?: boolean; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type || 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full border border-black/[0.08] rounded-lg px-4 py-3 text-[14px] bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black/10 disabled:text-gray-500 transition-colors"
        placeholder={placeholder}
      />
    </div>
  );
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
  const meetsRequirements = strength ? strength.checks.length && strength.checks.uppercase && strength.checks.digit && strength.checks.special : false;
  const sameAsOld = !isReset && currentPassword && newPassword && currentPassword === newPassword;
  const canSubmit = (isReset || currentPassword) && meetsRequirements && newPassword === confirmPassword && !sameAsOld && newPassword.length <= 128 && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!meetsRequirements) { setMessage({ type: 'error', text: 'Le mot de passe ne respecte pas les critères de sécurité.' }); return; }
    if (newPassword.length > 128) { setMessage({ type: 'error', text: 'Le mot de passe ne doit pas dépasser 128 caractères.' }); return; }
    if (newPassword !== confirmPassword) { setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' }); return; }
    if (sameAsOld) { setMessage({ type: 'error', text: 'Le nouveau mot de passe doit être différent de l\'ancien.' }); return; }
    setLoading(true);

    if (isReset) {
      try {
        const { createBrowserSupabaseClient } = await import('@/lib/supabase-browser');
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) setMessage({ type: 'error', text: error.message });
        else { setMessage({ type: 'success', text: 'Mot de passe mis à jour.' }); setNewPassword(''); setConfirmPassword(''); router.replace('/compte'); }
      } catch { setMessage({ type: 'error', text: 'Erreur réseau.' }); }
      finally { setLoading(false); }
      return;
    }

    try {
      const res = await fetch('/api/user/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) });
      const data = await res.json();
      if (res.ok) { setMessage({ type: 'success', text: data.message || 'Mot de passe mis à jour.' }); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }
      else setMessage({ type: 'error', text: data.error || 'Erreur.' });
    } catch { setMessage({ type: 'error', text: 'Erreur réseau.' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-2">
        <Lock className="w-4 h-4 text-gray-500" />
        <h3 className="text-lg font-semibold">{isReset ? 'Définir un nouveau mot de passe' : 'Modifier le mot de passe'}</h3>
      </div>
      {isReset && <p className="text-sm text-gray-500 mb-6">Définissez votre nouveau mot de passe ci-dessous.</p>}
      {!isReset && <div className="mb-6" />}

      {message && (
        <div className={`rounded-xl px-5 py-4 text-sm flex items-start gap-3 mb-6 ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {message.type === 'success' ? <Check className="w-4 h-4 mt-0.5" /> : <XCircle className="w-4 h-4 mt-0.5" />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
        {!isReset && <PasswordField id="current-password" label="Mot de passe actuel" value={currentPassword} onChange={setCurrentPassword} show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} placeholder="Mot de passe actuel" required />}
        <div>
          <PasswordField id="new-password" label="Nouveau mot de passe" value={newPassword} onChange={(v) => setNewPassword(v.slice(0, 128))} show={showNew} onToggle={() => setShowNew(!showNew)} placeholder="Min. 8 car., 1 majuscule, 1 chiffre, 1 spécial" required minLength={8} />
          {newPassword && strength && (
            <div className="mt-2 space-y-2">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${strength.bgColor} ${strength.width} rounded-full transition-all`} /></div>
              <p className={`text-[11px] ${strength.color}`}>Force : {strength.label}</p>
              <div className="grid grid-cols-2 gap-1">
                <p className={`text-[11px] ${strength.checks.length ? 'text-emerald-600' : 'text-gray-400'}`}>{strength.checks.length ? '✓' : '○'} 8 caractères min.</p>
                <p className={`text-[11px] ${strength.checks.uppercase ? 'text-emerald-600' : 'text-gray-400'}`}>{strength.checks.uppercase ? '✓' : '○'} 1 majuscule</p>
                <p className={`text-[11px] ${strength.checks.digit ? 'text-emerald-600' : 'text-gray-400'}`}>{strength.checks.digit ? '✓' : '○'} 1 chiffre</p>
                <p className={`text-[11px] ${strength.checks.special ? 'text-emerald-600' : 'text-gray-400'}`}>{strength.checks.special ? '✓' : '○'} 1 spécial (!@#$%^&*)</p>
              </div>
            </div>
          )}
          {sameAsOld && <p className="text-[11px] mt-1 text-red-500">Le nouveau mot de passe doit être différent de l&apos;ancien.</p>}
        </div>
        <div>
          <PasswordField id="confirm-password" label="Confirmer le nouveau mot de passe" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} placeholder="Confirmez le mot de passe" required className={confirmPassword && !passwordsMatch ? 'border-red-300' : undefined} />
          {confirmPassword && !passwordsMatch && <p className="text-[11px] mt-1 text-red-500">Les mots de passe ne correspondent pas.</p>}
        </div>
        <button type="submit" disabled={!canSubmit} className="flex items-center gap-2 bg-[#111] text-white px-6 py-2.5 rounded-xl text-[13px] font-medium hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Mettre à jour
        </button>
      </form>
    </div>
  );
}

function getPasswordStrength(password: string) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    digit: /\d/.test(password),
    special: /[!@#$%^&*]/.test(password),
    long: password.length >= 12,
  };

  const passed = Object.values(checks).filter(Boolean).length;

  // All 3 required rules must pass for medium
  const requiredPassed = checks.length && checks.uppercase && checks.digit && checks.special;

  if (!requiredPassed || passed <= 2) return { level: 'weak' as const, label: 'Faible', color: 'text-red-600', bgColor: 'bg-red-500', width: 'w-1/3', checks };
  if (passed <= 3) return { level: 'medium' as const, label: 'Moyen', color: 'text-amber-600', bgColor: 'bg-amber-500', width: 'w-2/3', checks };
  return { level: 'strong' as const, label: 'Fort', color: 'text-emerald-600', bgColor: 'bg-emerald-500', width: 'w-full', checks };
}

function PasswordField({ id, label, value, onChange, show, onToggle, placeholder, required, minLength, className }: {
  id: string; label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; placeholder: string; required?: boolean; minLength?: number; className?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-medium mb-1.5">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input id={id} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} className={`w-full border rounded-lg pl-10 pr-10 py-3 bg-[#fafaf9] focus:outline-none focus:ring-1 transition-all text-[14px] ${className || 'border-black/[0.08] focus:ring-black/5'}`} placeholder={placeholder} required={required} minLength={minLength} />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function DeleteAccountSection() {
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { signOut } = useAuth();

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      const res = await fetch('/api/user/delete-account', { method: 'DELETE' });
      if (res.ok) {
        await signOut();
        router.push('/');
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la suppression.');
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-red-100 p-6 sm:p-8 mt-6">
        <h3 className="text-lg font-semibold text-red-600 mb-2">Zone de danger</h3>
        <p className="text-[13px] text-gray-500 mb-4">
          La suppression de votre compte est définitive et irréversible.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-[13px] font-medium hover:bg-red-100 transition-colors"
        >
          <XCircle className="w-4 h-4" />
          Supprimer mon compte
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full animate-fade-in-up">
            <h3 className="text-lg font-bold text-red-600 mb-3">Supprimer définitivement mon compte</h3>
            <p className="text-[13px] text-gray-600 mb-4 leading-relaxed">
              Cette action est irréversible. Toutes vos données seront supprimées immédiatement : profil, abonnement, commentaires, likes, historique de lecture, préférences newsletter.
            </p>
            <div className="mb-4">
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Tapez <strong className="text-red-600">SUPPRIMER</strong> pour confirmer
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="SUPPRIMER"
                className="w-full border border-black/[0.08] rounded-lg px-4 py-3 text-[14px] bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-red-200"
                autoComplete="off"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDelete}
                disabled={confirmText !== 'SUPPRIMER' || deleting}
                className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl text-[14px] font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Supprimer définitivement
              </button>
              <button
                onClick={() => { setShowModal(false); setConfirmText(''); setError(''); }}
                disabled={deleting}
                className="w-full text-center text-[13px] text-gray-500 hover:text-gray-700 py-2 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ToggleRow({ label, description, checked, onChange, disabled, premium }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; premium?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between p-4 rounded-xl border border-black/[0.04] ${disabled ? 'opacity-50' : ''}`}>
      <div>
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-medium">{label}</p>
          {premium && (
            <span className="text-[9px] font-semibold tracking-[0.1em] uppercase px-2 py-0.5 rounded-full bg-[#d4a843]/10 text-[#d4a843]">
              Premium
            </span>
          )}
        </div>
        <p className="text-[12px] text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${checked ? 'bg-[#111]' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
