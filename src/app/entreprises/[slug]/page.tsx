import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase';
import { SITE_URL, truncateSeoDescription } from '@/lib/config';
import { searchArticles } from '@/lib/articles';
import { safeJsonLd } from '@/lib/seo';
import { getStrategicEnterprises } from '@/lib/strategic-enterprises';
import { secteurFr } from '@/lib/typographie-fr';
import { villeDuSiege } from '@/data/niger-chiffres';
import {
  LIGNE_ENTREPRISE,
  PHOTO_ENTREPRISE,
  logoEntreprise,
  logoSurNoir,
  pointsSansRepetition,
  secteurCourt,
  siteOfficiel,
} from '@/data/entreprises-niger';
import { EnterpriseContent, type FicheEntreprise, type PhotoDeLaFiche } from './EnterpriseContent';

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

/** La photo de la fiche : celle choisie dans le code, sinon celle envoyée depuis l'admin. */
function photoDeLaFiche(slug: string, imageAdmin: string | null | undefined): PhotoDeLaFiche | null {
  const choisie = PHOTO_ENTREPRISE[slug];
  if (choisie) return choisie;
  return imageAdmin ? { src: imageAdmin, largeur: null, hauteur: null } : null;
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

  const title = `${enterprise.name} - ${secteurFr(enterprise.sector ?? '')}`;
  const rawDescription = enterprise.full_name
    ? `${enterprise.full_name} (${enterprise.name}). ${enterprise.description}`
    : enterprise.description;
  const description = truncateSeoDescription(rawDescription);

  return {
    title,
    description,
    keywords: [enterprise.name, enterprise.sector, 'Niger', 'entreprise', enterprise.full_name || ''].filter(Boolean),
    alternates: { canonical: `${SITE_URL}/entreprises/${slug}` },
    // L'image de partage est celle de opengraph-image.tsx, à côté.
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `${SITE_URL}/entreprises/${slug}`,
      siteName: 'NFI REPORT',
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
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

  // Articles qui citent l'entreprise, et les autres entreprises visibles.
  const [relatedArticles, toutes] = await Promise.all([
    searchArticles(enterprise.name, 6),
    getStrategicEnterprises(),
  ]);

  const ligne = LIGNE_ENTREPRISE[slug] ?? null;
  const fiche: FicheEntreprise = {
    nom: enterprise.name,
    nomComplet: enterprise.full_name && enterprise.full_name !== enterprise.name ? enterprise.full_name : null,
    ligne,
    logo: logoSurNoir(slug, enterprise.logo_url),
    ville: villeDuSiege(enterprise.headquarters),
    annee: enterprise.founded_year ?? null,
    secteur: secteurCourt(enterprise.sector),
    site: siteOfficiel(enterprise.website),
    presentation: enterprise.detailed_description || enterprise.description || '',
    points: pointsSansRepetition(enterprise.key_facts as { label: string; value: string }[] | null, ligne),
    photo: photoDeLaFiche(slug, enterprise.image_url),
  };

  const autres = toutes
    .filter((e) => e.slug && e.name && e.slug !== slug)
    .map((e) => ({
      nom: e.name,
      slug: e.slug!,
      ligne: LIGNE_ENTREPRISE[e.slug!] ?? null,
      ville: villeDuSiege(e.headquarters),
      annee: e.founded_year ?? null,
      logo: logoEntreprise(e.slug!, e.logo_url),
    }));

  const photoAbsolue = fiche.photo
    ? fiche.photo.src.startsWith('http')
      ? fiche.photo.src
      : `${SITE_URL}${fiche.photo.src}`
    : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: enterprise.full_name || enterprise.name,
    alternateName: enterprise.name,
    description: enterprise.description,
    ...(enterprise.headquarters && { address: { '@type': 'PostalAddress', addressLocality: enterprise.headquarters } }),
    ...(enterprise.founded_year && { foundingDate: String(enterprise.founded_year) }),
    ...(fiche.site && { url: fiche.site.url }),
    ...(enterprise.logo_url && { logo: enterprise.logo_url }),
    ...(photoAbsolue && { image: photoAbsolue }),
  };

  const nonce = (await headers()).get('x-nonce') || undefined;
  // Fil d'Ariane : les fiches vivent dans la rubrique Niger depuis que l'Atlas
  // /entreprises y a été fondu (24/11/2026).
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Niger', item: `${SITE_URL}/niger` },
      { '@type': 'ListItem', position: 3, name: enterprise.name, item: `${SITE_URL}/entreprises/${slug}` },
    ],
  };

  return (
    <>
      {/* suppressHydrationWarning : le navigateur efface l'attribut nonce après
          lecture (sécurité CSP), React voit donc une différence entre serveur et
          client. Différence attendue, schéma officiel de Next.js. */}
      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
      <EnterpriseContent fiche={fiche} autres={autres} articles={relatedArticles} />
    </>
  );
}
