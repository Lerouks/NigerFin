import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import { AjusteurLignes } from '@/components/apprendre/AjusteurLignes';
import { ContenuPremium } from '@/components/apprendre/ContenuPremium';
import { CorpsLecon } from '@/components/apprendre/CorpsLecon';
import { FinLecon } from '@/components/apprendre/FinLecon';
import { BoutonWhatsApp, PartageLecon } from '@/components/apprendre/PartageLecon';
import { PlanLecon, PlanLeconReplie } from '@/components/apprendre/PlanLecon';
import { QuestionLecon } from '@/components/apprendre/QuestionLecon';
import { MargeLecon, TeteLecon } from '@/components/apprendre/ReperesLecon';
import { suiteAVenir, titreAVenir } from '@/lib/apprendre/a-venir';
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

const boutonNoir =
  'inline-flex h-[54px] w-full items-center justify-between gap-4 rounded-[10px] bg-[#111] px-[22px] text-[16px] font-semibold text-white transition-colors hover:bg-[#2a2a2a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] sm:w-auto';

/**
 * La page d'une leçon, maquette « Le livre » (choix de Raouf, 26/11/2026) :
 * une colonne de lecture claire ; sur ordinateur, la couverture du cours et
 * ses leçons dans la marge gauche, le plan de la leçon dans la marge droite ;
 * sur téléphone, un repère collé sous l'en-tête et le plan replié sous la date.
 */
export default async function LeconPage({ params }: Props) {
  const { cours: coursSlug, lecon: leconSlug } = await params;
  const l = await getLecon(coursSlug, leconSlug);
  if (!l) notFound();

  const nonce = (await headers()).get('x-nonce') || undefined;
  const url = `${SITE_URL}${l.href}`;
  const total = l.cours.lecons.length;
  const liens = !l.premium;
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
      <TeteLecon cours={l.cours} leconId={l.id} minutes={l.minutes} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="pb-16 pt-7 sm:pt-9 lg:grid lg:grid-cols-[200px_minmax(0,680px)] lg:justify-between lg:gap-12 lg:pb-24 lg:pt-[52px] xl:grid-cols-[200px_minmax(0,680px)_200px]">
          <MargeLecon cours={l.cours} leconId={l.id} plan={<PlanLecon parties={l.parties} liens={liens} />} />
          <article className="min-w-0">
            <p className="mb-3 hidden text-[14px] font-semibold text-gray-500 tabular-nums lg:block">Leçon {l.numero}</p>
            <h1 className="text-[29px] font-bold leading-[1.08] tracking-[-0.03em] text-[#111] text-balance min-[360px]:text-[32px] sm:text-[40px] lg:text-[48px] lg:leading-[1.05] lg:tracking-[-0.035em]">
              {typographieFr(l.titre)}
            </h1>
            <AjusteurLignes>
              {/* Une phrase par ligne : aucune ne commence en bout de ligne, à toutes les largeurs. */}
              {l.chapeau && (
                <div className="mt-4 text-[18px] leading-[1.55] text-gray-600 max-[359px]:text-[17px] sm:text-[20px] lg:mt-5">
                  {phrases(l.chapeau).map((phrase) => (
                    <p key={phrase}>{typographieFr(phrase)}</p>
                  ))}
                </div>
              )}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[14px] text-gray-500">
                  <span className="hidden lg:inline">{l.minutes}&nbsp;min de lecture · </span>
                  {typographieFr(`Mise à jour le ${dateFr(l.miseAJour)}`)}
                </p>
                <PartageLecon titre={l.titre} chemin={l.href} />
              </div>
              <PlanLeconReplie parties={l.parties} liens={liens} />

              <div className="mt-9 border-t border-black/10 pt-9 lg:mt-10 lg:pt-10">
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
              </div>

              <FinLecon leconId={l.id} chemin={l.href} />

              {l.suivante ? (
                <nav aria-label="Leçon suivante" className="mt-14 border-t-2 border-[#111] pt-7">
                  <p className="flex flex-wrap items-center gap-x-1.5 text-[14px] text-gray-500 tabular-nums">
                    Leçon suivante · {l.suivante.numero} sur {total} · {l.suivante.minutes}&nbsp;min
                    {l.suivante.premium && (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#111]">
                        · <Lock className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" /> Premium
                      </span>
                    )}
                  </p>
                  <p className="mt-2.5 text-[27px] font-bold leading-[1.12] tracking-[-0.03em] text-[#111] text-balance sm:text-[34px]">
                    {typographieFr(l.suivante.titre)}
                  </p>
                  {l.suivante.chapeau && (
                    <p className="mt-3.5 text-[16.5px] leading-[1.6] text-gray-600 sm:text-[18px] max-sm:[&_.phrase]:block">
                      {phrases(l.suivante.chapeau).map((phrase, i) => (
                        <span key={phrase} className="phrase">
                          {i > 0 ? ' ' : ''}
                          {typographieFr(phrase)}
                        </span>
                      ))}
                    </p>
                  )}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={l.suivante.href} className={boutonNoir}>
                      Lire la leçon {l.suivante.numero}
                      <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
                    </Link>
                    <BoutonWhatsApp titre={l.titre} chemin={l.href} />
                  </div>
                </nav>
              ) : (
                <nav aria-label="Fin du cours" className="mt-14 border-t-2 border-[#111] pt-7">
                  <p className="text-[14px] text-gray-500">Dernière leçon publiée du cours</p>
                  <p className="mt-2.5 text-[27px] font-bold leading-[1.12] tracking-[-0.03em] text-[#111] text-balance sm:text-[34px]">
                    {typographieFr(`Revoir le cours ${l.cours.titre}`)}
                  </p>
                  {l.cours.aVenir && (
                    <p className="mt-3.5 text-[16.5px] leading-[1.6] text-gray-600 sm:text-[18px]">
                      À venir&nbsp;: <strong className="font-semibold text-[#111]">{typographieFr(titreAVenir(l.cours.aVenir.prochaine, l.cours.aVenir.nombre))}</strong>
                      {suiteAVenir(l.cours.aVenir.nombre)}
                    </p>
                  )}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={l.cours.href} className={boutonNoir}>
                      Revoir le sommaire
                      <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
                    </Link>
                    <BoutonWhatsApp titre={l.titre} chemin={l.href} />
                  </div>
                </nav>
              )}
            </AjusteurLignes>

            {l.precedente && (
              <Link
                href={l.precedente.href}
                className="mt-6 inline-flex min-h-[44px] items-center gap-2 text-[14px] text-gray-600 hover:text-[#111]"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="text-balance">{typographieFr(l.precedente.titre)}</span>
              </Link>
            )}
          </article>
          <aside className="sticky top-[calc(var(--header-height)+32px)] hidden self-start xl:block">
            <PlanLecon parties={l.parties} liens={liens} />
          </aside>
        </div>
      </div>
    </div>
  );
}
