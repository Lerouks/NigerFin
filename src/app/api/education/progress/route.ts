import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { serverError } from '@/lib/api-error';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([]);

  const { data, error } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id, completed_at, last_viewed_at, quiz_score')
    .eq('user_id', user.id);

  if (error) return serverError(error, 'progress-get');
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const { lesson_id, completed } = body as { lesson_id?: unknown; completed?: unknown };

  if (typeof lesson_id !== 'string' || lesson_id.length === 0) {
    return NextResponse.json({ error: 'lesson_id requis' }, { status: 400 });
  }

  const isCompleted = completed === true;
  const now = new Date().toISOString();

  const payload = {
    user_id: user.id,
    lesson_id,
    last_viewed_at: now,
    completed_at: isCompleted ? now : null,
  };

  const { data, error } = await supabase
    .from('user_lesson_progress')
    .upsert(payload, { onConflict: 'user_id,lesson_id' })
    .select('lesson_id, completed_at, last_viewed_at')
    .single();

  if (error) return serverError(error, 'progress-upsert');
  return NextResponse.json(data);
}
