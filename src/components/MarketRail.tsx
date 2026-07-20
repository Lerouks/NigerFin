'use client';

import { useMarketData } from '@/hooks/useMarketData';

/**
 * RAIL DE DONNEES de l'accueil.
 *
 * C'est, par decision de design, la SEULE surface noire permanente du site : le
 * noir est reserve aux chiffres. Le menu, les hero de rubrique et les CTA sont
 * repasses sur fond clair ; ce rail reste sombre parce qu'il ne contient QUE des
 * chiffres.
 *
 * Il remplace l'ancien ticker qui defilait en boucle automatiquement
 * (animate-marquee + tableau double). Un defilement automatique est un motif de
 * chaine d'information continue, illisible et impossible a parcourir au doigt.
 * Ici :
 *   - RAIL FIXE, aucune animation automatique (donc prefers-reduced-motion est
 *     respecte par construction) ;
 *   - feuilletable au doigt sur mobile via scroll-snap horizontal ;
 *   - chaque valeur porte sa DATE de cotation, conformement a la regle « chaque
 *     chiffre porte sa source et sa date » ;
 *   - une valeur absente s'affiche « indisponible », jamais 0 ni une invention.
 */
export function MarketRail() {
  const { items, isLoading } = useMarketData();

  if (isLoading && items.length === 0) {
    return (
      <div className="flex-1 min-w-0 flex items-center gap-6 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="inline-flex items-center gap-2 shrink-0">
            <span className="h-3 w-12 bg-white/10 rounded-sm animate-pulse" />
            <span className="h-3 w-16 bg-white/10 rounded-sm animate-pulse" />
          </span>
        ))}
      </div>
    );
  }

  if (items.length === 0) return null;

  const dateCourte = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div
      className="flex-1 min-w-0 flex items-stretch gap-0 overflow-x-auto snap-x snap-mandatory scrollbar-thin"
      role="list"
      aria-label="Indicateurs de marché"
    >
      {items.map((item) => {
        const jour = dateCourte(item.updatedAt);
        const indispo = item.value === null || !Number.isFinite(item.value);
        return (
          <div
            key={item.id}
            role="listitem"
            className="snap-start shrink-0 flex items-center gap-2 px-4 first:pl-0 border-r border-white/10 last:border-r-0"
          >
            <span className="text-white/50 text-[11px] font-medium">{item.symbol}</span>
            {indispo ? (
              <span className="text-white/40 text-[11px]" title="Donnée indisponible">
                indisponible
              </span>
            ) : (
              <>
                <span className="text-white/90 text-[12px] tabular-nums">
                  {(item.value as number).toLocaleString('fr-FR')}
                </span>
                {item.symbol === 'EUR/XOF' ? (
                  <span className="text-white/30 text-[10px]">fixe</span>
                ) : item.changePercent === null ? (
                  <span className="text-white/30 text-[10px]" title="Variation non disponible">
                    &ndash;
                  </span>
                ) : (
                  <span
                    className={`text-[10px] tabular-nums ${
                      item.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {item.changePercent >= 0 ? '+' : ''}
                    {item.changePercent.toFixed(2).replace('.', ',')}&nbsp;%
                  </span>
                )}
              </>
            )}
            {jour && (
              <span className="font-mono text-white/25 text-[9px] tabular-nums">{jour}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
