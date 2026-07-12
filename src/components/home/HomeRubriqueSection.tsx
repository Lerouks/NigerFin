import Image from 'next/image';
import Link from 'next/link';
import type { Article } from '@/types';
import { formatDate } from '@/lib/utils';
import { fallbackImageUrl } from '@/data/mock-data';

interface HomeRubriqueSectionProps {
  sectionKey: string;
  sectionLabel: string;
  sectionPath: string;
  articles: Article[];
  intro?: string;
}

/**
 * Section rubrique de l'accueil : 1 vedette format magazine (gauche) +
 * jusqu'a 3 articles secondaires en liste verticale dense (droite).
 * Style FT Big Story / NYT Section. Remplace le pattern monotone "grille
 * 2 colonnes ArticleCard identiques" qui faisait blog Medium.
 */
export function HomeRubriqueSection({
  sectionKey,
  sectionLabel,
  sectionPath,
  articles,
  intro,
}: HomeRubriqueSectionProps) {
  if (articles.length === 0) return null;
  const [vedette, ...rest] = articles;
  const secondary = rest.slice(0, 3);
  if (!vedette) return null;

  return (
    <section
      aria-labelledby={`home-section-${sectionKey}`}
      className="pt-12 md:pt-16 border-t border-black/10"
    >
      <header className="mb-8 md:mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[11px] uppercase tracking-[0.24em] text-foreground font-extrabold">
            Rubrique
          </span>
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2
              id={`home-section-${sectionKey}`}
              className="font-black tracking-tight leading-[1.05] text-[clamp(1.875rem,3.5vw,2.5rem)] text-foreground"
            >
              {sectionLabel}
            </h2>
            {intro ? (
              <p className="mt-3 text-[15px] md:text-[16px] italic text-gray-700 max-w-2xl leading-relaxed">
                {intro}
              </p>
            ) : null}
          </div>
          <Link
            href={sectionPath}
            className="inline-flex items-center gap-2 text-[12px] md:text-[13px] font-bold uppercase tracking-[0.14em] text-foreground hover:text-foreground/70 transition-colors border-b-2 border-gold pb-1"
          >
            Voir tous
            <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6h8m0 0L7 3m3 3L7 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </header>

      {/* Grid vedette + liste secondaires */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-8 lg:gap-12">
        {/* Vedette */}
        <Link
          href={`/articles/${vedette.slug.current}`}
          className="group block"
        >
          <article>
            <div className="relative aspect-[16/10] overflow-hidden bg-secondary mb-5">
              <Image
                src={vedette.mainImage?.url || fallbackImageUrl}
                alt={vedette.mainImage?.alt || vedette.title}
                fill
                sizes="(min-width: 1024px) 720px, 100vw"
                quality={85}
                className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
            <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-[0.18em] text-gray-600 font-semibold">
              {vedette.isPremium ? (
                <span className="text-gold font-bold">Premium</span>
              ) : null}
              {vedette.isPremium ? <span aria-hidden className="text-gray-300">·</span> : null}
              <span>{sectionLabel}</span>
            </div>
            <h3 className="text-[clamp(1.5rem,2.5vw,2rem)] font-black tracking-tight leading-[1.1] text-foreground group-hover:text-foreground/75 transition-colors">
              {vedette.title}
            </h3>
            {vedette.excerpt ? (
              <p className="mt-3 text-[15px] md:text-[16px] leading-relaxed text-gray-700 line-clamp-3">
                {vedette.excerpt}
              </p>
            ) : null}
            <div className="mt-4 flex items-center gap-3 text-[12px] text-gray-600">
              {vedette.author?.name ? (
                <span className="font-semibold">{vedette.author.name}</span>
              ) : null}
              {vedette.publishedAt ? (
                <>
                  <span aria-hidden className="w-1 h-1 rounded-full bg-gray-400" />
                  <span>{formatDate(vedette.publishedAt)}</span>
                </>
              ) : null}
            </div>
          </article>
        </Link>

        {/* Secondaires : liste dense FT-style */}
        <div>
          {secondary.length > 0 ? (
            <ul>
              {secondary.map((a, idx) => (
                <li
                  key={a._id}
                  className={
                    'group ' +
                    (idx < secondary.length - 1 ? 'border-b border-black/8' : '')
                  }
                >
                  <Link
                    href={`/articles/${a.slug.current}`}
                    className="flex items-start gap-4 py-5 first:pt-0 last:pb-0"
                  >
                    <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0 overflow-hidden bg-secondary">
                      <Image
                        src={a.mainImage?.url || fallbackImageUrl}
                        alt={a.mainImage?.alt || a.title}
                        fill
                        sizes="112px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-gray-600 font-bold mb-1.5">
                        {a.isPremium ? (
                          <span className="text-gold mr-2">Premium</span>
                        ) : null}
                        {sectionLabel}
                      </div>
                      <h4 className="text-[15px] md:text-[16px] font-bold leading-snug text-foreground group-hover:text-foreground/70 transition-colors line-clamp-3">
                        {a.title}
                      </h4>
                      <div className="mt-2 text-[11px] text-gray-500">
                        {a.publishedAt ? formatDate(a.publishedAt) : ''}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] italic text-gray-500">
              Plus d&apos;articles a venir prochainement.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
