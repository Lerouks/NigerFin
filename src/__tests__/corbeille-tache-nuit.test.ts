import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: (fn: unknown) => fn }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }));
vi.mock('@/lib/audit', () => ({ logAuditEvent: vi.fn(async () => undefined), SYSTEM_AUDIT_ID: '00000000-0000-0000-0000-000000000000' }));
vi.mock('@/lib/supabase', () => ({ createServiceClient: vi.fn(() => null), createServerSupabaseClient: vi.fn(async () => null) }));
vi.mock('@/lib/admin-auth', () => ({ requireAdmin: vi.fn() }));
vi.mock('@/lib/email', () => ({ sendTransactionalEmail: vi.fn(async () => undefined) }));

import { createServiceClient } from '@/lib/supabase';
import { clientFactice, requete } from './helpers/routes-factices';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('la tâche de nuit purge la corbeille', () => {
  it('sans le secret, rien ne tourne', async () => {
    const factice = clientFactice();
    vi.mocked(createServiceClient).mockReturnValue(factice.service as never);
    process.env.CRON_SECRET = 'secret-de-test';
    const { GET } = await import('@/app/api/cron/expire-subscriptions/route');

    const reponse = await GET(requete('/api/cron/expire-subscriptions', { method: 'GET', headers: { authorization: 'Bearer faux' } }));

    expect(reponse.status).toBe(401);
    expect(factice.rpc).not.toHaveBeenCalled();
  });

  it('avec le secret, la corbeille est purgée une fois les abonnements traités', async () => {
    const factice = clientFactice({ rpc: { corbeille_purger: { data: { purgees: [], lecteurs_retires: 0 } } } });
    vi.mocked(createServiceClient).mockReturnValue(factice.service as never);
    process.env.CRON_SECRET = 'secret-de-test';
    const journal = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    try {
      const { GET } = await import('@/app/api/cron/expire-subscriptions/route');

      const reponse = await GET(
        requete('/api/cron/expire-subscriptions', { method: 'GET', headers: { authorization: 'Bearer secret-de-test' } }),
      );

      expect(reponse.status).toBe(200);
      expect(await reponse.json()).toEqual({ expired: 0, corbeille: { ok: true, purgees: 0, lecteursRetires: 0 } });
      expect(factice.rpc).toHaveBeenCalledWith('corbeille_purger', { p_jours: 30 });
      expect(factice.ordre[0]).toBe('from:user_profiles');
      expect(factice.ordre.at(-1)).toBe('rpc:corbeille_purger');
    } finally {
      journal.mockRestore();
    }
  });
});
