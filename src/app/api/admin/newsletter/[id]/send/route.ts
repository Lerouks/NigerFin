import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { isValidUUID } from '@/lib/validation';
import { serverError } from '@/lib/api-error';
import { sendNewsletterIssue } from '@/lib/newsletter/send';

interface Params { id: string; }

/**
 * POST /api/admin/newsletter/:id/send
 * Lance l'envoi d'un numero a toute son audience. Admin only. Synchronous.
 */
export async function POST(_req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { id } = await ctx.params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const result = await sendNewsletterIssue(id);
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    return serverError(err, 'admin-newsletter-send');
  }
}
