'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Save, Plus, Trash2, GripVertical, FileText } from 'lucide-react';

interface LegalSection {
  id: string;
  page_slug: string;
  heading: string;
  text: string;
  display_order: number;
  updated_at: string;
}

const PAGES = [
  { slug: 'mentions-legales', label: 'Mentions Légales', route: '/mentions-legales' },
  { slug: 'confidentialite', label: 'Confidentialité', route: '/confidentialite' },
  { slug: 'cgu', label: 'CGU', route: '/cgu' },
  { slug: 'cookies', label: 'Cookies', route: '/cookies' },
  { slug: 'publicite', label: 'Publicité', route: '/publicite' },
  { slug: 'about', label: 'À propos', route: '/about' },
  { slug: 'contact', label: 'Contact', route: '/contact' },
];

export function LegalSectionsManager() {
  const [activeSlug, setActiveSlug] = useState('mentions-legales');
  const [sections, setSections] = useState<LegalSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activePage = PAGES.find((p) => p.slug === activeSlug)!;

  const fetchSections = useCallback(async (slug: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/legal-sections?page=${slug}`);
      const data = await res.json();
      if (Array.isArray(data)) setSections(data);
      else setSections([]);
    } catch {
      setMessage({ type: 'error', text: 'Erreur de chargement' });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSections(activeSlug); }, [activeSlug, fetchSections]);

  const handleFieldChange = (id: string, field: 'heading' | 'text', value: string) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/legal-sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: sections.map((s, i) => ({ ...s, display_order: i + 1 })),
        }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Sections sauvegardées' });
        await fetchSections(activeSlug);
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau' });
    }
    setSaving(false);
  };

  const handleAdd = async () => {
    setAdding(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/legal-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_slug: activeSlug,
          heading: 'Nouvelle section',
          text: '',
          display_order: sections.length + 1,
        }),
      });
      if (res.ok) {
        await fetchSections(activeSlug);
        setMessage({ type: 'success', text: 'Section ajoutée' });
      }
    } catch {
      setMessage({ type: 'error', text: "Erreur lors de l'ajout" });
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette section ?')) return;
    setDeletingId(id);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/legal-sections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await fetchSections(activeSlug);
        setMessage({ type: 'success', text: 'Section supprimée' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    }
    setDeletingId(null);
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    setSections(newSections);
  };

  return (
    <div className="space-y-6">
      {/* Page selector */}
      <div>
        <h2 className="text-lg font-bold">Pages éditables</h2>
        <p className="text-[13px] text-gray-400 mb-3">Sélectionnez une page pour éditer ses sections</p>
        <div className="flex gap-2 flex-wrap">
          {PAGES.map((page) => (
            <button
              key={page.slug}
              onClick={() => setActiveSlug(page.slug)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] transition-all ${
                activeSlug === page.slug
                  ? 'bg-[#111] text-white'
                  : 'bg-white border border-black/[0.06] text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              {page.label}
            </button>
          ))}
        </div>
      </div>

      {/* Header for active page */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{activePage.label}</h3>
          <p className="text-[12px] text-gray-400">
            Route : <span className="font-mono">{activePage.route}</span>
            {sections.length === 0 && !loading && (
              <span className="ml-2 text-amber-600">· Aucune section (contenu vide)</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            disabled={adding}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] bg-white border border-black/[0.06] hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Ajouter une section
          </button>
          <button
            onClick={handleSave}
            disabled={saving || sections.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] bg-[#111] text-white hover:bg-[#333] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-3 rounded-lg text-[13px] ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Sections */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
      <div className="space-y-4">
        {sections.map((section, index) => (
          <div key={section.id} className="bg-white rounded-xl border border-black/[0.06] p-5">
            <div className="flex items-start gap-3">
              {/* Reorder controls */}
              <div className="flex flex-col items-center gap-1 pt-1">
                <GripVertical className="w-4 h-4 text-gray-300" />
                <button
                  onClick={() => moveSection(index, -1)}
                  disabled={index === 0}
                  className="text-[10px] text-gray-400 hover:text-black disabled:opacity-30"
                  title="Monter"
                >
                  &uarr;
                </button>
                <button
                  onClick={() => moveSection(index, 1)}
                  disabled={index === sections.length - 1}
                  className="text-[10px] text-gray-400 hover:text-black disabled:opacity-30"
                  title="Descendre"
                >
                  &darr;
                </button>
              </div>

              {/* Fields */}
              <div className="flex-1 space-y-3">
                <div>
                  <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">
                    Titre de la section
                  </label>
                  <input
                    type="text"
                    value={section.heading}
                    onChange={(e) => handleFieldChange(section.id, 'heading', e.target.value)}
                    className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">
                    Contenu
                  </label>
                  <textarea
                    value={section.text}
                    onChange={(e) => handleFieldChange(section.id, 'text', e.target.value)}
                    rows={4}
                    className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-black/10 resize-y"
                  />
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(section.id)}
                disabled={deletingId === section.id}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Supprimer"
              >
                {deletingId === section.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ))}

        {sections.length === 0 && (
          <div className="text-center py-12 text-sm text-gray-400">
            Aucune section pour cette page. Cliquez sur &quot;Ajouter une section&quot; pour commencer.
          </div>
        )}
      </div>
      )}
    </div>
  );
}
