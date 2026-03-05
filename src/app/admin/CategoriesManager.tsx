'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Pencil, Trash2, X, Check } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const slugify = (text: string) =>
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setName('');
    setSlug('');
    setDescription('');
  };

  const startEdit = (cat: Category) => {
    setEditing(cat.id);
    setCreating(false);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
  };

  const cancel = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSave = async () => {
    if (!name || !slug) return;
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const body = editing
        ? { id: editing, name, slug, description }
        : { name, slug, description };

      const res = await fetch('/api/admin/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchCategories();
        cancel();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ?')) return;
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) await fetchCategories();
    } catch { /* ignore */ }
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Catégories</h2>
        {!creating && !editing && (
          <button onClick={startCreate} className="flex items-center gap-1.5 px-3 py-2 bg-[#111] text-white rounded-lg text-[13px] hover:bg-[#333] transition-colors">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        )}
      </div>

      {/* Create / Edit form */}
      {(creating || editing) && (
        <div className="bg-white rounded-xl border border-black/[0.06] p-5 space-y-4">
          <h3 className="text-sm font-semibold">{editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] text-gray-500 block mb-1">Nom</label>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); if (!editing) setSlug(slugify(e.target.value)); }}
                className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:border-black/15"
                placeholder="Économie"
              />
            </div>
            <div>
              <label className="text-[12px] text-gray-500 block mb-1">Slug</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:border-black/15"
                placeholder="economie"
              />
            </div>
          </div>
          <div>
            <label className="text-[12px] text-gray-500 block mb-1">Description (optionnel)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:border-black/15"
              placeholder="Description de la catégorie"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !name || !slug}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#111] text-white rounded-lg text-[13px] hover:bg-[#333] disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {editing ? 'Mettre à jour' : 'Créer'}
            </button>
            <button onClick={cancel} className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-[13px] hover:bg-gray-200 transition-colors">
              <X className="w-3.5 h-3.5" /> Annuler
            </button>
          </div>
        </div>
      )}

      {/* Categories list */}
      <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/[0.04]">
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Nom</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Slug</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Description</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-black/[0.03] last:border-0">
                <td className="px-4 py-3 text-sm font-medium">{cat.name}</td>
                <td className="px-4 py-3 text-[12px] text-gray-500 font-mono">{cat.slug}</td>
                <td className="px-4 py-3 text-[12px] text-gray-500">{cat.description || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(cat)} className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-1.5 hover:bg-red-50 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <p className="text-center py-8 text-sm text-gray-400">Aucune catégorie</p>
        )}
      </div>
    </div>
  );
}
