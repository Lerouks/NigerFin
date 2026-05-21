'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, Settings } from 'lucide-react';
import { formatPrice, CURRENCY, BILLING_OPTIONS, getBillingCycleLabel } from '@/config/pricing';

interface DynamicPrice {
  id: string;
  tier: string;
  billing_cycle: string;
  amount: number;
  updated_at: string;
}

export function PricingTab() {
  const [dynamicPrices, setDynamicPrices] = useState<DynamicPrice[]>([]);
  const [savingPrice, setSavingPrice] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pricing');
      const data = await res.json();
      if (Array.isArray(data)) setDynamicPrices(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  const handlePriceUpdate = async (tier: string, billingCycle: string, amount: number) => {
    const key = `${tier}_${billingCycle}`;
    setSavingPrice(key);
    try {
      await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, billingCycle, amount }),
      });
      await fetchPrices();
    } catch { /* ignore */ }
    setSavingPrice(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Gestion dynamique des prix</p>
            <p className="text-[13px] text-amber-700 mt-1">
              Modifiez les prix ci-dessous. Les prix par défaut (config) sont affichés si aucun prix dynamique n&apos;est défini.
              Les nouveaux prix s&apos;appliquent immédiatement sur le site.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-black/[0.06] p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-500" />
          Plan Premium
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BILLING_OPTIONS.map((opt) => {
            const dynamic = dynamicPrices.find(
              (dp) => dp.tier === 'premium' && dp.billing_cycle === opt.cycle
            );
            const currentAmount = dynamic?.amount ?? opt.price;
            const key = `premium_${opt.cycle}`;

            return (
              <PriceEditor
                key={key}
                label={getBillingCycleLabel(opt.cycle)}
                defaultAmount={opt.price}
                currentAmount={currentAmount}
                saving={savingPrice === key}
                onSave={(amount) => handlePriceUpdate('premium', opt.cycle, amount)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PriceEditor({ label, defaultAmount, currentAmount, saving, onSave }: {
  label: string;
  defaultAmount: number;
  currentAmount: number;
  saving: boolean;
  onSave: (amount: number) => void;
}) {
  const [value, setValue] = useState(currentAmount.toString());
  const isDifferent = parseInt(value) !== currentAmount;
  const isCustom = currentAmount !== defaultAmount;

  return (
    <div className="border border-black/[0.06] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        {isCustom && (
          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Personnalisé</span>
        )}
      </div>
      <p className="text-[11px] text-gray-500 mb-2">Par défaut : {formatPrice(defaultAmount)}</p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input type="number" value={value} onChange={(e) => setValue(e.target.value)} min={100} step={100}
            className="w-full border border-black/[0.08] rounded px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:border-black/15" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-500">{CURRENCY}</span>
        </div>
        <button onClick={() => onSave(parseInt(value))} disabled={saving || !isDifferent || parseInt(value) < 100}
          className="px-3 py-2 bg-[#111] text-white rounded text-[12px] hover:bg-[#333] disabled:opacity-30 transition-colors">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sauver'}
        </button>
      </div>
    </div>
  );
}
