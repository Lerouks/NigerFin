import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * comments.article_id et article_likes.article_id sont du texte, comparé à la
 * lettre près, et isValidUUID accepte les majuscules. Un identifiant gardé en
 * majuscules échappait à la corbeille : les commentaires et les j'aime d'un
 * article supprimé pour de bon lui survivaient. Les routes ramènent désormais
 * l'identifiant en minuscules, comme PostgreSQL l'écrit, avant toute écriture
 * et toute recherche. Ce test note chaque filtre et chaque insertion que les
 * routes envoient à la base.
 */

type Etape = [methode: string, args: unknown[]];
interface Appel {
  table: string;
  etapes: Etape[];
}

const appels: Appel[] = [];
let repondre: (appel: Appel) => unknown = () => ({ data: null, error: null, count: 0 });

function requeteNotee(table: string) {
  const appel: Appel = { table, etapes: [] };
  appels.push(appel);
  const chaine: Record<string, unknown> = {};
  for (const methode of ['select', 'eq', 'in', 'order', 'range', 'insert', 'delete', 'single', 'maybeSingle']) {
    chaine[methode] = (...args: unknown[]) => {
      appel.etapes.push([methode, args]);
      return chaine;
    };
  }
  chaine.then = (ok: (valeur: unknown) => unknown, ko?: (erreur: unknown) => unknown) =>
    Promise.resolve(repondre(appel)).then(ok, ko);
  return chaine;
}

const LECTEUR = '00000000-0000-4000-8000-000000000003';
const ADMIN = '00000000-0000-4000-8000-000000000001';
const MINUSCULES = 'abcdef00-0000-4000-8000-0000000000aa';
const MAJUSCULES = 'ABCDEF00-0000-4000-8000-0000000000AA';
const PARENT = '00000000-0000-4000-8000-000000000210';

const client = {
  from: (table: string) => requeteNotee(table),
  auth: {
    getUser: vi.fn(async () => ({
      data: { user: { id: LECTEUR, user_metadata: { full_name: 'Lecteur' }, email: 'lecteur@exemple.test' } },
    })),
  },
};

vi.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: vi.fn(async () => client),
  createServiceClient: vi.fn(() => client),
}));
vi.mock('@/lib/admin-auth', () => ({
  requireAdmin: vi.fn(async () => ({ user: { id: ADMIN }, serviceClient: client })),
}));
vi.mock('@/lib/audit', () => ({ logAuditEvent: vi.fn(async () => undefined) }));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(async () => ({ limited: false, remaining: 10, resetAt: new Date() })),
  getClientIP: vi.fn(() => '127.0.0.1'),
  RATE_LIMITS: { likes: { limit: 30, windowMs: 60000 }, comments: { limit: 10, windowMs: 60000 } },
}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }));

/** Les valeurs filtrées par eq(colonne, …) sur une table, dans l'ordre. */
function filtres(table: string, colonne: string): unknown[] {
  return appels
    .filter((appel) => appel.table === table)
    .flatMap((appel) => appel.etapes.filter(([methode, args]) => methode === 'eq' && args[0] === colonne).map(([, args]) => args[1]));
}

/** Les lignes insérées dans une table. */
function insertions(table: string): unknown[] {
  return appels
    .filter((appel) => appel.table === table)
    .flatMap((appel) => appel.etapes.filter(([methode]) => methode === 'insert').map(([, args]) => args[0]));
}

const a = (appel: Appel, methode: string) => appel.etapes.some(([m]) => m === methode);

function get(url: string): NextRequest {
  return new NextRequest(new Request(url, { method: 'GET' }));
}

function post(url: string, corps: unknown): NextRequest {
  return new NextRequest(
    new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) }),
  );
}

beforeEach(() => {
  appels.length = 0;
  repondre = () => ({ data: null, error: null, count: 0 });
});

describe('les commentaires', () => {
  it('la lecture cherche l’identifiant en minuscules, même reçu en majuscules', async () => {
    const { GET } = await import('@/app/api/comments/route');

    const reponse = await GET(get(`http://localhost/api/comments?article_id=${MAJUSCULES}`));

    expect(reponse.status).toBe(200);
    expect(filtres('comments', 'article_id')).toEqual([MINUSCULES, MINUSCULES]);
  });

  it('un commentaire reçu avec un identifiant en majuscules est enregistré en minuscules, et sa réponse reconnaît son article', async () => {
    repondre = (appel) => {
      if (appel.table === 'comments' && a(appel, 'insert')) return { data: { id: 'nouveau' }, error: null };
      if (appel.table === 'comments' && a(appel, 'single')) return { data: { id: PARENT, article_id: MINUSCULES }, error: null };
      return { data: null, error: null };
    };
    const { POST } = await import('@/app/api/comments/route');

    const reponse = await POST(
      post('http://localhost/api/comments', { article_id: MAJUSCULES, content: 'Très clair', parent_comment_id: PARENT }),
    );

    expect(reponse.status).toBe(201);
    expect(insertions('comments')).toEqual([
      { article_id: MINUSCULES, user_id: LECTEUR, user_name: 'Lecteur', content: 'Très clair', parent_comment_id: PARENT },
    ]);
  });

  it('une réponse à un ancien commentaire gardé en majuscules reste acceptée', async () => {
    repondre = (appel) => {
      if (appel.table === 'comments' && a(appel, 'insert')) return { data: { id: 'nouveau' }, error: null };
      if (appel.table === 'comments' && a(appel, 'single')) return { data: { id: PARENT, article_id: MAJUSCULES }, error: null };
      return { data: null, error: null };
    };
    const { POST } = await import('@/app/api/comments/route');

    const reponse = await POST(
      post('http://localhost/api/comments', { article_id: MINUSCULES, content: 'Merci', parent_comment_id: PARENT }),
    );

    expect(reponse.status).toBe(201);
    expect(insertions('comments')).toEqual([expect.objectContaining({ article_id: MINUSCULES })]);
  });
});

describe('les j’aime', () => {
  it('la lecture compte et cherche en minuscules', async () => {
    const { GET } = await import('@/app/api/likes/route');

    const reponse = await GET(get(`http://localhost/api/likes?article_id=${MAJUSCULES}`));

    expect(reponse.status).toBe(200);
    expect(filtres('article_likes', 'article_id')).toEqual([MINUSCULES, MINUSCULES]);
  });

  it('un j’aime reçu en majuscules est cherché puis enregistré en minuscules', async () => {
    const { POST } = await import('@/app/api/likes/route');

    const reponse = await POST(post('http://localhost/api/likes', { article_id: MAJUSCULES }));

    expect(reponse.status).toBe(200);
    expect(await reponse.json()).toEqual({ liked: true });
    expect(filtres('article_likes', 'article_id')).toEqual([MINUSCULES]);
    expect(insertions('article_likes')).toEqual([{ article_id: MINUSCULES, user_id: LECTEUR }]);
  });
});

describe('la modération des commentaires', () => {
  it('filtre en minuscules, et nomme l’article d’un ancien commentaire gardé en majuscules', async () => {
    repondre = (appel) => {
      if (appel.table === 'comments') {
        return {
          data: [{ id: PARENT, article_id: MAJUSCULES, user_id: LECTEUR, user_name: 'Lecteur', content: 'Ancien', parent_comment_id: null, created_at: '2026-10-01T10:00:00Z' }],
          count: 1,
          error: null,
        };
      }
      if (appel.table === 'articles') return { data: [{ id: MINUSCULES, title: 'Lettres' }], error: null };
      return { data: null, error: null };
    };
    const { GET } = await import('@/app/api/admin/comments/route');

    const reponse = await GET(get(`http://localhost/api/admin/comments?article_id=${MAJUSCULES}`));
    if (!reponse) throw new Error('la route n’a rien répondu');
    const corps = (await reponse.json()) as { data: { article_title: string }[] };

    expect(filtres('comments', 'article_id')).toEqual([MINUSCULES]);
    const recherche = appels.find((appel) => appel.table === 'articles')?.etapes.find(([methode]) => methode === 'in');
    expect(recherche?.[1]).toEqual(['id', [MINUSCULES]]);
    expect(corps.data[0]?.article_title).toBe('Lettres');
  });
});
