'use client';

import { useState, useEffect, useCallback } from 'react';
import { appelAdmin } from '@/app/admin/lib/appel-admin';
import { EtatListe } from '@/app/admin/lib/EtatListe';
import { auteurDeLaLigne, type AuteurDuJournal } from '@/app/admin/lib/auteur-du-journal';

export interface AuditEntry extends AuteurDuJournal {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
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

      {!chargement && !erreur && auditLog.length > 0 && <ListeDuJournal lignes={auditLog} />}
    </div>
  );
}

/**
 * Les lignes du journal. Sous 1280 px, une action par bloc empilé : le tableau
 * de cinq colonnes mesure 900 px, et avec le menu latéral du cockpit (256 px)
 * il sortait de l'écran, coupé sans défilement possible (contrôle du
 * 25/11/2026). Le détail passe à la ligne n'importe où : un texte insécable
 * élargirait toute la page.
 */
export function ListeDuJournal({ lignes }: { lignes: AuditEntry[] }) {
  return (
    <div className="bg-white rounded-xl border border-black/6 overflow-hidden">
      <ul className="xl:hidden">
        {lignes.map((entry) => (
          <li key={entry.id} className="border-b border-black/3 last:border-0 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
              <AuditActionBadge action={entry.action} />
              <span className="text-[12px] text-gray-500 whitespace-nowrap">
                {new Date(entry.created_at).toLocaleString('fr-FR')}
              </span>
            </div>
            <p className="mt-2 text-[12px] [overflow-wrap:anywhere]">{auteurDeLaLigne(entry)}</p>
            <p className="mt-0.5 line-clamp-2 text-[12px] text-gray-500 [overflow-wrap:anywhere]">
              <span className="text-gray-600">{entry.entity_type}</span>{' '}
              <span className="font-mono">{JSON.stringify(entry.details)}</span>
            </p>
          </li>
        ))}
      </ul>
      <table className="hidden xl:table w-full">
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
          {lignes.map((entry) => (
            <tr key={entry.id} className="border-b border-black/3 last:border-0">
              <td className="px-4 py-3 text-[12px] text-gray-500 whitespace-nowrap">
                {new Date(entry.created_at).toLocaleString('fr-FR')}
              </td>
              <td className="px-4 py-3 text-[12px]">
                {auteurDeLaLigne(entry)}
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
    ipaymoney_payment_verified: 'bg-emerald-100 text-emerald-700',
    ipaymoney_payment_failed: 'bg-red-100 text-red-700',
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
    ipaymoney_payment_verified: 'Paiement iPayMoney validé',
    ipaymoney_payment_failed: 'Paiement iPayMoney refusé',
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
