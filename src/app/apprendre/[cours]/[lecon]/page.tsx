import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import { AjusteurLignes } from '@/components/apprendre/AjusteurLignes';
import { BarreCours, SommaireCours } from '@/components/apprendre/SommaireCours';
import { ContenuPremium } from '@/components/apprendre/ContenuPremium';
import { CorpsLecon } from '@/components/apprendre/CorpsLecon';
import { FinLecon } from '@/components/apprendre/FinLecon';
import { PartageLecon } from '@/components/apprendre/PartageLecon';
import { QuestionLecon } from '@/components/apprendre/QuestionLecon';
import { getCours, getLecon } from '@/lib/apprendre/donnees';
import { phrases } from '@/lib/apprendre/lecture';
import { NOM_DU_SITE, SITE_URL } from '@/lib/config';
import { typographieFr } from '@/lib/typographie-fr';

export const revalidate = 3600;

interface Props {
  params: Promise<{ cours: string; lecon: string }>;
}

export async function generateStaticParams() {
  const cours = await getCours();
  return cours.flatMap((c) => c.lecons.map((l) => ({ cours: c.slug, lecon: l.slug })));
}

/** « 1er décembre 2026 », « 25 novembre 2026 », à l'heure de Niamey. */
function dateFr(iso: string): string {
  const morceaux = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Niamey',
  }).formatToParts(new Date(iso));
  return morceaux
    .map((m) => (m.type === 'day' && m.value === '1' ? '1er' : m.value))
    .join('')
    .replace(/ /g, ' ');
}

function resume(texte: string, max = 158): string {
  if (texte.length <= max) return texte;
  const coupe = texte.slice(0, max);
  return `${coupe.slice(0, coupe.lastIndexOf(' '))}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cours, lecon } = await params;
  const l = await getLecon(cours, lecon);
  if (!l) return { title: 'Leçon introuvable', robots: { index: false } };
  const description = resume(l.chapeau || `${l.titre}, leçon ${l.numero} du cours ${l.cours.titre}.`);
  return {
    title: l.titre,
    description,
    alternates: { canonical: l.href },
    openGraph: {
      title: `${l.titre} | ${NOM_DU_SITE}`,
      description,
      type: 'article',
      publishedTime: l.publieeLe,
      modifiedTime: l.miseAJour,
    },
  };
}

export default async function LeconPage({ params }: Props) {
  const { cours: coursSlug, lecon: leconSlug } = await params;
  const l = await getLecon(coursSlug, leconSlug);
  if (!l) notFound();

  const nonce = (await headers()).get('x-nonce') || undefined;
  const url = `${SITE_URL}${l.href}`;
  const donneesStructurees = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Apprendre', item: `${SITE_URL}/apprendre` },
          { '@type': 'ListItem', position: 3, name: l.cours.titre, item: `${SITE_URL}${l.cours.href}` },
          { '@type': 'ListItem', position: 4, name: l.titre, item: url },
        ],
      },
      {
        '@type': 'Article',
        headline: l.titre,
        description: l.chapeau || undefined,
        url,
        mainEntityOfPage: url,
        inLanguage: 'fr',
        datePublished: l.publieeLe,
        dateModified: l.miseAJour,
        author: { '@type': 'Organization', name: NOM_DU_SITE, url: SITE_URL },
        publisher: { '@type': 'Organization', name: NOM_DU_SITE, url: SITE_URL },
        isPartOf: { '@type': 'Course', name: l.cours.titre, url: `${SITE_URL}${l.cours.href}` },
        isAccessibleForFree: !l.premium,
        ...(l.premium
          ? { hasPart: { '@type': 'WebPageElement', isAccessibleForFree: false, cssSelector: '.suite-premium' } }
          : {}),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees).replace(/</g, '\\u003c') }}
      />
      <BarreCours cours={l.cours} leconId={l.id} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-12 lg:grid lg:grid-cols-[256px_minmax(0,680px)] lg:gap-20 lg:py-14">
          <SommaireCours cours={l.cours} leconId={l.id} />
          <article className="min-w-0">
            <h1 className="text-[32px] sm:text-[38px] lg:text-[44px] font-bold leading-[1.1] tracking-[-0.03em] text-[#111] text-balance">
              {typographieFr(l.titre)}
            </h1>
            <AjusteurLignes>
            {/* Une phrase par ligne : aucune ne commence en bout de ligne, à toutes les largeurs. */}
            {l.chapeau && (
              <div className="mt-4 text-[18px] max-[359px]:text-[17px] sm:text-[20px] leading-[1.55] text-gray-600">
                {phrases(l.chapeau).map((phrase) => (
                  <p key={phrase}>{typographieFr(phrase)}</p>
                ))}
              </div>
            )}
            <div className="mt-6 mb-9 flex flex-col gap-4 border-y border-black/8 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[14px] text-gray-500">
                <span className="block sm:inline">{l.minutes}&nbsp;min de lecture</span>
                <span className="hidden sm:inline" aria-hidden="true">
                  {' · '}
                </span>
                <span className="block sm:inline">{typographieFr(`Mise à jour le ${dateFr(l.miseAJour)}`)}</span>
              </p>
              <PartageLecon titre={l.titre} chemin={l.href} />
            </div>

            {l.premium ? (
              <div className="suite-premium">
                <ContenuPremium leconId={l.id} chemin={l.href} apercu={<CorpsLecon markdown={l.apercu} />} />
              </div>
            ) : (
              <>
                <CorpsLecon markdown={l.corps ?? ''} />
                <QuestionLecon questions={l.quiz} leconId={l.id} />
              </>
            )}

            <FinLecon leconId={l.id} chemin={l.href} />
            </AjusteurLignes>

            <nav aria-label="Leçons du cours" className="mt-10">
              {l.suivante ? (
                <Link
                  href={l.suivante.href}
                  className="group flex items-center justify-between gap-6 rounded-[14px] bg-[#111] p-5 text-white transition-colors hover:bg-[#1d1d1d] sm:p-7"
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] text-white/60">Leçon suivante</span>
                    <span className="mt-1.5 block text-[19px] sm:text-[22px] font-semibold leading-[1.3] tracking-[-0.01em] text-balance">
                      {typographieFr(l.suivante.titre)}
                    </span>
                    <span className="mt-1.5 flex items-center gap-1.5 text-[13px] text-white/60">
                      {l.suivante.premium && <Lock className="h-3.5 w-3.5" aria-hidden="true" />}
                      {l.suivante.premium ? 'Premium · ' : ''}
                      {l.suivante.minutes}&nbsp;min
                    </span>
                  </span>
                  <ArrowRight className="h-6 w-6 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              ) : (
                <Link
                  href={l.cours.href}
                  className="flex items-center justify-between gap-6 rounded-[14px] bg-[#111] p-5 text-white transition-colors hover:bg-[#1d1d1d] sm:p-7"
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] text-white/60">Dernière leçon du cours</span>
                    <span className="mt-1.5 block text-[19px] sm:text-[22px] font-semibold leading-[1.3] tracking-[-0.01em] text-balance">
                      {typographieFr(`Revoir le cours ${l.cours.titre}`)}
                    </span>
                  </span>
                  <ArrowRight className="h-6 w-6 shrink-0" aria-hidden="true" />
                </Link>
              )}
              {l.precedente && (
                <Link
                  href={l.precedente.href}
                  className="mt-4 inline-flex items-center gap-2 text-[14px] text-gray-600 hover:text-[#111]"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="text-balance">{typographieFr(l.precedente.titre)}</span>
                </Link>
              )}
            </nav>
          </article>
        </div>
      </div>
    </div>
  );
}
