import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServiceClient } from '@/lib/supabase';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import { safeParseJSON, isValidUUID } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);

    // Persistent rate limit: 60 per minute per IP
    const rl = await checkRateLimit(`track:${ip}`, RATE_LIMITS.tracking.limit, RATE_LIMITS.tracking.windowMs);
    if (rl.limited) {
      return NextResponse.json({ ok: true }); // Silently drop
    }

    const body = await safeParseJSON(req);
    if (!body) {
      return NextResponse.json({ ok: true }); // Silently drop bad requests
    }

    const { page_path, article_id, referrer } = body as {
      page_path?: string;
      article_id?: string;
      referrer?: string;
    };

    // LOW-SEC-5 : page_path doit etre un chemin interne plausible.
    // Empeche la pollution de page_views par des strings arbitraires
    // ou par des URLs externes (qui n'ont rien a faire dans notre table).
    if (!page_path || typeof page_path !== 'string') {
      return NextResponse.json({ ok: true });
    }
    if (!page_path.startsWith('/') || page_path.length > 500 || /[\s<>"]/.test(page_path)) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ ok: true }); // Silently fail
    }

    // H-5 : valider article_id en UUID pour éviter la pollution de la table par
    // des strings arbitraires (impacterait les vues admin + exports XLSX).
    const safeArticleId = article_id && isValidUUID(article_id) ? article_id : null;

    // Tracking est best-effort, on retourne toujours 200 au client pour ne
    // pas casser le rendu, mais on capture les erreurs Supabase a Sentry en
    // niveau info pour qu'un drop massif soit observable (audit 2026-05-20).
    const { error: insertError } = await supabase.from('page_views').insert({
      page_path: String(page_path).slice(0, 500),
      article_id: safeArticleId,
      referrer: referrer ? String(referrer).slice(0, 500) : null,
      viewed_at: new Date().toISOString(),
    });
    if (insertError) {
      Sentry.captureMessage('page_views insert failed', {
        level: 'info',
        tags: { context: 'track-api' },
        extra: { code: insertError.code, hint: insertError.hint },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err, { level: 'info', tags: { context: 'track-api' } });
    return NextResponse.json({ ok: true }); // Never fail tracking
  }
}
