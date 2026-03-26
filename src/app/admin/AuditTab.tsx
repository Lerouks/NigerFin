'use client';

import { useState, useEffect, useCallback } from 'react';

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

export function AuditTab() {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  const fetchAuditLog = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/audit');
      const data = await res.json();
      setAuditLog(data.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchAuditLog(); }, [fetchAuditLog]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/[0.04]">
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Date</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Admin</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Action</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Type</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Détails</th>
            </tr>
          </thead>
          <tbody>
            {auditLog.map((entry) => (
              <tr key={entry.id} className="border-b border-black/[0.03] last:border-0">
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
        {auditLog.length === 0 && (
          <p className="text-center py-8 text-sm text-gray-400">Aucune action enregistrée</p>
        )}
      </div>
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
  };

  return (
    <span className={`text-[11px] px-2 py-1 rounded ${colors[action] || 'bg-gray-100 text-gray-600'}`}>
      {labels[action] || action}
    </span>
  );
}
