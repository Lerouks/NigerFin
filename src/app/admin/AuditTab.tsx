'use client';

import { useState, useEffect, useCallback } from 'react';
import { appelAdmin } from '@/app/admin/lib/appel-admin';
import { EtatListe } from '@/app/admin/lib/EtatListe';

interface AuditEntry {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  user_profiles?: { email: string; full_name: string };
}

/** Ce que la route /api/admin/audit renvoie. */
interface AuditResponse {
  data: AuditEntry[];
  total: number;
}

export function AuditTab() {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [horsLigne, setHorsLigne] = useState(false);

  const fetchAuditLog = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    setHorsLigne(false);

    const resultat = await appelAdmin<AuditResponse>('/api/admin/audit');

    if (!resultat.ok) {
      // Sans cette branche, l'echec etait avale par un catch vide et l'ecran
      // affichait « Aucune action enregistrée » comme si le journal etait vide.
      setErreur(resultat.message);
      setHorsLigne(resultat.horsLigne);
      setChargement(false);
      return;
    }

    const donnees = resultat.donnees;
    if (!donnees || !Array.isArray(donnees.data)) {
      setErreur("Le serveur n'a pas renvoyé le journal des actions. Réessayez dans un instant.");
      setChargement(false);
      return;
    }

    setAuditLog(donnees.data);
    setChargement(false);
  }, []);

  useEffect(() => { fetchAuditLog(); }, [fetchAuditLog]);

  return (
    <div className="space-y-4">
      {/* Chargement, échec de chargement, ou journal vraiment vide */}
      <EtatListe
        chargement={chargement}
        erreur={erreur}
        horsLigne={horsLigne}
        vide={auditLog.length === 0}
        texteVide="Aucune action enregistrée"
        onReessayer={fetchAuditLog}
      />

      {!chargement && !erreur && auditLog.length > 0 && (
        <div className="bg-white rounded-xl border border-black/6 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/4">
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 px-4 py-3">Date</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 px-4 py-3">Admin</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 px-4 py-3">Action</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 px-4 py-3">Type</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 px-4 py-3">Détails</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((entry) => (
                <tr key={entry.id} className="border-b border-black/3 last:border-0">
                  <td className="px-4 py-3 text-[12px] text-gray-500 whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-[12px]">
                    {entry.user_profiles?.email || entry.admin_id.slice(0, 8) + '...'}
                  </td>
                  <td className="px-4 py-3">
                    <AuditActionBadge action={entry.action} />
                  </td>
                  <td className="px-4 py-3 text-[12px] text-gray-600">{entry.entity_type}</td>
                  <td className="px-4 py-3 text-[12px] text-gray-500 font-mono max-w-xs truncate">
                    {JSON.stringify(entry.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AuditActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    verify_payment: 'bg-emerald-100 text-emerald-700',
    reject_payment: 'bg-red-100 text-red-700',
    change_role: 'bg-blue-100 text-blue-700',
    block_user: 'bg-red-100 text-red-700',
    unblock_user: 'bg-emerald-100 text-emerald-700',
    activate_subscription: 'bg-purple-100 text-purple-700',
    deactivate_subscription: 'bg-gray-100 text-gray-700',
    subscription_expired: 'bg-orange-100 text-orange-700',
    update_price: 'bg-amber-100 text-amber-700',
    export_csv: 'bg-blue-100 text-blue-700',
    export_xlsx: 'bg-blue-100 text-blue-700',
    'corbeille.mise': 'bg-gray-100 text-gray-700',
    'corbeille.restauration': 'bg-emerald-100 text-emerald-700',
    'corbeille.suppression_definitive': 'bg-red-100 text-red-700',
  };

  const labels: Record<string, string> = {
    verify_payment: 'Paiement validé',
    reject_payment: 'Paiement rejeté',
    change_role: 'Rôle modifié',
    block_user: 'Utilisateur bloqué',
    unblock_user: 'Utilisateur débloqué',
    activate_subscription: 'Abo activé',
    deactivate_subscription: 'Abo désactivé',
    subscription_expired: 'Abo expiré (auto)',
    update_price: 'Prix modifié',
    export_csv: 'Export CSV',
    export_xlsx: 'Export Excel',
    'corbeille.mise': 'Mis à la corbeille',
    'corbeille.restauration': 'Restauré',
    'corbeille.suppression_definitive': 'Supprimé définitivement',
  };

  return (
    <span className={`text-[11px] px-2 py-1 rounded-sm ${colors[action] || 'bg-gray-100 text-gray-600'}`}>
      {labels[action] || action}
    </span>
  );
}
