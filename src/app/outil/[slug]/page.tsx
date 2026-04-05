import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ToolContent } from './ToolContent';

export const revalidate = 86400;

const toolsMeta: Record<string, { title: string; description: string; premium: boolean }> = {
  'simulateur-emprunt': {
    title: "Simulateur d'Emprunt",
    description: 'Calculez vos mensualités, le coût total et les intérêts de votre emprunt.',
    premium: false,
  },
  'interet-simple': {
    title: 'Intérêt Simple',
    description: 'Calculez les intérêts simples sur votre placement ou épargne.',
    premium: false,
  },
  'simulateur-salaire': {
    title: 'Simulateur Salaire Niger',
    description: 'Estimez votre salaire net à partir du brut selon les barèmes nigériens.',
    premium: true,
  },
  'indices-economiques': {
    title: 'Indices Économiques',
    description: 'Consultez les principaux indicateurs économiques du Niger et de la zone UEMOA.',
    premium: false,
  },
  'interet-compose': {
    title: 'Intérêt Composé',
    description: 'Simulez la croissance de votre capital avec les intérêts composés.',
    premium: true,
  },
  'budget-familial': {
    title: 'Simulation de Budget Familial',
    description: "Analysez votre budget familial, obtenez des conseils adaptés au Niger et exportez un récapitulatif PDF.",
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
  return { title: tool.title, description: tool.description };
}

export async function generateStaticParams() {
  return Object.keys(toolsMeta).map((slug) => ({ slug }));
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = toolsMeta[slug];
  if (!tool) notFound();

  return (
    <ToolContent
      slug={slug}
      title={tool.title}
      description={tool.description}
      isPremium={tool.premium}
    />
  );
}
