import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { logAuditEvent } from '@/lib/audit';
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

    const result = await unsubscribeById(id);

    if (!result.ok) {
      return NextResponse.json(
        { error: 'Impossible de désabonner cet abonné' },
        { status: 500 },
      );
    }
    if (!result.found) {
      return NextResponse.json(
        { error: 'Abonné introuvable' },
        { status: 404 },
      );
    }

    // Audit trail: tracer toute action admin sur la base d'abonnés.
    await logAuditEvent(
      auth.user.id,
      'newsletter.unsubscribe',
      'newsletter_subscribers',
      id,
      { email: result.email ?? null },
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError(err, 'admin-newsletter-subscribers-unsubscribe');
  }
}
