import Image from 'next/image';
import Link from 'next/link';
import type { StrategicEnterprise } from '@/lib/strategic-enterprises';
import { getMajorityCountry } from '@/lib/ownership';
import { CountryFlag } from './CountryFlag';

interface EnterpriseListItemProps {
  enterprise: StrategicEnterprise;
  rank: number;
}

/**
 * Ligne dense FT-style pour la liste sectorielle.
 * Structure : rang gris a gauche, logo N&B 48px, nom + secteur + description 2 lignes,
 * mini-stats inline (fondation + drapeau), fleche droite. Hover = surlignement gris tres leger.
 * Tout en charte monochrome stricte, ZERO couleur sectorielle.
 */
export function EnterpriseListItem({ enterprise, rank }: EnterpriseListItemProps) {
  const majorityCountry = getMajorityCountry(enterprise.ownership);
  const hasLogo = !!enterprise.logo_url;
  const detailHref = enterprise.slug ? `/entreprises/${enterprise.slug}` : null;

  const inner = (
    <article className="group flex items-start gap-4 md:gap-6 py-6 border-b border-black/8 hover:bg-secondary/40 transition-colors -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
      {/* Rang */}
      <span
        aria-hidden
        className="shrink-0 font-mono text-[18px] md:text-[22px] font-bold tabular-nums text-gray-500 leading-none mt-1"
      >
        {String(rank).padStart(2, '0')}
      </span>

      {/* Logo N&B */}
      <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 bg-secondary border border-black/6 flex items-center justify-center overflow-hidden">
        {hasLogo ? (
          <Image
            src={enterprise.logo_url!}
            alt={`Logo ${enterprise.name}`}
            width={56}
            height={56}
            className="w-full h-full object-contain p-1 grayscale group-hover:grayscale-0 transition-[filter] duration-300"
          />
        ) : (
          <span className="text-[20px] font-bold text-gray-400">
            {enterprise.name.charAt(0)}
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h3 className="text-[17px] md:text-[18px] font-bold tracking-tight text-foreground leading-tight">
            {enterprise.name}
          </h3>
          {enterprise.full_name && enterprise.full_name !== enterprise.name ? (
            <span className="text-[12px] text-gray-600 italic">
              {enterprise.full_name}
            </span>
          ) : null}
        </div>

        <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px] uppercase tracking-[0.14em] text-gray-500 font-semibold">
          <span>{enterprise.sector}</span>
          {enterprise.founded_year ? (
            <>
              <span aria-hidden className="text-gray-400">
                &middot;
              </span>
              <span className="font-normal">Fondee {enterprise.founded_year}</span>
            </>
          ) : null}
          {enterprise.headquarters ? (
            <>
              <span aria-hidden className="text-gray-400">
                &middot;
              </span>
              <span className="font-normal">{enterprise.headquarters}</span>
            </>
          ) : null}
        </div>

        <p className="mt-2 text-[14px] leading-relaxed text-gray-600 line-clamp-2">
          {enterprise.description}
        </p>

        {/* Pied : drapeau + stats facultatives */}
        <div className="mt-3 flex items-center gap-4 flex-wrap text-[12px] text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <CountryFlag country={majorityCountry} size={14} monochrome />
            <span className="font-medium">Controle majoritaire</span>
          </span>
          {enterprise.employees ? (
            <span className="tabular-nums">{enterprise.employees} employes</span>
          ) : null}
          {enterprise.revenue ? (
            <span className="tabular-nums">CA : {enterprise.revenue}</span>
          ) : null}
        </div>
      </div>

      {/* Fleche */}
      {detailHref ? (
        <svg
          aria-hidden
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="shrink-0 self-center text-gray-400 group-hover:text-gold transition-colors"
        >
          <path
            d="M2 7h10m0 0L8 3m4 4L8 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </article>
  );

  if (!detailHref) return inner;
  return (
    <Link
      href={detailHref}
      className="block focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2"
      aria-label={`Lire le dossier complet de ${enterprise.name}`}
    >
      {inner}
    </Link>
  );
}
