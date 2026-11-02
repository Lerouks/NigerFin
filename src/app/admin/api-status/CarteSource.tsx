import { CheckCircle, XCircle, Clock, Database, Unplug } from 'lucide-react';

export interface ServiceStatus {
  /**
   * 'not_connected' : source non branchée, ni saine ni en panne (voir
   * src/lib/services/source-non-branchee.ts). Elle ne compte pas dans le
   * statut global.
   */
  status: 'ok' | 'error' | 'not_connected';
  responseTime: number;
  error?: string;
  /** Pourquoi la source n'est pas branchée, pour 'not_connected' seulement. */
  reason?: string;
  successRate24h: number | null;
  lastSuccessful: string | null;
  cacheEntries: number;
}

interface CarteSourceProps {
  label: { name: string; description: string };
  service: ServiceStatus;
}

/** Carte d'une source de données dans le statut des API. */
export function CarteSource({ label, service }: CarteSourceProps) {
  const isOk = service.status === 'ok';
  // Une source non branchée n'est pas appelée : ni temps de réponse, ni taux de
  // succès à afficher, et surtout pas le rouge d'une panne.
  const nonBranchee = service.status === 'not_connected';

  return (
    <div className="bg-white rounded-xl border border-black/6 p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            {isOk ? (
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            ) : nonBranchee ? (
              <Unplug className="w-4 h-4 text-gray-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <h3 className="text-[15px] font-semibold">{label.name}</h3>
          </div>
          <p className="text-[12px] text-gray-500 mt-0.5 ml-6">{label.description}</p>
        </div>
        <span className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full ${
          isOk
            ? 'bg-emerald-50 text-emerald-600'
            : nonBranchee
              ? 'bg-gray-100 text-gray-600'
              : 'bg-red-50 text-red-600'
        }`}>
          {isOk ? 'OK' : nonBranchee ? 'Non branchée' : 'Erreur'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {/* Response time */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] text-gray-500">Temps</span>
          </div>
          <p className="text-[14px] font-semibold tabular-nums">
            {nonBranchee ? '-' : `${service.responseTime}ms`}
          </p>
        </div>

        {/* Success rate */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] text-gray-500">24h</span>
          </div>
          <p className={`text-[14px] font-semibold tabular-nums ${
            !nonBranchee && service.successRate24h !== null && service.successRate24h >= 90
              ? 'text-emerald-600'
              : !nonBranchee && service.successRate24h !== null && service.successRate24h >= 50
                ? 'text-amber-500'
                : 'text-gray-500'
          }`}>
            {!nonBranchee && service.successRate24h !== null ? `${service.successRate24h}%` : '-'}
          </p>
        </div>

        {/* Cache entries */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Database className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] text-gray-500">Cache</span>
          </div>
          <p className="text-[14px] font-semibold tabular-nums">
            {service.cacheEntries}
          </p>
        </div>
      </div>

      {/* Last successful fetch */}
      {service.lastSuccessful && (
        <p className="text-[10px] text-gray-500 mt-3 pt-2 border-t border-black/4">
          Dernier succès : {new Date(service.lastSuccessful).toLocaleString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </p>
      )}

      {/* Why the source is not connected */}
      {nonBranchee && service.reason && (
        <p className="text-[11px] text-gray-600 mt-2 bg-gray-50 px-3 py-1.5 rounded-lg">
          {service.reason}
        </p>
      )}

      {/* Error message */}
      {service.error && (
        <p className="text-[11px] text-red-500 mt-2 bg-red-50 px-3 py-1.5 rounded-lg">
          {service.error}
        </p>
      )}
    </div>
  );
}
