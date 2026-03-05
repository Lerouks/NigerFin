'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Trash2, Check, Zap, Eye, EyeOff } from 'lucide-react';

interface FlashItem {
  tag: string;
  text: string;
}

interface FlashBannerData {
  enabled: boolean;
  items: FlashItem[];
}

export function FlashBannerManager() {
  const [data, setData] = useState<FlashBannerData>({ enabled: true, items: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/flash-banner');
      if (res.ok) {
        const result = await res.json();
        setData({ enabled: result.enabled ?? true, items: result.items || [] });
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/flash-banner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !data.enabled }),
      });
      if (res.ok) {
        setData((prev) => ({ ...prev, enabled: !prev.enabled }));
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/flash-banner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: data.items }),
      });
      if (res.ok) {
        setDirty(false);
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const updateItem = (index: number, field: keyof FlashItem, value: string) => {
    setData((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
    setDirty(true);
  };

  const addItem = () => {
    setData((prev) => ({
      ...prev,
      items: [...prev.items, { tag: 'INFO', text: '' }],
    }));
    setDirty(true);
  };

  const removeItem = (index: number) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    setDirty(true);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle + header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5" style={{ color: '#d4a843' }} />
          <h3 className="text-sm font-semibold">Bandeau Flash</h3>
        </div>
        <button
          onClick={handleToggle}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] transition-all ${
            data.enabled
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : data.enabled ? (
            <Eye className="w-3.5 h-3.5" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
          {data.enabled ? 'Visible' : 'Masqué'}
        </button>
      </div>

      {/* Items list */}
      <div className="bg-white rounded-xl border border-black/[0.06] divide-y divide-black/[0.04]">
        {data.items.map((item, index) => (
          <div key={index} className="p-4 flex gap-3 items-start">
            <div className="w-24 flex-shrink-0">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Tag</label>
              <input
                type="text"
                value={item.tag}
                onChange={(e) => updateItem(index, 'tag', e.target.value)}
                placeholder="MARCHÉS"
                className="w-full border border-black/[0.08] rounded-lg px-2.5 py-1.5 text-[12px] font-bold uppercase bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Message</label>
              <input
                type="text"
                value={item.text}
                onChange={(e) => updateItem(index, 'text', e.target.value)}
                placeholder="Texte du flash info..."
                className="w-full border border-black/[0.08] rounded-lg px-3 py-1.5 text-[13px] bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <button
              onClick={() => removeItem(index)}
              className="mt-5 p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {data.items.length === 0 && (
          <p className="text-center py-6 text-sm text-gray-400">Aucun flash info</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={addItem}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-black/[0.06] rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un flash
        </button>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#111] text-white rounded-lg text-[13px] hover:bg-[#333] transition-colors disabled:opacity-30"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Enregistrer
          </button>
        )}
      </div>
    </div>
  );
}
