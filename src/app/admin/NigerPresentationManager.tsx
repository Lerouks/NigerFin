'use client';

import { useState, useEffect } from 'react';
import {
  Loader2, Save, MapPin, Upload, Eye, EyeOff, ChevronDown, ChevronUp,
  BarChart3, Globe, Pickaxe, Pencil,
} from 'lucide-react';

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
  is_visible: boolean;
}

interface Indicator {
  id: string;
  indicator_key: string;
  label: string;
  value: string;
  previous_value: string;
  unit: string;
  category: string;
  display_order: number;
  is_visible: boolean;
}

interface Region {
  id: string;
  name: string;
  capital: string;
  population: number;
  area_km2: string;
  economic_activities: string[];
  natural_resources: string[];
  security_level: string;
  security_note: string;
  is_visible: boolean;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  location_name: string;
  estimated_production: string;
  production_unit: string;
  operating_companies: string[];
  economic_importance: string;
  importance_description: string;
  is_visible: boolean;
}

type SubTab = 'presentation' | 'facts' | 'indicators' | 'regions' | 'resources';

const SUB_TABS: { id: SubTab; label: string; icon: typeof MapPin }[] = [
  { id: 'presentation', label: 'Présentation', icon: MapPin },
  { id: 'facts', label: 'Données clés', icon: Globe },
  { id: 'indicators', label: 'Indicateurs', icon: BarChart3 },
  { id: 'regions', label: 'Régions', icon: MapPin },
  { id: 'resources', label: 'Ressources', icon: Pickaxe },
];

export function NigerPresentationManager() {
  const [subTab, setSubTab] = useState<SubTab>('presentation');
  const [presentation, setPresentation] = useState<Presentation>({
    map_image_url: '',
    map_image_alt: 'Carte du Niger',
    intro_title: 'Republique du Niger',
    intro_text: '',
  });
  const [facts, setFacts] = useState<Fact[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
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
        if (data.indicators) setIndicators(data.indicators);
        if (data.regions) setRegions(data.regions);
        if (data.resources) setResources(data.resources);
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
        body: JSON.stringify({ presentation, facts, indicators, regions, resources }),
      });
      if (res.ok) {
        setMessage('Sauvegarde réussie');
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
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setPresentation((prev) => ({ ...prev, map_image_url: data.url }));
      }
    } catch {}
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const visibleCounts = {
    facts: facts.filter((f) => f.is_visible).length,
    indicators: indicators.filter((i) => i.is_visible).length,
    regions: regions.filter((r) => r.is_visible).length,
    resources: resources.filter((r) => r.is_visible).length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Section Niger</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#111] text-white rounded-lg text-[13px] hover:bg-[#333] disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Sauvegarder tout
        </button>
      </div>

      {message && (
        <div className={`px-4 py-2 rounded-lg text-[13px] ${message.includes('réussie') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] transition-all ${
                subTab === tab.id
                  ? 'bg-[#111] text-white'
                  : 'bg-white border border-black/[0.06] text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id !== 'presentation' && (
                <span className={`text-[10px] ml-1 ${subTab === tab.id ? 'text-white/60' : 'text-gray-400'}`}>
                  {visibleCounts[tab.id as keyof typeof visibleCounts]}/{
                    tab.id === 'facts' ? facts.length :
                    tab.id === 'indicators' ? indicators.length :
                    tab.id === 'regions' ? regions.length :
                    resources.length
                  }
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Presentation tab */}
      {subTab === 'presentation' && (
        <PresentationEditor
          presentation={presentation}
          setPresentation={setPresentation}
          uploading={uploading}
          onImageUpload={handleImageUpload}
        />
      )}

      {/* Facts tab */}
      {subTab === 'facts' && (
        <FactsEditor facts={facts} setFacts={setFacts} />
      )}

      {/* Indicators tab */}
      {subTab === 'indicators' && (
        <IndicatorsEditor indicators={indicators} setIndicators={setIndicators} />
      )}

      {/* Regions tab */}
      {subTab === 'regions' && (
        <RegionsEditor regions={regions} setRegions={setRegions} />
      )}

      {/* Resources tab */}
      {subTab === 'resources' && (
        <ResourcesEditor resources={resources} setResources={setResources} />
      )}
    </div>
  );
}

/* ─── Visibility Toggle ─────────────────────────────────────────────── */

function VisibilityToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
        visible
          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          : 'bg-red-50 text-red-500 hover:bg-red-100'
      }`}
      title={visible ? 'Visible — cliquer pour masquer' : 'Masqué — cliquer pour afficher'}
    >
      {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
      {visible ? 'Visible' : 'Masqué'}
    </button>
  );
}

/* ─── Presentation Editor ────────────────────────────────────────────── */

function PresentationEditor({
  presentation, setPresentation, uploading, onImageUpload,
}: {
  presentation: Presentation;
  setPresentation: (fn: (p: Presentation) => Presentation) => void;
  uploading: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-black/[0.06] p-6 space-y-5">
      <h3 className="text-sm font-semibold">Carte et introduction</h3>

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
                <input type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
              </label>
            </div>
          </div>
          {presentation.map_image_url && (
            <div className="w-24 h-20 rounded-lg overflow-hidden bg-gray-100 border border-black/[0.06] flex-shrink-0">
              <img src={presentation.map_image_url} alt="Carte du Niger" className="w-full h-full object-contain" />
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
  );
}

/* ─── Facts Editor ───────────────────────────────────────────────────── */

function FactsEditor({ facts, setFacts }: { facts: Fact[]; setFacts: (f: Fact[]) => void }) {
  const update = (id: string, field: string, value: string | number | boolean) => {
    setFacts(facts.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const toggleAll = (visible: boolean) => {
    setFacts(facts.map((f) => ({ ...f, is_visible: visible })));
  };

  return (
    <div className="bg-white rounded-xl border border-black/[0.06] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Données clés</h3>
          <p className="text-[12px] text-gray-400 mt-0.5">Modifiez les labels, valeurs et visibilité des données affichées.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => toggleAll(true)} className="text-[11px] px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
            Tout afficher
          </button>
          <button onClick={() => toggleAll(false)} className="text-[11px] px-2 py-1 rounded bg-red-50 text-red-500 hover:bg-red-100">
            Tout masquer
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {facts.map((fact) => (
          <div
            key={fact.id}
            className={`grid grid-cols-12 gap-3 items-center p-3 rounded-lg border transition-colors ${
              fact.is_visible ? 'bg-[#fafaf9] border-black/[0.04]' : 'bg-red-50/30 border-red-100/50'
            }`}
          >
            <div className="col-span-1">
              <VisibilityToggle
                visible={fact.is_visible}
                onToggle={() => update(fact.id, 'is_visible', !fact.is_visible)}
              />
            </div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase tracking-wider text-gray-400">{fact.fact_key}</span>
            </div>
            <div className="col-span-3">
              <input
                type="text"
                value={fact.label}
                onChange={(e) => update(fact.id, 'label', e.target.value)}
                className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none focus:border-black/15"
                placeholder="Label"
              />
            </div>
            <div className="col-span-3">
              <input
                type="text"
                value={fact.value}
                onChange={(e) => update(fact.id, 'value', e.target.value)}
                className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none focus:border-black/15"
                placeholder="Valeur"
              />
            </div>
            <div className="col-span-2">
              <select
                value={fact.category}
                onChange={(e) => update(fact.id, 'category', e.target.value)}
                className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[12px] bg-white focus:outline-none"
              >
                <option value="general">Général</option>
                <option value="economie">Économie</option>
                <option value="demographie">Démographie</option>
                <option value="geographie">Géographie</option>
              </select>
            </div>
            <div className="col-span-1">
              <input
                type="number"
                value={fact.display_order}
                onChange={(e) => update(fact.id, 'display_order', parseInt(e.target.value) || 0)}
                className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[12px] bg-white focus:outline-none text-center"
                title="Ordre"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Indicators Editor ──────────────────────────────────────────────── */

function IndicatorsEditor({ indicators, setIndicators }: { indicators: Indicator[]; setIndicators: (i: Indicator[]) => void }) {
  const [editId, setEditId] = useState<string | null>(null);

  const update = (id: string, field: string, value: string | number | boolean) => {
    setIndicators(indicators.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const toggleAll = (visible: boolean) => {
    setIndicators(indicators.map((i) => ({ ...i, is_visible: visible })));
  };

  const CATS: Record<string, string> = { macro: 'Macro', prix: 'Prix', change: 'Change' };

  return (
    <div className="bg-white rounded-xl border border-black/[0.06] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Indicateurs économiques</h3>
          <p className="text-[12px] text-gray-400 mt-0.5">Éditez les valeurs et contrôlez la visibilité de chaque indicateur.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => toggleAll(true)} className="text-[11px] px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
            Tout afficher
          </button>
          <button onClick={() => toggleAll(false)} className="text-[11px] px-2 py-1 rounded bg-red-50 text-red-500 hover:bg-red-100">
            Tout masquer
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-black/[0.06]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/[0.04] bg-[#fafaf9]">
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-2.5">Visibilité</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-2.5">Label</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-2.5">Catégorie</th>
              <th className="text-right text-[11px] uppercase tracking-wider text-gray-400 px-4 py-2.5">Valeur</th>
              <th className="text-right text-[11px] uppercase tracking-wider text-gray-400 px-4 py-2.5">Précédent</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-2.5">Unité</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 px-4 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {indicators.map((ind) => {
              const isEditing = editId === ind.id;
              return (
                <tr
                  key={ind.id}
                  className={`border-b border-black/[0.03] last:border-0 transition-colors ${
                    !ind.is_visible ? 'bg-red-50/30' : isEditing ? 'bg-blue-50/40' : 'hover:bg-gray-50/50'
                  }`}
                >
                  <td className="px-4 py-3">
                    <VisibilityToggle visible={ind.is_visible} onToggle={() => update(ind.id, 'is_visible', !ind.is_visible)} />
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={ind.label}
                        onChange={(e) => update(ind.id, 'label', e.target.value)}
                        className="w-full border border-black/[0.08] rounded px-2 py-1 text-[13px] bg-white focus:outline-none"
                      />
                    ) : (
                      <span className="text-[13px]">{ind.label}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select
                        value={ind.category}
                        onChange={(e) => update(ind.id, 'category', e.target.value)}
                        className="border border-black/[0.08] rounded px-2 py-1 text-[12px] bg-white focus:outline-none"
                      >
                        <option value="macro">Macro</option>
                        <option value="prix">Prix</option>
                        <option value="change">Change</option>
                      </select>
                    ) : (
                      <span className="text-[11px] px-2 py-1 rounded bg-gray-100 text-gray-600">{CATS[ind.category] || ind.category}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <input
                        type="text"
                        value={ind.value}
                        onChange={(e) => update(ind.id, 'value', e.target.value)}
                        className="w-20 border border-black/[0.08] rounded px-2 py-1 text-[13px] bg-white focus:outline-none text-right"
                      />
                    ) : (
                      <span className="text-[13px] font-medium tabular-nums">{ind.value}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <input
                        type="text"
                        value={ind.previous_value}
                        onChange={(e) => update(ind.id, 'previous_value', e.target.value)}
                        className="w-20 border border-black/[0.08] rounded px-2 py-1 text-[13px] bg-white focus:outline-none text-right"
                      />
                    ) : (
                      <span className="text-[13px] text-gray-400 tabular-nums">{ind.previous_value}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={ind.unit}
                        onChange={(e) => update(ind.id, 'unit', e.target.value)}
                        className="w-20 border border-black/[0.08] rounded px-2 py-1 text-[13px] bg-white focus:outline-none"
                      />
                    ) : (
                      <span className="text-[12px] text-gray-400">{ind.unit}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditId(isEditing ? null : ind.id)}
                      className={`p-1.5 rounded transition-colors ${
                        isEditing ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'
                      }`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {indicators.length === 0 && (
          <p className="text-center py-8 text-sm text-gray-400">Aucun indicateur</p>
        )}
      </div>
    </div>
  );
}

/* ─── Regions Editor ─────────────────────────────────────────────────── */

function RegionsEditor({ regions, setRegions }: { regions: Region[]; setRegions: (r: Region[]) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const update = (id: string, field: string, value: string | number | boolean | string[]) => {
    setRegions(regions.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const toggleAll = (visible: boolean) => {
    setRegions(regions.map((r) => ({ ...r, is_visible: visible })));
  };

  const SECURITY_LABELS: Record<string, string> = {
    stable: 'Stable',
    moderate: 'Modéré',
    elevated: 'Vigilance',
    critical: 'Critique',
  };

  return (
    <div className="bg-white rounded-xl border border-black/[0.06] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Régions du Niger</h3>
          <p className="text-[12px] text-gray-400 mt-0.5">Gérez les informations et la visibilité de chaque région.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => toggleAll(true)} className="text-[11px] px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
            Tout afficher
          </button>
          <button onClick={() => toggleAll(false)} className="text-[11px] px-2 py-1 rounded bg-red-50 text-red-500 hover:bg-red-100">
            Tout masquer
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {regions.map((region) => {
          const isExpanded = expandedId === region.id;
          return (
            <div
              key={region.id}
              className={`rounded-lg border transition-colors ${
                !region.is_visible ? 'bg-red-50/30 border-red-100/50' : 'bg-[#fafaf9] border-black/[0.04]'
              }`}
            >
              {/* Row header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <VisibilityToggle
                  visible={region.is_visible}
                  onToggle={() => update(region.id, 'is_visible', !region.is_visible)}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-medium">{region.name}</span>
                  <span className="text-[11px] text-gray-400 ml-2">Capitale : {region.capital}</span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded ${
                  region.security_level === 'stable' ? 'bg-emerald-50 text-emerald-700' :
                  region.security_level === 'moderate' ? 'bg-amber-50 text-amber-700' :
                  region.security_level === 'elevated' ? 'bg-orange-50 text-orange-700' :
                  region.security_level === 'critical' ? 'bg-red-50 text-red-700' :
                  'bg-gray-50 text-gray-600'
                }`}>
                  {SECURITY_LABELS[region.security_level] || region.security_level}
                </span>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : region.id)}
                  className="p-1.5 rounded hover:bg-gray-200 text-gray-400 transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Expanded edit form */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-black/[0.04] pt-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Nom</label>
                      <input
                        type="text"
                        value={region.name}
                        onChange={(e) => update(region.id, 'name', e.target.value)}
                        className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Capitale</label>
                      <input
                        type="text"
                        value={region.capital}
                        onChange={(e) => update(region.id, 'capital', e.target.value)}
                        className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Population</label>
                      <input
                        type="number"
                        value={region.population}
                        onChange={(e) => update(region.id, 'population', parseInt(e.target.value) || 0)}
                        className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Superficie (km²)</label>
                      <input
                        type="text"
                        value={region.area_km2}
                        onChange={(e) => update(region.id, 'area_km2', e.target.value)}
                        className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Niveau de sécurité</label>
                      <select
                        value={region.security_level}
                        onChange={(e) => update(region.id, 'security_level', e.target.value)}
                        className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none"
                      >
                        <option value="stable">Stable</option>
                        <option value="moderate">Modéré</option>
                        <option value="elevated">Vigilance</option>
                        <option value="critical">Critique</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Note sécurité</label>
                      <input
                        type="text"
                        value={region.security_note}
                        onChange={(e) => update(region.id, 'security_note', e.target.value)}
                        className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Activités économiques (séparées par virgule)</label>
                      <input
                        type="text"
                        value={region.economic_activities.join(', ')}
                        onChange={(e) => update(region.id, 'economic_activities', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                        className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Ressources naturelles (séparées par virgule)</label>
                      <input
                        type="text"
                        value={region.natural_resources.join(', ')}
                        onChange={(e) => update(region.id, 'natural_resources', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                        className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {regions.length === 0 && (
        <p className="text-center py-8 text-sm text-gray-400">Aucune région</p>
      )}
    </div>
  );
}

/* ─── Resources Editor ───────────────────────────────────────────────── */

function ResourcesEditor({ resources, setResources }: { resources: Resource[]; setResources: (r: Resource[]) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const update = (id: string, field: string, value: string | boolean | string[]) => {
    setResources(resources.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const toggleAll = (visible: boolean) => {
    setResources(resources.map((r) => ({ ...r, is_visible: visible })));
  };

  const IMPORTANCE_LABELS: Record<string, string> = {
    critique: 'Critique',
    majeure: 'Majeure',
    moderee: 'Modérée',
  };

  return (
    <div className="bg-white rounded-xl border border-black/[0.06] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Ressources stratégiques</h3>
          <p className="text-[12px] text-gray-400 mt-0.5">Gérez les ressources naturelles et leur visibilité.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => toggleAll(true)} className="text-[11px] px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
            Tout afficher
          </button>
          <button onClick={() => toggleAll(false)} className="text-[11px] px-2 py-1 rounded bg-red-50 text-red-500 hover:bg-red-100">
            Tout masquer
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {resources.map((res) => {
          const isExpanded = expandedId === res.id;
          return (
            <div
              key={res.id}
              className={`rounded-lg border transition-colors ${
                !res.is_visible ? 'bg-red-50/30 border-red-100/50' : 'bg-[#fafaf9] border-black/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <VisibilityToggle
                  visible={res.is_visible}
                  onToggle={() => update(res.id, 'is_visible', !res.is_visible)}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-medium">{res.name}</span>
                  <span className="text-[11px] text-gray-400 ml-2">{res.location_name}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
                  res.economic_importance === 'critique' ? 'bg-red-50 text-red-700 border-red-100' :
                  res.economic_importance === 'majeure' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  'bg-blue-50 text-blue-700 border-blue-100'
                }`}>
                  {IMPORTANCE_LABELS[res.economic_importance] || res.economic_importance}
                </span>
                <span className="text-[11px] text-gray-400">{res.type}</span>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : res.id)}
                  className="p-1.5 rounded hover:bg-gray-200 text-gray-400 transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-black/[0.04] pt-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Nom</label>
                      <input
                        type="text"
                        value={res.name}
                        onChange={(e) => update(res.id, 'name', e.target.value)}
                        className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Type</label>
                      <select
                        value={res.type}
                        onChange={(e) => update(res.id, 'type', e.target.value)}
                        className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none"
                      >
                        <option value="uranium">Uranium</option>
                        <option value="petrole">Pétrole</option>
                        <option value="or">Or</option>
                        <option value="charbon">Charbon</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Localisation</label>
                      <input
                        type="text"
                        value={res.location_name}
                        onChange={(e) => update(res.id, 'location_name', e.target.value)}
                        className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Importance</label>
                      <select
                        value={res.economic_importance}
                        onChange={(e) => update(res.id, 'economic_importance', e.target.value)}
                        className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none"
                      >
                        <option value="critique">Critique</option>
                        <option value="majeure">Majeure</option>
                        <option value="moderee">Modérée</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Production estimée</label>
                      <input
                        type="text"
                        value={res.estimated_production}
                        onChange={(e) => update(res.id, 'estimated_production', e.target.value)}
                        className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Unité production</label>
                      <input
                        type="text"
                        value={res.production_unit}
                        onChange={(e) => update(res.id, 'production_unit', e.target.value)}
                        className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Entreprises (séparées par virgule)</label>
                      <input
                        type="text"
                        value={res.operating_companies.join(', ')}
                        onChange={(e) => update(res.id, 'operating_companies', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                        className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Description importance</label>
                    <textarea
                      value={res.importance_description}
                      onChange={(e) => update(res.id, 'importance_description', e.target.value)}
                      rows={2}
                      className="w-full border border-black/[0.08] rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none resize-y"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {resources.length === 0 && (
        <p className="text-center py-8 text-sm text-gray-400">Aucune ressource</p>
      )}
    </div>
  );
}
