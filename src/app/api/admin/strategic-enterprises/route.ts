import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { STRATEGIC_ENTERPRISES_CACHE_TAG } from '@/lib/strategic-enterprises';

function purgeAtlasCache(slug?: string | null) {
  revalidateTag(STRATEGIC_ENTERPRISES_CACHE_TAG, 'max');
  revalidatePath('/entreprises');
  if (slug) revalidatePath(`/entreprises/${slug}`);
}

/**
 * Bloque les schemes dangereux dans une URL stockee en DB (vecteur javascript:
 * en href). Whitelist stricte http/https. Renvoie null si invalide ou vide.
 */
function sanitizeUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url.trim()) return null;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Schema Zod commun pour POST + PUT. Tous les champs hors name/sector sont
 * optionnels. Les URLs sont sanitisees via sanitizeUrl en aval pour bloquer
 * javascript: et autres schemes. Le PUT accepte les memes champs + id.
 */
const enterpriseInputSchema = z.object({
  name: z.string().trim().min(1, 'Nom requis').max(120),
  sector: z.string().trim().min(1, 'Secteur requis').max(80),
  description: z.string().trim().max(2000).optional().default(''),
  detailed_description: z.string().trim().max(20000).nullable().optional(),
  full_name: z.string().trim().max(240).nullable().optional(),
  slug: z.string().trim().max(120).nullable().optional(),
  founded_year: z
    .union([z.number().int().min(1800).max(2100), z.null()])
    .optional(),
  headquarters: z.string().trim().max(200).nullable().optional(),
  employees: z.string().trim().max(200).nullable().optional(),
  revenue: z.string().trim().max(200).nullable().optional(),
  ownership: z.string().trim().max(500).nullable().optional(),
  website: z.string().trim().max(500).nullable().optional(),
  logo_url: z.string().trim().max(500).nullable().optional(),
  image_url: z.string().trim().max(500).nullable().optional(),
  display_order: z.number().int().min(0).max(9999).optional(),
  is_visible: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  key_facts: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .nullable()
    .optional(),
});

// GET: list all strategic enterprises (admin)
export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { data, error } = await auth.serviceClient
    .from('strategic_enterprises')
    .select('*')
    .order('display_order')
    .order('name');

  if (error) return serverError(error, 'admin-strategic-enterprises');
  return NextResponse.json(data);
}

// POST: create
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = enterpriseInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Donnees invalides', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Auto-generate slug from name if not provided
  const finalSlug =
    input.slug ||
    input.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const { data, error } = await auth.serviceClient
    .from('strategic_enterprises')
    .insert({
      name: input.name,
      slug: finalSlug,
      sector: input.sector,
      description: input.description ?? '',
      logo_url: sanitizeUrl(input.logo_url),
      image_url: sanitizeUrl(input.image_url),
      display_order: input.display_order ?? 0,
      is_visible: input.is_visible ?? true,
      full_name: input.full_name ?? null,
      founded_year: input.founded_year ?? null,
      headquarters: input.headquarters ?? null,
      employees: input.employees ?? null,
      revenue: input.revenue ?? null,
      ownership: input.ownership ?? null,
      website: sanitizeUrl(input.website),
      detailed_description: input.detailed_description ?? null,
      key_facts: input.key_facts ?? [],
    })
    .select()
    .single();

  if (error) return serverError(error, 'admin-strategic-enterprises');
  purgeAtlasCache(data?.slug);
  return NextResponse.json(data);
}

// PUT: update (partial updates accepted, all fields optional)
const enterpriseUpdateSchema = enterpriseInputSchema.partial().extend({
  id: z.string().uuid('ID UUID requis'),
});

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = enterpriseUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Donnees invalides', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { id, ...input } = parsed.data;

  // Construit l'objet update avec UNIQUEMENT les champs whitelistes presents.
  // Bloque le mass assignment sur des colonnes systeme (created_at, etc.).
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.name !== undefined) updates.name = input.name;
  if (input.sector !== undefined) updates.sector = input.sector;
  if (input.description !== undefined) updates.description = input.description;
  if (input.detailed_description !== undefined) updates.detailed_description = input.detailed_description;
  if (input.full_name !== undefined) updates.full_name = input.full_name;
  if (input.slug !== undefined) updates.slug = input.slug;
  if (input.founded_year !== undefined) updates.founded_year = input.founded_year;
  if (input.headquarters !== undefined) updates.headquarters = input.headquarters;
  if (input.employees !== undefined) updates.employees = input.employees;
  if (input.revenue !== undefined) updates.revenue = input.revenue;
  if (input.ownership !== undefined) updates.ownership = input.ownership;
  if (input.website !== undefined) updates.website = sanitizeUrl(input.website);
  if (input.logo_url !== undefined) updates.logo_url = sanitizeUrl(input.logo_url);
  if (input.image_url !== undefined) updates.image_url = sanitizeUrl(input.image_url);
  if (input.display_order !== undefined) updates.display_order = input.display_order;
  if (input.is_visible !== undefined) updates.is_visible = input.is_visible;
  if (input.is_featured !== undefined) updates.is_featured = input.is_featured;
  if (input.key_facts !== undefined) updates.key_facts = input.key_facts;

  // is_featured exclusif : si on set true, on unset toutes les autres avant
  // (l'index unique partial Postgres bloquerait sinon).
  if (updates.is_featured === true) {
    const { error: unsetError } = await auth.serviceClient
      .from('strategic_enterprises')
      .update({ is_featured: false })
      .eq('is_featured', true)
      .neq('id', id);
    if (unsetError) return serverError(unsetError, 'admin-strategic-enterprises-unset-featured');
  }

  const { data, error } = await auth.serviceClient
    .from('strategic_enterprises')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return serverError(error, 'admin-strategic-enterprises');
  purgeAtlasCache(data?.slug);
  return NextResponse.json(data);
}

// DELETE: remove
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID requis' }, { status: 400 });
  }

  const { error } = await auth.serviceClient
    .from('strategic_enterprises')
    .delete()
    .eq('id', id);

  if (error) return serverError(error, 'admin-strategic-enterprises');
  purgeAtlasCache(null);
  return NextResponse.json({ success: true });
}
