'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Edit3, Trash2, Eye, Loader2, ArrowLeft, Save, Upload, Star, StarOff,
  Image as ImageIcon, X, Globe, Lock,
} from 'lucide-react';
import { RichTextEditor } from '@/components/RichTextEditor';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  sections: string[];
  status: 'draft' | 'published' | 'archived';
  content_type: 'free' | 'premium';
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  author_name: string;
  main_image_url: string | null;
}

interface ArticleForm {
  id?: string;
  title: string;
  subtitle: string;
  slug: string;
  excerpt: string;
  category: string;
  sections: string[];
  content_type: string;
  is_featured: boolean;
  featured_order: number;
  author_name: string;
  main_image_url: string;
  main_image_alt: string;
  main_image_caption: string;
  body: string;
  read_time: number;
  tags: string[];
  seo_title: string;
  seo_description: string;
  status: string;
  published_at: string;
}

const EMPTY_FORM: ArticleForm = {
  title: '',
  subtitle: '',
  slug: '',
  excerpt: '',
  category: 'economie',
  sections: ['economie'],
  content_type: 'free',
  is_featured: false,
  featured_order: 0,
  author_name: 'NFI Report',
  main_image_url: '',
  main_image_alt: '',
  main_image_caption: '',
  body: '',
  read_time: 3,
  tags: [],
  seo_title: '',
  seo_description: '',
  status: 'draft',
  published_at: '',
};

const SECTIONS = [
  { value: 'economie', label: 'Économie' },
  { value: 'finance', label: 'Finance' },
  { value: 'marches', label: 'Marchés' },
  { value: 'entreprises', label: 'Entreprises' },
  { value: 'niger', label: 'Niger' },
  { value: 'education', label: 'Éducation' },
];

const CONTENT_TYPES = [
  { value: 'free', label: 'Gratuit', icon: Globe, color: 'text-green-600' },
  { value: 'premium', label: 'Premium', icon: Lock, color: 'text-amber-600' },
];

// ─── Main Component ─────────────────────────────────────────────────────────

export function ArticlesManager() {
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ArticleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [tagInput, setTagInput] = useState('');
  const [togglingFeatured, setTogglingFeatured] = useState<string | null>(null);
  const [featuredWarning, setFeaturedWarning] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/articles');
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const slugify = (text: string) =>
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleNew = () => {
    setForm(EMPTY_FORM);
    setEditing(true);
    setError('');
    setSuccess('');
  };

  const handleEdit = async (article: ArticleRow) => {
    setError('');
    setSuccess('');
    // Fetch full article data
    try {
      const res = await fetch('/api/admin/articles');
      if (!res.ok) return;
      const all = await res.json();
      const full = all.find((a: ArticleRow) => a.id === article.id);
      if (!full) return;

      // We need the full body too - fetch it via a specific call
      const detailRes = await fetch(`/api/admin/articles?id=${article.id}`);
      // For now, use what we have
      setForm({
        id: full.id,
        title: full.title || '',
        subtitle: full.subtitle || '',
        slug: full.slug || '',
        excerpt: full.excerpt || '',
        category: full.category || 'economie',
        sections: full.sections || [full.category || 'economie'],
        content_type: full.content_type || 'free',
        is_featured: full.is_featured || false,
        featured_order: full.featured_order || 0,
        author_name: full.author_name || 'NFI Report',
        main_image_url: full.main_image_url || '',
        main_image_alt: full.main_image_alt || '',
        main_image_caption: full.main_image_caption || '',
        body: full.body || '',
        read_time: full.read_time || 3,
        tags: full.tags || [],
        seo_title: full.seo_title || '',
        seo_description: full.seo_description || '',
        status: full.status || 'draft',
        published_at: full.published_at ? full.published_at.slice(0, 16) : '',
      });
      setEditing(true);
    } catch { /* ignore */ }
  };

  const handleSave = async (publishNow = false) => {
    if (!form.title.trim()) { setError('Le titre est requis'); return; }
    setSaving(true);
    setError('');
    setSuccess('');

    const slug = form.slug || slugify(form.title);
    const sections = form.sections.length > 0 ? form.sections : ['economie'];
    const payload = {
      ...form,
      slug,
      category: sections[0],
      sections,
      status: publishNow ? 'published' : form.status,
      published_at: publishNow && !form.published_at ? new Date().toISOString() : form.published_at || null,
    };

    try {
      const method = form.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/articles', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erreur'); setSaving(false); return; }

      // If featured was toggled on, use atomic endpoint to ensure only one featured
      if (payload.is_featured) {
        await fetch('/api/admin/articles/featured', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId: data.id }),
        });
      }

      setSuccess(publishNow ? 'Article publié !' : 'Article sauvegardé !');
      setForm({ ...form, id: data.id, slug: data.slug, status: data.status, published_at: data.published_at || '' });
      fetchArticles();
    } catch (e: any) {
      setError(e.message || 'Erreur');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return;
    try {
      await fetch(`/api/admin/articles?id=${id}`, { method: 'DELETE' });
      fetchArticles();
    } catch { /* ignore */ }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erreur upload'); setUploading(false); return; }
      setForm((f) => ({ ...f, main_image_url: data.url }));
    } catch (err: any) {
      setError(err.message || 'Erreur upload');
    }
    setUploading(false);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  };

  const handleToggleFeatured = async (article: ArticleRow) => {
    setTogglingFeatured(article.id);
    setFeaturedWarning('');
    try {
      if (article.is_featured) {
        // Trying to unfeature — server will block if it's the only one
        const res = await fetch(`/api/admin/articles/featured?articleId=${article.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) {
          setFeaturedWarning(data.error || 'Erreur');
          setTogglingFeatured(null);
          return;
        }
      } else {
        // Set as featured — atomic: unfeaturing all others first
        const res = await fetch('/api/admin/articles/featured', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId: article.id }),
        });
        if (!res.ok) {
          const data = await res.json();
          setFeaturedWarning(data.error || 'Erreur');
          setTogglingFeatured(null);
          return;
        }
      }
      await fetchArticles();
    } catch { /* ignore */ }
    setTogglingFeatured(null);
  };

  // ─── Editor View ──────────────────────────────────────────────────────────

  if (editing) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => { setEditing(false); setError(''); setSuccess(''); }}
            className="flex items-center gap-2 text-[13px] text-gray-500 hover:text-black transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div className="flex gap-2">
            <button onClick={() => handleSave(false)} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-black/[0.08] rounded-lg text-[13px] hover:bg-gray-50 disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Sauvegarder brouillon
            </button>
            <button onClick={() => handleSave(true)} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#111] text-white rounded-lg text-[13px] hover:bg-[#333] disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
              Publier
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">{success}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Title */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-1.5">Titre *</label>
              <input type="text" value={form.title}
                onChange={(e) => setForm((f) => ({
                  ...f,
                  title: e.target.value,
                  slug: f.id ? f.slug : slugify(e.target.value),
                }))}
                className="w-full px-4 py-3 border border-black/[0.08] rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                placeholder="Titre de l'article"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-1.5">Sous-titre</label>
              <input type="text" value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                className="w-full px-4 py-2.5 border border-black/[0.08] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                placeholder="Sous-titre (optionnel)"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-1.5">Extrait</label>
              <textarea value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 border border-black/[0.08] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white resize-none"
                placeholder="Court résumé de l'article..."
              />
            </div>

            {/* Main Image */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-1.5">Image principale</label>
              {form.main_image_url ? (
                <div className="relative rounded-lg overflow-hidden border border-black/[0.08]">
                  <img src={form.main_image_url} alt={form.main_image_alt || form.title} className="w-full h-48 object-cover" />
                  <button onClick={() => setForm((f) => ({ ...f, main_image_url: '' }))}
                    className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-black/[0.1] rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Cliquer pour uploader une image</span>
                      <span className="text-[11px] text-gray-400 mt-1">JPG, PNG, WebP (max 5MB)</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
              <input type="text" value={form.main_image_alt}
                onChange={(e) => setForm((f) => ({ ...f, main_image_alt: e.target.value }))}
                className="w-full px-3 py-2 border border-black/[0.08] rounded-lg text-[12px] focus:outline-none bg-white mt-2"
                placeholder="Texte alternatif de l'image (SEO)"
              />
              <input type="text" value={form.main_image_caption}
                onChange={(e) => setForm((f) => ({ ...f, main_image_caption: e.target.value }))}
                className="w-full px-3 py-2 border border-black/[0.08] rounded-lg text-[12px] focus:outline-none bg-white mt-2"
                placeholder="Légende de l'image (optionnel, visible sous l'image)"
              />
            </div>

            {/* Body (Rich Text Editor) */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-1.5">Contenu de l&apos;article</label>
              <RichTextEditor
                content={form.body}
                onChange={(html) => setForm((f) => ({ ...f, body: html }))}
                onImageUpload={async (file) => {
                  const formData = new FormData();
                  formData.append('file', file);
                  const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Upload failed');
                  return data.url;
                }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status */}
            <div className="bg-white border border-black/[0.06] rounded-xl p-4">
              <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-2">Statut</label>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium ${
                form.status === 'published' ? 'bg-green-100 text-green-700' :
                form.status === 'archived' ? 'bg-gray-100 text-gray-600' :
                'bg-amber-100 text-amber-700'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  form.status === 'published' ? 'bg-green-500' :
                  form.status === 'archived' ? 'bg-gray-400' :
                  'bg-amber-500'
                }`} />
                {form.status === 'published' ? 'Publié' : form.status === 'archived' ? 'Archivé' : 'Brouillon'}
              </div>
              {form.id && form.status === 'published' && (
                <a href={`/articles/${form.slug}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 mt-3 text-[12px] text-blue-600 hover:underline">
                  <Eye className="w-3.5 h-3.5" /> Voir l&apos;article
                </a>
              )}
            </div>

            {/* Slug */}
            <div className="bg-white border border-black/[0.06] rounded-xl p-4">
              <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-1.5">Slug (URL)</label>
              <div className="flex items-center gap-1 text-[12px] text-gray-400 mb-1">/articles/</div>
              <input type="text" value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full px-3 py-2 border border-black/[0.08] rounded-lg text-[13px] focus:outline-none bg-white font-mono"
              />
            </div>

            {/* Sections (multi-select) */}
            <div className="bg-white border border-black/[0.06] rounded-xl p-4">
              <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-2">Sections</label>
              <div className="space-y-1.5">
                {SECTIONS.map((s) => {
                  const checked = form.sections.includes(s.value);
                  return (
                    <label key={s.value} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      checked ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}>
                      <input type="checkbox" checked={checked}
                        onChange={() => {
                          setForm((f) => {
                            const next = checked
                              ? f.sections.filter((v) => v !== s.value)
                              : [...f.sections, s.value];
                            return { ...f, sections: next, category: next[0] || 'economie' };
                          });
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" />
                      <span className="text-sm">{s.label}</span>
                    </label>
                  );
                })}
              </div>
              {form.sections.length === 0 && (
                <p className="text-[11px] text-red-500 mt-2">Selectionnez au moins une section</p>
              )}
            </div>

            {/* Content type */}
            <div className="bg-white border border-black/[0.06] rounded-xl p-4">
              <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-2">Niveau d&apos;accès</label>
              <div className="space-y-1.5">
                {CONTENT_TYPES.map((ct) => (
                  <label key={ct.value} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    form.content_type === ct.value ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}>
                    <input type="radio" name="content_type" value={ct.value} checked={form.content_type === ct.value}
                      onChange={(e) => setForm((f) => ({ ...f, content_type: e.target.value }))}
                      className="hidden" />
                    <ct.icon className={`w-4 h-4 ${ct.color}`} />
                    <span className="text-sm">{ct.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Featured */}
            <div className="bg-white border border-black/[0.06] rounded-xl p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_featured}
                  onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300" />
                <div>
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500" /> A la une
                  </span>
                  <span className="text-[11px] text-gray-400 block">Affiche en hero sur la page d&apos;accueil</span>
                </div>
              </label>
            </div>

            {/* Author & Read time */}
            <div className="bg-white border border-black/[0.06] rounded-xl p-4 space-y-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-1.5">Auteur</label>
                <input type="text" value={form.author_name}
                  onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-black/[0.08] rounded-lg text-sm focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-1.5">Temps de lecture (min)</label>
                <input type="number" value={form.read_time} min={1}
                  onChange={(e) => setForm((f) => ({ ...f, read_time: parseInt(e.target.value) || 3 }))}
                  className="w-full px-3 py-2 border border-black/[0.08] rounded-lg text-sm focus:outline-none bg-white"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white border border-black/[0.06] rounded-xl p-4">
              <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-1.5">Tags</label>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {form.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-[12px] rounded-full">
                    #{tag}
                    <button onClick={() => handleRemoveTag(tag)} className="text-gray-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input type="text" value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                  className="flex-1 px-3 py-1.5 border border-black/[0.08] rounded-lg text-[12px] focus:outline-none bg-white"
                  placeholder="Ajouter un tag..."
                />
                <button onClick={handleAddTag}
                  className="px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[12px] hover:bg-gray-200">
                  +
                </button>
              </div>
            </div>

            {/* SEO */}
            <div className="bg-white border border-black/[0.06] rounded-xl p-4 space-y-3">
              <p className="text-[11px] uppercase tracking-wider text-gray-400">SEO</p>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Titre SEO</label>
                <input type="text" value={form.seo_title}
                  onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))}
                  className="w-full px-3 py-2 border border-black/[0.08] rounded-lg text-[12px] focus:outline-none bg-white"
                  placeholder="Laisser vide pour utiliser le titre"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Description SEO</label>
                <textarea value={form.seo_description}
                  onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-black/[0.08] rounded-lg text-[12px] focus:outline-none bg-white resize-none"
                  placeholder="Laisser vide pour utiliser l'extrait"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Articles List View ───────────────────────────────────────────────────

  const filteredArticles = articles.filter((a) => {
    if (filter === 'published') return a.status === 'published';
    if (filter === 'draft') return a.status === 'draft';
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'published', 'draft'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[13px] transition-all ${
                filter === f ? 'bg-[#111] text-white' : 'bg-white border border-black/[0.06] text-gray-600 hover:bg-gray-50'
              }`}>
              {f === 'all' ? `Tous (${articles.length})` : f === 'published' ? `Publies (${articles.filter((a) => a.status === 'published').length})` : `Brouillons (${articles.filter((a) => a.status === 'draft').length})`}
            </button>
          ))}
        </div>
        <button onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#111] text-white rounded-lg text-[13px] hover:bg-[#333] transition-colors">
          <Plus className="w-4 h-4" /> Nouvel article
        </button>
      </div>

      {featuredWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />
          {featuredWarning}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">Aucun article</p>
          <button onClick={handleNew}
            className="px-4 py-2 bg-[#111] text-white rounded-lg text-sm hover:bg-[#333]">
            Créer le premier article
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.04]">
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Article</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Sections</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Statut</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Accès</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Date</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map((a) => (
                <tr key={a.id} className="border-b border-black/[0.03] last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {a.main_image_url ? (
                        <img src={a.main_image_url} alt={a.title || 'Article'} className="w-12 h-8 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-4 h-4 text-gray-300" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium line-clamp-1 flex items-center gap-1.5">
                          {a.is_featured && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] uppercase tracking-wider rounded font-bold flex-shrink-0">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> À la une
                            </span>
                          )}
                          {a.title}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono">/articles/{a.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(a.sections || [a.category]).map((s) => (
                        <span key={s} className="text-[10px] uppercase tracking-wider text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
                      a.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${a.status === 'published' ? 'bg-green-500' : 'bg-amber-500'}`} />
                      {a.status === 'published' ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] uppercase tracking-wider px-2 py-0.5 rounded ${
                      a.content_type === 'premium' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {a.content_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-gray-500">
                    {a.published_at ? new Date(a.published_at).toLocaleDateString('fr-FR') : new Date(a.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleToggleFeatured(a)}
                        disabled={togglingFeatured === a.id}
                        className={`p-1.5 rounded transition-colors ${
                          a.is_featured
                            ? 'bg-amber-100 hover:bg-amber-200'
                            : 'hover:bg-amber-50'
                        }`}
                        title={a.is_featured ? 'Retirer de la une' : 'Mettre à la une'}
                      >
                        {togglingFeatured === a.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                        ) : a.is_featured ? (
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        ) : (
                          <StarOff className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </button>
                      <button onClick={() => handleEdit(a)} className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Modifier">
                        <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      {a.status === 'published' && (
                        <a href={`/articles/${a.slug}`} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Voir">
                          <Eye className="w-3.5 h-3.5 text-gray-500" />
                        </a>
                      )}
                      <button onClick={() => handleDelete(a.id)} className="p-1.5 hover:bg-red-50 rounded transition-colors" title="Supprimer">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
