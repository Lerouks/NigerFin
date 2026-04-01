'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, Loader2, ArrowRight, ChevronRight, Shield, Zap, BookOpen, Bell, BarChart3, Newspaper, Star, Crown, Sparkles } from 'lucide-react';
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

const FEATURE_ICONS = [BookOpen, BarChart3, Zap, Newspaper, Bell, Shield];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, isVisible };
}

function FadeInSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export function PricingContent() {
  const { isSignedIn, userRole, refreshProfile } = useAuth();

  useEffect(() => { refreshProfile(); }, [refreshProfile]);
  const isSubscribed = userRole === 'premium' || userRole === 'admin';

  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('yearly');
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, number>>({});
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

  const yearlyOption = BILLING_OPTIONS.find((b) => b.cycle === 'yearly')!;
  const quarterlyOption = BILLING_OPTIONS.find((b) => b.cycle === 'quarterly')!;

  const yearlyPrice = getPrice('yearly');
  const monthlyPrice = getPrice('monthly');
  const quarterlyPrice = getPrice('quarterly');

  const handleSubscribe = (cycle: BillingCycle) => {
    if (!isSignedIn) {
      window.location.href = '/connexion';
      return;
    }
    setLoadingPlan(true);
    setSelectedCycle(cycle);
    window.location.href = `/paiement?tier=premium&cycle=${cycle}`;
  };

  const faqs = [
    {
      q: 'Quels moyens de paiement acceptez-vous\u00a0?',
      a: 'Nous acceptons les paiements via Nita Transfert d\u2019Argent et Amana Transfert d\u2019Argent. Le paiement par carte bancaire sera disponible prochainement.',
    },
    {
      q: 'Puis-je résilier à tout moment\u00a0?',
      a: 'Oui, vous pouvez résilier votre abonnement à tout moment depuis votre espace personnel. Votre accès reste actif jusqu\u2019à la fin de la période payée.',
    },
    {
      q: 'Comment fonctionne le renouvellement\u00a0?',
      a: 'Votre abonnement est renouvelé automatiquement à la fin de chaque période. Vous recevez un rappel avant le renouvellement.',
    },
    {
      q: 'Puis-je changer de formule\u00a0?',
      a: 'Vous pouvez passer d\u2019une formule à une autre à tout moment. Le changement prend effet à la prochaine période de facturation.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* ── SUBSCRIBER BANNER ── */}
      {isSubscribed && (
        <div className="bg-[#0d0d0d] text-white border-b border-[#a08a5e]/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#d4a843] to-[#a08a5e] flex items-center justify-center">
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

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* Layered background */}
        <div className="absolute inset-0 bg-[#0d0d0d]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, #d4a843 0px, #d4a843 1px, transparent 1px, transparent 80px),
                              repeating-linear-gradient(0deg, #d4a843 0px, #d4a843 1px, transparent 1px, transparent 80px)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#fafaf9]" />

        {/* Decorative gold line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#d4a843]/40 to-transparent" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-40 md:pt-32 md:pb-52 text-center">
          {/* Overline */}
          <div className="inline-flex items-center gap-2.5 mb-8">
            <div className="h-[1px] w-8 bg-[#d4a843]/50" />
            <p className="text-[#d4a843] text-[13px] font-semibold tracking-[0.25em] uppercase">
              NFI Report Premium
            </p>
            <div className="h-[1px] w-8 bg-[#d4a843]/50" />
          </div>

          <h1 className="text-[2rem] sm:text-[2.75rem] md:text-[3.5rem] font-bold leading-[1.08] tracking-[-0.02em] text-white mb-7 max-w-[680px] mx-auto font-serif">
            L&apos;information financière qui fait la différence
          </h1>

          <p className="text-[17px] md:text-[19px] text-white/40 max-w-xl mx-auto leading-relaxed font-light">
            Analyses approfondies, données exclusives et outils financiers pour prendre les meilleures décisions.
          </p>

          {/* Trust indicators */}
          <div className="mt-10 flex items-center justify-center gap-6 text-white/25 text-[12px] tracking-wide uppercase">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Résiliable à tout moment
            </span>
            <span className="hidden sm:inline text-white/10">|</span>
            <span className="hidden sm:flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" /> Accès instantané
            </span>
          </div>
        </div>
      </section>

      {/* ── PRICING CARDS ── */}
      <section className="-mt-28 md:-mt-32 relative z-10 pb-16 md:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 items-end">

            {/* ─ Monthly ─ */}
            <FadeInSection delay={0}>
              <div className="group bg-white rounded-2xl border border-black/[0.06] hover:border-black/[0.12] p-7 md:p-8 flex flex-col transition-all duration-500 hover:shadow-lg hover:shadow-black/[0.04]">
                <p className="text-[11px] tracking-[0.2em] uppercase text-[#888] font-semibold mb-5">
                  Mensuel
                </p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-[2.25rem] font-extrabold text-[#111] tracking-tight tabular-nums">
                    {monthlyPrice.toLocaleString('fr-FR')}
                  </span>
                  <span className="text-sm text-[#999] font-medium">{CURRENCY}</span>
                </div>
                <p className="text-[13px] text-[#aaa] mb-8">par mois</p>

                <ul className="space-y-3 mb-8 flex-1">
                  {PREMIUM_TIER.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#bbb] mt-0.5 flex-shrink-0 stroke-[2.5]" />
                      <span className="text-[13px] text-[#666] leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe('monthly')}
                  disabled={loadingPlan || isSubscribed}
                  className="w-full py-3.5 rounded-xl text-[14px] font-semibold border border-black/[0.12] text-[#333] hover:bg-[#111] hover:text-white hover:border-[#111] transition-all duration-300 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loadingPlan && selectedCycle === 'monthly' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isSubscribed ? (
                    'Abonnement actif'
                  ) : (
                    <>Choisir</>
                  )}
                </button>
              </div>
            </FadeInSection>

            {/* ─ Annual (Featured) ─ */}
            <FadeInSection delay={120}>
              <div className="relative bg-[#0d0d0d] rounded-2xl p-7 md:p-8 flex flex-col shadow-2xl shadow-black/20 ring-1 ring-white/[0.06] md:-my-4">
                {/* Gold top accent */}
                <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-[#a08a5e] via-[#d4a843] to-[#a08a5e]" />

                {/* Badge */}
                <div className="flex items-center justify-between mb-5">
                  <p className="text-[11px] tracking-[0.2em] uppercase text-[#d4a843] font-bold">
                    Annuel
                  </p>
                  <span className="text-[10px] font-bold tracking-wider uppercase bg-[#d4a843]/15 text-[#d4a843] px-3 py-1 rounded-full border border-[#d4a843]/20 whitespace-nowrap">
                    {yearlyOption.savings}
                  </span>
                </div>

                <div className="flex items-baseline gap-2.5 mb-1">
                  <span className="text-[2.75rem] md:text-[3rem] font-extrabold text-white tracking-tight tabular-nums">
                    {yearlyPrice.toLocaleString('fr-FR')}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white/80">{CURRENCY}</span>
                    <span className="text-[12px] text-white/30">par an</span>
                  </div>
                </div>

                <p className="text-[12px] text-white/25 mb-8">
                  Soit {Math.round(yearlyPrice / 12).toLocaleString('fr-FR')} {CURRENCY}/mois
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  {PREMIUM_TIER.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#d4a843] mt-0.5 flex-shrink-0 stroke-[2.5]" />
                      <span className="text-[13px] text-white/60 leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe('yearly')}
                  disabled={loadingPlan || isSubscribed}
                  className="w-full py-4 rounded-xl text-[15px] font-bold transition-all duration-300 flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#a08a5e] to-[#c4a96a] text-white hover:from-[#8a7550] hover:to-[#a08a5e] active:scale-[0.98] disabled:opacity-40 shadow-lg shadow-[#a08a5e]/25"
                >
                  {loadingPlan && selectedCycle === 'yearly' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isSubscribed ? (
                    'Abonnement actif'
                  ) : (
                    <>
                      S&apos;abonner
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Payment logos */}
                <div className="mt-5 pt-5 border-t border-white/[0.06]">
                  <div className="flex items-center justify-center gap-3">
                    {Object.values(PAYMENT_METHODS).map((m) => (
                      <div key={m.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04]">
                        <Image
                          src={m.logo}
                          alt={m.shortName}
                          width={20}
                          height={20}
                          className="rounded object-contain"
                        />
                        <span className="text-[11px] font-medium text-white/30">{m.shortName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeInSection>

            {/* ─ Quarterly ─ */}
            <FadeInSection delay={240}>
              <div className="group bg-white rounded-2xl border border-black/[0.06] hover:border-black/[0.12] p-7 md:p-8 flex flex-col transition-all duration-500 hover:shadow-lg hover:shadow-black/[0.04]">
                <div className="flex items-center gap-3 mb-5">
                  <p className="text-[11px] tracking-[0.2em] uppercase text-[#888] font-semibold">
                    Trimestriel
                  </p>
                  {quarterlyOption.savings && (
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      {quarterlyOption.savings}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-[2.25rem] font-extrabold text-[#111] tracking-tight tabular-nums">
                    {quarterlyPrice.toLocaleString('fr-FR')}
                  </span>
                  <span className="text-sm text-[#999] font-medium">{CURRENCY}</span>
                </div>
                <p className="text-[13px] text-[#aaa] mb-8">par trimestre</p>

                <ul className="space-y-3 mb-8 flex-1">
                  {PREMIUM_TIER.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#bbb] mt-0.5 flex-shrink-0 stroke-[2.5]" />
                      <span className="text-[13px] text-[#666] leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe('quarterly')}
                  disabled={loadingPlan || isSubscribed}
                  className="w-full py-3.5 rounded-xl text-[14px] font-semibold border border-black/[0.12] text-[#333] hover:bg-[#111] hover:text-white hover:border-[#111] transition-all duration-300 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loadingPlan && selectedCycle === 'quarterly' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isSubscribed ? (
                    'Abonnement actif'
                  ) : (
                    <>Choisir</>
                  )}
                </button>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ── */}
      <FadeInSection>
        <section className="py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section header with editorial line */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 mb-5">
                <div className="h-[1px] w-12 bg-[#d4a843]/30" />
                <Sparkles className="w-4 h-4 text-[#d4a843]/50" />
                <div className="h-[1px] w-12 bg-[#d4a843]/30" />
              </div>
              <h2 className="text-[1.75rem] md:text-[2.25rem] font-bold text-[#111] tracking-[-0.02em] font-serif">
                Ce que comprend votre abonnement
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
              {PREMIUM_TIER.features.map((feature, i) => {
                const Icon = FEATURE_ICONS[i] || Check;
                return (
                  <FadeInSection key={feature} delay={i * 80}>
                    <div className="group flex gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f5f0e6] to-[#ede7d9] flex items-center justify-center flex-shrink-0 group-hover:from-[#d4a843]/15 group-hover:to-[#d4a843]/10 transition-all duration-500">
                        <Icon className="w-5 h-5 text-[#a08a5e] group-hover:text-[#d4a843] transition-colors duration-500" />
                      </div>
                      <div className="pt-1">
                        <p className="text-[15px] text-[#333] leading-relaxed font-medium">{feature}</p>
                      </div>
                    </div>
                  </FadeInSection>
                );
              })}
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* ── FREE vs PREMIUM COMPARISON ── */}
      <FadeInSection>
        <section className="py-20 md:py-28 bg-[#f5f5f0] border-y border-black/[0.04]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-[1.75rem] md:text-[2.25rem] font-bold text-[#111] tracking-[-0.02em] font-serif">
                Gratuit vs Premium
              </h2>
              <p className="text-[15px] text-[#888] mt-3">
                Comparez les accès et choisissez la formule qui vous convient.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Free */}
              <div className="bg-white rounded-2xl p-7 md:p-8 border border-black/[0.05]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-[#f0efe9] flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-[#999]" />
                  </div>
                  <p className="text-[12px] tracking-[0.2em] uppercase text-[#999] font-bold">
                    Gratuit
                  </p>
                </div>
                <p className="text-2xl font-bold text-[#111] mb-7">0 <span className="text-sm font-medium text-[#999]">{CURRENCY}</span></p>
                <ul className="space-y-3.5">
                  {FREE_TIER_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#f0efe9] flex items-center justify-center mt-0.5 flex-shrink-0">
                        <Check className="w-3 h-3 text-[#aaa] stroke-[2.5]" />
                      </div>
                      <span className="text-[14px] text-[#666]">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Premium */}
              <div className="relative bg-[#0d0d0d] rounded-2xl p-7 md:p-8 text-white overflow-hidden">
                {/* Subtle glow */}
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#d4a843]/8 rounded-full blur-3xl" />
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#d4a843]/5 rounded-full blur-2xl" />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4a843] to-[#a08a5e] flex items-center justify-center">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-[12px] tracking-[0.2em] uppercase text-[#d4a843] font-bold">
                      Premium
                    </p>
                  </div>
                  <p className="text-2xl font-bold mb-7">
                    {monthlyPrice.toLocaleString('fr-FR')} <span className="text-sm font-medium text-white/35">{CURRENCY}/mois</span>
                  </p>
                  <ul className="space-y-3.5">
                    {PREMIUM_TIER.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#d4a843]/15 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <Check className="w-3 h-3 text-[#d4a843] stroke-[2.5]" />
                        </div>
                        <span className="text-[14px] text-white/60">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* ── PAYMENT METHODS ── */}
      <FadeInSection>
        <section className="py-16 md:py-24">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-lg font-semibold text-[#111] tracking-tight">
                Moyens de paiement acceptés
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.values(PAYMENT_METHODS).map((m) => (
                <Link
                  key={m.id}
                  href={isSignedIn ? `/paiement?tier=premium&cycle=${selectedCycle}` : '/connexion'}
                  className="group flex items-center gap-4 p-5 rounded-xl border border-black/[0.06] bg-white hover:border-[#d4a843]/30 hover:shadow-lg hover:shadow-[#d4a843]/[0.04] transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#f5f5f0] flex items-center justify-center group-hover:bg-[#d4a843]/10 transition-colors duration-300">
                    <Image
                      src={m.logo}
                      alt={m.shortName}
                      width={28}
                      height={28}
                      className="rounded-lg object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-[#111]">{m.shortName}</p>
                    <p className="text-[12px] text-[#999] truncate">{m.name}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#ccc] group-hover:text-[#d4a843] group-hover:translate-x-1 transition-all duration-300" />
                </Link>
              ))}
            </div>

            <p className="text-center text-[12px] text-[#aaa] italic mt-7">
              Le paiement par carte bancaire sera disponible prochainement.
            </p>
          </div>
        </section>
      </FadeInSection>

      {/* ── FAQ ── */}
      <FadeInSection>
        <section className="py-20 md:py-28 bg-white border-y border-black/[0.04]">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-[1.75rem] md:text-[2.25rem] font-bold text-[#111] tracking-[-0.02em] font-serif">
                Questions fréquentes
              </h2>
            </div>

            <div className="space-y-2">
              {faqs.map(({ q, a }, i) => (
                <div
                  key={q}
                  className="rounded-xl border border-black/[0.05] overflow-hidden transition-all duration-300 hover:border-black/[0.08]"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left group"
                  >
                    <h3 className="font-semibold text-[15px] text-[#222] pr-4 group-hover:text-[#a08a5e] transition-colors duration-300">
                      {q}
                    </h3>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        openFaq === i
                          ? 'bg-[#d4a843] rotate-45'
                          : 'bg-[#f5f5f0] group-hover:bg-[#d4a843]/10'
                      }`}
                    >
                      <span className={`text-[16px] leading-none font-light transition-colors duration-300 ${
                        openFaq === i ? 'text-white' : 'text-[#999]'
                      }`}>+</span>
                    </div>
                  </button>
                  <div
                    className={`grid transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      openFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-[#777] text-[14px] leading-relaxed">{a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* ── BOTTOM CTA ── */}
      {!isSubscribed && (
        <FadeInSection>
          <section className="py-24 md:py-32">
            <div className="max-w-xl mx-auto px-4 sm:px-6">
              <div className="relative bg-[#0d0d0d] rounded-3xl p-10 md:p-14 text-center text-white overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0 opacity-[0.02]" style={{
                  backgroundImage: `repeating-linear-gradient(90deg, #d4a843 0px, #d4a843 1px, transparent 1px, transparent 60px),
                                    repeating-linear-gradient(0deg, #d4a843 0px, #d4a843 1px, transparent 1px, transparent 60px)`,
                }} />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#d4a843]/5 rounded-full blur-3xl -translate-y-1/2" />
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#d4a843]/30 to-transparent" />

                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d4a843] to-[#a08a5e] flex items-center justify-center mx-auto mb-7 shadow-lg shadow-[#d4a843]/20">
                    <Crown className="w-5 h-5 text-white" />
                  </div>

                  <h2 className="text-[1.5rem] md:text-[1.75rem] font-bold mb-3 tracking-[-0.01em] font-serif">
                    Prêt à aller plus loin&nbsp;?
                  </h2>
                  <p className="text-white/35 text-[15px] mb-9 max-w-sm mx-auto leading-relaxed">
                    Accédez à l&apos;intégralité de nos analyses et outils financiers dès aujourd&apos;hui.
                  </p>

                  <button
                    onClick={() => handleSubscribe('yearly')}
                    disabled={loadingPlan}
                    className="w-full py-4 rounded-xl text-[15px] font-bold transition-all duration-300 flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#a08a5e] to-[#c4a96a] text-white hover:from-[#8a7550] hover:to-[#a08a5e] active:scale-[0.98] disabled:opacity-40 shadow-lg shadow-[#a08a5e]/20"
                  >
                    {loadingPlan ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        S&apos;abonner — {yearlyPrice.toLocaleString('fr-FR')} {CURRENCY}/an
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-[12px] text-white/20 mt-5">
                    Résiliable à tout moment · Renouvellement automatique
                  </p>
                </div>
              </div>
            </div>
          </section>
        </FadeInSection>
      )}
    </div>
  );
}
