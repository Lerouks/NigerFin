'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Check,
  Loader2,
  ArrowLeft,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  PREMIUM_TIER,
  PAYMENT_METHODS,
  BILLING_OPTIONS,
  formatPrice,
  getBillingOption,
  getBillingCycleLabel,
  isValidBillingCycle,
  type PaymentMethodId,
  type BillingCycle,
} from '@/config/pricing';

type Step = 'choose-method' | 'instructions' | 'confirm' | 'submitted';

export function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn, isLoading } = useAuth();

  const tierParam = searchParams.get('tier');
  const cycleParam = searchParams.get('cycle') || 'monthly';

  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    isValidBillingCycle(cycleParam) ? cycleParam : 'monthly'
  );
  const [step, setStep] = useState<Step>('choose-method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId | null>(null);
  const [transactionNumber, setTransactionNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isSignedIn) {
      router.push('/connexion');
    }
  }, [isLoading, isSignedIn, router]);

  // Validate params
  if (tierParam !== 'premium') {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Plan invalide</h2>
          <p className="text-gray-500 mb-6">Veuillez choisir un plan depuis la page d&apos;abonnements.</p>
          <Link href="/pricing" className="bg-[#111] text-white px-6 py-2.5 rounded-lg text-[14px] hover:bg-[#333] transition-colors">
            Voir les abonnements
          </Link>
        </div>
      </div>
    );
  }

  const billingOption = getBillingOption(billingCycle);
  const price = billingOption.price;
  const method = selectedMethod ? PAYMENT_METHODS[selectedMethod] : null;

  const handleCopyNumber = async () => {
    if (!method) return;
    try {
      await navigator.clipboard.writeText(method.recipientNumber.replace(/\s/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSubmit = async () => {
    if (!selectedMethod || !transactionNumber.trim()) return;

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/payment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: 'premium',
          billingCycle,
          paymentMethod: selectedMethod,
          transactionNumber: transactionNumber.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la soumission');
        setSubmitting(false);
        return;
      }

      setStep('submitted');
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !isSignedIn) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header */}
      <section className="bg-[#111] text-white py-12 md:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/pricing" className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 text-[13px] mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour aux abonnements
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Finaliser le paiement</h1>
          <p className="text-white/50 text-[15px]">
            Plan Premium &mdash; {getBillingCycleLabel(billingCycle)}
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Billing cycle selector */}
        <div className="bg-white rounded-xl border border-black/[0.06] p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Choisissez la durée</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {BILLING_OPTIONS.map((opt) => (
              <button
                key={opt.cycle}
                onClick={() => setBillingCycle(opt.cycle)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  billingCycle === opt.cycle
                    ? 'border-[#111] bg-[#111]/5'
                    : 'border-black/[0.06] hover:border-black/20'
                }`}
              >
                <p className="font-bold text-lg">{formatPrice(opt.price)}</p>
                <p className="text-sm text-gray-500">{opt.durationLabel}</p>
                {opt.savings && (
                  <p className="text-emerald-600 text-[12px] font-medium mt-1">{opt.savings}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-xl border border-black/[0.06] p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Récapitulatif</h2>
          <div className="flex items-center justify-between py-2 border-b border-black/[0.04]">
            <span className="text-gray-600">Plan</span>
            <span className="font-semibold">Premium</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-black/[0.04]">
            <span className="text-gray-600">Durée</span>
            <span className="font-semibold">{billingOption.durationLabel}</span>
          </div>
          <div className="flex items-center justify-between py-3 mt-1">
            <span className="text-lg font-bold">Total à payer</span>
            <span className="text-2xl font-bold">{formatPrice(price)}</span>
          </div>
        </div>

        {/* Step 1: Choose payment method */}
        {step === 'choose-method' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Choisissez votre méthode de paiement</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {(Object.values(PAYMENT_METHODS)).map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setSelectedMethod(m.id); setStep('instructions'); }}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${
                    selectedMethod === m.id
                      ? 'border-[#111] bg-[#111]/5'
                      : 'border-black/[0.06] hover:border-black/20'
                  }`}
                >
                  <h3 className="font-bold text-lg mb-1">{m.shortName}</h3>
                  <p className="text-gray-500 text-[13px]">{m.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Instructions */}
        {step === 'instructions' && method && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Instructions de paiement via {method.shortName}</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
              <p className="text-amber-800 text-[14px] leading-relaxed">{method.instructions}</p>
            </div>

            <div className="bg-white rounded-xl border border-black/[0.06] p-6 mb-6 space-y-4">
              <div>
                <span className="text-[12px] text-gray-400 uppercase tracking-wider">Montant exact à envoyer</span>
                <p className="text-2xl font-bold mt-1">{formatPrice(price)}</p>
              </div>
              <div>
                <span className="text-[12px] text-gray-400 uppercase tracking-wider">Numéro du destinataire</span>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xl font-bold font-mono">{method.recipientNumber}</p>
                  <button
                    onClick={handleCopyNumber}
                    className="text-gray-400 hover:text-gray-700 transition-colors"
                    title="Copier"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <span className="text-[12px] text-gray-400 uppercase tracking-wider">Nom du bénéficiaire</span>
                <p className="text-lg font-semibold mt-1">{method.recipientName}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStep('choose-method'); setSelectedMethod(null); }}
                className="px-5 py-3 rounded-lg border border-black/[0.1] text-[14px] hover:bg-gray-50 transition-colors"
              >
                Changer de méthode
              </button>
              <button
                onClick={() => setStep('confirm')}
                className="flex-1 bg-[#111] text-white px-6 py-3 rounded-lg text-[14px] hover:bg-[#333] transition-colors"
              >
                J&apos;ai effectué le transfert
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm with transaction number */}
        {step === 'confirm' && method && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Confirmez votre paiement</h2>
            <div className="bg-white rounded-xl border border-black/[0.06] p-6 mb-6">
              <div className="mb-4">
                <p className="text-[13px] text-gray-500 mb-1">Méthode : <span className="font-semibold text-black">{method.name}</span></p>
                <p className="text-[13px] text-gray-500 mb-1">Durée : <span className="font-semibold text-black">{billingOption.durationLabel}</span></p>
                <p className="text-[13px] text-gray-500">Montant : <span className="font-semibold text-black">{formatPrice(price)}</span></p>
              </div>

              <label htmlFor="txn" className="block text-sm font-medium mb-2">
                Numéro de transaction
              </label>
              <input
                id="txn"
                type="text"
                value={transactionNumber}
                onChange={(e) => setTransactionNumber(e.target.value)}
                placeholder="Ex: TXN123456789"
                className="w-full border border-black/[0.08] rounded-lg px-4 py-3 bg-[#fafaf9] focus:outline-none focus:border-black/15 focus:ring-1 focus:ring-black/5 transition-all text-[14px] font-mono"
              />
              <p className="text-[12px] text-gray-400 mt-2">
                Entrez le numéro de transaction reçu après votre transfert {method.shortName}.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-[13px]">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setStep('instructions'); setError(''); }}
                className="px-5 py-3 rounded-lg border border-black/[0.1] text-[14px] hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !transactionNumber.trim()}
                className="flex-1 bg-[#111] text-white px-6 py-3 rounded-lg text-[14px] hover:bg-[#333] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Soumettre le paiement
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Submitted */}
        {step === 'submitted' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Paiement soumis</h2>
            <p className="text-gray-600 mb-2">Votre paiement est en cours de vérification.</p>
            <div className="inline-flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg text-[13px] mb-8">
              <Clock className="w-4 h-4" />
              Délai de vérification : sous 24h
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/compte"
                className="bg-[#111] text-white px-8 py-3 rounded-lg text-[14px] hover:bg-[#333] transition-colors"
              >
                Mon compte
              </Link>
              <Link
                href="/"
                className="border border-black/[0.1] px-8 py-3 rounded-lg text-[14px] hover:bg-gray-50 transition-colors"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
