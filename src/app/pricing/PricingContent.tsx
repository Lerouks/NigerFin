'use client';

import { useState, useEffect } from 'react';
import { Loader2, ArrowRight, Check, Crown, ArrowLeft, ShieldCheck, RefreshCw, XCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  BILLING_OPTIONS,
  CURRENCY,
  formatPrice,
  PREMIUM_MONTHLY_PRICE,
  type BillingCycle,
} from '@/config/pricing';

// ─── FadeUp helper (respects prefers-reduced-motion) ─────────────────────────

function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const PRICING_HIGHLIGHTS = [
  'Articles et analyses Premium illimités',
  '2 newsletters exclusives par semaine',
  'Outils avancés avec téléchargements PDF',
  "Cours complets d'éducation financière",
];

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb() {
  return (
    <div className="border-b border-black/[0.06]">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/premium"
          className="inline-flex items-center gap-2 text-[13px] text-gray-500 transition-colors hover:text-gray-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Tout savoir sur Premium
        </Link>
      </div>
    </div>
  );
}

// ─── Subscribed banner ────────────────────────────────────────────────────────

function SubscribedBanner() {
  return (
    <div className="bg-white border-b border-black/[0.06]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold">
            <Crown className="h-3 w-3 text-white" />
          </div>
          <p className="text-sm text-gray-700">
            Vous êtes abonné <span className="font-semibold text-gold">Premium</span>
          </p>
        </div>
        <Link
          href="/compte"
          className="text-sm font-medium text-gold transition-colors hover:text-[#b8922f]"
        >
          Mon compte &rarr;
        </Link>
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function PricingHero() {
  return (
    <section className="pt-16 pb-10 sm:pt-20 sm:pb-14">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-gold">
          Tarifs
        </p>
        <h1 className="text-[2.25rem] font-bold leading-[1.1] tracking-tight text-[#1a1a1a] sm:text-[3rem]">
          Choisis le rythme
          <br />
          <span className="text-gold">qui te convient.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-gray-600 sm:text-[17px]">
          À partir de {formatPrice(PREMIUM_MONTHLY_PRICE)}/mois. Résiliable en ligne à
          tout moment, sans engagement.
        </p>
      </div>
    </section>
  );
}

// ─── Plans ────────────────────────────────────────────────────────────────────

interface PlanCardProps {
  cycle: BillingCycle;
  price: number;
  durationLabel: string;
  durationMonths: number;
  savings?: string;
  isLoading: boolean;
  isDisabled: boolean;
  onSubscribe: (cycle: BillingCycle) => void;
}

function PlanCard({
  cycle,
  price,
  durationLabel,
  durationMonths,
  savings,
  isLoading,
  isDisabled,
  onSubscribe,
}: PlanCardProps) {
  const isYearly = cycle === 'yearly';
  const monthlyEquivalent = Math.round(price / durationMonths);
  const fullPrice = PREMIUM_MONTHLY_PRICE * durationMonths;
  const savedPercent = price < fullPrice ? Math.round((1 - price / fullPrice) * 100) : 0;
  return (
    <div
      className={`relative rounded-2xl bg-white p-7 shadow-sm transition hover:shadow-md ${
        isYearly ? 'border-2 border-gold ring-4 ring-gold/10' : 'border border-black/[0.08]'
      }`}
    >
      {isYearly && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
          Meilleur deal
        </div>
      )}
      <p className="text-[13px] font-medium uppercase tracking-wider text-gray-500">
        {durationLabel}
      </p>
      <p className="mt-4 text-[2.25rem] font-bold leading-none text-[#1a1a1a]">
        {formatPrice(price)}
      </p>
      {savings && (
        <p className="mt-2 text-[13px] font-medium text-gold">
          {savings}
          {savedPercent > 0 && <span className="ml-1.5 text-gray-500">· -{savedPercent}%</span>}
        </p>
      )}
      <p className="mt-3 text-[13px] text-gray-500">
        Soit {formatPrice(monthlyEquivalent)} / mois
      </p>
      <button
        onClick={() => onSubscribe(cycle)}
        disabled={isDisabled}
        className={`mt-7 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-semibold transition-all duration-300 disabled:opacity-40 ${
          isYearly
            ? 'bg-gold text-white shadow-lg shadow-gold/25 hover:bg-[#b8922f]'
            : 'border border-black/[0.12] text-[#333] hover:border-[#111] hover:bg-[#111] hover:text-white'
        }`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Choisir {durationLabel.toLowerCase()}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}

interface PricingPlansProps {
  getPrice: (cycle: BillingCycle) => number;
  loadingPlan: BillingCycle | null;
  onSubscribe: (cycle: BillingCycle) => void;
}

function TrustStrip() {
  const items = [
    { icon: XCircle, label: 'Annulable en 1 clic' },
    { icon: RefreshCw, label: 'Sans engagement' },
    { icon: ShieldCheck, label: 'Paiement sécurisé iPayMoney' },
  ];
  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[12.5px] text-gray-500">
      {items.map(({ icon: Icon, label }) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-gold" strokeWidth={2} />
          {label}
        </span>
      ))}
    </div>
  );
}

function PricingPlans({ getPrice, loadingPlan, onSubscribe }: PricingPlansProps) {
  return (
    <section className="pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {BILLING_OPTIONS.map((opt, i) => (
            <FadeUp key={opt.cycle} delay={i * 0.08}>
              <PlanCard
                cycle={opt.cycle}
                price={getPrice(opt.cycle)}
                durationLabel={opt.durationLabel}
                durationMonths={opt.durationMonths}
                savings={opt.savings}
                isLoading={loadingPlan === opt.cycle}
                isDisabled={!!loadingPlan}
                onSubscribe={onSubscribe}
              />
            </FadeUp>
          ))}
        </div>
        <TrustStrip />
      </div>
    </section>
  );
}

// ─── Compact FAQ ──────────────────────────────────────────────────────────────

const PRICING_FAQ = [
  {
    q: 'Comment je paie ?',
    a: 'Mobile Money (Airtel, Moov) ou par carte Visa, Mastercard, American Express via iPayMoney. Le paiement est sécurisé et prend quelques secondes.',
  },
  {
    q: 'Je peux annuler quand ?',
    a: 'À tout moment, en 1 clic depuis ton compte. Tu conserves l\u2019accès Premium jusqu\u2019à la fin de la période déjà payée.',
  },
  {
    q: 'Puis-je changer de formule plus tard ?',
    a: 'Oui. Tu peux passer d\u2019une formule mensuelle à trimestrielle ou annuelle depuis ton compte. Le changement s\u2019applique au prochain renouvellement.',
  },
  {
    q: 'Que se passe-t-il à la fin de ma période ?',
    a: 'Ton abonnement se renouvelle automatiquement, sauf si tu l\u2019as annulé avant. Tu reçois toujours un rappel par email quelques jours avant.',
  },
];

function PricingFaq() {
  return (
    <section className="border-t border-black/[0.05] py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <FadeUp className="mb-10 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-gold">
            Questions fréquentes
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#1a1a1a] sm:text-3xl">
            On lève les doutes.
          </h2>
        </FadeUp>
        <FadeUp className="divide-y divide-black/[0.08]" delay={0.1}>
          {PRICING_FAQ.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15.5px] font-semibold text-[#1a1a1a]">
                {item.q}
                <span className="text-gold transition group-open:rotate-45">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-[14.5px] leading-relaxed text-gray-600">{item.a}</p>
            </details>
          ))}
        </FadeUp>
      </div>
    </section>
  );
}

// ─── Highlights compact ───────────────────────────────────────────────────────

function HighlightsCompact() {
  return (
    <section className="border-t border-black/[0.05] bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <FadeUp className="mb-10 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-gold">
            Ce que tu obtiens
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#1a1a1a] sm:text-3xl">
            L&apos;essentiel en un coup d&apos;&oelig;il.
          </h2>
        </FadeUp>
        <FadeUp delay={0.1}>
          <ul className="mx-auto grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
            {PRICING_HIGHLIGHTS.map((hl) => (
              <li key={hl} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gold/15">
                  <Check className="h-3 w-3 stroke-[2.5] text-gold" />
                </div>
                <span className="text-[14.5px] leading-snug text-gray-700">{hl}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10 text-center">
            <Link
              href="/premium"
              className="inline-flex items-center gap-2 text-[14px] font-medium text-gray-600 transition-colors hover:text-gold"
            >
              Voir tous les détails
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── Payment methods ──────────────────────────────────────────────────────────

function PaymentMethods() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <p className="mb-5 text-[12px] font-semibold uppercase tracking-wider text-gray-400">
          Moyens de paiement acceptés
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex h-10 items-center gap-2 rounded-md border border-black/[0.06] bg-white px-3">
            <Image
              src="/nita-logo.png"
              alt="Nita"
              width={20}
              height={20}
              className="rounded object-contain"
            />
            <span className="text-[13px] font-medium text-gray-700">Nita</span>
          </div>
          <div className="flex h-10 items-center gap-2 rounded-md border border-black/[0.06] bg-white px-3">
            <Image
              src="/amana-logo.png"
              alt="Amana"
              width={20}
              height={20}
              className="rounded object-contain"
            />
            <span className="text-[13px] font-medium text-gray-700">Amana</span>
          </div>
          <div className="flex h-10 items-center rounded-md border border-black/[0.06] bg-white px-3">
            <Image
              src="/card-logos.png"
              alt="Visa / Mastercard"
              width={48}
              height={24}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Free plan (reléguée) ─────────────────────────────────────────────────────

function FreePlanCard({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <section className="pb-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-[12px] font-medium uppercase tracking-wider text-gray-500">
                Plan gratuit
              </p>
              <h3 className="mb-2 text-[18px] font-bold text-[#1a1a1a]">
                Accès limité, 0 {CURRENCY}
              </h3>
              <p className="max-w-md text-[13.5px] text-gray-600">
                3 articles Premium par mois, newsletter mensuelle, outils de base.
              </p>
            </div>
            <Link
              href={isSignedIn ? '/' : '/inscription'}
              className="inline-flex flex-shrink-0 items-center justify-center rounded-xl border border-black/[0.12] px-5 py-2.5 text-[13.5px] font-semibold text-[#333] transition-all hover:border-[#111] hover:bg-[#111] hover:text-white"
            >
              {isSignedIn ? 'Accueil' : 'Créer un compte'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function PricingContent() {
  const { isSignedIn, userRole, refreshProfile } = useAuth();

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const isSubscribed = userRole === 'premium' || userRole === 'admin';

  const [dynamicPrices, setDynamicPrices] = useState<Record<string, number>>({});
  const [loadingPlan, setLoadingPlan] = useState<BillingCycle | null>(null);

  useEffect(() => {
    fetch('/api/prices')
      .then((r) => r.json())
      .then((data) => setDynamicPrices(data))
      .catch(() => {});
  }, []);

  const getPrice = (cycle: BillingCycle): number => {
    const opt = BILLING_OPTIONS.find((b) => b.cycle === cycle)!;
    return dynamicPrices[`premium_${cycle}`] ?? opt.price;
  };

  const handleSubscribe = (cycle: BillingCycle): void => {
    setLoadingPlan(cycle);
    window.location.href = `/paiement?tier=premium&cycle=${cycle}`;
  };

  return (
    <main className="min-h-screen bg-[#fafaf9]">
      <Breadcrumb />
      {isSubscribed && <SubscribedBanner />}
      <PricingHero />
      {!isSubscribed && (
        <PricingPlans
          getPrice={getPrice}
          loadingPlan={loadingPlan}
          onSubscribe={handleSubscribe}
        />
      )}
      {!isSubscribed && <HighlightsCompact />}
      {!isSubscribed && <PricingFaq />}
      <PaymentMethods />
      {!isSubscribed && <FreePlanCard isSignedIn={isSignedIn} />}
    </main>
  );
}
