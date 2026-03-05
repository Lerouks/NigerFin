'use client';

import { useState, useEffect } from 'react';
import { Check, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { TIERS, getMonthlyEquivalent, formatPrice, cycleMonths, type TierId, type BillingCycle } from '@/config/pricing';

const billingCycles: { id: BillingCycle; label: string }[] = [
  { id: 'monthly', label: 'Mensuel' },
  { id: 'quarterly', label: '3 mois' },
  { id: 'yearly', label: 'Annuel' },
];

const plans = [
  {
    id: 'lecteur' as const,
    name: 'Lecteur',
    tier: null as TierId | null,
    features: [
      'Accès aux articles gratuits',
      '3 articles premium / mois',
      'Newsletter mensuelle',
      'Outils de base',
    ],
  },
  {
    id: 'standard' as const,
    name: 'Standard',
    tier: 'standard' as TierId | null,
    features: TIERS.standard.features,
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    tier: 'pro' as TierId | null,
    features: TIERS.pro.features,
  },
];

export function PricingContent() {
  const { isSignedIn, userRole } = useAuth();
  const isSubscribed = userRole === 'standard' || userRole === 'pro' || userRole === 'admin';
  const isMaxPlan = userRole === 'pro' || userRole === 'admin';

  // Filter: standard users see only pro upgrade, others see all
  const visiblePlans = userRole === 'standard'
    ? plans.filter((p) => p.id === 'standard' || p.id === 'pro')
    : plans;

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch('/api/prices')
      .then((r) => r.json())
      .then((data) => setDynamicPrices(data))
      .catch(() => {});
  }, []);

  // Helper to get the actual price (dynamic override or default)
  const getPrice = (tier: TierId, cycle: BillingCycle): number => {
    const key = `${tier}_${cycle}`;
    return dynamicPrices[key] ?? TIERS[tier].plans[cycle].amount;
  };

  const getMonthly = (tier: TierId, cycle: BillingCycle): number => {
    const price = getPrice(tier, cycle);
    return Math.round(price / cycleMonths(cycle));
  };

  const handleSubscribe = async (tier: TierId) => {
    if (!isSignedIn) return;
    setLoadingPlan(tier);

    try {
      const plan = TIERS[tier].plans[billingCycle];

      // If Stripe is configured, try Stripe checkout
      if (plan.priceId) {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priceId: plan.priceId,
            tier,
            billingCycle,
          }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }

      // Fallback: redirect to local payment page (Nita/Amana)
      window.location.href = `/paiement?tier=${tier}&cycle=${billingCycle}`;
    } catch {
      window.location.href = `/paiement?tier=${tier}&cycle=${billingCycle}`;
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Banner for subscribers */}
      {isSubscribed && (
        <div className="bg-emerald-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <p className="text-sm">
              Vous êtes abonné <strong>{userRole === 'pro' ? 'Pro' : 'Standard'}</strong> — votre accès est actif.
            </p>
            <Link href="/compte" className="text-sm underline hover:no-underline">
              Mon compte &rarr;
            </Link>
          </div>
        </div>
      )}

      <section className="bg-[#111] text-white py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/40 block mb-4">Abonnements</span>
          <h1 className="text-4xl md:text-5xl mb-5 leading-[1.1]">
            {isSubscribed ? 'Votre abonnement' : 'Choisissez votre plan'}
          </h1>
          <p className="text-[17px] text-white/50 max-w-2xl mx-auto leading-relaxed">
            {isMaxPlan
              ? 'Vous bénéficiez déjà de l\'accès complet. Gérez votre abonnement depuis votre compte.'
              : isSubscribed
              ? 'Gérez votre abonnement ou découvrez nos autres plans.'
              : 'Accédez à l\'information économique et financière premium du Niger et de l\'Afrique de l\'Ouest.'}
          </p>

          {/* Billing cycle toggle */}
          <div className="flex items-center justify-center gap-1 mt-8 bg-white/10 rounded-lg p-1 max-w-xs mx-auto">
            {billingCycles.map((cycle) => (
              <button
                key={cycle.id}
                onClick={() => setBillingCycle(cycle.id)}
                className={`flex-1 py-2 px-3 rounded-md text-[13px] transition-all ${
                  billingCycle === cycle.id
                    ? 'bg-white text-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {cycle.label}
                {cycle.id === 'yearly' && (
                  <span className="ml-1 text-[10px] text-emerald-400">-20%</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid grid-cols-1 gap-8 ${visiblePlans.length === 2 ? "md:grid-cols-2 max-w-4xl mx-auto" : "md:grid-cols-3"}`}>
            {visiblePlans.map((plan) => {
              const isPopular = plan.id === 'standard';
              const isPro = plan.id === 'pro';
              const isCurrentPlan = userRole === plan.id || (!userRole && plan.id === 'lecteur');
              const monthlyPrice = plan.tier
                ? getMonthly(plan.tier, billingCycle)
                : 0;
              const fullPrice = plan.tier
                ? getPrice(plan.tier, billingCycle)
                : 0;
              const savings = plan.tier && billingCycle !== 'monthly'
                ? TIERS[plan.tier].plans[billingCycle].savings
                : null;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl overflow-hidden border transition-all ${
                    isPopular
                      ? 'bg-[#111] text-white border-white/10 scale-105 shadow-2xl'
                      : 'bg-white border-black/[0.06]'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#b8860b] via-[#d4a843] to-[#f5d576]" />
                  )}
                  <div className="p-8">
                    {isPopular && (
                      <div className="flex items-center gap-1.5 mb-4">
                        <Star className="w-4 h-4" style={{ color: '#d4a843', fill: '#d4a843' }} />
                        <span className="text-[11px] tracking-[0.15em] uppercase" style={{ color: '#d4a843' }}>
                          Le plus populaire
                        </span>
                      </div>
                    )}
                    <h3 className={`text-2xl font-bold mb-2 ${isPopular ? 'text-white' : ''}`}>
                      {plan.name}
                    </h3>
                    <div className="mb-2">
                      <span className={`text-3xl font-bold ${isPopular ? 'text-white' : ''}`}>
                        {monthlyPrice === 0
                          ? 'Gratuit'
                          : monthlyPrice.toLocaleString('fr-FR')}
                      </span>
                      {monthlyPrice > 0 && (
                        <span className={`text-sm ml-1 ${isPopular ? 'text-white/50' : 'text-gray-500'}`}>
                          FCFA/mois
                        </span>
                      )}
                    </div>
                    {savings && (
                      <p className={`text-[12px] mb-4 ${isPopular ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        Économisez {savings} — {fullPrice.toLocaleString('fr-FR')} FCFA
                        {billingCycle === 'quarterly' ? '/trimestre' : '/an'}
                      </p>
                    )}
                    {!savings && <div className="mb-4" />}

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check
                            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              isPopular ? 'text-emerald-400' : 'text-emerald-600'
                            }`}
                          />
                          <span
                            className={`text-[14px] ${
                              isPopular ? 'text-white/80' : 'text-gray-600'
                            }`}
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {isCurrentPlan ? (
                      <Link
                        href="/compte"
                        className={`block w-full py-3 rounded-lg text-[14px] text-center ${
                          isPopular
                            ? 'bg-white/10 text-white/60 hover:bg-white/20'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        } transition-colors`}
                      >
                        Plan actuel &mdash; Gérer
                      </Link>
                    ) : isSignedIn && plan.tier ? (
                      <button
                        onClick={() => handleSubscribe(plan.tier!)}
                        disabled={loadingPlan !== null}
                        className={`w-full py-3 rounded-lg text-[14px] transition-colors flex items-center justify-center gap-2 ${
                          isPopular
                            ? 'bg-white text-black hover:bg-white/90'
                            : isPro
                            ? 'bg-[#111] text-white hover:bg-[#333]'
                            : 'border border-black/[0.1] hover:bg-black/5'
                        }`}
                      >
                        {loadingPlan === plan.tier ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isSubscribed ? (
                          'Changer de plan'
                        ) : (
                          'Choisir ce plan'
                        )}
                      </button>
                    ) : !isSignedIn ? (
                      <Link
                        href={plan.tier ? '/connexion' : '/inscription'}
                        className={`block w-full py-3 rounded-lg text-[14px] transition-colors text-center ${
                          isPopular
                            ? 'bg-white text-black hover:bg-white/90'
                            : isPro
                            ? 'bg-[#111] text-white hover:bg-[#333]'
                            : 'border border-black/[0.1] hover:bg-black/5'
                        }`}
                      >
                        {plan.tier ? 'Choisir ce plan' : 'Commencer gratuitement'}
                      </Link>
                    ) : (
                      <div
                        className={`w-full py-3 rounded-lg text-[14px] text-center ${
                          isPopular ? 'bg-white/10 text-white/40' : 'bg-gray-50 text-gray-400'
                        }`}
                      >
                        Inclus dans votre plan
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl text-center mb-10">Questions fréquentes</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Puis-je changer de plan à tout moment ?',
                a: 'Oui, vous pouvez upgrader ou downgrader votre abonnement à tout moment. Les changements prennent effet immédiatement.',
              },
              {
                q: "Comment fonctionne la période d'essai ?",
                a: 'Le plan Lecteur est gratuit et vous donne accès à 3 articles premium par mois. Vous pouvez passer au plan payant quand vous le souhaitez.',
              },
              {
                q: 'Quels moyens de paiement acceptez-vous ?',
                a: 'Nous acceptons les paiements via Nita Transfert d\'Argent et Amana Transfert d\'Argent. Envoyez le montant exact au numéro indiqué, puis soumettez votre numéro de transaction pour activer votre abonnement.',
              },
              {
                q: 'Puis-je annuler mon abonnement ?',
                a: "Vous pouvez annuler à tout moment depuis votre espace personnel. Votre accès premium reste actif jusqu'à la fin de la période payée.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white rounded-xl p-6 border border-black/[0.06]">
                <h3 className="font-bold mb-2">{q}</h3>
                <p className="text-gray-600 text-[14px]">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
