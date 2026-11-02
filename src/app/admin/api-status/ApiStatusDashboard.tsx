'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { appelAdmin } from '@/app/admin/lib/appel-admin';
import { EtatListe } from '@/app/admin/lib/EtatListe';
import { CarteSource, type ServiceStatus } from './CarteSource';

interface HealthResponse {
  /** Calculé sur les seules sources branchées : une source non branchée n'est pas une panne. */
  status: 'healthy' | 'degraded' | 'down';
  /** healthy et total ne comptent que les sources branchées. */
  summary: { healthy: number; total: number; notConnected?: number; timestamp: string };
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
  const [erreur, setErreur] = useState<string | null>(null);
  const [horsLigne, setHorsLigne] = useState(false);

  const fetchHealth = useCallback(async () => {
    const resultat = await appelAdmin<HealthResponse>('/api/health');

    if (resultat.ok && resultat.donnees && resultat.donnees.services && resultat.donnees.summary) {
      setHealth(resultat.donnees);
      setErreur(null);
      setHorsLigne(false);
    } else if (resultat.ok) {
      // Le serveur a répondu, mais sans le détail des services : c'est la
      // réponse réduite servie aux visiteurs que le serveur ne reconnaît pas
      // comme administrateur.
      setErreur("Le serveur n'a pas renvoyé le détail des services. Votre session a peut-être expiré : reconnectez-vous, puis réessayez.");
      setHorsLigne(false);
    } else {
      setErreur(resultat.message);
      setHorsLigne(resultat.horsLigne);
    }

    setLoading(false);
    setRefreshing(false);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  const nonBranchees = health?.summary.notConnected ?? 0;
  const statusColor = health?.status === 'healthy' ? 'text-emerald-600' : health?.status === 'degraded' ? 'text-amber-500' : 'text-red-500';
  const statusBg = health?.status === 'healthy' ? 'bg-emerald-50' : health?.status === 'degraded' ? 'bg-amber-50' : 'bg-red-50';
  const StatusIcon = health?.status === 'healthy' ? CheckCircle : health?.status === 'degraded' ? AlertTriangle : XCircle;

  return (
    <div className="min-h-screen bg-background">
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

        {/* Chargement, échec de chargement, ou aucun service renvoyé */}
        <EtatListe
          chargement={loading}
          erreur={erreur}
          horsLigne={horsLigne}
          vide={!health}
          texteVide="Aucun service n'a été renvoyé par le serveur."
          onReessayer={handleRefresh}
        />

        {/* Global Status */}
        {health && !erreur && (
          <div className={`${statusBg} rounded-xl border border-black/6 p-6 mb-8`}>
            <div className="flex items-center gap-3">
              <StatusIcon className={`w-6 h-6 ${statusColor}`} />
              <div>
                <p className={`text-lg font-semibold ${statusColor}`}>
                  {health.status === 'healthy'
                    ? (nonBranchees > 0 ? 'Toutes les sources branchées sont opérationnelles' : 'Tous les services opérationnels')
                    : health.status === 'degraded' ? 'Services partiellement dégradés' :
                   'Services hors ligne'}
                </p>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  {health.summary.healthy}/{health.summary.total} services actifs &middot;
                  {nonBranchees > 0 && ` ${nonBranchees} non ${nonBranchees > 1 ? 'branchées' : 'branchée'}\u00a0\u00b7`}
                  {' '}Dernière vérification : {new Date(health.summary.timestamp).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Services Grid */}
        {health && !erreur && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(health.services).map(([key, service]) => (
              <CarteSource
                key={key}
                label={SERVICE_LABELS[key] || { name: key, description: '' }}
                service={service}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
