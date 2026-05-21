'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock, Database } from 'lucide-react';

interface ServiceStatus {
  status: 'ok' | 'error';
  responseTime: number;
  error?: string;
  successRate24h: number | null;
  lastSuccessful: string | null;
  cacheEntries: number;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  summary: { healthy: number; total: number; timestamp: string };
  services: Record<string, ServiceStatus>;
}

const SERVICE_LABELS: Record<string, { name: string; description: string }> = {
  world_bank: { name: 'Banque mondiale', description: 'PIB, croissance, dette, inflation' },
  imf: { name: 'FMI', description: 'Indicateurs macroéconomiques' },
  frankfurter: { name: 'Frankfurter', description: 'Taux de change EUR (primaire)' },
  exchange_rate_api: { name: 'ExchangeRate-API', description: 'Taux de change (fallback)' },
  rest_countries: { name: 'REST Countries', description: 'Métadonnées pays' },
  ecowas: { name: 'CEDEAO', description: 'Données régionales' },
  brvm: { name: 'BRVM', description: 'Indices et actions boursières' },
  commodities: { name: 'Matières premières', description: 'Pétrole, or, uranium, coton' },
};

export function ApiStatusDashboard() {
  const { userRole } = useAuth();
  const router = useRouter();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (userRole !== 'admin') {
      router.push('/admin');
      return;
    }
    fetchHealth();
  }, [userRole, router, fetchHealth]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHealth();
  };

  if (userRole !== 'admin') return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  const statusColor = health?.status === 'healthy' ? 'text-emerald-600' : health?.status === 'degraded' ? 'text-amber-500' : 'text-red-500';
  const statusBg = health?.status === 'healthy' ? 'bg-emerald-50' : health?.status === 'degraded' ? 'bg-amber-50' : 'bg-red-50';
  const StatusIcon = health?.status === 'healthy' ? CheckCircle : health?.status === 'degraded' ? AlertTriangle : XCircle;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Statut des API</h1>
            <p className="text-[14px] text-gray-500 mt-1">Monitoring des sources de données en temps réel</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#111] text-white rounded-lg text-[14px] font-medium hover:bg-[#222] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
        </div>

        {/* Global Status */}
        {health && (
          <div className={`${statusBg} rounded-xl border border-black/[0.06] p-6 mb-8`}>
            <div className="flex items-center gap-3">
              <StatusIcon className={`w-6 h-6 ${statusColor}`} />
              <div>
                <p className={`text-lg font-semibold ${statusColor}`}>
                  {health.status === 'healthy' ? 'Tous les services opérationnels' :
                   health.status === 'degraded' ? 'Services partiellement dégradés' :
                   'Services hors ligne'}
                </p>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  {health.summary.healthy}/{health.summary.total} services actifs &middot;
                  Dernière vérification : {new Date(health.summary.timestamp).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Services Grid */}
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(health.services).map(([key, service]) => {
              const label = SERVICE_LABELS[key] || { name: key, description: '' };
              const isOk = service.status === 'ok';

              return (
                <div key={key} className="bg-white rounded-xl border border-black/[0.06] p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {isOk ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <h3 className="text-[15px] font-semibold">{label.name}</h3>
                      </div>
                      <p className="text-[12px] text-gray-500 mt-0.5 ml-6">{label.description}</p>
                    </div>
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                      isOk ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {isOk ? 'OK' : 'Erreur'}
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
                        {service.responseTime}ms
                      </p>
                    </div>

                    {/* Success rate */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle className="w-3 h-3 text-gray-500" />
                        <span className="text-[10px] text-gray-500">24h</span>
                      </div>
                      <p className={`text-[14px] font-semibold tabular-nums ${
                        service.successRate24h !== null && service.successRate24h >= 90
                          ? 'text-emerald-600'
                          : service.successRate24h !== null && service.successRate24h >= 50
                            ? 'text-amber-500'
                            : 'text-gray-500'
                      }`}>
                        {service.successRate24h !== null ? `${service.successRate24h}%` : '-'}
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
                    <p className="text-[10px] text-gray-500 mt-3 pt-2 border-t border-black/[0.04]">
                      Dernier succès : {new Date(service.lastSuccessful).toLocaleString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
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
            })}
          </div>
        )}

        {!health && (
          <div className="text-center py-20 text-gray-500">
            Impossible de charger le statut des API.
          </div>
        )}
      </div>
    </div>
  );
}
