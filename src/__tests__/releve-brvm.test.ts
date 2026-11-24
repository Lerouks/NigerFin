import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const cache = vi.hoisted(() => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock('next/cache', () => cache);
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

const base = vi.hoisted(() => ({ seances: [] as unknown[], enregistrees: [] as unknown[][] }));
vi.mock('@/lib/brvm-seances', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/brvm-seances')>();
  return {
    ...original,
    lireSeancesBrvm: vi.fn(async () => base.seances),
    enregistrerSeancesBrvm: vi.fn(async (s: unknown[]) => {
      base.enregistrees.push(s);
    }),
  };
});

import { GET } from '@/app/api/cron/releve-brvm/route';

/**
 * RELEVÉ QUOTIDIEN DU BRVM COMPOSITE (24/11/2026)
 *
 * La tâche planifiée n'enregistre qu'une séance fermée et nouvelle, puis
 * rafraîchit le cache des séances et la page Finance.
 */

const PAGE = `<p class="header-seance">Mardi, 24 novembre, 2026 - 15:52</p>
<div class="seance-fermee">Séance fermée</div>
<table><tr><th>Nom</th><th>Fermeture précédente</th><th>Fermeture</th><th>Variation (%)</th></tr>
<tr><td>BRVM - COMPOSITE</td><td>476,54</td><td>472,04</td><td>-0,94</td><td>1,70</td></tr></table>`;

const requete = (secret?: string) =>
  new NextRequest('https://nfireport.com/api/cron/releve-brvm', {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });

beforeEach(() => {
  vi.clearAllMocks();
  base.seances = [{ date: '2026-11-23', precedent: 492.89, cloture: 476.54, variation: -3.32 }];
  base.enregistrees = [];
  process.env.CRON_SECRET = 'secret-de-test';
  vi.stubGlobal('fetch', vi.fn(async () => new Response(PAGE, { status: 200 })));
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.CRON_SECRET;
});

describe('Relevé BRVM', () => {
  it('refuse un appel sans le secret, sans rien lire', async () => {
    const reponse = await GET(requete());
    expect(reponse.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('ajoute la séance du jour et rafraîchit la page Finance', async () => {
    const reponse = await GET(requete('secret-de-test'));
    expect(reponse.status).toBe(200);
    expect(await reponse.json()).toMatchObject({ seance: '2026-11-24', cloture: 472.04, enregistree: true, seances: 2 });
    expect(base.enregistrees[0]).toHaveLength(2);
    expect(cache.revalidateTag).toHaveBeenCalledWith('brvm-seances', { expire: 0 });
    expect(cache.revalidatePath).toHaveBeenCalledWith('/finance');
  });

  it("n'écrit rien quand la séance est déjà enregistrée", async () => {
    base.seances = [...base.seances, { date: '2026-11-24', precedent: 476.54, cloture: 472.04, variation: -0.94 }];
    const reponse = await GET(requete('secret-de-test'));
    expect(await reponse.json()).toMatchObject({ enregistree: false, seances: 2 });
    expect(base.enregistrees).toHaveLength(0);
    expect(cache.revalidatePath).not.toHaveBeenCalled();
  });

  it("n'écrit rien pendant une séance ouverte", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(PAGE.replace('seance-fermee">Séance fermée', 'seance-ouverte">Séance ouverte'), { status: 200 })),
    );
    const reponse = await GET(requete('secret-de-test'));
    expect(await reponse.json()).toMatchObject({ statut: 'ouverte', enregistree: false });
    expect(base.enregistrees).toHaveLength(0);
  });

  it('signale une page illisible au lieu d’enregistrer un chiffre faux', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<p>Maintenance</p>', { status: 200 })));
    const reponse = await GET(requete('secret-de-test'));
    expect(reponse.status).toBe(502);
    expect(base.enregistrees).toHaveLength(0);
  });
});
