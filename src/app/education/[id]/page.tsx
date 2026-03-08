import type { Metadata } from 'next';
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

  if (!category) return { title: 'Éducation' };

  const title = category.title;
  const description = `Cours et leçons sur ${category.title.toLowerCase()} — formation gratuite en finance et économie au Niger.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Éducation`,
      description,
      type: 'website',
    },
  };
}

export default async function EducationCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <EducationCategoryContent slug={id} />;
}
