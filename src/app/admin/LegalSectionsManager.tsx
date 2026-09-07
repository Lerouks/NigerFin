'use client';

import { useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Save, Plus, Trash2, GripVertical, FileText, Loader2 } from 'lucide-react';
import { appelAdmin, envoiAdmin } from '@/app/admin/lib/appel-admin';
import { EtatListe } from '@/app/admin/lib/EtatListe';

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

const TEXTE_VIDE = 'Aucune section pour cette page. Cliquez sur « Ajouter une section » pour commencer.';

export function LegalSectionsManager() {
  const [activeSlug, setActiveSlug] = useState('mentions-legales');
  const [sections, setSections] = useState<LegalSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // Echec du chargement de la liste : distinct de la liste vide, pour ne jamais
  // laisser croire que la page n'a aucune section alors que l'appel a rate.
  const [erreurListe, setErreurListe] = useState<string | null>(null);
  const [horsLigne, setHorsLigne] = useState(false);

  const activePage = PAGES.find((p) => p.slug === activeSlug)!;

  const fetchSections = useCallback(async (slug: string) => {
    setLoading(true);
    setMessage(null);
    setErreurListe(null);
    setHorsLigne(false);

    const resultat = await appelAdmin<LegalSection[]>(`/api/admin/legal-sections?page=${slug}`);

    if (resultat.ok) {
      setSections(Array.isArray(resultat.donnees) ? resultat.donnees : []);
    } else {
      setSections([]);
      setErreurListe(resultat.message);
      setHorsLigne(resultat.horsLigne);
      Sentry.captureMessage('legal-sections-fetch failed', {
        level: 'error',
        tags: { context: 'legal-sections-fetch' },
        extra: { slug, statut: resultat.statut },
      });
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

    const resultat = await envoiAdmin('/api/admin/legal-sections', 'PUT', {
      sections: sections.map((s, i) => ({ ...s, display_order: i + 1 })),
    });

    if (resultat.ok) {
      setMessage({ type: 'success', text: 'Sections sauvegardées' });
      await fetchSections(activeSlug);
    } else {
      setMessage({ type: 'error', text: resultat.message });
      Sentry.captureMessage('legal-sections-save failed', {
        level: 'error',
        tags: { context: 'legal-sections-save' },
        extra: { slug: activeSlug, statut: resultat.statut },
      });
    }

    setSaving(false);
  };

  const handleAdd = async () => {
    setAdding(true);
    setMessage(null);

    const resultat = await envoiAdmin('/api/admin/legal-sections', 'POST', {
      page_slug: activeSlug,
      heading: 'Nouvelle section',
      text: '',
      display_order: sections.length + 1,
    });

    if (resultat.ok) {
      await fetchSections(activeSlug);
      setMessage({ type: 'success', text: 'Section ajoutée' });
    } else {
      setMessage({ type: 'error', text: resultat.message });
      Sentry.captureMessage('legal-sections-add failed', {
        level: 'error',
        tags: { context: 'legal-sections-add' },
        extra: { slug: activeSlug, statut: resultat.statut },
      });
    }

    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette section ?')) return;
    setDeletingId(id);
    setMessage(null);

    const resultat = await envoiAdmin('/api/admin/legal-sections', 'DELETE', { id });

    if (resultat.ok) {
      await fetchSections(activeSlug);
      setMessage({ type: 'success', text: 'Section supprimée' });
    } else {
      setMessage({ type: 'error', text: resultat.message });
      Sentry.captureMessage('legal-sections-delete failed', {
        level: 'error',
        tags: { context: 'legal-sections-delete' },
        extra: { slug: activeSlug, statut: resultat.statut },
      });
    }

    setDeletingId(null);
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const newSections = [...sections];
    const a = newSections[index];
    const b = newSections[newIndex];
    if (!a || !b) return;
    newSections[index] = b;
    newSections[newIndex] = a;
    setSections(newSections);
  };

  return (
    <div className="space-y-6">
      {/* Page selector */}
      <div>
        <h2 className="text-lg font-bold">Pages éditables</h2>
        <p className="text-[13px] text-gray-500 mb-3">Sélectionnez une page pour éditer ses sections</p>
        <div className="flex gap-2 flex-wrap">
          {PAGES.map((page) => (
            <button
              key={page.slug}
              onClick={() => setActiveSlug(page.slug)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] transition-all ${
                activeSlug === page.slug
                  ? 'bg-[#111] text-white'
                  : 'bg-white border border-black/6 text-gray-600 hover:bg-gray-50'
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
          <p className="text-[12px] text-gray-500">
            Route : <span className="font-mono">{activePage.route}</span>
            {sections.length === 0 && !loading && !erreurListe && (
              <span className="ml-2 text-amber-600">· Aucune section (contenu vide)</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            disabled={adding}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] bg-white border border-black/6 hover:bg-gray-50 transition-colors disabled:opacity-50"
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
      {loading || erreurListe || sections.length === 0 ? (
        <EtatListe
          chargement={loading}
          erreur={erreurListe}
          horsLigne={horsLigne}
          vide={sections.length === 0}
          texteVide={TEXTE_VIDE}
          onReessayer={() => fetchSections(activeSlug)}
        />
      ) : (
      <div className="space-y-4">
        {sections.map((section, index) => (
          <div key={section.id} className="bg-white rounded-xl border border-black/6 p-5">
            <div className="flex items-start gap-3">
              {/* Reorder controls */}
              <div className="flex flex-col items-center gap-1 pt-1">
                <GripVertical className="w-4 h-4 text-gray-300" />
                <button
                  onClick={() => moveSection(index, -1)}
                  disabled={index === 0}
                  className="text-[10px] text-gray-500 hover:text-black disabled:opacity-30"
                  title="Monter"
                >
                  &uarr;
                </button>
                <button
                  onClick={() => moveSection(index, 1)}
                  disabled={index === sections.length - 1}
                  className="text-[10px] text-gray-500 hover:text-black disabled:opacity-30"
                  title="Descendre"
                >
                  &darr;
                </button>
              </div>

              {/* Fields */}
              <div className="flex-1 space-y-3">
                <div>
                  <label className="text-[11px] text-gray-500 uppercase tracking-wider block mb-1">
                    Titre de la section
                  </label>
                  <input
                    type="text"
                    value={section.heading}
                    onChange={(e) => handleFieldChange(section.id, 'heading', e.target.value)}
                    className="w-full border border-black/8 rounded-lg px-3 py-2 text-sm bg-background focus:outline-hidden focus:ring-2 focus:ring-black/10"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 uppercase tracking-wider block mb-1">
                    Contenu
                  </label>
                  <textarea
                    value={section.text}
                    onChange={(e) => handleFieldChange(section.id, 'text', e.target.value)}
                    rows={4}
                    className="w-full border border-black/8 rounded-lg px-3 py-2 text-sm bg-background focus:outline-hidden focus:ring-2 focus:ring-black/10 resize-y"
                  />
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(section.id)}
                disabled={deletingId === section.id}
                className="shrink-0 p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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
      </div>
      )}
    </div>
  );
}
