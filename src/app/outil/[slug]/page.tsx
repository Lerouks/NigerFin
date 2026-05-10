import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ToolContent } from './ToolContent';
import { ToolSeoContent } from './ToolSeoContent';

export const revalidate = 86400;

const toolsMeta: Record<string, { title: string; description: string; premium: boolean }> = {
  'simulateur-emprunt': {
    title: "Simulateur d'emprunt : mensualités et coût",
    description: 'Calculez vos mensualités, le coût total et les intérêts de votre emprunt selon les taux pratiqués au Niger et dans l\'UEMOA.',
    premium: false,
  },
  'interet-simple': {
    title: "Calculateur d'intérêts simples gratuit",
    description: 'Calculez les intérêts simples sur votre placement, votre épargne ou votre crédit court terme. Formule, exemples et conseils adaptés au contexte UEMOA.',
    premium: false,
  },
  'simulateur-salaire': {
    title: 'Simulateur salaire Niger : net depuis brut',
    description: 'Estimez votre salaire net mensuel à partir du brut selon les barèmes CNSS et l\'impôt sur les traitements et salaires (ITS) en vigueur au Niger.',
    premium: true,
  },
  'indices-economiques': {
    title: 'Indices économiques Niger et UEMOA',
    description: 'Consultez les principaux indicateurs économiques du Niger et de la zone UEMOA : PIB, inflation, taux directeur BCEAO, dette, réserves de change.',
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

  return (
    <>
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
