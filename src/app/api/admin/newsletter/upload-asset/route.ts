import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { compressImageBuffer } from '@/lib/image-compress';

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']);
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const BUCKET = 'newsletter-assets';

function safeFilename(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

/**
 * POST /api/admin/newsletter/upload-asset
 * Multipart form-data with field "file".
 * Uploads to bucket newsletter-assets, returns the public URL.
 * Admin only.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const { serviceClient } = auth;

    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Champ "file" manquant' }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: 'Fichier vide' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (5 MB max)' }, { status: 413 });
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `Type de fichier non supporté (${file.type}). Formats acceptés : PNG, JPEG, WebP, GIF, SVG.` },
        { status: 415 },
      );
    }

    const cleanName = safeFilename(file.name) || `image.${file.type.split('/')[1] ?? 'bin'}`;
    const path = `${new Date().getFullYear()}/${Date.now()}-${cleanName}`;

    const originalBuffer = Buffer.from(await file.arrayBuffer());
    // Compress before upload (skips SVG and animated GIF)
    const { buffer } = file.type === 'image/svg+xml'
      ? { buffer: originalBuffer }
      : await compressImageBuffer(originalBuffer, file.type);

    const { error: upErr } = await serviceClient.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000, immutable',
      upsert: false,
    });

    if (upErr) {
      return NextResponse.json({ error: `Échec upload : ${upErr.message}` }, { status: 500 });
    }

    const { data: pub } = serviceClient.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: pub.publicUrl, path });
  } catch (err) {
    return serverError(err, 'admin-newsletter-upload-asset');
  }
}
