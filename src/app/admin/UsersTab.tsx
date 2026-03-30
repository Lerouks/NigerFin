'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Loader2, Search, CheckCircle, CreditCard, ChevronDown, ChevronUp,
  Ban, Unlock, Crown, Calendar,
} from 'lucide-react';

interface UserEntry {
  id: string;
  email: string;
  full_name: string;
  role: string;
  subscription_status: string;
  billing_cycle: string | null;
  blocked: boolean;
  created_at: string;
  subscription_start: string | null;
  subscription_end: string | null;
}

interface UsersTabProps {
  onStatsRefresh: () => void;
}

export function UsersTab({ onStatsRefresh }: UsersTabProps) {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (roleFilter) params.set('role', roleFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      const list = json.data ?? json;
      if (Array.isArray(list)) setUsers(list);
    } catch { /* ignore */ }
    setLoadingData(false);
  }, [searchQuery, roleFilter]);

  useEffect(() => {
    setLoadingData(true);
    const timeout = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeout);
  }, [fetchUsers]);

  const handleUserAction = async (userId: string, action: string, extra?: Record<string, string>) => {
    setProcessingUser(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, ...extra }),
      });
      if (res.ok) {
        await fetchUsers();
        onStatsRefresh();
      }
    } catch { /* ignore */ }
    setProcessingUser(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-black/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-black/[0.06] rounded-lg text-sm focus:outline-none"
        >
          <option value="">Tous les rôles</option>
          <option value="reader">Lecteur</option>
          <option value="premium">Premium</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <p className="text-[12px] text-gray-400">{users.length} utilisateur(s)</p>

      {loadingData ? (
        <div className="text-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.04]">
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Utilisateur</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Rôle</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Statut</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Inscrit le</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  expanded={expandedUser === u.id}
                  processing={processingUser === u.id}
                  onToggle={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                  onAction={(action, extra) => handleUserAction(u.id, action, extra)}
                />
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-center py-8 text-sm text-gray-400">Aucun utilisateur trouvé</p>
          )}
        </div>
      )}
    </div>
  );
}

function UserRow({ user, expanded, processing, onToggle, onAction }: {
  user: UserEntry;
  expanded: boolean;
  processing: boolean;
  onToggle: () => void;
  onAction: (action: string, extra?: Record<string, string>) => void;
}) {
  const [durationMonths, setDurationMonths] = useState('1');
  const [customDays, setCustomDays] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const isActive = user.subscription_status === 'active';

  const getProjectedEnd = () => {
    const end = new Date();
    if (showCustom && customDays) {
      end.setDate(end.getDate() + parseInt(customDays));
    } else {
      end.setMonth(end.getMonth() + parseInt(durationMonths));
    }
    return end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleActivate = async () => {
    const extra: Record<string, string> = { durationMonths };
    if (showCustom && customDays) extra.customDays = customDays;
    onAction('activateSubscription', extra);
    setActionSuccess('premium');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleDeactivate = () => {
    setShowDowngradeConfirm(false);
    onAction('deactivateSubscription');
    setActionSuccess('downgrade');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const statusLabel = isActive ? 'Premium actif' : user.subscription_status === 'expired' ? 'Expiré' : 'Lecteur gratuit';
  const statusColor = isActive ? 'text-emerald-600' : user.subscription_status === 'expired' ? 'text-amber-600' : 'text-gray-400';
  const statusBg = isActive ? 'bg-emerald-50' : user.subscription_status === 'expired' ? 'bg-amber-50' : 'bg-gray-50';

  return (
    <>
      <tr className="border-b border-black/[0.03] last:border-0 hover:bg-gray-50/50 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm font-medium">{user.full_name || '-'}</p>
              <p className="text-[12px] text-gray-400">{user.email}</p>
            </div>
            {user.blocked && (
              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Bloqué</span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`text-[11px] uppercase tracking-wider px-2 py-1 rounded ${
            user.role === 'premium' ? 'bg-amber-100 text-amber-700' :
            user.role === 'admin' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {user.role}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className={`text-[12px] font-medium ${statusColor}`}>{statusLabel}</span>
            {isActive && user.subscription_end && (
              <span className="text-[10px] text-gray-400">
                Exp. {new Date(user.subscription_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-[12px] text-gray-500">
          {new Date(user.created_at).toLocaleDateString('fr-FR')}
        </td>
        <td className="px-4 py-3">
          <button onClick={onToggle} className="text-[12px] text-gray-500 hover:text-black flex items-center gap-1">
            Gérer {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50/80">
          <td colSpan={5} className="px-4 py-5">
            {actionSuccess && (
              <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-lg text-[13px]">
                <CheckCircle className="w-4 h-4" />
                {actionSuccess === 'premium'
                  ? 'Abonnement Premium activé avec succès. Email envoyé.'
                  : 'Abonnement rétrogradé en Lecteur gratuit. Email envoyé.'}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Current status + role management */}
              <div className="space-y-3">
                <div className={`${statusBg} rounded-lg p-4 border border-black/[0.04]`}>
                  <div className="flex items-center gap-2 mb-2">
                    {isActive ? <Crown className="w-4 h-4 text-amber-500" /> : <Users className="w-4 h-4 text-gray-400" />}
                    <span className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Statut actuel</span>
                  </div>
                  <p className={`text-sm font-semibold ${statusColor}`}>{statusLabel}</p>
                  {isActive && user.subscription_start && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[11px] text-gray-500">
                        Début : {new Date(user.subscription_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      {user.subscription_end && (
                        <p className="text-[11px] text-gray-500">
                          Fin : {new Date(user.subscription_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-end gap-2">
                  <div>
                    <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Rôle</label>
                    <select
                      defaultValue={user.role}
                      onChange={(e) => onAction('changeRole', { role: e.target.value })}
                      disabled={processing}
                      className="text-[12px] border border-gray-200 rounded px-2 py-1.5 bg-white"
                    >
                      <option value="reader">Lecteur</option>
                      <option value="premium">Premium</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {user.blocked ? (
                    <button onClick={() => onAction('unblock')} disabled={processing}
                      className="text-[12px] bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded hover:bg-emerald-100 transition-colors disabled:opacity-50 flex items-center gap-1">
                      <Unlock className="w-3 h-3" /> Débloquer
                    </button>
                  ) : (
                    <button onClick={() => onAction('block')} disabled={processing}
                      className="text-[12px] bg-red-50 text-red-700 px-3 py-1.5 rounded hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-1">
                      <Ban className="w-3 h-3" /> Bloquer
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Subscription management */}
              <div className="bg-white rounded-lg border border-black/[0.06] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Gestion abonnement</span>
                </div>

                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Nouveau statut</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { if (isActive) setShowDowngradeConfirm(true); }}
                      className={`flex-1 text-[12px] px-3 py-2 rounded border transition-colors ${
                        !isActive ? 'bg-gray-100 border-gray-300 text-gray-700 font-medium' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      Lecteur gratuit
                    </button>
                    <button className={`flex-1 text-[12px] px-3 py-2 rounded border transition-colors ${
                      isActive ? 'bg-amber-50 border-amber-300 text-amber-700 font-medium' : 'bg-white border-gray-200 text-gray-500 hover:border-amber-300'
                    }`} disabled>
                      Premium
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Durée de l&apos;abonnement</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[{ value: '1', label: '1 mois' }, { value: '3', label: '3 mois' }, { value: '6', label: '6 mois' }, { value: '12', label: '12 mois' }].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setDurationMonths(opt.value); setShowCustom(false); setCustomDays(''); }}
                        className={`text-[12px] px-2 py-1.5 rounded border transition-colors ${
                          durationMonths === opt.value && !showCustom ? 'bg-[#111] text-white border-[#111]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowCustom(!showCustom)}
                    className={`mt-1.5 text-[11px] px-2 py-1 rounded border transition-colors w-full ${
                      showCustom ? 'bg-[#111] text-white border-[#111]' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    Durée personnalisée
                  </button>
                  {showCustom && (
                    <div className="mt-2 flex items-center gap-2">
                      <input type="number" placeholder="Nombre de jours" value={customDays} onChange={(e) => setCustomDays(e.target.value)} min={1}
                        className="flex-1 text-[12px] border border-gray-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-black" />
                      <span className="text-[11px] text-gray-400">jours</span>
                    </div>
                  )}
                </div>

                <div className="bg-[#fafaf9] rounded-lg p-3 border border-black/[0.04]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[11px] text-gray-400">Date de fin calculée</span>
                  </div>
                  <p className="text-[13px] font-medium">{getProjectedEnd()}</p>
                </div>

                <button onClick={handleActivate} disabled={processing || (showCustom && !customDays)}
                  className="w-full text-[13px] bg-[#111] text-white px-4 py-2.5 rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium">
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Confirmer et appliquer Premium
                </button>

                {isActive && !showDowngradeConfirm && (
                  <button onClick={() => setShowDowngradeConfirm(true)} disabled={processing}
                    className="w-full text-[12px] bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                    Rétrograder en Lecteur gratuit
                  </button>
                )}

                {showDowngradeConfirm && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-[12px] text-red-700 mb-2 font-medium">Confirmer la rétrogradation en Lecteur gratuit ?</p>
                    <p className="text-[11px] text-red-600 mb-3">L&apos;utilisateur perdra immédiatement l&apos;accès premium et recevra un email de notification.</p>
                    <div className="flex gap-2">
                      <button onClick={() => setShowDowngradeConfirm(false)} className="flex-1 text-[12px] px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">Annuler</button>
                      <button onClick={handleDeactivate} disabled={processing}
                        className="flex-1 text-[12px] px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                        {processing ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Confirmer'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {processing && (
              <div className="mt-3 flex items-center gap-2 text-[12px] text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Traitement en cours...
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
