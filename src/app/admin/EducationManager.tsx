'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Plus, Pencil, Trash2, Check, X, ChevronLeft, Eye, EyeOff,
  BookOpen, Lock, Unlock, Crown,
} from 'lucide-react';

interface Category {
  id: string;
  slug: string;
  title: string;
  icon: string;
  available: boolean;
  sort_order: number;
  lesson_count: number;
}

interface Lesson {
  id: string;
  category_id: string;
  title: string;
  duration: string;
  access_level: 'free' | 'premium';
  sort_order: number;
  content: string;
}

const ACCESS_LEVELS = [
  { value: 'free', label: 'Gratuit', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'premium', label: 'Premium', color: 'bg-blue-100 text-blue-700' },
];

const ICONS = [
  'BookOpen', 'TrendingUp', 'BarChart3', 'LineChart', 'Landmark',
  'PiggyBank', 'Wallet', 'Globe', 'Scale', 'Coins', 'Building2',
  'Briefcase', 'ShieldCheck', 'Banknote', 'Clock',
];

export function EducationManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState({ title: '', slug: '', icon: 'BookOpen', available: true, sort_order: 0 });

  // Lesson form
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editLessonId, setEditLessonId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: '', duration: '5 min', access_level: 'free' as string, sort_order: 0, content: '' });

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/education/categories');
      if (res.ok) setCategories(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const fetchLessons = useCallback(async (categoryId: string) => {
    try {
      const res = await fetch(`/api/admin/education/lessons?category_id=${categoryId}`);
      if (res.ok) setLessons(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { if (selectedCategory) fetchLessons(selectedCategory.id); }, [selectedCategory, fetchLessons]);

  // ── Category CRUD ──
  const handleSaveCategory = async () => {
    setSaving(true);
    try {
      const method = editCatId ? 'PUT' : 'POST';
      const body = editCatId ? { id: editCatId, ...catForm } : catForm;
      const res = await fetch('/api/admin/education/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        resetCatForm();
        fetchCategories();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/education/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteConfirm(null);
        if (selectedCategory?.id === id) setSelectedCategory(null);
        fetchCategories();
      }
    } catch { /* ignore */ }
  };

  const startEditCategory = (cat: Category) => {
    setEditCatId(cat.id);
    setShowCatForm(true);
    setCatForm({ title: cat.title, slug: cat.slug, icon: cat.icon, available: cat.available, sort_order: cat.sort_order });
  };

  const resetCatForm = () => {
    setEditCatId(null);
    setShowCatForm(false);
    setCatForm({ title: '', slug: '', icon: 'BookOpen', available: true, sort_order: 0 });
  };

  const toggleCategoryAvailable = async (cat: Category) => {
    try {
      await fetch('/api/admin/education/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, available: !cat.available }),
      });
      fetchCategories();
    } catch { /* ignore */ }
  };

  // ── Lesson CRUD ──
  const handleSaveLesson = async () => {
    if (!selectedCategory) return;
    setSaving(true);
    try {
      const method = editLessonId ? 'PUT' : 'POST';
      const body = editLessonId
        ? { id: editLessonId, ...lessonForm }
        : { category_id: selectedCategory.id, ...lessonForm };
      const res = await fetch('/api/admin/education/lessons', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        resetLessonForm();
        fetchLessons(selectedCategory.id);
        fetchCategories();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDeleteLesson = async (id: string) => {
    if (!selectedCategory) return;
    try {
      const res = await fetch(`/api/admin/education/lessons?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchLessons(selectedCategory.id);
        fetchCategories();
      }
    } catch { /* ignore */ }
  };

  const startEditLesson = (lesson: Lesson) => {
    setEditLessonId(lesson.id);
    setShowLessonForm(true);
    setLessonForm({
      title: lesson.title,
      duration: lesson.duration,
      access_level: lesson.access_level,
      sort_order: lesson.sort_order,
      content: lesson.content || '',
    });
  };

  const resetLessonForm = () => {
    setEditLessonId(null);
    setShowLessonForm(false);
    setLessonForm({ title: '', duration: '5 min', access_level: 'free', sort_order: 0, content: '' });
  };

  const getAccessBadge = (level: string) => {
    const al = ACCESS_LEVELS.find((a) => a.value === level);
    return al || ACCESS_LEVELS[0];
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
      </div>
    );
  }

  // ── Lesson detail view ──
  if (selectedCategory) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setSelectedCategory(null); setLessons([]); resetLessonForm(); }}
            className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-black transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour aux catégories
          </button>
          <button
            onClick={() => { resetLessonForm(); setShowLessonForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#111] text-white rounded-lg text-[13px] hover:bg-[#333] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter une leçon
          </button>
        </div>

        <div className="bg-white rounded-xl border border-black/[0.06] p-4">
          <h3 className="font-semibold text-sm">{selectedCategory.title}</h3>
          <p className="text-[12px] text-gray-400 mt-0.5">{lessons.length} leçon{lessons.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Lesson form */}
        {showLessonForm && (
          <div className="bg-white rounded-xl border border-black/[0.06] p-6">
            <h3 className="text-sm font-semibold mb-4">{editLessonId ? 'Modifier la leçon' : 'Nouvelle leçon'}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Titre *</label>
                  <input
                    type="text"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    placeholder="Ex: Introduction à la finance"
                    className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Durée</label>
                  <input
                    type="text"
                    value={lessonForm.duration}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                    placeholder="5 min"
                    className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Accès</label>
                  <select
                    value={lessonForm.access_level}
                    onChange={(e) => setLessonForm({ ...lessonForm, access_level: e.target.value })}
                    className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none"
                  >
                    {ACCESS_LEVELS.map((al) => (
                      <option key={al.value} value={al.value}>{al.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Ordre</label>
                  <input
                    type="number"
                    value={lessonForm.sort_order}
                    onChange={(e) => setLessonForm({ ...lessonForm, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Contenu</label>
                <textarea
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  rows={6}
                  placeholder="Contenu de la leçon..."
                  className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black resize-y"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveLesson}
                  disabled={saving || !lessonForm.title}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#111] text-white rounded-lg text-[13px] hover:bg-[#333] transition-colors disabled:opacity-30"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Enregistrer
                </button>
                <button onClick={resetLessonForm} className="px-4 py-2.5 text-[13px] text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lessons list */}
        <div className="bg-white rounded-xl border border-black/[0.06] divide-y divide-black/[0.04]">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-7 h-7 rounded-full bg-[#f5f5f0] flex items-center justify-center text-[12px] font-medium text-gray-500 flex-shrink-0">
                  {lesson.sort_order}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{lesson.title}</p>
                  <p className="text-[11px] text-gray-400">{lesson.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getAccessBadge(lesson.access_level).color}`}>
                  {getAccessBadge(lesson.access_level).label}
                </span>
                <button onClick={() => startEditLesson(lesson)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors" title="Modifier">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {deleteConfirm === lesson.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDeleteLesson(lesson.id)} className="p-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(lesson.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {lessons.length === 0 && (
            <p className="text-center py-8 text-sm text-gray-400">Aucune leçon dans cette catégorie</p>
          )}
        </div>
      </div>
    );
  }

  // ── Categories list view ──
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-500">{categories.length} catégories</p>
        <button
          onClick={() => { resetCatForm(); setShowCatForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#111] text-white rounded-lg text-[13px] hover:bg-[#333] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter une catégorie
        </button>
      </div>

      {/* Category form */}
      {showCatForm && (
        <div className="bg-white rounded-xl border border-black/[0.06] p-6">
          <h3 className="text-sm font-semibold mb-4">{editCatId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Titre *</label>
                <input
                  type="text"
                  value={catForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = editCatId ? catForm.slug : title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                    setCatForm({ ...catForm, title, slug });
                  }}
                  placeholder="Ex: Les bases de la finance"
                  className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Slug</label>
                <input
                  type="text"
                  value={catForm.slug}
                  onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                  placeholder="bases-finance"
                  className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Ordre</label>
                <input
                  type="number"
                  value={catForm.sort_order}
                  onChange={(e) => setCatForm({ ...catForm, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Icône</label>
                <select
                  value={catForm.icon}
                  onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
                  className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none"
                >
                  {ICONS.map((ic) => (
                    <option key={ic} value={ic}>{ic}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={catForm.available}
                    onChange={(e) => setCatForm({ ...catForm, available: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Visible sur le site</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveCategory}
                disabled={saving || !catForm.title || !catForm.slug}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#111] text-white rounded-lg text-[13px] hover:bg-[#333] transition-colors disabled:opacity-30"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Enregistrer
              </button>
              <button onClick={resetCatForm} className="px-4 py-2.5 text-[13px] text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories grid */}
      <div className="bg-white rounded-xl border border-black/[0.06] divide-y divide-black/[0.04]">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors"
          >
            <button
              onClick={() => setSelectedCategory(cat)}
              className="flex items-center gap-3 min-w-0 text-left flex-1"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cat.available ? 'bg-[#111] text-white' : 'bg-gray-100 text-gray-400'}`}>
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{cat.title}</p>
                <p className="text-[11px] text-gray-400">{cat.lesson_count} leçon{cat.lesson_count !== 1 ? 's' : ''} · /{cat.slug}</p>
              </div>
            </button>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => toggleCategoryAvailable(cat)}
                className={`p-1.5 rounded transition-colors ${cat.available ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}
                title={cat.available ? 'Visible' : 'Masqué'}
              >
                {cat.available ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => startEditCategory(cat)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors" title="Modifier">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {deleteConfirm === cat.id ? (
                <div className="flex items-center gap-1">
                  <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setDeleteConfirm(cat.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-center py-8 text-sm text-gray-400">Aucune catégorie</p>
        )}
      </div>
    </div>
  );
}
