import type { AggregatedStat } from '@/lib/strategic-enterprises';

interface StatsBandProps {
  stats: AggregatedStat[];
  lastUpdated: string;
}

/**
 * Bandeau de stats cumulees affiche sous le hero de /entreprises.
 * Format magazine economique : chiffre Inter Black tres gros + label gris,
 * separateurs verticaux discrets. Sobriete graphique stricte.
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-x-2 gap-y-6 md:divide-x md:divide-black/10">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="px-2 md:px-6 first:pl-0 md:first:pl-0 md:last:pr-0"
            >
              <div className="text-[clamp(1.75rem,4vw,2.5rem)] font-black tracking-tight text-foreground leading-none">
                {stat.value}
              </div>
              <div className="mt-2 text-[12px] md:text-[13px] font-medium text-gray-600 leading-snug">
                {stat.label}
              </div>
              {stat.source ? (
                <div className="mt-1 text-[10px] uppercase tracking-wider text-gray-400">
                  {stat.source}
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <p className="mt-6 text-[11px] uppercase tracking-wider text-gray-400">
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
