import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { isValidUUID, isValidEmail, safeParseJSON } from '@/lib/validation';
import { getTransactionalDef, type TransactionalArgs } from '@/lib/emails/registry';
import { applyOverridesTo } from '@/lib/emails/overrides';
import { sendTransactionalEmail } from '@/lib/email';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface Params { type: string; }

/**
 * POST /api/admin/emails/transactional/:type/resend
 * Body : { to: string; userId?: string }
 * Renvoie un VRAI e-mail transactionnel a un client (pas de prefixe [TEST]),
 * avec ses vraies donnees si userId fourni. Cas d'usage support : « renvoyer la
 * facture », « renvoyer l'e-mail de bienvenue ». Admin only, tracké, audité.
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
    if (!body?.to || !isValidEmail(body.to)) {
      return NextResponse.json({ error: 'Adresse e-mail du client requise' }, { status: 400 });
    }
    const to = body.to;
    const userId = body.userId && isValidUUID(body.userId) ? body.userId : undefined;

    let args: TransactionalArgs = { ...def.sampleArgs };
    if (userId && def.resolveRealArgs) {
      const real = await def.resolveRealArgs(serviceClient, userId);
      args = { ...args, ...real };
    }

    const { subject, html } = await applyOverridesTo(def.key, def.render(args));
    const result = await sendTransactionalEmail({
      to,
      subject,
      html,
      emailType: def.key,
      ...(userId ? { userId } : {}),
    });

    if (!result) {
      Sentry.captureMessage('Transactional resend returned null', {
        level: 'warning',
        extra: { type: def.key, to },
      });
      return NextResponse.json({ error: "Échec d'envoi (Resend non configuré)" }, { status: 500 });
    }

    await logAuditEvent(user.id, 'email.transactional_resend', 'email', def.key, { to, userId: userId ?? null });
    return NextResponse.json({ success: true, sentTo: to });
  } catch (err) {
    return serverError(err, 'admin-emails-transactional-resend');
  }
}
