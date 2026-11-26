import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AjusteurLignes } from '@/components/apprendre/AjusteurLignes';
import { FigureCours } from '@/components/apprendre/FigureCours';
import { ActionCours, SommaireDuCours } from '@/components/apprendre/SommaireDuCours';
import { coursSuivant, getCours } from '@/lib/apprendre/donnees';
import { NOM_DU_SITE, SITE_URL } from '@/lib/config';
import { typographieFr } from '@/lib/typographie-fr';

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
 * La page d'un cours, maquette « Le livre » rendue sobre (Raouf, 26/11/2026 :
 * plus de carré noir, « ça doit être sobre ») : le titre et ce que le cours
 * apprend sur la page claire, la figure tirée de ses leçons (à droite sur
 * ordinateur, sous le texte sur téléphone), le bouton, puis le sommaire.
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
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-1.5 sm:px-6 sm:pt-4 lg:px-8 lg:pb-24 lg:pt-8">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_auto_1fr] lg:gap-x-16 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-x-24">
          <header className="min-w-0 lg:col-start-1 lg:row-start-1">
            <Link href="/apprendre" className="inline-flex min-h-[44px] items-center gap-1.5 text-[13.5px] text-gray-500 hover:text-[#111]">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Apprendre
            </Link>
            <h1 className="mt-2 text-[30px] font-bold leading-[1.04] tracking-[-0.035em] text-[#111] text-balance min-[360px]:text-[34px] sm:text-[46px] lg:mt-4 lg:text-[58px] lg:leading-[1.0] lg:tracking-[-0.04em]">
              {typographieFr(cours.titre)}
            </h1>
            {cours.description && (
              <AjusteurLignes>
                <p className="mt-4 max-w-[34ch] text-[18px] leading-[1.45] text-gray-700 sm:text-[21px] lg:mt-5 lg:text-[23px]">
                  {typographieFr(cours.description)}
                </p>
              </AjusteurLignes>
            )}
          </header>
          <div className="mt-7 min-w-0 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:mt-0">
            <div className="lg:sticky lg:top-[calc(var(--header-height)+32px)] lg:pt-[60px]">
              <FigureCours slug={cours.slug} />
            </div>
          </div>
          <div className="min-w-0 lg:col-start-1 lg:row-start-2">
            <ActionCours cours={cours} />
          </div>
          <div className="min-w-0 lg:col-start-1 lg:row-start-3">
            <SommaireDuCours cours={cours} suivant={suivant} />
          </div>
        </div>
      </div>
    </div>
  );
}
