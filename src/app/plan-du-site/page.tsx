import type { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Plan du site : toutes les rubriques',
  description: 'Retrouvez l\'ensemble des pages et rubriques de NFI Report : économie, finance, marchés, outils, éducation et plus.',
  alternates: { canonical: '/plan-du-site' },
};

const sections = [
  {
    title: 'Rubriques',
    links: [
      { label: 'Accueil', href: '/' },
      { label: 'Économie', href: '/economie' },
      { label: 'Finance', href: '/finance' },
      { label: 'Marchés', href: '/marches' },
      { label: 'Entreprises', href: '/entreprises' },
      { label: 'Niger - Présentation', href: '/niger/presentation' },
      { label: 'Niger - Entreprises stratégiques', href: '/niger/entreprises-strategiques' },
      { label: 'Éducation financière', href: '/education' },
    ],
  },
  {
    title: 'Outils pratiques',
    links: [
      { label: 'Tous les outils', href: '/outils' },
      { label: 'Simulateur d\'emprunt', href: '/outil/simulateur-emprunt' },
      { label: 'Intérêt simple', href: '/outil/interet-simple' },
      { label: 'Intérêt composé', href: '/outil/interet-compose' },
      { label: 'Simulateur de salaire', href: '/outil/simulateur-salaire' },
      { label: 'Indices économiques', href: '/outil/indices-economiques' },
      { label: 'Budget familial', href: '/outil/budget-familial' },
    ],
  },
  {
    title: 'Compte',
    links: [
      { label: 'Connexion', href: '/connexion' },
      { label: 'Inscription', href: '/inscription' },
      { label: 'Mon compte', href: '/compte' },
      { label: 'Abonnement Premium', href: '/pricing' },
    ],
  },
  {
    title: 'Société',
    links: [
      { label: 'Qui sommes-nous', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Publicité', href: '/publicite' },
    ],
  },
  {
    title: 'Informations légales',
    links: [
      { label: 'Mentions légales', href: '/mentions-legales' },
      { label: 'Politique de confidentialité', href: '/confidentialite' },
      { label: 'Conditions générales d\'utilisation', href: '/cgu' },
      { label: 'Politique de cookies', href: '/cookies' },
    ],
  },
];

export default function PlanDuSitePage() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <section className="bg-[#111] text-white py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl">Plan du site</h1>
          <p className="text-white/50 mt-3 text-[15px]">Retrouvez l&apos;ensemble des pages de NFI REPORT</p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sections.map((section) => (
              <div key={section.title} className="bg-white rounded-xl p-6 border border-black/[0.06]">
                <h2 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-4 font-medium">
                  {section.title}
                </h2>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[14px] text-gray-700 hover:text-black transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border-t border-black/[0.06]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="prose prose-sm sm:prose-base max-w-none">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111] mb-4">À propos de ce plan du site</h2>
            <p className="text-[15px] sm:text-[16px] leading-relaxed text-gray-700 mb-6">
              Ce plan du site recense l&apos;ensemble des pages publiques de NFI Report,
              organisées par thématique pour faciliter votre navigation. Il couvre nos cinq
              rubriques éditoriales principales (Économie, Finance, Marchés, Entreprises,
              Niger), notre section dédiée à l&apos;éducation financière, nos outils
              pratiques (simulateurs d&apos;emprunt, calculateurs d&apos;intérêts, simulateur
              de salaire, budget familial, indices économiques), ainsi que toutes les pages
              transactionnelles et institutionnelles du site.
            </p>
            <p className="text-[15px] sm:text-[16px] leading-relaxed text-gray-700 mb-10">
              Pour les moteurs de recherche, nous publions également un sitemap XML complet à
              l&apos;adresse{' '}
              <Link href="/sitemap.xml" className="text-[#111] underline underline-offset-2">
                /sitemap.xml
              </Link>{' '}
              qui contient l&apos;ensemble des articles, pages et ressources accessibles. Le
              sitemap est mis à jour automatiquement à chaque publication d&apos;un nouvel
              article ou d&apos;une nouvelle catégorie. Vous pouvez aussi consulter notre
              fichier{' '}
              <Link href="/robots.txt" className="text-[#111] underline underline-offset-2">
                /robots.txt
              </Link>{' '}
              pour les directives destinées aux robots d&apos;indexation.
            </p>

            <h2 className="text-2xl sm:text-3xl font-bold text-[#111] mt-10 mb-4">Comment naviguer efficacement</h2>
            <p className="text-[15px] sm:text-[16px] leading-relaxed text-gray-700 mb-6">
              Si vous découvrez NFI Report, nous vous recommandons de commencer par la page
              d&apos;accueil pour découvrir nos derniers articles, puis d&apos;explorer la
              rubrique qui correspond le plus à vos centres d&apos;intérêt. Pour aller plus
              loin, nos parcours pédagogiques d&apos;éducation financière vous accompagnent du
              débutant à l&apos;investisseur autonome, à votre rythme.
            </p>
            <p className="text-[15px] sm:text-[16px] leading-relaxed text-gray-700">
              Si vous cherchez une information précise (un indicateur économique, un cours de
              marché, une analyse spécifique), utilisez la barre de recherche en haut du site
              ou consultez directement le sitemap XML qui liste l&apos;ensemble des articles
              indexés.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
