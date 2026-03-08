import type { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 86400;

export const metadata: Metadata = { title: 'Plan du site' };

const sections = [
  {
    title: 'Rubriques',
    links: [
      { label: 'Accueil', href: '/' },
      { label: 'Économie', href: '/economie' },
      { label: 'Finance', href: '/finance' },
      { label: 'Marchés', href: '/marches' },
      { label: 'Entreprises', href: '/entreprises' },
      { label: 'Niger', href: '/niger' },
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
    </div>
  );
}
