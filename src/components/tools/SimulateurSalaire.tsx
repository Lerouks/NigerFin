'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { PdfDownloadButton } from '@/components/PdfDownloadButton';

/* ─── ITS brackets (Art. 150 nouveau, Ord. N°2025-44) ─── */
const ITS_BRACKETS = [
  { min: 0,       max: 25000,    rate: 0.01 },
  { min: 25001,   max: 50000,    rate: 0.02 },
  { min: 50001,   max: 100000,   rate: 0.06 },
  { min: 100001,  max: 150000,   rate: 0.13 },
  { min: 150001,  max: 300000,   rate: 0.25 },
  { min: 300001,  max: 400000,   rate: 0.30 },
  { min: 400001,  max: 700000,   rate: 0.32 },
  { min: 700001,  max: 1000000,  rate: 0.34 },
  { min: 1000001, max: Infinity, rate: 0.35 },
];

const CNSS_CEIL = 500000;
const CNSS_SAL_RATE = 0.036;
const CNSS_PAT_RATE = 0.164;
const INAM_SAL_RATE = 0.025;
const INAM_PAT_RATE = 0.075;
const ABATTEMENT_RATE = 0.20;
const MAX_BRUT = 3000000;
const SHORTCUTS = [50000, 100000, 200000, 300000, 500000, 750000, 1000000, 2000000];

function fmt(n: number): string {
  return Math.round(n).toLocaleString('fr-FR');
}

function shortLabel(n: number): string {
  if (n >= 1000000) return `${n / 1000000}M`;
  return `${n / 1000}k`;
}

function computeITS(baseITS: number) {
  let remaining = baseITS;
  let total = 0;
  const details: { min: number; max: number; rate: number; taxable: number; tax: number; active: boolean }[] = [];

  for (const br of ITS_BRACKETS) {
    const width = br.max === Infinity ? Infinity : br.max - br.min + 1;
    const taxable = Math.max(0, Math.min(remaining, width));
    const tax = taxable * br.rate;
    total += tax;
    remaining -= taxable;
    details.push({ ...br, taxable, tax, active: taxable > 0 });
  }
  return { total, details };
}

function compute(brut: number) {
  const baseCNSS = Math.min(brut, CNSS_CEIL);
  const cnssSal = baseCNSS * CNSS_SAL_RATE;
  const inamSal = brut * INAM_SAL_RATE;
  const netRetenues = brut - cnssSal - inamSal;
  const abattement = netRetenues * ABATTEMENT_RATE;
  const baseITS = netRetenues - abattement;
  const its = computeITS(baseITS);
  const salaireNet = brut - cnssSal - inamSal - its.total;
  const tauxEffectif = brut > 0 ? ((cnssSal + inamSal + its.total) / brut) * 100 : 0;

  const cnssPat = baseCNSS * CNSS_PAT_RATE;
  const inamPat = brut * INAM_PAT_RATE;
  const chargesPat = cnssPat + inamPat;
  const coutTotal = brut + chargesPat;
  const surcout = brut > 0 ? (chargesPat / brut) * 100 : 0;

  const cnssVerser = cnssSal + cnssPat;
  const inamVerser = inamSal + inamPat;

  return {
    brut, baseCNSS, cnssSal, inamSal, netRetenues, abattement, baseITS,
    its: its.total, itsDetails: its.details, salaireNet, tauxEffectif,
    cnssPat, inamPat, chargesPat, coutTotal, surcout,
    cnssVerser, inamVerser,
  };
}

/* ─── Animated counter ─── */
function AnimVal({ value, suffix = ' F CFA' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(value);
  const ref = useRef<number | null>(null);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    if (from === to) return;
    const start = performance.now();
    const dur = 350;
    const step = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * ease));
      if (t < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value]);

  return <>{fmt(display)}{suffix}</>;
}

/* ─── Styles ─── */
const S = {
  card: { background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, padding: '24px' } as React.CSSProperties,
  cardDark: { background: '#111', borderRadius: 12, padding: '24px', color: '#fff' } as React.CSSProperties,
  label: { fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#9ca3af', marginBottom: 4, fontWeight: 400 },
  bigVal: { fontSize: 28, fontWeight: 700, lineHeight: 1.2 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 8, fontSize: 14 } as React.CSSProperties,
  rowBg: { background: '#fafaf9' },
  rowDark: { background: '#111', color: '#fff' },
  rowLabel: { color: '#6b7280', fontSize: 13 },
  rowVal: { fontWeight: 600, fontSize: 15 },
  sectionTitle: { fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#9ca3af', marginBottom: 16 },
  toggle: (active: boolean) => ({
    flex: 1, padding: '12px 16px', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s',
    background: active ? '#111' : 'transparent',
    color: active ? '#fff' : '#6b7280',
  } as React.CSSProperties),
  slider: {
    width: '100%', height: 6, borderRadius: 3, appearance: 'none' as const, background: '#e5e5e5',
    outline: 'none', cursor: 'pointer', WebkitAppearance: 'none' as const,
  } as React.CSSProperties,
  shortcut: {
    padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.08)', background: '#fafaf9',
    fontSize: 13, cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s', color: '#374151',
  } as React.CSSProperties,
  shortcutActive: {
    background: '#111', color: '#fff', borderColor: '#111',
  },
  warning: {
    background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 18px',
    fontSize: 13, color: '#92400e', lineHeight: 1.6,
  } as React.CSSProperties,
  contextBox: {
    background: '#f9fafb', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: '16px 20px',
    fontSize: 14, color: '#374151', lineHeight: 1.7,
  } as React.CSSProperties,
  accordion: {
    background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, overflow: 'hidden',
  } as React.CSSProperties,
  accordionHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px',
    cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#111', background: '#fff', border: 'none', width: '100%', textAlign: 'left' as const,
  } as React.CSSProperties,
  barSegment: (color: string, pct: number) => ({
    background: color, height: 14, borderRadius: 7, minWidth: pct > 0 ? 4 : 0,
    width: `${pct}%`, transition: 'width 0.4s ease',
  } as React.CSSProperties),
  footer: {
    fontSize: 11, color: '#9ca3af', lineHeight: 1.7, marginTop: 32, padding: '20px 0',
    borderTop: '1px solid rgba(0,0,0,0.06)',
  } as React.CSSProperties,
};

/* ─── Context phrase generators ─── */
function salaryPhrase(c: ReturnType<typeof compute>) {
  const b = fmt(c.brut);
  const n = fmt(c.salaireNet);
  const i = fmt(c.its);
  const cn = fmt(c.cnssSal);
  const inam = fmt(c.inamSal);
  const tx = c.tauxEffectif.toFixed(1);
  const totalRet = fmt(c.cnssSal + c.inamSal + c.its);

  if (c.tauxEffectif < 10) {
    return `Avec un salaire brut de ${b} F CFA, vos prélèvements restent faibles. Vous percevez ${n} F CFA nets par mois, soit seulement ${tx}% de retenues au total.`;
  } else if (c.tauxEffectif < 20) {
    return `Pour un brut de ${b} F CFA, l'État et les organismes sociaux retiennent ${totalRet} F CFA au total, dont ${i} F CFA d'ITS. Vous touchez ${n} F CFA nets chaque mois.`;
  } else if (c.tauxEffectif < 30) {
    return `Sur ${b} F CFA bruts, plus d'un quart est prélevé entre l'ITS (${i} F CFA), la CNSS (${cn} F CFA) et l'INAM (${inam} F CFA). Votre salaire net est de ${n} F CFA.`;
  }
  return `À ce niveau de salaire, les prélèvements représentent plus de 30% du brut. Sur ${b} F CFA, vous percevez ${n} F CFA nets après ${i} F CFA d'ITS, ${cn} F CFA de CNSS et ${inam} F CFA d'INAM.`;
}

function employerPhrase(c: ReturnType<typeof compute>) {
  const b = fmt(c.brut);
  const ct = fmt(c.coutTotal);
  const ch = fmt(c.chargesPat);
  const sc = c.surcout.toFixed(1);
  const cnss = fmt(c.cnssVerser);
  const inam = fmt(c.inamVerser);
  const its = fmt(c.its);

  if (c.surcout < 20) {
    return `Pour un salarié à ${b} F CFA bruts, votre coût réel mensuel est de ${ct} F CFA, soit ${sc}% au-dessus du salaire négocié.`;
  } else if (c.surcout <= 25) {
    return `Embaucher à ${b} F CFA bruts vous revient à ${ct} F CFA par mois une fois les charges patronales incluses. Vous versez ${cnss} F CFA à la CNSS, ${inam} F CFA à l'INAM et ${its} F CFA d'ITS à la DGI.`;
  }
  return `Les charges patronales représentent plus du quart du salaire brut. Un brut de ${b} F CFA engendre un coût total de ${ct} F CFA, soit ${ch} F CFA de charges sociales en dehors du salaire négocié.`;
}

/* ─── Main component ─── */
export default function SimulateurSalaireNiger() {
  const [brut, setBrut] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [mode, setMode] = useState<'salarie' | 'employeur'>('salarie');
  const [itsOpen, setItsOpen] = useState(false);

  const setGross = (v: number) => {
    const clamped = Math.max(0, Math.min(MAX_BRUT, v));
    setBrut(clamped);
    setInputVal(clamped > 0 ? String(clamped) : '');
  };

  const c = useMemo(() => brut > 0 ? compute(brut) : null, [brut]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ─── Input section ─── */}
      <div style={S.card}>
        <div style={S.sectionTitle}>Salaire brut mensuel</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <input
            type="text"
            inputMode="numeric"
            value={inputVal}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '');
              setInputVal(raw);
              setGross(Number(raw) || 0);
            }}
            placeholder="Ex : 300 000"
            style={{
              flex: 1, border: '1px solid rgba(0,0,0,0.08)', padding: '14px 16px', borderRadius: 10,
              fontSize: 16, background: '#fafaf9', outline: 'none', fontWeight: 500,
            }}
          />
          <span style={{ fontSize: 14, color: '#9ca3af', whiteSpace: 'nowrap' }}>F CFA</span>
        </div>
        <input
          type="range" min={0} max={MAX_BRUT} step={5000} value={brut}
          onChange={(e) => setGross(Number(e.target.value))}
          style={S.slider}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
          <span>0</span><span>{fmt(MAX_BRUT)} F CFA</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          {SHORTCUTS.map((v) => (
            <button key={v} onClick={() => setGross(v)}
              style={{ ...S.shortcut, ...(brut === v ? S.shortcutActive : {}) }}>
              {shortLabel(v)}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Toggle ─── */}
      <div style={{ ...S.card, padding: '6px', display: 'flex', gap: 4 }}>
        <button onClick={() => setMode('salarie')} style={S.toggle(mode === 'salarie')}>
          Je suis salarié
        </button>
        <button onClick={() => setMode('employeur')} style={S.toggle(mode === 'employeur')}>
          Je suis employeur
        </button>
      </div>

      {/* ─── Empty state ─── */}
      {!c && (
        <div style={{ ...S.card, textAlign: 'center', padding: '60px 24px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: '#f5f5f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            fontSize: 24,
          }}>
            F
          </div>
          <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 360, margin: '0 auto', lineHeight: 1.6 }}>
            Saisissez un salaire brut pour lancer la simulation.
          </p>
        </div>
      )}

      {/* ━━━ SALARIED VIEW ━━━ */}
      {c && mode === 'salarie' && (
        <>
          {/* Main results */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={S.cardDark}>
              <div style={{ ...S.label, color: 'rgba(255,255,255,0.4)' }}>Salaire NET perçu</div>
              <div style={S.bigVal}><AnimVal value={c.salaireNet} /></div>
            </div>
            <div style={{ ...S.cardDark, background: '#1a1a1a' }}>
              <div style={{ ...S.label, color: 'rgba(255,255,255,0.4)' }}>ITS du mois</div>
              <div style={S.bigVal}><AnimVal value={c.its} /></div>
            </div>
          </div>

          {/* Distribution bar */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Répartition du brut</div>
            <div style={{ display: 'flex', gap: 2, borderRadius: 7, overflow: 'hidden', marginBottom: 16 }}>
              <div style={S.barSegment('#111', (c.salaireNet / c.brut) * 100)} />
              <div style={S.barSegment('#ef4444', (c.its / c.brut) * 100)} />
              <div style={S.barSegment('#3b82f6', (c.cnssSal / c.brut) * 100)} />
              <div style={S.barSegment('#f59e0b', (c.inamSal / c.brut) * 100)} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              {[
                { label: 'Net', color: '#111', pct: (c.salaireNet / c.brut) * 100 },
                { label: 'ITS', color: '#ef4444', pct: (c.its / c.brut) * 100 },
                { label: 'CNSS', color: '#3b82f6', pct: (c.cnssSal / c.brut) * 100 },
                { label: 'INAM', color: '#f59e0b', pct: (c.inamSal / c.brut) * 100 },
              ].map((s) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{s.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Context phrase */}
          <div style={S.contextBox}>{salaryPhrase(c)}</div>

          {/* Warning */}
          <div style={S.warning}>
            <span role="img" aria-label="attention">&#9888;&#65039;</span> Simulation indicative basée sur le barème fiscal 2026. Les montants peuvent varier selon votre situation personnelle (primes, avantages en nature, régimes spéciaux, conventions collectives, etc.).
          </div>

          {/* Calculation table */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Détail du calcul</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ ...S.row, ...S.rowBg }}>
                <span style={S.rowLabel}>Salaire brut</span>
                <span style={S.rowVal}><AnimVal value={c.brut} /></span>
              </div>
              <div style={{ ...S.row, ...S.rowBg }}>
                <span style={S.rowLabel}>- CNSS salarié (3,6% · plafonné à 500 000 F CFA)</span>
                <span style={S.rowVal}><AnimVal value={c.cnssSal} /></span>
              </div>
              <div style={{ ...S.row, ...S.rowBg }}>
                <span style={S.rowLabel}>- INAM salarié (2,5%)</span>
                <span style={S.rowVal}><AnimVal value={c.inamSal} /></span>
              </div>
              <div style={{ ...S.row, background: '#f3f4f6' }}>
                <span style={{ ...S.rowLabel, fontWeight: 600, color: '#374151' }}>= Net après cotisations</span>
                <span style={S.rowVal}><AnimVal value={c.netRetenues} /></span>
              </div>
              <div style={{ ...S.row, ...S.rowBg }}>
                <span style={S.rowLabel}>- Abattement forfaitaire 20% (frais professionnels présumés)</span>
                <span style={S.rowVal}><AnimVal value={c.abattement} /></span>
              </div>
              <div style={{ ...S.row, background: '#f3f4f6' }}>
                <span style={{ ...S.rowLabel, fontWeight: 600, color: '#374151' }}>= Base imposable ITS</span>
                <span style={S.rowVal}><AnimVal value={c.baseITS} /></span>
              </div>
              <div style={{ ...S.row, ...S.rowBg }}>
                <span style={S.rowLabel}>- ITS (Art. 150 · Ord. N°2025-44)</span>
                <span style={S.rowVal}><AnimVal value={c.its} /></span>
              </div>
              <div style={{ ...S.row, ...S.rowDark }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>= SALAIRE NET PERÇU</span>
                <span style={{ fontSize: 18, fontWeight: 700 }}><AnimVal value={c.salaireNet} /></span>
              </div>
              <div style={{ ...S.row, ...S.rowBg, marginTop: 4 }}>
                <span style={S.rowLabel}>Taux effectif de prélèvement</span>
                <span style={{ ...S.rowVal, color: '#ef4444' }}>{c.tauxEffectif.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* ITS accordion */}
          <div style={S.accordion}>
            <button onClick={() => setItsOpen(!itsOpen)} style={S.accordionHead}>
              <span>Détail ITS par tranche</span>
              <span style={{ fontSize: 18, transition: 'transform 0.2s', transform: itsOpen ? 'rotate(180deg)' : 'rotate(0)' }}>&#9660;</span>
            </button>
            {itsOpen && (
              <div style={{ padding: '0 20px 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {c.itsDetails.map((tr, i) => (
                    <div key={i} style={{
                      ...S.row, ...(tr.active ? S.rowBg : {}),
                      opacity: tr.active ? 1 : 0.35,
                    }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>
                        {tr.max === Infinity
                          ? `Au-delà de ${fmt(tr.min)} F CFA`
                          : `${fmt(tr.min)} - ${fmt(tr.max)} F CFA`}
                        {' '}({(tr.rate * 100).toFixed(0)}%)
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>
                        {tr.active ? `${fmt(tr.tax)} F CFA` : '-'}
                      </span>
                    </div>
                  ))}
                  <div style={{ ...S.row, background: '#f3f4f6', marginTop: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Total ITS</span>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{fmt(c.its)} F CFA</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Annual projection */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Projection annuelle (x 12)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ ...S.row, ...S.rowBg }}>
                <span style={S.rowLabel}>Net / an</span>
                <span style={S.rowVal}><AnimVal value={c.salaireNet * 12} /></span>
              </div>
              <div style={{ ...S.row, ...S.rowBg }}>
                <span style={S.rowLabel}>ITS / an</span>
                <span style={S.rowVal}><AnimVal value={c.its * 12} /></span>
              </div>
              <div style={{ ...S.row, ...S.rowBg }}>
                <span style={S.rowLabel}>Cotisations / an (CNSS + INAM)</span>
                <span style={S.rowVal}><AnimVal value={(c.cnssSal + c.inamSal) * 12} /></span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ━━━ EMPLOYER VIEW ━━━ */}
      {c && mode === 'employeur' && (
        <>
          {/* Main results */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={S.cardDark}>
              <div style={{ ...S.label, color: 'rgba(255,255,255,0.4)' }}>Coût total employeur</div>
              <div style={S.bigVal}><AnimVal value={c.coutTotal} /></div>
            </div>
            <div style={{ ...S.cardDark, background: '#1a1a1a' }}>
              <div style={{ ...S.label, color: 'rgba(255,255,255,0.4)' }}>Charges patronales</div>
              <div style={S.bigVal}><AnimVal value={c.chargesPat} /></div>
            </div>
          </div>

          {/* Distribution bar */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Répartition du coût total</div>
            <div style={{ display: 'flex', gap: 2, borderRadius: 7, overflow: 'hidden', marginBottom: 16 }}>
              <div style={S.barSegment('#111', (c.brut / c.coutTotal) * 100)} />
              <div style={S.barSegment('#3b82f6', (c.cnssPat / c.coutTotal) * 100)} />
              <div style={S.barSegment('#f59e0b', (c.inamPat / c.coutTotal) * 100)} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              {[
                { label: 'Brut', color: '#111', pct: (c.brut / c.coutTotal) * 100 },
                { label: 'CNSS patronal', color: '#3b82f6', pct: (c.cnssPat / c.coutTotal) * 100 },
                { label: 'INAM patronal', color: '#f59e0b', pct: (c.inamPat / c.coutTotal) * 100 },
              ].map((s) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{s.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Context phrase */}
          <div style={S.contextBox}>{employerPhrase(c)}</div>

          {/* Warning */}
          <div style={S.warning}>
            <span role="img" aria-label="attention">&#9888;&#65039;</span> Simulation indicative basée sur le barème fiscal 2026. Les montants peuvent varier selon votre situation personnelle (primes, avantages en nature, régimes spéciaux, conventions collectives, etc.).
          </div>

          {/* Calculation table */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Détail du coût employeur</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ ...S.row, ...S.rowBg }}>
                <span style={S.rowLabel}>Salaire brut négocié</span>
                <span style={S.rowVal}><AnimVal value={c.brut} /></span>
              </div>
              <div style={{ ...S.row, ...S.rowBg }}>
                <span style={S.rowLabel}>+ CNSS patronal (16,4% · plafonné à 500 000 F CFA)</span>
                <span style={S.rowVal}><AnimVal value={c.cnssPat} /></span>
              </div>
              <div style={{ ...S.row, ...S.rowBg }}>
                <span style={S.rowLabel}>+ INAM patronal (7,5%)</span>
                <span style={S.rowVal}><AnimVal value={c.inamPat} /></span>
              </div>
              <div style={{ ...S.row, ...S.rowDark }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>= COÛT TOTAL EMPLOYEUR</span>
                <span style={{ fontSize: 18, fontWeight: 700 }}><AnimVal value={c.coutTotal} /></span>
              </div>
              <div style={{ ...S.row, ...S.rowBg, marginTop: 4 }}>
                <span style={S.rowLabel}>Surcoût par rapport au brut</span>
                <span style={{ ...S.rowVal, color: '#ef4444' }}>{c.surcout.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Ventilation */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Ventilation du coût total</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ ...S.row, ...S.rowBg }}>
                <span style={S.rowLabel}>Net en main du salarié</span>
                <span style={S.rowVal}><AnimVal value={c.salaireNet} /></span>
              </div>
              <div style={{ ...S.row, ...S.rowBg }}>
                <span style={S.rowLabel}>Cotisations salariales (CNSS + INAM)</span>
                <span style={S.rowVal}><AnimVal value={c.cnssSal + c.inamSal} /></span>
              </div>
              <div style={{ ...S.row, ...S.rowBg }}>
                <span style={S.rowLabel}>ITS versé à l'État</span>
                <span style={S.rowVal}><AnimVal value={c.its} /></span>
              </div>
              <div style={{ ...S.row, ...S.rowBg }}>
                <span style={S.rowLabel}>Charges patronales</span>
                <span style={S.rowVal}><AnimVal value={c.chargesPat} /></span>
              </div>
            </div>
          </div>

          {/* Versements par organisme */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Versements par organisme</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ ...S.row, ...S.rowBg }}>
                <span style={S.rowLabel}>CNSS ({fmt(c.cnssSal)} sal. + {fmt(c.cnssPat)} pat.)</span>
                <span style={S.rowVal}><AnimVal value={c.cnssVerser} /></span>
              </div>
              <div style={{ ...S.row, ...S.rowBg }}>
                <span style={S.rowLabel}>INAM ({fmt(c.inamSal)} sal. + {fmt(c.inamPat)} pat.)</span>
                <span style={S.rowVal}><AnimVal value={c.inamVerser} /></span>
              </div>
              <div style={{ ...S.row, ...S.rowBg }}>
                <span style={S.rowLabel}>DGI (ITS précompté)</span>
                <span style={S.rowVal}><AnimVal value={c.its} /></span>
              </div>
              <div style={{ ...S.row, ...S.rowDark, marginTop: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Total décaissé</span>
                <span style={{ fontSize: 18, fontWeight: 700 }}><AnimVal value={c.coutTotal} /></span>
              </div>
            </div>
          </div>

          {/* Annual projection */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Projection annuelle (x 12)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ ...S.row, ...S.rowBg }}>
                <span style={S.rowLabel}>Coût total / an</span>
                <span style={S.rowVal}><AnimVal value={c.coutTotal * 12} /></span>
              </div>
              <div style={{ ...S.row, ...S.rowBg }}>
                <span style={S.rowLabel}>Charges patronales / an</span>
                <span style={S.rowVal}><AnimVal value={c.chargesPat * 12} /></span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── PDF Download ─── */}
      {c && (
        <PdfDownloadButton
          hasResults={!!c}
          options={{
            title: 'Simulateur Salaire Niger',
            params: [
              { label: 'Salaire brut mensuel', value: `${fmt(c.brut)} F CFA` },
              { label: 'Mode', value: mode === 'salarie' ? 'Salarié' : 'Employeur' },
            ],
            results: mode === 'salarie'
              ? [
                  { label: 'Salaire NET perçu', value: `${fmt(c.salaireNet)} F CFA` },
                  { label: 'ITS du mois', value: `${fmt(c.its)} F CFA` },
                  { label: 'CNSS salarié', value: `${fmt(c.cnssSal)} F CFA` },
                  { label: 'INAM salarié', value: `${fmt(c.inamSal)} F CFA` },
                  { label: 'Taux effectif', value: `${c.tauxEffectif.toFixed(2)}%` },
                  { label: 'Net annuel', value: `${fmt(c.salaireNet * 12)} F CFA` },
                  { label: 'ITS annuel', value: `${fmt(c.its * 12)} F CFA` },
                ]
              : [
                  { label: 'Coût total employeur', value: `${fmt(c.coutTotal)} F CFA` },
                  { label: 'Charges patronales', value: `${fmt(c.chargesPat)} F CFA` },
                  { label: 'CNSS patronal', value: `${fmt(c.cnssPat)} F CFA` },
                  { label: 'INAM patronal', value: `${fmt(c.inamPat)} F CFA` },
                  { label: 'Surcoût / brut', value: `${c.surcout.toFixed(2)}%` },
                  { label: 'Coût total annuel', value: `${fmt(c.coutTotal * 12)} F CFA` },
                ],
            table: mode === 'salarie'
              ? {
                  head: ['Tranche', 'Taux', 'Base imposable', 'Impôt'],
                  body: c.itsDetails
                    .filter((tr) => tr.active)
                    .map((tr) => [
                      tr.max === Infinity ? `Au-delà de ${fmt(tr.min)} F CFA` : `${fmt(tr.min)} - ${fmt(tr.max)} F CFA`,
                      `${(tr.rate * 100).toFixed(0)}%`,
                      `${fmt(tr.taxable)} F CFA`,
                      `${fmt(tr.tax)} F CFA`,
                    ]),
                }
              : undefined,
          }}
        />
      )}

      {/* ─── Legal footer ─── */}
      {c && (
        <div style={S.footer}>
          Ces résultats sont fournis à titre purement indicatif sur la base de l'Ordonnance N°2025-44 du 31 décembre 2025 portant loi de finances pour l'année budgétaire 2026 (Art. 150 ITS nouveau). Ils ne constituent pas un avis fiscal, comptable ou juridique et ne sauraient engager la responsabilité de NFI REPORT. Consultez un expert-comptable agréé ou l'administration fiscale nigérienne (DGI) pour toute situation spécifique. CNSS salarié 3,6% / patronal 16,4% · base plafonnée à 500 000 F CFA/mois · INAM salarié 2,5% / patronal 7,5% · sans plafond · Abattement forfaitaire 20% · nfireport.com
        </div>
      )}
    </div>
  );
}

/* Named export for backward compat with ToolContent */
export { SimulateurSalaireNiger as SimulateurSalaire };
