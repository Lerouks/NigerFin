import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CouvertureCours } from '@/components/apprendre/CouvertureCours';
import { SommaireDuCours } from '@/components/apprendre/SommaireDuCours';
import { coursSuivant, getCours } from '@/lib/apprendre/donnees';
import { NOM_DU_SITE, SITE_URL } from '@/lib/config';

export const revalidate = 3600;

interface Props {
  params: Promise<{ cours: string }>;
}

export async function generateStaticParams() {
  const cours = await getCours();
  return cours.map((c) => ({ cours: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cours: slug } = await params;
  const cours = (await getCours()).find((c) => c.slug === slug);
  if (!cours) return { title: 'Cours introuvable', robots: { index: false } };
  const description = cours.description || `Le cours ${cours.titre} de NFI REPORT, leçon par leçon.`;
  return {
    title: `${cours.titre} : le cours`,
    description,
    alternates: { canonical: cours.href },
    openGraph: { title: `${cours.titre} | ${NOM_DU_SITE}`, description, type: 'website' },
  };
}

/**
 * La page d'un cours, maquette « Le livre » (choix de Raouf, 26/11/2026) :
 * la couverture du thème à gauche (collée en haut sur ordinateur), le
 * sommaire à droite. Sur téléphone, la couverture passe au-dessus.
 */
export default async function CoursPage({ params }: Props) {
  const { cours: slug } = await params;
  const tous = await getCours();
  const cours = tous.find((c) => c.slug === slug);
  if (!cours) notFound();
  const apres = coursSuivant(tous, cours.slug);
  const suivant = apres && apres.slug !== cours.slug ? { titre: apres.titre, href: apres.href, icone: apres.icone } : null;

  const nonce = (await headers()).get('x-nonce') || undefined;
  const donneesStructurees = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Apprendre', item: `${SITE_URL}/apprendre` },
          { '@type': 'ListItem', position: 3, name: cours.titre, item: `${SITE_URL}${cours.href}` },
        ],
      },
      {
        '@type': 'Course',
        name: cours.titre,
        description: cours.description || undefined,
        url: `${SITE_URL}${cours.href}`,
        inLanguage: 'fr',
        provider: { '@type': 'Organization', name: NOM_DU_SITE, url: SITE_URL },
        numberOfLessons: cours.lecons.length,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees).replace(/</g, '\\u003c') }}
      />
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-1.5 sm:px-6 sm:pt-4 lg:px-8 lg:pb-24 lg:pt-10">
        <div className="grid lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[460px_minmax(0,1fr)] xl:gap-[88px]">
          <div className="lg:sticky lg:top-[calc(var(--header-height)+32px)] lg:self-start">
            <Link
              href="/apprendre"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-[13.5px] text-gray-500 hover:text-[#111] lg:hidden"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Apprendre
            </Link>
            <div className="max-w-[560px] lg:max-w-none">
              <CouvertureCours cours={cours} />
            </div>
          </div>
          <SommaireDuCours cours={cours} suivant={suivant} />
        </div>
      </div>
    </div>
  );
}
