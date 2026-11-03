import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { isValidUUID, safeParseJSON } from '@/lib/validation';
import { serverError } from '@/lib/api-error';
import { mettreALaCorbeille } from '@/lib/corbeille';
import {
  getIssue,
  updateIssue,
  type NewsletterAudience,
  type NewsletterStatus,
  type UpdateIssueInput,
} from '@/lib/newsletter/issues';
import type { NewsletterIssue } from '@/emails/types';

const VALID_AUDIENCES: NewsletterAudience[] = ['premium', 'all', 'free'];
const VALID_STATUSES: NewsletterStatus[] = ['draft', 'scheduled', 'sending', 'sent', 'cancelled'];

interface Params { id: string; }

export async function GET(_req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const { id } = await ctx.params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }
    const issue = await getIssue(id);
    if (!issue) {
      return NextResponse.json({ error: 'Numéro introuvable' }, { status: 404 });
    }
    return NextResponse.json({ issue });
  } catch (err) {
    return serverError(err, 'admin-newsletter-get');
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const { id } = await ctx.params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const body = (await safeParseJSON(req)) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
    }

    const patch: UpdateIssueInput = {};

    if (typeof body.subject === 'string') patch.subject = body.subject.slice(0, 200);
    if (body.preheader === null || typeof body.preheader === 'string') {
      patch.preheader = body.preheader as string | null;
    }
    if (typeof body.slug === 'string' && /^[a-z0-9-]+$/.test(body.slug)) {
      patch.slug = body.slug;
    }
    if (typeof body.audience === 'string' && VALID_AUDIENCES.includes(body.audience as NewsletterAudience)) {
      patch.audience = body.audience as NewsletterAudience;
    }
    if (typeof body.status === 'string' && VALID_STATUSES.includes(body.status as NewsletterStatus)) {
      patch.status = body.status as NewsletterStatus;
    }
    if (body.scheduled_at === null || typeof body.scheduled_at === 'string') {
      patch.scheduled_at = body.scheduled_at as string | null;
    }
    if (body.content && typeof body.content === 'object') {
      patch.content = body.content as NewsletterIssue;
    }

    const issue = await updateIssue(id, patch);
    return NextResponse.json({ issue });
  } catch (err) {
    return serverError(err, 'admin-newsletter-update');
  }
}

// DELETE: le numéro part à la corbeille, avec ses événements d'envoi. Un
// numéro déjà envoyé, ou en cours d'envoi, reste impossible à supprimer : la
// corbeille applique ce refus elle-même, dans la même transaction.
export async function DELETE(_req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const { id } = await ctx.params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }
    const resultat = await mettreALaCorbeille(auth.serviceClient, 'newsletter_issues', id, auth.user.id);
    if (!resultat.ok) return NextResponse.json({ error: resultat.motif }, { status: resultat.statut });
    return NextResponse.json({ success: true, corbeille: true, idCorbeille: resultat.idCorbeille });
  } catch (err) {
    return serverError(err, 'admin-newsletter-delete');
  }
}
