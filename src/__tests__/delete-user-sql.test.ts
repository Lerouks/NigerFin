import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import type { SupabaseClient } from '@supabase/supabase-js';
import { baseModele, clientDeService, cloner, commeRole, uuid, type Base } from './helpers/base-corbeille';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: (fn: unknown) => fn }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }));
vi.mock('@/lib/audit', () => ({ logAuditEvent: vi.fn(async () => undefined), SYSTEM_AUDIT_ID: '00000000-0000-0000-0000-000000000000' }));
vi.mock('@/lib/email', () => ({ sendTransactionalEmail: vi.fn(async () => undefined) }));
vi.mock('@/lib/supabase', () => ({ createServiceClient: vi.fn(() => null), createServerSupabaseClient: vi.fn(async () => null) }));

import * as Sentry from '@sentry/nextjs';
import { deleteUserCompletely } from '@/lib/delete-user';
import { normalizeEmail } from '@/lib/validation';

/**
 * La suppression d'un compte, de bout en bout, sur un vrai PostgreSQL
 * (PGlite) avec la réplique du schéma de production et la migration 00032.
 * Le courriel envoyé au lecteur promet que « toutes vos données personnelles
 * ont été effacées » : ce test vérifie ce qu'il en reste dans les tables que
 * la réplique reproduit.
 */

const ADMIN = uuid(1);
const LECTRICE = uuid(2);
const LECTEUR = uuid(3);
const CATEGORIE = uuid(100);
const LECON = uuid(110);
const ARTICLE = uuid(200);
const COURRIEL = 'lectrice@exemple.test';

let modele: PGlite;
let db: Base;

beforeAll(async () => {
  modele = await baseModele();
  await modele.exec(`
    insert into auth.users (id, email) values ('${ADMIN}', 'admin@exemple.test'), ('${LECTRICE}', '${COURRIEL}'), ('${LECTEUR}', 'lecteur@exemple.test');
    insert into public.education_categories (id, slug, title) values ('${CATEGORIE}', 'bourse', 'Bourse');
    insert into public.education_lessons (id, category_id, title) values ('${LECON}', '${CATEGORIE}', 'Le PER');
    insert into public.user_lesson_progress (user_id, lesson_id, quiz_score) values ('${LECTRICE}', '${LECON}', 80), ('${LECTEUR}', '${LECON}', 60);
    insert into public.articles (id, title, slug, category) values ('${ARTICLE}', 'Le franc CFA', 'franc-cfa', 'economie');
    insert into public.comments (id, article_id, user_id, user_name, content) values
      ('${uuid(210)}', '${ARTICLE}', '${LECTRICE}', 'Lectrice', 'Très clair'),
      ('${uuid(211)}', '${ARTICLE}', '${LECTEUR}', 'Lecteur', 'Merci');
    insert into public.article_likes (id, article_id, user_id) values ('${uuid(220)}', '${ARTICLE}', '${LECTRICE}');
    insert into public.newsletter_subscribers (id, email, user_id) values
      ('${uuid(510)}', '${COURRIEL}', '${LECTRICE}'),
      ('${uuid(511)}', 'lecteur@exemple.test', '${LECTEUR}');
  `);
}, 120_000);

beforeEach(async () => {
  db = await cloner(modele);
  vi.clearAllMocks();
});

afterEach(async () => {
  await db.close();
});

/**
 * Le client de service tel que deleteUserCompletely s'en sert, branché sur la
 * base de test : from(table).delete().eq(colonne, valeur), une égalité exacte
 * comme le filtre eq de PostgREST, rpc(), auth.admin.getUserById() et
 * auth.admin.deleteUser(). Une table absente de la réplique répond comme
 * PostgREST (42P01), et le code doit le supporter.
 */
function clientDeSuppression(base: Base, nonConfirmes: string[] = []): SupabaseClient {
  const service = clientDeService(base);
  const from = (table: string) => ({
    delete: () => ({
      eq: async (colonne: string, valeur: string) => {
        if (!/^[a-z_]+$/.test(table) || !/^[a-z_]+$/.test(colonne)) throw new Error('nom refusé');
        const existe = await base.query<{ t: string | null }>('select to_regclass($1)::text as t', [`public.${table}`]);
        if (!existe.rows[0]?.t) return { error: { code: '42P01', message: `relation "public.${table}" does not exist` } };
        try {
          await commeRole(base, 'service_role', () => base.query(`delete from public.${table} where ${colonne}::text = $1`, [valeur]));
          return { error: null };
        } catch (erreur) {
          const e = erreur as { code?: string; message?: string };
          return { error: { code: e.code ?? '', message: e.message ?? '' } };
        }
      },
    }),
  });
  // La réplique d'auth.users n'a pas email_confirmed_at : un compte est confirmé
  // sauf s'il figure dans nonConfirmes, comme une inscription jamais validée.
  const getUserById = async (id: string) => {
    const lu = await base.query<{ email: string | null }>('select email from auth.users where id = $1', [id]);
    const compte = lu.rows[0];
    if (!compte) return { data: { user: null }, error: { status: 404, code: 'user_not_found', message: 'User not found' } };
    const email_confirmed_at = nonConfirmes.includes(id) ? undefined : '2026-07-01T10:00:00Z';
    return { data: { user: { id, email: compte.email ?? undefined, email_confirmed_at } }, error: null };
  };
  const deleteUser = async (id: string) => {
    await base.query('delete from auth.users where id = $1', [id]);
    return { error: null };
  };
  return { rpc: service.rpc.bind(service), from, auth: { admin: { getUserById, deleteUser } } } as unknown as SupabaseClient;
}

async function compter(sql: string, params: unknown[] = []): Promise<number> {
  return Number((await db.query<{ n: number | string }>(sql, params)).rows[0]?.n ?? 0);
}

describe('la suppression d’un compte, sur la vraie base', () => {
  it('n’en laisse rien : ni abonnement à la newsletter, ni copie dans la corbeille, ni commentaire, ni j’aime', async () => {
    await commeRole(db, 'service_role', () => db.query(`select public.corbeille_mettre('education_lessons', '${LECON}', '${ADMIN}')`));

    await deleteUserCompletely(clientDeSuppression(db), LECTRICE, COURRIEL, 'Lectrice', ADMIN);

    expect(await compter('select count(*) as n from public.newsletter_subscribers where email = $1', [COURRIEL])).toBe(0);
    expect(await compter('select count(*) as n from public.contenus_supprimes where $1::uuid = any (lecteurs)', [LECTRICE])).toBe(0);
    expect(await compter('select count(*) as n from public.contenus_supprimes where dependants::text like $1', [`%${LECTRICE}%`])).toBe(0);
    expect(await compter('select count(*) as n from public.comments where user_id = $1', [LECTRICE])).toBe(0);
    expect(await compter('select count(*) as n from public.article_likes where user_id = $1', [LECTRICE])).toBe(0);
    expect(await compter('select count(*) as n from auth.users where id = $1', [LECTRICE])).toBe(0);
    // Les autres lecteurs ne perdent rien.
    expect(await compter("select count(*) as n from public.newsletter_subscribers where email = 'lecteur@exemple.test'")).toBe(1);
    expect(await compter('select count(*) as n from public.comments where user_id = $1', [LECTEUR])).toBe(1);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('F15 : inscrite sur la liste d’attente avant de créer son compte, sans user_id, son adresse part aussi ; une adresse voisine reste', async () => {
    const COMPTE = uuid(4);
    const ADRESSE = 'pre_lancement@exemple.test';
    // Un seul caractère diffère, là où « _ » servirait de joker à like ou ilike.
    const VOISINE = 'preXlancement@exemple.test';
    await db.exec(`insert into auth.users (id, email) values ('${COMPTE}', '${ADRESSE}');
      insert into public.newsletter_subscribers (id, email, source, user_id) values
        ('${uuid(512)}', '${ADRESSE}', 'prelaunch', null),
        ('${uuid(513)}', '${VOISINE}', 'prelaunch', null);`);

    await deleteUserCompletely(clientDeSuppression(db), COMPTE, ADRESSE, 'Lectrice', COMPTE);

    expect(await compter('select count(*) as n from public.newsletter_subscribers where email = $1', [ADRESSE])).toBe(0);
    expect(await compter('select count(*) as n from public.newsletter_subscribers where email = $1', [VOISINE])).toBe(1);
    expect(await compter('select count(*) as n from auth.users where id = $1', [COMPTE])).toBe(0);
    // Les autres abonnés ne perdent rien.
    expect(await compter('select count(*) as n from public.newsletter_subscribers')).toBe(3);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('l’adresse du compte est comparée sous la forme enregistrée, et celle du profil, que le lecteur peut réécrire, ne compte pas', async () => {
    const COMPTE = uuid(4);
    // Les inscriptions écrivent l'adresse par normalizeEmail, comme upsertNewsletterSubscriber.
    const ENREGISTREE = normalizeEmail('Pre_Lancement@Exemple.TEST');
    await db.exec(`insert into auth.users (id, email) values ('${COMPTE}', 'Pre_Lancement@Exemple.TEST');
      insert into public.newsletter_subscribers (id, email, source, user_id) values
        ('${uuid(512)}', '${ENREGISTREE}', 'form', null),
        ('${uuid(514)}', 'victime@exemple.test', 'form', null);`);

    // Un profil dont l'adresse a été réécrite pour celle d'une autre personne.
    await deleteUserCompletely(clientDeSuppression(db), COMPTE, 'victime@exemple.test', 'Lecteur', COMPTE);

    expect(ENREGISTREE).toBe('pre_lancement@exemple.test');
    expect(await compter('select count(*) as n from public.newsletter_subscribers where email = $1', [ENREGISTREE])).toBe(0);
    expect(await compter("select count(*) as n from public.newsletter_subscribers where email = 'victime@exemple.test'")).toBe(1);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('un compte jamais confirmé qui porte l’adresse d’une abonnée : le compte part, l’abonnement de l’abonnée reste', async () => {
    const COMPTE = uuid(4);
    const VICTIME = 'victime@exemple.test';
    await db.exec(`insert into auth.users (id, email) values ('${COMPTE}', '${VICTIME}');
      insert into public.newsletter_subscribers (id, email, source, user_id) values
        ('${uuid(515)}', '${VICTIME}', 'form', null);`);

    await deleteUserCompletely(clientDeSuppression(db, [COMPTE]), COMPTE, VICTIME, 'Inconnu', COMPTE);

    expect(await compter('select count(*) as n from auth.users where id = $1', [COMPTE])).toBe(0);
    expect(await compter('select count(*) as n from public.newsletter_subscribers where email = $1', [VICTIME])).toBe(1);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('l’ordre compte : le compte supprimé d’abord, la base viderait user_id et l’adresse survivrait', async () => {
    await db.query('delete from auth.users where id = $1', [LECTRICE]);

    const reste = await db.query<{ user_id: string | null }>('select user_id from public.newsletter_subscribers where email = $1', [COURRIEL]);

    expect(reste.rows).toEqual([{ user_id: null }]);
  });
});
