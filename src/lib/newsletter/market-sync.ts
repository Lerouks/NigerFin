import { createServiceClient } from '@/lib/supabase';
import type { MarketRow } from '@/emails/components/MarketTable';

/**
 * Symbols pertinents pour la newsletter NFI Report (audience Niger / UEMOA)
 * dans l'ordre d'affichage souhaite. Source : table public.market_data
 * (admin-managed depuis le dashboard).
 */
const NEWSLETTER_SYMBOLS = ['BRVMC', 'USD/XOF', 'EUR/XOF', 'XAU', 'ICEEUR:BRN1!', 'U3O8'] as const;

interface MarketDataRow {
  symbol: string;
  name: string;
  value: number | string;
  unit: string | null;
  change_percent: number | string | null;
  source: string | null;
  previous_close: number | string | null;
}

function formatValue(value: number | string, unit: string | null): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  // FCFA : pas de décimales (sauf EUR/XOF qui a 3 décimales pour le 655.957)
  // Pourcentages : 2 décimales
  // Autres : 2 décimales
  const isFcfa = unit?.toUpperCase().startsWith('FCFA');
  const isWhole = isFcfa && n >= 1000 && Math.abs(n - Math.round(n)) < 0.001;
  const opts: Intl.NumberFormatOptions = isWhole
    ? { maximumFractionDigits: 0 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 3 };
  return n.toLocaleString('fr-FR', opts);
}

function formatUnit(unit: string | null): string | undefined {
  if (!unit) return undefined;
  // "PTS" → "pts", "USD" → "USD", "USD/baril" → "USD/baril", "FCFA" hidden in label often
  if (unit.toUpperCase() === 'PTS') return 'pts';
  if (unit.toUpperCase() === 'FCFA') return 'FCFA';
  return unit;
}

function buildSpark(value: number | string, previousClose: number | string | null): number[] | undefined {
  const v = typeof value === 'number' ? value : Number(value);
  const p = previousClose == null ? null : (typeof previousClose === 'number' ? previousClose : Number(previousClose));
  if (!Number.isFinite(v)) return undefined;
  if (p == null || !Number.isFinite(p) || p === v) {
    // Pas d'historique : 7 points plats à value (sparkline = ligne plate, lisible)
    return [v, v, v, v, v, v, v];
  }
  // Linear interpolation 7 points entre previous_close et value (lissage simple)
  const step = (v - p) / 6;
  return [0, 1, 2, 3, 4, 5, 6].map((i) => Number((p + step * i).toFixed(4)));
}

/**
 * Recupere les vraies valeurs marches depuis Supabase et les mappe au
 * format MarketRow attendu par le template newsletter.
 *
 * @param symbols liste optionnelle de symboles (default = NEWSLETTER_SYMBOLS)
 * @returns rows pretes a coller dans issue.market.rows
 */
export async function getLiveMarketRows(
  symbols: readonly string[] = NEWSLETTER_SYMBOLS,
): Promise<MarketRow[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('market_data')
    .select('symbol, name, value, unit, change_percent, source, previous_close')
    .in('symbol', [...symbols]);

  if (error || !data) return [];

  // Map by symbol pour preserver l'ordre demande
  const bySymbol = new Map<string, MarketDataRow>(
    (data as MarketDataRow[]).map((r) => [r.symbol, r]),
  );

  const rows: MarketRow[] = [];
  for (const sym of symbols) {
    const r = bySymbol.get(sym);
    if (!r) continue;
    const change = r.change_percent == null ? 0 : Number(r.change_percent);
    rows.push({
      label: r.name,
      value: formatValue(r.value, r.unit),
      unit: formatUnit(r.unit),
      changePercent: Number.isFinite(change) ? change : 0,
      spark: buildSpark(r.value, r.previous_close),
    });
  }
  return rows;
}

/**
 * Construit un texte source standard pour le footer du tableau marches,
 * agrege a partir des sources distinctes effectivement presentes.
 */
export async function getMarketSourceLine(
  symbols: readonly string[] = NEWSLETTER_SYMBOLS,
): Promise<string> {
  const supabase = createServiceClient();
  if (!supabase) return '';

  const { data } = await supabase
    .from('market_data')
    .select('source')
    .in('symbol', [...symbols]);

  if (!data) return '';
  const sources = new Set(
    (data as { source: string | null }[])
      .map((r) => r.source)
      .filter((s): s is string => !!s),
  );
  return [...sources].join(', ') + ' · données issues du site';
}
