import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

/**
 * La migration 00034 du journal, rejouée telle quelle sur un vrai PostgreSQL
 * (PGlite). La table reproduit les clés de la production relevées le
 * 24/11/2026 : admin_id NOT NULL, une clé vers auth.users et une vers
 * user_profiles, toutes deux sans ON DELETE.
 */

const MIGRATION = readFileSync(
  new URL('../../supabase/migrations/00034_journal_actions_du_systeme.sql', import.meta.url),
  'utf8',
);
const ADMIN = '11111111-1111-4111-8111-111111111111';
const SENTINELLE = '00000000-0000-0000-0000-000000000000';

let db: PGlite;

beforeEach(async () => {
  db = await PGlite.create();
  await db.exec(`
    create schema auth;
    create table auth.users (id uuid primary key);
    create table public.user_profiles (
      id uuid primary key references auth.users(id) on delete cascade,
      role text not null default 'reader'
    );
    create table public.audit_log (
      id uuid primary key default gen_random_uuid(),
      admin_id uuid not null,
      action text not null,
      entity_type text not null,
      entity_id text,
      details jsonb,
      created_at timestamptz not null default now(),
      constraint audit_log_admin_id_fkey foreign key (admin_id) references auth.users(id),
      constraint audit_log_admin_profile_fkey foreign key (admin_id) references public.user_profiles(id)
    );
    insert into auth.users (id) values ('${ADMIN}');
    insert into public.user_profiles (id, role) values ('${ADMIN}', 'admin');
  `);
});

afterEach(async () => {
  await db.close();
});

/** Le code d'erreur PostgreSQL d'une requête, ou null si elle passe. */
async function codeDe(requete: Promise<unknown>): Promise<string | null> {
  try {
    await requete;
    return null;
  } catch (erreur) {
    return (erreur as { code?: string }).code ?? 'sans code';
  }
}

describe('migration 00034 : le journal accepte les actions du système', () => {
  it('avant : la base refuse la sentinelle du système comme une ligne sans auteur', async () => {
    const inserer = `insert into public.audit_log (admin_id, action, entity_type) values ($1, 'subscription_expired', 'user')`;
    expect(await codeDe(db.query(inserer, [SENTINELLE]))).toBe('23503');
    expect(await codeDe(db.query(inserer, [null]))).toBe('23502');
  });

  it('après : une action du système s’écrit sans auteur et marquée, une action d’admin reste attribuée', async () => {
    await db.exec(MIGRATION);
    await db.query(
      `insert into public.audit_log (admin_id, par_le_systeme, action, entity_type) values (null, true, 'ipaymoney_payment_verified', 'payment')`,
    );
    await db.query(`insert into public.audit_log (admin_id, action, entity_type) values ($1, 'verify_payment', 'payment')`, [ADMIN]);

    const lignes = await db.query<{ admin_id: string | null; par_le_systeme: boolean; action: string }>(
      'select admin_id, par_le_systeme, action from public.audit_log order by action',
    );
    expect(lignes.rows).toEqual([
      { admin_id: null, par_le_systeme: true, action: 'ipaymoney_payment_verified' },
      { admin_id: ADMIN, par_le_systeme: false, action: 'verify_payment' },
    ]);
  });

  it('après : supprimer un admin qui a écrit dans le journal n’est plus bloqué, ses lignes restent sans auteur', async () => {
    await db.query(`insert into public.audit_log (admin_id, action, entity_type) values ($1, 'change_role', 'user')`, [ADMIN]);
    expect(await codeDe(db.query('delete from auth.users where id = $1', [ADMIN]))).toBe('23503');

    await db.exec(MIGRATION);
    await db.query('delete from public.user_profiles where id = $1', [ADMIN]);
    await db.query('delete from auth.users where id = $1', [ADMIN]);

    const lignes = await db.query('select admin_id, par_le_systeme, action from public.audit_log');
    expect(lignes.rows).toEqual([{ admin_id: null, par_le_systeme: false, action: 'change_role' }]);
  });

  it('après : les deux clés gardent leur nom, que la route du journal utilise pour joindre l’auteur', async () => {
    await db.exec(MIGRATION);
    const cles = await db.query<{ conname: string; def: string }>(
      `select conname, pg_get_constraintdef(oid) as def from pg_constraint
       where conrelid = 'public.audit_log'::regclass and contype = 'f' order by conname`,
    );
    expect(cles.rows).toEqual([
      { conname: 'audit_log_admin_id_fkey', def: 'FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL' },
      { conname: 'audit_log_admin_profile_fkey', def: 'FOREIGN KEY (admin_id) REFERENCES user_profiles(id) ON DELETE SET NULL' },
    ]);
  });
});
