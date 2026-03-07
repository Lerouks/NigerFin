'use client';

import { useState, useEffect } from 'react';
import { Check, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  PREMIUM_TIER,
  FREE_TIER_FEATURES,
  BILLING_OPTIONS,
  formatPrice,
  getBillingCycleLabel,
  type BillingCycle,
} from '@/config/pricing';

export function PricingContent() {
  const { isSignedIn, userRole, refreshProfile } = useAuth();

  useEffect(() => { refreshProfile(); }, [refreshProfile]);
  const isSubscribed = userRole === 'premium' || userRole === 'admin';

  const [loadingPlan, setLoadingPlan] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('monthly');
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch('/api/prices')
      .then((r) => r.json())
      .then((data) => setDynamicPrices(data))
      .catch(() => {});
  }, []);

  const selectedOption = BILLING_OPTIONS.find((b) => b.cycle === selectedCycle) || BILLING_OPTIONS[0];
  const price = dynamicPrices[`premium_${selectedCycle}`] ?? selectedOption.price;

  const handleSubscribe = async () => {
    if (!isSignedIn) return;
    setLoadingPlan(true);
    try {
      window.location.href = `/paiement?tier=premium&cycle=${selectedCycle}`;
    } catch {
      window.location.href = `/paiement?tier=premium&cycle=${selectedCycle}`;
    } finally {
      setLoadingPlan(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Banner for subscribers */}
      {isSubscribed && (
        <div className="bg-emerald-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <p className="text-sm">
              Vous êtes abonné <strong>Premium</strong> — votre accès est actif.
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
            {isSubscribed
              ? 'Vous bénéficiez de l\'accès complet. Gérez votre abonnement depuis votre compte.'
              : 'Accédez à l\'information économique et financière premium du Niger et de l\'Afrique de l\'Ouest.'}
          </p>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Lecteur - Free */}
            <div className="relative rounded-xl overflow-hidden border bg-white border-black/[0.06]">
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2">Lecteur</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold">Gratuit</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">Accès de base pour suivre l&apos;actualité</p>
                <ul className="space-y-3 mb-8">
                  {FREE_TIER_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
                      <span className="text-[14px] text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                {isSignedIn ? (
                  isSubscribed ? (
                    <div className="w-full py-3 rounded-lg text-[14px] text-center bg-gray-50 text-gray-400">
                      Inclus dans votre plan
                    </div>
                  ) : (
                    <Link
                      href="/compte"
                      className="block w-full py-3 rounded-lg text-[14px] text-center bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                    >
                      Plan actuel &mdash; Gérer
                    </Link>
                  )
                ) : (
                  <Link
                    href="/inscription"
                    className="block w-full py-3 rounded-lg text-[14px] transition-colors text-center border border-black/[0.1] hover:bg-black/5"
                  >
                    Commencer gratuitement
                  </Link>
                )}
              </div>
            </div>

            {/* Premium */}
            <div className="relative rounded-xl overflow-hidden border bg-[#111] text-white border-white/10 shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#b8860b] via-[#d4a843] to-[#f5d576]" />
              <div className="p-8">
                <div className="flex items-center gap-1.5 mb-4">
                  <Star className="w-4 h-4" style={{ color: '#d4a843', fill: '#d4a843' }} />
                  <span className="text-[11px] tracking-[0.15em] uppercase" style={{ color: '#d4a843' }}>
                    Recommandé
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">Premium</h3>

                {/* Billing cycle selector */}
                <div className="flex gap-1 mb-4 bg-white/5 rounded-lg p-1">
                  {BILLING_OPTIONS.map((opt) => (
                    <button
                      key={opt.cycle}
                      onClick={() => setSelectedCycle(opt.cycle)}
                      className={`flex-1 text-[12px] py-2 px-1 rounded-md transition-all text-center ${
                        selectedCycle === opt.cycle
                          ? 'bg-white text-black font-semibold'
                          : 'text-white/50 hover:text-white/80'
                      }`}
                    >
                      {getBillingCycleLabel(opt.cycle)}
                    </button>
                  ))}
                </div>

                <div className="mb-2">
                  <span className="text-3xl font-bold text-white">
                    {price.toLocaleString('fr-FR')}
                  </span>
                  <span className="text-sm ml-1 text-white/50">
                    FCFA/{selectedOption.durationLabel}
                  </span>
                </div>
                {selectedOption.savings && (
                  <p className="text-emerald-400 text-[13px] mb-2">{selectedOption.savings}</p>
                )}
                <div className="mb-4" />
                <ul className="space-y-3 mb-8">
                  {PREMIUM_TIER.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
                      <span className="text-[14px] text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>
                {isSignedIn ? (
                  isSubscribed ? (
                    <Link
                      href="/compte"
                      className="block w-full py-3 rounded-lg text-[14px] text-center bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
                    >
                      Plan actuel &mdash; Gérer
                    </Link>
                  ) : (
                    <button
                      onClick={handleSubscribe}
                      disabled={loadingPlan}
                      className="w-full py-3 rounded-lg text-[14px] transition-colors flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90"
                    >
                      {loadingPlan ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Passer au Premium'
                      )}
                    </button>
                  )
                ) : (
                  <Link
                    href="/connexion"
                    className="block w-full py-3 rounded-lg text-[14px] transition-colors text-center bg-white text-black hover:bg-white/90"
                  >
                    Choisir ce plan
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* All plans comparison */}
          <div className="mt-12 bg-white rounded-xl border border-black/[0.06] overflow-hidden">
            <div className="p-6 border-b border-black/[0.04]">
              <h3 className="text-lg font-bold">Tous les tarifs Premium</h3>
              <p className="text-sm text-gray-500 mt-1">Choisissez la durée qui vous convient</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-black/[0.04]">
              {BILLING_OPTIONS.map((opt) => {
                const dynPrice = dynamicPrices[`premium_${opt.cycle}`] ?? opt.price;
                return (
                  <div key={opt.cycle} className="p-6 text-center">
                    <p className="text-sm font-medium text-gray-500 mb-2">{getBillingCycleLabel(opt.cycle)}</p>
                    <p className="text-2xl font-bold">{formatPrice(dynPrice)}</p>
                    <p className="text-sm text-gray-400 mt-1">{opt.durationLabel}</p>
                    {opt.savings && (
                      <p className="text-emerald-600 text-[13px] font-medium mt-2">{opt.savings}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl text-center mb-10">Questions fréquentes</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Quelles sont les durées d\'abonnement disponibles ?',
                a: 'Nous proposons trois formules : mensuel à 5 000 FCFA, trimestriel à 10 000 FCFA (3 mois) et annuel à 50 000 FCFA. Plus la durée est longue, plus vous économisez.',
              },
              {
                q: 'Puis-je changer de plan à tout moment ?',
                a: 'Oui, vous pouvez passer au plan Premium à tout moment. Les changements prennent effet immédiatement.',
              },
              {
                q: "Comment fonctionne le plan Lecteur ?",
                a: 'Le plan Lecteur est gratuit et vous donne accès aux articles gratuits illimités et à 3 articles premium par mois. Vous pouvez passer au plan Premium quand vous le souhaitez.',
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
