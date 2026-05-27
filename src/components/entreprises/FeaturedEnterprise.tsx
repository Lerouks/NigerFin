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
 * Filet or signature au-dessus (vedette-iser), ratio 1/3 image + 2/3 contenu
 * desktop. Nom Inter Black 48px aligne haut du logo. CTA primaire solide noir
 * avec hover gold (vraie hierarchie d'action, pas un lien souligne discret).
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
    <article className="relative">
      {/* Filet or signature au-dessus de la card pour signaler "vedette" */}
      <div aria-hidden className="h-[3px] w-24 bg-gold mb-6 md:mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-8 lg:gap-12 items-start">
        {/* Image / logo placeholder */}
        <div
          className={
            'relative w-full overflow-hidden ' +
            (hasImage ? 'aspect-[4/5]' : 'aspect-[4/5] bg-secondary')
          }
        >
          {hasImage ? (
            <Image
              src={enterprise.image_url!}
              alt={`${enterprise.name}, illustration`}
              fill
              sizes="(min-width: 1024px) 380px, 100vw"
              className="object-cover"
              priority
            />
          ) : hasLogo ? (
            <div className="absolute inset-0 flex flex-col items-center justify-between p-8 bg-gradient-to-br from-secondary to-muted">
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
              <span className="self-end text-[11px] uppercase tracking-wider text-gray-500 font-medium">
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
        </div>

        {/* Contenu */}
        <div>
          {/* Kicker rang + secteur, aligne sur le haut du logo */}
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-[13px] font-bold tracking-tight text-foreground/70">
              {String(rank).padStart(2, '0')} / 08
            </span>
            <span aria-hidden className="h-px w-6 bg-gold" />
            <span className="text-[11px] uppercase tracking-[0.22em] font-semibold text-gray-600">
              Vedette &middot; {enterprise.sector}
            </span>
          </div>

          {/* Nom enorme : 48-72px Black */}
          <h2 className="font-black tracking-tight leading-[1.02] text-[clamp(2.5rem,5.5vw,3.75rem)] text-foreground">
            {enterprise.name}
          </h2>
          {enterprise.full_name && enterprise.full_name !== enterprise.name ? (
            <p className="mt-2 text-[15px] md:text-[16px] font-medium text-gray-600 italic">
              {enterprise.full_name}
            </p>
          ) : null}

          <p className="mt-6 text-[17px] md:text-[18px] leading-relaxed text-foreground/85 line-clamp-5">
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
              <div className="text-[10px] uppercase tracking-[0.22em] text-gray-600 font-bold mb-3">
                Actionnariat principal
              </div>
              <ul className="space-y-2">
                {ownership.map((share, idx) => (
                  <li
                    key={`${share.label}-${idx}`}
                    className="flex items-center gap-2.5 text-[14px] text-foreground/85"
                  >
                    <CountryFlag country={share.country} size={22} />
                    <span className="font-medium">{share.label}</span>
                    {share.share != null ? (
                      <span className="text-gray-600 tabular-nums">
                        {share.share}%
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* CTA primaire bouton noir solide (hover gold) */}
          {detailHref ? (
            <div className="mt-8">
              <Link
                href={detailHref}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 text-[14px] font-bold uppercase tracking-[0.14em] text-white bg-foreground hover:bg-gold hover:text-foreground transition-colors rounded-full"
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
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>
          ) : null}

          <div className="sr-only">
            Actionnaire majoritaire : {majorityCountry}, secteur index{' '}
            {sectorIndex}
          </div>
        </div>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">
        {label}
      </dt>
      <dd className="mt-1 text-[15px] font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}
