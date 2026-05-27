import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase';
import { SITE_URL, truncateSeoDescription } from '@/lib/config';
import { searchArticles } from '@/lib/articles';
import { EnterpriseContent } from './EnterpriseContent';
import { EnterpriseSeoBlock } from './EnterpriseSeoBlock';

export const revalidate = 300;

/**
 * Echappe les caracteres dangereux dans une serialisation JSON destinee a etre
 * injectee dans un <script type="application/ld+json">. JSON.stringify natif
 * ne transforme PAS "</script>" en sequence safe : un attaquant qui controle
 * un champ peut casser le tag et injecter du HTML/JS. Pattern utilise par Next.js
 * en interne pour ses propres blocs JSON-LD.
 */
function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, '\u003C')
    .replace(/>/g, '\u003E')
    .replace(/&/g, '\u0026')
    .replace(/[\u2028]/g, '\u2028')
    .replace(/[\u2029]/g, '\u2029');
}

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
  const rawDescription = enterprise.full_name
    ? `${enterprise.full_name} (${enterprise.name}). ${enterprise.description}`
    : enterprise.description;
  const description = truncateSeoDescription(rawDescription);

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

  const nonce = (await headers()).get('x-nonce') || undefined;
  // SEO M-2 : BreadcrumbList JSON-LD pour rich results SERP.
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Entreprises', item: `${SITE_URL}/entreprises` },
      { '@type': 'ListItem', position: 3, name: enterprise.name, item: `${SITE_URL}/entreprises/${slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
      <EnterpriseContent enterprise={enterprise} relatedArticles={relatedArticles} />
      <EnterpriseSeoBlock enterprise={enterprise} />
    </>
  );
}
