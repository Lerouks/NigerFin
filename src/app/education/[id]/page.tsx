import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase';
import { SITE_URL } from '@/lib/config';
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
  const description = `Cours et leçons gratuits sur ${category.title.toLowerCase()} adaptés au Niger et à l'UEMOA. Formation pas-à-pas.`;

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

  const nonce = (await headers()).get('x-nonce') || undefined;
  // SEO M-2 : BreadcrumbList JSON-LD pour rich results SERP.
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Éducation', item: `${SITE_URL}/education` },
      { '@type': 'ListItem', position: 3, name: category.title, item: `${SITE_URL}/education/${id}` },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <EducationCategoryHero category={category} />
      <EducationCategoryContent slug={id} />
      <EducationSeoBlock slug={id} />
    </div>
  );
}
