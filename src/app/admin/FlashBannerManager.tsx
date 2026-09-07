'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Trash2, Check, Zap, Eye, EyeOff } from 'lucide-react';
import { appelAdmin, envoiAdmin } from '@/app/admin/lib/appel-admin';
import { EtatListe } from '@/app/admin/lib/EtatListe';

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
  const [error, setError] = useState('');
  // Echec du chargement de la liste, distinct d'une liste vraiment vide.
  const [erreurListe, setErreurListe] = useState<string | null>(null);
  const [horsLigne, setHorsLigne] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErreurListe(null);
    const resultat = await appelAdmin<{ enabled?: boolean; items?: FlashItem[] }>('/api/admin/flash-banner');
    if (resultat.ok) {
      const recu = resultat.donnees ?? {};
      setData({ enabled: recu.enabled ?? true, items: recu.items ?? [] });
      setHorsLigne(false);
    } else {
      // On ne touche pas aux données déjà affichées : un échec n'efface rien.
      setErreurListe(resultat.message);
      setHorsLigne(resultat.horsLigne);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async () => {
    setSaving(true);
    setError('');
    const resultat = await envoiAdmin('/api/admin/flash-banner', 'PUT', { enabled: !data.enabled });
    if (resultat.ok) {
      setData((prev) => ({ ...prev, enabled: !prev.enabled }));
    } else {
      setError(resultat.message);
    }
    setSaving(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const resultat = await envoiAdmin('/api/admin/flash-banner', 'PUT', { items: data.items });
    if (resultat.ok) {
      setDirty(false);
    } else {
      setError(resultat.message);
    }
    setSaving(false);
  };

  const updateItem = (index: number, field: keyof FlashItem, value: string) => {
    setData((prev) => {
      const items = [...prev.items];
      const current = items[index];
      if (!current) return prev;
      items[index] = { ...current, [field]: value };
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
        <Loader2 className="w-6 h-6 animate-spin text-gray-500 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle + header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-gold" />
          <h3 className="text-sm font-semibold">Bandeau Flash</h3>
        </div>
        {/* Tant que la lecture a échoué, on ignore si le bandeau est visible :
            afficher un état inventé serait pire que ne rien afficher. */}
        {erreurListe === null && (
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
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-[13px]">
          {error}
        </div>
      )}

      {/* Chargement en échec, ou liste vraiment vide */}
      <EtatListe
        chargement={false}
        erreur={erreurListe}
        horsLigne={horsLigne}
        vide={data.items.length === 0}
        texteVide="Aucun flash info"
        onReessayer={fetchData}
      />

      {/* Items list */}
      {erreurListe === null && data.items.length > 0 && (
      <div className="bg-white rounded-xl border border-black/6 divide-y divide-black/4">
        {data.items.map((item, index) => (
          <div key={index} className="p-4 flex gap-3 items-start">
            <div className="w-24 shrink-0">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Tag</label>
              <input
                type="text"
                value={item.tag}
                onChange={(e) => updateItem(index, 'tag', e.target.value)}
                placeholder="MARCHÉS"
                className="w-full border border-black/8 rounded-lg px-2.5 py-1.5 text-[12px] font-bold uppercase bg-background focus:outline-hidden focus:ring-1 focus:ring-black"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Message</label>
              <input
                type="text"
                value={item.text}
                onChange={(e) => updateItem(index, 'text', e.target.value)}
                placeholder="Texte du flash info..."
                className="w-full border border-black/8 rounded-lg px-3 py-1.5 text-[13px] bg-background focus:outline-hidden focus:ring-1 focus:ring-black"
              />
            </div>
            <button
              onClick={() => removeItem(index)}
              className="mt-5 p-1.5 rounded-sm hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors shrink-0"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      )}

      {/* Actions : indisponibles tant que la liste n'a pas pu être chargée,
          pour ne pas enregistrer par-dessus des flashs qu'on n'a pas lus. */}
      {erreurListe === null && (
      <div className="flex items-center gap-2">
        <button
          onClick={addItem}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-black/6 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 transition-colors"
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
      )}
    </div>
  );
}
