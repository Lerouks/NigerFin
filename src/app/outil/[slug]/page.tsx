import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ToolContent } from './ToolContent';

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
    premium: true,
  },
  'interet-compose': {
    title: 'Intérêt Composé',
    description: 'Simulez la croissance de votre capital avec les intérêts composés.',
    premium: true,
  },
};

interface ToolPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const tool = toolsMeta[params.slug];
  if (!tool) return { title: 'Outil introuvable' };
  return { title: tool.title, description: tool.description };
}

export async function generateStaticParams() {
  return Object.keys(toolsMeta).map((slug) => ({ slug }));
}

export default function ToolPage({ params }: ToolPageProps) {
  const tool = toolsMeta[params.slug];
  if (!tool) notFound();

  return (
    <ToolContent
      slug={params.slug}
      title={tool.title}
      description={tool.description}
      isPremium={tool.premium}
    />
  );
}
