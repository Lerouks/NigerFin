'use client';

import { useState, useEffect } from 'react';
import { Check, Loader2, ChevronRight, CreditCard, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  BILLING_OPTIONS,
  CURRENCY,
  PAYMENT_METHODS,
  formatPrice,
  type BillingCycle,
} from '@/config/pricing';

export function PricingContent() {
  const { isSignedIn, userRole, refreshProfile } = useAuth();

  useEffect(() => { refreshProfile(); }, [refreshProfile]);
  const isSubscribed = userRole === 'premium' || userRole === 'admin';

  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('yearly');
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, number>>({});
  const [email, setEmail] = useState('');
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    fetch('/api/prices')
      .then((r) => r.json())
      .then((data) => setDynamicPrices(data))
      .catch(() => {});
  }, []);

  const selectedOption = BILLING_OPTIONS.find((b) => b.cycle === selectedCycle) || BILLING_OPTIONS[2];
  const price = dynamicPrices[`premium_${selectedCycle}`] ?? selectedOption.price;

  const handleSubscribe = () => {
    if (!isSignedIn) {
      window.location.href = '/connexion';
      return;
    }
    setLoadingPlan(true);
    window.location.href = `/paiement?tier=premium&cycle=${selectedCycle}`;
  };

  const advantages = [
    'Accès illimité à tous les articles',
    'Analyses économiques approfondies',
    'Décryptages marchés et entreprises',
    'Accès aux outils d\u2019analyse',
    'Contenu exclusif réservé aux abonnés',
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Subscriber banner */}
      {isSubscribed && (
        <div className="bg-[#111] text-white border-b border-white/10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <p className="text-sm text-white/70">
              Vous êtes abonné <span className="font-semibold text-white">Premium</span>
            </p>
            <Link href="/compte" className="text-sm text-[#a08a5e] hover:underline">
              Mon compte &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* SECTION 1 — Header */}
      <section className="pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-[42px] font-bold leading-tight tracking-tight text-[#111] mb-5">
            Accédez à une analyse économique complète
          </h1>
          <p className="text-[17px] text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Comprenez l&apos;économie, les marchés et les entreprises avec des analyses approfondies et un accès illimité aux contenus.
          </p>
        </div>
      </section>

      {/* SECTION 2 — Offer */}
      <section className="pb-12 md:pb-16">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden">
            {/* Top accent line */}
            <div className="h-[2px] bg-[#a08a5e]" />

            <div className="p-8 md:p-10">
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#a08a5e] font-semibold mb-3">
                Abonnement Premium
              </p>

              {/* Billing cycle selector */}
              <div className="flex gap-2 mb-6">
                {BILLING_OPTIONS.map((opt) => {
                  const dynPrice = dynamicPrices[`premium_${opt.cycle}`] ?? opt.price;
                  return (
                    <button
                      key={opt.cycle}
                      onClick={() => setSelectedCycle(opt.cycle)}
                      className={`flex-1 py-3 px-2 rounded-lg text-center transition-all border ${
                        selectedCycle === opt.cycle
                          ? 'border-[#111] bg-[#111] text-white'
                          : 'border-black/[0.06] bg-[#fafaf9] text-gray-600 hover:border-black/15'
                      }`}
                    >
                      <span className="block text-[13px] font-semibold">
                        {dynPrice.toLocaleString('fr-FR')} {CURRENCY}
                      </span>
                      <span className={`block text-[11px] mt-0.5 ${
                        selectedCycle === opt.cycle ? 'text-white/60' : 'text-gray-400'
                      }`}>
                        {opt.durationLabel}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#111]">
                    {price.toLocaleString('fr-FR')}
                  </span>
                  <span className="text-base text-gray-400">
                    {CURRENCY} / {selectedOption.durationLabel}
                  </span>
                </div>
                {selectedOption.savings && (
                  <p className="text-emerald-600 text-[13px] font-medium mt-1.5">{selectedOption.savings}</p>
                )}
              </div>

              {/* Description */}
              <div className="text-[14px] text-gray-500 leading-relaxed space-y-1 mb-8 pb-8 border-b border-black/[0.04]">
                <p>Accès illimité à tous les articles et analyses.</p>
                <p>Renouvellement automatique.</p>
                <p>Résiliable à tout moment avant la date de renouvellement.</p>
              </div>

              {/* CTA */}
              <button
                onClick={handleSubscribe}
                disabled={loadingPlan || isSubscribed}
                className="w-full py-3.5 rounded-lg text-[15px] font-semibold transition-all flex items-center justify-center gap-2 bg-[#a08a5e] text-white hover:bg-[#8a7550] disabled:opacity-50"
              >
                {loadingPlan ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSubscribed ? (
                  'Abonnement actif'
                ) : (
                  <>
                    Continuer
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Advantages */}
      <section className="pb-16 md:pb-20">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-[#111] mb-6">Ce que comprend votre abonnement</h2>
          <ul className="space-y-4">
            {advantages.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#a08a5e]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-[#a08a5e]" />
                </div>
                <span className="text-[15px] text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-black/[0.06]" />
      </div>

      {/* SECTION 4 — Account (Step 1) */}
      <section className="py-16 md:py-20">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-7 h-7 rounded-full bg-[#111] text-white flex items-center justify-center text-[13px] font-semibold">
              1
            </div>
            <h2 className="text-lg font-semibold text-[#111]">Compte</h2>
          </div>

          {isSignedIn ? (
            <div className="bg-white rounded-xl border border-black/[0.06] p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-[#111]">Vous êtes connecté</p>
                  <p className="text-[13px] text-gray-400">Passez à l&apos;étape suivante</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-black/[0.06] p-6 space-y-5">
              <div>
                <label htmlFor="email" className="block text-[13px] font-medium text-gray-600 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full border border-black/[0.08] rounded-lg px-4 py-3 bg-[#fafaf9] focus:outline-none focus:border-black/15 focus:ring-1 focus:ring-black/5 transition-all text-[15px]"
                />
              </div>
              <Link
                href={`/connexion${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                className="block w-full py-3 rounded-lg text-[14px] font-semibold text-center bg-[#111] text-white hover:bg-[#222] transition-colors"
              >
                Se connecter ou créer un compte
              </Link>

              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-black/[0.06]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-[12px] text-gray-400">ou</span>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full py-3 rounded-lg text-[14px] border border-black/[0.08] hover:bg-gray-50 transition-colors flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continuer avec Google
                </button>
                <button className="w-full py-3 rounded-lg text-[14px] border border-black/[0.08] hover:bg-gray-50 transition-colors flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Continuer avec Apple
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-black/[0.06]" />
      </div>

      {/* SECTION 5 — Payment (Step 2) */}
      <section className="py-16 md:py-20">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-7 h-7 rounded-full bg-[#111] text-white flex items-center justify-center text-[13px] font-semibold">
              2
            </div>
            <h2 className="text-lg font-semibold text-[#111]">Paiement</h2>
          </div>

          <div className="bg-white rounded-xl border border-black/[0.06] p-6 space-y-6">
            {/* Mobile money methods */}
            <div>
              <p className="text-[13px] font-medium text-gray-500 uppercase tracking-wider mb-4">
                Transfert d&apos;argent
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(PAYMENT_METHODS).map((m) => (
                  <Link
                    key={m.id}
                    href={isSignedIn ? `/paiement?tier=premium&cycle=${selectedCycle}` : '/connexion'}
                    className="flex items-center gap-3 p-4 rounded-lg border border-black/[0.06] hover:border-black/15 transition-all group"
                  >
                    <Image
                      src={m.logo}
                      alt={m.shortName}
                      width={36}
                      height={36}
                      className="rounded-lg object-contain"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-[#111]">{m.shortName}</p>
                      <p className="text-[12px] text-gray-400 truncate">{m.name}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/[0.06]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-[12px] text-gray-400">ou</span>
              </div>
            </div>

            {/* Card payment (Stripe placeholder) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] font-medium text-gray-500 uppercase tracking-wider">
                  Carte bancaire
                </p>
                <div className="flex items-center gap-2">
                  <Image
                    src="/card-logos.png"
                    alt="Visa, Mastercard, American Express"
                    width={100}
                    height={24}
                    className="object-contain opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="card-number" className="block text-[13px] text-gray-500 mb-1.5">
                    Numéro de carte
                  </label>
                  <div className="relative">
                    <input
                      id="card-number"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      disabled
                      className="w-full border border-black/[0.08] rounded-lg px-4 py-3 bg-[#fafaf9] text-[15px] pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="card-expiry" className="block text-[13px] text-gray-500 mb-1.5">
                      Date d&apos;expiration
                    </label>
                    <input
                      id="card-expiry"
                      type="text"
                      placeholder="MM / AA"
                      disabled
                      className="w-full border border-black/[0.08] rounded-lg px-4 py-3 bg-[#fafaf9] text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label htmlFor="card-cvc" className="block text-[13px] text-gray-500 mb-1.5">
                      Code de sécurité
                    </label>
                    <input
                      id="card-cvc"
                      type="text"
                      placeholder="CVC"
                      disabled
                      className="w-full border border-black/[0.08] rounded-lg px-4 py-3 bg-[#fafaf9] text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
                <p className="text-[12px] text-gray-400 italic">
                  Le paiement par carte sera disponible prochainement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-black/[0.06]" />
      </div>

      {/* SECTION 6 — Summary */}
      <section className="py-16 md:py-20">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-black/[0.06] p-8 md:p-10">
            <h2 className="text-lg font-semibold text-[#111] mb-6">Récapitulatif</h2>

            <div className="flex items-center justify-between pb-4 border-b border-black/[0.04]">
              <span className="text-[15px] text-gray-600">Abonnement Premium</span>
              <span className="text-[15px] font-semibold text-[#111]">
                {price.toLocaleString('fr-FR')} {CURRENCY} / {selectedOption.durationLabel}
              </span>
            </div>

            <div className="pt-5 pb-6 text-[14px] text-gray-500 leading-relaxed space-y-1">
              <p>Votre abonnement sera renouvelé automatiquement chaque {selectedCycle === 'yearly' ? 'année' : selectedCycle === 'quarterly' ? 'trimestre' : 'mois'}.</p>
              <p>Vous pouvez résilier à tout moment avant la date de renouvellement.</p>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={loadingPlan || isSubscribed}
              className="w-full py-3.5 rounded-lg text-[15px] font-semibold transition-all flex items-center justify-center gap-2 bg-[#111] text-white hover:bg-[#222] disabled:opacity-50"
            >
              {loadingPlan ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSubscribed ? (
                'Abonnement actif'
              ) : (
                'Confirmer l\u2019abonnement'
              )}
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20 md:pb-28">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-black/[0.06] pt-16 md:pt-20">
            <h2 className="text-lg font-semibold text-[#111] text-center mb-10">Questions fréquentes</h2>
            <div className="space-y-4">
              {[
                {
                  q: 'Quels moyens de paiement acceptez-vous ?',
                  a: 'Nous acceptons les paiements via Nita Transfert d\u2019Argent et Amana Transfert d\u2019Argent. Le paiement par carte bancaire sera disponible prochainement.',
                },
                {
                  q: 'Puis-je résilier à tout moment ?',
                  a: 'Oui, vous pouvez résilier votre abonnement à tout moment depuis votre espace personnel. Votre accès reste actif jusqu\u2019à la fin de la période payée.',
                },
                {
                  q: 'Comment fonctionne le renouvellement ?',
                  a: 'Votre abonnement est renouvelé automatiquement à la fin de chaque période. Vous recevez un rappel avant le renouvellement.',
                },
                {
                  q: 'Puis-je changer de formule ?',
                  a: 'Vous pouvez passer d\u2019une formule à une autre à tout moment. Le changement prend effet à la prochaine période de facturation.',
                },
              ].map(({ q, a }) => (
                <div key={q} className="bg-white rounded-xl p-6 border border-black/[0.06]">
                  <h3 className="font-semibold text-[15px] text-[#111] mb-2">{q}</h3>
                  <p className="text-gray-500 text-[14px] leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
