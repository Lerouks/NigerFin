import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase';
import { EducationCategoryContent } from './EducationCategoryContent';

export const revalidate = 3600;

async function getCategory(slug: string) {
  const service = createServiceClient();
  if (!service) return null;

  const { data } = await service
    .from('education_categories')
    .select('slug, title')
    .eq('slug', slug)
    .single();

  return data;
}

export async function generateStaticParams() {
  const service = createServiceClient();
  if (!service) return [];

  const { data } = await service
    .from('education_categories')
    .select('slug')
    .eq('available', true);

  return (data || []).map((cat) => ({ id: cat.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const category = await getCategory(id);

  if (!category) {
    notFound();
  }

  const title = `${category.title} : cours et leçons gratuits`;
  const description = `Cours, leçons et exercices gratuits sur ${category.title.toLowerCase()} adaptés au contexte du Niger et de l'UEMOA. Formation en finance et économie pas-à-pas.`;

  return {
    title,
    description,
    alternates: { canonical: `/education/${id}` },
    openGraph: {
      title: `${category.title} : cours et leçons gratuits`,
      description,
      type: 'website',
    },
  };
}

export default async function EducationCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await getCategory(id);

  if (!category) {
    notFound();
  }

  return <EducationCategoryContent slug={id} />;
}
