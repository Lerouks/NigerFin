import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase';
import { EducationCategoryContent } from './EducationCategoryContent';
import { EducationCategoryHero } from './EducationCategoryHero';
import { EducationSeoBlock } from './EducationSeoBlock';

export const revalidate = 3600;

async function getCategory(slug: string) {
  const service = createServiceClient();
  if (!service) return null;

  const { data } = await service
    .from('education_categories')
    .select('slug, title, description')
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

  const seoTitle = `${category.title} : cours gratuits | NFI Report`;
  const description = `Cours, leçons et exercices gratuits sur ${category.title.toLowerCase()} adaptés au contexte du Niger et de l'UEMOA. Formation en finance et économie pas-à-pas.`;

  return {
    title: { absolute: seoTitle },
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

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <EducationCategoryHero category={category} />
      <EducationCategoryContent slug={id} />
      <EducationSeoBlock slug={id} />
    </div>
  );
}
