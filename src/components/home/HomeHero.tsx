import Image from 'next/image';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import type { Article } from '@/types';
import { formatDate } from '@/lib/utils';
import { fallbackImageUrl } from '@/data/mock-data';
import { SECTION_META } from '@/lib/sections';

interface HomeHeroProps {
  article: Article;
}

/**
 * Hero magazine de l'accueil NFI Report.
 * Image plein largeur 60-70vh + overlay gradient noir pour lisibilite, eyebrow
 * gold avec rubrique, H1 enorme Inter Black, lead italic + meta auteur/date.
 * Style FT The Big Read / NYT The Daily / Bloomberg Big Take.
 */
export function HomeHero({ article }: HomeHeroProps) {
  const href = `/articles/${article.slug.current}`;
  const imageUrl = article.mainImage?.url ?? fallbackImageUrl;
  const sectionLabel =
    SECTION_META[article.sections?.[0] ?? article.category]?.label ?? 'Actualite';

  return (
    <section className="relative isolate overflow-hidden bg-[#0a0a0a]">
      <Link href={href} className="group block">
        <div className="relative min-h-[60vh] md:min-h-[68vh] lg:min-h-[72vh] flex flex-col">
          {/* Image */}
          <div className="absolute inset-0">
            <Image
              src={imageUrl}
              alt={article.mainImage?.alt || article.title}
              fill
              sizes="100vw"
              quality={90}
              priority
              className="object-cover opacity-80 group-hover:opacity-70 group-hover:scale-[1.015] transition-all duration-700"
            />
          </div>
          {/* Overlay degrade pour lisibilite texte */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.55) 45%, rgba(10,10,10,0.15) 75%, rgba(10,10,10,0.45) 100%)',
            }}
          />

          {/* Contenu */}
          <div className="relative flex-1 flex flex-col justify-end max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
            <div className="max-w-4xl">
              {/* Eyebrow rubrique */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[11px] md:text-[12px] font-semibold tracking-[0.24em] uppercase text-gold">
                  {article.isPremium ? 'Premium · ' : ''}
                  {sectionLabel}
                </span>
              </div>

              {/* Titre */}
              <h1 className="text-white font-black tracking-tight leading-[1.02] text-[clamp(2.25rem,6vw,4.5rem)] group-hover:text-white/90 transition-colors">
                {article.title}
              </h1>

              {/* Lead */}
              {article.excerpt ? (
                <p className="mt-6 text-[clamp(1rem,1.5vw,1.25rem)] font-normal italic leading-relaxed text-white/85 max-w-3xl line-clamp-3">
                  {article.excerpt}
                </p>
              ) : null}

              {/* Meta : auteur / date / read time */}
              <div className="mt-7 flex items-center gap-5 flex-wrap text-[12px] md:text-[13px] text-white/70">
                {article.author?.name ? (
                  <span className="font-semibold tracking-wide uppercase text-white/85">
                    {article.author.name}
                  </span>
                ) : null}
                {article.publishedAt ? (
                  <>
                    <span aria-hidden className="w-1 h-1 rounded-full bg-white/30" />
                    <span>{formatDate(article.publishedAt)}</span>
                  </>
                ) : null}
                {article.readTime ? (
                  <>
                    <span aria-hidden className="w-1 h-1 rounded-full bg-white/30" />
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" aria-hidden />
                      {article.readTime} min de lecture
                    </span>
                  </>
                ) : null}
              </div>

              {/* CTA "Lire" - bouton ghost rond */}
              <div className="mt-9">
                <span className="inline-flex items-center gap-2.5 px-6 py-3 text-[13px] font-bold uppercase tracking-[0.16em] text-foreground bg-white group-hover:bg-gold group-hover:text-foreground transition-colors rounded-full">
                  Lire l&apos;article
                  <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 7h10m0 0L8 3m4 4L8 11"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
