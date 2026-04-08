import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase';
import { SITE_URL } from '@/lib/config';
import { searchArticles } from '@/lib/articles';
import { EnterpriseContent } from './EnterpriseContent';

export const revalidate = 300;

interface EnterprisePageProps {
  params: Promise<{ slug: string }>;
}

async function getEnterprise(slug: string) {
  const service = createServiceClient();
  if (!service) return null;

  const { data } = await service
    .from('strategic_enterprises')
    .select('*')
    .eq('slug', slug)
    .eq('is_visible', true)
    .single();

  return data;
}

async function getAllEnterpriseSlugs(): Promise<string[]> {
  const service = createServiceClient();
  if (!service) return [];

  const { data } = await service
    .from('strategic_enterprises')
    .select('slug')
    .eq('is_visible', true);

  return (data || []).map((row: { slug: string }) => row.slug).filter(Boolean);
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllEnterpriseSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: EnterprisePageProps): Promise<Metadata> {
  const { slug } = await params;
  const enterprise = await getEnterprise(slug);
  if (!enterprise) return { title: 'Entreprise introuvable' };

  const title = `${enterprise.name} - ${enterprise.sector}`;
  const description = enterprise.full_name
    ? `${enterprise.full_name} (${enterprise.name}). ${enterprise.description}`
    : enterprise.description;

  return {
    title,
    description,
    keywords: [enterprise.name, enterprise.sector, 'Niger', 'entreprise', enterprise.full_name || ''].filter(Boolean),
    alternates: { canonical: `${SITE_URL}/entreprises/${slug}` },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `${SITE_URL}/entreprises/${slug}`,
      siteName: 'NFI Report',
      locale: 'fr_FR',
      ...(enterprise.logo_url && {
        images: [{ url: enterprise.logo_url, width: 200, height: 200, alt: enterprise.name }],
      }),
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function EnterprisePage({ params }: EnterprisePageProps) {
  const { slug } = await params;
  const enterprise = await getEnterprise(slug);

  if (!enterprise) {
    notFound();
  }

  // Find related articles by searching enterprise name
  const relatedArticles = await searchArticles(enterprise.name, 6);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: enterprise.full_name || enterprise.name,
    alternateName: enterprise.name,
    description: enterprise.description,
    ...(enterprise.headquarters && { address: { '@type': 'PostalAddress', addressLocality: enterprise.headquarters } }),
    ...(enterprise.founded_year && { foundingDate: String(enterprise.founded_year) }),
    ...(enterprise.website && { url: enterprise.website }),
    ...(enterprise.logo_url && { logo: enterprise.logo_url }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EnterpriseContent enterprise={enterprise} relatedArticles={relatedArticles} />
    </>
  );
}
