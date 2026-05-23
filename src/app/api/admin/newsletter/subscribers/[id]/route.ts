import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { unsubscribeById } from '@/lib/newsletter/subscribers';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { id } = await context.params;
    if (!id || !UUID_RE.test(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const ok = await unsubscribeById(id);
    if (!ok) {
      return NextResponse.json(
        { error: 'Impossible de désabonner cet utilisateur' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError(err, 'admin-newsletter-subscribers-unsubscribe');
  }
}
