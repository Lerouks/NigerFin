'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Check,
  Loader2,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
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
import { estNonConfirme, phraseErreurAuth } from '@/lib/auth/messages';
import { safeNextPath } from '@/lib/validation';
import { FormulaireInscription } from '@/components/compte/FormulaireInscription';
import { EtapeCode } from '@/components/compte/EtapeCode';
import { Turnstile, turnstileActif } from '@/components/securite/Turnstile';
import {
  PREMIUM_TIER,
  BILLING_OPTIONS,
  formatPrice,
  getBillingOption,
  isValidBillingCycle,
  type BillingCycle,
} from '@/config/pricing';

export function PaymentContent() {
  const searchParams = useSearchParams();
  const { isSignedIn, isLoading, user, signIn, renvoyerCode } = useAuth();

  const tierParam = searchParams.get('tier');
  const cycleParam = searchParams.get('cycle') || 'yearly';

  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    isValidBillingCycle(cycleParam) ? cycleParam : 'yearly'
  );

  // Auth state
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  // Compte pas encore confirmé : un nouveau code, tapé sur place.
  const [nonConfirme, setNonConfirme] = useState(false);
  const [etapeCode, setEtapeCode] = useState(false);
  // Turnstile, le contrôle anti-robots, quand il est en service.
  const [jeton, setJeton] = useState<string | null>(null);
  const [tour, setTour] = useState(0);

  // Forgot password
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Payment state
  const [paymentError, setPaymentError] = useState('');
  const [ipaymoneyLoading, setIpaymoneyLoading] = useState(false);

  // Dynamic prices
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, number>>({});
  useEffect(() => {
    fetch('/api/prices')
      .then((r) => r.json())
      .then((data) => setDynamicPrices(data))
      .catch(() => {});
  }, []);

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

  // Auth handlers. La création de compte passe par le formulaire commun du
  // site (FormulaireInscription), avec le code à 6 chiffres tapé ici : l'acheteur
  // ne quitte plus la page de paiement pour confirmer son adresse.
  const requete = searchParams.toString();
  const pageDuPaiement = safeNextPath(requete ? `/paiement?${requete}` : '/paiement');
  const PAS_PRET = 'La vérification anti-robots n’est pas encore prête. Patientez une seconde, puis réessayez.';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setNonConfirme(false);
    if (turnstileActif && !jeton) { setAuthError(PAS_PRET); return; }
    setAuthLoading(true);
    const { error } = await signIn(email, password, jeton ?? undefined);
    setTour((t) => t + 1);
    if (error) {
      if (estNonConfirme(error)) setNonConfirme(true);
      setAuthError(phraseErreurAuth(error, 'Une erreur est survenue. Veuillez réessayer.'));
    }
    setAuthLoading(false);
  };

  const demanderCode = async () => {
    if (turnstileActif && !jeton) { setAuthError(PAS_PRET); return; }
    setAuthLoading(true);
    const { error } = await renvoyerCode(email, pageDuPaiement, jeton ?? undefined);
    setTour((t) => t + 1);
    setAuthLoading(false);
    if (error) { setAuthError(phraseErreurAuth(error)); return; }
    setAuthError('');
    setNonConfirme(false);
    setEtapeCode(true);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setAuthError('Veuillez entrer votre email.'); return; }
    if (turnstileActif && !jeton) { setAuthError(PAS_PRET); return; }
    setAuthError('');
    setResetLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      // La même page que depuis la connexion : /connexion/nouveau-mot-de-passe.
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/connexion/nouveau-mot-de-passe`,
        ...(jeton ? { captchaToken: jeton } : {}),
      });
      if (error) setAuthError(phraseErreurAuth(error, 'L’envoi a échoué. Vérifiez votre adresse e-mail.'));
      else setResetSent(true);
    } catch {
      setAuthError('L’envoi a échoué. Vérifiez votre connexion, puis réessayez.');
    }
    setTour((t) => t + 1);
    setResetLoading(false);
  };

  // Payment handlers
  //
  // NB : le SDK iPay (checkout.js) n'attache ses handlers qu'au DOMContentLoaded
  // initial, sur les .ipaymoney-button déjà présents. Incompatible avec notre SPA
  // (script chargé après le load, bouton créé au clic) : le bouton n'était jamais
  // « armé ». On reproduit donc nous-mêmes la logique publique du SDK
  // (create_payment_token -> iframe -> postMessage), avec un contrôle total.

  /**
   * Ouvre IMMÉDIATEMENT un overlay plein écran avec un loader (retour visuel
   * instantané au clic), puis charge l'iframe iPay une fois le token prêt.
   * Retourne un contrôleur { loadPayment, close }.
   */
  const openIPayOverlay = () => {
    // Keyframes du spinner, injectées une seule fois.
    if (!document.getElementById('nfi-ipay-spin')) {
      const style = document.createElement('style');
      style.id = 'nfi-ipay-spin';
      style.textContent = '@keyframes nfi-ipay-spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(style);
    }

    const overlay = document.createElement('div');
    overlay.className = 'ipaymoney-payment-page';
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:999999;display:flex;align-items:center;justify-content:center;';

    const loader = document.createElement('div');
    loader.style.cssText =
      'width:48px;height:48px;border:4px solid rgba(255,255,255,0.35);border-top-color:#fff;border-radius:9999px;animation:nfi-ipay-spin 0.8s linear infinite;';
    overlay.appendChild(loader);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Fermer');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText =
      'position:absolute;top:14px;right:16px;z-index:1000000;width:38px;height:38px;border-radius:9999px;border:0;background:rgba(255,255,255,0.92);color:#111;font-size:18px;line-height:1;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
    overlay.appendChild(closeBtn);

    document.body.appendChild(overlay);

    let onMessage: ((event: MessageEvent) => void) | null = null;
    const cleanup = () => {
      if (onMessage) window.removeEventListener('message', onMessage);
      try { overlay.remove(); } catch { /* déjà retiré */ }
    };
    closeBtn.onclick = () => { cleanup(); setIpaymoneyLoading(false); };

    return {
      close: cleanup,
      loadPayment(token: string, redirectUrl: string) {
        const iframe = document.createElement('iframe');
        iframe.src = `https://i-pay.money/api/sdk/payment_pages?token=${encodeURIComponent(token)}`;
        iframe.setAttribute('allow', 'payment');
        iframe.style.cssText = 'border:0;width:100%;height:100%;display:none;';
        // Le loader reste visible tant que l'iframe n'a pas fini de charger.
        iframe.onload = () => {
          iframe.style.display = 'block';
          loader.style.display = 'none';
        };
        overlay.style.display = 'block';
        overlay.insertBefore(iframe, closeBtn);

        onMessage = (event: MessageEvent) => {
          // Sécurité : n'accepter que les messages émis par le domaine iPay.
          let host = '';
          try { host = new URL(event.origin).hostname; } catch { return; }
          if (host !== 'i-pay.money' && !host.endsWith('.i-pay.money')) return;

          const payload = event.data as {
            type?: string;
            other?: { status?: string; reference?: string; amount?: string | number };
          } | null;
          if (!payload || typeof payload !== 'object') return;

          if (payload.type === 'closeModal') {
            cleanup();
            setIpaymoneyLoading(false);
            return;
          }
          if (payload.type === 'payment.response') {
            const o = payload.other || {};
            if (o.status === 'succeeded') {
              // L'activation Premium est faite par le webhook serveur (source de
              // vérité). Ici on redirige juste vers notre page de retour.
              window.location.replace(
                `${redirectUrl}&transactionId=${encodeURIComponent(o.reference || '')}&status=${encodeURIComponent(o.status || '')}&amount=${encodeURIComponent(String(o.amount ?? ''))}`,
              );
            } else {
              cleanup();
              setIpaymoneyLoading(false);
              setPaymentError('Le paiement n\'a pas abouti. Vous pouvez réessayer.');
            }
          }
        };
        window.addEventListener('message', onMessage);
      },
    };
  };

  const handleIPayMoneyPayment = async () => {
    setPaymentError('');
    setIpaymoneyLoading(true);
    // Retour visuel instantané : l'overlay + loader s'affichent dès le clic,
    // pendant que l'on prépare le paiement en arrière-plan.
    const overlay = openIPayOverlay();
    try {
      // 1. Créer la demande de paiement côté serveur (montant canonique) et
      //    récupérer transactionId + URLs de retour.
      const res = await fetch('/api/ipaymoney/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'premium', billingCycle }),
      });
      const data = await res.json();
      if (!res.ok) {
        overlay.close();
        setPaymentError(data.error || 'Erreur lors de l\'initialisation du paiement.');
        setIpaymoneyLoading(false);
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_IPAYMONEY_PUBLIC_KEY;
      if (!publicKey) {
        overlay.close();
        setPaymentError('Configuration iPayMoney manquante.');
        setIpaymoneyLoading(false);
        return;
      }
      // 'live' seulement si explicitement configuré, sinon 'sandbox' (sécurité).
      const ipayEnv =
        process.env.NEXT_PUBLIC_IPAYMONEY_ENV === 'live' ? 'live' : 'sandbox';

      // 2. Créer le token de paiement iPay (endpoint public du SDK ; la clé
      //    publique va dans le corps). 'environement' = orthographe VOULUE par iPay.
      const tokenRes = await fetch(
        'https://i-pay.money/api/sdk/payment_pages/create_payment_token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: publicKey,
            amount: data.amount,
            environement: ipayEnv,
            transaction_id: data.transactionId,
            parent_domaine: window.location.origin,
          }),
        },
      );
      const tokenData = (await tokenRes.json().catch(() => null)) as { token?: string } | null;
      if (!tokenRes.ok || !tokenData?.token) {
        overlay.close();
        setPaymentError('Le paiement n\'a pas pu démarrer. Réessayez dans un instant.');
        setIpaymoneyLoading(false);
        return;
      }

      // 3. Charger la page de paiement iPay dans l'overlay déjà ouvert.
      overlay.loadPayment(tokenData.token, data.redirectUrl);
    } catch {
      overlay.close();
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

  return (
    <div className="min-h-screen bg-background">
      {/* Préconnexion à iPay : rabote le délai réseau (DNS + TLS) au clic « Payer ». */}
      <link rel="preconnect" href="https://i-pay.money" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://i-pay.money" />
      {/* Header bar */}
      <div className="bg-[#111] py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="font-[family-name:var(--font-playfair)] text-xl font-bold tracking-[0.01em] text-white">NFI&nbsp;REPORT</Link>
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
                ) : etapeCode ? (
                  /* Compte pas encore confirmé : le code, tapé ici */
                  <EtapeCode
                    email={email.trim()}
                    suite={pageDuPaiement}
                    titre={false}
                    onConfirme={() => { setEtapeCode(false); fetch('/api/auth/bienvenue', { method: 'POST' }).catch(() => {}); }}
                    onModifierAdresse={() => setEtapeCode(false)}
                  />
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
                          className="w-full border border-black/8 rounded-xl pl-11 pr-4 py-3 bg-background focus:outline-hidden focus:border-[#8a8e95]/30 focus:ring-2 focus:ring-[#8a8e95]/10 transition-all text-base"
                          aria-label="Adresse email" placeholder="votre@email.com"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="w-full bg-[#111] text-white py-3 rounded-xl hover:bg-[#222] transition-all text-[14px] font-medium disabled:opacity-50"
                      >
                        {resetLoading ? 'Envoi…' : 'Envoyer le lien'}
                      </button>
                      <Turnstile onJeton={setJeton} tour={tour} action="mot-de-passe-oublie" />
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
                        : 'Créez votre compte, puis tapez le code reçu par e-mail.'
                      }
                    </p>

                    {authMode === 'signup' ? (
                      <FormulaireInscription
                        variante="paiement"
                        suite={pageDuPaiement}
                        emailInitial={email}
                        onCompteExistant={(adresse) => {
                          setEmail(adresse);
                          setAuthMode('login');
                          setAuthError('Un compte existe déjà avec cette adresse. Connectez-vous.');
                        }}
                        onConnecte={() => setAuthError('')}
                      />
                    ) : (
                    <>
                    {authError && (
                      <div role="alert" className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 text-pretty">
                        {authError}
                        {nonConfirme && (
                          <button
                            type="button"
                            onClick={demanderCode}
                            disabled={authLoading}
                            className="mt-2 block font-semibold text-[#111] underline underline-offset-2 disabled:opacity-50"
                          >
                            Recevoir un code pour l’activer
                          </button>
                        )}
                      </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full border border-black/8 rounded-xl pl-11 pr-4 py-3 bg-background focus:outline-hidden focus:border-[#8a8e95]/30 focus:ring-2 focus:ring-[#8a8e95]/10 transition-all text-base"
                          aria-label="Adresse email" placeholder="Entrez votre email"
                          autoComplete="email"
                        />
                      </div>

                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full border border-black/8 rounded-xl pl-11 pr-11 py-3 bg-background focus:outline-hidden focus:border-[#8a8e95]/30 focus:ring-2 focus:ring-[#8a8e95]/10 transition-all text-base"
                          aria-label="Mot de passe" placeholder="Mot de passe"
                          autoComplete="current-password"
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

                      <Turnstile onJeton={setJeton} tour={tour} action="connexion-paiement" />

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-[#111] text-white py-3 rounded-xl hover:bg-[#222] transition-all text-[14px] font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continuer'}
                      </button>
                    </form>
                    </>
                    )}

                    {authMode === 'login' && (
                      <button
                        onClick={() => { setForgotMode(true); setAuthError(''); }}
                        className="block w-full text-center text-[13px] text-gray-500 hover:text-gray-600 mt-3 transition-colors"
                      >
                        Mot de passe oublié ?
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
                        <>Pas encore de compte ? <span className="text-[#111] font-semibold hover:underline">Créer un compte</span></>
                      ) : (
                        <>Déjà un compte ? <span className="text-[#111] font-semibold hover:underline">Se connecter</span></>
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
                          <p className="font-bold text-[14px]">{formatPrice(getPrice(opt.cycle))}</p>
                          <p className="text-[11px] text-gray-500">{opt.durationLabel}</p>
                          {opt.savings && (
                            <p className="text-emerald-600 text-[10px] font-medium mt-0.5">{opt.savings}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Paiement via iPayMoney (regroupe Mobile Money Airtel, Moov, Nita, Amana + cartes) */}
                  <div>
                    <p className="text-[12px] text-gray-500 uppercase tracking-wider font-semibold mb-3">
                      Moyen de paiement
                    </p>

                    <button
                      onClick={handleIPayMoneyPayment}
                      disabled={ipaymoneyLoading}
                      className="w-full p-4 rounded-xl border-2 border-black/6 hover:border-black/20 text-left transition-all flex items-center gap-3 disabled:opacity-60"
                    >
                      <Image
                        src="/ipaymoney-logo.png"
                        alt="iPayMoney"
                        width={40}
                        height={40}
                        className="rounded-lg object-contain"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-[15px]">Payer avec iPayMoney</h3>
                        <p className="text-gray-500 text-[12px]">Mobile Money (Airtel, Moov, Nita, Amana) · Visa, Mastercard, American Express</p>
                      </div>
                      {ipaymoneyLoading && <Loader2 className="w-5 h-5 animate-spin text-gray-500" />}
                    </button>

                    <p className="text-[12px] text-gray-500 mt-3 leading-relaxed">
                      Vous serez redirigé vers la page sécurisée iPayMoney pour finaliser votre paiement. Aucune donnée bancaire n&apos;est stockée sur nos serveurs.
                    </p>

                    {paymentError && (
                      <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-red-700 text-[13px]">{paymentError}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: Plan Summary (sticky) ── */}
          <div className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
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
                Paiement unique, accès Premium pour {billingOption.durationLabel}.{' '}
                <span className="font-medium text-gray-700">
                  Aucun prélèvement automatique : à la fin, vous choisissez de renouveler ou non.
                </span>
              </p>

              <div className="border-t border-black/4 pt-5">
                <h4 className="text-[12px] text-gray-500 uppercase tracking-wider font-semibold mb-4">
                  Ce que vous obtenez :
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
