import type { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase';
import { EducationCategoryContent } from './EducationCategoryContent';

export const revalidate = 3600;

export async function generateStaticParams() {
  const service = createServiceClient();
  if (!service) return [];

  const { data } = await service
    .from('education_categories')
    .select('slug')
    .eq('available', true);

  return (data || []).map((cat) => ({ id: cat.slug }));
}

export const metadata: Metadata = { title: 'Éducation' };

export default async function EducationCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <EducationCategoryContent slug={id} />;
}
