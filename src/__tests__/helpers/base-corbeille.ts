import { readFileSync } from 'node:fs';
import { PGlite, type PGliteInterface } from '@electric-sql/pglite';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Un vrai PostgreSQL pour tester la corbeille : PGlite, c'est-à-dire
 * PostgreSQL 17 compilé en WebAssembly, qui tourne dans le processus des
 * tests, sans serveur ni réseau.
 *
 * La base de chaque test reçoit la réplique du schéma de production
 * (sql/replique-production.sql), puis la VRAIE migration 00032, appliquée par
 * le rôle « proprietaire » qui tient la place de « postgres » en production :
 * non superutilisateur, avec BYPASSRLS. Les fonctions de la corbeille lui
 * appartiennent, comme en production, et SECURITY DEFINER s'exécute donc avec
 * des droits réalistes, pas avec ceux d'un superutilisateur.
 *
 * Ce que PGlite ne sait pas faire : deux sessions en même temps. Les verrous
 * (FOR UPDATE, FOR KEY SHARE) s'y posent sans jamais rien bloquer ; ils sont
 * éprouvés à part, sur un serveur PostgreSQL 17 réel.
 */

export const REPLIQUE = readFileSync(new URL('../sql/replique-production.sql', import.meta.url), 'utf8');
export const MIGRATION = readFileSync(
  new URL('../../../supabase/migrations/00032_corbeille_contenus.sql', import.meta.url),
  'utf8',
);

export type Role = 'anon' | 'authenticated' | 'service_role';

/** Une base de test : la base modèle ou l'un de ses clones. */
export type Base = PGliteInterface;

/** La réplique, sans la migration : l'état de la production aujourd'hui. */
export async function baseSansCorbeille(): Promise<PGlite> {
  const db = await PGlite.create();
  await db.exec(REPLIQUE);
  return db;
}

/** La migration, appliquée comme en production : par le propriétaire des tables. */
export async function appliquerMigration(db: Base): Promise<void> {
  await db.exec('SET ROLE proprietaire');
  try {
    await db.exec(MIGRATION);
  } catch (erreur) {
    // La transaction ouverte par BEGIN est interrompue : la refermer, comme le
    // fait la fin de session en production, pour que la base reste utilisable.
    await db.exec('ROLLBACK');
    throw erreur;
  } finally {
    await db.exec('RESET ROLE');
  }
}

/** La base modèle, clonée pour chaque test : un clone coûte quelques dizaines de millisecondes. */
export async function baseModele(): Promise<PGlite> {
  const db = await baseSansCorbeille();
  await appliquerMigration(db);
  return db;
}

export async function cloner(modele: PGlite): Promise<Base> {
  const db = await modele.clone();
  // Le fuseau de la production (UTC), pas celui de la machine qui lance les tests.
  await db.exec("SET TimeZone = 'UTC'");
  return db;
}

/** Exécute sous un rôle de l'API, comme PostgREST le fait pour chaque requête. */
export async function commeRole<T>(db: Base, role: Role, travail: () => Promise<T>): Promise<T> {
  await db.exec(`SET ROLE ${role}`);
  try {
    return await travail();
  } finally {
    await db.exec('RESET ROLE');
  }
}

export interface ErreurPostgres {
  code: string;
  message: string;
  detail?: string;
}

/** L'erreur levée par la requête, ou un échec du test si elle a réussi. */
export async function erreurDe(promesse: Promise<unknown>): Promise<ErreurPostgres> {
  try {
    await promesse;
  } catch (erreur) {
    const e = erreur as { code?: string; message?: string; detail?: string };
    return { code: e.code ?? '', message: e.message ?? '', detail: e.detail };
  }
  throw new Error('la requête devait échouer, elle a réussi');
}

const FONCTIONS_EXPOSEES = new Set([
  'corbeille_mettre',
  'corbeille_restaurer',
  'corbeille_retirer_lecteur',
  'corbeille_purger',
]);

/**
 * Le client de service tel que le code le voit, branché sur la base de test :
 * chaque appel rpc() passe par le rôle service_role, en une transaction, et
 * une erreur revient sous la forme que PostgREST lui donne
 * ({ code, message, details, hint }). C'est ce contrat que les enveloppes de
 * src/lib/corbeille lisent.
 */
export function clientDeService(db: Base): SupabaseClient {
  const rpc = async (fonction: string, args: Record<string, unknown>) => {
    if (!FONCTIONS_EXPOSEES.has(fonction)) throw new Error(`fonction non prévue : ${fonction}`);
    const noms = Object.keys(args);
    const appel = `SELECT public.${fonction}(${noms.map((nom, i) => `${nom} => $${i + 1}`).join(', ')}) AS resultat`;
    try {
      const reponse = await commeRole(db, 'service_role', () =>
        db.query<{ resultat: unknown }>(appel, noms.map((nom) => args[nom])),
      );
      return { data: reponse.rows[0]?.resultat ?? null, error: null };
    } catch (erreur) {
      const e = erreur as { code?: string; message?: string; detail?: string; hint?: string };
      return {
        data: null,
        error: { code: e.code ?? '', message: e.message ?? '', details: e.detail ?? null, hint: e.hint ?? null },
      };
    }
  };
  return { rpc } as unknown as SupabaseClient;
}

/** Des identifiants lisibles : uuid(12) = 00000000-0000-4000-8000-000000000012. */
export const uuid = (n: number): string => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
