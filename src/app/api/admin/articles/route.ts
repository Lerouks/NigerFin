import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase';

async function requireAdmin(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const service = createServiceClient();
  if (!service) return null;
  const { data: profile } = await service.from('user_profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  return { user, service };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET: list all articles (including drafts) for admin
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // If id is provided, return full article
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const { data, error } = await auth.service
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Otherwise return all articles with full data for editing
  const { data, error } = await auth.service
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: create article
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const slug = body.slug || slugify(body.title);

  const { data, error } = await auth.service.from('articles').insert({
    title: body.title,
    subtitle: body.subtitle || null,
    slug,
    excerpt: body.excerpt || null,
    category: body.category || 'economie',
    content_type: body.content_type || 'free',
    is_featured: body.is_featured || false,
    featured_order: body.featured_order || 0,
    author_name: body.author_name || 'NFI Report',
    author_avatar: body.author_avatar || null,
    main_image_url: body.main_image_url || null,
    main_image_alt: body.main_image_alt || null,
    body: body.body || '',
    read_time: body.read_time || null,
    tags: body.tags || [],
    seo_title: body.seo_title || null,
    seo_description: body.seo_description || null,
    status: body.status || 'draft',
    published_at: body.status === 'published' ? (body.published_at || new Date().toISOString()) : body.published_at || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PUT: update article
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const updateData: Record<string, unknown> = {};
  const fields = [
    'title', 'subtitle', 'slug', 'excerpt', 'category', 'content_type',
    'is_featured', 'featured_order', 'author_name', 'author_avatar',
    'main_image_url', 'main_image_alt', 'body', 'read_time', 'tags',
    'seo_title', 'seo_description', 'status', 'published_at',
  ];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  // Auto-set published_at when publishing for the first time
  if (body.status === 'published' && !body.published_at) {
    updateData.published_at = new Date().toISOString();
  }

  const { data, error } = await auth.service
    .from('articles')
    .update(updateData)
    .eq('id', body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE: delete article
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await auth.service.from('articles').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
