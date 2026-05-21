import type { Metadata } from 'next';
import { PathContent } from './PathContent';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

function formatSlug(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const formatted = formatSlug(slug);
  return {
    title: `Parcours : ${formatted}`,
    description: `Parcours guidé NFI Report sur ${formatted.toLowerCase()} : leçons progressives pour maîtriser le sujet à votre rythme.`,
    alternates: { canonical: `/education/parcours/${slug}` },
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
