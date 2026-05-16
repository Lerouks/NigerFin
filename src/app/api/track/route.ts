import { NextRequest, NextResponse } from 'next/server';
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

    if (!page_path) {
      return NextResponse.json({ error: 'page_path required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ ok: true }); // Silently fail
    }

    // H-5 : valider article_id en UUID pour éviter la pollution de la table par
    // des strings arbitraires (impacterait les vues admin + exports XLSX).
    const safeArticleId = article_id && isValidUUID(article_id) ? article_id : null;

    await supabase.from('page_views').insert({
      page_path: String(page_path).slice(0, 500),
      article_id: safeArticleId,
      referrer: referrer ? String(referrer).slice(0, 500) : null,
      viewed_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Never fail tracking
  }
}
