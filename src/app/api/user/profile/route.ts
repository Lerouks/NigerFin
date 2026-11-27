import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import { safeParseJSON } from '@/lib/validation';
import { erreurNom, estCivilite, estTrancheAge, normaliserNom, professionConnue } from '@/lib/regles-du-compte';
import { nomDePays } from '@/lib/pays';
import { telephoneE164 } from '@/lib/telephone';

// ─── Règles ──────────────────────────────────────────────────────────────────
//
// Les mêmes que dans les formulaires (src/lib/regles-du-compte.ts,
// src/lib/telephone.ts) : civilité M. ou Mme, prénom et nom de 2 à 50
// caractères en lettres latines (accents, haoussa et peul compris), téléphone
// valable pour son pays et enregistré au format international, tranche d'âge
// de la liste.

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const resetClient = createServiceClient();
  if (resetClient) {
    try { await resetClient.rpc('reset_monthly_premium_count'); } catch {}
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    const serviceClient = createServiceClient();
    if (!serviceClient) return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });

    // Split full_name into first/last for new profiles
    const rawName = (user.user_metadata?.full_name || '').trim();
    const nameParts = rawName.split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const { data: newProfile } = await serviceClient
      .from('user_profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: rawName,
        first_name: firstName,
        last_name: lastName,
        role: 'reader',
        subscription_status: 'inactive',
        profile_completed: false,
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
    address, city, country, profession, age_range,
    profile_completed,
  } = body as Record<string, unknown>;

  const errors: string[] = [];
  const updates: Record<string, unknown> = {};

  // Profile completed flag
  if (profile_completed !== undefined) {
    updates.profile_completed = !!profile_completed;
  }

  /** Safely convert to string, treating null/undefined/"null" as empty */
  const toStr = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return s === 'null' || s === 'undefined' ? '' : s;
  };

  // Civilité : obligatoire, elle ne s'efface pas.
  if (civility !== undefined) {
    const cv = toStr(civility);
    if (!estCivilite(cv)) errors.push('Choisissez votre civilité (M. ou Mme).');
    else updates.civility = cv;
  }

  // Prénom et nom : obligatoires, ils ne s'effacent pas.
  if (first_name !== undefined) {
    const err = erreurNom(toStr(first_name), 'Le prénom');
    if (err) errors.push(err);
    else updates.first_name = normaliserNom(toStr(first_name));
  }
  if (last_name !== undefined) {
    const err = erreurNom(toStr(last_name), 'Le nom');
    if (err) errors.push(err);
    else updates.last_name = normaliserNom(toStr(last_name));
  }

  // Téléphone : facultatif, au format international (+22790123456).
  if (phone !== undefined) {
    const ph = toStr(phone).trim();
    if (!ph) {
      updates.phone = null;
    } else {
      const e164 = telephoneE164(ph);
      if (!e164) errors.push('Ce numéro de téléphone n’est pas valable. Vérifiez l’indicatif et le nombre de chiffres.');
      else updates.phone = e164;
    }
  }

  // Tranche d'âge : facultative, une valeur de la liste.
  if (age_range !== undefined) {
    const tranche = toStr(age_range);
    if (!tranche) updates.age_range = null;
    else if (!estTrancheAge(tranche)) errors.push('Tranche d’âge inconnue.');
    else updates.age_range = tranche;
  }

  // Address
  if (address !== undefined) { const v = toStr(address).trim(); updates.address = v.slice(0, 300) || null; }

  // City
  if (city !== undefined) {
    const c = normaliserNom(toStr(city));
    if (c && !/^[\p{L}\p{M}][\p{L}\p{M} '\u2019.-]*$/u.test(c)) errors.push('Nom de ville invalide.');
    else updates.city = c.slice(0, 100) || null;
  }

  // Pays : celui que la personne a choisi, jamais d'office.
  if (country !== undefined) { const v = nomDePays(toStr(country).trim()); updates.country = v.slice(0, 100) || null; }

  // Profession : une valeur de la liste, sinon le texte tel quel (anciennes saisies).
  if (profession !== undefined) {
    const v = toStr(profession).trim();
    updates.profession = v ? (professionConnue(v) ?? v.slice(0, 100)) : null;
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0] }, { status: 400 });
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Rien à modifier' }, { status: 400 });
  }

  // Le nom complet suit le prénom et le nom (factures, mails, PDF des simulateurs).
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
