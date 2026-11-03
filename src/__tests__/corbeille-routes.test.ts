import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: (fn: unknown) => fn }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }));
vi.mock('@/lib/audit', () => ({ logAuditEvent: vi.fn(async () => undefined), SYSTEM_AUDIT_ID: '00000000-0000-0000-0000-000000000000' }));
vi.mock('@/lib/supabase', () => ({ createServiceClient: vi.fn(() => null), createServerSupabaseClient: vi.fn(async () => null) }));
vi.mock('@/lib/admin-auth', () => ({ requireAdmin: vi.fn() }));
vi.mock('@/lib/email', () => ({ sendTransactionalEmail: vi.fn(async () => undefined) }));

import { ADMIN, clientFactice, connecter, definie, refuser, requete, uuid } from './helpers/routes-factices';

const routeCorbeille = () => import('@/app/api/admin/corbeille/route');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('route de la corbeille', () => {
  it.each([401, 403] as const)('sans compte administrateur (%i) : ni purge, ni liste, ni restauration, ni suppression', async (statut) => {
    const { rpc, from } = clientFactice();
    refuser(statut);
    const { GET, POST, DELETE } = await routeCorbeille();

    const reponses = [
      definie(await GET(requete('/api/admin/corbeille', { method: 'GET' }))),
      definie(await POST(requete('/api/admin/corbeille', { method: 'POST', body: { id: uuid(900) } }))),
      definie(await DELETE(requete(`/api/admin/corbeille?id=${uuid(900)}`, { method: 'DELETE' }))),
    ];

    for (const reponse of reponses) expect(reponse.status).toBe(statut);
    expect(rpc).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it('GET purge ce qui a dépassé trente jours AVANT de lister, et ne renvoie pas le contenu', async () => {
    const factice = clientFactice({
      rpc: { corbeille_purger: { data: { purgees: [], lecteurs_retires: 0 } } },
      liste: {
        data: [{ id: uuid(900), table_origine: 'articles', id_origine: uuid(100), titre: 'Le franc CFA', supprime_le: '2026-11-03T10:00:00Z', resume_dependants: {} }],
        error: null,
        count: 1,
      },
    });
    connecter(factice.service);
    const { GET } = await routeCorbeille();

    const reponse = definie(await GET(requete('/api/admin/corbeille', { method: 'GET' })));
    const corps = await reponse.json();

    expect(reponse.status).toBe(200);
    expect(factice.ordre).toEqual(['rpc:corbeille_purger', 'from:contenus_supprimes']);
    expect(factice.rpc).toHaveBeenCalledWith('corbeille_purger', { p_jours: 30 });
    expect(corps).toMatchObject({ total: 1, suite: null, limite: 200, dureeConservationJours: 30 });
    expect(corps.entrees[0]).toEqual({
      id: uuid(900),
      table_origine: 'articles',
      id_origine: uuid(100),
      titre: 'Le franc CFA',
      supprime_le: '2026-11-03T10:00:00Z',
      resume_dependants: {},
    });
  });

  it('GET liste quand même si la purge échoue (elle est rejouée chaque nuit)', async () => {
    const factice = clientFactice({ rpc: { corbeille_purger: { error: { code: 'XX000', message: 'boum' } } } });
    connecter(factice.service);
    const { GET } = await routeCorbeille();
    expect(definie(await GET(requete('/api/admin/corbeille', { method: 'GET' }))).status).toBe(200);
  });

  it('GET dit que la corbeille n’est pas installée quand la table manque', async () => {
    const factice = clientFactice({
      rpc: { corbeille_purger: { error: { code: 'PGRST202', message: 'Could not find the function' } } },
      liste: { data: null, error: { code: 'PGRST205', message: "Could not find the table 'public.contenus_supprimes'" } },
    });
    connecter(factice.service);
    const { GET } = await routeCorbeille();
    const reponse = definie(await GET(requete('/api/admin/corbeille', { method: 'GET' })));
    expect(reponse.status).toBe(503);
    expect((await reponse.json()).error).toContain('migration 00032');
  });

  it('GET donne la page suivante à partir d’une entrée, et refuse une position mal formée avant toute requête', async () => {
    const factice = clientFactice({ rpc: { corbeille_purger: { data: { purgees: [], lecteurs_retires: 0 } } } });
    connecter(factice.service);
    const { GET } = await routeCorbeille();

    const avant = '2026-11-03T10:00:00.123456+00:00';
    const suite = definie(
      await GET(requete(`/api/admin/corbeille?avant_le=${encodeURIComponent(avant)}&avant_id=${uuid(900)}`, { method: 'GET' })),
    );
    expect(suite.status).toBe(200);
    const chaine = factice.from.mock.results[0]?.value as Record<string, ReturnType<typeof vi.fn>>;
    expect(chaine.or).toHaveBeenCalledWith(`supprime_le.lt."${avant}",and(supprime_le.eq."${avant}",id.lt.${uuid(900)})`);

    vi.clearAllMocks();
    connecter(factice.service);
    for (const adresse of [
      `/api/admin/corbeille?avant_le=${encodeURIComponent(avant)}`,
      `/api/admin/corbeille?avant_id=${uuid(900)}`,
      `/api/admin/corbeille?avant_le=hier&avant_id=${uuid(900)}`,
      `/api/admin/corbeille?avant_le=${encodeURIComponent(`${avant},id.gt.0`)}&avant_id=${uuid(900)}`,
    ]) {
      expect(definie(await GET(requete(adresse, { method: 'GET' }))).status, adresse).toBe(400);
    }
    expect(factice.rpc).not.toHaveBeenCalled();
    expect(factice.from).not.toHaveBeenCalled();
  });

  it('POST restaure une entrée et renvoie le message et les remarques', async () => {
    const factice = clientFactice({
      rpc: { corbeille_restaurer: { data: { table: 'articles', titre: 'Le franc CFA', id_origine: uuid(100), slug: 'franc-cfa', remis: {}, remarques: [] } } },
    });
    connecter(factice.service);
    const { POST } = await routeCorbeille();

    const reponse = definie(await POST(requete('/api/admin/corbeille', { method: 'POST', body: { id: uuid(900) } })));

    expect(reponse.status).toBe(200);
    expect(factice.rpc).toHaveBeenCalledWith('corbeille_restaurer', { p_entree: uuid(900) });
    expect(await reponse.json()).toMatchObject({ table: 'articles', titre: 'Le franc CFA', remarques: [] });
  });

  it('POST rend le refus de la base en français, avec son statut', async () => {
    const factice = clientFactice({
      rpc: {
        corbeille_restaurer: {
          error: { code: 'P0001', message: 'corbeille:slug_pris', details: JSON.stringify({ titre: 'A', table: 'articles', slug: 'a', autre: 'B' }) },
        },
      },
    });
    connecter(factice.service);
    const { POST } = await routeCorbeille();
    const reponse = definie(await POST(requete('/api/admin/corbeille', { method: 'POST', body: { id: uuid(900) } })));
    expect(reponse.status).toBe(409);
    expect((await reponse.json()).error).toMatch(/\/articles\/a/);
  });

  it('refuse un identifiant mal formé avant tout appel à la base', async () => {
    const factice = clientFactice();
    connecter(factice.service);
    const { POST, DELETE } = await routeCorbeille();

    const statuts = [
      definie(await POST(requete('/api/admin/corbeille', { method: 'POST', body: { id: 'abc' } }))).status,
      definie(await POST(requete('/api/admin/corbeille', { method: 'POST', body: { id: `${uuid(900)}' or 1=1` } }))).status,
      definie(await POST(requete('/api/admin/corbeille', { method: 'POST' }))).status,
      definie(await DELETE(requete('/api/admin/corbeille?id=abc', { method: 'DELETE' }))).status,
      definie(await DELETE(requete('/api/admin/corbeille', { method: 'DELETE' }))).status,
    ];

    expect(statuts).toEqual([400, 400, 400, 400, 400]);
    expect(factice.rpc).not.toHaveBeenCalled();
    expect(factice.from).not.toHaveBeenCalled();
  });

  it('DELETE supprime définitivement par corbeille_vider, puis répond 404 pour une entrée déjà partie', async () => {
    const pleine = clientFactice({
      rpc: { corbeille_vider: { data: { table: 'articles', id_origine: uuid(100), titre: 'A', commentaires: 2, jaime: 0 } } },
    });
    connecter(pleine.service);
    const { DELETE } = await routeCorbeille();
    const reponse = definie(await DELETE(requete(`/api/admin/corbeille?id=${uuid(900)}`, { method: 'DELETE' })));
    expect(reponse.status).toBe(200);
    expect(String((await reponse.json()).message).replace(/[\u00a0\u202f]/g, ' ')).toMatch(/« A », avec 2 commentaires\.$/);
    expect(pleine.rpc).toHaveBeenCalledWith('corbeille_vider', { p_entree: uuid(900) });
    expect(pleine.from).not.toHaveBeenCalled();

    const vide = clientFactice({
      rpc: { corbeille_vider: { error: { code: 'P0001', message: 'corbeille:entree_introuvable', details: null } } },
    });
    connecter(vide.service);
    expect(definie(await DELETE(requete(`/api/admin/corbeille?id=${uuid(900)}`, { method: 'DELETE' }))).status).toBe(404);
  });
});

interface CasDeSuppression {
  nom: string;
  table: string;
  appeler: (id: string) => Promise<Response | undefined>;
  /** La route des articles a sa propre garde, qui répond toujours 401. */
  statutRefus?: number;
}

const CAS: CasDeSuppression[] = [
  {
    nom: 'article',
    table: 'articles',
    statutRefus: 401,
    appeler: async (id) => (await import('@/app/api/admin/articles/route')).DELETE(requete(`/api/admin/articles?id=${id}`, { method: 'DELETE' })),
  },
  {
    nom: 'leçon',
    table: 'education_lessons',
    appeler: async (id) =>
      (await import('@/app/api/admin/education/lessons/route')).DELETE(requete(`/api/admin/education/lessons?id=${id}`, { method: 'DELETE' })),
  },
  {
    nom: 'catégorie de leçons',
    table: 'education_categories',
    appeler: async (id) =>
      (await import('@/app/api/admin/education/categories/route')).DELETE(requete(`/api/admin/education/categories?id=${id}`, { method: 'DELETE' })),
  },
  {
    nom: 'fiche entreprise',
    table: 'strategic_enterprises',
    appeler: async (id) =>
      (await import('@/app/api/admin/strategic-enterprises/route')).DELETE(requete(`/api/admin/strategic-enterprises?id=${id}`, { method: 'DELETE' })),
  },
  {
    nom: 'section de page légale',
    table: 'legal_sections',
    appeler: async (id) =>
      (await import('@/app/api/admin/legal-sections/route')).DELETE(requete('/api/admin/legal-sections', { method: 'DELETE', body: { id } })),
  },
  {
    nom: 'numéro de newsletter',
    table: 'newsletter_issues',
    appeler: async (id) =>
      (await import('@/app/api/admin/newsletter/[id]/route')).DELETE(requete(`/api/admin/newsletter/${id}`, { method: 'DELETE' }), {
        params: Promise.resolve({ id }),
      }),
  },
];

describe('les suppressions éditoriales passent par corbeille_mettre', () => {
  it.each(CAS)('$nom : une seule transaction en base, puis la réponse', async (cas) => {
    const factice = clientFactice({
      rpc: { corbeille_mettre: { data: { id_corbeille: uuid(900), titre: 'X', slug: null, resume: {} } } },
    });
    connecter(factice.service);

    const reponse = definie(await cas.appeler(uuid(100)));

    expect(reponse.status).toBe(200);
    expect(await reponse.json()).toEqual({ success: true, corbeille: true, idCorbeille: uuid(900) });
    expect(factice.rpc).toHaveBeenCalledTimes(1);
    expect(factice.rpc).toHaveBeenCalledWith('corbeille_mettre', { p_table: cas.table, p_id: uuid(100), p_par: ADMIN });
    // Aucune lecture ni suppression directe : tout se passe dans la fonction SQL.
    expect(factice.from).not.toHaveBeenCalled();
  });

  it.each(CAS)('$nom : le refus de la base est rendu tel quel, en français', async (cas) => {
    const factice = clientFactice({
      rpc: { corbeille_mettre: { error: { code: 'P0001', message: 'corbeille:introuvable', details: null } } },
    });
    connecter(factice.service);

    const reponse = definie(await cas.appeler(uuid(100)));

    expect(reponse.status).toBe(404);
    expect((await reponse.json()).error).toMatch(/introuvable/);
  });

  it.each(CAS)('$nom : sans compte administrateur, rien n’est appelé', async (cas) => {
    const factice = clientFactice();
    refuser(403);

    const reponse = definie(await cas.appeler(uuid(100)));

    expect(reponse.status).toBe(cas.statutRefus ?? 403);
    expect(factice.rpc).not.toHaveBeenCalled();
  });

  it.each(CAS)('$nom : un identifiant mal formé est refusé avant la base', async (cas) => {
    const factice = clientFactice();
    connecter(factice.service);

    const reponse = definie(await cas.appeler('pas-un-uuid'));

    expect(reponse.status).toBe(400);
    expect(factice.rpc).not.toHaveBeenCalled();
  });
});
