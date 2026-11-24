import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/config';
import { createServiceClient } from '@/lib/supabase';
import { getArticlesByCategory } from '@/lib/articles';
import { ArticleCard } from '@/components/ArticleCard';
import { paragrapheFr, typographieFr } from '@/lib/typographie-fr';
import { CarteNigerEntreprises, type EntrepriseSurCarte } from '@/components/niger/CarteNigerEntreprises';
import {
  CHIFFRES_CLES,
  DETTE_PUBLIQUE,
  EN_UN_AN,
  NIGER_CHIFFRES_MIS_A_JOUR,
  SECTEURS_PIB,
  pourcentFr,
  secteurFr,
  villeDuSiege,
} from '@/data/niger-chiffres';

/**
 * Page Niger, « Chiffres et entreprises » (maquette A validée par Raouf le
 * 24/11/2026) : la carte en points de la page d'attente, les chiffres clés de
 * l'INS avec leur source, les grands équilibres, puis les entreprises
 * stratégiques lues en base. Les chiffres vivent dans src/data/niger-chiffres.ts.
 */

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Niger : chiffres clés et entreprises',
  description:
    'Les chiffres officiels de l’économie du Niger, chacun avec sa source et sa date, et les entreprises qui pèsent dans le pays.',
  alternates: { canonical: `${SITE_URL}/niger` },
  openGraph: {
    title: 'Niger : chiffres clés et entreprises',
    description: 'Les chiffres officiels de l’économie du Niger et ses entreprises stratégiques.',
    url: `${SITE_URL}/niger`,
    type: 'website',
  },
};

const NB = '\u00a0';
const GRIS = ['#33363b', '#6b7280', '#a3a8b0'];

/** Paragraphe ou titre affiché : typographie française et fin soudée. */
const soigne = (texte: string) => paragrapheFr(texte);

function dateFr(iso: string): string {
  return new Date(`${iso}T12:00:00Z`)
    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .replace(/ /g, NB);
}

async function getEntreprises(): Promise<EntrepriseSurCarte[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('strategic_enterprises')
    .select('name, slug, sector, headquarters')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });
  if (error || !data) return [];
  return data
    .filter((e) => e.slug && e.name)
    .map((e) => ({
      nom: e.name as string,
      slug: e.slug as string,
      secteur: secteurFr((e.sector as string | null) ?? ''),
      ville: villeDuSiege(e.headquarters as string | null),
    }));
}

export default async function NigerPage() {
  const [entreprises, { articles }] = await Promise.all([
    getEntreprises(),
    getArticlesByCategory('entreprises', 1, 3),
  ]);
  const detteAffichee = pourcentFr(DETTE_PUBLIQUE.totale);

  return (
    <div className="min-h-screen bg-background">
      {/* Le pays d'un coup d'œil : titre, carte, chiffres clés. */}
      <section className="bg-[#0b0b0c] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 md:pt-14 md:pb-16 grid gap-6 lg:gap-x-12 lg:grid-cols-[5fr_6fr] [grid-template-areas:'titre''carte''cles'] lg:[grid-template-areas:'titre_carte''cles_carte']">
          <div className="[grid-area:titre] lg:self-end">
            <h1 className="text-[44px] sm:text-[56px] lg:text-[64px] font-bold tracking-[-0.03em] leading-none">Niger</h1>
            <p className="mt-3 text-[18px] sm:text-[21px] text-[#8a8e95]">Chiffres et entreprises</p>
          </div>

          <div className="[grid-area:carte] lg:self-center">
            <CarteNigerEntreprises entreprises={entreprises} />
          </div>

          <div className="[grid-area:cles] lg:self-start">
            <dl className="grid grid-cols-2 gap-x-5 gap-y-6 sm:gap-x-8 lg:mt-4">
              {CHIFFRES_CLES.map((c) => (
                <div key={c.libelle}>
                  <dt className="text-[14px] text-[#8a8e95]">{c.libelle}</dt>
                  <dd className="mt-2">
                    <span className="block text-[30px] sm:text-[40px] font-bold tracking-[-0.02em] leading-none">
                      {c.valeur}
                    </span>
                    <span className="mt-1.5 block text-[14.5px] text-gray-300">{c.complement}</span>
                    <span className="mt-1 block text-[12px] text-[#8b9098]">{c.source}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-7 border-t border-white/12 pt-3.5 text-[12.5px] text-[#8b9098]">
              {soigne(`Chiffres officiels de l\u2019INS, page mise à jour le ${dateFr(NIGER_CHIFFRES_MIS_A_JOUR)}.`)}
            </p>
          </div>
        </div>
      </section>

      {/* Les grands équilibres : ce que produit le pays, ce qu'il doit, ce qui a bougé. */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2 className="text-[24px] font-bold tracking-[-0.01em]">Les grands équilibres</h2>
        <p className="mt-1.5 text-[15px] text-gray-500 text-pretty">
          {soigne('Ce que produit le pays, ce qu\u2019il doit, et comment ces chiffres ont bougé en un an.')}
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <figure className="rounded-[10px] border border-black/8 bg-white p-5 sm:p-6">
            <figcaption>
              <h3 className="text-[17px] font-bold">Ce que produit le pays</h3>
              <p className="mt-0.5 text-[13px] text-gray-500">{soigne('Part de chaque secteur dans le PIB 2025')}</p>
            </figcaption>
            <div className="mt-5 flex h-[18px] gap-[2px]" aria-hidden="true">
              {SECTEURS_PIB.map((s, i) => (
                <div
                  key={s.libelle}
                  className="h-full first:rounded-l last:rounded-r"
                  style={{ width: `${s.part}%`, background: GRIS[i] }}
                />
              ))}
            </div>
            <ul className="mt-4 space-y-2.5">
              {SECTEURS_PIB.map((s, i) => (
                <li key={s.libelle} className="grid grid-cols-[12px_1fr_auto] items-center gap-2.5 text-[14px]">
                  <span className="h-3 w-3 rounded-[3px]" style={{ background: GRIS[i] }} aria-hidden="true" />
                  <span>{s.libelle}</span>
                  <span className="font-bold">{pourcentFr(s.part)}</span>
                </li>
              ))}
            </ul>
          </figure>

          <figure className="rounded-[10px] border border-black/8 bg-white p-5 sm:p-6">
            <figcaption>
              <h3 className="text-[17px] font-bold">La dette publique{NB}: {detteAffichee} du{NB}PIB</h3>
              <p className="mt-0.5 text-[13px] text-gray-500">
                {soigne(`Sous le plafond de ${DETTE_PUBLIQUE.plafondUemoa} % fixé par l\u2019UEMOA`)}
              </p>
            </figcaption>
            <div className="relative mt-5 flex h-[18px] gap-[2px] rounded bg-[#eceef1]" aria-hidden="true">
              <div className="h-full rounded-l" style={{ width: `${DETTE_PUBLIQUE.exterieure}%`, background: GRIS[0] }} />
              <div className="h-full rounded-r" style={{ width: `${DETTE_PUBLIQUE.interieure}%`, background: GRIS[1] }} />
              <div className="absolute -top-2 -bottom-2 w-[2px] bg-[#111]" style={{ left: `${DETTE_PUBLIQUE.plafondUemoa}%` }}>
                <span className="absolute top-[30px] right-0 whitespace-nowrap text-[12px] font-semibold">
                  {DETTE_PUBLIQUE.plafondUemoa}{NB}%, plafond UEMOA
                </span>
              </div>
            </div>
            <ul className="mt-11 space-y-2.5">
              <li className="grid grid-cols-[12px_1fr_auto] items-center gap-2.5 text-[14px]">
                <span className="h-3 w-3 rounded-[3px]" style={{ background: GRIS[0] }} aria-hidden="true" />
                <span>Dette extérieure</span>
                <span className="font-bold">{pourcentFr(DETTE_PUBLIQUE.exterieure)}</span>
              </li>
              <li className="grid grid-cols-[12px_1fr_auto] items-center gap-2.5 text-[14px]">
                <span className="h-3 w-3 rounded-[3px]" style={{ background: GRIS[1] }} aria-hidden="true" />
                <span>Dette intérieure</span>
                <span className="font-bold">{pourcentFr(DETTE_PUBLIQUE.interieure)}</span>
              </li>
            </ul>
          </figure>
        </div>

        <h3 className="mt-9 mb-3.5 text-[17px] font-bold">En un an, de 2024 à{NB}2025</h3>
        <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {EN_UN_AN.map((e) => (
            <li key={e.libelle} className="rounded-[10px] border border-black/8 bg-white px-5 py-[18px]">
              <p className="text-[14px] text-gray-700">{e.libelle}</p>
              <p className="mt-2.5 flex items-baseline gap-2.5">
                <span className="text-[16px] text-gray-400">{e.avant}</span>
                <span className="text-[16px] text-gray-500" aria-label="puis">→</span>
                <span className="text-[26px] sm:text-[28px] font-bold tracking-[-0.01em]">{e.apres}</span>
              </p>
              <p className="mt-1.5 text-[13px] text-gray-500">{e.verdict}</p>
              {e.precision && <p className="mt-0.5 text-[12px] text-gray-400">{soigne(e.precision)}</p>}
            </li>
          ))}
        </ul>
      </section>

      {/* Les entreprises stratégiques, lues en base (visibles dans l'admin). */}
      {entreprises.length > 0 && (
        <section id="entreprises" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-16 scroll-mt-24">
          <h2 className="text-[24px] font-bold tracking-[-0.01em]">Les entreprises</h2>
          <p className="mt-1.5 text-[15px] text-gray-500">{soigne('Les sociétés qui pèsent dans l\u2019économie du pays.')}</p>
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-4">
            {entreprises.map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/entreprises/${e.slug}`}
                  className="block h-full rounded-[10px] border border-black/8 bg-white p-[18px] transition-colors hover:border-black/20"
                >
                  <span className="block text-[17px] font-bold leading-tight">{e.nom}</span>
                  <span className="mt-1 block text-[13px] text-gray-500">{typographieFr(e.secteur)}</span>
                  {e.ville && <span className="block text-[13px] text-gray-400">{e.ville}</span>}
                  <span className="mt-3 block text-[13px] font-semibold">Voir la fiche&nbsp;›</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Nos articles sur les entreprises : seulement s'il y en a. */}
      {articles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-16">
          <h2 className="mb-6 text-[24px] font-bold tracking-[-0.01em]">À lire</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <p className="border-t border-black/8 pt-4 text-[13px] leading-relaxed text-gray-500 text-pretty">
          {soigne(
            'Sources : Institut national de la statistique du Niger (INS), comptes économiques rapides 2025 publiés en avril 2026, et note de conjoncture du 4e trimestre 2025 publiée en mars 2026.',
          )}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-gray-500 text-pretty">
          {soigne('Le plafond de dette de 70 % est un critère de convergence de l\u2019UEMOA.')}
        </p>
      </div>
    </div>
  );
}
