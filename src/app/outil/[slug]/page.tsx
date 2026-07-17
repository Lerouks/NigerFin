import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { SITE_URL } from '@/lib/config';
import { safeJsonLd } from '@/lib/seo';
import { ToolContent } from './ToolContent';
import { ToolSeoContent } from './ToolSeoContent';

export const revalidate = 86400;

const toolsMeta: Record<string, { title: string; description: string; premium: boolean }> = {
  'simulateur-emprunt': {
    title: "Simulateur d'emprunt : mensualités et coût",
    description: 'Calculez vos mensualités, le coût total et les intérêts de votre emprunt selon les taux pratiqués au Niger et dans l\'UEMOA.',
    premium: false,
  },
  'interet-simple': {
    title: "Calculateur d'intérêts simples gratuit",
    description: 'Calculez les intérêts simples sur votre placement, votre épargne ou votre crédit court terme. Formule, exemples et conseils adaptés au contexte UEMOA.',
    premium: false,
  },
  'simulateur-salaire': {
    title: 'Simulateur salaire Niger : net depuis brut',
    description: 'Estimez votre salaire net mensuel à partir du brut selon les barèmes CNSS et l\'impôt sur les traitements et salaires (ITS) en vigueur au Niger.',
    premium: true,
  },
  'indices-economiques': {
    title: 'Indices économiques Niger et UEMOA',
    description: 'Consultez les principaux indicateurs économiques du Niger et de la zone UEMOA : PIB, inflation, taux directeur BCEAO, dette, réserves de change.',
    premium: false,
  },
  'interet-compose': {
    title: "Calculateur d'intérêts composés en FCFA",
    description: 'Simulez la croissance de votre capital sur le long terme avec les intérêts composés. Visualisez l\'effet boule de neige de votre épargne.',
    premium: true,
  },
  'budget-familial': {
    title: 'Simulateur de budget familial Niger',
    description: "Analysez votre budget familial avec la méthode 50/30/20 adaptée au Niger. Obtenez des conseils personnalisés et exportez un récapitulatif PDF.",
    premium: true,
  },
};

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = toolsMeta[slug];
  if (!tool) return { title: 'Outil introuvable' };
  return {
    title: tool.title,
    description: tool.description,
    alternates: { canonical: `/outil/${slug}` },
  };
}

export async function generateStaticParams() {
  return Object.keys(toolsMeta).map((slug) => ({ slug }));
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = toolsMeta[slug];
  if (!tool) notFound();

  const nonce = (await headers()).get('x-nonce') || undefined;
  // SEO M-3 : SoftwareApplication schema. Sert a Google pour les rich results
  // sur les outils financiers (mensualites, simulateurs).
  const softwareLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.title,
    description: tool.description,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    url: `${SITE_URL}/outil/${slug}`,
    inLanguage: 'fr',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'XOF',
      availability: 'https://schema.org/InStock',
    },
    publisher: {
      '@type': 'Organization',
      name: 'NFI Report',
      url: SITE_URL,
    },
  };
  // SEO M-2 : BreadcrumbList pour SERP riche.
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Outils', item: `${SITE_URL}/outils` },
      { '@type': 'ListItem', position: 3, name: tool.title, item: `${SITE_URL}/outil/${slug}` },
    ],
  };

  return (
    <>
      {/* suppressHydrationWarning : le browser efface l'attribut nonce apres
          lecture pour la securite CSP. safeJsonLd pour bloquer XSS via
          champs admin-edited (HIGH-1 audit security-reviewer 2026-05-27). */}
      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeJsonLd(softwareLd) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
      <ToolContent
        slug={slug}
        title={tool.title}
        description={tool.description}
        isPremium={tool.premium}
      />
      <ToolSeoContent slug={slug} />
    </>
  );
}
