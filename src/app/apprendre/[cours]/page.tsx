import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AjusteurLignes } from '@/components/apprendre/AjusteurLignes';
import { ContenuLecon } from '@/components/apprendre/ContenuLecon';
import { LeconsDuCours } from '@/components/apprendre/LeconsDuCours';
import { suiteAVenir, titreAVenir } from '@/lib/apprendre/a-venir';
import { adresseDuThemeRegroupe } from '@/lib/apprendre/anciens-cours';
import { getCours, getLeconsDuCours } from '@/lib/apprendre/donnees';
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
 * La page d'un cours, maquette « Grand format » choisie par Raouf le
 * 26/11/2026 : le titre sur une ligne, une phrase, puis les leçons, une ligne
 * chacune, qui s'ouvrent dans la page (plus de page par leçon, plus de « leçon
 * suivante » : la suivante est juste en dessous). Chaque leçon tient en une
 * minute : une phrase d'entrée, trois idées, une phrase de fin, la question.
 */
export default async function CoursPage({ params }: Props) {
  const { cours: slug } = await params;
  const donnees = await getLeconsDuCours(slug);
  if (!donnees) {
    const adresse = adresseDuThemeRegroupe(slug);
    if (adresse) permanentRedirect(adresse);
    notFound();
  }
  const { cours, lecons } = donnees;

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
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-1.5 sm:px-6 sm:pt-4 lg:px-8 lg:pb-24 lg:pt-6">
        <Link href="/apprendre" className="inline-flex min-h-[44px] items-center gap-1.5 text-[13.5px] text-gray-500 hover:text-[#111]">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Apprendre
        </Link>
        <h1 className="mt-1 text-[clamp(21px,7vw,32px)] font-bold leading-[1.1] tracking-[-0.03em] text-[#111] text-balance sm:text-[40px] sm:leading-[1.05] lg:text-[48px] lg:tracking-[-0.035em]">
          {typographieFr(cours.titre)}
        </h1>
        {cours.description && (
          <AjusteurLignes>
            <p className="mt-2 max-w-[40em] text-[16.5px] leading-[1.5] text-gray-500 sm:mt-3 sm:text-[18px]">{typographieFr(cours.description)}</p>
          </AjusteurLignes>
        )}
        <LeconsDuCours
          lecons={lecons.map((l) => ({ id: l.id, slug: l.slug, numero: l.numero, titre: l.titre, premium: l.premium, chapeau: l.chapeau }))}
        >
          {lecons.map((l) => (
            <ContenuLecon key={l.id} lecon={l} chemin={l.href} />
          ))}
        </LeconsDuCours>
        {cours.aVenir && (
          <AjusteurLignes>
            <p className="mt-5 text-[15px] leading-[1.6] text-gray-500 sm:pl-[76px] lg:pl-24">
              À venir&nbsp;: <span className="text-[#111]">{typographieFr(titreAVenir(cours.aVenir.prochaine, cours.aVenir.nombre))}</span>
              {suiteAVenir(cours.aVenir.nombre)}
            </p>
          </AjusteurLignes>
        )}
      </div>
    </div>
  );
}
