import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { compressImageBuffer } from '@/lib/image-compress';

export async function POST(req: NextRequest) {
  // Contrôle d'accès unique, le même que toutes les autres routes /api/admin :
  // requireAdmin vérifie la session ET le rôle, et rend le client de service.
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const service = auth.serviceClient;

  // Parse form data
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
  }

  // Generate unique filename with cryptographically secure random ID
  const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
  const filename = `${Date.now()}-${randomUUID()}.${ext}`;
  const path = `articles/${filename}`;

  // Compress before upload (target <100KB, preserves format)
  const originalBuffer = Buffer.from(await file.arrayBuffer());
  const { buffer, beforeBytes, afterBytes } = await compressImageBuffer(originalBuffer, file.type);

  // Upload to Supabase Storage
  const { error: uploadError } = await service.storage
    .from('article-images')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
      cacheControl: '31536000',
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get public URL
  const { data: { publicUrl } } = service.storage
    .from('article-images')
    .getPublicUrl(path);

  return NextResponse.json({
    url: publicUrl,
    originalSize: beforeBytes,
    compressedSize: afterBytes,
    savedPercent: beforeBytes > 0 ? Math.round(((beforeBytes - afterBytes) / beforeBytes) * 100) : 0,
  });
}
