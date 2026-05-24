import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase';
import { PathContent } from './PathContent';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;
export const dynamicParams = false;

async function getPathMeta(slug: string) {
  const service = createServiceClient();
  if (!service) return null;
  const { data } = await service
    .from('learning_paths')
    .select('slug, title, description')
    .eq('slug', slug)
    .eq('available', true)
    .single();
  return data;
}

export async function generateStaticParams() {
  const service = createServiceClient();
  if (!service) return [];
  const { data } = await service
    .from('learning_paths')
    .select('slug')
    .eq('available', true);
  return (data || []).map((row: { slug: string }) => ({ slug: row.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const path = await getPathMeta(slug);
  if (!path) {
    return { title: 'Parcours introuvable', robots: { index: false } };
  }
  return {
    title: `Parcours : ${path.title}`,
    description:
      path.description ||
      `Parcours guidé NFI Report sur ${path.title.toLowerCase()} : leçons progressives pour maîtriser le sujet à votre rythme.`,
    alternates: { canonical: `/education/parcours/${slug}` },
  };
}

export default async function ParcoursPage({ params }: PageProps) {
  const { slug } = await params;
  const path = await getPathMeta(slug);
  if (!path) {
    notFound();
  }
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <PathContent slug={slug} />
    </div>
  );
}
