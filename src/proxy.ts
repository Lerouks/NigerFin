import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Construit une CSP nonce-based dynamique. Le nonce est unique par requete
 * et applique aux scripts inline via React + Next.js (via headers().get('x-nonce')).
 * 'strict-dynamic' autorise les scripts charges PAR un script noncee a charger
 * d'autres scripts sans nonce (hydration React, Sentry, PostHog).
 *
 * En dev on garde 'unsafe-eval' pour React Hot Reload + DevTools.
 */
function buildCspHeader(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    // LOW-SEC-4 : on restreint au bucket Supabase reel (extrait de
    // NEXT_PUBLIC_SUPABASE_URL) plutot que d'autoriser tous les sous-domaines
    // *.supabase.co. Reduit la surface si un autre client Supabase fait
    // fuiter un URL d'image vers nos pages.
    "img-src 'self' data: blob: https://images.unsplash.com https://golrvonbqivqzywprjoo.supabase.co",
    "font-src 'self'",
    // Sec M-2 : iPayMoney (SDK checkout.js). Domaine reel = i-pay.money (pas
    // ipaymoney.com). Le SDK fait un fetch POST vers
    // https://i-pay.money/api/sdk/payment_pages (=> connect-src) ET affiche la
    // page de paiement dans une iframe i-pay.money (=> frame-src). Sans ces deux
    // autorisations, le paiement echoue silencieusement en CSP stricte.
    `connect-src 'self' data: https://*.supabase.co https://*.sentry.io https://*.posthog.com https://i-pay.money https://*.ipaymoney.com https://*.ifutur.com${isDev ? ' ws://localhost:* http://localhost:*' : ''}`,
    "frame-src https://i-pay.money https://*.ipaymoney.com https://*.ifutur.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  if (!isDev) directives.push('upgrade-insecure-requests');
  return directives.join('; ');
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') || '';
  if (host.startsWith('www.')) {
    const target = new URL(request.nextUrl);
    target.host = host.replace(/^www\./, '');
    return NextResponse.redirect(target, 308);
  }

  const { pathname } = request.nextUrl;
  if (pathname.length > 1 && pathname.endsWith('/')) {
    const target = new URL(request.nextUrl);
    target.pathname = pathname.replace(/\/+$/, '');
    return NextResponse.redirect(target, 308);
  }

  // Generation d'un nonce CSP par requete. Utilise pour les scripts inline
  // (JSON-LD dans layout, scripts d'hydration React via Next.js).
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = buildCspHeader(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  // Expose le chemin courant au layout racine (allow-list du mode pré-lancement).
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('Content-Security-Policy', cspHeader);
    return response;
  }

  // Court-circuit perf : si aucun cookie Supabase n'est present (visiteur
  // anonyme, ~90% du trafic Niger), on skip TOTALEMENT le refresh auth.
  // Sans cookie write, la reponse reste cacheable au Edge Vercel ce qui
  // debloque l'ISR (revalidate=3600) et evite le round-trip
  // Niger -> Paris -> us-west-1 sur chaque visite.
  // Gain estime LCP -1 a -1.5s sur 3G Niger.
  const hasSupabaseSession = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-'));

  if (!hasSupabaseSession) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('Content-Security-Policy', cspHeader);
    return response;
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });
  supabaseResponse.headers.set('Content-Security-Policy', cspHeader);

  const supabase = createServerClient(url, key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          supabaseResponse.headers.set('Content-Security-Policy', cspHeader);
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the auth token (ignore errors, stale tokens are acceptable)
  try {
    await supabase.auth.getUser();
  } catch {
    // Token refresh failure is non-critical, user will be prompted to re-auth
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
