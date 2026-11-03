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
 * l'ordre qui protège ici les données du lecteur. Par défaut, le compte a
 * pour adresse « Lectrice@Exemple.test » dans auth.users ; adresse: null
 * figure un compte sans adresse.
 */
function clientQuiNote(
  options: {
    authEchoue?: boolean;
    corbeilleEchoue?: boolean;
    tableEnPanne?: string;
    lectureEchoue?: boolean;
    adresse?: string | null;
  } = {},
) {
  const ordre: string[] = [];
  const valeurs: Record<string, string[]> = {};
  const from = vi.fn((table: string) => ({
    delete: () => ({
      eq: async (colonne: string, valeur: string) => {
        ordre.push(`delete:${table}.${colonne}`);
        (valeurs[`${table}.${colonne}`] ??= []).push(valeur);
        // Le message d'une vraie erreur peut citer la valeur filtrée : ici, il la cite toujours.
        return { error: table === options.tableEnPanne ? { code: 'XX000', message: `boum (${valeur})` } : null };
      },
    }),
  }));
  const rpc = vi.fn(async (nom: string) => {
    ordre.push(`rpc:${nom}`);
    return options.corbeilleEchoue
      ? { data: null, error: { code: 'XX000', message: 'boum' } }
      : { data: { entrees: 1, lignes: 2 }, error: null };
  });
  const getUserById = vi.fn(async (id: string) => {
    ordre.push('auth.getUserById');
    if (options.lectureEchoue) {
      return { data: { user: null }, error: { status: 500, code: 'unexpected_failure', message: 'panne pour lectrice@exemple.test' } };
    }
    const email = options.adresse === undefined ? 'Lectrice@Exemple.test' : options.adresse;
    return { data: { user: { id, email: email ?? undefined } }, error: null };
  });
  const deleteUser = vi.fn(async () => {
    ordre.push('auth.deleteUser');
    return { error: options.authEchoue ? { message: 'refusé' } : null };
  });
  const client = { from, rpc, auth: { admin: { getUserById, deleteUser } } } as unknown as SupabaseClient;
  return { client, ordre, rpc, valeurs };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('deleteUserCompletely et la corbeille', () => {
  it('supprime le profil et le compte, PUIS la corbeille, PUIS ce qui s’est écrit entre-temps, et enfin écrit au lecteur', async () => {
    const { client, ordre, rpc, valeurs } = clientQuiNote();

    await deleteUserCompletely(client, LECTRICE, 'lectrice@exemple.test', 'Lectrice', ADMIN);

    const rang = (operation: string) => ordre.indexOf(operation);
    expect(rang('delete:comments.user_id')).toBeGreaterThanOrEqual(0);
    // L'abonnement à la newsletter, AVANT le profil et le compte : la base
    // viderait sinon son user_id. D'abord celui rattaché au compte, puis celui
    // d'avant le compte, par l'adresse lue dans auth.users.
    expect(rang('delete:newsletter_subscribers.user_id')).toBeGreaterThan(rang('delete:newsletter_preferences.user_id'));
    expect(rang('auth.getUserById')).toBeGreaterThan(rang('delete:newsletter_subscribers.user_id'));
    expect(rang('delete:newsletter_subscribers.email')).toBeGreaterThan(rang('auth.getUserById'));
    expect(rang('delete:user_profiles.id')).toBeGreaterThan(rang('delete:newsletter_subscribers.email'));
    expect(rang('auth.deleteUser')).toBeGreaterThan(rang('delete:user_profiles.id'));
    // Sous la forme que les inscriptions enregistrent, à l'identique.
    expect(valeurs['newsletter_subscribers.email']).toEqual(['lectrice@exemple.test']);
    expect(rang('rpc:corbeille_retirer_lecteur')).toBeGreaterThan(rang('auth.deleteUser'));
    // Second passage sur les commentaires et les j'aime, sans clé étrangère vers le compte.
    expect(ordre.slice(rang('rpc:corbeille_retirer_lecteur') + 1)).toEqual(['delete:comments.user_id', 'delete:article_likes.user_id']);
    expect(rpc).toHaveBeenCalledWith('corbeille_retirer_lecteur', { p_user: LECTRICE });
    expect(sendTransactionalEmail).toHaveBeenCalledTimes(1);
  });

  it('un abonnement qui ne part pas est signalé, par son code seul, sans empêcher la fin de la suppression', async () => {
    const { client, ordre } = clientQuiNote({ tableEnPanne: 'newsletter_subscribers' });

    await deleteUserCompletely(client, LECTRICE, 'lectrice@exemple.test', 'Lectrice', ADMIN);

    expect(Sentry.captureException).toHaveBeenCalledTimes(2);
    for (const etape of ['par-compte', 'par-adresse']) {
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'XX000' }),
        expect.objectContaining({ tags: { context: 'delete-user-newsletter' }, extra: { userId: LECTRICE, etape, code: 'XX000' } }),
      );
    }
    // Ni l'adresse, ni le message de la base qui la cite.
    expect(JSON.stringify(vi.mocked(Sentry.captureException).mock.calls)).not.toMatch(/lectrice@exemple\.test|boum/i);
    expect(ordre).toContain('auth.deleteUser');
    expect(sendTransactionalEmail).toHaveBeenCalledTimes(1);
  });

  it('cherche par l’adresse du compte, jamais par celle du profil, que le lecteur peut réécrire', async () => {
    const { client, valeurs } = clientQuiNote({ adresse: 'lectrice@exemple.test' });

    await deleteUserCompletely(client, LECTRICE, 'autre.personne@exemple.test', 'Lectrice', ADMIN);

    expect(valeurs['newsletter_subscribers.email']).toEqual(['lectrice@exemple.test']);
  });

  it('un compte sans adresse (connexion par téléphone) : rien n’est cherché par adresse, rien n’est signalé', async () => {
    const { client, ordre } = clientQuiNote({ adresse: null });

    await deleteUserCompletely(client, LECTRICE, '', 'Lectrice', ADMIN);

    expect(ordre).toContain('auth.getUserById');
    expect(ordre).not.toContain('delete:newsletter_subscribers.email');
    expect(ordre).toContain('auth.deleteUser');
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('un compte illisible est signalé par son code seul, sans recherche par adresse ni arrêt de la suppression', async () => {
    const { client, ordre } = clientQuiNote({ lectureEchoue: true });

    await deleteUserCompletely(client, LECTRICE, 'lectrice@exemple.test', 'Lectrice', ADMIN);

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'unexpected_failure' }),
      expect.objectContaining({ extra: { userId: LECTRICE, etape: 'lecture-du-compte', code: 'unexpected_failure' } }),
    );
    expect(JSON.stringify(vi.mocked(Sentry.captureException).mock.calls)).not.toMatch(/lectrice@exemple\.test|panne/i);
    expect(ordre).not.toContain('delete:newsletter_subscribers.email');
    expect(ordre).toContain('auth.deleteUser');
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
