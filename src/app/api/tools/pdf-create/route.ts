import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';

/**
 * POST /api/tools/pdf-create
 *
 * 1. Verifie que l'utilisateur est Premium / admin
 * 2. Genere une reference incrementale stable au format NFI-YYYY-NNNN
 *    (compteur par utilisateur, reset chaque annee civile)
 * 3. Persiste le snapshot (parametres + resultats) en DB pour audit
 *    et eventuel re-telechargement futur
 * 4. Retourne reference + identite du destinataire au client pour
 *    rendu PDF cote browser via @react-pdf/renderer
 */

const ParamItemSchema = z.object({
  label: z.string().min(1).max(120),
  value: z.string().min(1).max(120),
});

const TableSchema = z
  .object({
    head: z.array(z.string().max(80)).max(8),
    body: z.array(z.array(z.union([z.string(), z.number()]).transform((v) => String(v)))).max(200),
  })
  .optional();

const BodySchema = z.object({
  toolSlug: z.string().min(1).max(80),
  title: z.string().min(1).max(160),
  eyebrow: z.string().max(80).optional(),
  params: z.array(ParamItemSchema).max(20),
  results: z.array(ParamItemSchema).max(20),
  table: TableSchema,
  recommendations: z.array(z.string().max(400)).max(12).optional(),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, civility, full_name, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'premium' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Abonnement Premium requis' }, { status: 403 });
  }

  // Parse + validate body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
  }
  const body = parsed.data;

  // Convention francaise : "M. Nom" / "Mme Nom" (last_name explicite ou dernier mot du full_name)
  let recipientName = (profile.last_name ?? '').trim();
  if (!recipientName && profile.full_name) {
    const parts = profile.full_name.trim().split(/\s+/).filter(Boolean);
    recipientName = parts.length > 0 ? parts[parts.length - 1] ?? '' : '';
  }
  const recipientCivility = profile.civility || null;

  // Generation de la reference + persistance via le service role
  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: refResult, error: refError } = await service.rpc('next_user_pdf_reference', {
    p_user_id: user.id,
  });
  if (refError || !refResult || typeof refResult !== 'string') {
    return NextResponse.json({ error: 'Erreur génération référence' }, { status: 500 });
  }
  const reference = refResult;

  const { error: insertError } = await service.from('tool_pdf_documents').insert({
    user_id: user.id,
    reference,
    tool_slug: body.toolSlug,
    title: body.title,
    params: body.params,
    results: body.results,
    recipient_civility: recipientCivility,
    recipient_name: recipientName || null,
  });
  if (insertError) {
    return NextResponse.json({ error: 'Erreur enregistrement document' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    reference,
    recipientCivility,
    recipientName,
  });
}
