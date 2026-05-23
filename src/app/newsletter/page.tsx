import type { Metadata } from 'next';
import { Mail, Clock, Crown, FileText, Lock, Sparkles } from 'lucide-react';
import { CategoryHero } from '@/components/CategoryHero';
import { NewsletterForm } from '@/components/NewsletterForm';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Newsletter NFI Report',
  description:
    'Recevez chaque lundi à 7h une analyse longue sur l\'économie du Niger et de l\'Afrique de l\'Ouest. Gratuit ou Premium, sans spam.',
  alternates: { canonical: '/newsletter' },
  openGraph: {
    title: 'Newsletter NFI Report',
    description:
      'Chaque lundi à 7h, une analyse longue sur l\'économie du Niger et de l\'Afrique de l\'Ouest.',
    type: 'website',
  },
};

interface ValueProp {
  icon: typeof Mail;
  title: string;
  body: string;
}

const VALUE_PROPS: ValueProp[] = [
  {
    icon: FileText,
    title: 'Format édito long',
    body: '1 500 à 2 500 mots par numéro. Pas de revue de presse copiée-collée, mais une analyse signée NFI Report.',
  },
  {
    icon: Clock,
    title: 'Chaque lundi à 7h',
    body: 'Une seule édition par semaine, lue en 10 minutes avec votre café, avant que le marché ouvre.',
  },
  {
    icon: Sparkles,
    title: 'Le Niger en premier',
    body: 'Macro, BRVM, entreprises stratégiques, fiscalité OHADA. Les sujets que personne ne couvre sérieusement en français.',
  },
];

export default function NewsletterPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CategoryHero
        label="Newsletter"
        title="La connaissance, votre meilleur capital."
        description="Chaque lundi à 7h, une analyse longue et signée sur l'économie du Niger et de l'Afrique de l'Ouest. Pour décider vite et juste."
        accentGold
      />

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <NewsletterForm />
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-px w-6 bg-gold/60" />
          <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-gold">
            Ce que vous recevez
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-[#111] mb-10">
          Une newsletter pensée pour les décideurs et les curieux exigeants.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VALUE_PROPS.map((prop) => {
            const Icon = prop.icon;
            return (
              <article
                key={prop.title}
                className="bg-white rounded-xl border border-black/[0.06] p-6 shadow-[0_4px_40px_-12px_rgba(0,0,0,0.06)]"
              >
                <div className="w-10 h-10 rounded-lg bg-[#fafaf9] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#111]" />
                </div>
                <h3 className="text-[16px] font-semibold text-[#111] mb-2">{prop.title}</h3>
                <p className="text-[14px] text-gray-600 leading-relaxed">{prop.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-px w-6 bg-gold/60" />
          <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-gold">
            Deux niveaux d&apos;accès
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-[#111] mb-10">
          Gratuit ou Premium, vous décidez.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <article className="bg-white rounded-xl border border-black/[0.06] p-7">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-[#111]" />
              <span className="text-[12px] font-semibold tracking-wide uppercase text-gray-500">Gratuit</span>
            </div>
            <h3 className="text-xl font-bold text-[#111] mb-3">L&apos;essentiel hebdomadaire</h3>
            <ul className="space-y-2.5 text-[14px] text-gray-700">
              <li className="flex items-start gap-2">
                <span className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
                <span>L&apos;ouverture de l&apos;édition du lundi, soit les 800 premiers mots.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
                <span>Le résumé exécutif en 5 points.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
                <span>L&apos;accès à toute la rubrique gratuite du site.</span>
              </li>
            </ul>
          </article>

          <article className="bg-[#111] text-white rounded-xl p-7 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gold/[0.05] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-2 mb-4 relative">
              <Crown className="w-5 h-5 text-gold" />
              <span className="text-[12px] font-semibold tracking-wide uppercase text-gold">Premium</span>
            </div>
            <h3 className="text-xl font-bold mb-3 relative">L&apos;intégralité chaque semaine</h3>
            <ul className="space-y-2.5 text-[14px] text-white/75 relative">
              <li className="flex items-start gap-2">
                <span className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
                <span>L&apos;édition complète, sans paywall ni teaser.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
                <span>Les analyses chiffrées, les graphiques, les comparaisons sectorielles.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
                <span>L&apos;accès aux articles Premium et aux outils financiers du site.</span>
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section className="border-t border-black/[0.06] bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="prose prose-sm sm:prose-base max-w-none">
            <h2 className="text-xl sm:text-2xl font-bold text-[#111] mt-0 mb-3">
              Pourquoi une newsletter dédiée au Niger et à l&apos;Afrique de l&apos;Ouest ?
            </h2>
            <p className="text-[15px] leading-relaxed text-gray-700 mb-10">
              L&apos;information économique et financière sur le Niger est rare, fragmentée et souvent traduite avec
              retard depuis l&apos;anglais. La newsletter NFI Report comble ce vide : une lecture longue par semaine,
              écrite directement à Niamey, pour des lecteurs qui veulent comprendre la BRVM, l&apos;UEMOA, les
              entreprises stratégiques nigériennes (SOMAÏR, SONIDEP, NIGELEC, SOPAMIN, etc.) et les dynamiques
              macroéconomiques sous-régionales.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#111] mt-10 mb-3">
              À qui s&apos;adresse cette newsletter ?
            </h2>
            <p className="text-[15px] leading-relaxed text-gray-700 mb-10">
              Aux décideurs économiques, dirigeants d&apos;entreprise, analystes et investisseurs qui couvrent
              l&apos;Afrique de l&apos;Ouest. Aux étudiants en finance, en économie ou en école de commerce qui veulent
              une lecture sérieuse en français. Aux entrepreneurs nigériens qui pilotent une PME et veulent suivre
              le contexte macro de leur activité.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#111] mt-10 mb-4">
              Vos données, votre contrôle.
            </h2>
            <ul className="space-y-2.5 text-[15px] text-gray-700 list-none pl-0">
              <li className="flex items-start gap-3">
                <Lock className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                <span className="leading-relaxed">
                  Vos données restent en Europe, hébergées chez Supabase, jamais revendues à des tiers.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Lock className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                <span className="leading-relaxed">
                  Désabonnement en un clic depuis chaque email, à tout moment.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Lock className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                <span className="leading-relaxed">
                  Conformité RGPD intégrale. Vous gardez la main sur vos préférences depuis votre espace compte.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
