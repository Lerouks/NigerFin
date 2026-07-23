import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { listTransactionalDefs } from '@/lib/emails/registry';

// Synchro immediate : jamais de cache sur les lectures admin.
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/emails/transactional
 * Liste les e-mails transactionnels (metadonnees + objet rendu). Admin only.
 */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    return NextResponse.json(
      { emails: listTransactionalDefs() },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (err) {
    return serverError(err, 'admin-emails-transactional-list');
  }
}
