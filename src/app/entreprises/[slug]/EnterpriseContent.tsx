import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { CarteSiege, villeSurLaCarte } from '@/components/niger/CarteSiege';
import { AutresEntreprises, type AutreEntreprise } from '@/components/niger/AutresEntreprises';
import { enPhrases, paragrapheFr, typographieFr } from '@/lib/typographie-fr';
import type { Article } from '@/types';

/**
 * Fiche d'une entreprise, direction « Dans la famille Niger » choisie par
 * Raouf le 25/11/2026 : le haut reprend la grammaire de la page Niger
 * (bandeau noir, carte en points avec le siège allumé, année, ville et
 * secteur en grand), le logo posé sur le noir sans carré blanc ; dessous, la
 * présentation, les points clés en cartes, la photo à son format d'origine,
 * les articles qui citent l'entreprise et les autres entreprises.
 */

export interface PhotoDeLaFiche {
  src: string;
  /** Inconnues pour une photo envoyée depuis l'admin : elle garde alors son format au chargement. */
  largeur: number | null;
  hauteur: number | null;
  legende?: string;
  credit?: string;
  source?: string;
}

export interface FicheEntreprise {
  nom: string;
  nomComplet: string | null;
  ligne: string | null;
  logo: string | null;
  ville: string;
  annee: number | null;
  secteur: string;
  site: { url: string; libelle: string } | null;
  presentation: string;
  points: { label: string; value: string }[];
  photo: PhotoDeLaFiche | null;
}

function PhotoFiche({ photo, nom }: { photo: PhotoDeLaFiche; nom: string }) {
  const credit = photo.credit ? typographieFr(`Photo : ${photo.credit}`) : null;
  return (
    <figure className="min-w-0">
      <Image
        src={photo.src}
        alt={photo.legende ?? `Photo publiée par ${nom}`}
        width={photo.largeur ?? 1600}
        height={photo.hauteur ?? 1067}
        sizes="(min-width: 1280px) 500px, (min-width: 768px) 40vw, 100vw"
        className="h-auto w-full rounded-[10px] bg-black/[0.04]"
      />
      {photo.legende || credit ? (
        <figcaption className="mt-2.5 text-[13px] leading-snug">
          {photo.legende ? <span className="block text-gray-600">{typographieFr(photo.legende)}</span> : null}
          {credit ? (
            <span className="mt-0.5 block text-gray-500">
              {photo.source ? (
                <a
                  href={photo.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-black/20 underline-offset-2 transition-colors hover:text-gray-700"
                >
                  {credit}
                </a>
              ) : (
                credit
              )}
            </span>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function EnterpriseContent({
  fiche,
  autres,
  articles,
}: {
  fiche: FicheEntreprise;
  autres: AutreEntreprise[];
  articles: Article[];
}) {
  const avecCarte = Boolean(villeSurLaCarte(fiche.ville));
  const cles = [
    fiche.annee ? { label: 'Création', valeur: String(fiche.annee) } : null,
    fiche.ville ? { label: 'Siège', valeur: fiche.ville } : null,
    fiche.secteur ? { label: 'Secteur', valeur: fiche.secteur } : null,
  ].filter((c): c is { label: string; valeur: string } => c !== null);

  return (
    <div className="min-h-screen bg-background">
      {/* L'entreprise d'un coup d'œil, comme le haut de la page Niger. */}
      <section className="bg-[#0b0b0c] text-white">
        <div
          className={`mx-auto grid max-w-7xl gap-7 px-4 pb-10 pt-2 sm:px-6 md:pb-14 lg:gap-x-14 lg:gap-y-9 lg:px-8 lg:pb-16 lg:pt-8 ${
            avecCarte
              ? "[grid-template-areas:'titre''carte''cles'] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:[grid-template-areas:'titre_carte''cles_carte']"
              : "[grid-template-areas:'titre''cles']"
          }`}
        >
          <div className="[grid-area:titre] lg:self-end">
            <Link
              href="/niger#entreprises"
              className="-ml-1 inline-flex min-h-[44px] items-center gap-2 px-1 text-[14px] text-white/60 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Toutes les entreprises
            </Link>
            {fiche.logo ? (
              <div className="relative mt-5 h-16 w-[220px] sm:h-[76px] sm:w-[260px]">
                <Image
                  src={fiche.logo}
                  alt={`Logo ${fiche.nom}`}
                  fill
                  priority
                  sizes="260px"
                  className="object-contain object-left"
                />
              </div>
            ) : null}
            {/* Nom tenu sur une ligne à toutes les largeurs, « Niger Telecoms » compris. */}
            <h1 className="mt-6 text-[34px] font-bold leading-none tracking-[-0.03em] min-[360px]:text-[40px] sm:text-[56px] lg:text-[52px] xl:text-[64px]">
              {fiche.nom}
            </h1>
            {fiche.nomComplet ? (
              <p className="mt-3 text-[16px] text-[#8a8e95] sm:text-[18px]">{paragrapheFr(fiche.nomComplet, 36)}</p>
            ) : null}
            {fiche.ligne ? (
              <p className="mt-1.5 text-[19px] text-gray-200 sm:text-[21px]">{typographieFr(fiche.ligne)}</p>
            ) : null}
          </div>

          {avecCarte ? (
            <div className="[grid-area:carte] md:max-w-[600px] lg:max-w-none lg:self-center">
              <CarteSiege ville={fiche.ville} entreprise={fiche.nom} />
            </div>
          ) : null}

          <dl className="[grid-area:cles] border-t border-white/14 md:grid md:grid-cols-3 md:gap-x-7 md:border-t-0 lg:self-start">
            {cles.map((c) => (
              <div
                key={c.label}
                className="flex items-baseline justify-between gap-4 border-b border-white/10 py-3 md:block md:border-b-0 md:border-t md:border-white/14 md:pb-0 md:pt-3"
              >
                <dt className="text-[14px] text-[#8a8e95]">{c.label}</dt>
                <dd className="text-right text-[20px] font-bold tracking-[-0.01em] md:mt-1.5 md:text-left md:text-[28px]">
                  {c.valeur}
                </dd>
              </div>
            ))}
            {fiche.site ? (
              <div className="flex items-baseline justify-between gap-4 py-3 md:col-span-3 md:mt-4 md:block md:pb-0 md:pt-0">
                <dt className="text-[14px] text-[#8a8e95]">Site officiel</dt>
                <dd className="md:mt-1.5">
                  <a
                    href={fiche.site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-1.5 text-[17px] font-semibold md:min-h-0"
                  >
                    <span className="border-b border-white/50 leading-tight">{fiche.site.libelle}</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="sr-only">(nouvel onglet)</span>
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-14 pt-11 sm:px-6 md:pb-20 md:pt-16 lg:px-8">
        <div
          className={
            fiche.photo
              ? 'grid items-start gap-10 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-x-10 lg:gap-x-16'
              : undefined
          }
        >
          <div className="min-w-0">
            <section aria-labelledby="presentation">
              <h2 id="presentation" className="text-[24px] font-bold tracking-[-0.01em] text-[#111]">
                Présentation
              </h2>
              <p className="mt-2.5 max-w-[40em] text-[16px] leading-[1.7] text-[#2a2c30] text-pretty sm:text-[17px] lg:text-[18px]">
                {/* Une phrase par bloc : une phrase commence toujours en début de ligne,
                    jamais par deux ou trois mots laissés en bout de ligne. Chaque phrase est
                    équilibrée sur ses lignes : sa dernière ligne n'est jamais courte. */}
                {enPhrases(fiche.presentation).map((phrase, i) => (
                  <span key={i} className="block [text-wrap:balance]">
                    {paragrapheFr(phrase)}
                  </span>
                ))}
              </p>
            </section>

            {fiche.points.length > 0 ? (
              <section aria-labelledby="points-cles" className="@container mt-9">
                <h2 id="points-cles" className="text-[24px] font-bold tracking-[-0.01em] text-[#111]">
                  Points clés
                </h2>
                <ul className="mt-3.5 grid gap-2.5 @xl:grid-cols-3 @xl:gap-3">
                  {fiche.points.map((p) => (
                    <li key={p.label} className="rounded-[10px] border border-black/8 bg-white px-[18px] pb-[17px] pt-[15px]">
                      <p className="text-[14px] text-gray-600">{typographieFr(p.label)}</p>
                      {/* Valeur courte : seuls les petits mots sont soudés, elle peut passer
                          sur deux lignes dans une carte étroite au lieu d'en déborder. */}
                      <p className="mt-1.5 text-[22px] font-bold leading-tight tracking-[-0.015em] text-[#111] [overflow-wrap:anywhere] @xl:text-[20px]">
                        {typographieFr(p.value)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          {fiche.photo ? <PhotoFiche photo={fiche.photo} nom={fiche.nom} /> : null}
        </div>

        {articles.length > 0 ? (
          <section aria-labelledby="a-lire" className="mt-14 md:mt-16">
            <h2 id="a-lire" className="text-[24px] font-bold tracking-[-0.01em] text-[#111]">
              À lire
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article._id} article={article} />
              ))}
            </div>
          </section>
        ) : null}

        {autres.length > 0 ? (
          <section aria-labelledby="autres-entreprises" className="mt-14 md:mt-16">
            <h2 id="autres-entreprises" className="text-[24px] font-bold tracking-[-0.01em] text-[#111]">
              Les autres entreprises
            </h2>
            <AutresEntreprises entreprises={autres} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
