'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, MapPin, Upload } from 'lucide-react';

interface Presentation {
  map_image_url: string;
  map_image_alt: string;
  intro_title: string;
  intro_text: string;
}

interface Fact {
  id: string;
  fact_key: string;
  label: string;
  value: string;
  category: string;
  display_order: number;
}

export function NigerPresentationManager() {
  const [presentation, setPresentation] = useState<Presentation>({
    map_image_url: '',
    map_image_alt: 'Carte du Niger',
    intro_title: 'Republique du Niger',
    intro_text: '',
  });
  const [facts, setFacts] = useState<Fact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/niger-presentation')
      .then((res) => res.json())
      .then((data) => {
        if (data.presentation) setPresentation(data.presentation);
        if (data.facts) setFacts(data.facts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/niger-presentation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presentation, facts }),
      });
      if (res.ok) {
        setMessage('Sauvegarde reussie');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Erreur lors de la sauvegarde');
      }
    } catch {
      setMessage('Erreur lors de la sauvegarde');
    }
    setSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setPresentation((prev) => ({ ...prev, map_image_url: data.url }));
      }
    } catch {}
    setUploading(false);
  };

  const updateFact = (id: string, field: keyof Fact, value: string | number) => {
    setFacts((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold">Presentation du Niger</h2>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#111] text-white rounded-lg text-[13px] hover:bg-[#333] disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Sauvegarder
        </button>
      </div>

      {message && (
        <div className={`px-4 py-2 rounded-lg text-[13px] ${message.includes('reussie') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Presentation settings */}
      <div className="bg-white rounded-xl border border-black/[0.06] p-6 space-y-5">
        <h3 className="text-sm font-semibold">Carte et introduction</h3>

        {/* Map image */}
        <div>
          <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-2">Image de la carte</label>
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <input
                type="text"
                value={presentation.map_image_url}
                onChange={(e) => setPresentation((prev) => ({ ...prev, map_image_url: e.target.value }))}
                placeholder="URL de l'image"
                className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:border-black/15"
              />
              <div className="mt-2">
                <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-[12px] cursor-pointer transition-colors w-fit">
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? 'Envoi en cours...' : 'Uploader une image'}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>
            {presentation.map_image_url && (
              <div className="w-24 h-20 rounded-lg overflow-hidden bg-gray-100 border border-black/[0.06] flex-shrink-0">
                <img src={presentation.map_image_url} alt="" className="w-full h-full object-contain" />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-2">Alt text de la carte</label>
          <input
            type="text"
            value={presentation.map_image_alt}
            onChange={(e) => setPresentation((prev) => ({ ...prev, map_image_alt: e.target.value }))}
            className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:border-black/15"
          />
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-2">Titre</label>
          <input
            type="text"
            value={presentation.intro_title}
            onChange={(e) => setPresentation((prev) => ({ ...prev, intro_title: e.target.value }))}
            className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:border-black/15"
          />
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-2">Texte d&apos;introduction</label>
          <textarea
            value={presentation.intro_text}
            onChange={(e) => setPresentation((prev) => ({ ...prev, intro_text: e.target.value }))}
            rows={5}
            className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:border-black/15 resize-y"
          />
        </div>
      </div>

      {/* Facts editor */}
      <div className="bg-white rounded-xl border border-black/[0.06] p-6 space-y-4">
        <h3 className="text-sm font-semibold">Donnees cles</h3>
        <p className="text-[12px] text-gray-400">Modifiez les labels et valeurs affichees sur la page Niger.</p>

        <div className="space-y-3">
          {facts.map((fact) => (
            <div key={fact.id} className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg bg-[#fafaf9] border border-black/[0.04]">
              <div className="col-span-2">
                <span className="text-[10px] uppercase tracking-wider text-gray-400">{fact.fact_key}</span>
              </div>
              <div className="col-span-3">
                <input
                  type="text"
                  value={fact.label}
                  onChange={(e) => updateFact(fact.id, 'label', e.target.value)}
                  className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none focus:border-black/15"
                  placeholder="Label"
                />
              </div>
              <div className="col-span-4">
                <input
                  type="text"
                  value={fact.value}
                  onChange={(e) => updateFact(fact.id, 'value', e.target.value)}
                  className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none focus:border-black/15"
                  placeholder="Valeur"
                />
              </div>
              <div className="col-span-2">
                <select
                  value={fact.category}
                  onChange={(e) => updateFact(fact.id, 'category', e.target.value)}
                  className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[12px] bg-white focus:outline-none"
                >
                  <option value="general">General</option>
                  <option value="economie">Economie</option>
                  <option value="demographie">Demographie</option>
                  <option value="geographie">Geographie</option>
                </select>
              </div>
              <div className="col-span-1">
                <input
                  type="number"
                  value={fact.display_order}
                  onChange={(e) => updateFact(fact.id, 'display_order', parseInt(e.target.value) || 0)}
                  className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[12px] bg-white focus:outline-none text-center"
                  title="Ordre"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
