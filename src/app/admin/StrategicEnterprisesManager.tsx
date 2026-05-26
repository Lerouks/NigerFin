'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Plus, Pencil, Trash2, Save, X, Loader2, GripVertical,
  Eye, EyeOff, Building2, ImageIcon,
} from 'lucide-react';

interface Enterprise {
  id: string;
  name: string;
  slug: string | null;
  sector: string;
  description: string;
  logo_url: string | null;
  image_url: string | null;
  display_order: number;
  is_visible: boolean;
  full_name: string | null;
  founded_year: number | null;
  headquarters: string | null;
  employees: string | null;
  revenue: string | null;
  ownership: string | null;
  website: string | null;
  detailed_description: string | null;
  created_at: string;
  updated_at: string;
}

type FormData = Omit<Enterprise, 'id' | 'created_at' | 'updated_at'>;

const SECTORS = [
  'Mines & Ressources',
  'Pétrole & Énergie',
  'Électricité & Énergie',
  'Télécommunications',
  'Banque & Finance',
  'Agriculture & Agroalimentaire',
  'Transport & Logistique',
  'BTP & Infrastructures',
  'Commerce & Distribution',
  'Industrie',
  'Services',
  'Autre',
];

const emptyForm: FormData = {
  name: '',
  slug: null,
  sector: '',
  description: '',
  logo_url: null,
  image_url: null,
  display_order: 0,
  is_visible: true,
  full_name: null,
  founded_year: null,
  headquarters: null,
  employees: null,
  revenue: null,
  ownership: null,
  website: null,
  detailed_description: null,
};

export function StrategicEnterprisesManager() {
  const [items, setItems] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/strategic-enterprises');
      if (res.ok) setItems(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleCreate = async () => {
    if (!form.name || !form.sector) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/strategic-enterprises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, display_order: items.length + 1 }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ ...emptyForm });
        await fetchItems();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editingId || !form.name || !form.sector) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/strategic-enterprises', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...form }),
      });
      if (res.ok) {
        setEditingId(null);
        setForm({ ...emptyForm });
        await fetchItems();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/strategic-enterprises?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteConfirm(null);
        await fetchItems();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleToggleVisibility = async (item: Enterprise) => {
    try {
      await fetch('/api/admin/strategic-enterprises', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, is_visible: !item.is_visible }),
      });
      await fetchItems();
    } catch { /* ignore */ }
  };

  const startEdit = (item: Enterprise) => {
    setEditingId(item.id);
    setShowCreate(false);
    setForm({
      name: item.name,
      slug: item.slug,
      sector: item.sector,
      description: item.description,
      logo_url: item.logo_url,
      image_url: item.image_url,
      display_order: item.display_order,
      is_visible: item.is_visible,
      full_name: item.full_name,
      founded_year: item.founded_year,
      headquarters: item.headquarters,
      employees: item.employees,
      revenue: item.revenue,
      ownership: item.ownership,
      website: item.website,
      detailed_description: item.detailed_description,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowCreate(false);
    setForm({ ...emptyForm });
  };

  // ─── Form UI (shared between create & edit) ─────────────────────────────

  const renderForm = (onSubmit: () => void, submitLabel: string) => (
    <div className="bg-white border border-black/6 rounded-xl p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">Nom *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex : SOMAÏR"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-hidden focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">Secteur *</label>
          <select
            value={form.sector}
            onChange={(e) => setForm({ ...form, sector: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-hidden focus:ring-2 focus:ring-gray-900 bg-white"
          >
            <option value="">Choisir un secteur</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">Nom complet</label>
          <input
            type="text"
            value={form.full_name || ''}
            onChange={(e) => setForm({ ...form, full_name: e.target.value || null })}
            placeholder="Ex : Societe des Mines de l'Air"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-hidden focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">Slug (URL)</label>
          <input
            type="text"
            value={form.slug || ''}
            onChange={(e) => setForm({ ...form, slug: e.target.value || null })}
            placeholder="Auto-genere si vide"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-hidden focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-[13px] font-medium text-gray-700 mb-1">Description courte</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          placeholder="Resume court affiche dans la liste..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-hidden focus:ring-2 focus:ring-gray-900 resize-none"
        />
      </div>

      <div>
        <label className="block text-[13px] font-medium text-gray-700 mb-1">Description detaillee</label>
        <textarea
          value={form.detailed_description || ''}
          onChange={(e) => setForm({ ...form, detailed_description: e.target.value || null })}
          rows={4}
          placeholder="Description complete affichee sur la page de l'entreprise..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-hidden focus:ring-2 focus:ring-gray-900 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">Siege social</label>
          <input
            type="text"
            value={form.headquarters || ''}
            onChange={(e) => setForm({ ...form, headquarters: e.target.value || null })}
            placeholder="Ex : Niamey, Niger"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-hidden focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">Annee de fondation</label>
          <input
            type="number"
            value={form.founded_year || ''}
            onChange={(e) => setForm({ ...form, founded_year: parseInt(e.target.value) || null })}
            placeholder="Ex : 1968"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-hidden focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">Employes</label>
          <input
            type="text"
            value={form.employees || ''}
            onChange={(e) => setForm({ ...form, employees: e.target.value || null })}
            placeholder="Ex : ~1 500"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-hidden focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">Actionnariat</label>
          <input
            type="text"
            value={form.ownership || ''}
            onChange={(e) => setForm({ ...form, ownership: e.target.value || null })}
            placeholder="Ex : Etat du Niger 100%"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-hidden focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">Chiffre d&apos;affaires</label>
          <input
            type="text"
            value={form.revenue || ''}
            onChange={(e) => setForm({ ...form, revenue: e.target.value || null })}
            placeholder="Ex : 150 milliards FCFA"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-hidden focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">Site web</label>
          <input
            type="url"
            value={form.website || ''}
            onChange={(e) => setForm({ ...form, website: e.target.value || null })}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-hidden focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">URL du logo</label>
          <input
            type="url"
            value={form.logo_url || ''}
            onChange={(e) => setForm({ ...form, logo_url: e.target.value || null })}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-hidden focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">URL de l&apos;image (banniere)</label>
          <input
            type="url"
            value={form.image_url || ''}
            onChange={(e) => setForm({ ...form, image_url: e.target.value || null })}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-hidden focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">Ordre d&apos;affichage</label>
          <input
            type="number"
            value={form.display_order}
            onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-hidden focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_visible}
              onChange={(e) => setForm({ ...form, is_visible: e.target.checked })}
              className="w-4 h-4 rounded-sm border-gray-300"
            />
            <span className="text-[13px] text-gray-700">Visible sur le site</span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onSubmit}
          disabled={saving || !form.name || !form.sector}
          className="flex items-center gap-2 px-4 py-2 bg-[#111] text-white rounded-lg text-[13px] hover:bg-[#333] disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {submitLabel}
        </button>
        <button
          onClick={cancelEdit}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-[13px] hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4" />
          Annuler
        </button>
      </div>
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-gray-500" />
          <div>
            <h2 className="text-lg font-bold text-gray-900">Entreprises stratégiques</h2>
            <p className="text-[13px] text-gray-500">
              {items.length} entreprise{items.length !== 1 ? 's' : ''}, affichées sur la page Entreprises
            </p>
          </div>
        </div>
        {!showCreate && !editingId && (
          <button
            onClick={() => { setShowCreate(true); setForm({ ...emptyForm, display_order: items.length + 1 }); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#111] text-white rounded-lg text-[13px] hover:bg-[#333] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && renderForm(handleCreate, 'Créer')}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      )}

      {/* List */}
      {!loading && items.length === 0 && !showCreate && (
        <div className="text-center py-16 bg-white border border-black/6 rounded-xl">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-[14px]">Aucune entreprise stratégique</p>
          <p className="text-gray-500 text-[13px]">Cliquez sur &quot;Ajouter&quot; pour commencer.</p>
        </div>
      )}

      {!loading && items.map((item) => (
        <div key={item.id}>
          {editingId === item.id ? (
            renderForm(handleUpdate, 'Enregistrer')
          ) : (
            <div className={`bg-white border border-black/6 rounded-xl p-5 flex items-start gap-4 transition-opacity ${!item.is_visible ? 'opacity-60' : ''}`}>
              {/* Drag handle + order */}
              <div className="flex flex-col items-center gap-1 pt-1">
                <GripVertical className="w-4 h-4 text-gray-300" />
                <span className="text-[11px] text-gray-500 font-mono">{item.display_order}</span>
              </div>

              {/* Logo or placeholder */}
              <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                {item.logo_url ? (
                  <Image src={item.logo_url} alt={item.name} width={48} height={48} className="w-full h-full object-contain p-1" />
                ) : (
                  <Building2 className="w-6 h-6 text-gray-300" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[15px] font-semibold text-gray-900 truncate">{item.name}</h3>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded-full whitespace-nowrap">
                    {item.sector}
                  </span>
                  {!item.is_visible && (
                    <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[11px] rounded-full">Masqué</span>
                  )}
                </div>
                <p className="text-[13px] text-gray-500 line-clamp-2">{item.description}</p>
                {item.image_url && (
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500">
                    <ImageIcon className="w-3 h-3" />
                    Image configurée
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggleVisibility(item)}
                  title={item.is_visible ? 'Masquer' : 'Afficher'}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {item.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => startEdit(item)}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {deleteConfirm === item.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={saving}
                      className="px-2 py-1 bg-red-500 text-white rounded-sm text-[11px] hover:bg-red-600 disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-2 py-1 border border-gray-200 text-gray-600 rounded-sm text-[11px] hover:bg-gray-50"
                    >
                      Non
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(item.id)}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
