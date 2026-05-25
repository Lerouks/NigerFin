import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireAdmin as requireAdminShared } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { ARTICLE_CACHE_TAG } from '@/lib/articles';
import { parseJsonBody, isValidUUID } from '@/lib/validation';
import { sanitizeHtml } from '@/lib/sanitize-html';

// Sec H-3 / M-8 : allowlist explicite des colonnes editables + sanitize HTML
// du body cote serveur (defense en profondeur, meme si TipTap genere du HTML
// propre cote editeur).
const ArticleStatus = z.enum(['draft', 'published', 'archived']);
const ContentType = z.enum(['free', 'premium']);

const CreateArticleBody = z.object({
  title: z.string().min(1).max(300),
  subtitle: z.string().max(500).nullable().optional(),
  slug: z.string().max(200).optional(),
  excerpt: z.string().max(1000).nullable().optional(),
  category: z.string().max(60).optional(),
  sections: z.array(z.string().max(60)).max(10).optional(),
  content_type: ContentType.optional(),
  is_featured: z.boolean().optional(),
  featured_order: z.number().int().optional(),
  author_name: z.string().max(120).optional(),
  author_avatar: z.string().max(500).nullable().optional(),
  main_image_url: z.string().max(2000).nullable().optional(),
  main_image_alt: z.string().max(500).nullable().optional(),
  main_image_caption: z.string().max(500).nullable().optional(),
  main_image_source: z.string().max(500).nullable().optional(),
  body: z.string().max(500000).optional(),
  read_time: z.number().int().nullable().optional(),
  tags: z.array(z.string().max(60)).max(30).optional(),
  seo_title: z.string().max(300).nullable().optional(),
  seo_description: z.string().max(500).nullable().optional(),
  status: ArticleStatus.optional(),
  published_at: z.string().max(40).nullable().optional(),
});

const UpdateArticleBody = CreateArticleBody.partial().extend({
  id: z.string().refine((v) => isValidUUID(v), { message: 'id invalide' }),
});

/** Revalidate all pages that display article data */
function revalidateArticlePages(slug?: string) {
  // Purge le Data Cache Next.js (unstable_cache des fonctions articles).
  // Sans ça, les pages re-rendues serviraient encore l'ancien snapshot data.
  // Next.js 16 : second argument obligatoire, { expire: 0 } = purge immédiate.
  revalidateTag(ARTICLE_CACHE_TAG, { expire: 0 });
  revalidatePath('/');
  if (slug) revalidatePath(`/articles/${slug}`);
  for (const cat of ['/economie', '/finance', '/entreprises', '/education', '/marches', '/niger']) {
    revalidatePath(cat);
  }
  revalidatePath('/articles');
}

async function requireAdmin(_req: NextRequest) {
  const auth = await requireAdminShared();
  if ('error' in auth) return null;
  return { user: auth.user, service: auth.serviceClient };
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
    if (error) return serverError(error, 'admin-articles');
    return NextResponse.json(data);
  }

  // Otherwise return all articles with full data for editing
  const { data, error } = await auth.service
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return serverError(error, 'admin-articles');
  return NextResponse.json(data);
}

// POST: create article
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = await parseJsonBody(req, CreateArticleBody);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }
  const body = parsed.data;
  const slug = body.slug || slugify(body.title);

  const contentType = body.content_type ?? 'free';
  const sections = body.sections && body.sections.length > 0
    ? body.sections
    : [body.category || 'economie'];
  const safeBody = body.body ? sanitizeHtml(body.body) : '';

  const { data, error } = await auth.service.from('articles').insert({
    title: body.title,
    subtitle: body.subtitle ?? null,
    slug,
    excerpt: body.excerpt ?? null,
    category: sections[0],
    sections,
    content_type: contentType,
    is_featured: body.is_featured ?? false,
    featured_order: body.featured_order ?? 0,
    author_name: body.author_name || 'NFI Report',
    author_avatar: body.author_avatar ?? null,
    main_image_url: body.main_image_url ?? null,
    main_image_alt: body.main_image_alt ?? null,
    main_image_caption: body.main_image_caption ?? null,
    main_image_source: body.main_image_source ?? null,
    body: safeBody,
    read_time: body.read_time ?? null,
    tags: body.tags || [],
    seo_title: body.seo_title ?? null,
    seo_description: body.seo_description ?? null,
    status: body.status || 'draft',
    published_at: body.status === 'published'
      ? (body.published_at || new Date().toISOString())
      : body.published_at ?? null,
  }).select().single();

  if (error) return serverError(error, 'admin-articles');

  // Revalidate caches so the article appears immediately on the site
  if (data?.status === 'published') {
    revalidateArticlePages(data?.slug);
  }

  return NextResponse.json(data);
}

// PUT: update article
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = await parseJsonBody(req, UpdateArticleBody);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }
  const body = parsed.data;

  const updateData: Record<string, unknown> = {};
  const fields = [
    'title', 'subtitle', 'slug', 'excerpt', 'sections',
    'is_featured', 'featured_order', 'author_name', 'author_avatar',
    'main_image_url', 'main_image_alt', 'main_image_caption', 'main_image_source', 'read_time', 'tags',
    'seo_title', 'seo_description', 'status', 'published_at',
  ] as const;

  for (const field of fields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  // Sanitize HTML body server-side (TipTap output is already sanitized client-side
  // but defense in depth covers compromised admin or DB injection bypass).
  if (body.body !== undefined) {
    updateData.body = sanitizeHtml(body.body);
  }

  // Keep category in sync with first section
  if (Array.isArray(body.sections) && body.sections.length > 0) {
    updateData.category = body.sections[0];
  } else if (body.category !== undefined) {
    updateData.category = body.category;
  }

  if (body.content_type !== undefined) {
    updateData.content_type = body.content_type;
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

  if (error) return serverError(error, 'admin-articles');

  // Revalidate caches when article is published or updated
  if (data?.status === 'published') {
    revalidateArticlePages(data?.slug);
  }

  return NextResponse.json(data);
}

// DELETE: delete article
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id || !isValidUUID(id)) {
    return NextResponse.json({ error: 'id invalide (UUID requis)' }, { status: 400 });
  }

  // Fetch slug before deleting so we can revalidate the right pages
  const { data: article } = await auth.service.from('articles').select('slug').eq('id', id).single();
  const { error } = await auth.service.from('articles').delete().eq('id', id);
  if (error) return serverError(error, 'admin-articles');
  revalidateArticlePages(article?.slug);
  return NextResponse.json({ success: true });
}
