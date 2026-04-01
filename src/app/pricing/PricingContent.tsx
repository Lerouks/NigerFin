'use client';

import { useState, useEffect } from 'react';
import { Check, Loader2, ArrowRight, ChevronRight, Shield, Zap, BookOpen, Bell, BarChart3, Newspaper } from 'lucide-react';
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
  const monthlyOption = BILLING_OPTIONS.find((b) => b.cycle === 'monthly')!;
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
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Subscriber banner */}
      {isSubscribed && (
        <div className="bg-[#111] text-white border-b border-white/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <p className="text-sm text-white/70">
              Vous êtes abonné <span className="font-semibold text-white">Premium</span>
            </p>
            <Link href="/compte" className="text-sm text-[#a08a5e] hover:underline">
              Mon compte &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#111] via-[#1a1a1a] to-[#fafaf9]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 md:pt-28 md:pb-40 text-center">
          <p className="text-[#a08a5e] text-sm font-semibold tracking-[0.2em] uppercase mb-6">
            NFI Report Premium
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-[52px] font-bold leading-[1.1] tracking-tight text-white mb-6 max-w-3xl mx-auto font-serif">
            Comprenez l&apos;économie au-delà des gros titres
          </h1>
          <p className="text-[17px] md:text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
            Analyses approfondies, données exclusives et outils financiers pour prendre les meilleures décisions.
          </p>
        </div>
      </section>

      {/* ── FEATURED PLAN (Annual) ── */}
      <section className="-mt-20 relative z-10 pb-8">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl shadow-xl shadow-black/[0.08] border border-black/[0.04] overflow-hidden">
            {/* Gold accent */}
            <div className="h-1 bg-gradient-to-r from-[#a08a5e] via-[#c4a96a] to-[#a08a5e]" />

            <div className="p-8 md:p-10">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[11px] tracking-[0.2em] uppercase text-[#a08a5e] font-bold">
                  Accès annuel — Meilleure offre
                </p>
                <span className="text-[11px] font-bold tracking-wide uppercase bg-[#a08a5e]/10 text-[#a08a5e] px-3 py-1 rounded-full">
                  {yearlyOption.savings}
                </span>
              </div>

              {/* Price display */}
              <div className="mb-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl md:text-[56px] font-extrabold text-[#111] tracking-tight">
                    {yearlyPrice.toLocaleString('fr-FR')}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-base font-semibold text-[#111]">{CURRENCY}</span>
                    <span className="text-sm text-gray-400">par an</span>
                  </div>
                </div>
              </div>

              <div className="text-[13px] text-gray-400 space-y-0.5 mb-8">
                <p>Renouvellement automatique à {yearlyPrice.toLocaleString('fr-FR')} {CURRENCY}/an.</p>
                <p>Résiliable à tout moment avant la date de renouvellement.</p>
              </div>

              {/* CTA */}
              <button
                onClick={() => handleSubscribe('yearly')}
                disabled={loadingPlan || isSubscribed}
                className="w-full py-4 rounded-xl text-[15px] font-bold transition-all flex items-center justify-center gap-2.5 bg-[#a08a5e] text-white hover:bg-[#8a7550] active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-[#a08a5e]/20"
              >
                {loadingPlan && selectedCycle === 'yearly' ? (
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
              <div className="mt-6 pt-6 border-t border-black/[0.04]">
                <p className="text-[12px] text-gray-400 text-center mb-3">Nous acceptons</p>
                <div className="flex items-center justify-center gap-4">
                  {Object.values(PAYMENT_METHODS).map((m) => (
                    <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50">
                      <Image
                        src={m.logo}
                        alt={m.shortName}
                        width={24}
                        height={24}
                        className="rounded object-contain"
                      />
                      <span className="text-[12px] font-medium text-gray-500">{m.shortName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OTHER PLAN OPTIONS ── */}
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-3">
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">
              Autres formules
            </h2>
          </div>
          <p className="text-center text-[13px] text-gray-400 mb-8">
            Résiliable à tout moment avant la date de renouvellement.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monthly */}
            <div className="bg-white rounded-xl border border-black/[0.06] p-6 md:p-8 flex flex-col justify-between hover:border-black/[0.12] transition-all group">
              <div>
                <p className="text-[11px] tracking-[0.15em] uppercase text-gray-400 font-semibold mb-4">
                  Accès Mensuel
                </p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-[#111]">
                    {monthlyPrice.toLocaleString('fr-FR')}
                  </span>
                  <span className="text-sm text-gray-400">{CURRENCY}/mois</span>
                </div>
                <p className="text-[13px] text-gray-400 mb-6">
                  Renouvellement automatique à {monthlyPrice.toLocaleString('fr-FR')} {CURRENCY}/mois
                </p>
              </div>
              <button
                onClick={() => handleSubscribe('monthly')}
                disabled={loadingPlan || isSubscribed}
                className="w-full py-3 rounded-lg text-[14px] font-semibold border-2 border-[#111] text-[#111] hover:bg-[#111] hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingPlan && selectedCycle === 'monthly' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSubscribed ? (
                  'Abonnement actif'
                ) : (
                  <>
                    Choisir Mensuel
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </>
                )}
              </button>
            </div>

            {/* Quarterly */}
            <div className="bg-white rounded-xl border border-black/[0.06] p-6 md:p-8 flex flex-col justify-between hover:border-black/[0.12] transition-all group">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <p className="text-[11px] tracking-[0.15em] uppercase text-gray-400 font-semibold">
                    Accès Trimestriel
                  </p>
                  {quarterlyOption.savings && (
                    <span className="text-[10px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                      {quarterlyOption.savings}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-[#111]">
                    {quarterlyPrice.toLocaleString('fr-FR')}
                  </span>
                  <span className="text-sm text-gray-400">{CURRENCY}/3 mois</span>
                </div>
                <p className="text-[13px] text-gray-400 mb-6">
                  Renouvellement automatique à {quarterlyPrice.toLocaleString('fr-FR')} {CURRENCY}/trimestre
                </p>
              </div>
              <button
                onClick={() => handleSubscribe('quarterly')}
                disabled={loadingPlan || isSubscribed}
                className="w-full py-3 rounded-lg text-[14px] font-semibold border-2 border-[#111] text-[#111] hover:bg-[#111] hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingPlan && selectedCycle === 'quarterly' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSubscribed ? (
                  'Abonnement actif'
                ) : (
                  <>
                    Choisir Trimestriel
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ── */}
      <section className="py-16 md:py-20 bg-white border-y border-black/[0.04]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#111] tracking-tight font-serif">
              Ce que comprend votre abonnement
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PREMIUM_TIER.features.map((feature, i) => {
              const Icon = FEATURE_ICONS[i] || Check;
              return (
                <div key={feature} className="flex gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl bg-[#a08a5e]/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#a08a5e]" />
                  </div>
                  <p className="text-[15px] text-gray-700 leading-snug pt-2">{feature}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── COMPARISON: FREE vs PREMIUM ── */}
      <section className="py-16 md:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-[#111] tracking-tight font-serif">
              Gratuit vs Premium
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Free column */}
            <div className="bg-gray-50 rounded-xl p-6 border border-black/[0.04]">
              <p className="text-[11px] tracking-[0.15em] uppercase text-gray-400 font-bold mb-4">
                Gratuit
              </p>
              <p className="text-xl font-bold text-[#111] mb-6">0 {CURRENCY}</p>
              <ul className="space-y-3">
                {FREE_TIER_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-[13px] text-gray-500">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium column */}
            <div className="bg-[#111] rounded-xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#a08a5e]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <p className="text-[11px] tracking-[0.15em] uppercase text-[#a08a5e] font-bold mb-4 relative">
                Premium
              </p>
              <p className="text-xl font-bold mb-6 relative">
                {monthlyPrice.toLocaleString('fr-FR')} <span className="text-sm font-normal text-white/50">{CURRENCY}/mois</span>
              </p>
              <ul className="space-y-3 relative">
                {PREMIUM_TIER.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#a08a5e] mt-0.5 flex-shrink-0" />
                    <span className="text-[13px] text-white/70">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── PAYMENT METHODS ── */}
      <section className="py-12 md:py-16 bg-white border-y border-black/[0.04]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-lg font-semibold text-[#111]">Moyens de paiement acceptés</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.values(PAYMENT_METHODS).map((m) => (
              <Link
                key={m.id}
                href={isSignedIn ? `/paiement?tier=premium&cycle=${selectedCycle}` : '/connexion'}
                className="flex items-center gap-4 p-5 rounded-xl border border-black/[0.06] hover:border-[#a08a5e]/30 hover:shadow-md hover:shadow-[#a08a5e]/5 transition-all group bg-white"
              >
                <Image
                  src={m.logo}
                  alt={m.shortName}
                  width={44}
                  height={44}
                  className="rounded-xl object-contain"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-[#111]">{m.shortName}</p>
                  <p className="text-[12px] text-gray-400 truncate">{m.name}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#a08a5e] group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>

          <p className="text-center text-[12px] text-gray-400 italic mt-6">
            Le paiement par carte bancaire sera disponible prochainement.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#111] tracking-tight font-serif">
              Questions fréquentes
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <div
                key={q}
                className="bg-white rounded-xl border border-black/[0.06] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <h3 className="font-semibold text-[15px] text-[#111] pr-4">{q}</h3>
                  <div
                    className={`w-6 h-6 rounded-full border border-black/[0.08] flex items-center justify-center flex-shrink-0 transition-transform ${
                      openFaq === i ? 'rotate-45' : ''
                    }`}
                  >
                    <span className="text-[14px] text-gray-400 leading-none">+</span>
                  </div>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="px-6 pb-5 text-gray-500 text-[14px] leading-relaxed">{a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      {!isSubscribed && (
        <section className="pb-20 md:pb-28">
          <div className="max-w-lg mx-auto px-4 sm:px-6">
            <div className="bg-[#111] rounded-2xl p-8 md:p-10 text-center text-white relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#a08a5e]/5 rounded-full -translate-y-1/2" />
              <h2 className="text-xl md:text-2xl font-bold mb-3 relative font-serif">
                Prêt à aller plus loin ?
              </h2>
              <p className="text-white/50 text-[14px] mb-8 relative">
                Accédez à l&apos;intégralité de nos analyses dès aujourd&apos;hui.
              </p>
              <button
                onClick={() => handleSubscribe('yearly')}
                disabled={loadingPlan}
                className="w-full py-4 rounded-xl text-[15px] font-bold transition-all flex items-center justify-center gap-2.5 bg-[#a08a5e] text-white hover:bg-[#8a7550] active:scale-[0.98] disabled:opacity-50 relative"
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
              <p className="text-[12px] text-white/30 mt-4 relative">
                Résiliable à tout moment. Renouvellement automatique.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
