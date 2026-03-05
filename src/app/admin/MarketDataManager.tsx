'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Plus, Pencil, Trash2, Check, X, TrendingUp, TrendingDown,
} from 'lucide-react';

interface MarketEntry {
  id: string;
  name: string;
  symbol: string;
  type: 'currency' | 'commodity' | 'index';
  value: number;
  change: number;
  change_percent: number;
  unit: string;
  source: string;
  updated_at: string;
  created_at: string;
}

const TYPES = [
  { value: 'currency', label: 'Devise' },
  { value: 'commodity', label: 'Matière première' },
  { value: 'index', label: 'Indice' },
];

const emptyForm = {
  name: '',
  symbol: '',
  type: 'currency' as 'currency' | 'commodity' | 'index',
  value: 0,
  unit: '',
  source: '',
};

export function MarketDataManager() {
  const [entries, setEntries] = useState<MarketEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filterType, setFilterType] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/market-data');
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = editId ? 'PUT' : 'POST';
      const body = editId ? { id: editId, ...form } : form;
      const res = await fetch('/api/admin/market-data', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setEditId(null);
        setShowCreate(false);
        setForm(emptyForm);
        fetchData();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/market-data?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchData();
      }
    } catch { /* ignore */ }
  };

  const startEdit = (entry: MarketEntry) => {
    setEditId(entry.id);
    setShowCreate(false);
    setForm({
      name: entry.name,
      symbol: entry.symbol,
      type: entry.type,
      value: entry.value,
      unit: entry.unit || '',
      source: entry.source || '',
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setShowCreate(false);
    setForm(emptyForm);
  };

  const startCreate = () => {
    setEditId(null);
    setShowCreate(true);
    setForm(emptyForm);
  };

  const filtered = filterType
    ? entries.filter((e) => e.type === filterType)
    : entries;

  const getTypeLabel = (t: string) => TYPES.find((x) => x.value === t)?.label || t;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('')}
            className={`px-3 py-2 rounded-lg text-[13px] transition-all ${
              !filterType ? 'bg-[#111] text-white' : 'bg-white border border-black/[0.06] text-gray-600 hover:bg-gray-50'
            }`}
          >
            Tous ({entries.length})
          </button>
          {TYPES.map((t) => {
            const count = entries.filter((e) => e.type === t.value).length;
            return (
              <button
                key={t.value}
                onClick={() => setFilterType(t.value)}
                className={`px-3 py-2 rounded-lg text-[13px] transition-all ${
                  filterType === t.value ? 'bg-[#111] text-white' : 'bg-white border border-black/[0.06] text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.label} ({count})
              </button>
            );
          })}
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#111] text-white rounded-lg text-[13px] hover:bg-[#333] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-black/[0.06] p-6">
          <h3 className="text-sm font-semibold mb-4">Nouvelle donnée de marché</h3>
          <MarketForm
            form={form}
            setForm={setForm}
            onSave={handleSave}
            onCancel={cancelEdit}
            saving={saving}
          />
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.04]">
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Nom</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Type</th>
                <th className="text-right text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Valeur</th>
                <th className="text-right text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Variation</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Source</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Mis à jour</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                editId === entry.id ? (
                  <tr key={entry.id} className="bg-blue-50/50">
                    <td colSpan={7} className="px-4 py-4">
                      <MarketForm
                        form={form}
                        setForm={setForm}
                        onSave={handleSave}
                        onCancel={cancelEdit}
                        saving={saving}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={entry.id} className="border-b border-black/[0.03] last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{entry.name}</p>
                      <p className="text-[11px] text-gray-400">{entry.symbol}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-1 rounded ${
                        entry.type === 'currency' ? 'bg-blue-100 text-blue-700' :
                        entry.type === 'commodity' ? 'bg-amber-100 text-amber-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {getTypeLabel(entry.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium tabular-nums">
                        {Number(entry.value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {entry.unit && (
                        <span className="text-[11px] text-gray-400 ml-1">{entry.unit}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className={`flex items-center justify-end gap-1 text-[12px] ${
                        Number(entry.change) >= 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {Number(entry.change) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Number(entry.change_percent) > 0 ? '+' : ''}{Number(entry.change_percent).toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-500">{entry.source || '—'}</td>
                    <td className="px-4 py-3 text-[11px] text-gray-400 whitespace-nowrap">
                      {entry.updated_at ? new Date(entry.updated_at).toLocaleString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => startEdit(entry)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {deleteConfirm === entry.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                              title="Confirmer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"
                              title="Annuler"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(entry.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center py-8 text-sm text-gray-400">Aucune donnée de marché</p>
          )}
        </div>
      )}
    </div>
  );
}

function MarketForm({ form, setForm, onSave, onCancel, saving }: {
  form: typeof emptyForm;
  setForm: (f: typeof emptyForm) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const update = (key: string, value: string | number) => {
    setForm({ ...form, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Nom *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Ex: EUR/XOF"
            className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div>
          <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Symbole *</label>
          <input
            type="text"
            value={form.symbol}
            onChange={(e) => update('symbol', e.target.value)}
            placeholder="Ex: EUR/XOF"
            className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div>
          <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Type *</label>
          <select
            value={form.type}
            onChange={(e) => update('type', e.target.value)}
            className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Valeur</label>
          <input
            type="number"
            step="0.01"
            value={form.value}
            onChange={(e) => update('value', parseFloat(e.target.value) || 0)}
            className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
          />
          <p className="text-[10px] text-gray-400 mt-1">La variation sera calculée automatiquement</p>
        </div>
        <div>
          <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Unité</label>
          <input
            type="text"
            value={form.unit}
            onChange={(e) => update('unit', e.target.value)}
            placeholder="Ex: FCFA, USD, pts"
            className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div>
          <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Source</label>
          <input
            type="text"
            value={form.source}
            onChange={(e) => update('source', e.target.value)}
            placeholder="Ex: BCEAO"
            className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          onClick={onSave}
          disabled={saving || !form.name || !form.symbol}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#111] text-white rounded-lg text-[13px] hover:bg-[#333] transition-colors disabled:opacity-30"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Enregistrer
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 text-[13px] text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
