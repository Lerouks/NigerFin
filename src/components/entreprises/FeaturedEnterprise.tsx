import Image from 'next/image';
import Link from 'next/link';
import type { StrategicEnterprise } from '@/lib/strategic-enterprises';
import { parseOwnership, getMajorityCountry } from '@/lib/ownership';
import { CountryFlag } from './CountryFlag';

interface FeaturedEnterpriseProps {
  enterprise: StrategicEnterprise;
  rank: number;
  sectorIndex: number;
}

/**
 * Vedette format magazine du mois sur /entreprises.
 * Grid 2 colonnes desktop (image 1:1 a gauche + texte a droite), pile mobile.
 * Kicker (rang + secteur), nom Inter Black 40px, paragraphe edito,
 * 2-3 stats sobres (fondation, employes, siege), CTA gold.
 */
export function FeaturedEnterprise({
  enterprise,
  rank,
  sectorIndex,
}: FeaturedEnterpriseProps) {
  const ownership = parseOwnership(enterprise.ownership);
  const majorityCountry = getMajorityCountry(enterprise.ownership);
  const hasImage = !!enterprise.image_url;
  const hasLogo = !!enterprise.logo_url;
  const detailHref = enterprise.slug ? `/entreprises/${enterprise.slug}` : null;

  return (
    <article className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-8 lg:gap-12 items-center">
      {/* Image */}
      <div className={'relative w-full overflow-hidden ' + (hasImage ? 'aspect-[4/5]' : 'aspect-[4/5] bg-secondary')}>
        {hasImage ? (
          <Image
            src={enterprise.image_url!}
            alt={`${enterprise.name}, illustration`}
            fill
            sizes="(min-width: 1024px) 480px, 100vw"
            className="object-cover"
            priority
          />
        ) : hasLogo ? (
          <div className="absolute inset-0 flex flex-col items-center justify-between p-10 bg-gradient-to-br from-secondary to-muted">
            <span className="self-start text-[10px] uppercase tracking-[0.22em] text-gray-500 font-semibold">
              Acteur strategique
            </span>
            <Image
              src={enterprise.logo_url!}
              alt={`Logo ${enterprise.name}`}
              width={220}
              height={220}
              className="max-h-[55%] max-w-[70%] object-contain"
              priority
            />
            <span className="self-end text-[11px] uppercase tracking-wider text-gray-400 font-medium">
              {enterprise.sector}
            </span>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground">
            <span className="text-white font-black text-[clamp(6rem,15vw,10rem)] leading-none opacity-90">
              {enterprise.name.charAt(0)}
            </span>
          </div>
        )}
        {/* Filet or sur la gauche en signal vedette */}
        <span
          aria-hidden
          className="absolute top-0 left-0 h-full w-[3px] bg-gold"
        />
      </div>

      {/* Texte */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="font-mono text-[13px] tracking-tight text-gold">
            {String(rank).padStart(2, '0')} / 08
          </span>
          <span className="h-px w-6 bg-gray-300" />
          <span className="text-[11px] uppercase tracking-[0.22em] font-semibold text-gray-500">
            Vedette &middot; {enterprise.sector}
          </span>
        </div>
        <h2 className="font-black tracking-tight leading-[1.1] text-[clamp(2rem,4.5vw,3rem)] text-foreground">
          {enterprise.name}
        </h2>
        {enterprise.full_name && enterprise.full_name !== enterprise.name ? (
          <p className="mt-2 text-[15px] font-medium text-gray-500 italic">
            {enterprise.full_name}
          </p>
        ) : null}
        <p className="mt-5 text-[17px] leading-relaxed text-foreground/85 line-clamp-5">
          {enterprise.detailed_description || enterprise.description}
        </p>

        {/* Mini-stats */}
        <dl className="mt-7 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
          {enterprise.founded_year ? (
            <Stat label="Fondee" value={String(enterprise.founded_year)} />
          ) : null}
          {enterprise.headquarters ? (
            <Stat label="Siege" value={enterprise.headquarters} />
          ) : null}
          {enterprise.employees ? (
            <Stat label="Effectif" value={enterprise.employees} />
          ) : null}
          {enterprise.revenue ? (
            <Stat label="Chiffre d&apos;affaires" value={enterprise.revenue} />
          ) : null}
        </dl>

        {/* Actionnariat */}
        {ownership.length > 0 ? (
          <div className="mt-6 pt-5 border-t border-black/8">
            <div className="text-[10px] uppercase tracking-[0.22em] text-gray-500 font-semibold mb-3">
              Actionnariat principal
            </div>
            <ul className="space-y-1.5">
              {ownership.map((share, idx) => (
                <li
                  key={`${share.label}-${idx}`}
                  className="flex items-center gap-2 text-[14px] text-foreground/85"
                >
                  <CountryFlag country={share.country} size={18} monochrome />
                  <span className="font-medium">{share.label}</span>
                  {share.share != null ? (
                    <span className="text-gray-500 tabular-nums">
                      {share.share}%
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* CTA */}
        {detailHref ? (
          <div className="mt-8">
            <Link
              href={detailHref}
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-gold hover:text-foreground transition-colors border-b border-gold/40 hover:border-foreground pb-0.5"
            >
              Lire le dossier complet
              <svg
                aria-hidden
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="M2 7h10m0 0L8 3m4 4L8 11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        ) : null}
        {/* Indicateur drapeau majoritaire (visuel rapide) */}
        <div className="sr-only">
          Actionnaire majoritaire : {majorityCountry}, secteur index{' '}
          {sectorIndex}
        </div>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
        {label}
      </dt>
      <dd className="mt-1 text-[15px] font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}
