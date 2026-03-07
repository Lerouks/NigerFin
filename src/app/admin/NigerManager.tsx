'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Map, Gem, BarChart3, Globe, Handshake,
  Plus, Trash2, Save, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';

type SubTab = 'regions' | 'resources' | 'indicators' | 'facts' | 'partners';

/* eslint-disable @typescript-eslint/no-explicit-any */

const SUB_TABS: { id: SubTab; label: string; icon: typeof Map }[] = [
  { id: 'regions',    label: 'Régions',        icon: Map },
  { id: 'resources',  label: 'Ressources',     icon: Gem },
  { id: 'indicators', label: 'Indicateurs',    icon: BarChart3 },
  { id: 'facts',      label: 'Carte d\'identité', icon: Globe },
  { id: 'partners',   label: 'Partenaires',    icon: Handshake },
];

export function NigerManager() {
  const [subTab, setSubTab] = useState<SubTab>('regions');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/niger');
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const apiCall = async (action: string, table: string, payload: any, id?: string) => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/niger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, table, data: payload, id }),
      });
      if (!res.ok) {
        const err = await res.json();
        setMessage(`Erreur : ${err.error}`);
      } else {
        setMessage('Sauvegardé !');
        await fetchData();
      }
    } catch {
      setMessage('Erreur réseau');
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  if (!data) return <div className="text-center py-12 text-gray-500">Impossible de charger les données Niger.</div>;

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SUB_TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                subTab === t.id ? 'bg-[#111] text-white' : 'bg-white border border-black/[0.06] text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {message && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-[13px] ${message.includes('Erreur') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {message}
        </div>
      )}

      {subTab === 'regions' && <RegionsEditor regions={data.regions} onSave={apiCall} saving={saving} />}
      {subTab === 'resources' && <ResourcesEditor resources={data.resources} regions={data.regions} onSave={apiCall} saving={saving} />}
      {subTab === 'indicators' && <IndicatorsEditor indicators={data.indicators} onSave={apiCall} saving={saving} />}
      {subTab === 'facts' && <FactsEditor facts={data.facts} onSave={apiCall} saving={saving} />}
      {subTab === 'partners' && <PartnersEditor partners={data.partners} onSave={apiCall} saving={saving} />}
    </div>
  );
}

// ─── Regions Editor ──────────────────────────────────────────────────────────

function RegionsEditor({ regions, onSave, saving }: { regions: any[]; onSave: any; saving: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {regions.map((r: any) => (
        <div key={r.id} className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === r.id ? null : r.id)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
          >
            <div>
              <span className="font-semibold">{r.name}</span>
              <span className="text-gray-400 text-[13px] ml-2">({r.capital})</span>
            </div>
            {expanded === r.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expanded === r.id && (
            <RegionForm region={r} onSave={onSave} saving={saving} />
          )}
        </div>
      ))}
      <button
        onClick={() => onSave('insert', 'niger_regions', { name: 'Nouvelle région', capital: '' })}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-dashed border-black/[0.1] w-full justify-center"
      >
        <Plus className="w-4 h-4" /> Ajouter une région
      </button>
    </div>
  );
}

function RegionForm({ region, onSave, saving }: { region: any; onSave: any; saving: boolean }) {
  const [form, setForm] = useState({ ...region });

  const handleSave = () => {
    const { id, created_at, updated_at, ...rest } = form;
    onSave('update', 'niger_regions', rest, id);
  };

  return (
    <div className="p-4 pt-0 space-y-3 border-t border-black/[0.04]">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nom" value={form.name} onChange={(v: string) => setForm({ ...form, name: v })} />
        <Field label="Capitale" value={form.capital} onChange={(v: string) => setForm({ ...form, capital: v })} />
        <Field label="Population" value={String(form.population || '')} onChange={(v: string) => setForm({ ...form, population: parseInt(v) || 0 })} />
        <Field label="Superficie (km²)" value={String(form.area_km2 || '')} onChange={(v: string) => setForm({ ...form, area_km2: parseFloat(v) || 0 })} />
        <div>
          <label className="block text-[12px] text-gray-400 mb-1">Sécurité</label>
          <select
            value={form.security_level || 'stable'}
            onChange={(e) => setForm({ ...form, security_level: e.target.value })}
            className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-[13px] bg-[#fafaf9]"
          >
            <option value="stable">Stable</option>
            <option value="moderate">Modéré</option>
            <option value="elevated">Élevé</option>
            <option value="critical">Critique</option>
          </select>
        </div>
        <Field label="Note sécurité" value={form.security_note || ''} onChange={(v: string) => setForm({ ...form, security_note: v })} />
      </div>
      <Field label="Activités économiques (virgules)" value={(form.economic_activities || []).join(', ')} onChange={(v: string) => setForm({ ...form, economic_activities: v.split(',').map((s: string) => s.trim()).filter(Boolean) })} />
      <Field label="Ressources naturelles (virgules)" value={(form.natural_resources || []).join(', ')} onChange={(v: string) => setForm({ ...form, natural_resources: v.split(',').map((s: string) => s.trim()).filter(Boolean) })} />
      <div className="flex gap-2 pt-2">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-[#111] text-white rounded-lg text-[13px] hover:bg-[#333] disabled:opacity-50">
          <Save className="w-3.5 h-3.5" /> Sauvegarder
        </button>
        <button onClick={() => onSave('delete', 'niger_regions', null, region.id)} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg text-[13px]">
          <Trash2 className="w-3.5 h-3.5" /> Supprimer
        </button>
      </div>
    </div>
  );
}

// ─── Resources Editor ────────────────────────────────────────────────────────

function ResourcesEditor({ resources, regions, onSave, saving }: { resources: any[]; regions: any[]; onSave: any; saving: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {resources.map((r: any) => (
        <div key={r.id} className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === r.id ? null : r.id)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
          >
            <div>
              <span className="font-semibold">{r.name}</span>
              <span className="text-gray-400 text-[13px] ml-2">({r.type})</span>
            </div>
            {expanded === r.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expanded === r.id && (
            <ResourceForm resource={r} regions={regions} onSave={onSave} saving={saving} />
          )}
        </div>
      ))}
      <button
        onClick={() => onSave('insert', 'niger_resources', { name: 'Nouvelle ressource', type: 'autre', location_name: '' })}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-dashed border-black/[0.1] w-full justify-center"
      >
        <Plus className="w-4 h-4" /> Ajouter une ressource
      </button>
    </div>
  );
}

function ResourceForm({ resource, regions, onSave, saving }: { resource: any; regions: any[]; onSave: any; saving: boolean }) {
  const [form, setForm] = useState({ ...resource });

  const handleSave = () => {
    const { id, created_at, updated_at, niger_regions, ...rest } = form;
    onSave('update', 'niger_resources', rest, id);
  };

  return (
    <div className="p-4 pt-0 space-y-3 border-t border-black/[0.04]">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nom" value={form.name} onChange={(v: string) => setForm({ ...form, name: v })} />
        <div>
          <label className="block text-[12px] text-gray-400 mb-1">Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-[13px] bg-[#fafaf9]">
            <option value="uranium">Uranium</option>
            <option value="petrole">Pétrole</option>
            <option value="or">Or</option>
            <option value="charbon">Charbon</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div>
          <label className="block text-[12px] text-gray-400 mb-1">Région</label>
          <select value={form.region_id || ''} onChange={(e) => setForm({ ...form, region_id: e.target.value || null })} className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-[13px] bg-[#fafaf9]">
            <option value="">Aucune</option>
            {regions.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <Field label="Localisation" value={form.location_name || ''} onChange={(v: string) => setForm({ ...form, location_name: v })} />
        <Field label="Production estimée" value={form.estimated_production || ''} onChange={(v: string) => setForm({ ...form, estimated_production: v })} />
        <Field label="Unité" value={form.production_unit || ''} onChange={(v: string) => setForm({ ...form, production_unit: v })} />
        <div>
          <label className="block text-[12px] text-gray-400 mb-1">Importance</label>
          <select value={form.economic_importance || 'moderee'} onChange={(e) => setForm({ ...form, economic_importance: e.target.value })} className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-[13px] bg-[#fafaf9]">
            <option value="critique">Critique</option>
            <option value="majeure">Majeure</option>
            <option value="moderee">Modérée</option>
            <option value="mineure">Mineure</option>
          </select>
        </div>
      </div>
      <Field label="Entreprises (virgules)" value={(form.operating_companies || []).join(', ')} onChange={(v: string) => setForm({ ...form, operating_companies: v.split(',').map((s: string) => s.trim()).filter(Boolean) })} />
      <div>
        <label className="block text-[12px] text-gray-400 mb-1">Description</label>
        <textarea value={form.importance_description || ''} onChange={(e) => setForm({ ...form, importance_description: e.target.value })} className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-[13px] bg-[#fafaf9] h-20" />
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-[#111] text-white rounded-lg text-[13px] hover:bg-[#333] disabled:opacity-50">
          <Save className="w-3.5 h-3.5" /> Sauvegarder
        </button>
        <button onClick={() => onSave('delete', 'niger_resources', null, resource.id)} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg text-[13px]">
          <Trash2 className="w-3.5 h-3.5" /> Supprimer
        </button>
      </div>
    </div>
  );
}

// ─── Indicators Editor ───────────────────────────────────────────────────────

function IndicatorsEditor({ indicators, onSave, saving }: { indicators: any[]; onSave: any; saving: boolean }) {
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#fafaf9] border-b border-black/[0.04]">
              <th className="text-left px-4 py-2.5 font-medium text-gray-500">Indicateur</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-500">Valeur</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-500">Précédent</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-500">Unité</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-500">Catégorie</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {indicators.map((ind: any) => (
              <IndicatorRow key={ind.id} indicator={ind} onSave={onSave} saving={saving} />
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={() => onSave('insert', 'niger_economic_indicators', { indicator_key: 'new', label: 'Nouvel indicateur', value: 0, unit: '%', category: 'macro' })}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-dashed border-black/[0.1] w-full justify-center"
      >
        <Plus className="w-4 h-4" /> Ajouter un indicateur
      </button>
    </div>
  );
}

function IndicatorRow({ indicator, onSave, saving }: { indicator: any; onSave: any; saving: boolean }) {
  const [form, setForm] = useState({ ...indicator });
  const [dirty, setDirty] = useState(false);

  const update = (key: string, val: any) => {
    setForm({ ...form, [key]: val });
    setDirty(true);
  };

  const handleSave = () => {
    const { id, updated_at, ...rest } = form;
    onSave('update', 'niger_economic_indicators', rest, id);
    setDirty(false);
  };

  return (
    <tr className="border-b border-black/[0.04] last:border-0">
      <td className="px-4 py-2">
        <input value={form.label} onChange={(e) => update('label', e.target.value)} className="border border-black/[0.08] rounded px-2 py-1 text-[13px] w-full bg-[#fafaf9]" />
      </td>
      <td className="px-4 py-2">
        <input type="number" step="0.1" value={form.value} onChange={(e) => update('value', parseFloat(e.target.value))} className="border border-black/[0.08] rounded px-2 py-1 text-[13px] w-20 bg-[#fafaf9]" />
      </td>
      <td className="px-4 py-2">
        <input type="number" step="0.1" value={form.previous_value || ''} onChange={(e) => update('previous_value', parseFloat(e.target.value) || null)} className="border border-black/[0.08] rounded px-2 py-1 text-[13px] w-20 bg-[#fafaf9]" />
      </td>
      <td className="px-4 py-2">
        <input value={form.unit} onChange={(e) => update('unit', e.target.value)} className="border border-black/[0.08] rounded px-2 py-1 text-[13px] w-20 bg-[#fafaf9]" />
      </td>
      <td className="px-4 py-2">
        <select value={form.category} onChange={(e) => update('category', e.target.value)} className="border border-black/[0.08] rounded px-2 py-1 text-[13px] bg-[#fafaf9]">
          <option value="macro">Macro</option>
          <option value="prix">Prix</option>
          <option value="change">Change</option>
        </select>
      </td>
      <td className="px-4 py-2">
        <div className="flex gap-1">
          {dirty && (
            <button onClick={handleSave} disabled={saving} className="p-1 bg-[#111] text-white rounded hover:bg-[#333]">
              <Save className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => onSave('delete', 'niger_economic_indicators', null, indicator.id)} disabled={saving} className="p-1 text-red-400 hover:text-red-600">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Facts Editor ────────────────────────────────────────────────────────────

function FactsEditor({ facts, onSave, saving }: { facts: any[]; onSave: any; saving: boolean }) {
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#fafaf9] border-b border-black/[0.04]">
              <th className="text-left px-4 py-2.5 font-medium text-gray-500">Label</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-500">Valeur</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-500">Catégorie</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {facts.map((f: any) => (
              <FactRow key={f.id} fact={f} onSave={onSave} saving={saving} />
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={() => onSave('insert', 'niger_country_facts', { fact_key: 'new_' + Date.now(), label: 'Nouveau fait', value: '', category: 'general' })}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-dashed border-black/[0.1] w-full justify-center"
      >
        <Plus className="w-4 h-4" /> Ajouter un fait
      </button>
    </div>
  );
}

function FactRow({ fact, onSave, saving }: { fact: any; onSave: any; saving: boolean }) {
  const [form, setForm] = useState({ ...fact });
  const [dirty, setDirty] = useState(false);

  const update = (key: string, val: any) => {
    setForm({ ...form, [key]: val });
    setDirty(true);
  };

  const handleSave = () => {
    const { id, updated_at, ...rest } = form;
    onSave('update', 'niger_country_facts', rest, id);
    setDirty(false);
  };

  return (
    <tr className="border-b border-black/[0.04] last:border-0">
      <td className="px-4 py-2">
        <input value={form.label} onChange={(e) => update('label', e.target.value)} className="border border-black/[0.08] rounded px-2 py-1 text-[13px] w-full bg-[#fafaf9]" />
      </td>
      <td className="px-4 py-2">
        <input value={form.value} onChange={(e) => update('value', e.target.value)} className="border border-black/[0.08] rounded px-2 py-1 text-[13px] w-full bg-[#fafaf9]" />
      </td>
      <td className="px-4 py-2">
        <select value={form.category} onChange={(e) => update('category', e.target.value)} className="border border-black/[0.08] rounded px-2 py-1 text-[13px] bg-[#fafaf9]">
          <option value="general">Général</option>
          <option value="economie">Économie</option>
          <option value="demographie">Démographie</option>
          <option value="geographie">Géographie</option>
        </select>
      </td>
      <td className="px-4 py-2">
        <div className="flex gap-1">
          {dirty && (
            <button onClick={handleSave} disabled={saving} className="p-1 bg-[#111] text-white rounded hover:bg-[#333]">
              <Save className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => onSave('delete', 'niger_country_facts', null, fact.id)} disabled={saving} className="p-1 text-red-400 hover:text-red-600">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Partners Editor ─────────────────────────────────────────────────────────

function PartnersEditor({ partners, onSave, saving }: { partners: any[]; onSave: any; saving: boolean }) {
  return (
    <div className="space-y-3">
      {partners.map((p: any) => (
        <PartnerCard key={p.id} partner={p} onSave={onSave} saving={saving} />
      ))}
      <button
        onClick={() => onSave('insert', 'niger_partners', { name: 'Nouveau partenaire', type: 'export', description: '' })}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-dashed border-black/[0.1] w-full justify-center"
      >
        <Plus className="w-4 h-4" /> Ajouter un partenaire
      </button>
    </div>
  );
}

function PartnerCard({ partner, onSave, saving }: { partner: any; onSave: any; saving: boolean }) {
  const [form, setForm] = useState({ ...partner });
  const [dirty, setDirty] = useState(false);

  const update = (key: string, val: any) => {
    setForm({ ...form, [key]: val });
    setDirty(true);
  };

  const handleSave = () => {
    const { id, created_at, ...rest } = form;
    onSave('update', 'niger_partners', rest, id);
    setDirty(false);
  };

  return (
    <div className="bg-white rounded-xl border border-black/[0.06] p-4">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Nom" value={form.name} onChange={(v: string) => update('name', v)} />
        <div>
          <label className="block text-[12px] text-gray-400 mb-1">Type</label>
          <select value={form.type} onChange={(e) => update('type', e.target.value)} className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-[13px] bg-[#fafaf9]">
            <option value="export">Export</option>
            <option value="import">Import</option>
            <option value="investissement">Investissement</option>
            <option value="aide">Aide</option>
          </select>
        </div>
        <Field label="Description" value={form.description || ''} onChange={(v: string) => update('description', v)} />
      </div>
      <div className="flex gap-2 mt-3">
        {dirty && (
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111] text-white rounded-lg text-[12px] hover:bg-[#333]">
            <Save className="w-3 h-3" /> Sauvegarder
          </button>
        )}
        <button onClick={() => onSave('delete', 'niger_partners', null, partner.id)} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 text-red-400 hover:text-red-600 text-[12px]">
          <Trash2 className="w-3 h-3" /> Supprimer
        </button>
      </div>
    </div>
  );
}

// ─── Shared Field component ─────────────────────────────────────────────────

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[12px] text-gray-400 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-[13px] bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black/10"
      />
    </div>
  );
}
