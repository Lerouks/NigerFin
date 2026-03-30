'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import {
  ArrowRight, Check, Loader2, Clock, XCircle, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { formatPrice, getBillingCycleLabel } from '@/config/pricing';
import type { UserProfile, UserRole } from '@/types';

interface Subscription {
  tier: string;
  status: string;
  billing_cycle: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  price_amount: number;
  created_at: string;
}

interface AccountSubscriptionTabProps {
  user: User | null;
  profile: UserProfile | null;
  userRole: UserRole | null;
  isSubscribed: boolean;
  isExpired: boolean;
  sub: Subscription | null;
  periodEnd: string | null;
  memberSince: string;
  recentPayments: { id: string; amount: number; tier: string; billing_cycle: string; status: string; created_at: string }[];
  onRefresh: () => void;
}

function getRemainingTime(periodEndDate: string | null, periodStartDate: string | null): { days: number; label: string; progress: number } | null {
  if (!periodEndDate) return null;
  const now = new Date();
  const end = new Date(periodEndDate);
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return null;
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const label = days > 30
    ? `${Math.floor(days / 30)} mois et ${days % 30} jour${days % 30 !== 1 ? 's' : ''}`
    : `${days} jour${days !== 1 ? 's' : ''}`;

  let progress = 50;
  if (periodStartDate) {
    const start = new Date(periodStartDate);
    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = now.getTime() - start.getTime();
    progress = totalMs > 0 ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)) : 0;
  }

  return { days, label, progress };
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-black/[0.04] last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${valueColor || ''}`}>{value}</span>
    </div>
  );
}

export function AccountSubscriptionTab({
  user, profile, userRole, isSubscribed, isExpired, sub, periodEnd, memberSince, recentPayments, onRefresh,
}: AccountSubscriptionTabProps) {
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [subActionMsg, setSubActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    setSubActionMsg(null);
    try {
      const res = await fetch('/api/user/subscription', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setSubActionMsg({ type: 'success', text: data.message || 'Abonnement annulé.' });
        setShowCancelConfirm(false);
        onRefresh();
      } else {
        setSubActionMsg({ type: 'error', text: data.error || 'Erreur lors de l\'annulation.' });
      }
    } catch {
      setSubActionMsg({ type: 'error', text: 'Erreur réseau. Veuillez réessayer.' });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setReactivateLoading(true);
    setSubActionMsg(null);
    try {
      const res = await fetch('/api/user/subscription', { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) {
        setSubActionMsg({ type: 'success', text: data.message || 'Abonnement réactivé.' });
        onRefresh();
      } else {
        setSubActionMsg({ type: 'error', text: data.error || 'Erreur lors de la réactivation.' });
      }
    } catch {
      setSubActionMsg({ type: 'error', text: 'Erreur réseau. Veuillez réessayer.' });
    } finally {
      setReactivateLoading(false);
    }
  };

  const rawPeriodEnd = profile?.subscription_end || sub?.current_period_end || null;
  const rawPeriodStart = sub?.current_period_start || null;
  const remaining = getRemainingTime(rawPeriodEnd, rawPeriodStart);

  return (
    <div className="space-y-6">
      {subActionMsg && (
        <div className={`rounded-xl px-5 py-4 text-sm flex items-start gap-3 ${
          subActionMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {subActionMsg.type === 'success' ? <Check className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <span>{subActionMsg.text}</span>
        </div>
      )}

      {/* Subscription details */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
        <h3 className="text-lg font-semibold mb-5">Détails de l&apos;abonnement</h3>

        <div className="mb-6 p-4 bg-[#fafaf9] rounded-xl">
          <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-3">Informations du compte</p>
          <div className="space-y-2">
            <InfoRow label="Email" value={user?.email || '-'} />
            {profile?.full_name && <InfoRow label="Nom" value={profile.full_name} />}
            <InfoRow label="Membre depuis" value={memberSince} />
            <InfoRow label="Statut du compte" value="Actif" valueColor="text-emerald-600" />
          </div>
        </div>

        <div className="space-y-3">
          <InfoRow label="Plan actuel" value={
            userRole === 'premium' ? 'Premium' : userRole === 'admin' ? 'Administrateur' : 'Lecteur (gratuit)'
          } />
          <InfoRow
            label="Statut abonnement"
            value={
              sub?.cancel_at_period_end ? 'Annulation programmée'
              : isExpired ? 'Expiré'
              : sub?.status === 'active' ? 'Premium actif'
              : profile?.subscription_status === 'active' ? 'Premium actif'
              : 'Lecteur gratuit'
            }
            valueColor={
              sub?.cancel_at_period_end ? 'text-amber-600'
              : isExpired ? 'text-red-600'
              : (sub?.status === 'active' || profile?.subscription_status === 'active') ? 'text-emerald-600'
              : 'text-gray-400'
            }
          />
          {sub?.price_amount != null && sub.price_amount > 0 && (
            <InfoRow label="Montant" value={formatPrice(sub.price_amount)} />
          )}
          {sub?.current_period_start && (
            <InfoRow label="Début de la période" value={
              new Date(sub.current_period_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
            } />
          )}
          {periodEnd && (
            <InfoRow label={sub?.cancel_at_period_end ? 'Fin d\'accès' : 'Prochain renouvellement'} value={periodEnd} />
          )}
        </div>

        {/* Remaining time indicator */}
        {isSubscribed && remaining && (
          <div className="mt-5 p-4 bg-[#fafaf9] rounded-xl border border-black/[0.04]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-[11px] text-gray-400 uppercase tracking-wider">Temps restant</span>
              </div>
              <span className={`text-sm font-semibold ${
                remaining.days <= 3 ? 'text-red-600' : remaining.days <= 7 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {remaining.label}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  remaining.days <= 3 ? 'bg-red-500' : remaining.days <= 7 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${100 - remaining.progress}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              {remaining.days <= 3
                ? 'Votre abonnement expire très bientôt. Pensez à le renouveler.'
                : remaining.days <= 7
                ? 'Votre abonnement expire dans moins d\'une semaine.'
                : `Votre abonnement est actif jusqu'au ${periodEnd}.`
              }
            </p>
          </div>
        )}

        {sub?.cancel_at_period_end && (
          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Annulation programmée</p>
              <p className="text-[13px] text-amber-700 mt-1">
                Votre abonnement ne sera pas renouvelé. Vous conservez l&apos;accès jusqu&apos;au {periodEnd}.
              </p>
              <button onClick={handleReactivateSubscription} disabled={reactivateLoading}
                className="mt-3 inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-[13px] hover:bg-amber-700 transition-colors">
                {reactivateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Réactiver mon abonnement
              </button>
            </div>
          </div>
        )}

        {isExpired && periodEnd && (
          <div className="mt-5 bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Abonnement Premium expiré</p>
              <p className="text-[13px] text-red-700 mt-1">
                Votre abonnement Premium a expiré le {periodEnd}. Renouvelez-le pour retrouver l&apos;accès complet.
              </p>
              <Link href="/pricing" className="mt-3 inline-flex items-center gap-2 bg-[#111] text-white px-4 py-2 rounded-lg text-[13px] hover:bg-[#333] transition-colors">
                <RefreshCw className="w-4 h-4" /> Renouveler mon abonnement
              </Link>
            </div>
          </div>
        )}

        {!isSubscribed && !isExpired && recentPayments.length > 0 && (
          <div className="mt-5 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">Abonnement expiré</p>
              <p className="text-[13px] text-gray-500 mt-1">
                Votre abonnement précédent a expiré. Renouvelez-le pour retrouver l&apos;accès à tous les contenus.
              </p>
              <Link href="/pricing" className="mt-3 inline-flex items-center gap-2 bg-[#111] text-white px-4 py-2 rounded-lg text-[13px] hover:bg-[#333] transition-colors">
                <RefreshCw className="w-4 h-4" /> Renouveler mon abonnement
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
        <h3 className="text-lg font-semibold mb-5">Actions</h3>
        <div className="space-y-4">
          {!isSubscribed && (
            <div className="flex items-center justify-between p-4 rounded-xl border border-black/[0.04]">
              <div>
                <p className="text-sm font-medium">S&apos;abonner</p>
                <p className="text-[12px] text-gray-500 mt-0.5">Accédez à tous les articles et outils premium</p>
              </div>
              <Link href="/pricing" className="inline-flex items-center gap-2 bg-[#111] text-white px-5 py-2.5 rounded-xl text-[13px] hover:bg-[#333] transition-colors flex-shrink-0">
                Voir les plans <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {userRole === 'premium' && (
            <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-100 bg-emerald-50/50">
              <div>
                <p className="text-sm font-medium text-emerald-800">Plan Premium actif</p>
                <p className="text-[12px] text-emerald-600/70 mt-0.5">Vous bénéficiez de l&apos;accès complet à tous les contenus et fonctionnalités</p>
              </div>
              <span className="text-[12px] text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-lg font-medium flex-shrink-0">Plan actif</span>
            </div>
          )}

          {isSubscribed && !sub?.cancel_at_period_end && userRole !== 'admin' && (
            <div className="flex items-center justify-between p-4 rounded-xl border border-red-100 bg-red-50/50">
              <div>
                <p className="text-sm font-medium text-red-800">Résilier mon abonnement</p>
                <p className="text-[12px] text-red-600/70 mt-0.5">Vous conserverez l&apos;accès jusqu&apos;à la fin de la période en cours</p>
              </div>
              {!showCancelConfirm ? (
                <button onClick={() => setShowCancelConfirm(true)}
                  className="inline-flex items-center gap-2 border border-red-300 text-red-700 px-5 py-2.5 rounded-xl text-[13px] hover:bg-red-100 transition-colors flex-shrink-0">
                  Résilier
                </button>
              ) : (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setShowCancelConfirm(false)} className="px-4 py-2.5 rounded-xl text-[13px] text-gray-500 hover:bg-gray-100 transition-colors">Annuler</button>
                  <button onClick={handleCancelSubscription} disabled={cancelLoading}
                    className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl text-[13px] hover:bg-red-700 transition-colors">
                    {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Confirmer la résiliation
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment history */}
      {recentPayments.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-[15px]">Historique des paiements</h3>
          </div>
          <ul className="space-y-2">
            {recentPayments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between py-3 px-4 border border-black/[0.03] rounded-lg">
                <div>
                  <p className="text-sm font-medium capitalize">{payment.tier} - {getBillingCycleLabel(payment.billing_cycle || 'monthly')}</p>
                  <p className="text-[11px] text-gray-400">
                    {new Date(payment.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatPrice(payment.amount)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    payment.status === 'verified' ? 'bg-emerald-50 text-emerald-600' :
                    payment.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {payment.status === 'verified' ? 'Vérifié' : payment.status === 'pending' ? 'En attente' : 'Rejeté'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pending payment notice */}
      {recentPayments.some(p => p.status === 'pending') && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Paiement en attente de vérification</p>
            <p className="text-[13px] text-amber-700 mt-1">
              Votre paiement sera vérifié sous 24h. Votre abonnement sera activé dès la vérification.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
