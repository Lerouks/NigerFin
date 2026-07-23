import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { safeParseJSON } from '@/lib/validation';
import { isTransactionalKey } from '@/lib/emails/registry';
import { getEffectiveTexts, saveOverride } from '@/lib/emails/overrides';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface Params { type: string; }

/**
 * GET /api/admin/emails/transactional/:type
 * Renvoie les textes EFFECTIFS (defaut + surcharge) d'un e-mail, pour l'editeur.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { type } = await ctx.params;
    if (!isTransactionalKey(type)) {
      return NextResponse.json({ error: "Type d'e-mail inconnu" }, { status: 404 });
    }
    const texts = await getEffectiveTexts(type);
    return NextResponse.json(texts, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (err) {
    return serverError(err, 'admin-emails-transactional-get');
  }
}

/**
 * PATCH /api/admin/emails/transactional/:type
 * Body : { subject?: string|null; blocks?: Record<string,string> }
 * Enregistre l'edition des TEXTES (jamais le design). Admin only, audite.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const { user } = auth;

    const { type } = await ctx.params;
    if (!isTransactionalKey(type)) {
      return NextResponse.json({ error: "Type d'e-mail inconnu" }, { status: 404 });
    }

    const body = (await safeParseJSON(req)) as { subject?: unknown; blocks?: unknown } | null;
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
    }

    // Validation stricte aux frontieres : objet = string (<=200) ou null ; blocs = map string->string (<=2000).
    let subject: string | null | undefined;
    if (body.subject === null) subject = null;
    else if (typeof body.subject === 'string') {
      if (body.subject.length > 200) {
        return NextResponse.json({ error: 'Objet trop long (200 caractères max)' }, { status: 400 });
      }
      subject = body.subject;
    }

    let blocks: Record<string, string> | undefined;
    if (body.blocks !== undefined) {
      if (typeof body.blocks !== 'object' || body.blocks === null || Array.isArray(body.blocks)) {
        return NextResponse.json({ error: 'Blocs invalides' }, { status: 400 });
      }
      blocks = {};
      for (const [k, v] of Object.entries(body.blocks as Record<string, unknown>)) {
        if (typeof v !== 'string') {
          return NextResponse.json({ error: `Bloc "${k}" invalide` }, { status: 400 });
        }
        if (v.length > 2000) {
          return NextResponse.json({ error: `Bloc "${k}" trop long` }, { status: 400 });
        }
        blocks[k] = v;
      }
    }

    await saveOverride(type, { subject, blocks }, user.id);
    await logAuditEvent(user.id, 'email.transactional_edit', 'email', type, {
      subjectChanged: subject !== undefined,
      blocks: blocks ? Object.keys(blocks) : [],
    });

    const texts = await getEffectiveTexts(type);
    return NextResponse.json(texts, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (err) {
    return serverError(err, 'admin-emails-transactional-patch');
  }
}
