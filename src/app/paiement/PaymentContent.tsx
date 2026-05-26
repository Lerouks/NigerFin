'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Check,
  Loader2,
  ArrowLeft,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import {
  PREMIUM_TIER,
  PAYMENT_METHODS,
  MOBILE_PAYMENT_METHODS,
  BILLING_OPTIONS,
  formatPrice,
  getBillingOption,
  isValidBillingCycle,
  type PaymentMethodId,
  type BillingCycle,
} from '@/config/pricing';

type PaymentStep = 'choose-method' | 'instructions' | 'confirm' | 'submitted';

export function PaymentContent() {
  const searchParams = useSearchParams();
  const { isSignedIn, isLoading, user, signIn, signUp } = useAuth();

  const tierParam = searchParams.get('tier');
  const cycleParam = searchParams.get('cycle') || 'yearly';

  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    isValidBillingCycle(cycleParam) ? cycleParam : 'yearly'
  );

  // Auth state
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  // Forgot password
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Payment state
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('choose-method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId | null>(null);
  const [transactionNumber, setTransactionNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [copied, setCopied] = useState(false);
  const [ipaymoneyLoading, setIpaymoneyLoading] = useState(false);

  // Dynamic prices
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, number>>({});
  useEffect(() => {
    fetch('/api/prices')
      .then((r) => r.json())
      .then((data) => setDynamicPrices(data))
      .catch(() => {});
  }, []);

  // Load iPayMoney SDK script
  useEffect(() => {
    if (!isSignedIn) return;
    const existing = document.querySelector('script[src="https://i-pay.money/checkout.js"]');
    if (existing) return;
    const script = document.createElement('script');
    script.src = 'https://i-pay.money/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      try { document.body.removeChild(script); } catch { /* already removed */ }
    };
  }, [isSignedIn]);

  const getPrice = (cycle: BillingCycle) => {
    const opt = BILLING_OPTIONS.find((b) => b.cycle === cycle)!;
    return dynamicPrices[`premium_${cycle}`] ?? opt.price;
  };

  // Validate params
  if (tierParam !== 'premium') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Plan invalide</h2>
          <p className="text-gray-500 mb-6">Veuillez choisir un plan depuis la page d&apos;abonnements.</p>
          <Link href="/pricing" className="bg-[#111] text-white px-6 py-2.5 rounded-lg text-[14px] hover:bg-[#333] transition-colors">
            Voir les abonnements
          </Link>
        </div>
      </div>
    );
  }

  const billingOption = getBillingOption(billingCycle);
  const price = getPrice(billingCycle);
  const method = selectedMethod ? PAYMENT_METHODS[selectedMethod] : null;

  // Auth handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setAuthError(
        error.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : 'Une erreur est survenue. Veuillez réessayer.'
      );
    }
    setAuthLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (password.length < 8) {
      setAuthError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('Les mots de passe ne correspondent pas.');
      return;
    }

    setAuthLoading(true);
    const { error, existingUser } = await signUp(email, password, fullName);

    if (existingUser) {
      setAuthError('Un compte existe déjà avec cet email. Connectez-vous.');
      setAuthMode('login');
    } else if (error) {
      setAuthError(error.message || 'Une erreur est survenue.');
    } else {
      setAccountCreated(true);
    }
    setAuthLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setAuthError('Veuillez entrer votre email.'); return; }
    setAuthError('');
    setResetLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/compte?reset=true`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch {
      setAuthError("Erreur lors de l'envoi. Vérifiez votre email.");
    }
    setResetLoading(false);
  };

  // Payment handlers
  const handleCopyNumber = async () => {
    if (!method) return;
    try {
      await navigator.clipboard.writeText(method.recipientNumber.replace(/\s/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSubmitPayment = async () => {
    if (!selectedMethod || !transactionNumber.trim()) return;

    setPaymentError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/payment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: 'premium',
          billingCycle,
          paymentMethod: selectedMethod,
          transactionNumber: transactionNumber.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPaymentError(data.error || 'Erreur lors de la soumission');
        setSubmitting(false);
        return;
      }

      setPaymentStep('submitted');
    } catch {
      setPaymentError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIPayMoneyPayment = async () => {
    setIpaymoneyLoading(true);
    setPaymentError('');
    try {
      // 1. Create payment request on our server to get a unique transaction ID
      const res = await fetch('/api/ipaymoney/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: 'premium',
          billingCycle,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPaymentError(data.error || 'Erreur lors de l\'initialisation du paiement.');
        setIpaymoneyLoading(false);
        return;
      }

      // 2. Create a temporary iPayMoney SDK button and trigger checkout
      const publicKey = process.env.NEXT_PUBLIC_IPAYMONEY_PUBLIC_KEY;
      if (!publicKey) {
        setPaymentError('Configuration iPayMoney manquante.');
        setIpaymoneyLoading(false);
        return;
      }

      const btn = document.createElement('button');
      btn.className = 'ipaymoney-button';
      btn.setAttribute('data-amount', data.amount);
      btn.setAttribute('data-environement', 'live');
      btn.setAttribute('data-key', publicKey);
      btn.setAttribute('data-transaction-id', data.transactionId);
      btn.setAttribute('data-redirect-url', data.redirectUrl);
      btn.setAttribute('data-callback-url', data.callbackUrl);
      btn.style.position = 'fixed';
      btn.style.opacity = '0';
      btn.style.pointerEvents = 'none';
      document.body.appendChild(btn);

      // Give the SDK a moment to bind to the new button, then click
      setTimeout(() => {
        btn.click();
        setTimeout(() => {
          try { document.body.removeChild(btn); } catch { /* already removed */ }
        }, 2000);
      }, 300);
    } catch {
      setPaymentError('Erreur de connexion. Veuillez réessayer.');
      setIpaymoneyLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // Submitted state - full width success
  if (paymentStep === 'submitted') {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-[#111] py-5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/" className="text-xl font-bold text-white">NFI Report</Link>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Paiement soumis</h2>
          <p className="text-gray-600 mb-2">Votre paiement est en cours de vérification.</p>
          <div className="inline-flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg text-[13px] mb-8">
            <Clock className="w-4 h-4" />
            Délai de vérification : sous 24h
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/compte"
              className="bg-[#111] text-white px-8 py-3 rounded-lg text-[14px] hover:bg-[#333] transition-colors"
            >
              Mon compte
            </Link>
            <Link
              href="/"
              className="border border-black/10 px-8 py-3 rounded-lg text-[14px] hover:bg-gray-50 transition-colors"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="bg-[#111] py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">NFI Report</Link>
        </div>
      </div>

      {/* Title */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-2">
        <Link href="/pricing" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-600 text-[13px] mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour aux abonnements
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold text-[#111] text-center">Paiement</h1>
      </div>

      {/* Main layout: two columns */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

          {/* ── LEFT COLUMN: Steps ── */}
          <div className="space-y-6">

            {/* ─── STEP 1: Account ─── */}
            <div className="bg-white rounded-2xl border border-black/6 overflow-hidden">
              <div className="px-7 py-5 border-b border-black/4 flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold ${
                  isSignedIn
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-[#111] text-white'
                }`}>
                  {isSignedIn ? <Check className="w-4 h-4 stroke-[2.5]" /> : '1'}
                </div>
                <h2 className="text-[17px] font-bold text-[#111]">Compte</h2>
              </div>

              <div className="px-7 py-6">
                {isSignedIn ? (
                  /* Signed in state */
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-5 h-5 text-[#888]" />
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-[#111]">{user?.email}</p>
                      <p className="text-[13px] text-[#999]">Connecté</p>
                    </div>
                  </div>
                ) : accountCreated ? (
                  /* Account created, needs email verification */
                  <div className="text-center py-4">
                    <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-6 h-6 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Vérifiez votre email</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Un lien de confirmation a été envoyé à <strong>{email}</strong>.
                      Cliquez dessus pour activer votre compte, puis revenez ici.
                    </p>
                    <button
                      onClick={() => { setAccountCreated(false); setAuthMode('login'); }}
                      className="text-sm text-[#111] hover:underline font-medium"
                    >
                      Se connecter
                    </button>
                  </div>
                ) : resetSent ? (
                  /* Reset email sent */
                  <div className="text-center py-4">
                    <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-6 h-6 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Email envoyé</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
                    </p>
                    <button
                      onClick={() => { setResetSent(false); setForgotMode(false); }}
                      className="text-sm text-[#111] hover:underline font-medium"
                    >
                      Retour à la connexion
                    </button>
                  </div>
                ) : forgotMode ? (
                  /* Forgot password */
                  <div>
                    <button
                      onClick={() => { setForgotMode(false); setAuthError(''); }}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-4 transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" /> Retour
                    </button>
                    <h3 className="text-lg font-bold mb-1">Mot de passe oublié</h3>
                    <p className="text-[13px] text-gray-500 mb-5">
                      Entrez votre email pour recevoir un lien de réinitialisation.
                    </p>
                    {authError && (
                      <div role="alert" className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                        {authError}
                      </div>
                    )}
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full border border-black/8 rounded-xl pl-11 pr-4 py-3 bg-background focus:outline-hidden focus:border-[#d4a843]/30 focus:ring-2 focus:ring-[#d4a843]/10 transition-all text-[14px]"
                          placeholder="votre@email.com"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="w-full bg-[#111] text-white py-3 rounded-xl hover:bg-[#222] transition-all text-[14px] font-medium disabled:opacity-50"
                      >
                        {resetLoading ? 'Envoi...' : 'Envoyer le lien'}
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Login / Signup form */
                  <div>
                    <h3 className="text-lg font-bold mb-1">
                      {authMode === 'login' ? 'Connectez-vous' : 'Créez votre compte'}
                    </h3>
                    <p className="text-[13px] text-gray-500 mb-5">
                      {authMode === 'login'
                        ? 'Connectez-vous pour continuer votre paiement.'
                        : 'Créez un compte pour accéder à NFI Report.'
                      }
                    </p>

                    {authError && (
                      <div role="alert" className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                        {authError}
                      </div>
                    )}

                    <form onSubmit={authMode === 'login' ? handleLogin : handleSignup} className="space-y-4">
                      {authMode === 'signup' && (
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full border border-black/8 rounded-xl pl-11 pr-4 py-3 bg-background focus:outline-hidden focus:border-[#d4a843]/30 focus:ring-2 focus:ring-[#d4a843]/10 transition-all text-[14px]"
                            placeholder="Nom complet"
                            autoComplete="name"
                          />
                        </div>
                      )}

                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full border border-black/8 rounded-xl pl-11 pr-4 py-3 bg-background focus:outline-hidden focus:border-[#d4a843]/30 focus:ring-2 focus:ring-[#d4a843]/10 transition-all text-[14px]"
                          placeholder="Entrez votre email"
                          autoComplete="email"
                        />
                      </div>

                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={authMode === 'signup' ? 8 : undefined}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full border border-black/8 rounded-xl pl-11 pr-11 py-3 bg-background focus:outline-hidden focus:border-[#d4a843]/30 focus:ring-2 focus:ring-[#d4a843]/10 transition-all text-[14px]"
                          placeholder={authMode === 'signup' ? 'Minimum 8 caractères' : 'Mot de passe'}
                          autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600"
                          aria-label={showPassword ? 'Masquer' : 'Afficher'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {authMode === 'signup' && (
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full border rounded-xl pl-11 pr-4 py-3 bg-background focus:outline-hidden focus:ring-2 transition-all text-[14px] ${
                              confirmPassword && password !== confirmPassword
                                ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                                : 'border-black/8 focus:border-[#d4a843]/30 focus:ring-[#d4a843]/10'
                            }`}
                            placeholder="Confirmez le mot de passe"
                            autoComplete="new-password"
                          />
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={authLoading || (authMode === 'signup' && (password.length < 8 || password !== confirmPassword))}
                        className="w-full bg-[#111] text-white py-3 rounded-xl hover:bg-[#222] transition-all text-[14px] font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {authLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : authMode === 'login' ? (
                          'Continuer'
                        ) : (
                          'Créer mon compte'
                        )}
                      </button>
                    </form>

                    {authMode === 'login' && (
                      <button
                        onClick={() => { setForgotMode(true); setAuthError(''); }}
                        className="block w-full text-center text-[13px] text-gray-500 hover:text-gray-600 mt-3 transition-colors"
                      >
                        Mot de passe oublié ?
                      </button>
                    )}

                    <div className="relative my-5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-black/6" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-3 bg-white text-gray-500">ou</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setAuthMode(authMode === 'login' ? 'signup' : 'login');
                        setAuthError('');
                      }}
                      className="w-full text-center text-[14px] text-gray-500"
                    >
                      {authMode === 'login' ? (
                        <>Pas encore de compte ? <span className="text-[#111] font-semibold hover:underline">Créer un compte</span></>
                      ) : (
                        <>Déjà un compte ? <span className="text-[#111] font-semibold hover:underline">Se connecter</span></>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ─── STEP 2: Payment ─── */}
            <div className={`bg-white rounded-2xl border border-black/6 overflow-hidden transition-opacity duration-300 ${
              !isSignedIn ? 'opacity-50 pointer-events-none' : ''
            }`}>
              <div className="px-7 py-5 border-b border-black/4 flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold ${
                  isSignedIn
                    ? 'bg-[#111] text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {'2'}
                </div>
                <h2 className="text-[17px] font-bold text-[#111]">Paiement</h2>
              </div>

              {isSignedIn && (
                <div className="px-7 py-6">
                  {/* Billing cycle selector */}
                  <div className="mb-6">
                    <p className="text-[12px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Durée</p>
                    <div className="grid grid-cols-3 gap-2">
                      {BILLING_OPTIONS.map((opt) => (
                        <button
                          key={opt.cycle}
                          onClick={() => setBillingCycle(opt.cycle)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            billingCycle === opt.cycle
                              ? 'border-[#111] bg-[#111]/5'
                              : 'border-black/6 hover:border-black/15'
                          }`}
                        >
                          <p className="font-bold text-[14px]">{formatPrice(opt.price)}</p>
                          <p className="text-[11px] text-gray-500">{opt.durationLabel}</p>
                          {opt.savings && (
                            <p className="text-emerald-600 text-[10px] font-medium mt-0.5">{opt.savings}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 1: Choose method */}
                  {paymentStep === 'choose-method' && (
                    <div>
                      <p className="text-[12px] text-gray-500 uppercase tracking-wider font-semibold mb-3">
                        Méthode de paiement
                      </p>

                      {/* Mobile money methods */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        {Object.values(MOBILE_PAYMENT_METHODS).map((m) => (
                          <button
                            key={m.id}
                            onClick={() => { setSelectedMethod(m.id); setPaymentStep('instructions'); }}
                            className="p-4 rounded-xl border-2 border-black/6 hover:border-black/20 text-left transition-all flex items-center gap-3"
                          >
                            <Image
                              src={m.logo}
                              alt={m.shortName}
                              width={36}
                              height={36}
                              className="rounded-lg object-contain"
                            />
                            <div>
                              <h3 className="font-bold text-[15px]">{m.shortName}</h3>
                              <p className="text-gray-500 text-[12px]">{m.name}</p>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* iPayMoney */}
                      <button
                        onClick={handleIPayMoneyPayment}
                        disabled={ipaymoneyLoading}
                        className="w-full p-4 rounded-xl border-2 border-black/6 hover:border-black/20 text-left transition-all flex items-center gap-3 disabled:opacity-60"
                      >
                        <Image
                          src="/ipaymoney-logo.png"
                          alt="iPayMoney"
                          width={36}
                          height={36}
                          className="rounded-lg object-contain"
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-[15px]">iPayMoney</h3>
                          <p className="text-gray-500 text-[12px]">Mobile Money (Airtel, Moov) · Visa, Mastercard, Amex</p>
                        </div>
                        {ipaymoneyLoading && <Loader2 className="w-5 h-5 animate-spin text-gray-500" />}
                      </button>

                      {paymentError && (
                        <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-red-700 text-[13px]">{paymentError}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Instructions */}
                  {paymentStep === 'instructions' && method && (
                    <div>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                        <p className="text-amber-800 text-[13px] leading-relaxed">{method.instructions}</p>
                      </div>

                      <div className="space-y-4 mb-5">
                        <div>
                          <span className="text-[11px] text-gray-500 uppercase tracking-wider">Montant exact</span>
                          <p className="text-xl font-bold mt-0.5">{formatPrice(price)}</p>
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 uppercase tracking-wider">Numéro du destinataire</span>
                          <div className="flex items-center gap-3 mt-0.5">
                            <p className="text-lg font-bold font-mono">{method.recipientNumber}</p>
                            <button onClick={handleCopyNumber} className="text-gray-500 hover:text-gray-700 transition-colors" title="Copier">
                              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 uppercase tracking-wider">Bénéficiaire</span>
                          <p className="text-base font-semibold mt-0.5">{method.recipientName}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => { setPaymentStep('choose-method'); setSelectedMethod(null); }}
                          className="px-4 py-2.5 rounded-lg border border-black/10 text-[13px] hover:bg-gray-50 transition-colors"
                        >
                          Changer
                        </button>
                        <button
                          onClick={() => setPaymentStep('confirm')}
                          className="flex-1 bg-[#111] text-white px-6 py-2.5 rounded-lg text-[13px] hover:bg-[#333] transition-colors"
                        >
                          J&apos;ai effectué le transfert
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Confirm */}
                  {paymentStep === 'confirm' && method && (
                    <div>
                      <div className="mb-4">
                        <p className="text-[12px] text-gray-500 mb-3">
                          <span className="font-semibold text-gray-600">{method.name}</span> &middot; {billingOption.durationLabel} &middot; {formatPrice(price)}
                        </p>
                        <label htmlFor="txn" className="block text-sm font-medium mb-2">
                          Numéro de transaction
                        </label>
                        <input
                          id="txn"
                          type="text"
                          value={transactionNumber}
                          onChange={(e) => setTransactionNumber(e.target.value)}
                          placeholder="Ex: TXN123456789"
                          className="w-full border border-black/8 rounded-lg px-4 py-3 bg-background focus:outline-hidden focus:border-black/15 focus:ring-1 focus:ring-black/5 transition-all text-[14px] font-mono"
                        />
                        <p className="text-[11px] text-gray-500 mt-1.5">
                          Entrez le numéro reçu après votre transfert {method.shortName}.
                        </p>
                      </div>

                      {paymentError && (
                        <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-red-700 text-[13px]">{paymentError}</p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => { setPaymentStep('instructions'); setPaymentError(''); }}
                          className="px-4 py-2.5 rounded-lg border border-black/10 text-[13px] hover:bg-gray-50 transition-colors"
                        >
                          Retour
                        </button>
                        <button
                          onClick={handleSubmitPayment}
                          disabled={submitting || !transactionNumber.trim()}
                          className="flex-1 bg-[#111] text-white px-6 py-2.5 rounded-lg text-[13px] hover:bg-[#333] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {submitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Soumettre le paiement
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: Plan Summary (sticky) ── */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-white rounded-2xl border border-black/6 p-7">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-bold text-[#111]">
                  Accès {billingOption.durationLabel === '1 an' ? 'Annuel' : billingOption.durationLabel === '3 mois' ? 'Trimestriel' : 'Mensuel'}
                </h3>
                <span className="text-[16px] font-bold text-[#111]">
                  {formatPrice(price)}
                </span>
              </div>

              <p className="text-[13px] text-gray-500 leading-relaxed mb-5">
                Renouvellement automatique à {formatPrice(price)}/{billingOption.durationLabel === '1 an' ? 'an' : billingOption.durationLabel === '3 mois' ? 'trimestre' : 'mois'}.{' '}
                <span className="font-medium text-gray-700">
                  Résiliable en ligne avant le renouvellement.
                </span>
              </p>

              <div className="border-t border-black/4 pt-5">
                <h4 className="text-[12px] text-gray-500 uppercase tracking-wider font-semibold mb-4">
                  Ce que vous obtenez :
                </h4>
                <ul className="space-y-3">
                  {PREMIUM_TIER.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center mt-0.5 shrink-0">
                        <Check className="w-2.5 h-2.5 text-emerald-600 stroke-3" />
                      </div>
                      <span className="text-[13px] text-gray-600 leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
