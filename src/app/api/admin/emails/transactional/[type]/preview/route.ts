import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { isValidUUID } from '@/lib/validation';
import { getTransactionalDef, type TransactionalArgs } from '@/lib/emails/registry';

// Synchro immediate : le rendu doit refleter l'etat courant, jamais un cache.
export const dynamic = 'force-dynamic';

interface Params { type: string; }

/**
 * GET /api/admin/emails/transactional/:type/preview
 * Rend le HTML d'un e-mail transactionnel pour une <iframe> d'aperçu.
 *  - defaut : donnees d'exemple (faux client)
 *  - ?userId=UUID : complete avec les vraies donnees du destinataire (best-effort)
 * Admin only.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const { serviceClient } = auth;

    const { type } = await ctx.params;
    const def = getTransactionalDef(type);
    if (!def) {
      return NextResponse.json({ error: "Type d'e-mail inconnu" }, { status: 404 });
    }

    let args: TransactionalArgs = { ...def.sampleArgs };
    const userId = req.nextUrl.searchParams.get('userId');
    if (userId && isValidUUID(userId) && def.resolveRealArgs) {
      const real = await def.resolveRealArgs(serviceClient, userId);
      args = { ...args, ...real };
    }

    const { html } = def.render(args);
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch (err) {
    return serverError(err, 'admin-emails-transactional-preview');
  }
}
