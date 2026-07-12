import type { AggregatedStat } from '@/lib/strategic-enterprises';

interface StatsBandProps {
  stats: AggregatedStat[];
  lastUpdated: string;
}

/**
 * Bandeau de stats cumulees affiche sous le hero de /entreprises.
 * Format World Bank country page : chiffres ENORMES Inter Black, filet or
 * signature sous chaque, source en petits caps, padding genereux.
 */
export function StatsBand({ stats, lastUpdated }: StatsBandProps) {
  return (
    <section
      aria-labelledby="atlas-stats-heading"
      className="border-y border-black/8 bg-secondary"
    >
      <h2 id="atlas-stats-heading" className="sr-only">
        Chiffres cles de l&apos;atlas
      </h2>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-12">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col"
            >
              <div className="text-[clamp(2.5rem,5vw,3.5rem)] font-black tracking-tight text-foreground leading-none tabular-nums">
                {stat.value}
              </div>
              <div className="mt-3 text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.14em] text-gray-700 leading-tight">
                {stat.label}
              </div>
              {stat.source ? (
                <div className="mt-2 text-[10px] uppercase tracking-wider text-gray-500 italic">
                  {stat.source}
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <p className="mt-12 pt-6 border-t border-black/8 text-[11px] uppercase tracking-[0.18em] text-gray-500">
          Donnees agregees, derniere mise a jour : {formatDateFr(lastUpdated)}
        </p>
      </div>
    </section>
  );
}

function formatDateFr(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
