import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// No static cache, data must propagate instantly after admin updates
export const dynamic = 'force-dynamic';

/**
 * Cette route servait auparavant onze cours codes en dur (mock-data.ts) des que
 * Supabase etait absent, en erreur, OU que la table etait vide. Le lecteur voyait
 * alors un Bitcoin a 66 246 et un Brent a 109,00 inventes, sans date ni source,
 * presentes exactement comme de vraies cotations, sur l'accueil et dans chaque
 * article. Trois etats distincts sont desormais distingues :
 *   panne (pas de client, ou erreur SQL) -> 503, l'interface sait que c'est casse
 *   table vide                            -> 200 avec [], l'absence est un etat
 *                                            legitime, pas une panne
 *   donnees presentes                     -> 200 avec les vraies lignes
 * Ne jamais reintroduire de substitution ici.
 */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Donnees de marche temporairement indisponibles' },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from('market_data')
    .select('*')
    .order('type')
    .order('name');

  if (error) {
    return NextResponse.json(
      { error: 'Donnees de marche temporairement indisponibles' },
      { status: 503 },
    );
  }

  if (!data || data.length === 0) {
    return NextResponse.json([]);
  }

  const mapped = data.map((item) => ({
    id: item.id,
    name: item.name,
    // Comme pour change/change_percent : Number(null) vaut 0, ce qui
    // transformerait une valeur ABSENTE en un cours mesure a zero. On preserve
    // l'absence pour que l'interface affiche « donnee indisponible ».
    value: item.value === null ? null : Number(item.value),
    // `Number(null)` vaut 0 : convertir sans precaution transformait une
    // variation NON RENSEIGNEE en une variation MESUREE a zero, que l'interface
    // affichait ensuite comme « Stable ». On preserve l'absence telle quelle.
    change: item.change === null ? null : Number(item.change),
    changePercent: item.change_percent === null ? null : Number(item.change_percent),
    type: item.type as 'currency' | 'commodity' | 'index' | 'crypto',
    symbol: item.symbol,
    unit: item.unit || '',
    source: item.source || '',
    updatedAt: item.updated_at || null,
    description: item.description || '',
    educationLink: item.education_link || '',
  }));

  return NextResponse.json(mapped);
}
