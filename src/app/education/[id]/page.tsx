import type { Metadata } from 'next';
import { EducationCategoryContent } from './EducationCategoryContent';

export const metadata: Metadata = { title: 'Éducation' };

export default async function EducationCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <EducationCategoryContent slug={id} />;
}
