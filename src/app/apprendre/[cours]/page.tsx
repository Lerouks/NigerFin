import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CarresCours } from '@/components/apprendre/CarresCours';
import { getCours, getCoursParSlug } from '@/lib/apprendre/donnees';
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
  const cours = await getCoursParSlug(slug);
  if (!cours) return { title: 'Cours introuvable', robots: { index: false } };
  const description = cours.description || `Le cours ${cours.titre} de NFI REPORT, leçon par leçon.`;
  return {
    title: `${cours.titre} : le cours`,
    description,
    alternates: { canonical: cours.href },
    openGraph: { title: `${cours.titre} | ${NOM_DU_SITE}`, description, type: 'website' },
  };
}

export default async function CoursPage({ params }: Props) {
  const { cours: slug } = await params;
  const cours = await getCoursParSlug(slug);
  if (!cours) notFound();

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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-14 md:pt-10 md:pb-20">
        <Link href="/apprendre" className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-[#111]">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Apprendre
        </Link>
        <CarresCours cours={cours} titrePrincipal />
      </div>
    </div>
  );
}
