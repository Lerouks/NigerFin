'use client';

import { useState, useEffect } from 'react';
import { Loader2, ArrowRight, Check, Crown, Shield } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  BILLING_OPTIONS,
  CURRENCY,
  PAYMENT_METHODS,
  PREMIUM_TIER,
  FREE_TIER_FEATURES,
  type BillingCycle,
} from '@/config/pricing';

export function PricingContent() {
  const { isSignedIn, userRole, refreshProfile } = useAuth();

  useEffect(() => { refreshProfile(); }, [refreshProfile]);
  const isSubscribed = userRole === 'premium' || userRole === 'admin';

  const [dynamicPrices, setDynamicPrices] = useState<Record<string, number>>({});
  const [loadingPlan, setLoadingPlan] = useState<BillingCycle | null>(null);

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

  const yearlyPrice = getPrice('yearly');
  const monthlyPrice = getPrice('monthly');
  const quarterlyPrice = getPrice('quarterly');

  const handleSubscribe = (cycle: BillingCycle) => {
    setLoadingPlan(cycle);
    window.location.href = `/paiement?tier=premium&cycle=${cycle}`;
  };

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* ── SUBSCRIBER BANNER ── */}
      {isSubscribed && (
        <div className="bg-[#0d0d0d] text-white border-b border-[#d4a843]/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#d4a843] to-[#d4a843] flex items-center justify-center">
                <Crown className="w-3 h-3 text-white" />
              </div>
              <p className="text-sm text-white/60">
                Vous êtes abonné <span className="font-semibold text-[#d4a843]">Premium</span>
              </p>
            </div>
            <Link href="/compte" className="text-sm text-[#d4a843] hover:text-[#e6bc5a] transition-colors font-medium">
              Mon compte &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* ── HERO SECTION ── */}
      <section className="bg-[#0d0d0d] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, #d4a843 0px, #d4a843 1px, transparent 1px, transparent 80px),
                              repeating-linear-gradient(0deg, #d4a843 0px, #d4a843 1px, transparent 1px, transparent 80px)`,
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#d4a843]/40 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text + CTA */}
            <div>
              <div className="inline-flex items-center gap-2.5 mb-6">
                <div className="h-[1px] w-8 bg-[#d4a843]/50" />
                <p className="text-[#d4a843] text-[13px] font-semibold tracking-[0.25em] uppercase">
                  NFI Report Premium
                </p>
              </div>

              <h1 className="text-[2rem] sm:text-[2.5rem] md:text-[3rem] font-bold leading-[1.1] tracking-[-0.02em] text-white mb-5 font-serif">
                L&apos;information financière qui fait la différence
              </h1>

              <p className="text-[17px] text-white/40 max-w-md leading-relaxed mb-8">
                Analyses approfondies, données exclusives et outils financiers pour prendre les meilleures décisions.
              </p>

              {/* Featured plan: Annual */}
              <div className="mb-6">
                <p className="text-white/50 text-sm mb-2">Accès Numérique Annuel</p>
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-[#d4a843] text-lg line-through opacity-60">
                    {(monthlyPrice * 12).toLocaleString('fr-FR')}
                  </span>
                  <span className="text-[#d4a843] text-2xl font-bold">
                    {yearlyPrice.toLocaleString('fr-FR')} {CURRENCY}
                  </span>
                  <span className="text-white/40 text-sm">votre première année</span>
                </div>
                <p className="text-white/30 text-[13px] leading-relaxed">
                  Renouvellement automatique à {yearlyPrice.toLocaleString('fr-FR')} {CURRENCY}/an.
                  <br />
                  Résiliable en ligne à tout moment avant le renouvellement.
                </p>
              </div>

              <button
                onClick={() => handleSubscribe('yearly')}
                disabled={!!loadingPlan || isSubscribed}
                className="w-full sm:w-auto px-10 py-4 rounded-xl text-[15px] font-bold transition-all duration-300 flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#d4a843] to-[#e8c96a] text-white hover:from-[#b8922f] hover:to-[#d4a843] active:scale-[0.98] disabled:opacity-40 shadow-lg shadow-[#d4a843]/25"
              >
                {loadingPlan === 'yearly' ? (
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

              {/* Payment methods */}
              <div className="flex items-center gap-3 mt-5">
                <span className="text-white/25 text-[12px]">Nous acceptons :</span>
                <div className="flex items-center gap-2">
                  {Object.values(PAYMENT_METHODS).map((m) => (
                    <div key={m.id} className="w-8 h-8 rounded-md bg-white/[0.06] flex items-center justify-center">
                      <Image
                        src={m.logo}
                        alt={m.shortName}
                        width={20}
                        height={20}
                        className="rounded object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust indicators */}
              <div className="mt-6 flex items-center gap-4 text-white/20 text-[11px] tracking-wide uppercase">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3" /> Résiliable à tout moment
                </span>
                <span className="text-white/10">|</span>
                <span className="flex items-center gap-1.5">
                  Accès instantané
                </span>
              </div>
            </div>

            {/* Right: What you get */}
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-8 md:p-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white font-bold text-lg">Accès Annuel</h2>
                <span className="text-[#d4a843] font-bold text-lg">
                  {yearlyPrice.toLocaleString('fr-FR')} {CURRENCY}
                </span>
              </div>

              <p className="text-white/30 text-[13px] leading-relaxed mb-6">
                Renouvellement automatique à {yearlyPrice.toLocaleString('fr-FR')} {CURRENCY}/an.{' '}
                <span className="font-medium text-white/50">
                  Résiliable en ligne avant le renouvellement.
                </span>
              </p>

              <div className="border-t border-white/[0.06] pt-6">
                <h3 className="text-white/60 text-[13px] font-semibold uppercase tracking-wider mb-5">
                  Ce que vous obtenez :
                </h3>
                <ul className="space-y-3.5">
                  {PREMIUM_TIER.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#d4a843]/15 flex items-center justify-center mt-0.5 flex-shrink-0">
                        <Check className="w-3 h-3 text-[#d4a843] stroke-[2.5]" />
                      </div>
                      <span className="text-[14px] text-white/60 leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OTHER PLAN OPTIONS ── */}
      {!isSubscribed && (
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <h2 className="text-[12px] tracking-[0.2em] uppercase text-[#888] font-bold mb-2">
                Autres options d&apos;abonnement
              </h2>
              <p className="text-[14px] text-[#aaa]">
                Résiliable à tout moment avant la date de renouvellement.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Monthly */}
              <div className="bg-white rounded-2xl border border-black/[0.06] p-7 flex flex-col">
                <h3 className="text-[16px] font-bold text-[#111] mb-4 text-center">
                  Accès Mensuel
                </h3>
                <p className="text-center text-2xl font-bold text-[#111] mb-1">
                  {monthlyPrice.toLocaleString('fr-FR')} {CURRENCY}
                </p>
                <p className="text-center text-[13px] text-[#999] mb-2">
                  votre premier mois
                </p>
                <p className="text-center text-[12px] text-[#aaa] mb-6">
                  Renouvellement à {monthlyPrice.toLocaleString('fr-FR')} {CURRENCY}/mois
                </p>

                <button
                  onClick={() => handleSubscribe('monthly')}
                  disabled={!!loadingPlan}
                  className="mt-auto w-full py-3 rounded-xl text-[14px] font-semibold border border-black/[0.12] text-[#333] hover:bg-[#111] hover:text-white hover:border-[#111] transition-all duration-300 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loadingPlan === 'monthly' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Choisir Mensuel'
                  )}
                </button>
              </div>

              {/* Quarterly */}
              <div className="bg-white rounded-2xl border border-black/[0.06] p-7 flex flex-col">
                <h3 className="text-[16px] font-bold text-[#111] mb-4 text-center">
                  Accès Trimestriel
                </h3>
                <p className="text-center text-2xl font-bold text-[#111] mb-1">
                  {quarterlyPrice.toLocaleString('fr-FR')} {CURRENCY}
                </p>
                <p className="text-center text-[13px] text-[#999] mb-2">
                  votre premier trimestre
                </p>
                <p className="text-center text-[12px] text-[#aaa] mb-2">
                  Renouvellement à {quarterlyPrice.toLocaleString('fr-FR')} {CURRENCY}/trimestre
                </p>
                {BILLING_OPTIONS.find(b => b.cycle === 'quarterly')?.savings && (
                  <p className="text-center text-[12px] text-emerald-600 font-medium mb-6">
                    {BILLING_OPTIONS.find(b => b.cycle === 'quarterly')!.savings}
                  </p>
                )}

                <button
                  onClick={() => handleSubscribe('quarterly')}
                  disabled={!!loadingPlan}
                  className="mt-auto w-full py-3 rounded-xl text-[14px] font-semibold border border-black/[0.12] text-[#333] hover:bg-[#111] hover:text-white hover:border-[#111] transition-all duration-300 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loadingPlan === 'quarterly' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Choisir Trimestriel'
                  )}
                </button>
              </div>

              {/* Free */}
              <div className="bg-white rounded-2xl border border-black/[0.06] p-7 flex flex-col">
                <h3 className="text-[16px] font-bold text-[#111] mb-4 text-center">
                  Accès Gratuit
                </h3>
                <p className="text-center text-2xl font-bold text-[#111] mb-1">
                  0 {CURRENCY}
                </p>
                <p className="text-center text-[13px] text-[#999] mb-6">
                  accès limité
                </p>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {FREE_TIER_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#bbb] mt-0.5 flex-shrink-0 stroke-[2.5]" />
                      <span className="text-[13px] text-[#666] leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={isSignedIn ? '/' : '/inscription'}
                  className="mt-auto w-full py-3 rounded-xl text-[14px] font-semibold border border-black/[0.12] text-[#333] hover:bg-[#111] hover:text-white hover:border-[#111] transition-all duration-300 flex items-center justify-center gap-2 text-center"
                >
                  {isSignedIn ? 'Accueil' : 'Créer un compte'}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER NOTE ── */}
      <section className="pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[12px] text-[#aaa] italic">
            Le paiement par carte bancaire sera disponible prochainement.
          </p>
        </div>
      </section>
    </div>
  );
}
