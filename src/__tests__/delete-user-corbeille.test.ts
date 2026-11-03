import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: (fn: unknown) => fn }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }));
vi.mock('@/lib/audit', () => ({ logAuditEvent: vi.fn(async () => undefined), SYSTEM_AUDIT_ID: '00000000-0000-0000-0000-000000000000' }));
vi.mock('@/lib/email', () => ({ sendTransactionalEmail: vi.fn(async () => undefined) }));
vi.mock('@/lib/supabase', () => ({ createServiceClient: vi.fn(() => null), createServerSupabaseClient: vi.fn(async () => null) }));

import type { SupabaseClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/nextjs';
import { sendTransactionalEmail } from '@/lib/email';
import { deleteUserCompletely } from '@/lib/delete-user';

const uuid = (n: number): string => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const ADMIN = uuid(1);
const LECTRICE = uuid(2);

/**
 * Un client qui note chaque opération dans l'ordre où elle arrive : c'est
 * l'ordre qui protège ici les données du lecteur.
 */
function clientQuiNote(options: { authEchoue?: boolean; corbeilleEchoue?: boolean } = {}) {
  const ordre: string[] = [];
  const from = vi.fn((table: string) => ({
    delete: () => ({
      eq: async (colonne: string) => {
        ordre.push(`delete:${table}.${colonne}`);
        return { error: null };
      },
    }),
  }));
  const rpc = vi.fn(async (nom: string) => {
    ordre.push(`rpc:${nom}`);
    return options.corbeilleEchoue
      ? { data: null, error: { code: 'XX000', message: 'boum' } }
      : { data: { entrees: 1, lignes: 2 }, error: null };
  });
  const deleteUser = vi.fn(async () => {
    ordre.push('auth.deleteUser');
    return { error: options.authEchoue ? { message: 'refusé' } : null };
  });
  const client = { from, rpc, auth: { admin: { deleteUser } } } as unknown as SupabaseClient;
  return { client, ordre, rpc };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('deleteUserCompletely et la corbeille', () => {
  it('supprime le profil et le compte, PUIS la corbeille, PUIS ce qui s’est écrit entre-temps, et enfin écrit au lecteur', async () => {
    const { client, ordre, rpc } = clientQuiNote();

    await deleteUserCompletely(client, LECTRICE, 'lectrice@exemple.test', 'Lectrice', ADMIN);

    const rang = (operation: string) => ordre.indexOf(operation);
    expect(rang('delete:comments.user_id')).toBeGreaterThanOrEqual(0);
    expect(rang('delete:user_profiles.id')).toBeGreaterThan(rang('delete:comments.user_id'));
    expect(rang('auth.deleteUser')).toBeGreaterThan(rang('delete:user_profiles.id'));
    expect(rang('rpc:corbeille_retirer_lecteur')).toBeGreaterThan(rang('auth.deleteUser'));
    // Second passage sur les commentaires et les j'aime, sans clé étrangère vers le compte.
    expect(ordre.slice(rang('rpc:corbeille_retirer_lecteur') + 1)).toEqual(['delete:comments.user_id', 'delete:article_likes.user_id']);
    expect(rpc).toHaveBeenCalledWith('corbeille_retirer_lecteur', { p_user: LECTRICE });
    expect(sendTransactionalEmail).toHaveBeenCalledTimes(1);
  });

  it('si le compte ne peut pas être supprimé, la corbeille garde ses lignes : le compte existe toujours', async () => {
    const { client, ordre } = clientQuiNote({ authEchoue: true });

    await expect(deleteUserCompletely(client, LECTRICE, 'lectrice@exemple.test', 'Lectrice', ADMIN)).rejects.toThrow();

    expect(ordre).not.toContain('rpc:corbeille_retirer_lecteur');
    expect(sendTransactionalEmail).not.toHaveBeenCalled();
  });

  it('une corbeille en panne est signalée, sans empêcher la fin de la suppression', async () => {
    const { client, ordre } = clientQuiNote({ corbeilleEchoue: true });

    await deleteUserCompletely(client, LECTRICE, 'lectrice@exemple.test', 'Lectrice', ADMIN);

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'delete-user: copies de la corbeille non retirées',
      expect.objectContaining({ tags: { context: 'delete-user-corbeille' } }),
    );
    expect(ordre.at(-1)).toBe('delete:article_likes.user_id');
    expect(sendTransactionalEmail).toHaveBeenCalledTimes(1);
  });
});
