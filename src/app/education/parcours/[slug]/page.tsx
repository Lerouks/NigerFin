import type { Metadata } from 'next';
import { PathContent } from './PathContent';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: 'Parcours',
    description: `Parcours guidé NFI Report : ${slug}`,
  };
}

export default async function ParcoursPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <PathContent slug={slug} />
    </div>
  );
}
