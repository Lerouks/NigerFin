'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import {
  Check, Mail, FileText, Wrench, GraduationCap, Bell, Download,
  ArrowRight, Sparkles,
} from 'lucide-react';
import { BILLING_OPTIONS, formatPrice, PREMIUM_MONTHLY_PRICE } from '@/config/pricing';

const SCREENSHOTS = [
  {
    src: '/premium/marches.webp',
    alt: 'Page Marchés - cours BRVM, devises, matières premières',
    label: 'Cours marchés',
    desc: 'Cours BRVM, devises FCFA / EUR / USD et matières premières (or, pétrole, uranium) mis à jour plusieurs fois par jour. Les chiffres qui pèsent réellement sur ton pouvoir d’achat et tes placements.',
  },
  {
    src: '/premium/article-premium.webp',
    alt: 'Article Premium - Banques nigériennes sous pression',
    label: 'Article Premium',
    desc: 'Analyses inédites : banques nigériennes, géopolitique sahélienne, stratégies d’investissement en Afrique de l’Ouest. Écrites pour être lues en 5 minutes, pas pour remplir un site.',
  },
  {
    src: '/premium/outil-budget.webp',
    alt: 'Outil Budget - taux d’épargne, répartition des dépenses',
    label: 'Outil Budget',
    desc: 'Entre tes revenus et dépenses. Obtiens ton taux d’épargne, ta répartition par poste et des recommandations concrètes pour passer à 15\u201320 % d’épargne. Export PDF inclus.',
  },
];

const BENEFITS = [
  {
    icon: Mail,
    title: '2 newsletters Premium / semaine',
    desc: 'Briefing du lundi pour cadrer la semaine, bilan du vendredi pour comprendre ce qui a bougé.',
  },
  {
    icon: FileText,
    title: 'Articles & analyses illimités',
    desc: 'Toute la rubrique Premium débloquée. Décryptages bancaires, géopolitique, marchés africains.',
  },
  {
    icon: Wrench,
    title: 'Outils Premium avancés',
    desc: 'Simulateurs salaire FCFA, budget familial, emprunt, avec analyses détaillées personnalisées.',
  },
  {
    icon: Download,
    title: 'Téléchargement PDF des analyses',
    desc: 'Emporte tes analyses budget, salaire et investissement en PDF, prêtes à imprimer ou partager.',
  },
  {
    icon: GraduationCap,
    title: 'Cours d’éducation financière',
    desc: 'Modules complets : épargne, investissement, BRVM, crypto, devises. Apprends à ton rythme.',
  },
  {
    icon: Bell,
    title: 'Alertes temps réel',
    desc: 'Notifications sur les actus économiques majeures qui impactent ton portefeuille.',
  },
];

const FAQ = [
  {
    q: 'Comment je paie ?',
    a: 'Mobile Money (Airtel, Moov) ou Visa, Mastercard, American Express via iPayMoney. Paiement sécurisé, en quelques secondes.',
  },
  {
    q: 'Je peux annuler quand ?',
    a: 'Quand tu veux, en 1 clic depuis ton compte. Tu gardes l’accès jusqu’à la fin de la période payée.',
  },
  {
    q: 'Y a-t-il un essai gratuit ?',
    a: 'Pas pour le moment. Mais tu peux lire 3 articles Premium par mois gratuitement pour tester la qualité.',
  },
  {
    q: 'Que recouvre exactement Premium ?',
    a: 'Tout : 2 newsletters/semaine, articles & analyses illimités, outils Premium avec PDF, cours d’éducation financière, alertes.',
  },
];

// FadeUp helper (respects prefers-reduced-motion)
// Uses `animate` instead of `whileInView` so content is always visible even
// when IntersectionObserver fails to trigger (headless browsers, SEO crawlers,
// or conflicts with other scroll-driven animations on the page).

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
  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// iPhone mockup component
// Next.js Image optim active (WebP/AVIF auto-served selon le navigateur).
// Avant : 4.7 MB de PNG sur /premium. Apres : ~1 MB d'AVIF/WebP servis par le CDN.

function IPhoneMockup({
  src,
  alt,
  className = '',
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={`relative h-[600px] w-[280px] flex-shrink-0 sm:h-[680px] sm:w-[320px] ${className}`}
    >
      {/* Outer titanium frame (iPhone 16 Pro style) */}
      <div
        className="relative h-full w-full rounded-[3rem] p-[3px] shadow-[0_45px_90px_-25px_rgba(0,0,0,0.55),0_15px_35px_-10px_rgba(0,0,0,0.25)]"
        style={{
          background:
            'linear-gradient(135deg, #4a4a4a 0%, #1a1a1a 40%, #2a2a2a 100%)',
        }}
      >
        {/* Inner bezel */}
        <div className="relative h-full w-full overflow-hidden rounded-[2.85rem] bg-black p-[6px]">
          {/* Screen */}
          <div className="relative h-full w-full overflow-hidden rounded-[2.4rem] bg-white">
            {/* Dynamic Island */}
            <div className="absolute left-1/2 top-2 z-20 flex h-[26px] w-[100px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-2.5">
              <div className="h-2 w-2 rounded-full bg-[#1a1a1a] ring-[1px] ring-[#3a3a3a]/60" />
            </div>
            {/* Screenshot */}
            <Image
              src={src}
              alt={alt}
              width={900}
              height={1955}
              sizes="(max-width: 640px) 280px, 320px"
              quality={85}
              className="absolute inset-0 w-full h-full object-cover object-top"
              priority={priority}
              loading={priority ? undefined : 'lazy'}
            />
            {/* Subtle screen reflection */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 rounded-[2.4rem]"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 65%, rgba(255,255,255,0.04) 100%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Power button (right) */}
      <div
        className="absolute right-[-3px] top-[140px] h-[60px] w-[3px] rounded-r-sm"
        style={{ background: 'linear-gradient(to right, #1a1a1a, #2c2c2c)' }}
      />
      {/* Action button (left) */}
      <div
        className="absolute left-[-3px] top-[90px] h-[24px] w-[3px] rounded-l-sm"
        style={{ background: 'linear-gradient(to left, #1a1a1a, #2c2c2c)' }}
      />
      {/* Volume up (left) */}
      <div
        className="absolute left-[-3px] top-[130px] h-[44px] w-[3px] rounded-l-sm"
        style={{ background: 'linear-gradient(to left, #1a1a1a, #2c2c2c)' }}
      />
      {/* Volume down (left) */}
      <div
        className="absolute left-[-3px] top-[185px] h-[44px] w-[3px] rounded-l-sm"
        style={{ background: 'linear-gradient(to left, #1a1a1a, #2c2c2c)' }}
      />
    </div>
  );
}

// ─── Hero with scroll-driven phone ────────────────────────────────────────────

function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  // Smooth scroll-driven transforms (disabled if user prefers reduced motion).
  // Start rotate at 0 so the phone is pixel-sharp on load: CSS transforms
  // rasterize the compositor layer and non-identity rotation at low DPR blurs
  // the iPhone content. Rotation kicks in as the user scrolls.
  const rotate = useTransform(scrollYProgress, [0, 1], prefersReduced ? [0, 0] : [0, 10]);
  const scale = useTransform(scrollYProgress, [0, 1], prefersReduced ? [1, 1] : [1, 0.85]);
  const y = useTransform(scrollYProgress, [0, 1], prefersReduced ? [0, 0] : [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.9, 0.5]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-[#fafaf9] pb-20 pt-10 sm:pt-16 lg:pt-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8">
        {/* Text column */}
        <div className="lg:col-span-7 lg:pr-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-gold/10 px-3 py-1.5 text-[12px] font-medium text-gold ring-1 ring-gold/20">
            <Sparkles className="h-3.5 w-3.5" />
            Membres Premium NFI Report
          </div>

          <h1 className="text-[2.5rem] font-bold leading-[1.05] tracking-tight text-[#1a1a1a] sm:text-[3.5rem] lg:text-[4.5rem]">
            La connaissance,
            <br />
            <span className="text-gold">votre meilleur capital.</span>
          </h1>

          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-gray-600 sm:text-[19px]">
            Pour les jeunes qui veulent savoir, agir et investir en Afrique de l&rsquo;Ouest.
            Newsletters, analyses, outils et téléchargements PDF. Tout est dans Premium.
          </p>

          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              href="/pricing"
              className="group inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-7 py-4 text-[15px] font-semibold text-white shadow-lg transition hover:bg-black hover:shadow-xl"
            >
              Devenir Premium
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <div className="text-[13px] text-gray-500">
              À partir de <span className="font-semibold text-gray-700">{formatPrice(PREMIUM_MONTHLY_PRICE)}/mois</span>
            </div>
          </div>

          <p className="mt-4 text-[13px] text-gray-500">
            Déjà abonné ?{' '}
            <Link
              href="/connexion"
              className="font-medium text-gray-700 underline underline-offset-2 transition-colors hover:text-gold"
            >
              Se connecter
            </Link>
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-gold" />
              Mobile Money, Visa &amp; Mastercard
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-gold" />
              Annulation 1 clic
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-gold" />
              Sans engagement
            </span>
          </div>
        </div>

        {/* iPhone column */}
        <div className="flex justify-center lg:col-span-5 lg:justify-end">
          <motion.div
            style={{
              rotate,
              scale,
              y,
              opacity,
              transformStyle: 'preserve-3d',
              willChange: 'transform',
            }}
            className="relative"
          >
            {/* Soft golden glow behind */}
            <div className="absolute inset-0 -z-10 rounded-full bg-gold/20 blur-3xl" />
            <div
              style={{
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                WebkitFontSmoothing: 'antialiased',
              }}
            >
              <IPhoneMockup src={SCREENSHOTS[0]!.src} alt={SCREENSHOTS[0]!.alt} priority />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Benefits section ─────────────────────────────────────────────────────────

function BenefitsSection() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp className="mx-auto max-w-2xl text-center">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-gold">
            Ce que tu débloques
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1a1a1a] sm:text-4xl">
            Tout ce qu&rsquo;il te faut pour comprendre, décider et agir.
          </h2>
        </FadeUp>

        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b, i) => {
            const Icon = b.icon;
            return (
              <FadeUp key={b.title} delay={i * 0.08} className="group">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold transition group-hover:bg-gold group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-[17px] font-semibold text-[#1a1a1a]">{b.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-gray-600">{b.desc}</p>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Manifesto banner ─────────────────────────────────────────────────────────

function ManifestoBanner() {
  return (
    <section className="bg-[#f5f5f0] py-20 sm:py-28">
      <FadeUp className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-gold">
          Notre raison d&rsquo;être
        </p>
        <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[#1a1a1a] sm:text-4xl md:text-5xl">
          Pour les jeunes qui veulent
          <br className="hidden sm:block" />
          <span className="text-gold"> savoir, agir et investir.</span>
        </h2>
      </FadeUp>
    </section>
  );
}

// ─── Preview section: cycling iPhone ──────────────────────────────────────────

function PreviewSection() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SCREENSHOTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const current = SCREENSHOTS[index]!;

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8">
        <FadeUp className="lg:col-span-6">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-gold">
            Aperçu en direct
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1a1a1a] sm:text-4xl">
            Ce que tu reçois, dès ton inscription.
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-gray-600">
            Pas de promesse en l&rsquo;air. Voici exactement ce que les membres Premium consultent en ce moment.
          </p>

          <div className="mt-8 space-y-3">
            {SCREENSHOTS.map((item, i) => {
              const active = i === index;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-5 py-4 text-left transition ${
                    active
                      ? 'border-gold bg-gold/5 shadow-sm'
                      : 'border-black/[0.08] bg-white hover:border-black/20'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-semibold transition ${
                      active ? 'bg-gold text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`block text-[15px] transition ${
                        active ? 'font-semibold text-[#1a1a1a]' : 'text-gray-700'
                      }`}
                    >
                      {item.label}
                    </span>
                    <AnimatePresence initial={false}>
                      {active && (
                        <motion.p
                          key={item.label}
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.28, ease: 'easeOut' }}
                          className="overflow-hidden text-[13.5px] leading-relaxed text-gray-600"
                        >
                          {item.desc}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </button>
              );
            })}
          </div>
        </FadeUp>

        <div className="flex justify-center lg:col-span-6 lg:justify-end">
          <motion.div
            key={current.src}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative"
          >
            <div className="absolute inset-0 -z-10 rounded-full bg-gold/15 blur-3xl" />
            <IPhoneMockup src={current.src} alt={current.alt} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Pricing teaser ───────────────────────────────────────────────────────────

function PricingTeaser() {
  return (
    <section className="bg-[#f5f5f0] py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <FadeUp className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-gold">
            Tarifs
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1a1a1a] sm:text-4xl">
            Choisis le rythme qui te convient.
          </h2>
        </FadeUp>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {BILLING_OPTIONS.map((opt, i) => {
            const isYearly = opt.cycle === 'yearly';
            return (
              <FadeUp
                key={opt.cycle}
                delay={i * 0.1}
                className={`relative rounded-2xl border bg-white p-7 shadow-sm transition hover:shadow-md ${
                  isYearly ? 'border-gold ring-2 ring-gold/20' : 'border-black/[0.08]'
                }`}
              >
                {isYearly && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                    Meilleur deal
                  </div>
                )}
                <p className="text-[13px] font-medium uppercase tracking-wider text-gray-500">
                  {opt.durationLabel}
                </p>
                <p className="mt-3 text-3xl font-bold text-[#1a1a1a]">
                  {formatPrice(opt.price)}
                </p>
                {opt.savings && (
                  <p className="mt-1 text-[13px] text-gold">{opt.savings}</p>
                )}
                <p className="mt-4 text-[13px] text-gray-500">
                  Soit {formatPrice(Math.round(opt.price / opt.durationMonths))} / mois
                </p>
              </FadeUp>
            );
          })}
        </div>

        <FadeUp className="mt-10 flex flex-col items-center gap-4">
          <Link
            href="/pricing"
            className="group inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-7 py-4 text-[15px] font-semibold text-white shadow-lg transition hover:bg-black hover:shadow-xl"
          >
            Voir tous les détails et s&rsquo;abonner
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <p className="text-[12.5px] text-gray-500">
            Paiement sécurisé Mobile Money (Airtel, Moov) ou Visa, Mastercard, American Express
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FaqSection() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <FadeUp className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-gold">
            Questions fréquentes
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1a1a1a] sm:text-4xl">
            On a la réponse.
          </h2>
        </FadeUp>

        <FadeUp className="mt-12 divide-y divide-black/[0.08]" delay={0.15}>
          {FAQ.map((item) => (
            <details key={item.q} className="group py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold text-[#1a1a1a]">
                {item.q}
                <span className="text-gold transition group-open:rotate-45">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-600">{item.a}</p>
            </details>
          ))}
        </FadeUp>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCta() {
  return (
    <section className="bg-[#1a1a1a] py-24 sm:py-32">
      <FadeUp className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl">
          Investis dans ce que personne ne peut te prendre :
          <br />
          <span className="text-gold">ta connaissance.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-gray-300">
          Rejoins les membres Premium de NFI Report et reçois dès aujourd&rsquo;hui
          ton premier briefing économique ouest-africain.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4">
          <Link
            href="/pricing"
            className="group inline-flex items-center gap-2 rounded-full bg-gold px-8 py-4 text-[16px] font-semibold text-[#1a1a1a] shadow-2xl transition hover:bg-[#c79a3b] hover:shadow-gold/30"
          >
            Devenir Premium maintenant
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <p className="text-[12.5px] text-gray-400">
            5 000 FCFA/mois · Annulation à tout moment
          </p>
        </div>
      </FadeUp>
    </section>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function PremiumContent() {
  return (
    <main className="bg-[#fafaf9]">
      <HeroSection />
      <BenefitsSection />
      <ManifestoBanner />
      <PreviewSection />
      <PricingTeaser />
      <FaqSection />
      <FinalCta />
    </main>
  );
}
