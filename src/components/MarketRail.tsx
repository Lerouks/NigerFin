'use client';

import { useCoursDuJour } from '@/hooks/useCoursDuJour';

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
 *   - une valeur absente n'est pas affichée, jamais 0 ni une invention.
 *
 * Depuis le 25/11/2026, il montre les cours du jour de la page Finance (mêmes
 * sources, mêmes chiffres), et non plus l'ancienne table market_data.
 */
export function MarketRail() {
  const { cours, isLoading } = useCoursDuJour();

  if (isLoading && cours.length === 0) {
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

  // Comme la page Finance : rien plutôt que l'euro seul.
  if (cours.length < 2) return null;

  const dateCourte = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(`${iso}T12:00:00Z`);
    return isNaN(d.getTime()) ? null : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
  };

  return (
    <div
      className="flex-1 min-w-0 flex items-stretch gap-0 overflow-x-auto snap-x snap-mandatory scrollbar-thin"
      role="list"
      aria-label="Les cours du jour"
    >
      {cours.map((c) => {
        const jour = dateCourte(c.date);
        return (
          <div
            key={c.cle}
            role="listitem"
            className="snap-start shrink-0 flex items-center gap-2 px-4 first:pl-0 border-r border-white/10 last:border-r-0"
          >
            <span className="text-white/50 text-[11px] font-medium">{c.libelle}</span>
            <span className="text-white/90 text-[12px] tabular-nums">
              {c.valeur.toLocaleString('fr-FR', { minimumFractionDigits: c.decimales, maximumFractionDigits: c.decimales })}
              {'\u00a0'}
              {c.unite}
            </span>
            {c.mention ? (
              <span className="text-white/30 text-[10px]">{c.mention}</span>
            ) : c.variation === null ? null : (
              <span className={`text-[10px] tabular-nums ${c.variation >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {c.variation >= 0 ? '+' : '\u2212'}
                {Math.abs(c.variation).toFixed(2).replace('.', ',')}
                {'\u00a0'}%
              </span>
            )}
            {jour && <span className="font-mono text-white/25 text-[9px] tabular-nums">{jour}</span>}
          </div>
        );
      })}
    </div>
  );
}
