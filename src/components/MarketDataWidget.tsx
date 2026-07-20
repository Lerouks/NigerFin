'use client';

import { useMemo } from 'react';
import { useMarketData, groupByType, type MarketDataType } from '@/hooks/useMarketData';
import { VariationBadge } from '@/components/data/VariationBadge';

const TYPE_LABELS: Record<MarketDataType, string> = {
  currency: 'Devises',
  commodity: 'Matières premières',
  index: 'Indices',
  crypto: 'Cryptomonnaies',
};

const TYPE_ORDER: MarketDataType[] = ['currency', 'commodity', 'index', 'crypto'];

/**
 * Compact market data sidebar widget.
 * Reads from admin-managed Supabase market_data table.
 */
export function MarketDataWidget() {
  const { items, isLoading } = useMarketData();

  const groupedData = useMemo(() => groupByType(items), [items]);

  const lastUpdated = useMemo(() => {
    let latest: string | null = null;
    for (const item of items) {
      if (item.updatedAt && (!latest || item.updatedAt > latest)) {
        latest = item.updatedAt;
      }
    }
    return latest;
  }, [items]);

  // Aucune donnee et plus rien en cours de chargement : le bloc ne s'affiche pas
  // du tout. Un cadre « Marches » vide, ou pire accompagne d'une phrase
  // rassurante sans le moindre chiffre, laisserait croire a une panne d'affichage
  // alors qu'il s'agit d'une absence assumee de donnee.
  if (!isLoading && items.length === 0) {
    return null;
  }

  if (isLoading && items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-black/6 sticky top-[calc(var(--header-height)+1.5rem)] overflow-hidden">
        <div className="border-b border-black/5 px-5 py-4">
          <h3 className="text-[15px] font-semibold">Marchés</h3>
        </div>
        <div className="p-5 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center py-1.5">
              <div className="h-3 w-24 bg-gray-100 rounded-sm animate-pulse" />
              <div className="h-3 w-16 bg-gray-100 rounded-sm animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-black/6 sticky top-[calc(var(--header-height)+1.5rem)] overflow-hidden">
      <div className="border-b border-black/5 px-5 py-4">
        <h3 className="text-[15px] font-semibold">Marchés</h3>
      </div>
      <div className="p-5 space-y-5">
        {TYPE_ORDER.map((type) => {
          const group = groupedData[type];
          if (!group || group.length === 0) return null;

          return (
            <div key={type}>
              <h4 className="text-[11px] uppercase tracking-[0.14em] font-semibold text-gray-500 mb-2">
                {TYPE_LABELS[type]}
              </h4>
              {/* Lignes separees par un filet de 1 px (grammaire anti-carte). */}
              <div className="divide-y divide-black/6">
                {group.map((item) => {
                  const indispo = item.value === null || !Number.isFinite(item.value);
                  return (
                    <div
                      key={item.id}
                      className="flex justify-between items-center gap-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium truncate">{item.name}</div>
                        <div className="font-mono text-[10px] text-gray-400 uppercase tracking-[0.04em]">
                          {item.symbol}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[13px] tabular-nums font-medium">
                          {indispo ? (
                            <span className="text-gray-400 font-normal">indisponible</span>
                          ) : (
                            <>
                              {(item.value as number).toLocaleString('fr-FR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                              {item.unit && (
                                <span className="text-[10px] text-gray-500 ml-0.5">{item.unit}</span>
                              )}
                            </>
                          )}
                        </div>
                        {!indispo && (
                          <div className="flex justify-end">
                            {item.symbol === 'EUR/XOF' ? (
                              <span className="text-[10px] text-gray-500">Taux fixe</span>
                            ) : (
                              <VariationBadge value={item.changePercent} pill />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {/*
        La condition etait inversee : la phrase rassurante « Donnees gerees par
        l'equipe NFI Report » s'affichait TOUJOURS, et la date seulement si elle
        existait. En mode repli, la caution editoriale restait donc seule, sans
        aucune date, ce qui est la pire combinaison possible. C'est la date qui
        engage, pas la formule : elle passe en premier et commande le bloc.
      */}
      <div className="border-t border-black/4 px-5 py-3 bg-background rounded-b-xl space-y-0.5">
        {lastUpdated ? (
          <>
            <p className="text-[10px] text-gray-500 text-center tabular-nums">
              Dernière mise à jour :{' '}
              {new Date(lastUpdated).toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="text-[10px] text-gray-500 text-center">
              Données gérées par l&apos;équipe NFI Report
            </p>
          </>
        ) : (
          <p className="text-[10px] text-gray-500 text-center">
            Date de mise à jour non disponible
          </p>
        )}
      </div>
    </div>
  );
}
