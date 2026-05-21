'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { formatPrice, getBillingCycleLabel } from '@/config/pricing';

interface PaymentRequest {
  id: string;
  user_id: string;
  tier: string;
  billing_cycle: string;
  amount: number;
  payment_method: string;
  transaction_number: string;
  status: string;
  rejection_reason?: string;
  created_at: string;
  verified_at?: string;
  user_profiles?: { email: string; full_name: string };
}

interface PaymentsTabProps {
  onStatsRefresh: () => void;
}

export function PaymentsTab({ onStatsRefresh }: PaymentsTabProps) {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState('pending');
  const [error, setError] = useState('');

  const fetchPayments = useCallback(async (status: string) => {
    setLoading(true);
    setPaymentFilter(status);
    setError('');
    try {
      const res = await fetch(`/api/payment/list?status=${status}`);
      if (!res.ok) {
        setError('Erreur lors du chargement des paiements');
        setLoading(false);
        return;
      }
      const json = await res.json();
      const list = json.data ?? json;
      if (Array.isArray(list)) setPayments(list);
    } catch {
      setError('Erreur réseau');
    }
    setLoading(false);
  }, []);

  // Load on mount
  useEffect(() => { fetchPayments('pending'); }, [fetchPayments]);

  const handlePaymentAction = async (paymentId: string, action: 'verify' | 'reject') => {
    setProcessingPayment(paymentId);
    setError('');
    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentRequestId: paymentId,
          action,
          rejectionReason: action === 'reject' ? 'Paiement non confirmé' : undefined,
        }),
      });
      if (res.ok) {
        setPayments((prev) => prev.filter((p) => p.id !== paymentId));
        onStatsRefresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Erreur lors de ${action === 'verify' ? 'la validation' : 'du rejet'}`);
      }
    } catch {
      setError('Erreur réseau');
    }
    setProcessingPayment(null);
  };

  const handleExport = () => {
    window.open('/api/admin/export?type=payments', '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['pending', 'verified', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => fetchPayments(s)}
              className={`px-4 py-2 rounded-lg text-[13px] transition-all ${
                paymentFilter === s ? 'bg-[#111] text-white' : 'bg-white border border-black/[0.06] text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === 'pending' && <Clock className="w-3.5 h-3.5 inline mr-1.5" />}
              {s === 'verified' && <CheckCircle className="w-3.5 h-3.5 inline mr-1.5" />}
              {s === 'rejected' && <XCircle className="w-3.5 h-3.5 inline mr-1.5" />}
              {s === 'pending' ? 'En attente' : s === 'verified' ? 'Vérifiés' : 'Rejetés'}
            </button>
          ))}
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] bg-white border border-black/[0.06] hover:bg-gray-50 transition-colors">
          <Download className="w-3.5 h-3.5" /> Excel
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-[13px]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500 mx-auto" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.04]">
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 px-4 py-3">Utilisateur</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 px-4 py-3">Plan</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 px-4 py-3">Montant</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 px-4 py-3">Méthode</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 px-4 py-3">N° Transaction</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 px-4 py-3">Date</th>
                {paymentFilter === 'pending' && (
                  <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 px-4 py-3">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-black/[0.03] last:border-0">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{p.user_profiles?.full_name || '-'}</p>
                    <p className="text-[12px] text-gray-500">{p.user_profiles?.email || p.user_id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded bg-amber-100 text-amber-700">{p.tier}</span>
                    <span className="text-[10px] text-gray-500 ml-1">{getBillingCycleLabel(p.billing_cycle)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{formatPrice(p.amount)}</td>
                  <td className="px-4 py-3 text-[12px] text-gray-600 capitalize">{p.payment_method}</td>
                  <td className="px-4 py-3 text-[12px] font-mono text-gray-600">{p.transaction_number}</td>
                  <td className="px-4 py-3 text-[12px] text-gray-500">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                  {paymentFilter === 'pending' && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handlePaymentAction(p.id, 'verify')} disabled={processingPayment === p.id}
                          className="text-[12px] bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded hover:bg-emerald-100 transition-colors disabled:opacity-50">
                          {processingPayment === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Valider'}
                        </button>
                        <button onClick={() => handlePaymentAction(p.id, 'reject')} disabled={processingPayment === p.id}
                          className="text-[12px] bg-red-50 text-red-700 px-3 py-1.5 rounded hover:bg-red-100 transition-colors disabled:opacity-50">
                          Rejeter
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && (
            <p className="text-center py-8 text-sm text-gray-500">Aucun paiement {paymentFilter === 'pending' ? 'en attente' : ''}</p>
          )}
        </div>
      )}
    </div>
  );
}
