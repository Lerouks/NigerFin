import type { StrategicEnterprise } from '@/lib/strategic-enterprises';
import { getSectorAnchor } from '@/lib/strategic-enterprises';
import { EnterpriseListItem } from './EnterpriseListItem';

interface EnterpriseSectorBlockProps {
  sector: string;
  enterprises: StrategicEnterprise[];
  startRank: number;
  intro?: string;
}

/**
 * Section secteur : H2 + intro editoriale (optionnelle) + liste verticale.
 * ID d'ancre = getSectorAnchor(sector) (matche SectorTOC pour le smooth scroll).
 */
export function EnterpriseSectorBlock({
  sector,
  enterprises,
  startRank,
  intro,
}: EnterpriseSectorBlockProps) {
  if (enterprises.length === 0) return null;

  return (
    <section
      id={getSectorAnchor(sector)}
      aria-labelledby={`${getSectorAnchor(sector)}-title`}
      className="scroll-mt-24"
    >
      <header className="mb-2 md:mb-4 pt-10 md:pt-14 border-t border-black/10">
        <div className="flex items-baseline gap-3 mb-1">
          <span className="font-mono text-[12px] font-bold tracking-tight text-foreground/70">
            {String(enterprises.length).padStart(2, '0')}
          </span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-gray-600 font-semibold">
            {enterprises.length === 1 ? 'Entreprise' : 'Entreprises'}
          </span>
        </div>
        <h2
          id={`${getSectorAnchor(sector)}-title`}
          className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-foreground leading-tight"
        >
          {sector}
        </h2>
        {intro ? (
          <p className="mt-3 text-[15px] leading-relaxed text-gray-600 max-w-2xl">
            {intro}
          </p>
        ) : null}
      </header>
      <div>
        {enterprises.map((enterprise, idx) => (
          <EnterpriseListItem
            key={enterprise.id}
            enterprise={enterprise}
            rank={startRank + idx}
          />
        ))}
      </div>
    </section>
  );
}
