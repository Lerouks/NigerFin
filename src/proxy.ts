import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import {
  PAGE_ATTENTE,
  PRE_LANCEMENT_PAR_DEFAUT,
  decidePorte,
  estInfrastructure,
  type DecisionPorte,
} from '@/lib/pre-lancement';

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

/**
 * Réglage « pré-lancement » lu en base, gardé 30 secondes par instance. Une
 * base lente ne doit jamais bloquer le site : délai de 2 secondes, puis dernier
 * état connu, sinon porte fermée (voir PRE_LANCEMENT_PAR_DEFAUT).
 */
const DUREE_REGLAGE_MS = 30_000;
const NOUVEL_ESSAI_APRES_PANNE_MS = 5_000;
let reglage: { valeur: boolean; jusqua: number } | null = null;
let lectureEnCours: Promise<boolean> | null = null;

async function lirePreLancement(url: string, key: string): Promise<boolean> {
  if (reglage && Date.now() < reglage.jusqua) return reglage.valeur;
  if (!lectureEnCours) {
    lectureEnCours = (async () => {
      try {
        const supabase = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data, error } = await supabase
          .from('site_features')
          .select('prelaunch_enabled')
          .eq('id', 1)
          .abortSignal(AbortSignal.timeout(2_000))
          .maybeSingle();
        if (error || !data) throw error ?? new Error('site_features sans ligne');
        const valeur = data.prelaunch_enabled === true;
        reglage = { valeur, jusqua: Date.now() + DUREE_REGLAGE_MS };
        return valeur;
      } catch {
        const valeur = reglage?.valeur ?? PRE_LANCEMENT_PAR_DEFAUT;
        reglage = { valeur, jusqua: Date.now() + NOUVEL_ESSAI_APRES_PANNE_MS };
        return valeur;
      } finally {
        lectureEnCours = null;
      }
    })();
  }
  return lectureEnCours;
}

/** Rôle admin des comptes connectés, gardé 60 secondes (même règle que src/lib/viewer.ts). */
const DUREE_ROLE_MS = 60_000;
const roles = new Map<string, { admin: boolean; jusqua: number }>();

async function estAdmin(userId: string): Promise<boolean> {
  const connu = roles.get(userId);
  if (connu && Date.now() < connu.jusqua) return connu.admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return false;
  try {
    const supabase = createClient(url, service, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .abortSignal(AbortSignal.timeout(2_000))
      .maybeSingle();
    if (error) return false;
    const admin = data?.role === 'admin';
    if (roles.size > 500) roles.clear();
    roles.set(userId, { admin, jusqua: Date.now() + DUREE_ROLE_MS });
    return admin;
  } catch {
    return false;
  }
}

/**
 * Traduit la décision de la porte en réponse. `suite` est la réponse « laisser
 * passer » déjà préparée (en-têtes de requête, cookies de session rafraîchis) :
 * les cookies sont recopiés sur toute autre réponse pour ne pas perdre un
 * rafraîchissement de session.
 */
function appliquerPorte(
  decision: DecisionPorte,
  request: NextRequest,
  requestHeaders: Headers,
  suite: NextResponse,
): NextResponse {
  if (decision === 'passer') return suite;

  let reponse: NextResponse;
  if (decision === 'attente') {
    requestHeaders.set('x-pathname', PAGE_ATTENTE);
    reponse = NextResponse.rewrite(new URL(PAGE_ATTENTE, request.url), {
      request: { headers: requestHeaders },
    });
  } else if (decision === 'connexion') {
    const cible = new URL('/connexion', request.url);
    cible.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
    reponse = NextResponse.redirect(cible, 307);
  } else if (decision === 'accueil') {
    reponse = NextResponse.redirect(new URL('/', request.url), 307);
  } else {
    reponse = request.nextUrl.pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Not found' }, { status: 404 })
      : new NextResponse('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  reponse.headers.set('Cache-Control', 'private, no-store');
  suite.cookies.getAll().forEach((cookie) => reponse.cookies.set(cookie));
  return reponse;
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

  // Court-circuit perf : si aucun cookie Supabase n'est present (visiteur
  // anonyme, ~90% du trafic Niger), on skip TOTALEMENT le refresh auth.
  // Sans cookie write, la reponse reste cacheable au Edge Vercel ce qui
  // debloque l'ISR (revalidate=3600) et evite le round-trip
  // Niger -> Paris -> us-west-1 sur chaque visite.
  // Gain estime LCP -1 a -1.5s sur 3G Niger.
  const hasSupabaseSession = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-'));

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });
  let userId: string | null = null;

  if (url && key && hasSupabaseSession) {
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
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh the auth token (ignore errors, stale tokens are acceptable)
    try {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
    } catch {
      // Token refresh failure is non-critical, user will be prompted to re-auth
    }
  }

  // Porte du pré-lancement (src/lib/pre-lancement.ts). Elle est ici, et non
  // dans le layout racine, parce que le proxy voit toutes les requêtes : les
  // navigations internes, les préchargements, les API, le plan du site.
  let response = supabaseResponse;
  if (!estInfrastructure(pathname)) {
    const preLancement = url && key ? await lirePreLancement(url, key) : PRE_LANCEMENT_PAR_DEFAUT;
    const admin = preLancement && userId ? await estAdmin(userId) : false;
    const decision = decidePorte({
      chemin: pathname,
      preLancement,
      admin,
      session: userId !== null,
    });
    response = appliquerPorte(decision, request, requestHeaders, supabaseResponse);
  }

  response.headers.set('Content-Security-Policy', cspHeader);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
