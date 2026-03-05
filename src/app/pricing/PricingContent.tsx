'use client';

import { Check, Star } from 'lucide-react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { subscriptionPlans } from '@/lib/subscription';

export function PricingContent() {
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Hero */}
      <section className="bg-[#111] text-white py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/40 block mb-4">
            Abonnements
          </span>
          <h1 className="text-4xl md:text-5xl mb-5 leading-[1.1]">
            Choisissez votre plan
          </h1>
          <p className="text-[17px] text-white/50 max-w-2xl mx-auto leading-relaxed">
            Accédez à l&apos;information économique et financière premium du Niger et de
            l&apos;Afrique de l&apos;Ouest.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {subscriptionPlans.map((plan) => {
              const isPopular = plan.id === 'standard';
              const isPro = plan.id === 'premium';

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
                    {/* Badge */}
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

                    <div className="mb-6">
                      <span className={`text-3xl font-bold ${isPopular ? 'text-white' : ''}`}>
                        {plan.price === 0 ? 'Gratuit' : `${plan.price.toLocaleString('fr-FR')}`}
                      </span>
                      {plan.price > 0 && (
                        <span className={`text-sm ml-1 ${isPopular ? 'text-white/50' : 'text-gray-500'}`}>
                          FCFA/mois
                        </span>
                      )}
                    </div>

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

                    {isSignedIn ? (
                      <button
                        className={`w-full py-3 rounded-lg text-[14px] transition-colors ${
                          isPopular
                            ? 'bg-white text-black hover:bg-white/90'
                            : isPro
                            ? 'bg-[#111] text-white hover:bg-[#333]'
                            : 'border border-black/[0.1] hover:bg-black/5'
                        }`}
                      >
                        {plan.price === 0 ? 'Plan actuel' : 'Choisir ce plan'}
                      </button>
                    ) : (
                      <SignInButton mode="modal">
                        <button
                          className={`w-full py-3 rounded-lg text-[14px] transition-colors ${
                            isPopular
                              ? 'bg-white text-black hover:bg-white/90'
                              : isPro
                              ? 'bg-[#111] text-white hover:bg-[#333]'
                              : 'border border-black/[0.1] hover:bg-black/5'
                          }`}
                        >
                          {plan.price === 0 ? 'Commencer gratuitement' : 'Choisir ce plan'}
                        </button>
                      </SignInButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ-like section */}
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
                q: 'Comment fonctionne la période d\'essai ?',
                a: 'Le plan Lecteur est gratuit et vous donne accès à 3 articles premium par mois. Vous pouvez passer au plan payant quand vous le souhaitez.',
              },
              {
                q: 'Quels moyens de paiement acceptez-vous ?',
                a: 'Nous acceptons les paiements par carte bancaire, mobile money (Orange Money, Moov Money) et virements bancaires.',
              },
              {
                q: 'Puis-je annuler mon abonnement ?',
                a: 'Vous pouvez annuler à tout moment depuis votre espace personnel. Votre accès premium reste actif jusqu\'à la fin de la période payée.',
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
