import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import { safeParseJSON } from '@/lib/validation';

// ─── Validation helpers ─────────────────────────────────────────────────────

const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'-]+$/;
const POSTAL_REGEX = /^[a-zA-Z0-9\s-]{0,20}$/;

function validateName(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < 2) return `${label} doit contenir au moins 2 caractères.`;
  if (trimmed.length > 100) return `${label} trop long (max 100 caractères).`;
  if (!NAME_REGEX.test(trimmed)) return `${label} ne peut contenir que des lettres, espaces, apostrophes et tirets.`;
  return null;
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try { await supabase.rpc('reset_monthly_premium_count'); } catch {}

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    const serviceClient = createServiceClient();
    if (!serviceClient) return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });

    const { data: newProfile } = await serviceClient
      .from('user_profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        role: 'reader',
        subscription_status: 'inactive',
      })
      .select()
      .single();

    return NextResponse.json(newProfile);
  }

  return NextResponse.json(profile);
}

// ─── PUT ─────────────────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await safeParseJSON(request);
  if (!body) return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });

  const {
    civility, first_name, last_name, phone,
    birth_day, birth_month, birth_year,
    address, city, postal_code, country, profession,
  } = body as Record<string, unknown>;

  const errors: string[] = [];
  const updates: Record<string, unknown> = {};

  // Civility
  if (civility !== undefined) {
    if (civility !== 'M.' && civility !== 'Mme') {
      errors.push('Civilité invalide (M. ou Mme).');
    } else {
      updates.civility = civility;
    }
  }

  // First name (required if provided)
  if (first_name !== undefined) {
    const err = validateName(String(first_name), 'Le prénom');
    if (err) errors.push(err);
    else updates.first_name = String(first_name).trim();
  }

  // Last name (required if provided)
  if (last_name !== undefined) {
    const err = validateName(String(last_name), 'Le nom');
    if (err) errors.push(err);
    else updates.last_name = String(last_name).trim();
  }

  // Phone
  if (phone !== undefined) {
    const p = String(phone).trim().replace(/\s+/g, '');
    if (p && (p.length < 8 || p.length > 20)) {
      errors.push('Numéro de téléphone invalide.');
    } else {
      updates.phone = p || null;
    }
  }

  // Birth date
  if (birth_day !== undefined || birth_month !== undefined || birth_year !== undefined) {
    const d = Number(birth_day) || 0;
    const m = Number(birth_month) || 0;
    const y = Number(birth_year) || 0;

    if (d || m || y) {
      if (d < 1 || d > 31) errors.push('Jour de naissance invalide.');
      if (m < 1 || m > 12) errors.push('Mois de naissance invalide.');
      if (y < 1920 || y > new Date().getFullYear() - 13) errors.push('Année de naissance invalide.');

      if (errors.length === 0) {
        // Validate actual date
        const testDate = new Date(y, m - 1, d);
        if (testDate.getDate() !== d || testDate.getMonth() !== m - 1) {
          errors.push('Date de naissance invalide.');
        }
      }
    }

    updates.birth_day = d || null;
    updates.birth_month = m || null;
    updates.birth_year = y || null;
  }

  // Address
  if (address !== undefined) updates.address = String(address).trim().slice(0, 300) || null;

  // City
  if (city !== undefined) {
    const c = String(city).trim();
    if (c && !NAME_REGEX.test(c)) errors.push('Nom de ville invalide.');
    else updates.city = c.slice(0, 100) || null;
  }

  // Postal code
  if (postal_code !== undefined) {
    const pc = String(postal_code).trim();
    if (pc && !POSTAL_REGEX.test(pc)) errors.push('Code postal invalide.');
    else updates.postal_code = pc.slice(0, 20) || null;
  }

  // Country
  if (country !== undefined) {
    updates.country = String(country).trim().slice(0, 100) || null;
  }

  // Profession
  if (profession !== undefined) {
    updates.profession = String(profession).trim().slice(0, 100) || null;
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0] }, { status: 400 });
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Rien à modifier' }, { status: 400 });
  }

  // Sync full_name for backward compat
  if (updates.first_name || updates.last_name) {
    const serviceClient = createServiceClient();
    if (serviceClient) {
      const { data: current } = await serviceClient.from('user_profiles').select('first_name, last_name').eq('id', user.id).single();
      const fn = (updates.first_name as string) || current?.first_name || '';
      const ln = (updates.last_name as string) || current?.last_name || '';
      updates.full_name = `${fn} ${ln}`.trim();
    }
  }

  updates.updated_at = new Date().toISOString();

  const serviceClient = createServiceClient();
  if (!serviceClient) return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });

  const { data, error } = await serviceClient
    .from('user_profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });

  return NextResponse.json(data);
}
