import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { isValidUUID, isValidEmail, safeParseJSON } from '@/lib/validation';
import { getTransactionalDef, type TransactionalArgs } from '@/lib/emails/registry';
import { sendTransactionalEmail } from '@/lib/email';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface Params { type: string; }

/**
 * POST /api/admin/emails/transactional/:type/test
 * Body : { to?: string; userId?: string }
 *   - to    : adresse destinataire (defaut = e-mail admin courant)
 *   - userId: complete l'aperçu avec les vraies donnees d'un destinataire
 * Envoie l'e-mail transactionnel (objet prefixe [TEST]). Admin only, audite.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const { user, serviceClient } = auth;

    const { type } = await ctx.params;
    const def = getTransactionalDef(type);
    if (!def) {
      return NextResponse.json({ error: "Type d'e-mail inconnu" }, { status: 404 });
    }

    const body = (await safeParseJSON(req)) as { to?: string; userId?: string } | null;
    const to = body?.to && isValidEmail(body.to) ? body.to : user.email;
    if (!to || !isValidEmail(to)) {
      return NextResponse.json({ error: 'Adresse e-mail destinataire invalide' }, { status: 400 });
    }

    let args: TransactionalArgs = { ...def.sampleArgs };
    if (body?.userId && isValidUUID(body.userId) && def.resolveRealArgs) {
      const real = await def.resolveRealArgs(serviceClient, body.userId);
      args = { ...args, ...real };
    }

    const { subject, html } = def.render(args);
    const result = await sendTransactionalEmail({
      to,
      subject: `[TEST] ${subject}`,
      html,
    });

    if (!result) {
      Sentry.captureMessage('Transactional test send returned null', {
        level: 'warning',
        extra: { type: def.key, to },
      });
      return NextResponse.json({ error: "Échec d'envoi (Resend non configuré)" }, { status: 500 });
    }

    await logAuditEvent(user.id, 'email.transactional_test', 'email', def.key, { to });
    return NextResponse.json({ success: true, sentTo: to });
  } catch (err) {
    return serverError(err, 'admin-emails-transactional-test');
  }
}
